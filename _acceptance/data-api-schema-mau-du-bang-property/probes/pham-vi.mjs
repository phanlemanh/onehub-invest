#!/usr/bin/env node
// pham-vi.mjs — PB8 AC-4 (eval E4): mọi tệp đổi so origin/main nằm trong ranh giới; _acceptance/config.yaml chỉ thêm khoá
// dapi_smp*; không tệp nào dưới data-api/src đổi. Chiều đỏ cùng lượt: cấy một tệp data-api/src vào danh sách tệp, cấy
// một khoá config lạ — mỗi ô phải ra đúng thông điệp ghim. Thoát 0 khi sạch và hai ô đỏ đúng; 1 khi có vi phạm hay ô không đỏ.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const CHO = [
  /^data-api\/db\/schema\.sql$/,
  /^data-api\/seed\.sql$/,
  /^_acceptance\/data-api-schema-mau-du-bang-property\//,
  /^_acceptance\/config\.yaml$/, // soát từng dòng ở soatConfig
  /^PRODUCT-MAP\.md$/,
  /^LO-TRINH\.html$/,
];
export const soatTep = (ds) => ds.filter((f) => !CHO.some((r) => r.test(f))).map((f) => `PB8 NGOÀI PHẠM VI: ${f}`);
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (!/^[+-]/.test(d) || /^(\+\+\+|---)/.test(d)) continue;
    if (d.startsWith("-")) { loi.push("PB8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (/^\+\s*(#.*)?$/.test(d)) continue;
    const m = /^\+\s+([A-Za-z0-9_]+):/.exec(d);
    if (!m || !/^dapi_smp[a-z0-9_]*$/.test(m[1])) loi.push(`PB8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}

const nen = git("merge-base", "HEAD", "origin/main").trim(); // phạm vi của chính nhánh
const tep = [...new Set([
  ...git("diff", "--name-only", nen).split("\n"),
  ...git("ls-files", "--others", "--exclude-standard").split("\n"),
].filter(Boolean))];
const diffConfig = git("diff", "-U0", nen, "--", "_acceptance/config.yaml");
const loi = [...soatTep(tep), ...soatConfig(diffConfig)];

const o = {
  "pha-tep": soatTep([...tep, "data-api/src/routes/price-stats.ts"]).includes("PB8 NGOÀI PHẠM VI: data-api/src/routes/price-stats.ts"),
  "pha-config": soatConfig(`+    khoa_la: "echo"\n+    dapi_smp_x: "echo"`).join("|") === "PB8 NGOÀI PHẠM VI: _acceptance/config.yaml khoá khoa_la",
};
const hong = Object.entries(o).filter(([, d]) => !d).map(([k]) => k);
if (hong.length) { console.log(`pham-vi: thước không đỏ ở ${hong.join(", ")}`); process.exit(1); }
console.log(`chieu-do: ${Object.keys(o).join(", ")} — hai ô cấy đều ra đúng`);
if (loi.length) {
  for (const l of loi) console.log(l);
  console.log(`pham-vi: ${loi.length} vi phạm`);
  process.exit(1);
}
console.log(`pham-vi: nền ${nen.slice(0, 9)}; ${tep.length} tệp đổi so origin/main, đều trong ranh giới; data-api/src không đổi`);
