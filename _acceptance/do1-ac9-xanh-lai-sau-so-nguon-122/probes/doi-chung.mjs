#!/usr/bin/env node
// doi-chung.mjs — AC-2, AC-3 của do1-ac9-xanh-lai-sau-so-nguon-122. Chạy dưới `db/db-thu.sh oneinvest_suite_<bộ> --chay`
// (DB của riêng lượt chép từ máy thu, đã có 122 nên sổ có dòng S09). Ba lượt của ĐÚNG ca «DO1-AC-9 detail …», theo thứ tự:
//   B  bản tệp test ở origin/main (ON CONFLICT DO NOTHING)        → phải ĐỎ với «không chặn TEN_THAT_V»
//   C  bản sửa, bộ soát tên nguồn của do-hang-ngay bị gỡ (bản chép) → phải ĐỎ với «không chặn TEN_THAT_V»
//   D  bản sửa, sau khi XOÁ dòng S09 khỏi sổ của DB lượt này        → phải XANH (1 ca, 0 bỏ qua)
// Bản chép tạm nằm cạnh tệp thật (để import tương đối giữ nguyên) và luôn bị xoá ở finally.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB)) { console.log("KHONG CO DB CUA LUOT (oneinvest_suite_*)"); process.exit(2); }
const CA = "^DO1-AC-9 detail";
const tam = [];
const chay = (tep) => {
  const r = spawnSync(process.execPath, ["--test", `--test-name-pattern=${CA}`, tep], { cwd: PIPE, encoding: "utf8", env: process.env });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  const so = (k) => Number(out.match(new RegExp(`ℹ ${k} (\\d+)`))?.[1] ?? -1);
  return { code: r.status, out, tests: so("tests"), pass: so("pass"), fail: so("fail"), skipped: so("skipped") };
};
const ghiTam = (rel, noiDung) => { const p = path.join(PIPE, rel); writeFileSync(p, noiDung); tam.push(p); return rel; };
let loi = 0;
const ket = (ten, dat, r) => { console.log(`${dat ? "OK " : "LOI"} ${ten}: exit ${r.code}, tests ${r.tests}, pass ${r.pass}, fail ${r.fail}, skipped ${r.skipped}`); if (!dat) loi++; };
try {
  // B — bản main.
  const main = execFileSync("git", ["-C", ROOT, "show", "origin/main:pipeline/scripts/do-hang-ngay.test.mjs"], { encoding: "utf8" });
  const b = chay(ghiTam("scripts/do-hang-ngay-main.tmp.test.mjs", main));
  ket("B ban main do", b.code !== 0 && b.fail === 1 && b.out.includes("không chặn TEN_THAT_V"), b);
  // C — gỡ bộ soát tên nguồn trên bản chép của lib.
  const lib = readFileSync(path.join(PIPE, "lib/do-hang-ngay.mjs"), "utf8");
  const dong = '  if (ten.length && guardValues([s], ten).length) return "TEN NGUON";';
  if (!lib.includes(dong)) { console.log("KHUON DOT BIEN LECH MA NGUON"); process.exit(3); }
  ghiTam("lib/do-hang-ngay.dotbien.tmp.mjs", lib.replace(dong, '  if (false) return "TEN NGUON";'));
  const test = readFileSync(path.join(PIPE, "scripts/do-hang-ngay.test.mjs"), "utf8");
  if (!test.includes('from "../lib/do-hang-ngay.mjs"')) { console.log("KHUON IMPORT LECH"); process.exit(3); }
  const c = chay(ghiTam("scripts/do-hang-ngay-dotbien.tmp.test.mjs", test.replace('from "../lib/do-hang-ngay.mjs"', 'from "../lib/do-hang-ngay.dotbien.tmp.mjs"')));
  ket("C go bo soat do", c.code !== 0 && c.fail === 1 && c.out.includes("không chặn TEN_THAT_V"), c);
  // D — sổ KHÔNG có dòng S09 (xoá trên DB của riêng lượt).
  const pg = createRequire(path.join(PIPE, "package.json"))("pg");
  const cl = new pg.Client({ connectionString: DB });
  await cl.connect();
  const { rowCount } = await cl.query("DELETE FROM source_registry WHERE code = 'S09'");
  await cl.end();
  console.log(`so cua luot: xoa ${rowCount} dong S09`);
  const d = chay("scripts/do-hang-ngay.test.mjs");
  ket("D ban sua xanh khi so khong co S09", d.code === 0 && d.tests === 1 && d.pass === 1 && d.skipped === 0, d);
} finally {
  for (const p of tam) rmSync(p, { force: true });
}
if (loi) { console.log(`DOI-CHUNG DO (${loi})`); process.exit(1); }
console.log("DOI-CHUNG OK");
