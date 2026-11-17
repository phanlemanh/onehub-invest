// danh-ba-s16-cau-truc.itest.mjs — DA37 danh-ba-s16-thang-cau-truc: tầng S16 của v_toa_nut_vung (111), thẻ luật phân khu S16,
// S16 thắng cấu trúc. DB thử oneinvest_dbv_s37_<pid> dựng từ db/migrations tới 110 (taoDbThu), áp 111 trong ca; xoá khi xong.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

export const TEN = `oneinvest_dbv_s37_${process.pid}`;
const MIG111 = join(GOC, "db/migrations/111_v_toa_nut_vung_s16.sql");
const MIG097 = join(GOC, "db/migrations/097_stg_s09_item.sql");
let db;

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN, { hetSo: 110 }) });
  await db.connect();
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

// Thân view v_toa_nut_vung của 097 (đường lùi của 111), rút nguyên văn từ tệp migration.
const THAN_097 = (() => {
  const s = readFileSync(MIG097, "utf8");
  return s.slice(s.indexOf("CREATE OR REPLACE VIEW v_toa_nut_vung"), s.indexOf("ON true;", s.indexOf("CREATE OR REPLACE VIEW v_toa_nut_vung")) + "ON true;".length);
})();
const viewDef = async (ten = "v_toa_nut_vung") => (await db.query("SELECT pg_get_viewdef($1::regclass) AS d", [ten])).rows[0].d;
const bk = (n) => `bld_${String(n).padStart(26, "0")}`;
const SNAP_DS = "q37__s16__ds", SNAP_KHONG = "q37__s16__khong";
let P, N16, N16B;

