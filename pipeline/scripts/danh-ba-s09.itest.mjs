// danh-ba-s09.itest.mjs — hồ sơ toa-s09-hai-khu-vao-danh-ba (DA31): ca «DA31-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_s09_<pid> (đủ migration, có 097) và oneinvest_dbv_s09_<pid>_096 (tới 096) ở :5433, tạo đầu tệp, xoá
// cuối tệp; không đọc, không ghi DB `oneinvest`. Fixture tổng hợp viết trước (mã tiền tố Q), không payload thật.
// Ngoài glob test của CI (cần :5433); chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { CAU_CHEN_S09_ITEM, dongItemS09 } from "../lib/s09-du-an.mjs";

const TEN = `oneinvest_dbv_s09_${process.pid}`;
const TEN_096 = `${TEN}_096`;
const KHU = "q-khu-s09";
const NOI = Object.freeze({ qp: KHU });
const K = (n) => `bld_${String(n).padStart(26, "0")}`;
const SNAP = "q__s09-du-an__2026-11-13T000000000";

// ---- Fixture viết trước ----
const blk = (id, code, sector, ngay = null) => ({ id, block_code: code, block_name: code, sector_uuid: sector, handover_date_from: ngay });
const DU_AN = {
  id: "qp",
  insight_by_sector: [
    { sector_id: "sA", sector_name: "Q Phan Khu Co", type: "HIGH_RISE" },
    { sector_id: "sB", sector_name: "Q Phan Khu Moi", type: "HIGH_RISE" },
    { sector_id: "sC", sector_name: "Q Thap Tang", type: "LOW_RISE" },
  ],
  insight_by_block: [
    blk("b1", "QA1", "sB", "2027-01-01"),  // khớp đúng một toà S08 → bí danh
    blk("b2", "QN1", "sB"),                // không khớp → đúc
    blk("b3", "QD1", "sA"),                // khớp hai toà S08 → thẻ
    blk("b4", "QS2", undefined),           // một tên hai id, một bản không phân khu (dạng OS2)
    blk("b5", "QS2", "sB", "2026-06-30"),
    blk("b6", "QX9", undefined),           // không phân khu → cấp khu
    blk("b7", "S10.01", "sA"), blk("b8", "S10.02", "sA"), // cụm S10
    blk("b9", "GH1", "sA"),                // toà lẻ
    blk("b10", "S7.01", "sA"), blk("b11", "S7.02", "sB"), // cùng tiền tố khác phân khu
  ],
};
const ITEMS = [
  { sourceId: "danh-muc", kind: "danh-muc", fetchedAt: "2026-11-13T12:00:00Z", payload: { url: "q://danh-muc", soDuAn: 2 } },
  { sourceId: "du-an-qp", kind: "du-an", fetchedAt: "2026-11-13T12:01:00Z", meta: { duAnId: "khac" },
    payload: { url: "q://qp", danhMuc: { name: "Q" }, chiTiet: { meta: { code: "200" }, data: DU_AN } } },
  { sourceId: "du-an-qq", kind: "du-an", fetchedAt: "2026-11-13T12:02:00Z",
    payload: { chiTiet: { meta: { code: "200" }, data: { id: "qq", insight_by_block: [blk("c1", "QQ1", "sQ")],
      insight_by_sector: [{ sector_id: "sQ", sector_name: "Q Khac" }] } } } },
  { kind: "du-an", payload: { chiTiet: { meta: { code: "200" }, data: { id: "qr" } } } },
  { sourceId: "x-la", kind: "la", payload: {} },
  { sourceId: "du-an-qs", kind: "du-an", payload: { chiTiet: { meta: { code: "500" } } } },
];

let db, db096;
const nhatKy = [];
const log = (s) => nhatKy.push(s);
before(async () => {
  const [u, u096] = await Promise.all([taoDbThu(TEN), taoDbThu(TEN_096, { hetSo: 96 })]);
  db = new pg.Client({ connectionString: u });
  db096 = new pg.Client({ connectionString: u096 });
  await Promise.all([db.connect(), db096.connect()]);
  for (const c of [db, db096]) await moiKhu(c);
});
after(async () => {
  await Promise.all([db?.end().catch(() => {}), db096?.end().catch(() => {})]);
  await Promise.all([xoaDbThu(TEN), xoaDbThu(TEN_096)]);
});

