// thuoc-tinh-can-s16-rut.itest.mjs — hồ sơ thuoc-tinh-can-s16-rut-khi-mo-ho (DA48): căn S16 thành mơ hồ toà thì phát biểu cũ bị rút.
// DB thử oneinvest_dbv_rmh_<pid> dựng từ db/migrations (pipeline/scripts/db-thu-dbv.mjs), xoá khi xong. Phát biểu mồi và bước rút đều
// do chính lệnh pipeline/scripts/thuoc-tinh-can-s16.mjs chạy thật. Chiều đỏ chạy bản sao lệnh có một chỗ phá, trên cùng fixture.
// Chạy: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh db
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { GOC, taoDbThu, xoaDbThu } from "../scripts/db-thu-dbv.mjs";

const TEN = `oneinvest_dbv_rmh_${process.pid}`;
const LENH = join(GOC, "pipeline/scripts/thuoc-tinh-can-s16.mjs");
const DA = "q-rmh";
const BLD = `bld_${"6".padStart(26, "0")}`;
const can = (n) => `unt_${String(600 + n).padStart(26, "0")}`;
const LY_DO = "chuyen-mo-ho-toa";
const T = ["2026-11-18T01:00:00Z", "2026-11-19T01:00:00Z", "2026-11-20T01:00:00Z"];
let db;
let url;

const q = async (sql, p) => (await db.query(sql, p)).rows;
const chay = (args = [], tep = LENH) => {
  const r = spawnSync(process.execPath, [tep, ...args], { encoding: "utf8", env: { ...process.env, DATABASE_URL: url } });
  return { ma: r.status, ra: `${r.stdout}${r.stderr}` };
};
const ghiOk = (tep) => { const r = chay(["--ghi"], tep); assert.equal(r.ma, 0, `RMH lệnh --ghi lỗi: ${r.ra}`); return r.ra; };

function banPha(tu, sang) {
  const src = readFileSync(LENH, "utf8");
  assert.ok(src.includes(tu), `RMH chỗ phá không còn trong lệnh: ${tu}`);
  const tep = join(GOC, `pipeline/scripts/.rmh-pha-${process.pid}.mjs`);
  writeFileSync(tep, src.replace(tu, sang));
  return { tep, xoa: () => rmSync(tep, { force: true }) };
}

