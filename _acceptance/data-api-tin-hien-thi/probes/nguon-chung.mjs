#!/usr/bin/env node
// nguon-chung.mjs — PB7 AC-1, AC-2, AC-8 (vế do-s03; eval E1, E2, E10): danh sách nguồn ẩn một nguồn chung.
//  sổ     : nguon_khong_hien_thi của pipeline/mappings.yaml khai S02, S08, mỗi mục có căn cứ; bốn đích mã mang SOURCE_HIDDEN khớp
//           sổ; `vocab --check` thoát 0. Chiều đỏ: bản chép tạm, sửa tay SOURCE_HIDDEN của đích data-api → --check đỏ gọi tên tệp;
//           mục sổ thiếu căn cứ → «PB7 nguồn ẩn thiếu căn cứ».
//  tay    : không tệp mã nguồn nào (app/src, data-api/src, agent/src, pipeline, scripts — trừ tệp sinh, sổ, và ngoại lệ có tên
//           dưới) viết tay nhóm S02 cùng S08; app và data-api nhập SOURCE_HIDDEN từ tệp sinh. Chiều đỏ: chữ cấy.
//  do-s03 : do-s03-len-cong.mjs đọc danh sách từ pipeline/lib/vocab.generated.mjs — dieuKienVisible() (đầu ra thật, không DB)
//           chứa điều kiện nguồn S02, S08; không còn đọc chữ OFFER_HIDDEN_SOURCES của app. Chiều đỏ: nguonAn([]) ném có tên.
// Ô không đỏ đúng → thoát 1 «nguon-chung: thước không đỏ ở <ô>»; vi phạm thật → thoát 1 kèm dòng lỗi.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const vc = await import(pathToFileURL(path.join(ROOT, "pipeline", "lib", "vocab-core.mjs")).href);
const SO = readFileSync(path.join(ROOT, "pipeline", "mappings.yaml"), "utf8");
const DICH = ["pipeline/lib/vocab.generated.mjs", "agent/src/vocab.generated.ts", "app/src/lib/vocab.generated.ts", "data-api/src/contract/vocab.generated.ts"];
const loi = [];
let saiO = 0;
const oDo = (ten, dat) => { if (!dat) { console.log(`nguon-chung: thước không đỏ ở ${ten}`); saiO++; } };