/** Khu, một nút phân khu có sẵn (loại building, như GP «The Beverly»), bốn toà S08 tổng hợp kèm bí danh tên. */
async function moiKhu(c) {
  const khu = (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q Khu S09', $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [KHU])).rows[0].id;
  const co = (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, meta)
    VALUES ('building', 'Q Phan Khu Co', 'q-khu-s09-co', $1, '{"q phan khu co"}', '{}') RETURNING id::int AS id`, [khu])).rows[0].id;
  const toa = [[K(1), khu, "QA1"], [K(2), khu, "QD1"], [K(3), co, "QD1"], [K(4), khu, "QZ1"]];
  for (const [k, r, ten] of toa) {
    await c.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                   VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [k, r]);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', $2, 'S08')`, [k, ten]);
  }
  return { khu, co };
}
const idNut = async (c, slug) => (await c.query("SELECT id::int AS id FROM asset_nodes WHERE slug = $1", [slug])).rows[0]?.id;
const bam = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
async function anh(c) {
  const q = async (s) => (await c.query(s)).rows;
  return {
    toa: await q("SELECT building_key, upi, region_node_id::int AS r, catalog_tier FROM buildings ORDER BY 1"),
    nut: await q("SELECT id::int AS id, node_type, slug, parent_id::int AS p, meta FROM asset_nodes ORDER BY id"),
    bi_danh: await q("SELECT object_key, kind, value, source FROM registry_aliases ORDER BY 1, 2, 3, 4"),
    the: await q("SELECT item_type, item_id, evidence FROM review_queue ORDER BY 1, 2"),
  };
}
const chay = (c) => dung(c, { khuSlugs: [KHU], isoTheo: () => "VN-HN", noiS09: NOI, log, runId: "da31-itest" });
const toaCoBiDanh = async (c, v) =>
  (await c.query("SELECT object_key FROM registry_aliases WHERE kind = 'ma_nguon' AND source = 'S09' AND value = $1", [v])).rows[0]?.object_key;
const vungCua = async (c, k) => (await c.query("SELECT region_node_id::int AS r FROM buildings WHERE building_key = $1", [k])).rows[0]?.r;

