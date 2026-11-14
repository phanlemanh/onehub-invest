#!/usr/bin/env node
// tap-nhan-hai-khu-ranh-gioi.mjs — hồ sơ tap-nhan-ghep-tin-hai-khu (PL35) E7b (AC-7, quét tĩnh) và E10 (AC-10, ranh giới diff).
//   node pipeline/scripts/tap-nhan-hai-khu-ranh-gioi.mjs --base origin/main [--them-gia]
// E7b: label-sample.mjs, label-nhap-ghep.mjs, lib/tang-ghep.mjs và mọi tệp trong pipeline/ mà chúng import TĨNH (bắc cầu) không chứa
//   field_assertions, UniversalPropertyId, UniversalPropertySubId, và không import mã gắn của PL20 (MA_PL20). Import động không
//   theo: label-sample.mjs chỉ nạp transform-zalo.mjs động cho lát phân tầng loại tin — đường chạy hai khu không chạm nó; E7 (thu
//   quyền DB lúc chạy) phủ lệnh thật. Đối chứng: cây tạm có tệp giả import tệp chứa field_assertions → đếm 1, nêu tên tệp.
// E10: diff <base>...HEAD không đổi db/migrations/, pipeline/sync-cloud.mjs, app/; không dòng thêm, thông điệp, tác giả hay tên tệp
//   nào chứa tên nguồn thật (đọc source_registry của DB máy thu, chỉ đọc; rỗng → thoát 2; chỉ in số). Định danh lược đồ có sẵn bỏ
//   khỏi dòng trước khi dò; tệp máy sinh không quét chữ. Đối chứng: thêm một tệp giả dưới db/migrations/ thì đếm 1 (--them-gia: thoát 1).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import pg from "pg";

const GOC = join(import.meta.dirname, "../..");
const arg = (t, m) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const BASE = arg("--base", "origin/main");
const DICH_E7B = ["pipeline/label-sample.mjs", "pipeline/label-nhap-ghep.mjs", "pipeline/lib/tang-ghep.mjs"];
const CAM_CHU = /field_assertions|UniversalPropertyId|UniversalPropertySubId/;
/** Mã gắn tin vào danh bạ (bộ được PL20 đo) và mã ghi phát biểu: không tệp nào trong vùng quét được import. */
const MA_PL20 = [/(^|\/)resolve-properties\.mjs$/, /(^|\/)danh-ba-vat-the\.mjs$/, /(^|\/)lib\/assert\.mjs$/, /ghep-tin-vao-danh-muc/];
const MAY_SINH = new Set(["PRODUCT-MAP.md", "LO-TRINH.html"]);

/** Quét bắc cầu theo import tĩnh tương đối. Trả tệp vi phạm (đường tương đối với goc) kèm lý do. */
export function quetTinh(goc, dich) {
  const da = new Set(), viPham = [];
  const hang = dich.map((f) => resolve(goc, f));
  while (hang.length) {
    const f = hang.pop();
    if (da.has(f) || !existsSync(f)) continue;
    da.add(f);
    const rel = relative(goc, f);
    const chu = readFileSync(f, "utf8");
    if (CAM_CHU.test(chu)) viPham.push({ tep: rel, ly_do: chu.match(CAM_CHU)[0] });
    // Chỉ dòng import/export … from "./…" ở đầu dòng (import tĩnh); import("…") động không theo.
    for (const m of chu.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+["'](\.{1,2}\/[^"']+)["']/gms)) {
      const toi = resolve(dirname(f), m[1]);
      const relToi = relative(goc, toi);
      if (MA_PL20.some((re) => re.test(relToi))) viPham.push({ tep: rel, ly_do: `import ${relToi}` });
      hang.push(toi);
    }
  }
  return { so_tep: da.size, viPham };
}

