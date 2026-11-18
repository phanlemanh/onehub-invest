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
let P, N16, N16B, N09A, NCUM;

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
  // toà 6, 7: chỉ S09 (S4-r1 t7) — 6 vào phân khu S09 (sector), 7 vào cụm S09 (tiền tố C1 + sector); 111 phải ra đúng như 097
  N09A = await nut("subzone", "q37-s09a", "Q37 S09 A", P, { s09_sector_ids: ["sec8"] });
  NCUM = await nut("subzone", "q37-s09a-c1", "Q37 Cụm C1", N09A, { s09_cum: "C1", s09_sector_id: "sec8" });
  for (const n of [6, 7]) {
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bk(n), P]);
  }
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q37-s09a', 'vn', 'S09', '{}')`);
  await db.query(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('q37-s09a', 'p8', 'du-an', $1)`,
    [{ chiTiet: { meta: { code: "200" }, data: { id: "p8", insight_by_block: [
      { id: "b6", block_code: "Q6", sector_uuid: "sec8" }, { id: "b7", block_code: "C1.2", sector_uuid: "sec8" }] } } }]);
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'p8/b6', 'S09'),
                  ($2, 'ma_nguon', 'p8/b7', 'S09')`, [bk(6), bk(7)]);
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
  // Ma trận viết trước của toà không S16: gốc (1, 4), phân khu S09 (6), cụm S09 (7) — mỗi nhánh của 097 có một ô
  const nutV = async (b) => (await db.query("SELECT region_node_id::int AS id, nguon FROM v_toa_nut_vung WHERE building_key = $1", [b])).rows[0];
  assert.deepEqual([await nutV(bk(1)), await nutV(bk(6)), await nutV(bk(7))],
    [{ id: P, nguon: "goc" }, { id: N09A, nguon: "s09_phan_khu" }, { id: NCUM, nguon: "s09_cum" }], "DA37-AC-1 toà chỉ S09 không đúng nhánh");
  // Chiều đỏ 2: 111 xếp phân khu S09 trên cụm S09 → toà 7 đổi nút
  const goc111 = readFileSync(MIG111, "utf8");
  await db.query(goc111.slice(0, goc111.indexOf("-- ---- 2.")).replace("COALESCE(pk16.id, cum.id, pk.id, b.region_node_id)", "COALESCE(pk16.id, pk.id, cum.id, b.region_node_id)"));
  assert.ok(await lech("v_toa_nut_vung", "v097") > 0, "DA37-AC-1 chiều đỏ: xếp phân khu S09 trên cụm mà toà chỉ S09 không đổi nút");
  apTep(TEN, MIG111);
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

// ---- Task 2: thẻ luật phân khu S16 (AC-3) và phân khu hiệu lực trước/sau thẻ luật (AC-4) ----
import { tmpdir } from "node:os";
import { writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { apTheLuat, daoTheLuat, dungTheLuat } from "../phan-khu-s16.mjs";

const NOI2 = { qp2: "q37-p2" };  // khoá là đuôi mã dự án (duoiDuAn), như NOI_DU_AN_S16; stg mang mã đầy đủ q37-qp2
let P2, NSAN, N09;
const nutCua = async (b) => (await db.query("SELECT region_node_id::int AS id, nguon FROM v_toa_nut_vung WHERE building_key = $1", [b])).rows[0];
const dem = async (bang) => (await db.query(`SELECT count(*)::int AS n FROM ${bang}`)).rows[0].n;

async function fixture2() {
  const nut = async (type, slug, ten, parent = null, meta = {}) => (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
     VALUES ($1, $3, $2, $4, '{}', '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta])).rows[0].id;
  P2 = await nut("project", "q37-p2", "Q37 Dự án hai");
  NSAN = await nut("subzone", "q37-p2-san", "Q37 Sẵn", P2);
  N09 = await nut("subzone", "q37-p2-s09", "Q37 S09", P2, { s09_sector_ids: ["sec1"] });
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bk(5), P2]);
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q37-s09', 'vn', 'S09', '{}')`);
  await db.query(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('q37-s09', 'p9', 'du-an', $1)`,
    [{ chiTiet: { meta: { code: "200" }, data: { id: "p9", insight_by_block: [{ id: "b1", block_code: "X1", sector_uuid: "sec1" }] } } }]);
  await db.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, 'q37-qp2', 'K5', 'Khu Năm'), ($1, 'q37-qp2', 'K6', 'Q37 Sẵn')`, [SNAP_DS]);
  await db.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, 'q37-qp2', 'K5', 'K5', 'T5', 'T5')`, [SNAP_DS]);
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q37-qp2/T5', 'S16'), ($1, 'ma_nguon', 'p9/b1', 'S09')`, [bk(5)]);
}

