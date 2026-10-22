#!/usr/bin/env node
// Kiểm TĨNH ranh giới cổng (AGENTS.md luật 5, 6, 9): đo TRẠNG THÁI cây mã, không đo diff.
//   - Căn giá tốt (SPL tầng A) chỉ ở /ops/deals, không ở Invest;
//   - khối liên hệ/nội dung/ảnh tin ở /ops/deals chỉ cho admin, nguồn hiện bằng mã S0x;
//   - /api/zalo-media chặn admin trước khi đọc file;
//   - /dau-tu không đọc bảng AirDNA, không hiện chữ AirDNA.
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

// 4. /ops/deals: liên hệ + nội dung + ảnh tin chỉ khi showContact = isAdmin(user).
const deals = code(read("src/app/ops/deals/page.tsx"));
check(/const showContact = isAdmin\(user\)/.test(deals), "ops/deals tính showContact từ isAdmin(user)");
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

// 6. /api/zalo-media: gate admin ĐỨNG TRƯỚC mọi đọc file.
const media = code(read("src/app/api/zalo-media/route.ts"));
const gateAt = media.indexOf("isAdmin(await getSessionUser())");
const readAt = media.indexOf("await stat(");
check(gateAt > 0 && readAt > gateAt, "zalo-media: isAdmin chặn trước stat/readFile");

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

console.log(fails.length === 0 ? "\nportal-compliance: ĐẠT" : `\nportal-compliance: ${fails.length} vi phạm`);
process.exit(fails.length === 0 ? 0 : 1);
