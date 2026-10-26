// scan-delete.mjs — PL14 (nap-lai-khong-xoa AC-8): không câu DELETE FROM / TRUNCATE nào nhắm bảng tin hay listing.
// Tin và listing chỉ NGHỈ (retired_at, migration 044); xoá hàng là mất quyết định người qua khoá ngoại.
// Bỏ qua dòng chú thích (//, --, /*, *) và dòng mang dấu `quet-xoa:bo-qua` (đối chứng có chủ đích trong thước).
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const BANG = "(?:sale_offers|sale_offer_records|listings|listing_records)";
const DELETE_RE = new RegExp(`\\bDELETE\\s+FROM\\s+(?:ONLY\\s+)?(?:"?public"?\\.)?"?${BANG}"?(?![A-Za-z0-9_])`, "i");
const TRUNCATE_RE = new RegExp(`\\bTRUNCATE\\b[^;]*?(?<![A-Za-z0-9_])"?${BANG}"?(?![A-Za-z0-9_])`, "i");
const CHU_THICH = /^\s*(?:\/\/|--|\/\*|\*)/;

/** '<tệp>:<dòng>' cho mỗi câu xoá nhắm bảng tin/listing. files: [{ path, text }]. */
export function scanDeleteRecords(files) {
  const hits = [];
  for (const f of files) {
    f.text.split("\n").forEach((line, i) => {
      if (CHU_THICH.test(line) || line.includes("quet-xoa:bo-qua")) return;
      if (DELETE_RE.test(line) || TRUNCATE_RE.test(line)) hits.push(`${f.path}:${i + 1}`);
    });
  }
  return hits;
}

const BO = new Set(["node_modules", "fixtures"]);
const LAY = /\.(?:mjs|js|cjs|ts|sql|sh)$/;
const TEST = /\.(?:test|itest)\.[a-z]+$/;

/** Tệp mã của một cây (trừ node_modules, fixtures, test) — đường tương đối từ `goc`. */
export function codeTree(goc, thuMuc) {
  const out = [];
  const di = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (BO.has(e.name) || e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) di(p);
      else if (LAY.test(e.name) && !TEST.test(e.name)) out.push({ path: relative(goc, p), text: readFileSync(p, "utf8") });
    }
  };
  di(join(goc, thuMuc));
  return out;
}
