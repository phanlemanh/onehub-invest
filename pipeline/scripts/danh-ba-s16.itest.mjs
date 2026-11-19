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
import { CAU_CHEN_S16_ITEM, NOI_DU_AN_S16, chonToa, dongS16, duoiDuAn, napS16, s16Ref } from "../lib/s16-danh-muc.mjs";
import { dung } from "../danh-ba-vat-the.mjs";
import { tokenS16 } from "../lib/s16-soat.mjs";

export const TEN = `oneinvest_dbv_s16_${process.pid}`;
const SNAP = "q__s16__2026-11-14T000000000";
const MIG103 = join(GOC, "db/migrations/103_stg_s16.sql");
const MIG110 = join(GOC, "db/migrations/110_v_s16_can_nhanh.sql");
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

test("DA33-AC-1 nạp fixture 11 kind hai lần: lần một đúng số dòng, lần hai 0; url không host; 103 rồi 110 áp lại không đổi lược đồ", async () => {
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
  // 110 thay thân view v_s16_can của 103 mà giữ nguyên cột, nên băm cột không phân biệt hai bản: so cả định nghĩa view.
  const dinhNghia = async () => (await db.query("SELECT pg_get_viewdef('v_s16_can'::regclass) AS d")).rows[0].d;
  const viewTruoc = await dinhNghia();
  assert.match(viewTruoc, /LEFT JOIN t ON/, "DA33-AC-1 DB dựng từ migrations không mang view bản 110");
  const truoc = bam([await luocDo(db), await rangBuoc(db)]);
  apTep(TEN, MIG103);
  // Chiều đỏ có tên: áp lại riêng 103 đưa view về bản chậm — ai chạy lại 103 thì phải chạy lại 110 (hồ sơ áp ghi vậy).
  assert.notEqual(await dinhNghia(), viewTruoc, "DA33-AC-1 áp lại riêng 103 không đổi view — phép so định nghĩa không phân biệt được");
  apTep(TEN, MIG110);
  assert.equal(bam([await luocDo(db), await rangBuoc(db)]), truoc, "DA33-AC-1 103 rồi 110 áp lần hai đổi lược đồ");
  assert.equal(await dinhNghia(), viewTruoc, "DA33-AC-1 103 rồi 110 áp lần hai không về đúng view bản 110");
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

// S4-r1 t5: căn không tên toà (pha 1 csv để trống cột toa_ten; pha 2 không có toa lẫn toaTen) phải nạp được — toa_ten NOT NULL
// và thuộc khoá chính, nên bộ nạp ghi '' và view đọc '' thành mơ hồ. Dự án qz riêng, xoá khi xong để không đổi số của ca sau.
test("DA33-AC-1 căn không tên toà nạp được, view đọc thành mơ hồ; chiều đỏ: toa_ten NULL bị DB từ chối", async () => {
  const snap = "qz__s16__2026-11-14T000000001";
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}'::jsonb)`, [snap]);
  try {
    const items = [
      { sourceId: "c-trong", kind: "mngt-can", payload: { tenTep: "c", csv: "du_an_alias,du_an,khu_alias,toa_ten,ma_can\nqz-qz,Q Z,q-khu-z,,QZ0001" } },
      { sourceId: "moi-trong", kind: "mngt-can-moi", payload: {
        theoTang: JSON.stringify({ toa: "qz-qz|kz|tz", tongKhai: 1, can: [{ du_an: "qz-qz", tang: "1", ma_can: "QZ0002" }] }), khongTang: "" } },
    ];
    const kq = dongS16(items, snap);
    assert.deepEqual(kq.can.map((r) => [r.ma_can, r.toa_ten]).sort(), [["QZ0001", ""], ["QZ0002", ""]],
      "DA33-AC-1 căn không tên toà phải mang toa_ten '' (pha 1 và pha 2)");
    await db.query("BEGIN");
    const n = await napS16(db, kq);
    await db.query("COMMIT");
    assert.equal(n.can, 2, "DA33-AC-1 căn không tên toà làm lùi lượt nạp");
    const { rows } = await db.query("SELECT ma_can, mo_ho FROM v_s16_can WHERE du_an = 'qz-qz' ORDER BY ma_can");
    assert.deepEqual(rows, [{ ma_can: "QZ0001", mo_ho: true }, { ma_can: "QZ0002", mo_ho: true }], "DA33-AC-1 căn không tên toà không ra mơ hồ");
    // Chiều đỏ: bản trước sửa truyền NULL — DB từ chối (23502), nên một dòng như vậy làm lùi cả lô.
    await assert.rejects(napS16(db, { item: [], khu: [], toa: [], can: [{ ...kq.can[0], ma_can: "QZ0003", toa_ten: null }] }),
      (e) => e.code === "23502", "DA33-AC-1 toa_ten NULL không bị từ chối — ca không phân biệt được bản sửa");
  } finally {
    await db.query("ROLLBACK").catch(() => {});
    await db.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = $1", [snap]);
  }
});

// Lời AC-9 sửa (chờ Mạnh duyệt 17/11): tokenS16 tách định danh và mã căn, BỎ mã căn toàn số — trên dữ liệu thật 3 mã S16 chỉ
// là số 4 chữ số và va với properties.id, property_offers.property_id, dq_check_results.detail.
test("DA33-AC-9 tokenS16 tách toa_id/khu_id với mã căn và bỏ mã căn toàn số", async () => {
  const snap = "qn__s16__2026-11-14T000000002";
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}'::jsonb)`, [snap]);
  try {
    await db.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, 'qn-qn', 'KHUQN01', 'KHUQN01', 'TOAQN01', 'QN1')`, [snap]);
    for (const ma of ["1203", "QN1-02-03"]) {
      await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha) VALUES ($1, 'qn-qn', 'KHUQN01', 'TOAQN01', 'QN1', NULL, $2, 2)`, [snap, ma]);
    }
    const tk = await tokenS16(db);
    assert.ok(tk.dinhDanh.has("TOAQN01") && tk.dinhDanh.has("KHUQN01"), "DA33-AC-9 toa_id/khu_id không vào tập định danh");
    assert.ok(tk.maCan.has("QN1-02-03"), "DA33-AC-9 mã căn thường không vào tập mã căn");
    assert.ok(!tk.maCan.has("1203") && !tk.dinhDanh.has("1203"), "DA33-AC-9 mã căn toàn số vẫn vào tập soát");
    assert.ok(!tk.maCan.has("TOAQN01") && !tk.dinhDanh.has("QN1-02-03"), "DA33-AC-9 hai tập lẫn nhau");
  } finally {
    await db.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = $1", [snap]);
  }
});

