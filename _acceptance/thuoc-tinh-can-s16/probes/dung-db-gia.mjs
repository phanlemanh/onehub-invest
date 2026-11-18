#!/usr/bin/env node
// dung-db-gia.mjs — hồ sơ thuoc-tinh-can-s16 (DA40): DB thử DỮ LIỆU GIẢ cho ảnh chứng E10, E12. Kho công khai, nên ảnh chứng không chụp
// dữ liệu S16 thật (quyết định ghi ở decisions.jsonl). Mọi tên dự án, mã căn, diện tích, giá đều sinh ở đây, không chép từ dữ liệu thật.
// Phát biểu do chính lệnh pipeline/scripts/thuoc-tinh-can-s16.mjs tính và ghi (bên ghi thật). Tạo lại DB oneinvest_dbv_ttc_gia mỗi lần chạy.
// Chạy: node _acceptance/thuoc-tinh-can-s16/probes/dung-db-gia.mjs — in số mong đợi của từng dự án, đếm bằng SQL viết riêng.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(join(GOC, "pipeline/package.json"))("pg");
const { taoDbThu } = await import(join(GOC, "pipeline/scripts/db-thu-dbv.mjs"));
const { tinh, ghi } = await import(join(GOC, "pipeline/scripts/thuoc-tinh-can-s16.mjs"));

export const TEN_DB = "oneinvest_dbv_ttc_gia";
const SNAP = "gia__ttc";
let so = 0;
const khoa = (tien) => `${tien}_${String(++so).padStart(26, "0")}`;

const url = await taoDbThu(TEN_DB);
const c = new pg.Client({ connectionString: url });
await c.connect();

const biDanh = (k, loai, gt, nguon = "S16") =>
  c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, $2, $3, $4)`, [k, loai, gt, nguon]);

async function duAn(ten, slug) {
  return (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', $1, $2, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [ten, slug])).rows[0].id;
}
async function toa(nut, ten, duAnNguon) {
  const k = khoa("bld");
  await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [k, nut]);
  await biDanh(k, "ten", ten, duAnNguon ? "S16" : "S09");
  if (duAnNguon) await biDanh(k, "ma_nguon", `${duAnNguon}/${ten}`);
  return k;
}
async function can(toaKey, tang, ma, duAnNguon) {
  const k = khoa("unt");
  await c.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, $3, $1, 'xac_minh')`, [k, toaKey, String(tang)]);
  if (duAnNguon) await biDanh(k, "ma_nguon", `${duAnNguon}/${ma}`);
  return k;
}
let dong = 0;
const nap = (d) => c.query(`INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, toa, ma_can, dong, height_type, property_type, bedroom, bathroom,
    direction, balcony_direction, sale_price, area_using, area_building) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
  [SNAP, d.du_an, d.toa, d.ma, dong++, d.cao, d.loai, d.pn, d.wc, d.cua ?? "", d.bc ?? "", d.gia, d.tt, d.xd]);

await c.query(`INSERT INTO source_registry (code, real_name, label_vi, status, since) VALUES ('S99', 'NguonGiaLap', 'Nguồn thử', 'active', current_date) ON CONFLICT DO NOTHING`);
await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1, 'vn', 'S16', '2026-11-18T01:00:00Z', '{}')`, [SNAP]);

