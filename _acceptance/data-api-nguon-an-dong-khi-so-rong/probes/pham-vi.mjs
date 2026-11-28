#!/usr/bin/env node
// pham-vi.mjs — PB10 AC-5 (b)(c)(d) (eval E6): (b) mọi tệp đổi so origin/main nằm trong ranh giới; (c) không danh sách
// nguồn ẩn viết tay trong data-api/src (mảng chuỗi chứa cả "S02" lẫn "S08"); (d) /openapi.json (app.ts) và README ghi mã
// đóng HIDDEN_SOURCES_NOT_CONFIGURED cho /v1/listings; typecheck data-api thoát 0.
// Chiều đỏ cùng lượt: cấy pipeline/lib/x.mjs vào danh sách tệp; cấy mảng ["S02", "S08"] vào bản chép chữ listings.ts; bỏ
// dòng 503 khỏi bản chép chữ README — mỗi ô ra đúng thông điệp ghim. Thoát 0 sạch; 1 có vi phạm hay ô không đỏ.
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });
const SLUG = "data-api-nguon-an-dong-khi-so-rong";
const CHO = [
  /^data-api\//,
  new RegExp(`^_acceptance/${SLUG}/`),
  /^_acceptance\/config\.yaml$/, // soát từng dòng ở soatConfig
  /^docs\/superpowers\/(specs|plans)\/2026-11-28-data-api-nguon-an-dong-khi-so-rong(-design)?\.md$/,
  /^PRODUCT-MAP\.md$/,
  /^LO-TRINH\.html$/,
];
const MA_DONG = "HIDDEN_SOURCES_NOT_CONFIGURED";

export const soatTep = (ds) => ds.filter((f) => !CHO.some((r) => r.test(f))).map((f) => `PB10 NGOÀI PHẠM VI: ${f}`);
export function soatConfig(diff) {
  const loi = [];
  for (const d of diff.split("\n")) {
    if (!/^[+-]/.test(d) || /^(\+\+\+|---)/.test(d)) continue;
    if (d.startsWith("-")) { loi.push("PB10 NGOÀI PHẠM VI: _acceptance/config.yaml khoá «dòng bị xoá»"); continue; }
    if (/^\+\s*(#.*)?$/.test(d)) continue;
    const m = /^\+\s+([A-Za-z0-9_]+):/.exec(d);
    if (!m || !/^dapi_nad[a-z0-9_]*$/.test(m[1])) loi.push(`PB10 NGOÀI PHẠM VI: _acceptance/config.yaml khoá ${m ? m[1] : "«không đọc được»"}`);
  }
  return loi;
}
/** Mảng chuỗi literal chứa cả "S02" lẫn "S08" (bỏ chú thích) — danh sách nguồn ẩn viết tay. */
export function vietTay(noi) {
  const bo = noi.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  return [...bo.matchAll(/\[[^\]\n]*\]/g)].some((m) => /["'`]S02["'`]/.test(m[0]) && /["'`]S08["'`]/.test(m[0]));
}
export const docThieu = (readme, appTs) => [
  ...(readme.includes(MA_DONG) && /503/.test(readme) ? [] : ["PB10 tài liệu thiếu mã đóng: data-api/README.md"]),
  ...((appTs.match(new RegExp(MA_DONG, "g")) ?? []).length >= 2 ? [] : ["PB10 tài liệu thiếu mã đóng: data-api/src/app.ts (openapi)"]),
];
function moiTep(d) {
  const ra = [];
  for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) ra.push(...moiTep(p)); else if (/\.(ts|js|mjs)$/.test(n)) ra.push(p); }
  return ra;
}

const nen = git("merge-base", "HEAD", "origin/main").trim(); // phạm vi của chính nhánh
const tep = [...new Set([...git("diff", "--name-only", nen).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean))];
const loi = [...soatTep(tep), ...soatConfig(git("diff", "-U0", nen, "--", "_acceptance/config.yaml"))];
for (const f of moiTep(path.join(ROOT, "data-api", "src"))) {
  if (/vocab\.generated\.ts$/.test(f)) continue; // tệp sinh — nguồn duy nhất của danh sách
  if (vietTay(readFileSync(f, "utf8"))) loi.push(`PB10 danh sách nguồn ẩn viết tay: ${path.relative(ROOT, f)}`);
}
const readme = readFileSync(path.join(ROOT, "data-api", "README.md"), "utf8");
const appTs = readFileSync(path.join(ROOT, "data-api", "src", "app.ts"), "utf8");
loi.push(...docThieu(readme, appTs));
const tsc = spawnSync("npx", ["tsc", "-p", "tsconfig.json", "--noEmit"], { cwd: path.join(ROOT, "data-api"), encoding: "utf8" });
if (tsc.status !== 0) loi.push(`PB10 typecheck data-api đỏ: ${(tsc.stdout || tsc.stderr).split("\n")[0]}`);

const listings = readFileSync(path.join(ROOT, "data-api", "src", "routes", "listings.ts"), "utf8");
const o = {
  "pha-tep": soatTep([...tep, "pipeline/lib/x.mjs"]).includes("PB10 NGOÀI PHẠM VI: pipeline/lib/x.mjs"),
  "pha-tay": !vietTay(listings) && vietTay(`${listings}\nconst _an = ["S02", "S08"];\n`),
  "pha-doc": docThieu(readme.split("\n").filter((l) => !l.includes(MA_DONG)).join("\n"), appTs).includes("PB10 tài liệu thiếu mã đóng: data-api/README.md"),
};
const hong = Object.entries(o).filter(([, d]) => !d).map(([k]) => k);
if (hong.length) { console.log(`pham-vi: thước không đỏ ở ${hong.join(", ")}`); process.exit(1); }
console.log(`chieu-do: ${Object.keys(o).join(", ")} — ba ô cấy đều ra đúng`);
if (loi.length) { for (const l of loi) console.log(l); console.log(`pham-vi: ${loi.length} vi phạm`); process.exit(1); }
console.log(`pham-vi: nền ${nen.slice(0, 9)}; ${tep.length} tệp đổi, đều trong ranh giới; openapi + README ghi 503 ${MA_DONG}; không danh sách nguồn ẩn viết tay; typecheck data-api thoát 0`);