// sync-cloud gọi tokenS16 trên phiên local: bảng 103 nằm ở public mà phiên đứng ở schema khác (test app chạy schema riêng)
// thì câu đọc không thấy bảng — phải coi là chưa áp 103 (null), không ném «relation does not exist» (CI app E4c 17/11).
test("DA33-AC-9 tokenS16 theo search_path: schema không có bảng S16 → null, không ném; về public → có token", async () => {
  await db.query("CREATE SCHEMA IF NOT EXISTS s16_khac");
  try {
    await db.query("SET search_path TO s16_khac");
    assert.equal(await tokenS16(db), null, "DA33-AC-9 tokenS16 không trả null ở schema thiếu bảng S16");
  } finally {
    await db.query("RESET search_path");
    await db.query("DROP SCHEMA s16_khac");
  }
  assert.notEqual(await tokenS16(db), null, "DA33-AC-9 đối chứng: ở public tokenS16 phải đọc được");
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
import { KHU_A, KHU_B, NOI, DA, DB, DC, S08_MA, CAN, TOA, TOKEN, SNAP2, moiDuLieu, banDotBien } from "./s16-fixture.mjs";
const log = () => {};
const chay = (c, noiS16 = NOI) => dung(c, { khuSlugs: [KHU_A, KHU_B], isoTheo: () => "VN-HN", noiS09: {}, noiS16, log, runId: "da33-itest" });

const q = async (c, s, p = []) => (await c.query(s, p)).rows;
const mot = async (c, s, p = []) => (await c.query(s, p)).rows[0];
const doiTuong = async (c, v, src = "S16") => (await mot(c, "SELECT object_key FROM registry_aliases WHERE kind = 'ma_nguon' AND source = $2 AND value = $1", [v, src]))?.object_key;
const canCua = async (c, k) => mot(c, "SELECT unit_key, building_key, stack_key, floor, sub_id, status, merged_into FROM units WHERE unit_key = $1", [k]);
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
  // S4-r1 t9: số căn bị bỏ phải bằng đúng số căn của TỪNG dự án không nối (đếm độc lập từ view), không phải tổng ≥ 2.
  // Nhãn trong bo_du_an là nhãn che (du-an#n) theo thứ tự SQL, nên so đa tập số đếm; DC có đúng 2 căn trong fixture.
  const theoDuAn = await q(db, "SELECT du_an, count(*)::int AS n FROM v_s16_can GROUP BY du_an");
  const khongNoi = theoDuAn.filter((r) => !NOI[duoiDuAn(r.du_an)]);
  assert.equal(khongNoi.find((r) => r.du_an === DC)?.n, 2, "DA33-AC-4 fixture: dự án không nối DC không có đúng 2 căn");
  assert.ok(!khongNoi.some((r) => r.du_an === DA || r.du_an === DB), "DA33-AC-4 fixture: dự án đã nối bị tính là không nối");
  const soDem = (xs) => [...xs].sort((a, b) => a - b);
  assert.deepEqual(soDem(Object.values(tk1.bo_du_an)), soDem(khongNoi.map((r) => r.n)),
    "DA33-AC-4 số căn bị bỏ không khớp từng dự án không nối");
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

test("DA33-AC-6 căn: S08 cùng toà → bí danh; lệch toà → S16 thắng (DA37 Q-B); mới có trục/tầng; mã lô không trục; không trùng", async () => {
  const c1 = await doiTuong(db, "q8/Q12-11-01", "S08");
  assert.equal(await doiTuong(db, `${DA}/Q12-11-01`), c1, "DA33-AC-6 căn S08 cùng toà không nhận bí danh S16");
  // DA37 Q-B: lệch toà → căn S16 đúc ở toà S16, căn S08 gộp vào nó, không thẻ chờ (sổ DA37 dòng fix S3)
  const c16 = await doiTuong(db, `${DA}/Q12-11-05`);
  assert.ok(c16, "DA37-Q-B căn S16 lệch toà không được đúc");
  const c08 = await canCua(db, await doiTuong(db, "q8/Q12-11-05", "S08"));
  assert.deepEqual([c08.status, c08.merged_into], ["merged", c16], "DA37-Q-B căn S08 lệch toà không gộp vào căn S16");
  assert.equal((await q(db, "SELECT 1 FROM review_queue WHERE evidence->>'loai' = 'can-lech-toa' AND status = 'pending'")).length, 0, "DA37-Q-B lệch toà vẫn ra thẻ chờ");
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
  await dotBien("} else if (khop.length === 1) {", "} else if (khop.length >= 1) {", async (m) => trongGiaoDich(async () => {
    const km = await khuMap();
    await m.buocS16(db, { khu: km, isoKhu: new Map([...km.keys()].map((id) => [id, "VN-HN"])), noi: NOI, log });
    assert.ok(await doiTuong(db, `${DA}/t4`), "DA33-AC-5 đột biến khớp-hai không làm toà QD1 nhận bí danh");
  }));
});

/**
 * Bản đột biến: chép các tệp vào cùng thư mục với tên tạm, thay đoạn mã, nối import giữa các bản chép; trả module của tệp đầu.
 * @param {Array<{ tep: string, thay: Array<[string, string]> }>} ds — đường tương đối gốc kho
 */
const chayVoi = (m, c) => m.dung(c, { khuSlugs: [KHU_A, KHU_B], isoTheo: () => "VN-HN", noiS09: {}, noiS16: NOI, log, runId: "da33-itest" });
// Q-B (DA37): đếm trên căn SỐNG — căn S08 đã gộp (merged_into) quy về căn nó gộp vào; thẻ đếm là thẻ còn chờ.
async function theoMa(c, ma) {
  const giu = await q(c, `SELECT a.source, CASE WHEN u.status = 'merged' THEN u.merged_into ELSE u.unit_key END AS song
                            FROM registry_aliases a JOIN units u ON u.unit_key = a.object_key
                           WHERE a.kind = 'ma_nguon' AND a.retired_at IS NULL
                             AND ((a.source = 'S08' AND a.value = $1) OR (a.source = 'S16' AND a.value = $2))`, [`q8/${ma}`, `${DA}/${ma}`]);
  const song = [...new Set(giu.map((r) => r.song))];
  const the = (await mot(c, "SELECT count(*)::int AS n FROM review_queue WHERE item_id = $1 AND status = 'pending'", [`s16:${s16Ref(DA, ma)}`])).n;
  return { so_can: song.length, s08: giu.filter((r) => r.source === "S08").length, s16: giu.filter((r) => r.source === "S16").length, the };
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
    assert.equal(x.so_can, 1, `DA33-AC-7 thứ tự: mã khác toà không đúng một căn sống ở DB ${i + 1}`);
    assert.equal(x.the, 0, `DA37-Q-B lệch toà: còn thẻ chờ ở DB ${i + 1}`);
    assert.deepEqual([x.s08, x.s16], [1, 1], `DA37-Q-B lệch toà: căn sống không nhận đủ bí danh S08 và S16 ở DB ${i + 1}`);
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

test("DA33-AC-7 chiều đỏ (DA37 Q-B): bỏ bước gộp căn S08 lệch toà vào căn S16 thì mã lệch thành hai căn sống", async () => {
  const c = await dbMoi("d2");
  await moiDuLieu(c, { s08: false });
  await chay(c);
  await moiDuLieu(c, { s16: false });
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [["const ganLech = await ganLechS16(c, kh.lechS16);", "const ganLech = { gop: 0, choNghi: 0 };"]] },
  ], (m) => chayVoi(m, c));
  assert.equal((await theoMa(c, "Q12-11-05")).so_can, 2, "đối chứng Q-B: đột biến bỏ gộp mà mã lệch vẫn một căn sống");
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

// ---- S4-r1 t6: hai toà S16 khác toa_id cùng tên, cả hai mới đúc, có căn cùng số trục ----
// Dữ liệu thật có 10 tên toà như vậy (20 toa_id). Mỗi căn phải lấy trục của chính toà nó. DB riêng: không đổi số các ca trên.
async function toaTrungTen(c, { s16 = true } = {}) {
  for (const [slug, ten] of [[KHU_A, "Q Khu A"], [KHU_B, "Q Khu B"]]) {
    await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
      VALUES ('project', $2, $1, '{}', '{}', 'SubdivisionName', '{}') ON CONFLICT (slug) DO NOTHING`, [slug, ten]);
  }
  if (!s16) return;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}') ON CONFLICT DO NOTHING`, [SNAP2]);
  for (const [khu, toa_id] of [["k1", "ta"], ["k2", "tb"]]) {
    await c.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ($1, $2, $3, $3, $4, 'Q56')
                   ON CONFLICT DO NOTHING`, [SNAP2, DA, khu, toa_id]);
  }
  for (const [khu, toa_id, ma] of [["k1", "ta", "Q56-05-01"], ["k2", "tb", "Q56-06-01"]]) {
    await c.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                   VALUES ($1, $2, $3, $4, 'Q56', NULL, $5, 2) ON CONFLICT DO NOTHING`, [SNAP2, DA, khu, toa_id, ma]);
  }
}
const trucToaKhac = async (c) => (await mot(c, `SELECT count(*)::int AS n FROM units u JOIN stacks s ON s.stack_key = u.stack_key
                                                  WHERE s.building_key <> u.building_key`)).n;
const theTrungTen = async (c) => q(c, `SELECT item_id, evidence FROM review_queue WHERE evidence->>'loai' = 'toa-trung-ten' ORDER BY item_id`);
// Luật (a) — GS quyết 17/11 theo AC-7: toà S16 trùng tên trong dự án không đúc, căn của chúng không vào danh bạ, mỗi toa_id một thẻ.
test("DA33-AC-5 hai toà S16 cùng tên: không đúc toà, không nạp căn; mỗi toa_id một thẻ mang ứng viên che và số căn; dựng lại 0 khoá", async () => {
  const c = await dbMoi("tt");
  await toaTrungTen(c);
  const tk = await chay(c);
  assert.equal((await mot(c, "SELECT count(*)::int AS n FROM buildings")).n, 0, "DA33-AC-5 trùng tên: vẫn đúc toà");
  assert.equal((await mot(c, "SELECT count(*)::int AS n FROM units")).n, 0, "DA33-AC-5 trùng tên: căn của toà trùng tên vào danh bạ");
  const the = await theTrungTen(c);
  assert.deepEqual(the.map((x) => x.item_id), [`s16:${s16Ref(DA, "ta")}`, `s16:${s16Ref(DA, "tb")}`].sort(), "DA33-AC-5 trùng tên: không đúng một thẻ mỗi toa_id");
  for (const x of the) {
    assert.deepEqual(x.evidence.ung_vien, [s16Ref(DA, "ta"), s16Ref(DA, "tb")], "DA33-AC-5 trùng tên: thẻ thiếu ứng viên");
    assert.deepEqual(x.evidence.so_can, [1, 1], "DA33-AC-5 trùng tên: thẻ thiếu số căn mỗi bên");
    for (const tok of ["ta", "tb", "Q56-05-01", "Q56-06-01"]) {
      assert.ok(!JSON.stringify(x.evidence).includes(`"${tok}"`), "DA33-AC-5 trùng tên: thẻ mang giá trị đăng nhập S16");
    }
  }
  const s16 = tk.s16?.khu?.[KHU_A] ?? Object.values(tk.s16?.khu ?? {})[0] ?? {};
  assert.equal(s16.can_cho_trung_ten, 2, "DA33-AC-5 trùng tên: không đếm căn đang chờ sau thẻ");
  const truoc = await anhVatThe(c);
  await chay(c);
  assert.deepEqual(await anhVatThe(c), truoc, "DA33-AC-8 trùng tên: dựng lại sinh khoá hay thẻ mới");
});
// AC-7 cho toà trùng tên: hai toà S16 tên Q56 (ta, tb) và một toà S08 cùng tên (căn Q56-07-01). S08 trước hay S16 trước phải ra
// cùng trạng thái. Khoá vật thể là ULID mới mỗi lượt nên so trạng thái chuẩn hoá: số toà/trục/căn, tập bí danh, tập thẻ.
async function s08Q56(c) {
  const a = (await mot(c, "SELECT id::int AS id FROM asset_nodes WHERE slug = $1", [KHU_A])).id;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q-s08', 'q', 'S08', '{}') ON CONFLICT DO NOTHING`);
  await c.query(`INSERT INTO s08_project_links (project_id, asset_node_id, status) VALUES ('q8', $1, 'noi') ON CONFLICT DO NOTHING`, [a]);
  await c.query(`INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state, product_code, subdivision_name, payload)
                 VALUES ('q8:Q56-07-01', 'q-s08', 'q8', 'high_rise', 'notSold', 'Q56-07-01', NULL, '{}') ON CONFLICT DO NOTHING`);
}
async function trangThai(c) {
  const n = async (t) => (await mot(c, `SELECT count(*)::int AS n FROM ${t}`)).n;
  return {
    toa: await n("buildings"), truc: await n("stacks"), can: await n("units"),
    bi_danh: await q(c, "SELECT source, kind, value FROM registry_aliases ORDER BY 1, 2, 3"),
    the: await q(c, "SELECT item_id, evidence->>'loai' AS loai FROM review_queue ORDER BY 1"),
  };
}
async function haiThuTu(m) {
  const goi = m ? (c) => chayVoi(m, c) : chay;
  const s08Truoc = await dbMoi(`o1${m ? "d" : ""}`);
  await toaTrungTen(s08Truoc, { s16: false }); await s08Q56(s08Truoc); await goi(s08Truoc);
  await toaTrungTen(s08Truoc); await goi(s08Truoc);
  const s16Truoc = await dbMoi(`o2${m ? "d" : ""}`);
  await toaTrungTen(s16Truoc); await goi(s16Truoc);
  await s08Q56(s16Truoc); await goi(s16Truoc);
  return [await trangThai(s08Truoc), await trangThai(s16Truoc)];
}
test("DA33-AC-7 toà S16 trùng tên + toà S08 cùng tên: S08 trước hay S16 trước cho cùng trạng thái", async () => {
  const [mot1, hai] = await haiThuTu(null);
  assert.deepEqual(hai, mot1, "DA33-AC-7 toà trùng tên: hai thứ tự cho hai trạng thái");
  assert.deepEqual({ toa: mot1.toa, can: mot1.can }, { toa: 1, can: 1 }, "DA33-AC-7 toà trùng tên: không phải một toà S08 với một căn S08");
  assert.deepEqual(mot1.the.map((x) => x.loai), ["toa-trung-ten", "toa-trung-ten"], "DA33-AC-7 toà trùng tên: không đúng hai thẻ trùng tên");
});
test("DA33-AC-7 chiều đỏ: gỡ luật trùng tên thì S08 trước và S16 trước cho hai trạng thái", async () => {
  const [mot1, hai] = await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [["    if (trung) {", "    if (false) {"]] },
  ], (m) => haiThuTu(m));
  assert.notDeepEqual(hai, mot1, "đối chứng AC-7 trùng tên: gỡ luật (a) mà hai thứ tự vẫn bằng nhau — ca không phân biệt được");
});

