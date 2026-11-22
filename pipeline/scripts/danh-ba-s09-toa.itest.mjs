// danh-ba-s09-toa.itest.mjs — DA42 nap-s09-toa-tang-vao-danh-ba: itest trên DB thử oneinvest_dbv_s42_<pid> dựng từ
// db/migrations (taoDbThu, tới 125); xoá khi xong. Không bao giờ đụng DB `oneinvest`.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09-toa.itest.mjs
//
// Ca «kind lạ» (giám sát 22/11): Mạnh mở thu S09 ngoài Hà Nội và quỹ căn có giá, nạp chung stg_s09_danh_ba với kind MỚI (bảng
// không CHECK kind). Ba view của gói 1 và bước dựng phải lọc kind liệt kê dương (KIND_GOI_1), nên dòng kind lạ không đổi kết quả.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { buocS09DanhBa } from "../lib/s09-dung.mjs";
import { KIND_GOI_1, SOURCE_ID_DANH_MUC_GOI_1 } from "../lib/s09-danh-ba-can.mjs";

export const TEN = `oneinvest_dbv_s42_${process.pid}`;
let db;

const SNAP_GOI_1 = "q42__s09-danh-ba__goi1", SNAP_LA = "q42__s09-danh-ba__kind-la";
const T0 = "2026-11-19T00:49:00Z", T_LA = "2026-11-22T05:00:00Z"; // dòng lạ MỚI hơn gói 1: view «mới nhất» không được chọn nó

const dongStg = (snap, dong, kind, sourceId, data, fetchedAt, meta = {}) => db.query(
  `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [snap, dong, kind, sourceId, JSON.stringify({ code: "200", data }), JSON.stringify(meta), fetchedAt]);

const duAn = (id, ten) => ({ id, name: ten, project_locations: [{ province: "Hà Nội", province_code: "01" }] });

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN) });
  await db.connect();
  for (const s of [SNAP_GOI_1, SNAP_LA]) {
    await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 's09-danh-ba', '{}')`, [s]);
  }
  // Gói 1: danh mục hai dự án; dự án q42-p1 có hai toà, toà A có hai tầng.
  await dongStg(SNAP_GOI_1, 1, KIND_GOI_1.danhMuc, SOURCE_ID_DANH_MUC_GOI_1, [duAn("q42-p1", "Q42 Dự án Một"), duAn("q42-p2", "Q42 Dự án Hai")], T0);
  await dongStg(SNAP_GOI_1, 2, KIND_GOI_1.toa, "q42-p1", [{ id: "q42-t1", name: "Tòa A" }, { id: "q42-t2", name: "Tòa B" }], T0);
  await dongStg(SNAP_GOI_1, 3, KIND_GOI_1.tang, "q42-t1", [{ id: "q42-f1", name: "02" }, { id: "q42-f2", name: "03" }], T0, { duAnId: "q42-p1" });
  // Kind của gói 1 mà DA42 không đọc (đã có từ gói 1): không vào view nào.
  await dongStg(SNAP_GOI_1, 4, "khu-thap-tang", "q42-p1", [{ id: "q42-k1", name: "Khu thấp tầng" }], T0);
  await dongStg(SNAP_GOI_1, 5, "can-thap-tang", "q42-k1", [{ id: "q42-c1", name: "LK-01" }], T0);
});
after(async () => { await db?.end().catch(() => {}); await xoaDbThu(TEN); });

/** Ảnh chụp: ba view (đã sắp) + kết quả bước dựng chạy trong giao dịch rồi lùi (không để lại gì). */
async function chup() {
  const v = async (sql) => (await db.query(sql)).rows;
  const views = {
    du_an: await v("SELECT du_an_id, ten, ma_tinh, snapshot_id FROM v_s09_db_du_an ORDER BY du_an_id"),
    toa: await v("SELECT du_an_id, toa_id, toa_ten, thu_tu, snapshot_id FROM v_s09_db_toa ORDER BY du_an_id, thu_tu"),
    tang: await v("SELECT toa_id, du_an_id, tang_id, tang_ten, thu_tu, snapshot_id FROM v_s09_db_tang ORDER BY toa_id, thu_tu"),
  };
  let n = 0;
  await db.query("BEGIN");
  try {
    const ra = await buocS09DanhBa(db, { noi: {}, noiS16: {}, log: () => {}, taoKhoa: (t) => `${t}_q42_${String(++n).padStart(20, "0")}` });
    return { views, ra };
  } finally {
    await db.query("ROLLBACK");
  }
}

