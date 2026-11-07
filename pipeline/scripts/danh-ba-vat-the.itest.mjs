// danh-ba-vat-the.itest.mjs — hồ sơ danh-ba-toa-truc-can (DB1): ca «DBV-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_<pid> (đủ migration) và oneinvest_dbv_<pid>_truoc (tới 081, trước 082) ở :5433, tạo đầu tệp, xoá
// cuối tệp; không đọc, không ghi DB `oneinvest`. Fixture là dữ liệu tổng hợp (mã tiền tố Q), không mã S08 thật.
// Ngoài glob test của CI (cần :5433); chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs
// Chiều đỏ: DBV_MIG_THAY=<bản chép 082> thay migration khi dựng DB thử.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { SQL as SQL_NGUOI } from "../lib/danh-ba-nguoi.mjs";

const TEN = `oneinvest_dbv_${process.pid}`;
const TEN_TRUOC = `${TEN}_truoc`;
const CAU_DAU = readFileSync(join(GOC, "db/dau-luoc-do.sql"), "utf8");
const K = (tienTo, n) => `${tienTo}_${String(n).padStart(26, "0")}`;

let db;
let dbTruoc;
before(async () => {
  const [u, uTruoc] = await Promise.all([taoDbThu(TEN), taoDbThu(TEN_TRUOC, { hetSo: 81 })]);
  db = new pg.Client({ connectionString: u });
  dbTruoc = new pg.Client({ connectionString: uTruoc });
  await Promise.all([db.connect(), dbTruoc.connect()]);
});
after(async () => {
  await Promise.all([db?.end().catch(() => {}), dbTruoc?.end().catch(() => {})]);
  await Promise.all([xoaDbThu(TEN), xoaDbThu(TEN_TRUOC)]);
});

const bam = (rows) => createHash("sha256").update(JSON.stringify(rows)).digest("hex");
const dau = async (c) => Object.values((await c.query(CAU_DAU)).rows[0])[0];

/** Mồi tin S03 + phát biểu, chạy phân xử thật (resolve_offer_fields), trả băm cột chuẩn + xuất xứ. */
async function phanXuTin(c) {
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) SELECT 'dbv', 'phat-bieu:cat-chuyen', 'local', '{}'
                  WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  await c.query(`INSERT INTO sale_offer_records (offer_id, source, originating_system_key, kind, first_seen, last_seen)
                 VALUES ('offer_dbv_1', 'S03', 'qp1', 'sale', '2026-11-01', '2026-11-02') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at, run_id)
                 VALUES ('S03:qp1', 'property_type', 'apartment', 'observed', 'parser', '2026-11-01', 'dbv'),
                        ('S03:qp1', 'block_raw', 'QA6', 'observed', 'parser', '2026-11-01', 'dbv')
                 ON CONFLICT DO NOTHING`);
  await c.query(`SELECT resolve_offer_fields(ARRAY['offer_dbv_1'])`);
  const { rows } = await c.query(
    `SELECT offer_id, property_type, block_raw, field_provenance FROM sale_offer_records WHERE offer_id = 'offer_dbv_1'`,
  );
  return bam(rows);
}

/** Ghi một người qua câu ghi thật của danh bạ Người (pipeline/lib/danh-ba-nguoi.mjs), trả băm người + bí danh. */
async function caNguoi(c) {
  const p = K("pty", 1);
  await c.query(`${SQL_NGUOI.themNguoi} ON CONFLICT DO NOTHING`, [[p], ["S03"]]);
  await c.query(`${SQL_NGUOI.themDinhDanh} ON CONFLICT DO NOTHING`, [[p], ["S03"], ["sdt_bam"], ["qbam1"]]);
  await c.query(SQL_NGUOI.themTen, [[p], ["S03"], ["ten"], ["Q Người"]]);
  const a = await c.query(`SELECT party_key, status, source FROM parties ORDER BY 1`);
  const b = await c.query(SQL_NGUOI.biDanh);
  return bam([a.rows, b.rows.sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))]);
}

