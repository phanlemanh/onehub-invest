#!/usr/bin/env node
// pham-vi.mjs — PB9 AC-3 (eval E3): mọi tệp đổi so origin/main nằm trong ranh giới; _acceptance/config.yaml chỉ thêm khoá
// dapi_psn*; listing-reso.test.ts không gọi merge-base. Chiều đỏ cùng lượt: cấy một tệp data-api/src vào danh sách tệp, cấy
// một khoá config lạ — mỗi ô phải ra đúng thông điệp ghim. Thoát 0 khi sạch và hai ô đỏ đúng; 1 khi có vi phạm hay ô không đỏ.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const CHO = [
  /^data-api\/test\/listing-reso\.test\.ts$/,
  /^_acceptance\/data-api-price-stats-so-nen-co-dinh\//,
  /^_acceptance\/config\.yaml$/, // soát từng dòng ở soatConfig
  /^PRODUCT-MAP\.md$/,
  /^LO-TRINH\.html$/,
];
export const soatTep = (ds) => ds.filter((f) => !CHO.some((r) => r.test(f))).map((f) => `PB9 NGOÀI PHẠM VI: ${f}`);
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (!/^[+-]/.test(d) || /^(\+\+\+|---)/.test(d)) continue;
    if (d.startsWith("-")) { loi.push("PB9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (/^\+\s*(#.*)?$/.test(d)) continue;
    const m = /^\+\s+([A-Za-z0-9_]+):/.exec(d);
    if (!m || !/^dapi_psn[a-z0-9_]*$/.test(m[1])) loi.push(`PB9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}

const nen = git("merge-base", "HEAD", "origin/main").trim(); // phạm vi của chính nhánh — không phải mốc so của AC-11
const tep = [...new Set([
  ...git("diff", "--name-only", nen).split("\n"),
  ...git("ls-files", "--others", "--exclude-standard").split("\n"),
].filter(Boolean))];
const diffConfig = git("diff", "-U0", nen, "--", "_acceptance/config.yaml");
const testNoi = readFileSync(path.join(ROOT, "data-api/test/listing-reso.test.ts"), "utf8");
const loi = [...soatTep(tep), ...soatConfig(diffConfig)];
if (/["']merge-base["']/.test(testNoi)) loi.push("PB9 listing-reso.test.ts còn gọi merge-base");

const o = {
  "pha-tep": soatTep([...tep, "data-api/src/routes/price-stats.ts"]).includes("PB9 NGOÀI PHẠM VI: data-api/src/routes/price-stats.ts"),
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_psn_x: "echo"`).join("|") === "PB9 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
};
const hong = Object.entries(o).filter(([, d]) => !d).map(([k]) => k);
if (hong.length) { console.log(`pham-vi: thước không đỏ ở ${hong.join(", ")}`); process.exit(1); }
console.log(`chieu-do: ${Object.keys(o).join(", ")} — hai ô cấy đều ra đúng`);
if (loi.length) {
  for (const l of loi) console.log(l);
  console.log(`pham-vi: ${loi.length} vi phạm`);
  process.exit(1);
}
console.log(`pham-vi: nền ${nen.slice(0, 9)}; ${tep.length} tệp đổi so origin/main, đều trong ranh giới; listing-reso.test.ts không gọi merge-base`);
