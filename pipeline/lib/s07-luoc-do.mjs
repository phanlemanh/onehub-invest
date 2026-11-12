// s07-luoc-do.mjs — bộ soát lược đồ 093 (stg_s07_*), bộ so cột và băm nội dung bảng. Dùng cho test và lệnh đo dữ liệu thật
// của hàng thu-danh-muc-s07. Chỉ ĐỌC danh mục hệ thống và dữ liệu; không đọc chữ của tệp migration.
import { createHash } from "node:crypto";
import { join } from "node:path";

export const BANG_093 = ["stg_s07_project_card", "stg_s07_project", "stg_s07_sitemap_url"];
export const TEP_093 = join(import.meta.dirname, "../../db/migrations/093_stg_s07.sql");

/** Soát ba bảng của 093 trong lược đồ `schema`. Trả danh sách lỗi (rỗng = đạt). */
export async function kiemLuocDo093(client, schema) {
  const loi = [];
  for (const bang of BANG_093) {
    const t = await client.query(
      `SELECT c.oid, obj_description(c.oid, 'pg_class') AS ghi_chu FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'r'`, [schema, bang]);
    if (!t.rowCount) { loi.push(`thiếu bảng ${bang}`); continue; }
    const { oid, ghi_chu } = t.rows[0];
    const pk = await client.query(
      `SELECT array_agg(a.attname::text ORDER BY k.ord) AS cot FROM pg_constraint c
         CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = $1 AND c.contype = 'p'`, [oid]);
    if ((pk.rows[0]?.cot ?? []).join(",") !== "snapshot_id,pj_id") loi.push(`khoá chính của ${bang} không phải (snapshot_id, pj_id)`);
    // chỉ mục hai cột (pj_id, captured_at DESC): indoption bit 1 = DESC
    const ix = await client.query(
      `SELECT i.indkey::int2[] AS khoa, i.indoption::int2[] AS tuy_chon,
              (SELECT array_agg(a.attname::text ORDER BY k.ord) FROM unnest(i.indkey::int2[]) WITH ORDINALITY AS k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum) AS cot
         FROM pg_index i WHERE i.indrelid = $1 AND NOT i.indisprimary`, [oid]);
    const co = ix.rows.some((r) => (r.cot ?? []).join(",") === "pj_id,captured_at" && (r.tuy_chon[0] & 1) === 0 && (r.tuy_chon[1] & 1) === 1);
    if (!co) loi.push(`${bang}: thiếu chỉ mục (pj_id, captured_at DESC)`);
    if (!/không sync cloud/.test(ghi_chu ?? "")) loi.push(`${bang}: chú thích bảng thiếu «không sync cloud»`);
    if (bang === "stg_s07_project") {
      const c = await client.query(
        `SELECT col_description($1, a.attnum) AS ghi_chu FROM pg_attribute a WHERE a.attrelid = $1 AND a.attname = 'price_range_raw'`, [oid]);
      if (!/chỉ nội bộ/.test(c.rows[0]?.ghi_chu ?? "")) loi.push("price_range_raw thiếu chú thích chỉ nội bộ");
    }
  }
  return loi;
}

/** Dấu lược đồ: sha256 của danh sách bảng.cột:kiểu:null và định nghĩa chỉ mục (đã bỏ tên lược đồ), sắp xếp. */
export async function dauLuocDo(client, schema) {
  const c = await client.query(
    `SELECT table_name || '.' || column_name || ':' || data_type || ':' || is_nullable AS d
       FROM information_schema.columns WHERE table_schema = $1 ORDER BY 1`, [schema]);
  const i = await client.query(`SELECT indexdef AS d FROM pg_indexes WHERE schemaname = $1 ORDER BY 1`, [schema]);
  const chu = [...c.rows, ...i.rows].map((r) => r.d.split(`${schema}.`).join("")).join("\n");
  return createHash("sha256").update(chu).digest("hex");
}

// Chuẩn hoá để so: mốc giờ về ISO; khoá của đối tượng sắp theo tên (jsonb không giữ thứ tự khoá); THỨ TỰ MẢNG giữ nguyên.
const chuan = (v) => {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/.test(v)) return new Date(v).toISOString();
  if (Array.isArray(v)) return v.map(chuan);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, chuan(v[k])]));
  return v ?? null;
};
/** So một dòng đọc từ DB với dòng bộ bóc trả: danh sách tên cột lệch (rỗng = khớp). So sâu, thứ tự mảng có nghĩa. */
export function soCotLech(dongDb, dongBoc, cot) {
  return cot.filter((c) => JSON.stringify(chuan(dongDb[c])) !== JSON.stringify(chuan(dongBoc[c])));
}

/** Băm nội dung ba bảng (mọi cột, sắp theo khoá) — hai lược đồ nạp cùng dữ liệu phải ra cùng băm. */
export async function bamBang(client, schema) {
  const h = createHash("sha256");
  for (const bang of BANG_093) {
    const r = await client.query(`SELECT row_to_json(t)::text AS d FROM "${schema}".${bang} t ORDER BY snapshot_id, pj_id`);
    h.update(bang + "\n" + r.rows.map((x) => x.d).join("\n") + "\n");
  }
  return h.digest("hex");
}