test("DA31-AC-1 nạp item S09 hai lần: đúng số dòng hợp lệ, lần hai 0; khoá từ payload; view đủ bản ghi", async () => {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's09-du-an', '{}'::jsonb)`, [SNAP]);
  const { dong, bo } = dongItemS09(ITEMS, SNAP);
  assert.deepEqual(bo, { "thieu-source-id": 1, "kind-la": 1, "chi-tiet-loi": 1 }, "DA31-AC-1 đếm bỏ theo lý do");
  const nap = async () => {
    let n = 0;
    for (const d of dong) n += (await db.query(CAU_CHEN_S09_ITEM, [d.snapshot_id, d.source_id, d.kind, d.payload, d.fetched_at])).rowCount;
    return n;
  };
  assert.equal(await nap(), 3, "DA31-AC-1 lần một");
  assert.equal(await nap(), 0, "DA31-AC-1 nạp lại ghi thêm dòng");
  const { rows: pid } = await db.query("SELECT project_id, detail_ok FROM stg_s09_item WHERE source_id = 'du-an-qp'");
  assert.deepEqual(pid, [{ project_id: "qp", detail_ok: true }], "DA31-AC-1 project_id lấy từ meta");
  const { rows: toa } = await db.query("SELECT block_id, sector_id FROM v_s09_toa WHERE project_id = 'qp' ORDER BY block_id");
  assert.equal(toa.length, DU_AN.insight_by_block.length, "DA31-AC-1 v_s09_toa thiếu bản ghi");
  assert.equal(toa.find((t) => t.block_id === "b4").sector_id, null, "DA31-AC-1 toà không phân khu");
  const { rows: pk } = await db.query("SELECT count(*)::int AS n FROM v_s09_phan_khu WHERE project_id = 'qp'");
  assert.equal(pk[0].n, 3, "DA31-AC-1 v_s09_phan_khu");
  const { rows: meta } = await db.query(
    "SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'stg_s09_item' AND column_name = 'meta'");
  assert.equal(meta[0].n, 0, "DA31-AC-1 bảng lưu meta");
});

let truocToa, sau1;
test("DA31-AC-3 dựng: khớp một → bí danh, không khớp → đúc mot_loi_khai, khớp hai → một thẻ", async () => {
  truocToa = (await db.query("SELECT count(*)::int AS n FROM buildings")).rows[0].n;
  const tk = await chay(db);
  sau1 = await anh(db);
  assert.equal(await toaCoBiDanh(db, "qp/b1"), K(1), "DA31-AC-3 toà QA1 khớp một không nhận bí danh S09");
  // Bí danh ten: duy nhất theo (toà, giá trị) — tên S09 trùng tên S08 thì giữ một dòng; toà đúc có tên S09.
  const tenQA1 = (await db.query("SELECT value FROM registry_aliases WHERE object_key = $1 AND kind = 'ten'", [K(1)])).rows;
  assert.deepEqual(tenQA1.map((r) => r.value), ["QA1"], "DA31-AC-3 bí danh ten của QA1");
  const tenQN1 = (await db.query("SELECT value, source FROM registry_aliases WHERE object_key = $1 AND kind = 'ten'",
    [await toaCoBiDanh(db, "qp/b2")])).rows;
  assert.deepEqual(tenQN1, [{ value: "QN1", source: "S09" }], "DA31-AC-3 bí danh ten toà đúc");
  // Đúc: QN1, QS2, QX9, S10.01, S10.02, GH1, S7.01, S7.02 = 8; QD1 không đúc.
  assert.equal(sau1.toa.length - truocToa, 8, `DA31-AC-3 số toà đúc (${JSON.stringify(tk.s09)})`);
  const moi = sau1.toa.filter((t) => !/^bld_0+[1-4]$/.test(t.building_key));
  assert.ok(moi.every((t) => t.catalog_tier === "mot_loi_khai" && t.upi.endsWith(t.building_key)), "DA31-AC-3 bậc / UPI toà đúc");
  assert.equal(await toaCoBiDanh(db, "qp/b3"), undefined, "DA31-AC-3 QD1 khớp hai mà vẫn ghi toà");
  const the = sau1.the.filter((x) => x.item_id === "s09-toa:qp/QD1");
  assert.equal(the.length, 1, "DA31-AC-3 thẻ QD1");
  assert.deepEqual(the[0].evidence.building_keys, [K(2), K(3)], "DA31-AC-3 thẻ nêu hai khoá");
  const { rows: [x] } = await db.query(`SELECT
      (SELECT count(*) FROM (SELECT upi FROM buildings GROUP BY upi HAVING count(*) > 1) a)::int AS upi_trung,
      (SELECT count(*) FROM (SELECT building_key FROM buildings GROUP BY 1 HAVING count(DISTINCT upi) > 1) a)::int AS hai_upi,
      (SELECT count(*) FROM (SELECT value FROM registry_aliases WHERE kind = 'ma_nguon' AND source = 'S09'
                              GROUP BY value HAVING count(DISTINCT object_key) > 1) a)::int AS bi_danh_hai_toa`);
  assert.deepEqual(x, { upi_trung: 0, hai_upi: 0, bi_danh_hai_toa: 0 }, "DA31-AC-3 hai UPI / bí danh hai toà");
});

test("DA31-AC-4 phân khu: nút subzone con của khu, dùng lại nút có sẵn; nút vùng toà mới; toà S08 giữ nút, view trả phân khu", async () => {
  const khu = await idNut(db, KHU);
  const co = await idNut(db, "q-khu-s09-co");
  const pk = sau1.nut.filter((n) => n.p === khu);
  for (const ten of ["Q Phan Khu Moi", "Q Thap Tang"]) {
    const ds = sau1.nut.filter((n) => n.p === khu && n.meta?.s09_sector_ids);
    assert.equal(pk.filter((n) => n.slug === `${KHU}-${ten.toLowerCase().replaceAll(" ", "-")}`).length, 1, `DA31-AC-4 phân khu ${ten}`);
    assert.ok(ds.length >= 3);
  }
  assert.equal(sau1.nut.filter((n) => n.slug.startsWith(`${KHU}-q-phan-khu-co`)).length, 0, "DA31-AC-4 đúc thêm nút Q Phan Khu Co");
  assert.deepEqual(sau1.nut.find((n) => n.id === co).meta.s09_sector_ids, ["sA"], "DA31-AC-4 nút có sẵn không gắn phân khu S09");
  const sB = await idNut(db, `${KHU}-q-phan-khu-moi`);
  assert.equal(sau1.nut.find((n) => n.id === sB).node_type, "subzone");
  assert.equal(await vungCua(db, await toaCoBiDanh(db, "qp/b2")), sB, "DA31-AC-4 QN1 không ở phân khu");
  assert.equal(await vungCua(db, await toaCoBiDanh(db, "qp/b5")), sB, "DA31-AC-4 QS2 (dạng OS2) không ở phân khu");
  assert.equal(await toaCoBiDanh(db, "qp/b4"), await toaCoBiDanh(db, "qp/b5"), "DA31-AC-4 QS2 thành hai toà");
  assert.equal(await vungCua(db, await toaCoBiDanh(db, "qp/b6")), khu, "DA31-AC-4 QX9 không phân khu phải ở cấp khu");
  assert.equal(await vungCua(db, await toaCoBiDanh(db, "qp/b9")), co, "DA31-AC-4 GH1 ở phân khu có sẵn");
  // Toà S08 giữ region_node_id; view trả phân khu S09.
  assert.equal(await vungCua(db, K(1)), khu, "DA31-AC-4 toà S08 đổi region_node_id");
  const { rows: v } = await db.query("SELECT building_key, region_node_id::int AS r, nguon FROM v_toa_nut_vung ORDER BY 1");
  assert.equal(new Set(v.map((r) => r.building_key)).size, v.length, "DA31-AC-4 view có toà hai dòng");
  assert.equal(v.length, sau1.toa.length, "DA31-AC-4 view thiếu toà");
  assert.deepEqual(v.find((r) => r.building_key === K(1)), { building_key: K(1), r: sB, nguon: "s09_phan_khu" }, "DA31-AC-4 view QA1");
  assert.deepEqual(v.find((r) => r.building_key === K(4)), { building_key: K(4), r: khu, nguon: "goc" }, "DA31-AC-4 view toà không nối S09");
  const qs2 = await toaCoBiDanh(db, "qp/b4");
  assert.equal(v.find((r) => r.building_key === qs2).r, sB, "DA31-AC-4 view QS2 lấy bản có phân khu");
});

test("DA31-AC-10 cụm: S10 hai toà cùng phân khu → một nút cụm; GH1, S7, toà không dấu chấm → 0", async () => {
  const co = await idNut(db, "q-khu-s09-co");
  const cum = sau1.nut.filter((n) => n.meta?.s09_cum);
  assert.deepEqual(cum.map((n) => [n.meta.s09_cum, n.p, n.node_type]), [["S10", co, "subzone"]], "DA31-AC-10 ô S10 / ô khác");
  for (const b of ["qp/b7", "qp/b8"]) assert.equal(await vungCua(db, await toaCoBiDanh(db, b)), cum[0].id, `DA31-AC-10 ${b} không trỏ cụm`);
  assert.equal(cum.filter((n) => n.meta.s09_cum === "GH1").length, 0, "DA31-AC-10 ô GH1 ra nút");
  assert.equal(cum.filter((n) => n.meta.s09_cum === "S7").length, 0, "DA31-AC-10 ô S7 khác phân khu ra nút");
});

test("DA31-AC-5 dựng lần hai, ba: 0 khoá, nút, bí danh, thẻ mới; băm giống lần một", async () => {
  for (const lan of [2, 3]) {
    const tk = await chay(db);
    const a = await anh(db);
    assert.equal(bam(a), bam(sau1), `DA31-AC-5 khoá mới ở lần ${lan} (${JSON.stringify(tk.s09)})`);
    const s = tk.s09.khu[KHU];
    assert.equal(s.toa_moi + s.phan_khu_moi + s.cum_moi + s.the_moi, 0, `DA31-AC-5 tổng kết lần ${lan}`);
  }
});

test("DA31-AC-8 chưa áp 097 / khu không có dòng S09: bỏ qua có lý do, danh bạ không đổi", async () => {
  const truoc = bam(await anh(db096));
  nhatKy.length = 0;
  const tk = await dung(db096, { khuSlugs: [KHU], isoTheo: () => "VN-HN", noiS09: NOI, log, runId: "da31-itest" });
  assert.equal(tk.s09.bo_qua, "chua-ap-097");
  assert.ok(nhatKy.some((s) => /S09 bỏ qua — DB chưa áp 097/.test(s)), "DA31-AC-8 không in lý do");
  assert.equal(bam(await anh(db096)), truoc, "DA31-AC-8 danh bạ đổi khi chưa áp 097");

  const truoc2 = bam(await anh(db));
  nhatKy.length = 0;
  const tk2 = await dung(db, { khuSlugs: [KHU], isoTheo: () => "VN-HN", noiS09: { "q-khong-co": KHU }, log, runId: "da31-itest" });
  assert.deepEqual(tk2.s09.bo_qua_khu, [KHU]);
  assert.ok(nhatKy.some((s) => s.includes(`khu ${KHU} không có dòng S09`)), "DA31-AC-8 không in lý do khu");
  assert.equal(bam(await anh(db)), truoc2, "DA31-AC-8 danh bạ đổi khi khu không có dòng");
});

test("DA31-AC-9 097 áp hai lần không lỗi", () => {
  const tep = join(GOC, "db/migrations/097_stg_s09_item.sql");
  apTep(TEN, tep);
  apTep(TEN, tep);
});
