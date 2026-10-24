#!/usr/bin/env node
// Kiểm TĨNH ranh giới cổng (AGENTS.md luật 5, 6, 9): đo TRẠNG THÁI cây mã, không đo diff.
//   - Căn giá tốt (SPL tầng A) chỉ ở /ops/deals, không ở Invest;
//   - khối liên hệ/nội dung/ảnh tin ở /ops/deals chỉ cho admin, nguồn hiện bằng mã S0x;
//   - /api/zalo-media chặn admin trước khi đọc file;
//   - /dau-tu không đọc bảng AirDNA, không hiện chữ AirDNA;
//   - /api/zalo-media chỉ mở hai gốc staging ảnh (+ media/ của raw snapshot qua snapshot+file),
//     so theo đoạn đường dẫn + realpath;
//   - canAccessOps đóng mặc định (role admin|ops hoặc OPS_EMAILS) — chạy thật hàm;
//   - /api/v1/deals đang tạm đóng: cổng ops chạy trước truy vấn (check-deals-api.mjs);
//   - mọi route API khớp sổ bề mặt app/src/lib/api-surface.ts (check-api-surface.mjs).
//   - bản khai công cụ MCP app/docs/api/mcp-tools.json khớp chế độ sổ bề mặt (check-mcp-tools.mjs).
// Dùng: node scripts/check-portal-compliance.mjs  (exit 0 = đạt, 1 = vi phạm)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = (p) => path.join(root, "app", p);
// Thiếu file → chuỗi rỗng: kiểm báo FAIL có tên thay vì văng lỗi.
const read = (p) => (existsSync(app(p)) ? readFileSync(app(p), "utf8") : "");
// Bỏ comment để chỉ đo mã/chữ thật sự render (chú thích được nhắc AirDNA để giải thích luật).
const code = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const { checkOpsTierA } = await import("./check-ops-tier-a.mjs");
function opsTierA(r) {
  const { files, hits, positive } = checkOpsTierA({ root: r });
  for (const h of hits) check(false, `ops ngoài /ops/sources: tên nguồn thật (${h.code}) ở chữ hiển thị ${h.file}:${h.line}`);
  check(hits.length === 0, `ops ngoài /ops/sources: chữ hiển thị chỉ mã S0x (${hits.length} chỗ trúng trong ${files.length} tệp)`);
  check(positive >= 1, `đối chứng dương: bộ quét thấy tên thật ở components/ops/sources/ (${positive} chỗ)`);
}
// `--only ops-tier-a --root <dir>`: chỉ chạy mục 12 trên một cây khác (ca chiều đỏ của scripts/ops-nhan-ma-nguon.test.mjs).
const [flag, only, ...rest] = process.argv.slice(2);
if (flag === "--only" && only === "ops-tier-a") {
  const i = rest.indexOf("--root");
  opsTierA(i >= 0 ? path.resolve(rest[i + 1]) : root);
  console.log(fails.length === 0 ? "\nportal-compliance: ĐẠT" : `\nportal-compliance: ${fails.length} vi phạm`);
  process.exit(fails.length === 0 ? 0 : 1);
}

// 1. Route: không còn /deals trong Invest; /ops/deals tồn tại.
check(!existsSync(app("src/app/(app)/deals")), "không còn route Invest src/app/(app)/deals");
check(existsSync(app("src/app/ops/deals/page.tsx")), "có route src/app/ops/deals/page.tsx");

// 2. Nav: Invest không có mục deals; Ops có /ops/deals.
const nav = code(read("src/components/shell/nav.tsx"));
const investBlock = nav.slice(nav.indexOf("invest: ["), nav.indexOf("ops: ["));
const opsBlock = nav.slice(nav.indexOf("ops: ["));
check(investBlock.length > 0 && !/deals/.test(investBlock), "nav Invest không có mục deals");
check(/href: "\/ops\/deals"/.test(opsBlock), "nav Ops có href /ops/deals");

// 3. Link cũ /deals chuyển sang /ops/deals (proxy.ts chặn tiếp /ops).
const nextCfg = code(readFileSync(app("next.config.ts"), "utf8"));
check(
  /source:\s*"\/deals",\s*destination:\s*"\/ops\/deals"/.test(nextCfg),
  "next.config redirect /deals → /ops/deals",
);