// Alpha: cao tầng, hai toà × 12 căn; căn cuối mỗi toà chưa có thuộc tính; có căn góc, căn thiếu WC, căn không có giá
const HUONG = ["SE", "NE_NW", "SW", "N", "OTHER", "E"];
const alpha = await duAn("Khu Mẫu Alpha", "khu-mau-alpha");
for (const [t, ten] of ["AT1", "AT2"].entries()) {
  const k = await toa(alpha, ten, "mau-alpha");
  for (let i = 0; i < 12; i++) {
    const ma = `${ten}-${String(i + 1).padStart(2, "0")}`;
    await can(k, 5 + i, ma, "mau-alpha");
    if (i === 11) continue;
    const n = t * 12 + i;
    const tt = 50 + (n % 7) * 6.5;
    await nap({ du_an: "mau-alpha", toa: ten, ma, cao: "HIGH_RISE", loai: n % 6 === 5 ? "PENT_HOUSE" : "APARTMENT", pn: 1 + (n % 3), wc: n % 5 === 0 ? 0 : 1 + (n % 2),
      bc: HUONG[n % HUONG.length], gia: n % 3 === 0 ? 0 : 1_500_000_000 + n * 40_000_000, tt, xd: tt + 6 });
  }
}
// Beta: thấp tầng — sàn sử dụng + đất, hướng cửa
const beta = await duAn("Khu Mẫu Beta", "khu-mau-beta");
const kb = await toa(beta, "BL1", "mau-beta");
for (let i = 0; i < 8; i++) {
  const ma = `BL1-${String(i + 1).padStart(2, "0")}`;
  await can(kb, 1, ma, "mau-beta");
  await nap({ du_an: "mau-beta", toa: "BL1", ma, cao: "LOW_RISE", loai: ["ROW_HOUSE", "SHOP_HOUSE", "DETACHED_VILLA", "SEMI_DETACHED_VILLA"][i % 4], pn: 3 + (i % 2), wc: 3,
    cua: ["S", "E", "NW", "SE"][i % 4], gia: i % 2 === 0 ? 8_000_000_000 + i * 300_000_000 : 0, tt: 240 + i * 11, xd: 80 + i * 5 });
}
// Gamma: 10 căn trong danh bạ + 6 mã có thuộc tính mà chưa có căn danh bạ
const gamma = await duAn("Khu Mẫu Gamma", "khu-mau-gamma");
const kg = await toa(gamma, "GT1", "mau-gamma");
for (let i = 0; i < 16; i++) {
  const ma = `GT1-${String(i + 1).padStart(2, "0")}`;
  if (i < 10) await can(kg, 3 + i, ma, "mau-gamma");
  await nap({ du_an: "mau-gamma", toa: "GT1", ma, cao: "HIGH_RISE", loai: "APARTMENT", pn: 2, wc: 2, bc: "W", gia: i % 2 === 0 ? 2_200_000_000 : 0, tt: 66.5, xd: 72 });
}
// Delta: không có toà S16
const delta = await duAn("Khu Mẫu Delta", "khu-mau-delta");
const kd = await toa(delta, "DT1", null);
for (let i = 0; i < 4; i++) await can(kd, 2 + i, `DT1-${i + 1}`, null);

const kq = await tinh(c);
await c.query("BEGIN");
await ghi(c, kq.phat, kq.observed_at, "gia");
await c.query("COMMIT");
await c.query("ANALYZE field_assertions");

// Đếm độc lập, không qua lớp đọc của app
const dem = await c.query(`
  SELECT n.id::int, n.name,
    (SELECT count(*) FROM units u JOIN buildings b USING (building_key) WHERE b.region_node_id = n.id)::int AS y,
    (SELECT count(DISTINCT f.subject_key) FROM field_assertions f JOIN units u ON u.unit_key = f.subject_key JOIN buildings b USING (building_key)
      WHERE b.region_node_id = n.id AND f.retracted_at IS NULL)::int AS x,
    (SELECT count(*) FROM v_s16_gia_cdt g JOIN units u ON u.unit_key = g.unit_key JOIN buildings b USING (building_key) WHERE b.region_node_id = n.id)::int AS z,
    (SELECT count(*) FROM stg_s16_can_chi_tiet s WHERE s.du_an = replace(n.slug, 'khu-mau-', 'mau-')
      AND NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.value = s.du_an || '/' || s.ma_can AND a.object_key LIKE 'unt%'))::int AS n
  FROM asset_nodes n WHERE n.slug LIKE 'khu-mau-%' ORDER BY n.name`);
for (const r of dem.rows) console.log(`${r.name} (nút ${r.id}): X=${r.x} Y=${r.y} Z=${r.z} N=${r.n}`);
console.log(`DATABASE_URL=${url}`);
await c.end();