// ── sổ ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const reg = vc.loadRegister(SO);
vc.validateRegister(reg);
const ma = reg.sourceHidden.map((x) => x.code);
if (JSON.stringify(ma) !== JSON.stringify(["S02", "S08"])) loi.push(`PB7 sổ nguồn ẩn lệch: ${ma.join(",")}`);
for (const p of DICH) {
  const t = readFileSync(path.join(ROOT, p), "utf8");
  if (!/export const SOURCE_HIDDEN = (Object\.freeze\()?\["S02", "S08"\]/.test(t)) loi.push(`PB7 tệp sinh thiếu SOURCE_HIDDEN khớp sổ: ${p}`);
}
const chk = spawnSync(process.execPath, [path.join(ROOT, "pipeline", "vocab.mjs"), "--root", ROOT, "--check"], { encoding: "utf8" });
if (chk.status !== 0) loi.push(`PB7 vocab --check đỏ: ${(chk.stderr || chk.stdout).trim()}`);
{
  // chiều đỏ: bản chép tối thiểu của kho cho vocab.mjs (sổ + CONTEXT.md + năm đích), sửa tay đích data-api
  const g = mkdtempSync(path.join(os.tmpdir(), "pb7-nc-"));
  try {
    for (const p of ["pipeline/mappings.yaml", "CONTEXT.md", ...DICH]) {
      mkdirSync(path.dirname(path.join(g, p)), { recursive: true });
      cpSync(path.join(ROOT, p), path.join(g, p));
    }
    const f = path.join(g, DICH[3]);
    writeFileSync(f, readFileSync(f, "utf8").replace('["S02", "S08"]', '["S02"]'));
    const r = spawnSync(process.execPath, [path.join(ROOT, "pipeline", "vocab.mjs"), "--root", g, "--check"], { encoding: "utf8" });
    oDo("so-sua-tay-dich", r.status !== 0 && r.stderr.includes(DICH[3]));
  } finally {
    rmSync(g, { recursive: true, force: true });
  }
  let nem = "";
  try { vc.validateRegister(vc.loadRegister(SO.replace(/(\n  - code: S08\n)    can_cu: [^\n]*\n/, "$1"))); } catch (e) { nem = e.message; }
  oDo("so-thieu-can-cu", /PB7 nguồn ẩn thiếu căn cứ/.test(nem));
}
console.log(`nguon-chung: sổ khai ${ma.length} nguồn ẩn (${ma.join(", ")}) ở nguon_khong_hien_thi, mỗi mục có căn cứ; ${DICH.length} tệp sinh mang SOURCE_HIDDEN khớp sổ; vocab --check thoát ${chk.status}`);

// ── tay ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const NHOM = /["']S0[28]["']\s*,\s*["']S0[28]["']/;
// Ngoại lệ có tên: test của chính sổ từ vựng (đối chứng giá trị sổ) và itest đồng bộ người bán (đo dữ liệu thật của hồ sơ
// khác, không phải luật chạy) — không phải chỗ quyết nguồn nào hiện.
const NGOAI_LE = new Set(["pipeline/scripts/vocab.test.mjs", "pipeline/scripts/sync-nguoi-ban-that.itest.mjs"]);
const BO = new Set(["node_modules", "dist", ".next", "coverage"]);
function tep(rel, ra = []) {
  for (const n of readdirSync(path.join(ROOT, rel))) {
    if (BO.has(n) || n.startsWith(".")) continue;
    const con = path.posix.join(rel, n);
    if (statSync(path.join(ROOT, con)).isDirectory()) tep(con, ra);
    else if (/\.(m?js|cjs|tsx?|sql|sh)$/.test(n) && !n.startsWith("vocab.generated")) ra.push(con);
  }
  return ra;
}
const quet = (ds, doc) => ds.filter((f) => !NGOAI_LE.has(f) && NHOM.test(doc(f))).map((f) => `PB7 danh sách nguồn ẩn viết tay: ${f}`);
const ds = ["app/src", "data-api/src", "agent/src", "pipeline", "scripts"].flatMap((d) => tep(d));
const docThat = (f) => readFileSync(path.join(ROOT, f), "utf8");
loi.push(...quet(ds, docThat));
const nhap = (f, rel) => new RegExp(`import \\{[^}]*\\bSOURCE_HIDDEN\\b[^}]*\\} from "${rel.replace(/\./g, "\\.")}"`).test(docThat(f));
if (!nhap("app/src/lib/offers-filters.ts", "./vocab.generated") || !/OFFER_HIDDEN_SOURCES = SOURCE_HIDDEN;/.test(docThat("app/src/lib/offers-filters.ts"))) loi.push("PB7 app không lấy nguồn ẩn từ tệp sinh");
if (!nhap("data-api/src/routes/listings.ts", "../contract/vocab.generated.js")) loi.push("PB7 data-api không lấy nguồn ẩn từ tệp sinh");
// chiều đỏ
oDo("tay-cay-literal", quet(["data-api/src/routes/listings.ts"], (f) => `${docThat(f)}\nconst x = ["S02", "S08"];\n`).includes("PB7 danh sách nguồn ẩn viết tay: data-api/src/routes/listings.ts"));
oDo("tay-doi-chung-duong", ds.length > 100);
console.log(`nguon-chung: soát ${ds.length} tệp mã nguồn, ${quet(ds, docThat).length} danh sách nguồn ẩn viết tay (ngoại lệ có tên: ${[...NGOAI_LE].join(", ")}); OFFER_HIDDEN_SOURCES và điều kiện nguồn data-api nhập SOURCE_HIDDEN từ tệp sinh`);

// ── do-s03 ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const tepS03 = "pipeline/scripts/do-s03-len-cong.mjs";
  const chu = docThat(tepS03);
  if (!/import \{ SOURCE_HIDDEN \} from "\.\.\/lib\/vocab\.generated\.mjs"/.test(chu)) loi.push("PB7 do-s03 không nhập SOURCE_HIDDEN từ tệp sinh");
  if (/OFFER_HIDDEN_SOURCES = \\\[/.test(chu)) loi.push("PB7 do-s03 còn đọc tệp app");
  // Đầu ra thật của bộ đọc VISIBLE: chạy trong tiến trình con (module nhập pg, transform) — không cần DB.
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", `
    const m = await import(${JSON.stringify(pathToFileURL(path.join(ROOT, tepS03)).href)});
    let nem = ""; try { m.nguonAn([]); } catch (e) { nem = e.message; }
    console.log("KQ " + JSON.stringify({ an: m.nguonAn(), dk: m.dieuKienVisible(), nem }));
  `], { cwd: path.join(ROOT, "pipeline"), encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1:1/pb7" } });
  const dong = (r.stdout ?? "").split("\n").find((l) => l.startsWith("KQ "));
  if (!dong) loi.push(`PB7 do-s03 không chạy được: ${(r.stderr ?? "").split("\n").slice(-3).join(" | ")}`);
  else {
    const k = JSON.parse(dong.slice(3));
    console.log(`nguồn ẩn: ${k.an.replaceAll("'", "")}`);
    if (k.an !== "'S02', 'S08'") loi.push(`PB7 do-s03 đọc sai danh sách nguồn ẩn: ${k.an}`);
    if (!k.dk.includes("o.source <> ALL(ARRAY['S02', 'S08'])")) loi.push("PB7 do-s03 điều kiện VISIBLE thiếu nguồn ẩn");
    oDo("do-s03", k.nem === "SL1: không đọc được danh sách nguồn ẩn");
  }
}

if (saiO) process.exit(1);
if (loi.length) { for (const l of loi) console.log(l); console.log(`nguon-chung: ${loi.length} vi phạm`); process.exit(1); }
console.log("nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng");