// 4. /ops/deals: liên hệ + nội dung + ảnh tin chỉ khi showContact = isAdmin(user). Thẻ tách ở
//    components/ops/deal-card.tsx (ON11) — trang phải truyền đúng showContact xuống thẻ, và đo trên cả hai tệp.
const dealsPage = code(read("src/app/ops/deals/page.tsx"));
const deals = `${dealsPage}\n${code(read("src/components/ops/deal-card.tsx"))}`;
check(/const showContact = isAdmin\(user\)/.test(dealsPage), "ops/deals tính showContact từ isAdmin(user)");
check(/<DealCard\b[^>]*\bshowContact=\{showContact\}/.test(dealsPage), "ops/deals truyền showContact xuống DealCard");
for (const [label, re] of [
  ["khối SĐT/tên người bán", /\{showContact && \(d\.sellerPhone \|\| d\.sellerName\)/],
  ["nội dung tin", /\{showContact && d\.postText/],
  ["ảnh tin", /\{showContact && \(d\.mediaPath \|\| d\.mediaUrl\)/],
]) {
  check(re.test(deals), `ops/deals: ${label} chỉ render khi showContact`);
}
check((deals.match(/showContact &&/g) ?? []).length >= 3, "ops/deals: có đủ 3 khối gate tầng A");

// 5. Ops chỉ dùng mã tầng B — không literal tên nguồn thật trong chữ hiển thị.
const realNames = /\b(Zalo|Facebook|Chợ Tốt|Chotot|AirDNA)\b/;
const dealsLeaks = deals.split("\n").filter((l) => realNames.test(l) && !/zalo-media/.test(l));
check(dealsLeaks.length === 0, `ops/deals: không tên nguồn thật trong mã render (${dealsLeaks.length} dòng)`);

// 6. /api/zalo-media: gate admin ĐỨNG TRƯỚC mọi đọc file. Route chỉ chuyển phiên cho lõi
//    `lib/ops/zalo-media.ts`; mọi đọc đĩa nằm trong sendImage (không export), chỉ gọi sau gate.
const mediaRoute = code(read("src/app/api/zalo-media/route.ts"));
const media = code(read("src/lib/ops/zalo-media.ts"));
const serve = media.slice(media.indexOf("export async function serveZaloMedia"));
const gateAt = serve.indexOf("if (!isAdmin(user)) return");
const sendAt = serve.indexOf("sendImage(");
check(
  /serveZaloMedia\(req, await getSessionUser\(\)\)/.test(mediaRoute) &&
    !/readFile|realpath|stat\(/.test(mediaRoute) &&
    !/export async function sendImage/.test(media) &&
    gateAt >= 0 && sendAt > gateAt &&
    media.indexOf("await stat(") > media.indexOf("async function sendImage"),
  "zalo-media: isAdmin chặn trước stat/readFile",
);

// 7. /dau-tu: không bảng AirDNA, không chữ AirDNA/tên nguồn thật ở Invest.
const invest = code(read("src/lib/invest.ts"));
check(!/airdna_|area_sources/i.test(invest), "lib/invest.ts không đọc airdna_* / crosswalk S02");
for (const f of [
  "src/app/(app)/[country]/[market]/dau-tu/page.tsx",
  "src/components/invest/investment-simulator.tsx",
  "src/lib/invest.ts",
]) {
  const leaks = code(read(f)).split("\n").filter((l) => realNames.test(l));
  check(leaks.length === 0, `${f}: không tên AirDNA/nguồn thật trong mã render (${leaks.length} dòng)`);
}
check(/listing_stats/.test(invest) && /booked90/.test(invest), "lib/invest.ts lấy STR từ listing_stats (90 đêm)");

// 8. /api/zalo-media: chế độ path chỉ hai gốc staging ảnh, không cả ~/.openclaw; gốc raw
//    snapshots chỉ qua chế độ snapshot+file và chỉ thư mục media/; không so tiền tố chuỗi.
const roots = media.slice(media.indexOf("function openclawRoots"), media.indexOf("];", media.indexOf("function openclawRoots")));
check(
  // đúng hai phần tử, không phần tử nào là ~/.openclaw trơn
  /return \[path\.join\(home, "\.openclaw", "media"\), "\/tmp\/openclaw"$/.test(roots.trim()) &&
    (serve.match(/sendImage\(/g) ?? []).length === 2 &&
    /sendImage\(path\.resolve\(p\), openclawRoots\(\), false\)/.test(serve) &&
    /sendImage\(joined, \[snapshotsRoot\(\)\], true\)/.test(serve),
  "zalo-media: ALLOWED_ROOTS đúng hai gốc ~/.openclaw/media + /tmp/openclaw",
);
check(!/(resolved|real|prefix)\.startsWith\(/.test(media), "zalo-media: không so tiền tố chuỗi trên path (startsWith)");
check(/path\.relative\(/.test(media) && /await realpath\(resolved\)/.test(media), "zalo-media: so bằng path.relative trên cả path chữ lẫn realpath");

// 9. canAccessOps: đóng mặc định — chạy thật hàm (Node bỏ kiểu TS khi import).
const { canAccessOps } = await import(app("src/lib/ops-access.ts"));
const u = (role, email = "a@x.test") => ({ id: "t", email, plan: "free", role });
const withEnv = (v, fn) => {
  const old = process.env.OPS_EMAILS;
  if (v === undefined) delete process.env.OPS_EMAILS;
  else process.env.OPS_EMAILS = v;
  try {
    return fn();
  } finally {
    if (old === undefined) delete process.env.OPS_EMAILS;
    else process.env.OPS_EMAILS = old;
  }
};
for (const [env, user, want, label] of [
  [undefined, null, false, "khách"],
  [undefined, u("user"), false, "user thường, OPS_EMAILS trống"],
  ["", u("user"), false, "user thường, OPS_EMAILS rỗng"],
  [undefined, u("ops"), true, "role=ops, OPS_EMAILS trống"],
  [undefined, u("admin"), true, "role=admin, OPS_EMAILS trống"],
  ["b@x.test", u("admin"), true, "role=admin, không có trong OPS_EMAILS"],
  [" A@X.test , b@x.test", u("user"), true, "user thường có email trong OPS_EMAILS (không phân biệt hoa thường)"],
  ["b@x.test", u("user"), false, "user thường, email ngoài OPS_EMAILS"],
]) {
  const got = withEnv(env, () => canAccessOps(user));
  check(got === want, `canAccessOps(${label}) = ${want}`);
}

// 10. /api/v1/deals tạm đóng (deals-api-tam-dong): cổng ops có await, trả 401, đứng trước pool.query.
const { checkDealsRoute } = await import("./check-deals-api.mjs");
const dealsApi = checkDealsRoute(read("src/app/api/v1/deals/route.ts"));
check(dealsApi.ok, dealsApi.msg);

// 11. Sổ bề mặt API (so-be-mat-api): mọi route khai đúng một dòng, cổng khớp chế độ, route public không đọc sale_offers.
const { checkApiSurface, loadEntries, loadFiles } = await import("./check-api-surface.mjs");
const surface = checkApiSurface({ entries: await loadEntries(), files: loadFiles() });
for (const v of surface.violations) check(false, `sổ bề mặt API: ${v}`);
check(surface.violations.length === 0, `sổ bề mặt API: ${surface.routes}/${surface.declared} route khớp sổ (đường + phương thức)`);

// 12. Ops ngoài /ops/sources chỉ dùng mã S0x trong chữ hiển thị (ops-nhan-ma-nguon, ON7).
opsTierA(root);

// 13. Bản khai công cụ MCP (mcp-tools-theo-so-be-mat, ON15): mỗi công cụ trỏ route có trong sổ, chế độ khai = chế độ sổ.
const { checkMcpTools, loadManifest } = await import("./check-mcp-tools.mjs");
const mcp = checkMcpTools({ entries: await loadEntries(), manifest: loadManifest(root) });
for (const v of mcp.violations) check(false, `công cụ MCP: ${v}`);
check(mcp.violations.length === 0 && mcp.tools > 0, `công cụ MCP: ${mcp.lines.length}/${mcp.tools} công cụ khớp sổ bề mặt`);

console.log(fails.length === 0 ? "\nportal-compliance: ĐẠT" : `\nportal-compliance: ${fails.length} vi phạm`);
process.exit(fails.length === 0 ? 0 : 1);
