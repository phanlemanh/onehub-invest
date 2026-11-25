#!/usr/bin/env node
// pham-vi.mjs — phạm vi và tên nguồn thật của HT19 (AC-7 phần máy, AC-8; eval E8, E10).
//  1. Mọi tệp nhánh đổi so với merge-base với origin/main nằm trong ranh giới lời giao gs-2411-1.
//  2. _acceptance/config.yaml chỉ THÊM khoá `dapi_drl*`, không xoá dòng nào.
//  3. Phần thêm của diff dưới data-api/ không có tên nguồn thật (rút từ db/migrations bằng scripts/lib/tier-a-source-names.mjs),
//     trừ dạng định danh có `_` liền kề (tên bảng) — cùng ngoại lệ với scripts/check-invest-tier-a.mjs.
//  4. Toàn văn data-api/README.md và data-api/CLAUDE.md không có tên nguồn thật ngoài dạng định danh.
// Thước tự chứng chiều đỏ trong cùng lượt (năm ô cấy). Báo vi phạm bằng mã S0x, KHÔNG in tên.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const { sourceRegistrySeeds, findSourceNames } = await import(path.join(ROOT, "scripts", "lib", "tier-a-source-names.mjs"));
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const SLUG = "data-api-dong-ba-route-lo";
const DUOC = [
  /^data-api\/src\/routes\/(deals|coverage|listings)\.ts$/,
  /^data-api\/test\//,
  /^data-api\/(README|CLAUDE)\.md$/,
  new RegExp(`^_acceptance/${SLUG}/`),
  /^_acceptance\/config\.yaml$/, // riêng tệp này còn soát từng dòng (soatConfig)
  /^(PRODUCT-MAP\.md|LO-TRINH\.html)$/, // máy sinh, lệnh duyệt và ký của kit vẽ lại
  /^app\/tests\/(can-gia-cung-loai-db|hang-gia-doc|gia-tot-du-an-doc)\.test\.tsx$/, // riêng ba tệp này còn soát từng dòng (soatTestApp)
];
// Ba test của app import data-api/src/routes/deals.ts và ghim khoá cũ của /v1/deals (gs cho phép ở m5-2411-10).
const TEST_APP = ["app/tests/can-gia-cung-loai-db.test.tsx", "app/tests/hang-gia-doc.test.tsx", "app/tests/gia-tot-du-an-doc.test.tsx"];
const TAI_LIEU = ["data-api/README.md", "data-api/CLAUDE.md"];