// Lớp phòng thủ thứ hai (S4-r1 t6): gỡ luật (a) cho hai toà cùng tên được đúc thì bí danh trục mang toa_id vẫn giữ mỗi căn trên
// trục của chính toà nó; gỡ cả toa_id khỏi bí danh thì căn toà hai nằm trên trục toà một.
const TAT_TRUNG_TEN = ["    if (trung) {", "    if (false) {"];
test("DA33-AC-6 gỡ luật trùng tên: hai toà cùng tên được đúc, mỗi căn vẫn trên trục của chính toà nó", async () => {
  const c = await dbMoi("t6");
  await toaTrungTen(c);
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [TAT_TRUNG_TEN] },
  ], (m) => chayVoi(m, c));
  assert.equal((await q(c, "SELECT DISTINCT building_key FROM units")).length, 2, "DA33-AC-6 gỡ luật (a): không ra hai toà có căn");
  assert.equal(await trucToaKhac(c), 0, "DA33-AC-6 gỡ luật (a): căn nằm trên trục của toà khác");
});
test("DA33-AC-6 chiều đỏ: gỡ luật trùng tên và bỏ toa_id khỏi bí danh trục thì căn toà hai nằm trên trục toà một", async () => {
  const c = await dbMoi("t6d");
  await toaTrungTen(c);
  await banDotBien([
    { tep: "pipeline/danh-ba-vat-the.mjs", thay: [] },
    { tep: "pipeline/lib/s16-dung.mjs", thay: [TAT_TRUNG_TEN,
      ["biDanhTrucS16(du_an, toaCuaCan(r), kq.toa, kq.truc)", "biDanhTrucS16(du_an, \"\", kq.toa, kq.truc)"]] },
  ], (m) => chayVoi(m, c));
  assert.equal(await trucToaKhac(c), 1, "đối chứng t6: đột biến không làm căn toà hai lấy trục toà một");
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