test("DA42 kind lạ: dòng kind mới (S09 ngoài Hà Nội, quỹ căn) cùng bảng stg không đổi ba view và kết quả bước dựng", async () => {
  const truoc = await chup();
  // Tiền đề: fixture thật sự đi qua bước dựng (hai dự án, có toà), để «không đổi» không phải «rỗng bằng rỗng».
  assert.deepEqual(truoc.views.du_an.map((r) => r.du_an_id), ["q42-p1", "q42-p2"]);
  assert.equal(truoc.views.toa.length, 2);
  assert.equal(truoc.views.tang.length, 2);
  assert.equal(truoc.ra.du_an.ung_vien_moi, 2);

  await db.query("BEGIN");
  try {
    let dong = 1;
    // Kind mới, mỗi kind mang đúng hình dạng của một kind gói 1 để view lọc lỏng thì bắt được ngay.
    await dongStg(SNAP_LA, dong++, "danh-muc-ngoai-ha-noi", SOURCE_ID_DANH_MUC_GOI_1, [duAn("q42-p9", "Q42 Dự án Ngoài")], T_LA);
    await dongStg(SNAP_LA, dong++, "toa-ngoai-ha-noi", "q42-p1", [{ id: "q42-t9", name: "Tòa Ngoài" }], T_LA);
    await dongStg(SNAP_LA, dong++, "tang-ngoai-ha-noi", "q42-t1", [{ id: "q42-f9", name: "09" }], T_LA, { duAnId: "q42-p1" });
    await dongStg(SNAP_LA, dong++, "quy-can-so-cap", "q42-t1", [{ id: "q42-c9", name: "A-0901", price: 1 }], T_LA);
    await dongStg(SNAP_LA, dong++, "quy-can-thu-cap", "q42-p1", [{ id: "q42-c8", name: "A-0902", price: 2 }], T_LA);
    // Cùng kind `danh-muc` nhưng source_id khác (danh mục của một lượt thu khác): không thay danh mục gói 1.
    await dongStg(SNAP_LA, dong++, KIND_GOI_1.danhMuc, "danh-muc-ngoai-ha-noi", [duAn("q42-p8", "Q42 Dự án Khác")], T_LA);
    const sau = await chupTrongGiaoDich();
    assert.deepEqual(sau.views, truoc.views, "ba view của gói 1 đổi khi có dòng kind lạ");
    assert.deepEqual(sau.ra, truoc.ra, "kết quả bước dựng đổi khi có dòng kind lạ");

    // Chiều đỏ, ngay trên cùng dữ liệu: view lọc kiểu «loại trừ» (không liệt kê dương) hay danh mục không ghim source_id thì
    // dòng lạ lọt vào — ca trên phân biệt được.
    const loTo = (await db.query(
      `SELECT count(*)::int AS n FROM v_s09_db_item_moi i CROSS JOIN LATERAL jsonb_array_elements(i.payload -> 'data') t
        WHERE i.kind NOT IN ('danh-muc', 'tang', 'khu-thap-tang', 'can-thap-tang')`)).rows[0].n;
    assert.ok(loTo > truoc.views.toa.length, `view toà lọc loại trừ phải lọt dòng lạ (đếm ${loTo})`);
    const dmLong = (await db.query(
      `SELECT d ->> 'id' AS id FROM (SELECT * FROM v_s09_db_item_moi WHERE kind = 'danh-muc' ORDER BY fetched_at DESC NULLS LAST, snapshot_id DESC LIMIT 1) dm
        CROSS JOIN LATERAL jsonb_array_elements(dm.payload -> 'data') d`)).rows.map((r) => r.id);
    assert.deepEqual(dmLong, ["q42-p8"], "danh mục không ghim source_id phải bị danh mục mới hơn thay");
  } finally {
    await db.query("ROLLBACK");
  }
});

test("DA42 kind lạ: toà kind `toa` của dự án ngoài danh mục gói 1 không vào bước dựng", async () => {
  const truoc = await chup();
  await db.query("BEGIN");
  try {
    await dongStg(SNAP_LA, 101, KIND_GOI_1.toa, "q42-p9", [{ id: "q42-t8", name: "Tòa Z" }], T_LA);
    await dongStg(SNAP_LA, 102, KIND_GOI_1.tang, "q42-t8", [{ id: "q42-f8", name: "02" }], T_LA, { duAnId: "q42-p9" });
    const sau = await chupTrongGiaoDich();
    // View toà theo kind nên có dòng mới (đúng thiết kế 115: DA43 đọc mọi toà đã thu); bước dựng chỉ xét dự án trong danh mục.
    assert.equal(sau.views.toa.length, truoc.views.toa.length + 1);
    assert.deepEqual(sau.views.du_an, truoc.views.du_an);
    assert.deepEqual(sau.ra, truoc.ra, "toà của dự án ngoài danh mục gói 1 lọt vào bước dựng");
  } finally {
    await db.query("ROLLBACK");
  }
});

/** Như chup() nhưng chạy bên trong một giao dịch đang mở: bước dựng trong SAVEPOINT rồi lùi về đó. */
async function chupTrongGiaoDich() {
  const v = async (sql) => (await db.query(sql)).rows;
  const views = {
    du_an: await v("SELECT du_an_id, ten, ma_tinh, snapshot_id FROM v_s09_db_du_an ORDER BY du_an_id"),
    toa: await v("SELECT du_an_id, toa_id, toa_ten, thu_tu, snapshot_id FROM v_s09_db_toa ORDER BY du_an_id, thu_tu"),
    tang: await v("SELECT toa_id, du_an_id, tang_id, tang_ten, thu_tu, snapshot_id FROM v_s09_db_tang ORDER BY toa_id, thu_tu"),
  };
  let n = 0;
  await db.query("SAVEPOINT q42");
  try {
    const ra = await buocS09DanhBa(db, { noi: {}, noiS16: {}, log: () => {}, taoKhoa: (t) => `${t}_q42_${String(++n).padStart(20, "0")}` });
    return { views, ra };
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT q42");
  }
}