let soLan = 0;
async function thu(luc, dongs) {
  const snap = `q__rmh__${++soLan}`;
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1, 'vn', 'S16', $2, '{}')`, [snap, luc]);
  for (const [i, d] of dongs.entries()) {
    await db.query(`INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, toa, ma_can, dong, height_type, property_type, bedroom, bathroom,
        direction, balcony_direction, sale_price, area_using, area_building)
      VALUES ($1, $2, $3, $4, $5, 'HIGH_RISE', 'APARTMENT', $6, 1, '', 'NE', 0, $7, $8)`,
      [snap, DA, d.toa ?? "T1", d.ma, i, d.pn ?? 2, d.tt ?? 70, (d.tt ?? 70) + 5]);
  }
}
async function danhMoHo(ma) {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q__rmh__can', 'vn', 'S16', '{}') ON CONFLICT DO NOTHING`);
  for (const toa of ["ZZ1", "ZZ2"]) {
    await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha) VALUES ('q__rmh__can', $1, 'K', $2, $2, '10', $3, 1)`, [DA, toa, ma]);
  }
}
const DU = (bo = []) => ["QB1", "QB2", "QB3", "QB4"].filter((m) => !bo.includes(m)).map((ma) => ({ ma }));
const song = async (n) => (await q(`SELECT field, value FROM field_assertions WHERE resource_name = 'Unit' AND subject_key = $1 AND method = 'source_field'
    AND evidence ->> 'nguon' = 'S16' AND retracted_at IS NULL ORDER BY 1, 2`, [can(n)]));
const lyDoRut = async (n) => (await q(`SELECT DISTINCT retract_reason r FROM field_assertions WHERE subject_key = $1 AND retracted_at IS NOT NULL ORDER BY 1`, [can(n)])).map((x) => x.r);
const coView = async (n) => (await q(`SELECT 1 FROM v_unit_thuoc_tinh WHERE unit_key = $1`, [can(n)])).length > 0;

before(async () => {
  url = await taoDbThu(TEN);
  db = new pg.Client({ connectionString: url });
  await db.connect();
  const nut = (await q(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q RMH', 'q-rmh', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`))[0].id;
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [BLD, nut]);
  for (const [n, ma] of [[1, "QB1"], [2, "QB2"], [3, "QB3"], [4, "QB4"], [5, "QB5"]]) {
    await db.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, '10', $1, 'xac_minh')`, [can(n), BLD]);
    await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')`, [can(n), `${DA}/${ma}`]);
  }
});
beforeEach(async () => {
  // Bảng phát biểu chỉ thêm: mỗi ca cần sổ trống nên tắt trigger chặn TRUNCATE trên DB thử của lượt, rồi bật lại ngay.
  await db.query(`ALTER TABLE field_assertions DISABLE TRIGGER USER`);
  await db.query(`TRUNCATE field_assertions, stg_s16_can_chi_tiet, stg_s16_can`);
  await db.query(`ALTER TABLE field_assertions ENABLE TRIGGER USER`);
  await db.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE 'q__rmh__%'`);
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

/** Lần thu 1 đủ bốn căn; lần thu 2: QB2 vào nhóm mo_ho của v_s16_can, QB3 ở hai toà trong snapshot, QB4 đổi diện tích. */
async function haiLanThu(tep) {
  await thu(T[0], DU());
  ghiOk();
  await danhMoHo("QB2");
  await thu(T[1], [{ ma: "QB1" }, { ma: "QB2" }, { ma: "QB3", toa: "T1" }, { ma: "QB3", toa: "T2" }, { ma: "QB4", tt: 82 }]);
  return ghiOk(tep);
}

test("RMH-AC-1 căn thành mơ hồ (nhóm mo_ho và hai toà trong snapshot) mất mọi phát biểu S16, lý do riêng, view không còn dòng", async () => {
  await thu(T[0], DU());
  ghiOk();
  for (const n of [2, 3]) assert.ok((await song(n)).length > 0, `RMH-AC-1 đối chứng: căn ${n} phải có phát biểu trước lần thu sau`);
  await danhMoHo("QB2");
  await thu(T[1], [{ ma: "QB1" }, { ma: "QB2" }, { ma: "QB3", toa: "T1" }, { ma: "QB3", toa: "T2" }, { ma: "QB4", tt: 82 }]);
  ghiOk();
  for (const n of [2, 3]) {
    assert.deepEqual(await song(n), [], `RMH-AC-1 căn ${n} còn phát biểu S16 sống`);
    assert.deepEqual(await lyDoRut(n), [LY_DO], `RMH-AC-1 căn ${n} sai lý do rút`);
    assert.equal(await coView(n), false, `RMH-AC-1 căn ${n} còn dòng trong v_unit_thuoc_tinh`);
  }
});

test("RMH-AC-1 chiều đỏ: bản lệnh bỏ bước rút để lại phát biểu cũ", async () => {
  const { tep, xoa } = banPha("rut = await rutMoHo(c, kq.can_mo_ho);", "");
  try {
    await haiLanThu(tep);
    assert.ok((await song(2)).length > 0, "RMH-AC-1 bản phá vẫn rút — phép đo không phân biệt");
  } finally { xoa(); }
});

test("RMH-AC-2 chỉ rút phần S16 của căn mơ hồ: căn thường giữ nguyên, nguồn khác còn sống, căn đổi giá trị mang lý do thường", async () => {
  await thu(T[0], DU());
  ghiOk();
  const truoc = await song(1);
  assert.ok(truoc.length > 0, "RMH-AC-2 đối chứng: căn thường phải có phát biểu");
  const khac = (await q(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
    VALUES ('Unit', $1, 'bedrooms', '5', 'fact', 'hitl', '{"nguon":"S99"}', $2) RETURNING id`, [can(2), T[0]]))[0].id;
  await danhMoHo("QB2");
  await thu(T[1], [{ ma: "QB1" }, { ma: "QB2" }, { ma: "QB3" }, { ma: "QB4", tt: 82 }]);
  ghiOk();
  assert.deepEqual(await song(1), truoc, "RMH-AC-2 căn không đổi nhóm bị đổi tập phát biểu");
  assert.equal((await q(`SELECT retracted_at FROM field_assertions WHERE id = $1`, [khac]))[0].retracted_at, null, "RMH-AC-2 phát biểu nguồn khác bị rút");
  assert.deepEqual(await lyDoRut(4), ["thay-boi-lan-thu-sau"], "RMH-AC-2 căn đổi giá trị sai lý do rút");
});