test("DA37-AC-4 trước áp thẻ luật: không toà nào ở tầng s16_phan_khu của dự án hai; toà S09+S16 ở phân khu S09", async () => {
  await fixture2();
  assert.deepEqual(await nutCua(bk(5)), { id: N09, nguon: "s09_phan_khu" }, "DA37-AC-4 trước áp: toà S09+S16 không ở phân khu S09");
});

let RULE;
test("DA37-AC-3 thẻ luật: xem chỉ đọc · băm lệch 0 ghi · áp đúng · áp lại", async () => {
  const the = await dungTheLuat(db, { noi: NOI2 });
  assert.deepEqual(the.dong.map((d) => [d.khu_id, d.nut]), [["K5", "moi"], ["K6", "san"]], "DA37-AC-3 kế hoạch khác ma trận");
  for (const tok of ["K5", "K6", "T5", "qp2"]) assert.ok(!new RegExp(`\\b${tok}\\b`).test(the.markdown), `DA37-AC-3 thẻ in token ${tok}`);
  const truoc = [await dem("asset_nodes"), await dem("project_link_rules")];
  const sai = the.bam.replace(/.$/, (c) => (c === "0" ? "1" : "0"));
  await assert.rejects(apTheLuat(db, { bam: sai, nguoi: "thử", noi: NOI2 }), /bam-lech/, "DA37-AC-3 băm lệch không bị từ chối");
  assert.deepEqual([await dem("asset_nodes"), await dem("project_link_rules")], truoc, "DA37-AC-3 băm lệch vẫn ghi");
  const kq = await apTheLuat(db, { bam: the.bam, nguoi: "thử", noi: NOI2 });
  RULE = kq.rule_id;
  assert.equal(kq.so, 2);
  const moi = (await db.query(`SELECT id::int, parent_id::int, node_type FROM asset_nodes WHERE meta -> 's16_khu_ids' ? 'q37-qp2/K5'`)).rows;
  assert.deepEqual(moi.map((r) => [r.parent_id, r.node_type]), [[P2, "subzone"]], "DA37-AC-3 khu K5 không thành đúng một nút subzone dưới dự án");
  assert.ok((await db.query(`SELECT 1 FROM asset_nodes WHERE id = $1 AND meta -> 's16_khu_ids' ? 'q37-qp2/K6'`, [NSAN])).rowCount, "DA37-AC-3 nút sẵn không nhận khu K6");
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM project_link_rules WHERE source = 'S16'`)).rows[0].n, 1);
  const nutSau = await dem("asset_nodes");
  await assert.rejects(apTheLuat(db, { bam: the.bam, nguoi: "thử", noi: NOI2 }), /bam-lech/);
  const lai = await dungTheLuat(db, { noi: NOI2 });
  assert.deepEqual((await apTheLuat(db, { bam: lai.bam, nguoi: "thử", noi: NOI2 })).khongDoi, true, "DA37-AC-3 áp lại không «không đổi»");
  assert.equal(await dem("asset_nodes"), nutSau, "DA37-AC-3 áp lại sinh nút mới");
  // Chiều đỏ: bản lệnh bỏ so băm → băm lệch vẫn ghi
  const goc = readFileSync(join(GOC, "pipeline/phan-khu-s16.mjs"), "utf8");
  const tam = join(tmpdir(), `phan-khu-s16-hong-${process.pid}.mjs`);
  writeFileSync(tam, goc.replace(/if \(the\.bam !== bam\) throw new Error\([^;]*\);/, "")
    .replaceAll('from "./lib/', `from "${pathToFileURL(join(GOC, "pipeline/lib")).href}/`).replace('from "pg"', `from "${pathToFileURL(join(GOC, "pipeline/node_modules/pg/lib/index.js")).href}"`));
  try {
    const hong = await import(pathToFileURL(tam).href);
    await db.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, 'q37-qp2', 'K7', 'Khu Bảy')`, [SNAP_DS]);
    const r = await hong.apTheLuat(db, { bam: "f".repeat(64), nguoi: "thử", noi: NOI2 }).catch((e) => e);
    assert.ok(!(r instanceof Error) && r.rule_id, "DA37-AC-3 chiều đỏ: bản bỏ so băm vẫn từ chối — thước không phân biệt «băm lệch»");
    await hong.daoTheLuat(db, { ruleId: r.rule_id, nguoi: "thử" });
    await db.query(`DELETE FROM stg_s16_khu WHERE du_an = 'q37-qp2' AND khu_id = 'K7'`);
  } finally { rmSync(tam, { force: true }); }
});

test("DA37-AC-6 (view, S09) sau áp thẻ luật: S09 xếp toà vào phân khu khác S16 thành một dòng đếm; chiều đỏ bỏ cặp S09", async () => {
  const dong = async () => (await db.query(`SELECT du_an, cap_nguon, loai, so FROM v_lech_cau_truc_s16 WHERE du_an = 'q37-qp2' ORDER BY 2, 3`)).rows;
  assert.deepEqual(await dong(), [{ du_an: "q37-qp2", cap_nguon: "S09-S16", loai: "phan-khu", so: 1 }],
    "DA37-AC-6 bảng đếm của dự án hai khác bảng kỳ vọng viết trước (thiếu cặp S09)");
  // Chiều đỏ: view bỏ nhánh S09-S16 → ca nêu «thiếu cặp S09»
  const goc = readFileSync(MIG111, "utf8");
  const v2 = goc.slice(goc.indexOf("-- ---- 2."));
  const nhanh = " WHERE EXISTS (SELECT 1 FROM v_s09_toa x JOIN registry_aliases s";
  assert.ok(v2.includes(nhanh), "đột biến AC-6: không thấy nhánh S09 trong 111");
  await db.query(v2.replace(nhanh, " WHERE false AND EXISTS (SELECT 1 FROM v_s09_toa x JOIN registry_aliases s"));
  assert.notDeepEqual(await dong(), [{ du_an: "q37-qp2", cap_nguon: "S09-S16", loai: "phan-khu", so: 1 }],
    "đối chứng AC-6: bỏ nhánh S09 mà bảng vẫn có cặp S09 — thước không phân biệt «thiếu cặp S09»");
  apTep(TEN, MIG111);
});

test("DA37-AC-4 sau áp: S16 thắng S09; sau đảo về phân khu S09; chiều đỏ xếp S09 trên S16", async () => {
  const nutK5 = (await db.query(`SELECT id::int FROM asset_nodes WHERE meta -> 's16_khu_ids' ? 'q37-qp2/K5'`)).rows[0].id;
  assert.deepEqual(await nutCua(bk(5)), { id: nutK5, nguon: "s16_phan_khu" }, "DA37-AC-4 S09 thắng S16 sau áp");
  const goc = readFileSync(MIG111, "utf8");
  await db.query(goc.slice(0, goc.indexOf("-- ---- 2.")).replace("COALESCE(pk16.id, cum.id, pk.id, b.region_node_id)", "COALESCE(cum.id, pk.id, pk16.id, b.region_node_id)"));
  assert.notEqual((await nutCua(bk(5))).id, nutK5, "DA37-AC-4 chiều đỏ: xếp S09 trên S16 mà toà vẫn ở phân khu S16");
  apTep(TEN, MIG111);
  await daoTheLuat(db, { ruleId: RULE, nguoi: "thử" });
  assert.deepEqual(await nutCua(bk(5)), { id: N09, nguon: "s09_phan_khu" }, "DA37-AC-4 sau đảo không về phân khu S09");
  const luat = (await db.query("SELECT dao_by, dao_at IS NOT NULL AS da FROM project_link_rules WHERE id = $1", [RULE])).rows[0];
  assert.deepEqual(luat, { dao_by: "thử", da: true }, "DA37-AC-3 dòng luật không ghi người đảo");
});

// ---- Task 3: S16 thắng khi căn S08 lệch toà (AC-5), lệch cấu trúc không thẻ (AC-6), dựng lại không sinh gì (AC-7) ----
import { KHU_A, KHU_B, NOI, DA, moiDuLieu, banDotBien } from "./s16-fixture.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { s16Ref } from "../lib/s16-danh-muc.mjs";
import { GHI_CHU_NGHI } from "../lib/s16-dung.mjs";

const MA_LECH = "Q12-11-05";
const phu37 = [];
after(async () => { for (const [c, ten] of phu37) { await c.end().catch(() => {}); await xoaDbThu(ten); } });
async function dbPhu(tag) {
  const ten = `${TEN}_${tag}`;
  const c = new pg.Client({ connectionString: await taoDbThu(ten) });
  await c.connect();
  phu37.push([c, ten]);
  return c;
}
const chay37 = (c, m = { dung }) => m.dung(c, { khuSlugs: [KHU_A, KHU_B], isoTheo: () => "VN-HN", noiS09: {}, noiS16: NOI, log: () => {}, runId: "da37-itest" });
// Thẻ lệch toà còn chờ từ DA33 (trên DB máy thu: 2 thẻ) — dựng sẵn trước lượt dựng đi sau.
const theCu = (c) => c.query(`INSERT INTO review_queue (item_type, item_id, title, evidence) VALUES ('entity_match', $1, 'S16: căn S08 cùng mã nằm ở toà khác', $2)`,
  [`s16:${s16Ref(DA, MA_LECH)}`, { nguon: "S16", loai: "can-lech-toa" }]);
async function tapMa(c, ma) {
  const giu = (await c.query(`SELECT a.source, CASE WHEN u.status = 'merged' THEN u.merged_into ELSE u.unit_key END AS song
                                FROM registry_aliases a JOIN units u ON u.unit_key = a.object_key
                               WHERE a.kind = 'ma_nguon' AND a.retired_at IS NULL
                                 AND ((a.source = 'S08' AND a.value = $1) OR (a.source = 'S16' AND a.value = $2))`, [`q8/${ma}`, `${DA}/${ma}`])).rows;
  const song = [...new Set(giu.map((r) => r.song))];
  const toa = song.length === 1 ? (await c.query("SELECT building_key, status FROM units WHERE unit_key = $1", [song[0]])).rows[0] : null;
  const the = (await c.query(`SELECT status, decision_note FROM review_queue WHERE item_id = $1 ORDER BY id`, [`s16:${s16Ref(DA, ma)}`])).rows;
  return { song: song.length, song_active: toa?.status === "active", s08: giu.filter((r) => r.source === "S08").length,
    s16: giu.filter((r) => r.source === "S16").length, the };
}
const TAP_MONG = { song: 1, song_active: true, s08: 1, s16: 1, the: [{ status: "rejected", decision_note: GHI_CHU_NGHI }] };

let cA, cB;
test("DA37-AC-5 S08 trước rồi S16, và S16 trước rồi S08: một căn sống mang đủ bí danh, thẻ cũ cho nghỉ, không thẻ mới", async () => {
  cA = await dbPhu("a");
  await moiDuLieu(cA, { s16: false }); await chay37(cA); await theCu(cA);
  await moiDuLieu(cA, { s08: false }); await chay37(cA);
  cB = await dbPhu("b");
  await moiDuLieu(cB, { s08: false }); await chay37(cB); await theCu(cB);
  await moiDuLieu(cB, { s16: false }); await chay37(cB);
  const [a, b] = [await tapMa(cA, MA_LECH), await tapMa(cB, MA_LECH)];
  assert.deepEqual(a, TAP_MONG, "DA37-AC-5 S08 trước: tập mã lệch toà khác kỳ vọng");
  assert.deepEqual(b, TAP_MONG, "DA37-AC-5 S16 trước: tập mã lệch toà khác kỳ vọng");
  // S4-r1 t3: hai thứ tự cùng ra căn S08 gộp vào căn S16, nên cùng một dòng đếm lệch toà
  const lv = async (c) => (await c.query(`SELECT du_an, cap_nguon, loai, so FROM v_lech_cau_truc_s16 WHERE loai = 'can-lech-toa'`)).rows;
  const mongLv = [{ du_an: DA, cap_nguon: "S08-S16", loai: "can-lech-toa", so: 1 }];
  assert.deepEqual([await lv(cA), await lv(cB)], [mongLv, mongLv], "DA37-AC-5 hai thứ tự cho bảng đếm lệch toà khác nhau");
  const goc08 = async (c) => (await c.query(`SELECT u.status, u.building_key <> m.building_key AS khac_toa FROM units u
      JOIN registry_aliases a ON a.object_key = u.unit_key JOIN units m ON m.unit_key = u.merged_into
     WHERE a.source = 'S08' AND a.value = $1`, [`q8/${MA_LECH}`])).rows;
  assert.deepEqual(await goc08(cB), [{ status: "merged", khac_toa: true }], "DA37-AC-5 S16 trước: căn S08 không đúc ở toà S08 rồi gộp");
  const u08 = (await cA.query(`SELECT u.status, u.merged_into FROM units u JOIN registry_aliases a ON a.object_key = u.unit_key
                                 WHERE a.source = 'S08' AND a.value = $1`, [`q8/${MA_LECH}`])).rows[0];
  const u16 = (await cA.query(`SELECT object_key FROM registry_aliases WHERE source = 'S16' AND value = $1`, [`${DA}/${MA_LECH}`])).rows[0].object_key;
  assert.deepEqual([u08.status, u08.merged_into], ["merged", u16], "DA37-AC-5 căn S08 không gộp vào căn S16");
  const moi = (await cA.query(`SELECT count(*)::int AS n FROM review_queue WHERE evidence ->> 'loai' = 'can-lech-toa'`)).rows[0].n;
  assert.equal(moi, 1, "DA37-AC-5 có thẻ lệch toà mới ngoài thẻ cũ");
});

test("DA37-AC-5 chiều đỏ: giữ nhánh «lệch → thẻ» của DA33 thì ca nêu thẻ lệch mới", async () => {
  const c = await dbPhu("d5");
  await moiDuLieu(c, { s16: false }); await chay37(c);
  await moiDuLieu(c, { s08: false });
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [["      gop.push({ cu: cu.unit_key, vCan, ref: s16Ref(du_an, ma) });\n    }",
      "      tk.the_moi += await theDuyet(c, s16Ref(du_an, ma), \"x\", { loai: \"can-lech-toa\" });\n      continue;\n    }"]] },
  ], (m) => chay37(c, m));
  const moi = (await c.query(`SELECT count(*)::int AS n FROM review_queue WHERE evidence ->> 'loai' = 'can-lech-toa' AND status = 'pending'`)).rows[0].n;
  assert.equal(moi, 1, "đối chứng Q-B: đột biến giữ nhánh thẻ mà không có thẻ lệch mới — thước không phân biệt «thẻ lệch mới»");
});

test("DA37-AC-6 (thẻ) 0 thẻ lệch cấu trúc mới ở dự án có S16; đối chứng dương: thẻ toà khớp nhiều vẫn ra", async () => {
  const loai = (await cA.query(`SELECT evidence ->> 'loai' AS l, status, count(*)::int AS n FROM review_queue GROUP BY 1, 2 ORDER BY 1, 2`)).rows;
  assert.ok(!loai.some((r) => r.l === "can-lech-toa" && r.status === "pending"), "DA37-AC-6 còn thẻ lệch toà chờ ở dự án có S16");
  assert.ok(loai.some((r) => r.l === "toa-khop-nhieu" && r.n >= 1), "DA37-AC-6 đối chứng dương: thẻ toà khớp nhiều (không thuộc Q-B) không còn ra");
  const lech = (await cA.query(`SELECT du_an, cap_nguon, loai, so FROM v_lech_cau_truc_s16 WHERE loai = 'can-lech-toa'`)).rows;
  assert.deepEqual(lech, [{ du_an: DA, cap_nguon: "S08-S16", loai: "can-lech-toa", so: 1 }], "DA37-AC-6 view không đếm căn S08 đã gộp");
});

// S4-r1 t9: đối chứng dương ở dự án KHÔNG có S16 — luật 1 (lệch → thẻ) vẫn chạy: toà S09 khớp hai toà danh bạ ra đúng một thẻ.
// Ở dự án không S16 không có đường lệch S08 ↔ S16, nên dùng loại lệch cấu trúc mà luật 1 còn sinh thẻ ở mọi dự án (bước S09).
const KHU_X = "q-khu-x09";
async function duAnKhongS16(c) {
  const k = (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q Khu X', $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [KHU_X])).rows[0].id;
  for (const n of [1, 2]) {
    const b = `bld_${String(700 + n).padStart(26, "0")}`;
    await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                   VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [b, k]);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QX1', 'S08')`, [b]);
  }
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q37-x09', 'vn', 'S09', '{}')`);
  await c.query(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('q37-x09', 'px', 'du-an', $1)`,
    [{ chiTiet: { meta: { code: "200" }, data: { id: "px", insight_by_sector: [{ sector_id: "sx", sector_name: "Q PK X", type: "HIGH_RISE" }],
      insight_by_block: [{ id: "bx", block_code: "QX1", block_name: "QX1", sector_uuid: "sx" }] } } }]);
}
const chayX = (c, m = { dung }) => m.dung(c, { khuSlugs: [KHU_X], isoTheo: () => "VN-HN", noiS09: { px: KHU_X }, noiS16: NOI, log: () => {}, runId: "da37-x09" });
const theX = async (c) => (await c.query(`SELECT count(*)::int AS n FROM review_queue WHERE item_id LIKE 's09-toa:px/%' AND status = 'pending'`)).rows[0].n;

test("DA37-AC-6 đối chứng dương: dự án không S16, toà S09 khớp hai toà → đúng một thẻ; chiều đỏ chặn thẻ mọi dự án", async () => {
  const c = await dbPhu("x09");
  await duAnKhongS16(c);
  await chayX(c);
  assert.equal((await c.query("SELECT count(*)::int AS n FROM registry_aliases WHERE source = 'S16'")).rows[0].n, 0, "fixture: dự án X có S16");
  assert.equal(await theX(c), 1, "DA37-AC-6 đối chứng dương: dự án không S16 không ra đúng một thẻ lệch");
  const c2 = await dbPhu("x09d");
  await duAnKhongS16(c2);
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s09-dung.mjs", thay: [["async function theDuyet(c, itemId, title, evidence) {", "async function theDuyet(c, itemId, title, evidence) {\n  return 0;"]] },
  ], (m) => chayX(c2, m));
  assert.equal(await theX(c2), 0, "đối chứng AC-6: chặn thẻ mọi dự án mà vẫn có thẻ — thước không phân biệt «mất thẻ ngoài dự án S16»");
});

test("DA37-AC-7 dựng lại hai lần (S08 trước và S16 trước): 0 khoá mới, 0 thẻ mới, cột gốc của toà không đổi, thẻ mơ hồ không đổi", async () => {
  const anh = async (c) => (await c.query(`SELECT
      (SELECT md5(string_agg(building_key || ':' || region_node_id, ',' ORDER BY building_key)) FROM buildings) AS toa,
      (SELECT count(*) FROM units) AS can, (SELECT count(*) FROM stacks) AS truc, (SELECT count(*) FROM registry_aliases) AS bd,
      (SELECT md5(string_agg(item_id || ':' || status, ',' ORDER BY id)) FROM review_queue) AS the`)).rows[0];
  for (const [c, ten] of [[cA, "S08 trước"], [cB, "S16 trước"]]) {
    const truoc = await anh(c);
    await chay37(c); await chay37(c);
    assert.deepEqual(await anh(c), truoc, `DA37-AC-7 ${ten}: dựng lại sinh khoá/thẻ mới hoặc đổi cột gốc`);
  }
});

test("DA37-AC-7 chiều đỏ: đúc lại căn S16 khi đã có bí danh thì lần hai có khoá mới", async () => {
  const truoc = (await cA.query("SELECT count(*)::int AS n FROM units")).rows[0].n;
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [["if (s16.has(vCan)) { tk.can_da_co++; continue; }", ""]] },
  ], async (m) => {
    // Đỏ ở một trong hai dạng: đúc thêm căn, hoặc ràng buộc bí danh duy nhất chặn cả giao dịch (khoá mới ở lần hai).
    const loi = await chay37(cA, m).then(() => null, (e) => e);
    const sau = (await cA.query("SELECT count(*)::int AS n FROM units")).rows[0].n;
    assert.ok(loi?.constraint === "registry_aliases_ma_nguon_uq" || sau > truoc,
      "đối chứng AC-7: đột biến đúc lại mà không có khoá mới ở lần hai — thước không phân biệt «khoá mới ở lần hai»");
  });
});

// ---- Task 4: job đêm dựng mọi khu đã có toà và in mốc (AC-8) ----
import { buocVatTheDem } from "../danh-ba-vat-the.mjs";

// Ma trận viết trước của tập khu (S4-r1 t6): toà treo thẳng dưới dự án (A, B, C), dưới phân khu (D), dưới nút toà của phân khu (E);
// dự án không toà (F) không vào tập.
const KHU5 = [KHU_A, KHU_B, "q-khu-c", "q-khu-d", "q-khu-e"].sort();
async function namKhu(c) {
  const nut = async (type, slug, parent = null) => (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
    VALUES ($1, $2, $2, $3, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [type, slug, parent])).rows[0].id;
  const toa = async (n, r) => c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [`bld_${String(800 + n).padStart(26, "0")}`, r]);
  await toa(1, (await c.query("SELECT id FROM asset_nodes WHERE slug = $1", [KHU_B])).rows[0].id);
  await toa(2, await nut("project", "q-khu-c"));
  await toa(3, await nut("subzone", "q-khu-d-pk", await nut("project", "q-khu-d")));
  await toa(4, await nut("building", "q-khu-e-toa", await nut("subzone", "q-khu-e-pk", await nut("project", "q-khu-e"))));
  await nut("project", "q-khu-f");
}

test("DA37-AC-8 job đêm: tập khu = năm khu viết trước; in «S16: khoá mới n, mốc t» khớp created_at; không mới → khoá mới 0", async () => {
  const c = await dbPhu("dem");
  await moiDuLieu(c, { s16: false }); await chay37(c);          // khu A có toà từ S08
  await namKhu(c);                                               // B, C, D, E có toà; F không
  await moiDuLieu(c, { s08: false });                            // bản thu S16 mới tới, chưa dựng
  const dong = []; let khuDung;
  const boc = (cc, o) => { khuDung = [...o.khuSlugs].sort(); return dung(cc, { ...o, isoTheo: () => "VN-HN", noiS09: {}, noiS16: NOI }); };
  await buocVatTheDem(c, { log: (s) => dong.push(s), dungFn: boc });
  const thieu = KHU5.filter((k) => !khuDung.includes(k)), thua = khuDung.filter((k) => !KHU5.includes(k));
  assert.deepEqual({ thieu, thua }, { thieu: [], thua: [] }, `DA37-AC-8 job đêm dựng sai tập khu — thiếu ${thieu.join(", ")}, thừa ${thua.join(", ")}`);
  const moc = dong.find((s) => s.startsWith("S16: khoá mới"));
  assert.ok(moc, "DA37-AC-8 thiếu dòng mốc S16");
  const [, n, t] = moc.match(/^S16: khoá mới (\d+), mốc (\S+)$/);
  // Đếm độc lập: toà, trục, căn mang bí danh S16 có created_at đúng bằng mốc in ra
  const dem16 = (await c.query(`SELECT count(*)::int AS n FROM (
      SELECT building_key AS k, created_at FROM buildings UNION ALL SELECT stack_key, created_at FROM stacks
      UNION ALL SELECT unit_key, created_at FROM units) x
     WHERE x.created_at = $1 AND x.k IN (SELECT object_key FROM registry_aliases WHERE source = 'S16' AND kind = 'ma_nguon')`, [t])).rows[0].n;
  assert.ok(Number(n) > 0, "DA37-AC-8 lượt có bản thu S16 mới mà khoá mới 0");
  assert.equal(Number(n), dem16, "DA37-AC-8 số khoá mới in ra khác số dòng S16 mang đúng mốc");
  const dong2 = [];
  await buocVatTheDem(c, { log: (s) => dong2.push(s), dungFn: boc });
  assert.ok(dong2.some((s) => /^S16: khoá mới 0, mốc /.test(s)), "DA37-AC-8 lượt không mới không in «khoá mới 0»");
  // Chiều đỏ: tập khu của bước đêm bỏ nhánh «toà dưới nút toà của phân khu» → ca nêu q-khu-e thiếu
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/danh-ba-vat-the.mjs", thay: [["COALESCE(CASE WHEN n.node_type = 'project' THEN n.slug END, p.slug, g.slug)",
      "COALESCE(CASE WHEN n.node_type = 'project' THEN n.slug END, p.slug)"]] },
  ], (m) => m.buocVatTheDem(c, { log: () => {}, dungFn: boc }));
  assert.deepEqual(KHU5.filter((k) => !khuDung.includes(k)), ["q-khu-e"], "đối chứng AC-8: bỏ nhánh khu ông mà ca không nêu q-khu-e thiếu");
});