/** Tệp ngoài ranh giới → dòng vi phạm. */
export function soatTep(tep) {
  return tep.filter((t) => !DUOC.some((re) => re.test(t))).map((t) => `AC-8 NGOÀI PHẠM VI: ${t}`);
}
/** Diff -U0 của config.yaml: chỉ được thêm dòng khoá `dapi_drl*` (hoặc dòng trống, dòng chú thích nhắc slug). */
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (/^(\+\+\+|---|@@|diff |index )/.test(d) || d === "") continue;
    if (d.startsWith("-")) { loi.push("AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (!d.startsWith("+")) continue;
    const than = d.slice(1);
    if (than.trim() === "" || /^\s*#.*data-api-dong-ba-route-lo/.test(than)) continue;
    const m = /^\s+([A-Za-z0-9_]+):\s/.exec(than);
    if (!m || !/^dapi_drl[a-z0-9_]*$/.test(m[1])) loi.push(`AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}
/** Diff -U0 của ba test app: chỉ được bỏ hai khoá `contact`, `postText` khỏi danh sách khoá cũ. Mỗi cặp dòng xoá/thêm trong
 *  một khúc phải là cùng dòng sau khi gỡ mọi mục mang hai khoá đó; không được thêm dòng, không được xoá dòng không mang chúng. */
export function soatTestApp(diff) {
  const loi = [];
  // Chuẩn hoá: bỏ khoảng trắng, gỡ mục mang hai khoá (dạng mảng cặp hay dạng khoá: giá trị), rồi gom dấu phẩy thừa.
  const bo = (d) => d.replace(/\s+/g, "")
    .replace(/\["(contact|postText)",\[[^\]]*\]\]/g, "").replace(/\["(contact|postText)",[^\][]*\]/g, "")
    .replace(/(contact|postText):(\[[^\]]*\]|"[^"]*")/g, "")
    .replace(/,+/g, ",").replace(/,([\]}])/g, "$1").replace(/([[{]),/g, "$1").replace(/,$/, "");
  let tep = "?", xoa = [], them = [];
  const chot = () => {
    if (!xoa.length && !them.length) return;
    if (them.length > xoa.length) loi.push(`AC-8 NGOÀI PHẠM VI: ${tep} thêm dòng mới`);
    for (const d of xoa) if (!/\b(contact|postText)\b/.test(d)) loi.push(`AC-8 NGOÀI PHẠM VI: ${tep} xoá dòng không mang contact, postText`);
    for (const d of them) if (/\b(contact|postText)\b/.test(d)) loi.push(`AC-8 NGOÀI PHẠM VI: ${tep} dòng thêm còn contact, postText`);
    const a = xoa.map(bo).join(""), b = them.map(bo).join("");
    if (a !== b) loi.push(`AC-8 NGOÀI PHẠM VI: ${tep} đổi ngoài hai khoá contact, postText`);
    xoa = []; them = [];
  };
  for (const d of diff.split("\n")) {
    if (d.startsWith("+++ ")) { chot(); tep = d.slice(6); continue; }
    if (/^(---|diff |index )/.test(d)) { chot(); continue; }
    if (d.startsWith("@@")) { chot(); continue; }
    if (d.startsWith("-")) xoa.push(d.slice(1));
    else if (d.startsWith("+")) them.push(d.slice(1));
  }
  chot();
  return [...new Set(loi)];
}
/** Mã nguồn của mọi tên thật đứng trần trong văn bản (bỏ dạng định danh có `_` liền kề). */
export function tenTran(vanBan, ten) {
  const ma = new Set();
  for (const dong of vanBan.split("\n")) {
    for (const h of findSourceNames(dong, ten)) {
      if (dong[h.start - 1] === "_" || dong[h.end] === "_") continue;
      ma.add(h.code);
    }
  }
  return [...ma].sort();
}

let ten;
try {
  ten = sourceRegistrySeeds(ROOT).map((e) => ({ code: e.code, realName: e.realName }));
} catch (e) {
  console.log(`pham-vi: không rút được tên nguồn nào (${e.message})`);
  process.exit(2);
}
if (ten.length < 1) { console.log("pham-vi: không rút được tên nguồn nào"); process.exit(2); }

const goc = git("merge-base", "HEAD", "origin/main").trim();
// Tệp đã commit trên nhánh + tệp đang sửa dở (tệp chưa theo dõi không thuộc nhánh nên không tính).
const tep = [...new Set(git("diff", "--name-only", goc).split("\n").filter(Boolean))].sort();
const themDataApi = git("diff", "-U0", goc, "--", "data-api").split("\n").filter((d) => d.startsWith("+") && !d.startsWith("+++")).map((d) => d.slice(1)).join("\n");
const diffConfig = git("diff", "-U0", goc, "--", "_acceptance/config.yaml");
const diffTestApp = git("diff", "-U0", goc, "--", ...TEST_APP);

const loi = [
  ...soatTep(tep),
  ...soatConfig(diffConfig),
  ...soatTestApp(diffTestApp),
  ...tenTran(themDataApi, ten).map((m) => `AC-8 tên nguồn thật trong diff: ${m}`),
];
const loiTaiLieu = [];
for (const t of TAI_LIEU) for (const m of tenTran(readFileSync(path.join(ROOT, t), "utf8"), ten)) loiTaiLieu.push(`AC-7 tên nguồn thật: ${m} (${t})`);

// ── Chiều đỏ: cùng các hàm trên, đầu vào cấy ─────────────────────────────────────────────────────────────────────
const don = ten.find((e) => /^[A-Za-z0-9]{5,}$/.test(e.realName)) ?? ten[0]; // một tên một từ để dựng dạng định danh
const o = {
  "pha-tep": soatTep([...tep, "data-api/seed.sql"]).includes("AC-8 NGOÀI PHẠM VI: data-api/seed.sql"),
  "pha-ten": tenTran(`const nguon = "${don.realName}";`, ten).includes(don.code),
  "dinh-danh": tenTran(`SELECT 1 FROM ${don.realName.toLowerCase()}_listings`, ten).length === 0,
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_drl_x: "echo"`).join("|") === "AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
  "pha-app": soatTestApp(`+++ b/${TEST_APP[0]}\n@@ -1 +1 @@\n-  confidence: ["string"], contact: ["object", "null"],\n+  confidence: ["number"],\n`).includes(`AC-8 NGOÀI PHẠM VI: ${TEST_APP[0]} đổi ngoài hai khoá contact, postText`)
    && soatTestApp(`+++ b/${TEST_APP[1]}\n@@ -1,0 +2 @@\n+  assert.ok(true);\n`).includes(`AC-8 NGOÀI PHẠM VI: ${TEST_APP[1]} thêm dòng mới`)
    && soatTestApp(`+++ b/${TEST_APP[2]}\n@@ -1 +1 @@\n-  ["nReposts", SO], ["contact", ["object", "null"]]];\n+  ["nReposts", SO]];\n`).length === 0,
  "pha-docs": tenTran(`${readFileSync(path.join(ROOT, TAI_LIEU[0]), "utf8")}\nNguồn: ${don.realName}\n`, ten).includes(don.code),
};
for (const [ten_o, dat] of Object.entries(o)) {
  if (!dat) { console.log(`pham-vi: thước không đỏ ở ${ten_o}`); process.exit(1); }
}
console.log(`chieu-do: ${Object.keys(o).join(", ")} — sáu ô cấy đều ra đúng (pha-tep → «AC-8 NGOÀI PHẠM VI: data-api/seed.sql», pha-ten → «AC-8 tên nguồn thật trong diff: ${don.code}», dinh-danh → không tính, pha-config → «AC-8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la», pha-app → đổi ngoài hai khoá và thêm dòng đều bị bắt, bỏ đúng hai khoá thì không, pha-docs → «AC-7 tên nguồn thật: ${don.code}»)`);

if (loi.length || loiTaiLieu.length) {
  for (const l of [...loi, ...loiTaiLieu]) console.log(l);
  console.log(`pham-vi: ${loi.length + loiTaiLieu.length} vi phạm`);
  process.exit(1);
}
console.log(`tai-lieu: README.md, CLAUDE.md quét toàn văn, 0 tên nguồn thật ngoài dạng định danh`);
console.log(`pham-vi: ${tep.length} tệp đổi, đều trong ranh giới; không đổi data-api/db, data-api/seed.sql, pipeline/, db/; app/ chỉ ba test và chỉ bỏ contact, postText; soát ${ten.length} tên nguồn thật (k ≥ 1, từ sourceRegistrySeeds), 0 khớp ngoài dạng định danh`);
