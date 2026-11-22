#!/usr/bin/env node
// DA55 soat-noi-s08-danh-ba S1 — bảng phủ ca: mỗi dự án S08 (bản danh mục mới nhất) rơi vào đường nào khi so với nút dự án.
// Chỉ đọc (default_transaction_read_only). In số đếm theo đường, không in tên hay mã dự án.
import { createRequire } from "node:module";
const pg = createRequire(new URL("../../../pipeline/package.json", import.meta.url))("pg");
import { chuanKhop, chuanTen, DO_DAI_BI_DANH } from "../../../pipeline/lib/noi-du-an-s06-lop.mjs";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest", options: "-c default_transaction_read_only=on" });
await c.connect();
const tinhCua = `CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END`;
const { rows: duAn } = await c.query(`
  WITH p AS (SELECT DISTINCT ON (project_id) project_id, catalog_payload cp, point_lng, point_lat FROM stg_s08_project
              ORDER BY project_id, fetched_at DESC NULLS LAST),
       inv AS (SELECT project_id::text pid, count(DISTINCT product_code) can FROM stg_s08_inventory GROUP BY 1)
  SELECT p.project_id pid, p.cp->>'project_name' ten, p.cp->>'project_code' ma, p.cp->>'project_type' loai,
         p.cp->>'project_address' dc, p.point_lng IS NOT NULL co_diem, coalesce(inv.can,0)::int can,
         (SELECT a.id FROM areas a WHERE p.point_lng IS NOT NULL AND a.region_type = 'market'
            AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(p.point_lng::float, p.point_lat::float), 4326)) LIMIT 1) tinh,
         l.status lstatus, l.asset_node_id lnut
    FROM p LEFT JOIN inv ON inv.pid = p.project_id LEFT JOIN s08_project_links l ON l.project_id = p.project_id`);
const { rows: nut } = await c.query(`
  SELECT n.id::int id, n.name, n.aliases, n.catalog_tier, ${tinhCua} tinh,
         EXISTS (SELECT 1 FROM project_links pl WHERE pl.asset_node_id = n.id AND pl.source = 'S06') s06
    FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1] WHERE n.node_type = 'project'`);
const { rows: s16 } = await c.query(`SELECT DISTINCT parent_id::int id FROM asset_nodes WHERE node_type='subzone' AND meta ? 's16'`).catch(() => ({ rows: [] }));
const coS16 = new Set(s16.map((r) => r.id));
await c.end();

const HAU_TO = /\((OCP|OP|GP|VGP|VHGP|VHOP|VHSC|SC|TC)\s*\d*\)|\b(OCP|OP)\s?\d\b/i;
const dem = {}; const them = (k, can) => { const d = (dem[k] ??= { du_an: 0, can: 0 }); d.du_an++; d.can += can; };
for (const d of duAn) {
  const ten = ` ${chuanKhop(d.ten)} `, tenBo = chuanTen(d.ten);
  const bang = new Set(), chua = new Set(), bangKhacTinh = new Set();
  for (const n of nut) for (const t of [n.name, ...(n.aliases ?? [])]) {
    const k = chuanKhop(t);
    if (chuanTen(t) === tenBo) (n.tinh === d.tinh || !d.tinh ? bang : bangKhacTinh).add(n.id);
    if (k.length >= DO_DAI_BI_DANH && (ten.includes(` ${k} `) || ` ${k} `.includes(ten))) chua.add(n.id);
  }
  let duong;
  if (d.lstatus === "noi") duong = "1-da-noi";
  else if (HAU_TO.test(d.ten ?? "")) duong = "7-du-an-con-hau-to";
  else if (bang.size === 1) duong = "2-trung-ten-dung-mot-nut";
  else if (bang.size > 1) duong = "3a-trung-ten-nhieu-nut";
  else if (chua.size === 1) duong = "3b-gan-giong-mot-nut";
  else if (chua.size > 1) duong = "3c-gan-giong-nhieu-nut";
  else if (bangKhacTinh.size) duong = "6a-trung-ten-khac-tinh";
  else if (!d.tinh) duong = "6b-khong-tinh-khong-khop";
  else duong = "4-khong-khop";
  them(duong, d.can);
  them(`loai:${d.loai}`, d.can);
  if (!d.co_diem) them("phu:khong-diem", d.can);
  if (d.can === 0) them("phu:0-can", 0);
}
console.log(`tong du an S08 (ban danh muc moi nhat): ${duAn.length}; nut project: ${nut.length}; nut co phan khu S16: ${coS16.size}`);
for (const [k, v] of Object.entries(dem).sort()) console.log(`${k}|${v.du_an}|${v.can}`);