const kq = {};
// ---- E7b ----
const e7b = quetTinh(GOC, DICH_E7B);
kq.quet_tep = e7b.so_tep;
kq.doc_pl20 = e7b.viPham.length;
for (const v of e7b.viPham) console.error(`E7b vi phạm: ${v.tep} — ${v.ly_do}`);
{
  const tam = mkdtempSync(join(tmpdir(), "pl35-e7b-"));
  writeFileSync(join(tam, "a.mjs"), 'import { x } from "./b.mjs";\nexport const y = x;\n');
  writeFileSync(join(tam, "b.mjs"), 'export const x = "SELECT 1 FROM field_assertions";\n');
  const g = quetTinh(tam, ["a.mjs"]);
  if (g.viPham.length !== 1 || g.viPham[0].tep !== "b.mjs") { console.error("bộ quét E7b hỏng — đối chứng không bắt tệp giả"); process.exit(2); }
  console.log(`doi_chung_e7b=ok (tệp giả ${g.viPham[0].tep} đếm 1)`);
}

// ---- E10 ----
const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const tep = git("diff", "--name-only", `${BASE}...HEAD`).split("\n").filter(Boolean);
if (process.argv.includes("--them-gia")) tep.push("db/migrations/999_gia.sql");
const demRanh = (ds) => ({
  migration_doi: ds.filter((f) => /^db\/migrations\//.test(f)).length,
  sync_cloud_doi: ds.filter((f) => f === "pipeline/sync-cloud.mjs").length,
  app_doi: ds.filter((f) => /^app\//.test(f)).length,
});
Object.assign(kq, { tep: tep.length }, demRanh(tep));
if (demRanh([...tep, "db/migrations/999_gia.sql"]).migration_doi !== kq.migration_doi + 1) { console.error("bộ đếm migration hỏng"); process.exit(2); }
console.log("doi_chung_migration=ok");

const may = new pg.Client({ connectionString: process.env.PL35_MAY_THU ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await may.connect();
await may.query("SET default_transaction_read_only = on");
const { rows } = await may.query("SELECT real_name, source_ids FROM source_registry");
const { rows: dd } = await may.query(`SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public'
                                       UNION SELECT column_name FROM information_schema.columns WHERE table_schema = 'public'`);
await may.end();
const ten = new Set();
for (const r of rows) for (const t of [r.real_name, ...(Array.isArray(r.source_ids) ? r.source_ids : [])]) {
  const s = String(t ?? "").trim().toLowerCase();
  if (s.length >= 4) ten.add(s);
}
console.log(`ten_nguon_doi_chung=${ten.size}`);
if (ten.size === 0) { console.error("danh sách tên nguồn rỗng — không đo được"); process.exit(2); }
const DINH_DANH = new Set(dd.map((r) => r.t.toLowerCase()));
const boDinhDanh = (l) => l.toLowerCase().replace(/[a-z0-9_]+/g, (w) => (w.includes("_") && DINH_DANH.has(w) ? "" : w));
const coTen = (l) => { const x = boDinhDanh(l); return [...ten].some((t) => x.includes(t)); };
const mau = [...ten][0];
if (!coTen(`+ const x = "${mau}";`) || coTen("+ INSERT INTO airbnb_snapshots")) { console.error("bộ dò tên nguồn hỏng"); process.exit(2); }
console.log("doi_chung_bo_do=ok");
const them = [];
let tepDang = "";
for (const l of git("diff", "-U0", `${BASE}...HEAD`).split("\n")) {
  if (l.startsWith("+++ ")) { tepDang = l.replace(/^\+\+\+ (b\/)?/, ""); continue; }
  if (l.startsWith("+") && !MAY_SINH.has(tepDang)) them.push(l);
}
kq.ten_nguon = them.filter(coTen).length;
kq.ten_nguon_commit = git("log", "--format=%B%n%an%n%ae", `${BASE}..HEAD`).split("\n").filter(coTen).length + tep.filter(coTen).length;

console.log(Object.entries(kq).map(([k, v]) => `${k}=${v}`).join(" "));
const dat = kq.doc_pl20 === 0 && kq.migration_doi === 0 && kq.sync_cloud_doi === 0 && kq.app_doi === 0 && kq.ten_nguon === 0 && kq.ten_nguon_commit === 0;
process.exit(dat ? 0 : 1);