async function moiVung(c) {
  await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
                 VALUES ('project', 'Q Khu Một', 'q-khu-mot', '{}', '{}', 'SubdivisionName', '{}') ON CONFLICT (slug) DO NOTHING`);
  return (await c.query(`SELECT id FROM asset_nodes WHERE slug = 'q-khu-mot'`)).rows[0].id;
}

test("DBV-AC-1 lược đồ 082: chỉ thêm, khoá đúng khuôn, phát biểu vật thể; danh bạ Người và phân xử tin không đổi", async () => {
  // Dấu lược đồ: áp 082 lần hai không đổi lược đồ.
  const dau1 = await dau(db);
  apTep(TEN, process.env.DBV_MIG_THAY ?? join(GOC, "db/migrations/082_danh_ba_vat_the.sql"));
  assert.equal(await dau(db), dau1, "DBV-AC-1 áp 082 lần hai đổi lược đồ");

  // Quan hệ: ca Người và phân xử tin cho cùng tập dòng trước và sau 082.
  const nguoiTruoc = await caNguoi(dbTruoc);
  const tinTruoc = await phanXuTin(dbTruoc);
  assert.equal(await caNguoi(db), nguoiTruoc, "DBV-AC-1 ca Người đổi sau 082");
  assert.equal(await phanXuTin(db), tinTruoc, "DBV-AC-1 phân xử tin đổi sau 082");

  // Vật thể mồi.
  const khu = await moiVung(db);
  const bld = K("bld", 1);
  const stk = K("stk", 1);
  const unt = K("unt", 1);
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh') ON CONFLICT DO NOTHING`, [bld, khu]);
  await db.query(`INSERT INTO stacks (stack_key, building_key, catalog_tier) VALUES ($1, $2, 'xac_minh') ON CONFLICT DO NOTHING`, [stk, bld]);
  await db.query(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier)
                  VALUES ($1, $2, $3, '7', $3 || ':7', 'xac_minh') ON CONFLICT DO NOTHING`, [unt, bld, stk]);

  // Ma trận viết trước: mọi thao tác phá phải bị từ chối với «chỉ thêm».
  const MA_TRAN = [
    ["buildings", `DELETE FROM buildings WHERE building_key = '${bld}'`],
    ["buildings", `TRUNCATE buildings CASCADE`],
    ["buildings", `UPDATE buildings SET building_key = '${K("bld", 2)}' WHERE building_key = '${bld}'`],
    ["buildings", `UPDATE buildings SET upi = 'urn:onehub:upi:1:VN:VN-SG:${bld}', iso_region = 'VN-SG' WHERE building_key = '${bld}'`],
    ["buildings", `UPDATE buildings SET created_at = now() - interval '1 day' WHERE building_key = '${bld}'`],
    ["stacks", `DELETE FROM stacks WHERE stack_key = '${stk}'`],
    ["stacks", `TRUNCATE stacks CASCADE`],
    ["stacks", `UPDATE stacks SET building_key = building_key, stack_key = '${K("stk", 2)}' WHERE stack_key = '${stk}'`],
    ["units", `DELETE FROM units WHERE unit_key = '${unt}'`],
    ["units", `TRUNCATE units`],
    ["units", `UPDATE units SET sub_id = '${unt}', stack_key = NULL WHERE unit_key = '${unt}'`],
    ["units", `UPDATE units SET floor = '8', sub_id = '${stk}:8' WHERE unit_key = '${unt}'`],
  ];
  let soCa = 0;
  for (const [bang, cau] of MA_TRAN) {
    await assert.rejects(db.query(cau), /chỉ thêm/, `DBV-AC-1 xoá được vật thể: ${bang} · ${cau.slice(0, 40)}`);
    soCa++;
  }
  assert.equal(soCa, MA_TRAN.length);
  // Đổi trạng thái là lối duy nhất mở.
  await db.query(`UPDATE units SET status = 'retired' WHERE unit_key = $1`, [unt]);

  // Khoá sai khuôn, UPI lệch khoá: CHECK từ chối.
  await assert.rejects(db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                                 VALUES ('bld_sai', $1, 'urn:onehub:upi:1:VN:VN-HN:bld_sai', 'VN-HN', 'xac_minh')`, [khu]), /check/i);
  await assert.rejects(db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                                 VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $3::text, 'VN-HN', 'xac_minh')`,
                                [K("bld", 3), khu, K("bld", 4)]), /buildings_upi_khop_khoa/);

  // Bí danh mã tại nguồn nhận; trùng (cùng nguồn, cùng giá trị) bị từ chối.
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q9/QA6', 'S08')`, [bld]);
  await assert.rejects(db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q9/QA6', 'S08')`,
                                [K("bld", 5)]), /registry_aliases_ma_nguon_uq/);
  // Bí danh Người trùng vẫn bị từ chối sau 082.
  await assert.rejects(
    db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt_bam', 'qbam1', 'S03')`, [K("pty", 2)]),
    /registry_aliases_dinh_danh_uq/,
    "DBV-AC-1 bí danh Người trùng",
  );

  // Phát biểu vật thể: nhận Building + khoá bld; từ chối ghép lệch.
  await db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                  VALUES ('Building', $1, 'builder_name', 'Q Chủ Đầu Tư', 'fact', 'hitl', now(), 'dbv')`, [bld]);
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Property', $1, 'block_raw', 'QA6', 'observed', 'parser', now(), 'dbv')`, [bld]),
                       /resource không khớp khoá/, "DBV-AC-1 nhận phát biểu resource không khớp khoá");
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Building', 'S03:qp1', 'builder_name', 'x', 'fact', 'hitl', now(), 'dbv')`),
                       /resource không khớp khoá/, "DBV-AC-1 nhận phát biểu resource không khớp khoá");
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Building', $1, 'builder_name', 'y', 'fact', 'registry_inherit', now(), 'dbv')`, [bld]),
                       /registry_inherit chỉ đi với lớp inferred/);
  await assert.rejects(db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at, run_id)
                                 VALUES ('Property', 'S03:qp1', 'builder_name', 'y', 'fact', 'hitl', now(), 'dbv')`),
                       /không thuộc resource/);

  // Sau khi có phát biểu vật thể, phân xử tin vẫn cho đúng tập dòng như trước 082.
  assert.equal(await phanXuTin(db), tinTruoc, "DBV-AC-1 phân xử tin thấy phát biểu vật thể");
});
