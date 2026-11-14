// danh-ba-s16.itest.mjs — hồ sơ nap-s16-vao-danh-ba (DA33): ca «DA33-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_s16_<pid> (và _b cho AC-7) ở :5433, tạo đầu tệp, xoá cuối tệp; tên qua danh sách cho phép
// oneinvest_dbv_* của db-thu-dbv.mjs; không đọc, không ghi DB `oneinvest`. Fixture tổng hợp viết trước (mã tiền tố Q).
// Ngoài glob test của CI (cần :5433); chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { rmSync, readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { FIXTURE } from "./s16-fixture.mjs";
import { CAU_CHEN_S16_ITEM, NOI_DU_AN_S16, chonToa, dongS16, napS16, s16Ref } from "../lib/s16-danh-muc.mjs";
import { dung } from "../danh-ba-vat-the.mjs";

export const TEN = `oneinvest_dbv_s16_${process.pid}`;
const SNAP = "q__s16__2026-11-14T000000000";
const MIG103 = join(GOC, "db/migrations/103_stg_s16.sql");
let db;

before(async () => {
  const u = await taoDbThu(TEN);
  db = new pg.Client({ connectionString: u });
  await db.connect();
});
const phu = []; // [client, tên] của các DB thử phụ (AC-7, chiều đỏ)
after(async () => {
  await db?.end().catch(() => {});
  for (const [c, ten] of phu) { await c.end().catch(() => {}); await xoaDbThu(ten); }
  await xoaDbThu(TEN);
});
async function dbMoi(tag) {
  const ten = `${TEN}_${tag}`;
  const c = new pg.Client({ connectionString: await taoDbThu(ten) });
  await c.connect();
  phu.push([c, ten]);
  return c;
}

const bam = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
const luocDo = async (c) => (await c.query(
  `SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns
    WHERE table_name LIKE 'stg_s16%' OR table_name LIKE 'v_s16%' ORDER BY 1, 2`)).rows;
const rangBuoc = async (c) => (await c.query(
  `SELECT conname, pg_get_constraintdef(oid) AS d FROM pg_constraint
    WHERE conrelid::regclass::text IN ('registry_aliases') OR conrelid::regclass::text LIKE 'stg_s16%' ORDER BY 1`)).rows;

test("DA33-AC-1 nạp fixture 11 kind hai lần: lần một đúng số dòng, lần hai 0; url không host; 103 áp lại không đổi lược đồ", async () => {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}'::jsonb)`, [SNAP]);
  const kq = dongS16(FIXTURE, SNAP);
  assert.deepEqual(kq.bo, { "thieu-source-id": 1, "kind-la": 1, "csv-loi": 1, "jsonl-loi": 1 }, "DA33-AC-1 đếm bỏ theo lý do");
  await db.query("BEGIN");
  const lan1 = await napS16(db, kq);
  await db.query("COMMIT");
  assert.deepEqual(lan1, { item: 11, khu: 3, toa: 3, can: 5 }, "DA33-AC-1 lần một");
  const lan2 = await napS16(db, kq);
  assert.deepEqual(lan2, { item: 0, khu: 0, toa: 0, can: 0 }, "DA33-AC-1 nạp lại ghi thêm dòng");
  const { rows: url } = await db.query("SELECT count(*)::int AS n FROM stg_s16_item WHERE payload::text ~ '\"url\": ?\"[a-z]+://'");
  assert.equal(url[0].n, 0, "DA33-AC-1 url còn host");
  const truoc = bam([await luocDo(db), await rangBuoc(db)]);
  apTep(TEN, MIG103);
  assert.equal(bam([await luocDo(db), await rangBuoc(db)]), truoc, "DA33-AC-1 103 áp lần hai đổi lược đồ");
});