async function fixture() {
  const nut = async (type, slug, ten, parent = null, meta = {}) => (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
     VALUES ($1, $3, $2, $4, '{}', '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta])).rows[0].id;
  P = await nut("project", "q37-p", "Q37 Dự án");
  N16 = await nut("subzone", "q37-k1", "Q37 Khu 1", P, { s16_khu_ids: ["qp/K1"] });
  N16B = await nut("subzone", "q37-k2", "Q37 Khu 2", P, { s16_khu_ids: ["qp/K2"] });
  for (const n of [1, 2, 3, 4]) {
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bk(n), P]);
  }
  for (const s of [SNAP_DS, SNAP_KHONG]) {
    await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}')`, [s]);
  }
  await db.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, 'qp', 'K1', 'Q37 Khu 1'), ($1, 'qp', 'K2', 'Q37 Khu 2')`, [SNAP_DS]);
  // toà 2: K1 ở bản có danh sách, K9 ở bản không danh sách → khu K1
  // toà 3: K1 và K2 ở bản có danh sách → hai khu, không vào tầng S16
  // toà 4: không bí danh S16 (đối chứng: giữ như 097)
  const toa = [[SNAP_DS, "K1", "T2"], [SNAP_KHONG, "K9", "T2"], [SNAP_DS, "K1", "T3"], [SNAP_DS, "K2", "T3b"]];
  for (const [s, khu, t] of toa) {
    await db.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, 'qp', $2, $2, $3, $3)`, [s, khu, t]);
  }
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'qp/T2', 'S16'),
                  ($2, 'ma_nguon', 'qp/T3', 'S16'), ($2, 'ma_nguon', 'qp/T3b', 'S16'), ($1, 'ten', 'T2', 'S16'), ($2, 'ten', 'T3', 'S16'),
                  ($2, 'ten', 'Toà ba', 'S08')`, [bk(2), bk(3)]);
}

test("DA37-AC-1 111 áp hai lần không đổi; toà không S16 ra đúng như 097; áp lại 097 trả view cũ", async () => {
  await fixture();
  await db.query(THAN_097);
  const goc097 = await viewDef();
  apTep(TEN, MIG111);
  const lan1 = await viewDef();
  apTep(TEN, MIG111);
  assert.equal(await viewDef(), lan1, "DA37-AC-1 áp 111 lần hai đổi định nghĩa view");
  await db.query(`CREATE TEMP VIEW v097 AS ${THAN_097.replace(/^CREATE OR REPLACE VIEW v_toa_nut_vung AS/, "").replace(/;$/, "")}`);
  const khongS16 = `building_key NOT IN (SELECT object_key FROM registry_aliases WHERE source = 'S16' AND kind = 'ma_nguon')`;
  const lech = async (a, b) => (await db.query(`SELECT count(*)::int AS n FROM ((SELECT * FROM ${a} WHERE ${khongS16}) EXCEPT ALL (SELECT * FROM ${b} WHERE ${khongS16})) x`)).rows[0].n;
  assert.equal(await lech("v_toa_nut_vung", "v097"), 0, "DA37-AC-1 toà không S16 đổi nút (111 có dòng 097 không có)");
  assert.equal(await lech("v097", "v_toa_nut_vung"), 0, "DA37-AC-1 toà không S16 đổi nút (097 có dòng 111 không có)");
  // Chiều đỏ: tầng S16 bắt cả toà không bí danh S16 → toà 4 đổi nút
  const hong = readFileSync(MIG111, "utf8").slice(0, readFileSync(MIG111, "utf8").indexOf("-- ---- 2."))
    .replace("WHERE s16.khu IS NOT NULL AND n.meta -> 's16_khu_ids' ? s16.khu", "WHERE n.meta -> 's16_khu_ids' ? 'qp/K1'");
  await db.query(hong);
  assert.ok(await lech("v_toa_nut_vung", "v097") > 0, "DA37-AC-1 chiều đỏ: đột biến không làm toà không S16 đổi nút");
  apTep(TEN, MIG111);
  await db.query(THAN_097);
  assert.equal(await viewDef(), goc097, "DA37-AC-1 áp lại 097 không trả view cũ");
  apTep(TEN, MIG111);
});

test("DA37-AC-2 khu lấy từ bản thu có danh sách; toà hai khu không vào tầng S16 và được đếm", async () => {
  const nut = async (b) => (await db.query("SELECT region_node_id::int AS id, nguon FROM v_toa_nut_vung WHERE building_key = $1", [b])).rows[0];
  assert.deepEqual(await nut(bk(2)), { id: N16, nguon: "s16_phan_khu" }, "DA37-AC-2 toà 2 không nhận khu từ bản có danh sách");
  assert.deepEqual(await nut(bk(3)), { id: P, nguon: "goc" }, "DA37-AC-2 toà hai khu vẫn vào tầng S16");
  assert.deepEqual(await nut(bk(4)), { id: P, nguon: "goc" }, "DA37-AC-2 toà không S16 bị đổi");
  const dem = (await db.query(`SELECT so FROM v_lech_cau_truc_s16 WHERE du_an = 'qp' AND loai = 'khu-nhieu'`)).rows[0]?.so;
  assert.equal(dem, 1, "DA37-AC-2 toà hai khu không được đếm");
  // Chiều đỏ: đọc khu từ bản mới nhất bất kể danh sách → toà 2 nhận K9 (không nút) → rơi về gốc
  const hong = readFileSync(MIG111, "utf8").slice(0, readFileSync(MIG111, "utf8").indexOf("-- ---- 2."))
    .replace("JOIN stg_s16_khu k ON k.snapshot_id = t.snapshot_id AND k.du_an = t.du_an AND k.khu_id = t.khu_id\n   WHERE a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL\n     AND a.object_key LIKE 'bld\\_%'",
             "WHERE t.snapshot_id = 'q37__s16__khong' AND a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL\n     AND a.object_key LIKE 'bld\\_%'");
  await db.query(hong);
  assert.notDeepEqual(await nut(bk(2)), { id: N16, nguon: "s16_phan_khu" }, "DA37-AC-2 chiều đỏ: khu từ bản không danh sách không bị bắt");
  apTep(TEN, MIG111);
});

test("DA37-AC-6 (view) đếm lệch cấu trúc theo cặp nguồn: tên toà S08 khác S16, toà hai khu", async () => {
  const dong = (await db.query(`SELECT du_an, cap_nguon, loai, so FROM v_lech_cau_truc_s16 ORDER BY 1, 2, 3`)).rows;
  assert.deepEqual(dong, [
    { du_an: "qp", cap_nguon: "S08-S16", loai: "ten-toa", so: 1 },
    { du_an: "qp", cap_nguon: "S16", loai: "khu-nhieu", so: 1 },
  ], "DA37-AC-6 bảng đếm lệch khác bảng kỳ vọng viết trước");
});