test("RMH-AC-2 chiều đỏ: bản lệnh bỏ lọc nguồn rút cả phát biểu nguồn khác", async () => {
  const { tep, xoa } = banPha("AND evidence ->> 'nguon' = $1 AND retracted_at IS NULL AND subject_key = ANY($2::text[])", "AND $1::text IS NOT NULL AND retracted_at IS NULL AND subject_key = ANY($2::text[])");
  try {
    await thu(T[0], DU());
    ghiOk();
    const khac = (await q(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
      VALUES ('Unit', $1, 'bedrooms', '5', 'fact', 'source_field', '{"nguon":"S99"}', $2) RETURNING id`, [can(2), T[0]]))[0].id;
    await danhMoHo("QB2");
    await thu(T[1], DU());
    ghiOk(tep);
    assert.notEqual((await q(`SELECT retracted_at FROM field_assertions WHERE id = $1`, [khac]))[0].retracted_at, null, "RMH-AC-2 bản phá không rút nguồn khác — phép đo không phân biệt");
  } finally { xoa(); }
});

test("RMH-AC-3 chạy lại cùng lần thu và lần thu mới mà căn vẫn mơ hồ: rút 0, chèn 0 cho căn đó", async () => {
  await haiLanThu();
  const dem = async () => (await q(`SELECT count(*)::int n FROM field_assertions WHERE subject_key = $1`, [can(2)]))[0].n;
  const n0 = await dem();
  assert.match(ghiOk(), /rut_mo_ho 0 can 0 phat_bieu/, "RMH-AC-3 chạy lại vẫn báo còn phát biểu để rút");
  assert.equal(await dem(), n0, "RMH-AC-3 chạy lại đổi số dòng của căn");
  await thu(T[2], [{ ma: "QB1" }, { ma: "QB2" }]);
  assert.match(ghiOk(), /rut_mo_ho 0 can 0 phat_bieu/, "RMH-AC-3 lần thu mới vẫn báo rút căn đã rút");
  assert.equal(await dem(), n0, "RMH-AC-3 lần thu mới chèn lại phát biểu cho căn vẫn mơ hồ");
});

test("RMH-AC-3 chiều đỏ: bản lệnh bỏ điều kiện còn sống vẫn đếm phát biểu đã rút", async () => {
  await haiLanThu();
  const { tep, xoa } = banPha("AND evidence ->> 'nguon' = $1 AND retracted_at IS NULL AND", "AND evidence ->> 'nguon' = $1 AND");
  try {
    assert.doesNotMatch(chay([], tep).ra, /rut_mo_ho 0 can 0 phat_bieu/, "RMH-AC-3 bản phá vẫn báo rút 0 — phép đo không phân biệt");
  } finally { xoa(); }
});

test("RMH-AC-4 chạy thử báo đúng số sẽ rút, chỉ đếm căn còn phát biểu, không đổi DB", async () => {
  await thu(T[0], DU());
  ghiOk();
  await danhMoHo("QB2");
  await danhMoHo("QB5"); // mơ hồ nhưng chưa từng có phát biểu: không được đếm
  await thu(T[1], DU());
  const bam = async () => (await q(`SELECT md5(string_agg(id::text || coalesce(retract_reason, ''), ',' ORDER BY id)) b FROM field_assertions`))[0].b;
  const truoc = await bam();
  const r = chay();
  assert.equal(r.ma, 0, r.ra);
  const phat = (await song(2)).length;
  assert.ok(phat > 0, "RMH-AC-4 đối chứng: căn mơ hồ phải còn phát biểu");
  assert.match(r.ra, new RegExp(`rut_mo_ho 1 can ${phat} phat_bieu`), "RMH-AC-4 dòng rut_mo_ho sai số");
  assert.equal(await bam(), truoc, "RMH-AC-4 chạy thử đổi DB");
});

test("RMH-AC-4 lỗi ở bước chèn thì phát biểu đã rút được hoàn lại; chiều đỏ: bản bỏ giao dịch để lại phần rút dở", async () => {
  await db.query(`CREATE OR REPLACE FUNCTION rmh_loi() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'rmh-loi-cay'; END $$`);
  const cay = () => db.query(`CREATE TRIGGER rmh_loi BEFORE INSERT ON field_assertions FOR EACH ROW WHEN (NEW.value = '91') EXECUTE FUNCTION rmh_loi()`);
  const go = () => db.query(`DROP TRIGGER IF EXISTS rmh_loi ON field_assertions`);
  await thu(T[0], DU());
  ghiOk();
  await danhMoHo("QB2");
  await thu(T[1], [{ ma: "QB1", tt: 91 }, { ma: "QB2" }]);
  await cay();
  try {
    const r = chay(["--ghi"]);
    assert.notEqual(r.ma, 0, "RMH-AC-4 cấy lỗi mà lệnh vẫn thoát 0");
    assert.match(r.ra, /rmh-loi-cay/, "RMH-AC-4 lệnh đỏ vì lỗi khác lỗi cấy");
    assert.ok((await song(2)).length > 0, "RMH-AC-4 lỗi giữa chừng mà phần rút không được hoàn lại");
    const { tep, xoa } = banPha(`if (coGhi) await c.query("BEGIN");`, "");
    try {
      assert.notEqual(chay(["--ghi"], tep).ma, 0, "RMH-AC-4 bản phá phải đỏ vì lỗi cấy");
      assert.deepEqual(await song(2), [], "RMH-AC-4 bản bỏ giao dịch vẫn hoàn lại — phép đo không phân biệt");
    } finally { xoa(); }
  } finally { await go(); }
});

test("RMH-AC-5 hết mơ hồ ở lần thu sau thì có lại đúng các trường và dòng view", async () => {
  await thu(T[0], DU());
  ghiOk();
  const truoc = await song(2);
  await danhMoHo("QB2");
  await thu(T[1], DU());
  ghiOk();
  assert.deepEqual(await song(2), [], "RMH-AC-5 đối chứng: căn phải bị rút ở lần thu giữa");
  await db.query(`DELETE FROM stg_s16_can WHERE ma_can = 'QB2'`);
  await thu(T[2], DU());
  ghiOk();
  assert.deepEqual(await song(2), truoc, "RMH-AC-5 căn hết mơ hồ không có lại đúng các trường");
  assert.equal(await coView(2), true, "RMH-AC-5 căn hết mơ hồ không có dòng view");
});

test("RMH-AC-5 chiều đỏ: bản lệnh luôn coi căn là mơ hồ thì căn không có lại thuộc tính", async () => {
  const { tep, xoa } = banPha("if (g.nhieu_toa || moHo.has(khoaCan(g.du_an, g.ma)))", "if (g.ma === 'QB2' || g.nhieu_toa || moHo.has(khoaCan(g.du_an, g.ma)))");
  try {
    await thu(T[0], DU());
    ghiOk();
    await thu(T[2], DU());
    ghiOk(tep);
    assert.deepEqual(await song(2), [], "RMH-AC-5 bản phá vẫn có thuộc tính — phép đo không phân biệt");
  } finally { xoa(); }
});