test("DA33-AC-1 bí danh nguồn S16 chèn được, S1A bị từ chối", async () => {
  const k = `bld_${"1".padStart(26, "0")}`;
  await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QX', 'S16')", [k]);
  await assert.rejects(
    db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QY', 'S1A')", [k]),
    (e) => e.code === "23514", "DA33-AC-1 nguồn S1A lọt ràng buộc");
});

test("DA33-AC-1 chiều đỏ: câu chèn không ON CONFLICT thì nạp lại lỗi khoá trùng", async () => {
  const cau = CAU_CHEN_S16_ITEM.replace(/ON CONFLICT DO NOTHING/, "");
  const r = dongS16(FIXTURE, SNAP).item[0];
  await assert.rejects(db.query(cau, [r.snapshot_id, r.source_id, r.kind, r.payload, r.fetched_at]),
    (e) => e.code === "23505", "DA33-AC-1 nạp lại: thiếu ON CONFLICT mà không lỗi");
});

// ---- AC-3 qua view: cùng ma trận năm ô như pipeline/lib/s16-danh-muc.test.mjs ----
const O = [
  { o: "ô1 khác-khu", dong: [["qv1", "k1", "QS2.08", "QS2.081101"], ["qv1", "k2", "QS2.08", "QS2.081101"]], ma: "QS2.081101" },
  { o: "ô2 hoa-thuong", dong: [["qv2", "k1", "QS2.08", "qs2.081101 "], ["qv2", "k1", "QS2.08", "QS2.081101"]], ma: "QS2.081101" },
  { o: "ô3 nhan-gom", dong: [["qv3", "k1", "QS2.05", "QS2.051101"], ["qv3", "k1", "QRAINBOW", "QS2.051101"]], ma: "QS2.051101" },
  { o: "ô4 hai-tien-to", dong: [["qv4", "k1", "QS2.05", "QS2.051101"], ["qv4", "k1", "QS2.0", "QS2.051101"]], ma: "QS2.051101" },
  { o: "ô5 khong-tien-to", dong: [["qv5", "k1", "QA", "QX1"], ["qv5", "k1", "QB", "QX1"]], ma: "QX1" },
];
test("DA33-AC-3 v_s16_can ra cùng kết quả với chonToa trên ma trận năm ô", async () => {
  for (const x of O) {
    for (const [du_an, khu, toa, ma] of x.dong) {
      await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                      VALUES ($1, $2, $3, NULL, $4, NULL, $5, 1) ON CONFLICT DO NOTHING`, [SNAP, du_an, khu, toa, ma]);
    }
    const { rows } = await db.query("SELECT ma_can, toa_ten, mo_ho FROM v_s16_can WHERE du_an = $1", [x.dong[0][0]]);
    assert.equal(rows.length, 1, `DA33-AC-3 ${x.o}: không phải một căn`);
    const js = chonToa(x.ma, x.dong.map((d) => d[2]));
    assert.equal(rows[0].mo_ho, "mo_ho" in js, `DA33-AC-3 ${x.o}: view và chonToa lệch về mơ hồ`);
    assert.equal(rows[0].toa_ten, js.toa ?? null, `DA33-AC-3 ${x.o}: view và chonToa lệch toà`);
  }
});


// ---- AC-4…AC-8: hai khu thử, S08 qua bước S08 của dung(), S16 ghi thẳng vào stg ----
const KHU_A = "q-khu-a", KHU_B = "q-khu-b";
const NOI = Object.freeze({ "da-a": KHU_A, "da-b": KHU_B });
const DA = "qx-da-a", DB = "qx-da-b", DC = "qx-da-c";
const S08_MA = ["Q12-11-01", "Q12-11-05"];
// [du_an, khu_id, toa_id, toa_ten, ma_can, tang]
const CAN = [
  [DA, "k1", "t1", "Q12", "Q12-11-01", null],     // c1 S08 cùng mã cùng toà → bí danh
  [DA, "k1", "t1", "Q12", "Q12-11-02", null],     // c2 toà thật + nhãn gom → Q12, căn mới có trục
  [DA, "k1", "t3", "QRAINBOW", "Q12-11-02", null],
  [DA, "k2", "t2", "Q34", "Q34-05-01", null],     // c3 toà mới Q34
  [DA, "k2", "t2", "Q34", "Q12-11-05", null],     // c4 S08 xếp Q12, S16 xếp Q34 → lệch toà
  [DA, "k2", "t2", "Q34", "QLO-07", null],        // c5 mã lô → căn không trục
  [DA, "k1", "t4", "QD1", "QD1-01-01", null],     // c6 toà khớp hai → không căn
  [DA, "k1", "t1", "Q12", "Q99-01-01", null],     // c7 không toà nào là tiền tố → mơ hồ
  [DA, "k2", "t2", "Q34", "Q99-01-01", null],
  [DA, "k2", "t2", "Q34", "Q34-15-03", "15A"],    // RF3 tầng hậu tố chữ
  [DA, "k2", "t2", "Q34", " Q34-15-04 ", null],   // RF3 khoảng trắng + hoa thường → một căn
  [DA, "k1", "t2", "Q34", "q34-15-04", null],
  [DB, "kb", "tb", "QB1", "QB1-01", null],
  [DC, "kc", "tc", "QC1", "QC1-01", null],
  [DC, "kc", "tc", "QC1", "QC1-02", null],
];
const TOA = [[DA, "k1", "t1", "Q12"], [DA, "k2", "t2", "Q34"], [DA, "k1", "t3", "QRAINBOW"], [DA, "k1", "t4", "QD1"],
  [DB, "kb", "tb", "QB1"], [DC, "kc", "tc", "QC1"]];
const TOKEN = [...new Set([...CAN.flatMap((r) => [r[1], r[2], r[3], r[4].trim()]), ...TOA.flatMap((r) => [r[1], r[2], r[3]])])];
const SNAP2 = "q__s16__2026-11-14T010000000";
const log = () => {};
const chay = (c, noiS16 = NOI) => dung(c, { khuSlugs: [KHU_A, KHU_B], isoTheo: () => "VN-HN", noiS09: {}, noiS16, log, runId: "da33-itest" });

async function moiDuLieu(c, { s08 = true, s16 = true } = {}) {
  const nut = async (slug, ten) => (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', $2, $1, '{}', '{}', 'SubdivisionName', '{}') ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id::int AS id`, [slug, ten])).rows[0].id;
  const a = await nut(KHU_A, "Q Khu A");
  await nut(KHU_B, "Q Khu B");
  if (!(await c.query("SELECT 1 FROM asset_nodes WHERE slug = 'q-khu-a-pk2'")).rowCount) {
    await c.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, meta) VALUES ('building', 'Q Khu 2', 'q-khu-a-pk2', $1, '{}', '{}')`, [a]);
    for (const n of [1, 2]) {
      const k = `bld_${String(900 + n).padStart(26, "0")}`;
      await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                     VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [k, a]);
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QD1', 'S08')`, [k]);
    }
  }
  if (s08) {
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q-s08', 'q', 'S08', '{}') ON CONFLICT DO NOTHING`);
    await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('q8', $1, 'noi') ON CONFLICT DO NOTHING`, [a]);
    for (const ma of S08_MA) {
      await c.query(`INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
                     VALUES ($1, 'q-s08', 'q8', 'high_rise', 'notSold', $2, NULL, '{}') ON CONFLICT DO NOTHING`, [`q8:${ma}`, ma]);
    }
  }
  if (s16) {
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}') ON CONFLICT DO NOTHING`, [SNAP2]);
    await c.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ($1, $2, 'k2', 'Q Khu 2') ON CONFLICT DO NOTHING`, [SNAP2, DA]);
    for (const [du_an, khu, toa_id, ten] of TOA) {
      await c.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, $3, $3, $4, $5)
                     ON CONFLICT DO NOTHING`, [SNAP2, du_an, khu, toa_id, ten]);
    }
    for (const [du_an, khu, toa_id, ten, ma, tang] of CAN) {
      await c.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 2) ON CONFLICT DO NOTHING`, [SNAP2, du_an, khu, toa_id, ten, tang, ma]);
    }
  }
}
const q = async (c, s, p = []) => (await c.query(s, p)).rows;
const mot = async (c, s, p = []) => (await c.query(s, p)).rows[0];
const doiTuong = async (c, v, src = "S16") => (await mot(c, "SELECT object_key FROM registry_aliases WHERE kind = 'ma_nguon' AND source = $2 AND value = $1", [v, src]))?.object_key;
const canCua = async (c, k) => mot(c, "SELECT unit_key, building_key, stack_key, floor, sub_id FROM units WHERE unit_key = $1", [k]);
async function anhVatThe(c) {
  return {
    can: await q(c, "SELECT unit_key, building_key, stack_key, floor FROM units ORDER BY 1"),
    toa: await q(c, "SELECT building_key, upi, region_node_id::int AS r FROM buildings ORDER BY 1"),
    bi_danh: await q(c, "SELECT object_key, kind, value, source FROM registry_aliases ORDER BY 1, 2, 3, 4"),
    the: await q(c, "SELECT item_id, evidence FROM review_queue ORDER BY 1"),
  };
}
async function trungKhoa(c) {
  return {
    ma_hai_doi_tuong: (await mot(c, `SELECT count(*)::int AS n FROM (SELECT value FROM registry_aliases WHERE kind = 'ma_nguon' AND source = 'S16'
                                      AND retired_at IS NULL GROUP BY value HAVING count(DISTINCT object_key) > 1) x`)).n,
    can_hai_bi_danh_s16: (await mot(c, `SELECT count(*)::int AS n FROM (SELECT object_key FROM registry_aliases WHERE kind = 'ma_nguon'
                                      AND source = 'S16' AND object_key LIKE 'unt_%' GROUP BY object_key HAVING count(*) > 1) x`)).n,
  };
}

let tk1, anh1, idPk2;
test("DA33-AC-4/5/6 dựng lần một trên hai khu đã nối", async () => {
  await moiDuLieu(db);
  idPk2 = (await mot(db, "SELECT id::int AS id FROM asset_nodes WHERE slug = 'q-khu-a-pk2'")).id;
  tk1 = (await chay(db)).s16;
  anh1 = await anhVatThe(db);
  assert.ok(tk1 && !tk1.bo_qua, "DA33 bước S16 không chạy");
});

test("DA33-AC-4 chỉ dự án đã nối vào danh bạ; dự án không nối được đếm", async () => {
  assert.deepEqual({ ...NOI_DU_AN_S16 }, {
    "ocean-park": "vinhomes-ocean-park-1", "ocean-park-2": "vinhomes-ocean-park-2", "ocean-park-3": "vinhomes-ocean-park-3",
    "smart-city": "vinhomes-smart-city", "grand-park": "vinhomes-grand-park",
  }, "DA33-AC-4 bảng nối khác năm cặp đã duyệt");
  const c = (await mot(db, "SELECT count(*)::int AS n FROM registry_aliases WHERE source = 'S16' AND value LIKE $1", [`${DC}/%`])).n;
  assert.equal(c, 0, "DA33-AC-4 dự án không nối có bí danh trong danh bạ");
  assert.ok(Object.values(tk1.bo_du_an).reduce((a, b) => a + b, 0) >= 2, "DA33-AC-4 không đếm căn bị bỏ của dự án không nối");
  assert.ok(await doiTuong(db, `${DB}/tb`), "DA33-AC-4 khu thứ hai đã nối không có toà");
});

test("DA33-AC-5 toà: khớp một → bí danh; không khớp có căn → đúc xac_minh; 0 căn → không đúc; khớp hai → thẻ", async () => {
  const q12 = await doiTuong(db, "q8/Q12", "S08");
  assert.ok(q12, "fixture: bước S08 phải đúc toà Q12");
  assert.equal(await doiTuong(db, `${DA}/t1`), q12, "DA33-AC-5 toà Q12 khớp một không nhận bí danh S16");
  const q34 = await doiTuong(db, `${DA}/t2`);
  const b = await mot(db, "SELECT catalog_tier, upi, region_node_id::int AS r FROM buildings WHERE building_key = $1", [q34]);
  assert.equal(b.catalog_tier, "xac_minh", "DA33-AC-5 bậc toà mới");
  assert.equal(b.upi, `urn:onehub:upi:1:VN:VN-HN:${q34}`, "DA33-AC-5 UPI toà mới");
  assert.equal(b.r, idPk2, "DA33-AC-5 nút vùng toà mới không phải phân khu trùng tên");
  assert.equal(await doiTuong(db, `${DA}/t3`), undefined, "DA33-AC-5 nhãn gom 0 căn thành toà");
  assert.equal(tk1.khu[KHU_A].toa_0_can, 1, "DA33-AC-5 không đếm toà 0 căn");
  assert.equal(await doiTuong(db, `${DA}/t4`), undefined, "DA33-AC-5 toà khớp hai được ghi");
  const the = await q(db, "SELECT evidence FROM review_queue WHERE evidence->>'loai' = 'toa-khop-nhieu'");
  assert.equal(the.length, 1, "DA33-AC-5 khớp hai không ra đúng một thẻ");
  assert.equal(the[0].evidence.khoa_toa.length, 2, "DA33-AC-5 thẻ không nêu hai khoá toà");
  assert.equal(tk1.khu[KHU_A].toa_moi, 1, "DA33-AC-5 số toà mới ở khu A");
  assert.equal((await trungKhoa(db)).ma_hai_doi_tuong, 0, "DA33-AC-5 toa_id làm bí danh hai toà");
});

test("DA33-AC-5/6 thẻ S16 không mang giá trị đăng nhập (đối chứng: token có trong stg)", async () => {
  const the = JSON.stringify(await q(db, "SELECT title, evidence, item_id FROM review_queue WHERE item_id LIKE 's16:%'"));
  assert.ok(the.length > 10, "DA33 không có thẻ S16 nào để soát");
  const stg = JSON.stringify(await q(db, "SELECT * FROM stg_s16_can"));
  for (const t of TOKEN) {
    assert.ok(stg.includes(t), `đối chứng: token ${t} phải có trong stg`);
    assert.ok(!new RegExp(`(^|[^A-Za-z0-9._-])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9._-]|$)`).test(the),
      `DA33-AC-5/6 thẻ mang giá trị đăng nhập ${t.length} ký tự`);
  }
});

test("DA33-AC-6 căn: S08 cùng toà → bí danh; lệch toà → thẻ; mới có trục/tầng; mã lô không trục; không trùng", async () => {
  const c1 = await doiTuong(db, "q8/Q12-11-01", "S08");
  assert.equal(await doiTuong(db, `${DA}/Q12-11-01`), c1, "DA33-AC-6 căn S08 cùng toà không nhận bí danh S16");
  assert.equal(await doiTuong(db, `${DA}/Q12-11-05`), undefined, "DA33-AC-6 căn lệch toà được ghi");
  assert.equal((await q(db, "SELECT 1 FROM review_queue WHERE evidence->>'loai' = 'can-lech-toa'")).length, 1, "DA33-AC-6 lệch toà không ra một thẻ");
  const c2 = await canCua(db, await doiTuong(db, `${DA}/Q12-11-02`));
  assert.ok(c2.stack_key, "DA33-AC-6 căn mới tách được không có trục");
  assert.equal(c2.floor, "11", "DA33-AC-6 tầng căn mới");
  assert.equal(c2.building_key, await doiTuong(db, "q8/Q12", "S08"), "DA33-AC-6 căn Q12-11-02 không vào toà Q12");
  const c5 = await canCua(db, await doiTuong(db, `${DA}/QLO-07`));
  assert.equal(c5.stack_key, null, "DA33-AC-6 mã lô có trục");
  assert.equal(c5.sub_id, c5.unit_key, "DA33-AC-6 mã lô sub_id");
  const c8 = await canCua(db, await doiTuong(db, `${DA}/Q34-15-03`));
  assert.equal(c8.floor, "15A", "RF3 tầng hậu tố chữ");
  assert.ok(await doiTuong(db, `${DA}/Q34-15-04`), "RF3 mã có khoảng trắng không thành căn");
  assert.equal((await q(db, "SELECT 1 FROM registry_aliases WHERE source = 'S16' AND upper(value) LIKE $1", [`${DA.toUpperCase()}/Q34-15-04`])).length, 1, "RF3 hai cách viết thành hai căn");
  assert.equal(await doiTuong(db, `${DA}/Q99-01-01`), undefined, "DA33-AC-6 căn mơ hồ được đúc");
  assert.equal(await doiTuong(db, `${DA}/QD1-01-01`), undefined, "DA33-AC-6 căn của toà khớp hai được đúc");
  assert.deepEqual(await trungKhoa(db), { ma_hai_doi_tuong: 0, can_hai_bi_danh_s16: 0 }, "DA33-AC-6 trùng khoá");
});

test("DA33-AC-8 dựng thêm hai lần: không sinh gì, băm vật thể bằng nhau", async () => {
  for (const lan of [2, 3]) {
    const tk = (await chay(db)).s16;
    const a = await anhVatThe(db);
    assert.equal(bam(a), bam(anh1), `DA33-AC-8 khoá mới ở lần ${lan}`);
    assert.equal(tk.khu[KHU_A].toa_moi + tk.khu[KHU_A].can_moi + tk.khu[KHU_A].the_moi, 0, `DA33-AC-8 khoá mới ở lần ${lan}`);
  }
});

test("RF4 DB chưa áp 103 → bước S16 bỏ qua có lý do", async () => {
  const { buocS16 } = await import("../lib/s16-dung.mjs");
  const nk = [];
  const fake = { query: async (s) => (s.includes("to_regclass") ? { rows: [{ t: null }] } : { rows: [] }) };
  assert.deepEqual(await buocS16(fake, { khu: new Map(), isoKhu: new Map(), log: (s) => nk.push(s) }), { bo_qua: "chua-ap-103" });
  assert.ok(nk.some((s) => s.includes("chưa áp 103")), "RF4 không in lý do");
});

// ---- Chiều đỏ: bản đột biến của s16-dung.mjs, chạy trong giao dịch trên DB đã dựng lần một rồi hoàn lại ----
async function dotBien(tu, thanh, chayFn) {
  const goc = join(GOC, "pipeline/lib/s16-dung.mjs");
  const src = readFileSync(goc, "utf8");
  assert.ok(src.includes(tu), `đột biến: không thấy đoạn «${tu.slice(0, 40)}»`);
  const tep = join(GOC, `pipeline/lib/.s16-dung.dotbien-${process.pid}-${Date.now()}.mjs`);
  writeFileSync(tep, src.replace(tu, thanh));
  try { return await chayFn(await import(tep)); } finally { rmSync(tep, { force: true }); }
}
async function trongGiaoDich(fn) {
  await db.query("BEGIN");
  try { return await fn(); } finally { await db.query("ROLLBACK"); }
}
const khuMap = async () => new Map((await q(db, "SELECT id::int AS id, slug FROM asset_nodes WHERE slug = ANY($1)", [[KHU_A, KHU_B]])).map((k) => [k.id, k]));

test("DA33-AC-5 chiều đỏ: chọn toà đầu khi khớp hai thì toà QD1 nhận bí danh", async () => {
  await dotBien("if (khop.length === 1 && (nhomTen.get(ten) ?? 0) === 1) {", "if (khop.length >= 1) {", async (m) => trongGiaoDich(async () => {
    const km = await khuMap();
    await m.buocS16(db, { khu: km, isoKhu: new Map([...km.keys()].map((id) => [id, "VN-HN"])), noi: NOI, log });
    assert.ok(await doiTuong(db, `${DA}/t4`), "DA33-AC-5 đột biến khớp-hai không làm toà QD1 nhận bí danh");
  }));
});

/**
 * Bản đột biến: chép các tệp vào cùng thư mục với tên tạm, thay đoạn mã, nối import giữa các bản chép; trả module của tệp đầu.
 * @param {Array<{ tep: string, thay: Array<[string, string]> }>} ds — đường tương đối gốc kho
 */
async function banDotBien(ds, chayFn) {
  const ten = ds.map((x, i) => ({ ...x, moi: x.tep.replace(/([^/]+)\.mjs$/, `.$1.db-${process.pid}-${Date.now()}-${i}.mjs`) }));
  try {
    for (const x of ten) {
      let src = readFileSync(join(GOC, x.tep), "utf8");
      for (const [a, b] of x.thay) {
        assert.ok(src.includes(a), `đột biến ${x.tep}: không thấy «${a.slice(0, 50)}»`);
        src = src.replace(a, b);
      }
      for (const y of ten) {
        if (y === x) continue;
        const rel = (t) => { const r = relative(dirname(x.tep), t); return r.startsWith(".") ? r : `./${r}`; };
        src = src.replaceAll(`"${rel(y.tep)}"`, `"${rel(y.moi)}"`);
      }
      writeFileSync(join(GOC, x.moi), src);
    }
    return await chayFn(await import(join(GOC, ten[0].moi)));
  } finally {
    for (const x of ten) rmSync(join(GOC, x.moi), { force: true });
  }
}
const chayVoi = (m, c) => m.dung(c, { khuSlugs: [KHU_A, KHU_B], isoTheo: () => "VN-HN", noiS09: {}, noiS16: NOI, log, runId: "da33-itest" });
async function theoMa(c, ma) {
  const can = await q(c, `SELECT DISTINCT object_key FROM registry_aliases WHERE kind = 'ma_nguon' AND object_key LIKE 'unt_%'
                           AND ((source = 'S08' AND value = $1) OR (source = 'S16' AND value = $2))`, [`q8/${ma}`, `${DA}/${ma}`]);
  const ca = await mot(c, `SELECT count(*) FILTER (WHERE source = 'S08')::int AS s08, count(*) FILTER (WHERE source = 'S16')::int AS s16
                             FROM registry_aliases WHERE object_key = $1 AND kind = 'ma_nguon'`, [can[0]?.object_key ?? ""]);
  const the = (await mot(c, "SELECT count(*)::int AS n FROM review_queue WHERE item_id = $1", [`s16:${s16Ref(DA, ma)}`])).n;
  return { so_can: can.length, s08: ca.s08, s16: ca.s16, the };
}
const toaTen = async (c, ten) => (await mot(c, `SELECT count(DISTINCT object_key)::int AS n FROM registry_aliases WHERE kind = 'ten' AND value = $1`, [ten])).n;

test("DA33-AC-7 dựng S16 trước rồi S08 cho cùng tập căn và thẻ như S08 trước", async () => {
  const c2 = await dbMoi("b");
  await moiDuLieu(c2, { s08: false });
  await chay(c2);
  await moiDuLieu(c2, { s16: false });
  await chay(c2);
  const cung = [await theoMa(db, "Q12-11-01"), await theoMa(c2, "Q12-11-01")];
  for (const [i, x] of cung.entries()) {
    assert.deepEqual(x, { so_can: 1, s08: 1, s16: 1, the: 0 }, `DA33-AC-7 thứ tự: mã cùng toà ở DB ${i + 1}`);
  }
  const lech = [await theoMa(db, "Q12-11-05"), await theoMa(c2, "Q12-11-05")];
  for (const [i, x] of lech.entries()) {
    assert.equal(x.so_can, 1, `DA33-AC-7 thứ tự: mã khác toà không đúng một căn ở DB ${i + 1}`);
    assert.equal(x.the, 1, `DA33-AC-7 lệch toà: không đúng một thẻ ở DB ${i + 1}`);
    assert.equal(x.s08 + x.s16, 1, `DA33-AC-7 lệch toà: căn mang cả hai bí danh ở DB ${i + 1}`);
  }
  assert.equal(await toaTen(c2, "Q12"), 1, "DA33-AC-7 thứ tự: toà Q12 bị đúc hai lần");
  assert.deepEqual(await trungKhoa(c2), { ma_hai_doi_tuong: 0, can_hai_bi_danh_s16: 0 });
});

test("DA33-AC-7 chiều đỏ: bỏ tra bí danh S16 trong bước S08 thì mã chung thành hai căn", async () => {
  const c = await dbMoi("d1");
  await moiDuLieu(c, { s08: false });
  await chay(c);
  await moiDuLieu(c, { s16: false });
  await banDotBien([{ tep: "pipeline/danh-ba-vat-the.mjs", thay: [["phanKhuTheoKhu, s16TheoKhu });", "phanKhuTheoKhu, s16TheoKhu: new Map() });"]] }],
    (m) => chayVoi(m, c));
  assert.equal((await theoMa(c, "Q12-11-01")).so_can, 2, "đối chứng thứ tự: đột biến không làm mã chung thành hai căn");
});

test("DA33-AC-7 chiều đỏ: bỏ kiểm toà trong bước S08 thì gắn bí danh lệch toà, 0 thẻ", async () => {
  const c = await dbMoi("d2");
  await moiDuLieu(c, { s08: false });
  await chay(c);
  await moiDuLieu(c, { s16: false });
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/danh-ba-vat-the.mjs", thay: [["if (canS16 && canS16.building_key !== t.key) {", "if (false) {"]] },
  ], (m) => chayVoi(m, c));
  const x = await theoMa(c, "Q12-11-05");
  assert.equal(x.the, 0, "đối chứng lệch toà: đột biến vẫn ra thẻ");
  assert.equal(x.s08 + x.s16, 2, "đối chứng lệch toà: đột biến không gắn bí danh lệch toà");
});

test("DA33-AC-6 chiều đỏ: bỏ tra căn S08 thì mã S08 cùng toà có căn trùng", async () => {
  const c = await dbMoi("d3");
  await moiDuLieu(c);
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [["const cu = canS08.get(ma);", "const cu = undefined;"]] },
  ], (m) => chayVoi(m, c));
  assert.equal((await theoMa(c, "Q12-11-01")).so_can, 2, "đối chứng căn S08: đột biến không sinh căn trùng mã");
});

test("DA33-AC-8 chiều đỏ: bỏ tra bí danh S16 trước khi đúc thì lần hai đúc thêm", async () => {
  const c = await dbMoi("d4");
  await moiDuLieu(c);
  const so = async () => (await mot(c, "SELECT count(*)::int AS n FROM units")).n;
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [["if (s16.has(vCan)) { tk.can_da_co++; continue; }", ""]] },
  ], async (m) => {
    await chayVoi(m, c);
    const n1 = await so();
    // Đỏ ở một trong hai dạng: lần hai đúc thêm căn, hoặc ràng buộc bí danh duy nhất chặn cả giao dịch (khoá mới ở lần hai).
    const loi = await chayVoi(m, c).then(() => null, (e) => e);
    assert.ok(loi?.constraint === "registry_aliases_ma_nguon_uq" || (await so()) > n1,
      "đối chứng dựng lại: đột biến không đúc thêm ở lần hai");
  });
});
