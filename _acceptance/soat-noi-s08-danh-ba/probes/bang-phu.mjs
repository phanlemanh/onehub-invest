#!/usr/bin/env node
// DA55 soat-noi-s08-danh-ba — bảng phủ ca: mỗi dự án S08 (bản danh mục mới nhất) rơi vào ngả nào theo luật design doc §3.
// Bộ đếm ĐỘC LẬP với pipeline/lib/noi-du-an-s08-lop.mjs (viết lại luật từ chữ của design doc, chỉ dùng chung hàm chuẩn tên), để E7
// so ngả của thẻ với số đếm này. Chỉ đọc. In số đếm theo ngả, không in tên hay mã dự án.
//   node _acceptance/soat-noi-s08-danh-ba/probes/bang-phu.mjs        (DATABASE_URL, mặc định DB máy thu, phiên chỉ đọc)
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chuanKhop, chuanTen, laTenRong } from "../../../pipeline/lib/noi-du-an-s06-lop.mjs";

const pg = createRequire(new URL("../../../pipeline/package.json", import.meta.url))("pg");

/** Đếm ngả trên một client đã nối. Trả { giu_tay, noi, the_cap, duc, tu_choi, nut_moi } (số dự án; nut_moi = số nhóm đúc). */
export async function demNga(c) {
  const { rows: duAn } = await c.query(`
    WITH p AS (SELECT DISTINCT ON (project_id) project_id, catalog_payload cp, point_lng, point_lat FROM stg_s08_project
                ORDER BY project_id, fetched_at DESC NULLS LAST)
    SELECT p.project_id AS ma, p.cp ->> 'project_name' AS ten,
           (SELECT a.id FROM areas a WHERE p.point_lng IS NOT NULL AND a.region_type = 'market'
              AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(p.point_lng::float, p.point_lat::float), 4326)) ORDER BY a.id LIMIT 1) AS tinh,
           EXISTS (SELECT 1 FROM s08_project_links l WHERE l.project_id = p.project_id AND l.status = 'noi') AS tay,
           (SELECT n.id FROM project_links pl JOIN asset_nodes n ON n.id = pl.asset_node_id
             WHERE pl.source = 'S08' AND pl.source_project_id = p.project_id AND n.meta ->> 'nguon' = 'S08') AS nut_s08
      FROM p`);
  const { rows: nut } = await c.query(`
    SELECT n.id, n.name, n.aliases, coalesce(n.meta ->> 'nguon', n.meta ->> 'nguon_ung_vien') AS nguon,
           CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS tinh
      FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1] WHERE n.node_type = 'project'`);
  const goc = (t) => String(t ?? "").trim().replace(/[_ ]TT$/i, "").replace(/^TMDV\s+/i, "").trim();
  const dem = { giu_tay: 0, noi: 0, the_cap: 0, duc: 0, tu_choi: 0 };
  const nhom = new Set();
  for (const d of duAn) {
    if (d.tay) { dem.giu_tay++; continue; }
    if (d.nut_s08 != null) { dem.duc++; nhom.add(`#${d.nut_s08}`); continue; }
    if (laTenRong(d.ten) || /\((OCP|OP|GP|VOP|VGP)\s*\d*\)|\bOCP\s?\d\b/i.test(d.ten ?? "") || !d.tinh) { dem.tu_choi++; continue; }
    const k = chuanKhop(goc(d.ten));
    const trung = [], trungNull = [];
    let chua = 0;
    for (const n of nut) {
      if (n.nguon === "S08" || (n.tinh != null && n.tinh !== d.tinh)) continue;
      const ten = [n.name, ...(n.aliases ?? [])].map(chuanKhop).filter(Boolean);
      if (ten.includes(k)) (n.tinh == null ? trungNull : trung).push(n.id);
      else if (k.length >= 8 && ten.some((q) => q.length >= 8 && (` ${k} `.includes(` ${q} `) || ` ${q} `.includes(` ${k} `)))) chua++;
    }
    if (trung.length === 1 && trungNull.length === 0) dem.noi++;
    else if (trung.length + trungNull.length > 0 || chua > 0) dem.the_cap++;
    else { dem.duc++; nhom.add(`${chuanTen(goc(d.ten))}|${d.tinh}`); }
  }
  return { ...dem, nut_moi: [...nhom].filter((k) => !k.startsWith("#")).length, tong: duAn.length };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    options: "-c default_transaction_read_only=on" });
  await c.connect();
  try { console.log(JSON.stringify(await demNga(c))); } finally { await c.end(); }
}
