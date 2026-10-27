// scan-canonical-write.mjs — PL15 AC-5: không đường nào ghi thẳng năm cột phân loại (trục enrich_field) vào bảng tin;
// chỉ bộ phân xử resolve_offer_fields (045) được ghi. Quét tệp (mjs/js/ts/tsx/sql/sh) và hàm sống trong DB (pg_proc).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const BANG = "(?:\\w+\\.)?sale_offer(?:_record)?s";
const TIN = new RegExp(`\\b(UPDATE\\s+(?:ONLY\\s+)?${BANG}|INSERT\\s+INTO\\s+${BANG})\\b`, "gi");
/** Chỗ được phép ghi thẳng, có lý do — thêm mục là đổi phạm vi của hợp đồng PL15. */
export const CHO_PHEP = [
  { path: "pipeline/scripts/dung-lai-canonical.mjs", ly_do: "thước xoá-rồi-dựng-lại (AC-7): đặt năm cột về mặc định trong giao dịch ROLLBACK" },
];

/** Bỏ thân hàm resolve_offer_fields (chỗ ghi hợp lệ duy nhất) khỏi văn bản SQL. */
function boThanPhanXu(text) {
  return text.replace(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+resolve_offer_fields[\s\S]*?\nEND\s+\$\$;/gi, (m) => m.replace(/[^\n]/g, " "));
}

/** Đoạn câu từ vị trí `from` tới dấu kết (; ` ") — câu SQL nhiều dòng trong template, chuỗi, tệp .sql/.sh. */
function doanCau(text, from) {
  const m = /[;`"]/.exec(text.slice(from));
  return text.slice(from, m ? from + m.index : text.length);
}

/** Câu có ghi một trong `fields` không: INSERT → danh sách cột hoặc DO UPDATE SET; UPDATE → vế SET. */
function ghiCot(cau, fields) {
  const cot = (f) => new RegExp(`(?:^|[\\s,(])(?:\\w+\\.)?${f}\\s*(?:=|,|\\))`, "i");
  const phan = [];
  if (/^INSERT/i.test(cau)) {
    const ds = /^INSERT\s+INTO\s+\S+\s*\(([^)]*)\)/i.exec(cau);
    if (ds) phan.push(`(${ds[1]})`);
    const up = /DO\s+UPDATE\s+SET([\s\S]*?)(?:\bWHERE\b|\bRETURNING\b|$)/i.exec(cau);
    if (up) phan.push(up[1]);
  } else {
    const set = /\bSET\b([\s\S]*?)(?:\bWHERE\b|\bFROM\b|\bRETURNING\b|$)/i.exec(cau);
    if (set) phan.push(set[1]);
  }
  return fields.filter((f) => phan.some((p) => cot(f).test(p)));
}

/**
 * @param {Array<{path: string, text: string}>} files
 * @param {string[]} fields năm cột (VOCAB.enrich_field)
 * @returns {string[]} '<path>:<dòng> (<cột>)'
 */
export function scanCanonicalWrite(files, fields) {
  const hits = [];
  for (const f of files) {
    if (CHO_PHEP.some((x) => x.path === f.path)) continue;
    const text = boThanPhanXu(f.text);
    for (const m of text.matchAll(TIN)) {
      const dong = text.slice(0, m.index).split("\n").length;
      const lineStart = text.lastIndexOf("\n", m.index) + 1;
      if (/^\s*(\/\/|--|#|\*)/.test(text.slice(lineStart, m.index))) continue;   // dòng chú thích
      const cot = ghiCot(doanCau(text, m.index), fields);
      if (cot.length) hits.push(`${f.path}:${dong} (${cot.join(", ")})`);
    }
  }
  return hits;
}

/** Hàm sống trong DB (schema public) ghi năm cột, trừ resolve_offer_fields. */
export async function scanProcs(client, fields) {
  const { rows } = await client.query(
    `SELECT p.proname, p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname <> 'resolve_offer_fields' AND p.prosrc ~* 'sale_offer(_record)?s'`);
  return rows.filter((r) => scanCanonicalWrite([{ path: r.proname, text: r.prosrc }], fields).length).map((r) => r.proname)
    .sort();
}

const DIRS = ["pipeline", "agent", "app/src", "scripts", "db/migrations"];
const EXT = /\.(mjs|js|ts|tsx|sql|sh)$/;
const BO = new Set(["node_modules", ".next", "dist", "tests", "fixtures", "__fixtures__", "traces"]);

/** Tệp cần quét của cây thật: bỏ test, migration trước 045. */
export function filesOfTree(root) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(join(root, d))) {
      if (BO.has(e)) continue;
      const p = join(d, e);
      if (statSync(join(root, p)).isDirectory()) walk(p);
      else if (EXT.test(e) && !/\.(test|itest)\./.test(e)) {
        const mig = /^db\/migrations\/(\d{3})_/.exec(p);
        if (mig && Number(mig[1]) < 45) continue;
        out.push({ path: relative(root, join(root, p)), text: readFileSync(join(root, p), "utf8") });
      }
    }
  };
  for (const d of DIRS) walk(d);
  return out;
}
