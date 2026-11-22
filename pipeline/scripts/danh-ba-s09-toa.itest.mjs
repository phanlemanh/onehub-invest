// danh-ba-s09-toa.itest.mjs — DA42 nap-s09-toa-tang-vao-danh-ba: itest trên DB thử oneinvest_dbv_s42_<pid> dựng từ
// db/migrations (taoDbThu, tới 125); xoá khi xong. Không bao giờ đụng DB `oneinvest`.
// Chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s09-toa.itest.mjs
//
// Ca «kind lạ» (giám sát 22/11): Mạnh mở thu S09 ngoài Hà Nội và quỹ căn có giá, nạp chung stg_s09_danh_ba với kind MỚI (bảng
// không CHECK kind). Ba view của gói 1 và bước dựng phải lọc kind liệt kê dương (KIND_GOI_1), nên dòng kind lạ không đổi kết quả.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { napDanhBaThuMuc } from "../import-s09-danh-ba.mjs";
import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { SQL_CHUONG_TEN_LECH, buocS09DanhBa } from "../lib/s09-dung.mjs";
import { KIND_GOI_1, SOURCE_ID_DANH_MUC_GOI_1 } from "../lib/s09-danh-ba-can.mjs";
import { buocS16 } from "../lib/s16-dung.mjs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { FILL } from "../sync-cloud.mjs";
import { guardValues } from "../lib/tier-a-guard.mjs";
import { docSourceNameEntries } from "../lib/source-name-entries.mjs";
import { phanLop } from "../lib/noi-du-an-s06-lop.mjs";
import { khoaKhu } from "../lib/s16-phan-khu.mjs";

export const TEN = `oneinvest_dbv_s09t_${process.pid}`;
let db;

const SNAP_GOI_1 = "q42__s09-danh-ba__goi1", SNAP_LA = "q42__s09-danh-ba__kind-la";
const T0 = "2026-11-19T00:49:00Z", T_LA = "2026-11-22T05:00:00Z"; // dòng lạ MỚI hơn gói 1: view «mới nhất» không được chọn nó

const dongStg = (snap, dong, kind, sourceId, data, fetchedAt, meta = {}) => db.query(
  `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
  [snap, dong, kind, sourceId, JSON.stringify({ code: "200", data }), JSON.stringify(meta), fetchedAt]);

const duAn = (id, ten) => ({ id, name: ten, project_locations: [{ province: "Hà Nội", province_code: "01" }] });

let URL_THU;
before(async () => {
  URL_THU = await taoDbThu(TEN);
  db = new pg.Client({ connectionString: URL_THU });
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
    const ra = await buocS09DanhBa(db, { noi: {}, noiS16: {}, log: () => {}, taoKhoa: (t) => `${t}_${String(++n).padStart(26, "0")}` });
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

// View toà KHÔNG lọc theo danh mục: theo thiết kế 115, DA43 đọc mọi toà đã thu. Ca này đo đúng điều đó (đỏ nếu ai lọc view toà
// theo danh mục gói 1). Bước dựng không có rào riêng cho toà ngoài danh mục: các vòng của nó chỉ đi qua dự án trong danh mục, nên
// không dựng được dữ liệu làm một rào như vậy thành khác biệt — giám sát 22/11, phương án (b), bỏ rào thay vì giữ mã không ca nào chạm.
test("DA42 kind lạ: view toà giữ toà kind `toa` của dự án ngoài danh mục gói 1, danh mục không đổi", async () => {
  const truoc = await chup();
  await db.query("BEGIN");
  try {
    await dongStg(SNAP_LA, 101, KIND_GOI_1.toa, "q42-p9", [{ id: "q42-t8", name: "Tòa Z" }], T_LA);
    const sau = await chupTrongGiaoDich();
    assert.deepEqual(sau.views.toa.map((r) => r.toa_id), [...truoc.views.toa.map((r) => r.toa_id), "q42-t8"],
      "view toà phải giữ toà của dự án ngoài danh mục (DA43 đọc mọi toà đã thu)");
    assert.deepEqual(sau.views.du_an, truoc.views.du_an, "danh mục gói 1 đổi khi có toà của dự án ngoài danh mục");
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- E6 (AC-6): danh sách tầng đủ cho DA43 -------------------------------------------------------------------------------
// Giá trị viết trước: toà q42-t3 có bốn mã tầng — «02», «12B», và hai tầng cùng tên «15» khác mã — nên DA43 phải thu 4 tầng.
const TANG_T3 = [{ id: "q42-f31", name: "02" }, { id: "q42-f32", name: "12B" }, { id: "q42-f33", name: "15" }, { id: "q42-f34", name: "15" }];
const SO_TANG_T3 = 4;

/** Lỗi của view tầng cho toà q42-t3 so với giá trị viết trước; rỗng = đạt. */
async function loiViewTang() {
  const loi = [];
  const { rows } = await db.query("SELECT tang_id, tang_ten, toa_id, du_an_id FROM v_s09_db_tang WHERE toa_id = 'q42-t3' ORDER BY thu_tu");
  if (rows.length !== SO_TANG_T3) loi.push(`số tầng toà q42-t3 là ${rows.length}, viết trước ${SO_TANG_T3} (trùng tên tầng bị gộp?)`);
  const ma = rows.map((r) => r.tang_id);
  if (new Set(ma).size !== ma.length) loi.push("một mã tầng ra nhiều dòng");
  if (!rows.some((r) => r.tang_ten === "12B")) loi.push("tên «12B» không giữ nguyên văn");
  if (rows.filter((r) => r.tang_ten === "15").length !== 2) loi.push("trùng tên tầng: hai mã cùng tên «15» phải ra hai dòng");
  if (rows.some((r) => r.toa_id !== "q42-t3" || r.du_an_id !== "q42-p1")) loi.push("thiếu mã toà hay mã dự án trên dòng tầng");
  return loi;
}

test("DA42 E6 (AC-6): view tầng một dòng mỗi mã tầng, giữ tên nguyên văn, hai tầng trùng tên ra hai dòng; đỏ khi view gộp theo tên", async () => {
  await db.query("BEGIN");
  try {
    await dongStg(SNAP_GOI_1, 201, KIND_GOI_1.tang, "q42-t3", TANG_T3, T0, { duAnId: "q42-p1" });
    assert.deepEqual(await loiViewTang(), []);
    // Chiều đỏ: view tầng gộp theo tên tầng (DISTINCT ON tên) — cùng cột, cùng thứ tự cột.
    await db.query(`CREATE OR REPLACE VIEW v_s09_db_tang AS
      SELECT DISTINCT ON (i.source_id, f ->> 'name') i.source_id AS toa_id, i.meta ->> 'duAnId' AS du_an_id, f ->> 'id' AS tang_id,
             f ->> 'name' AS tang_ten, o::int AS thu_tu, i.snapshot_id
        FROM v_s09_db_item_moi i CROSS JOIN LATERAL jsonb_array_elements(i.payload -> 'data') WITH ORDINALITY AS x(f, o)
       WHERE i.kind = 'tang' AND NULLIF(btrim(f ->> 'id'), '') IS NOT NULL
       ORDER BY i.source_id, f ->> 'name', o`);
    const loi = await loiViewTang();
    assert.ok(loi.some((l) => l.includes("trùng tên tầng")), `đột biến gộp theo tên tầng phải đỏ nêu «trùng tên tầng»: ${JSON.stringify(loi)}`);
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- Đột biến mã JS cho chiều đỏ -----------------------------------------------------------------------------------------
// Chép s09-danh-ba-can.mjs (đã thay) và s09-dung.mjs (trỏ import sang bản chép) thành tệp ẩn `.s09t-cu-*` CÙNG thư mục lib để
// import tương đối còn đúng; import xong thì xoá (ESM nạp trọn đồ thị trước khi import() trả về). Mẫu tên khớp `.*-cu-*` đã bỏ qua.
const LIB = join(import.meta.dirname, "../lib");
let demDotBien = 0;
async function buocDotBien(thay, tep = "s09-danh-ba-can.mjs") {
  const n = ++demDotBien;
  const tenCan = `.s09t-cu-${process.pid}-${n}-can.mjs`, tenDung = `.s09t-cu-${process.pid}-${n}-dung.mjs`;
  let can = readFileSync(join(LIB, tep), "utf8");
  for (const [a, b] of thay) {
    if (!can.includes(a)) throw new Error(`đột biến không khớp mã hiện tại: ${a.slice(0, 60)}`);
    can = can.replace(a, b);
  }
  const dung = readFileSync(join(LIB, "s09-dung.mjs"), "utf8").replace('from "./s09-danh-ba-can.mjs"', `from "./${tenCan}"`);
  writeFileSync(join(LIB, tenCan), can);
  writeFileSync(join(LIB, tenDung), dung);
  try {
    return (await import(pathToFileURL(join(LIB, tenDung)).href)).buocS09DanhBa;
  } finally {
    rmSync(join(LIB, tenCan), { force: true });
    rmSync(join(LIB, tenDung), { force: true });
  }
}

// ---- E3 (AC-3): dự án S09 đi đúng một trong bốn đường ----------------------------------------------------------------------
// Ma trận viết trước: pn đã nối tay (NOI) · pt trùng tên đúng một nút · pg tên gần giống (chứa nhau, ≥ 8 ký tự) · pu không khớp.
const T_E3 = "2026-11-20T00:00:00Z";
const E3 = { pn: "Q42 Đã Nối S09", pt: "Q42 Trùng Tên Một", pg: "Q42 Gần Giống Khu Đô Thị", pu: "Q42 Không Khớp Gì Hết" };
const NOI_E3 = { "q42-pn": "q42-noi" };
let demKhoa = 0;
const taoKhoaThu = (t) => `${t}_${String(++demKhoa).padStart(26, "0")}`;
const dungE3 = (buoc = buocS09DanhBa) => buoc(db, { noi: NOI_E3, noiS16: {}, log: () => {}, taoKhoa: taoKhoaThu });

async function fixtureE3() {
  const nut = async (slug, ten) => (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
     VALUES ('project', $2, $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [slug, ten])).rows[0].id;
  const N = { noi: await nut("q42-noi", "Q42 Đã Nối Tay"), trung: await nut("q42-trung", "Q42 Trùng Tên Một"),
              gan: await nut("q42-gan", "Q42 Gần Giống Khu Đô Thị Lớn") };
  await dongStg(SNAP_GOI_1, 301, KIND_GOI_1.danhMuc, SOURCE_ID_DANH_MUC_GOI_1,
    Object.entries(E3).map(([k, ten]) => duAn(`q42-${k}`, ten)), T_E3);
  let dong = 302;
  for (const k of Object.keys(E3)) await dongStg(SNAP_GOI_1, dong++, KIND_GOI_1.toa, `q42-${k}`, [{ id: `q42-t-${k}`, name: `E3 Tòa ${k}` }], T_E3);
  return N;
}

/** Trạng thái sau một lượt dựng: link theo mã, nút ứng viên, thẻ, số toà theo nút. */
async function docE3() {
  const q = async (sql, a = []) => (await db.query(sql, a)).rows;
  const link = Object.fromEntries((await q(
    "SELECT source_project_id AS p, status, asset_node_id::int AS n, can_cu, ly_do FROM project_links WHERE source = 'S09' AND source_project_id LIKE 'q42-%'"))
    .map((r) => [r.p, r]));
  const ungVien = await q(`SELECT n.id::int AS id, n.catalog_tier, (SELECT count(*)::int FROM offer_project o WHERE o.project_node_id = n.id) AS tin
                             FROM asset_nodes n JOIN registry_aliases a ON a.object_key = 'node:' || n.id
                            WHERE a.source = 'S09' AND a.kind = 'ma_nguon' AND a.value LIKE 'danh-ba-du-an/q42-%'`);
  const the = Object.fromEntries((await q("SELECT item_id, status, evidence FROM review_queue WHERE item_type = 'entity_match' AND item_id LIKE 's09-%'"))
    .map((r) => [r.item_id, r]));
  const toa = Object.fromEntries((await q("SELECT region_node_id::int AS n, count(*)::int AS c FROM buildings GROUP BY 1")).map((r) => [r.n, r.c]));
  return { link, ungVien, the, toa };
}

/** Lỗi của trạng thái «chưa duyệt thẻ nào» so với ma trận viết trước; rỗng = đạt. */
function loiE3ChuaDuyet(st, N) {
  const loi = [], L = st.link;
  if (L["q42-pn"]?.status !== "noi" || L["q42-pn"]?.n !== N.noi) loi.push("đã nối: pn không giữ nối về nút nối tay");
  if (L["q42-pt"]?.status !== "chua_noi" || L["q42-pt"]?.ly_do !== "cho-the-luat") loi.push("trùng tên: pt phải chưa nối, chờ thẻ luật");
  if (!Object.keys(st.the).some((k) => k.startsWith("s09-luat-du-an:") && JSON.stringify(st.the[k].evidence?.cap ?? []).includes("q42-pt")))
    loi.push("trùng tên: không có thẻ luật theo nguồn mang pt");
  if (L["q42-pg"]?.status !== "chua_noi") loi.push("gần giống: pg đã nối khi thẻ từng cặp chưa duyệt");
  if (st.the["s09-du-an:q42-pg"]?.status !== "pending") loi.push("gần giống: không có thẻ từng cặp đang chờ cho pg");
  if (st.ungVien.length !== 1) loi.push(`không khớp: ${st.ungVien.length} nút ứng viên, phải đúng 1`);
  const uv = st.ungVien[0];
  if (uv && (uv.catalog_tier !== "mot_loi_khai" || L["q42-pu"]?.n !== uv.id)) loi.push("không khớp: nút ứng viên sai bậc hay pu không nối về nó");
  if (uv && uv.tin !== 0) loi.push("nút ứng viên có tin trong offer_project");
  if ((st.toa[N.trung] ?? 0) !== 0 || (st.toa[N.gan] ?? 0) !== 0) loi.push("dự án chờ thẻ có toà mới");
  if ((st.toa[N.noi] ?? 0) !== 1) loi.push(`đã nối: nút nối tay có ${st.toa[N.noi] ?? 0} toà, phải 1`);
  return loi;
}

test("DA42 E3 (AC-3): bốn đường của dự án, ba trạng thái thẻ từng cặp; đỏ khi tự nối tên gần giống", async () => {
  await db.query("BEGIN");
  try {
    const N = await fixtureE3();
    await db.query("SAVEPOINT e3");
    await dungE3();
    const st1 = await docE3();
    assert.deepEqual(loiE3ChuaDuyet(st1, N), []);
    // Dựng lại khi chưa duyệt: không thêm nút ứng viên, không thêm toà.
    await dungE3();
    const st1b = await docE3();
    assert.equal(st1b.ungVien.length, 1, "dựng lại sinh nút ứng viên thứ hai");
    assert.deepEqual(st1b.toa, st1.toa, "dựng lại khi chưa duyệt đổi số toà");

    // Duyệt thẻ từng cặp → dựng lại: pg nối về nút gần giống, toà vào đúng nút đó; dựng thêm lần nữa 0 toà trùng.
    await db.query("UPDATE review_queue SET status = 'approved' WHERE item_type = 'entity_match' AND item_id = 's09-du-an:q42-pg'");
    await dungE3();
    const st2 = await docE3();
    assert.equal(st2.link["q42-pg"]?.status, "noi", "duyệt thẻ từng cặp mà pg vẫn chưa nối");
    assert.equal(st2.link["q42-pg"]?.n, N.gan);
    assert.equal(st2.link["q42-pg"]?.can_cu, "the-cap");
    assert.equal(st2.toa[N.gan], 1, "duyệt thẻ rồi dựng lại: toà của pg không vào đúng nút");
    await dungE3();
    assert.deepEqual((await docE3()).toa, st2.toa, "dựng thêm sau duyệt sinh toà trùng");

    // Từ chối thẻ: vẫn không nối, 0 toà.
    await db.query("ROLLBACK TO SAVEPOINT e3");
    await dungE3();
    await db.query("UPDATE review_queue SET status = 'rejected' WHERE item_type = 'entity_match' AND item_id = 's09-du-an:q42-pg'");
    await dungE3();
    const st3 = await docE3();
    assert.equal(st3.link["q42-pg"]?.status, "chua_noi", "thẻ từ chối mà pg vẫn nối");
    assert.equal(st3.link["q42-pg"]?.ly_do, "the-tu-choi");
    assert.equal(st3.toa[N.gan] ?? 0, 0);

    // Chiều đỏ: đột biến tự nối mọi tên gần giống (bỏ điều kiện thẻ đã duyệt).
    await db.query("ROLLBACK TO SAVEPOINT e3");
    const dot = await buocDotBien([[
      'if (theCap?.status === "approved" && theCap.node_id != null && ung.includes(Number(theCap.node_id))) {\n      return { duong: DUONG.theCap, node_id: Number(theCap.node_id), ung_vien_cua: ung, noi: true };',
      'if (true) {\n      return { duong: DUONG.theCap, node_id: ung[0], ung_vien_cua: ung, noi: true };']]);
    await dungE3(dot);
    const loi = loiE3ChuaDuyet(await docE3(), N);
    assert.ok(loi.some((l) => l.startsWith("gần giống")), `đột biến tự nối tên gần giống phải đỏ nêu «gần giống»: ${JSON.stringify(loi)}`);
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- E4 (AC-4): toà không sinh trùng ----------------------------------------------------------------------------------------
// Dự án q42-e4 nối tay về nút q42-e4n; nút có sẵn năm toà: A (S08), C (mã cũ DA31 của S09), H1 và H2 (cùng tên H), S (S16).
// Gói 1 có toà A (khớp một), C (mã cũ), H (khớp hai), hai toà D (trùng tên trong dự án), M (không khớp).
const NOI_E4 = { "q42-e4": "q42-e4n" };
const dungE4 = (buoc = buocS09DanhBa) => buoc(db, { noi: NOI_E4, noiS16: {}, log: () => {}, taoKhoa: taoKhoaThu });
const bkE4 = (k) => `bld_${("E4" + k).padStart(26, "0")}`;

async function fixtureE4() {
  const nutId = (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
     VALUES ('project', 'Q42 E4 Dự án', 'q42-e4n', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`)).rows[0].id;
  // W: toà mang HAI mã cũ DA31 có block trùng mã toà gói 1 (ca gốc OS2 ngày 22/11: hai block cùng tên đã gộp vào một toà).
  const toa = [["A", "S08", "s08-du-an/a"], ["C", "S09", "q42-e4/blk-c"], ["H1", "S08", "s08-du-an/h1"], ["H2", "S08", "s08-du-an/h2"], ["S", "S16", "q42/S"],
    ["W", "S09", "q42-e4/q42-e4-W6"]];
  for (const [k, nguon, ma] of toa) {
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bkE4(k), nutId]);
    await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)", [bkE4(k), ma, nguon]);
    await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', $2, $3)", [bkE4(k), `E4 ${k.replace(/[0-9]$/, "")}`, nguon]);
  }
  await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'q42-e4/q42-e4-W7', 'S09')", [bkE4("W")]);
  await dongStg(SNAP_GOI_1, 401, KIND_GOI_1.danhMuc, SOURCE_ID_DANH_MUC_GOI_1, [duAn("q42-e4", "Q42 E4 S09")], "2026-11-20T01:00:00Z");
  await dongStg(SNAP_GOI_1, 402, KIND_GOI_1.toa, "q42-e4", ["A", "C", "H", "D", "D", "M", "W", "W"].map((k, j) => ({ id: `q42-e4-${k}${j}`, name: `E4 ${k}` })),
    "2026-11-20T01:00:00Z");
  return nutId;
}

/** Lỗi của kết cục toà so với giá trị viết trước; rỗng = đạt. */
async function loiE4(nutId) {
  const q = async (sql, a = []) => (await db.query(sql, a)).rows;
  const loi = [];
  const moi = await q("SELECT building_key, catalog_tier FROM buildings WHERE region_node_id = $1 AND building_key NOT LIKE 'bld_%E4%'", [nutId]);
  if (moi.length !== 1 || moi[0].catalog_tier !== "mot_loi_khai") loi.push(`không khớp: ${moi.length} toà mới, phải đúng 1 toà bậc mot_loi_khai`);
  const bd = Object.fromEntries((await q(
    "SELECT value, object_key FROM registry_aliases WHERE source = 'S09' AND kind = 'ma_nguon' AND value LIKE 'danh-ba-toa/q42-e4-%'")).map((r) => [r.value, r.object_key]));
  if (bd["danh-ba-toa/q42-e4-A0"] !== bkE4("A")) loi.push("khớp một: toà A không thành bí danh của toà S08 có sẵn");
  if (bd["danh-ba-toa/q42-e4-C1"] !== bkE4("C")) loi.push("mã cũ: toà C không nhận mã mới trên đúng building_key có mã cũ");
  if (bd["danh-ba-toa/q42-e4-H2"]) loi.push("khớp hai: toà H thành bí danh của một trong hai toà cùng tên");
  if (bd["danh-ba-toa/q42-e4-D3"] || bd["danh-ba-toa/q42-e4-D4"]) loi.push("trùng tên: toà D trùng tên trong dự án được gắn hay đúc");
  if (bd["danh-ba-toa/q42-e4-W6"] !== bkE4("W") || bd["danh-ba-toa/q42-e4-W7"] !== bkE4("W")) loi.push("mã cũ: hai block cùng tên mang mã cũ không nối về toà mã cũ");
  const tenS09W = (await q("SELECT count(*)::int AS n FROM registry_aliases WHERE object_key = $1 AND kind = 'ten' AND source = 'S09' AND value = 'E4W'", [bkE4("W")]))[0].n;
  if (tenS09W) loi.push("mã cũ: nhánh mã cũ gắn bí danh tên");
  const the = (await q("SELECT item_id FROM review_queue WHERE item_type = 'entity_match' AND item_id LIKE 's09-toa-db:q42-e4/%'")).map((r) => r.item_id).sort();
  if (!the.includes("s09-toa-db:q42-e4/E4H")) loi.push("khớp hai: không có thẻ cho toà H");
  if (!the.includes("s09-toa-db:q42-e4/E4D")) loi.push("trùng tên: không có thẻ cho toà D");
  if (the.length !== 2) loi.push(`số thẻ toà ${the.length}, phải 2 (mỗi ca một thẻ)`);
  const haiUpi = (await q("SELECT count(*)::int AS n FROM (SELECT upi FROM buildings GROUP BY upi HAVING count(*) > 1) x"))[0].n;
  if (haiUpi) loi.push(`${haiUpi} UPI trỏ hai toà`);
  const haiToa = (await q(`SELECT count(*)::int AS n FROM (SELECT value FROM registry_aliases WHERE source = 'S09' AND kind = 'ma_nguon'
                             AND value LIKE 'danh-ba-toa/%' AND retired_at IS NULL GROUP BY value HAVING count(DISTINCT object_key) > 1) x`))[0].n;
  if (haiToa) loi.push(`${haiToa} mã S09 trỏ hai toà`);
  return loi;
}

test("DA42 E4 (AC-4): toà khớp một thành bí danh, mã cũ nhận mã mới (cả hai block cùng tên), khớp hai và trùng tên ra thẻ, không khớp đúc một toà; đỏ khi khớp hai chọn toà đầu, khi bỏ nhánh mã cũ", async () => {
  await db.query("BEGIN");
  try {
    const nutId = await fixtureE4();
    await db.query("SAVEPOINT e4");
    await dungE4();
    assert.deepEqual(await loiE4(nutId), []);
    const dem = async () => (await db.query("SELECT count(*)::int AS n FROM buildings WHERE region_node_id = $1", [nutId])).rows[0].n;
    assert.equal(await dem(), 7, "số toà của nút: 6 có sẵn + 1 toà M");
    await dungE4();
    assert.equal(await dem(), 7, "dựng lại sinh thêm toà");
    assert.deepEqual(await loiE4(nutId), []);

    // Chiều đỏ: khớp hai thì chọn toà đầu (bỏ nhánh thẻ «khop-hai»).
    await db.query("ROLLBACK TO SAVEPOINT e4");
    const dot = await buocDotBien([[
      '    if (khop.length > 1) return { ...co, loai: "the", ly_do: "khop-hai", building_keys: khop.map((b) => b.building_key) };\n', '']]);
    await dungE4(dot);
    const loi = await loiE4(nutId);
    assert.ok(loi.some((l) => l.startsWith("khớp hai")), `đột biến chọn toà đầu khi khớp hai phải đỏ nêu «khớp hai»: ${JSON.stringify(loi)}`);

    // Chiều đỏ: bỏ nhánh mã cũ trước tên — hai block cùng tên của W rơi về luật tên, lên thẻ trùng tên.
    await db.query("ROLLBACK TO SAVEPOINT e4");
    const dot2 = await buocDotBien([["    if (cu.length === 1) {", "    if (false) {"]]);
    await dungE4(dot2);
    const loi2 = await loiE4(nutId);
    assert.ok(loi2.some((l) => l.startsWith("mã cũ")), `đột biến bỏ nhánh mã cũ phải đỏ nêu «mã cũ»: ${JSON.stringify(loi2)}`);
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- E5 (AC-5): dự án có S16 giữ cấu trúc của S16 --------------------------------------------------------------------------
// Nút q42-e5n có hai phân khu: N16 (khu K1 của S16) và N09 (sector sec5 của S09 DA31). Năm toà S16 dưới nút, mỗi toà một ca tầng
// (giá trị viết trước, tầng có căn của S16 ↔ tầng S09 kê):
//   K khớp (2–5 ↔ 02–05) · L lệch (2–10 ↔ 02–05: S09 ít hơn 5 tầng) · X S09 nhiều hơn (2–4 ↔ 02–08) · Y chỉ thiếu tầng 1 (1–5 ↔ 02–05)
//   · N không so được (S16 không có căn). Toà K còn mang mã cũ S09 DA31 trỏ sector sec5 → S09 ghi phân khu N09, S16 ghi N16.
const NOI_E5 = { "q42-e5": "q42-e5n" }, NOI16_E5 = { q5: "q42-e5n" };
const dungE5 = (buoc = buocS09DanhBa) => buoc(db, { noi: NOI_E5, noiS16: NOI16_E5, log: () => {}, taoKhoa: taoKhoaThu });
const bkE5 = (k) => `bld_${("E5" + "KLXYN".indexOf(k)).padStart(26, "0")}`; // khoá Crockford: không chữ I, L, O, U
const TANG16_E5 = { K: [2, 3, 4, 5], L: [2, 3, 4, 5, 6, 7, 8, 9, 10], X: [2, 3, 4], Y: [1, 2, 3, 4, 5], N: [] };
const TANG09_E5 = { K: ["02", "03", "04", "05"], L: ["02", "03", "04", "05"], X: ["02", "03", "04", "05", "06", "07", "08"], Y: ["02", "03", "04", "05"], N: ["02", "03"] };
const LECH_PHAN_KHU_E5 = 1; // viết trước: một toà (K) S09 xếp vào phân khu khác S16

async function fixtureE5() {
  const nut = async (type, slug, ten, parent, meta) => (await db.query(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
     VALUES ($1, $3, $2, $4, '{}', '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta])).rows[0].id;
  const P = await nut("project", "q42-e5n", "Q42 E5 Dự án", null, {});
  const N16 = await nut("subzone", "q42-e5-k1", "Q42 E5 Khu 1", P, { s16_khu_ids: [khoaKhu("q5", "K1")] });
  const N09 = await nut("subzone", "q42-e5-s09", "Q42 E5 S09", P, { s09_sector_ids: ["sec5"] });
  for (const sn of ["q42-s16", "q42-s09cu"]) {
    await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}')`, [sn]);
  }
  await db.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ('q42-s16', 'q5', 'K1', 'Khu 1')`);
  for (const k of Object.keys(TANG16_E5)) {
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [bkE5(k), P]);
    await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16'), ($1, 'ten', $3, 'S16')`,
      [bkE5(k), `q5/T${k}`, `E5 ${k}`]);
    await db.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ('q42-s16', 'q5', 'K1', 'K1', $1, $2)`,
      [`T${k}`, `E5 ${k}`]);
    for (const t of TANG16_E5[k]) {
      await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                      VALUES ('q42-s16', 'q5', 'K1', $1, $2, $3, $4, 1)`, [`T${k}`, `E5 ${k}`, String(t), `E5${k}-${t}01`]);
    }
  }
  // Mã cũ DA31 của toà K: sector sec5 → S09 ghi phân khu N09.
  await db.query(`INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload) VALUES ('q42-s09cu', 'p5', 'du-an', $1)`,
    [{ chiTiet: { meta: { code: "200" }, data: { id: "p5", insight_by_block: [{ id: "b5", block_code: "E5K", sector_uuid: "sec5" }] } } }]);
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'p5/b5', 'S09')`, [bkE5("K")]);
  // Gói 1.
  await dongStg(SNAP_GOI_1, 501, KIND_GOI_1.danhMuc, SOURCE_ID_DANH_MUC_GOI_1, [duAn("q42-e5", "Q42 E5 S09")], "2026-11-20T02:00:00Z");
  await dongStg(SNAP_GOI_1, 502, KIND_GOI_1.toa, "q42-e5", Object.keys(TANG09_E5).map((k) => ({ id: `q42-e5-${k}`, name: `E5 ${k}` })), "2026-11-20T02:00:00Z");
  let dong = 503;
  for (const [k, ds] of Object.entries(TANG09_E5)) {
    await dongStg(SNAP_GOI_1, dong++, KIND_GOI_1.tang, `q42-e5-${k}`, ds.map((t) => ({ id: `q42-e5-${k}-${t}`, name: t })), "2026-11-20T02:00:00Z",
      { duAnId: "q42-e5" });
  }
  return { P, N16, N09 };
}

/** Lỗi của E5 so với giá trị viết trước; rỗng = đạt. */
async function loiE5(N, ra) {
  const q = async (sql, a = []) => (await db.query(sql, a)).rows;
  const loi = [];
  const vk = (await q("SELECT region_node_id::int AS n, nguon FROM v_toa_nut_vung WHERE building_key = $1", [bkE5("K")]))[0];
  if (vk?.n !== N.N16 || vk?.nguon !== "s16_phan_khu") loi.push(`S16 thắng: toà K không giữ phân khu S16 (nút ${vk?.n}, nguồn ${vk?.nguon})`);
  const lech = (await q("SELECT so FROM v_lech_cau_truc_s16 WHERE du_an = 'q5' AND cap_nguon = 'S09-S16' AND loai = 'phan-khu'"))[0]?.so ?? 0;
  if (lech !== LECH_PHAN_KHU_E5) loi.push(`số lệch phân khu S09-S16 là ${lech}, viết trước ${LECH_PHAN_KHU_E5}`);
  const bd = Object.fromEntries((await q(
    "SELECT value, object_key FROM registry_aliases WHERE source = 'S09' AND kind = 'ma_nguon' AND value LIKE 'danh-ba-toa/q42-e5-%'")).map((r) => [r.value, r.object_key]));
  for (const k of ["K", "X", "Y", "N"]) if (bd[`danh-ba-toa/q42-e5-${k}`] !== bkE5(k)) loi.push(`toà ${k} phải thành bí danh của toà S16 cùng tên`);
  if (bd["danh-ba-toa/q42-e5-L"] === bkE5("L")) loi.push("hai toà cùng tên: toà L lệch tầng mà thành bí danh của toà S16");
  const theL = (await q("SELECT count(*)::int AS n FROM review_queue WHERE item_type = 'entity_match' AND item_id = 's09-toa-lech-s16:q42-e5-L'"))[0].n;
  if (theL !== 1) loi.push(`hai toà cùng tên: toà L có ${theL} thẻ lệch tầng, phải đúng 1`);
  const theKhac = (await q(`SELECT count(*)::int AS n FROM review_queue WHERE item_type = 'entity_match'
                              AND item_id LIKE 's09-toa-lech-s16:q42-e5-%' AND item_id <> 's09-toa-lech-s16:q42-e5-L'`))[0].n;
  if (theKhac) loi.push(`${theKhac} thẻ lệch tầng cho toà không lệch (K, X, Y, N)`);
  if (ra && ra.toa.khong_so !== 1) loi.push(`bộ đếm toà không so được là ${ra.toa.khong_so}, viết trước 1 (toà N)`);
  return loi;
}

test("DA42 E5 (AC-5): S16 giữ phân khu, lệch đếm theo cặp nguồn, luật lệch tầng một chiều; đỏ khi S09 trên S16 và khi bỏ so tầng", async () => {
  await db.query("BEGIN");
  try {
    const N = await fixtureE5();
    await db.query("SAVEPOINT e5");
    const ra = await dungE5();
    assert.deepEqual(await loiE5(N, ra), []);

    // Chiều đỏ 1: view nút vùng xếp phân khu S09 trên S16.
    const than = readFileSync(join(import.meta.dirname, "../../db/migrations/114_v_toa_nut_vung_s16_bam.sql"), "utf8");
    const viewS09Truoc = than.slice(than.indexOf("CREATE OR REPLACE VIEW v_toa_nut_vung"))
      .replace("COALESCE(pk16.id, cum.id, pk.id, b.region_node_id)", "COALESCE(cum.id, pk.id, pk16.id, b.region_node_id)")
      .replace("CASE WHEN pk16.id IS NOT NULL THEN 's16_phan_khu' WHEN cum.id IS NOT NULL THEN 's09_cum'\n            WHEN pk.id IS NOT NULL THEN 's09_phan_khu' ELSE 'goc' END",
               "CASE WHEN cum.id IS NOT NULL THEN 's09_cum' WHEN pk.id IS NOT NULL THEN 's09_phan_khu'\n            WHEN pk16.id IS NOT NULL THEN 's16_phan_khu' ELSE 'goc' END");
    assert.notEqual(viewS09Truoc, than.slice(than.indexOf("CREATE OR REPLACE VIEW v_toa_nut_vung")), "đột biến view không khớp 114");
    await db.query("SAVEPOINT e5v");
    await db.query(viewS09Truoc);
    const loi1 = await loiE5(N, ra);
    assert.ok(loi1.some((l) => l.startsWith("S16 thắng")), `đột biến S09 trên S16 phải đỏ nêu «S16 thắng»: ${JSON.stringify(loi1)}`);
    await db.query("ROLLBACK TO SAVEPOINT e5v");

    // Chiều đỏ 2: bỏ so số tầng (mọi toà cùng tên thành bí danh).
    await db.query("ROLLBACK TO SAVEPOINT e5");
    const dot = await buocDotBien([[
      "const soTang = (t, b) => lechTangS16({ so: t.so_tang, ten: t.tang }, { so: b.so_tang_s16, ten: b.tang_s16 });",
      "const soTang = () => false;"]]);
    const ra2 = await dungE5(dot);
    const loi2 = await loiE5(N, ra2);
    assert.ok(loi2.some((l) => l.startsWith("hai toà cùng tên")), `đột biến bỏ so tầng phải đỏ nêu «hai toà cùng tên»: ${JSON.stringify(loi2)}`);
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- E8 (AC-8): chạy lại và đổi thứ tự nguồn không đổi kết quả --------------------------------------------------------------
// Hai DB riêng cùng fixture: DB một dựng S09 gói 1 rồi S16, DB hai S16 rồi S09. Toà A khớp tầng (2–5 ↔ 02–05), toà B lệch
// (2–10 ↔ 02–05) — đúng chỗ thứ tự có thể làm khác kết quả nếu bước S16 không tra bí danh S09.
/** Bản chép ẩn của một module lib (đã thay), import trực tiếp; xoá ngay sau import. */
async function modDotBien(tep, thay) {
  const ten = `.s09t-cu-${process.pid}-${++demDotBien}-${tep}`;
  let ma = readFileSync(join(LIB, tep), "utf8");
  for (const [a, b] of thay) {
    if (!ma.includes(a)) throw new Error(`đột biến không khớp mã hiện tại: ${a.slice(0, 60)}`);
    ma = ma.replace(a, b);
  }
  writeFileSync(join(LIB, ten), ma);
  try { return await import(pathToFileURL(join(LIB, ten)).href); } finally { rmSync(join(LIB, ten), { force: true }); }
}

const SLUG_E8 = "q42-e8n";
const TANG_E8 = { A: { s16: [2, 3, 4, 5], s09: ["02", "03", "04", "05"] }, B: { s16: [2, 3, 4, 5, 6, 7, 8, 9, 10], s09: ["02", "03", "04", "05"] } };

async function nutE8(c) {
  return (await c.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
                         VALUES ('project', 'Q42 E8 Dự án', $1, '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`, [SLUG_E8])).rows[0].id;
}
async function napS16E8(c) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q42-e8-s16', 'vn', 'S16', '{}')`);
  await c.query(`INSERT INTO stg_s16_khu (snapshot_id, du_an, khu_id, khu_ten) VALUES ('q42-e8-s16', 'q8', 'K1', 'Khu 1')`);
  for (const [k, t] of Object.entries(TANG_E8)) {
    await c.query(`INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten) VALUES ('q42-e8-s16', 'q8', 'K1', 'K1', $1, $2)`,
      [`T${k}`, `E8 ${k}`]);
    for (const f of t.s16) {
      await c.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                     VALUES ('q42-e8-s16', 'q8', 'K1', $1, $2, $3, $4, 1)`, [`T${k}`, `E8 ${k}`, String(f), `E8${k}-${f}01`]);
    }
  }
}
async function napS09E8(c) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q42-e8-goi1', 'vn', 's09-danh-ba', '{}')`);
  const ghi = (dong, kind, sid, data, meta = {}) => c.query(
    `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at) VALUES ('q42-e8-goi1', $1, $2, $3, $4::jsonb, $5::jsonb, '2026-11-21T00:00:00Z')`,
    [dong, kind, sid, JSON.stringify({ code: "200", data }), JSON.stringify(meta)]);
  await ghi(1, KIND_GOI_1.danhMuc, SOURCE_ID_DANH_MUC_GOI_1, [duAn("q42-e8", "Q42 E8 S09")]);
  await ghi(2, KIND_GOI_1.toa, "q42-e8", Object.keys(TANG_E8).map((k) => ({ id: `q42-e8-${k}`, name: `E8 ${k}` })));
  let dong = 3;
  for (const [k, t] of Object.entries(TANG_E8)) await ghi(dong++, KIND_GOI_1.tang, `q42-e8-${k}`, t.s09.map((f) => ({ id: `q42-e8-${k}-${f}`, name: f })), { duAnId: "q42-e8" });
}

const buoc09E8 = (c) => buocS09DanhBa(c, { log: () => {}, taoKhoa: taoKhoaThu, noi: { "q42-e8": SLUG_E8 }, noiS16: { q8: SLUG_E8 } });
const buoc16E8 = (c, P, b16 = buocS16) => b16(c, { log: () => {}, taoKhoa: taoKhoaThu, khu: new Map([[P, { id: P, slug: SLUG_E8 }]]),
  isoKhu: new Map([[P, "VN-HN"]]), noi: { q8: SLUG_E8 } });
const thuTu = async (c, P, s09Truoc, b16 = buocS16) => {
  if (s09Truoc) { await buoc09E8(c); await buoc16E8(c, P, b16); } else { await buoc16E8(c, P, b16); await buoc09E8(c); }
};

/** Ảnh nội dung (không phụ thuộc khoá sinh): toà và căn theo chữ ký bí danh, thẻ theo mã; kèm số đếm và băm tập khoá. */
async function anhE8(c) {
  const q = async (sql) => (await c.query(sql)).rows;
  // Bí danh tên so theo giá trị, không theo nguồn: chỉ mục duy nhất của bí danh tên là (đối tượng, loại, giá trị), nguồn nào ghi
  // trước thì giữ (thiết kế từ DA33/DA37), nên nguồn của cùng một tên đổi theo thứ tự là đúng thiết kế. Mã nguồn so kèm nguồn.
  const sig = Object.fromEntries((await q(`SELECT b.building_key AS k,
                                                  string_agg(CASE WHEN a.kind = 'ten' THEN 'ten|' || a.value ELSE a.source || '|' || a.kind || '|' || a.value END,
                                                             ';' ORDER BY a.kind, a.source, a.value) AS s
                                             FROM buildings b LEFT JOIN registry_aliases a ON a.object_key = b.building_key AND a.retired_at IS NULL
                                            GROUP BY 1`)).map((r) => [r.k, r.s ?? ""]));
  const toa = Object.values(sig).sort();
  const can = (await q(`SELECT u.building_key AS b, string_agg(a.source || '|' || a.value, ';' ORDER BY a.source, a.value) AS s
                          FROM units u LEFT JOIN registry_aliases a ON a.object_key = u.unit_key AND a.retired_at IS NULL
                         GROUP BY u.unit_key, u.building_key`)).map((r) => `${r.s ?? ""}@${sig[r.b] ?? "?"}`).sort();
  const the = (await q("SELECT item_type || '|' || item_id || '|' || status AS t FROM review_queue")).map((r) => r.t).sort();
  const dem = (await q(`SELECT (SELECT count(*) FROM buildings)::int AS toa, (SELECT count(*) FROM units)::int AS can,
                               (SELECT count(*) FROM stacks)::int AS truc, (SELECT count(*) FROM registry_aliases)::int AS bi_danh,
                               (SELECT count(*) FROM review_queue)::int AS the`))[0];
  const bam = createHash("sha256").update(Object.keys(sig).sort().join("\n")).digest("hex");
  return { toa, can, the, dem, bam };
}
const quyetDinh = (a) => JSON.stringify([a.toa.map((x) => x.split(";").filter((y) => !y.startsWith("ten|")).join(";")).sort(), a.the]);
const giongNoiDung = (a, b) => JSON.stringify([a.toa, a.can, a.the]) === JSON.stringify([b.toa, b.can, b.the]);

test("DA42 E8 (AC-8): hai DB hai thứ tự nguồn cùng toà, căn, bí danh, thẻ; dựng lại 0 mới; đỏ khi bước S16 bỏ tra bí danh S09", async () => {
  const TEN2 = `${TEN}_b`;
  const db2 = new pg.Client({ connectionString: await taoDbThu(TEN2) });
  await db2.connect();
  try {
    await db.query("BEGIN"); await db2.query("BEGIN");
    const P1 = await nutE8(db), P2 = await nutE8(db2);
    await db.query("SAVEPOINT e8nut");
    await napS16E8(db); await napS09E8(db); await napS16E8(db2); await napS09E8(db2);
    await db.query("SAVEPOINT e8"); await db2.query("SAVEPOINT e8");
    await thuTu(db, P1, true); await thuTu(db2, P2, false);
    const a1 = await anhE8(db), a2 = await anhE8(db2);
    assert.ok(a1.toa.length >= 3, `tiền đề: phải có toà A và hai toà B (lệch tầng), thấy ${a1.toa.length}`);
    assert.ok(a1.the.some((t) => t.includes("s09-toa-lech-s16:q42-e8-B")), "tiền đề: toà B lệch tầng phải có thẻ");
    assert.ok(giongNoiDung(a1, a2), `thứ tự: hai thứ tự nguồn ra khác nhau\n${JSON.stringify({ s09Truoc: a1, s16Truoc: a2 }, null, 1)}`);
    // Dựng thêm hai lần: 0 khoá, 0 bí danh, 0 thẻ mới; băm tập khoá giữ nguyên.
    const chuong = async (c) => (await c.query(SQL_CHUONG_TEN_LECH)).rows[0].so_toa;
    assert.equal(await chuong(db), 0, "chuông: cùng bộ dòng stg, S09 trước — không toà nào giữ tên khi lệch");
    assert.equal(await chuong(db2), 0, "chuông: cùng bộ dòng stg, S16 trước — không toà nào giữ tên khi lệch");
    for (const [c, P, s09Truoc, a] of [[db, P1, true, a1], [db2, P2, false, a2]]) {
      await thuTu(c, P, s09Truoc); await thuTu(c, P, s09Truoc);
      const b = await anhE8(c);
      assert.deepEqual(b.dem, a.dem, "dựng lại sinh khoá, bí danh hay thẻ mới");
      assert.equal(b.bam, a.bam, "dựng lại đổi tập khoá toà");
    }

    // Thứ tự ĐẾN của nguồn: S09 gói 1 về và dựng trước, S16 về sau (bước S09 chưa thấy S16 nên chưa biết B lệch). Bước S16 phải
    // tra bí danh S09 để ra cùng quyết định với S16-trước: B của S09 không mang mã S16, có thẻ lệch tầng, toà S16 đúc riêng.
    // So mã nguồn và thẻ; tên không so ở đây (giới hạn ghi ở kế hoạch §2: toà S09 đúc trước khi biết lệch giữ tên của nó).
    const denSau = async (b16 = buocS16) => {
      await db.query("ROLLBACK TO SAVEPOINT e8nut");
      await napS09E8(db); await buoc09E8(db);
      await napS16E8(db); await buoc16E8(db, P1, b16);
      return anhE8(db);
    };
    const a3 = await denSau();
    // Chuông kêu đúng ca DA57 sẽ sửa: S16 về sau, toà B của S09 giữ tên «E8 B».
    assert.equal((await db.query(SQL_CHUONG_TEN_LECH)).rows[0].so_toa, 1, "chuông: thứ tự đến S16 về sau phải đếm đúng toà B");
    assert.equal(quyetDinh(a3), quyetDinh(a2), `thứ tự đến: S16 về sau S09 ra khác quyết định với S16 trước\n${JSON.stringify({ s16VeSau: a3, s16Truoc: a2 }, null, 1)}`);

    // Chiều đỏ: bước S16 bỏ tra bí danh S09 gói 1 — kịch bản thứ tự đến ra khác.
    const { buocS16: b16Hong } = await modDotBien("s16-dung.mjs", [[
      "const s09Toa = await soTangS09TheoToa(c, khoaToaKhu);", "const s09Toa = new Map();"]]);
    const a4 = await denSau(b16Hong);
    assert.notEqual(quyetDinh(a4), quyetDinh(a2), "thứ tự: đột biến bỏ tra bí danh S09 trong bước S16 mà thứ tự đến vẫn ra cùng quyết định");
  } finally {
    await db.query("ROLLBACK").catch(() => {}); await db2.query("ROLLBACK").catch(() => {});
    await db2.end().catch(() => {});
    await xoaDbThu(TEN2);
  }
});

// ---- E9 (AC-9): mọi thứ rời máy chỉ mang mã S09 ----------------------------------------------------------------------------
// Bảng không bao giờ lên cloud: stg gói 1 và ba bảng vật thể (cùng bí danh).
const BANG_CAM_E9 = [/^stg_/, "buildings", "stacks", "units", "registry_aliases"];
const bangCamTrongDay = (fill) => fill.filter((t) => BANG_CAM_E9.some((m) => (m instanceof RegExp ? m.test(t) : m === t)));
// Tệp của hàng (diff so nhánh chính) đem soát tên thật.
const VUNG_E9 = [/^db\/migrations\/1(15|25)_/, /^pipeline\/lib\/s09-(danh-ba-can|dung)/, /^pipeline\/lib\/s16-dung/, /^pipeline\/import-s09-danh-ba/,
  /^pipeline\/scripts\/danh-ba-s09-toa/, /^docs\/superpowers\/(plans|specs)\/2026-11-(18|21)-nap-s09-toa-tang/, /^_acceptance\/nap-s09-toa-tang-vao-danh-ba\//];

/** Chỗ trúng tên nguồn → «bảng.cột» hay «tệp»; KHÔNG giá trị. */
const noiTrung = (h) => h.path.replace(/\[\d+\]/g, "").split(".").slice(0, 2).join(".");

test("DA42 E9 (AC-9): danh sách đẩy không có stg gói 1 và bảng vật thể; nút ứng viên không qua điều kiện gắn tin; thẻ, log, tệp 0 tên thật; đỏ khi cấy tên", async () => {
  // 1. Danh sách đẩy của sync-cloud.
  assert.deepEqual(bangCamTrongDay(FILL), [], "danh sách đẩy cloud có bảng cấm");
  assert.deepEqual(bangCamTrongDay([...FILL, "stg_s09_danh_ba", "buildings"]), ["stg_s09_danh_ba", "buildings"], "chiều đỏ: bộ kiểm bảng cấm phải bắt");

  // 2. Danh sách tên nguồn thật: DB máy thu, chỉ đọc; đọc không được hay rỗng thì đỏ (không âm thầm bỏ phần soát).
  const may = new pg.Client({ connectionString: process.env.S09_MAY_THU ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await may.connect();
  let entries, dinhDanh;
  try {
    await may.query("SET default_transaction_read_only = on");
    entries = await docSourceNameEntries(may);
    // Định danh lược đồ có từ trước hàng (tên bảng, cột — vd airbnb_snapshots) không phải chỗ lộ tên nguồn: bỏ khỏi TỆP và LOG trước
    // khi dò, như s09-ranh-gioi.mjs của DA31. Thẻ (đi cloud qua review_queue) soát nguyên văn.
    dinhDanh = new Set((await may.query(`SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public'
                                          UNION SELECT column_name FROM information_schema.columns WHERE table_schema = 'public'`)).rows.map((r) => r.t));
  } finally { await may.end(); }
  const boDinhDanh = (t) => String(t).replace(/[A-Za-z0-9_]+/g, (w) => (dinhDanh.has(w) ? " " : w));
  assert.ok(entries.length > 0, "không đọc được danh sách tên nguồn (source_registry) — phần soát tên không chạy được");

  await db.query("BEGIN");
  try {
    // 3. Dựng các fixture có thẻ (E3: thẻ luật, thẻ cặp, nút ứng viên · E4: thẻ toà · E5: thẻ lệch tầng), giữ log.
    const log = [];
    const N3 = await fixtureE3();
    await buocS09DanhBa(db, { noi: NOI_E3, noiS16: {}, log: (x) => log.push(x), taoKhoa: taoKhoaThu });
    await fixtureE4();
    await buocS09DanhBa(db, { noi: NOI_E4, noiS16: {}, log: (x) => log.push(x), taoKhoa: taoKhoaThu });
    await fixtureE5();
    await buocS09DanhBa(db, { noi: NOI_E5, noiS16: NOI16_E5, log: (x) => log.push(x), taoKhoa: taoKhoaThu });
    const the = (await db.query("SELECT item_id, title, evidence, decision_note FROM review_queue ORDER BY item_id")).rows;
    assert.ok(the.length >= 5, `tiền đề: phải có thẻ để soát, thấy ${the.length}`);

    // 4. Nút ứng viên không qua điều kiện gắn tin (bộ gắn S06 bỏ nút bậc mot_loi_khai; S03 cùng luật ở du-an-tren-tin-s03.mjs).
    const uv = (await db.query(`SELECT n.id::int AS id, n.name, n.catalog_tier FROM asset_nodes n JOIN registry_aliases a ON a.object_key = 'node:' || n.id
                                 WHERE a.source = 'S09' AND a.value = 'danh-ba-du-an/q42-pu'`)).rows[0];
    assert.equal(uv?.catalog_tier, "mot_loi_khai");
    const ma = { ma: "e9", ten: uv.name, tinh: ["01"], xaNhieu: "", soTin: 3, dlatM: 0 };
    assert.notEqual(phanLop(ma, [{ ...uv, tinh: "01" }]).node_id, uv.id, "nút ứng viên S09 được bộ gắn tin S06 nhận");
    assert.equal(phanLop(ma, [{ ...uv, catalog_tier: "xac_minh", tinh: "01" }]).node_id, uv.id, "chiều đỏ: cùng nút bậc xác minh phải được nhận");

    // 5. Soát tên thật: thẻ, log, tệp của hàng. Báo chỗ trúng, không giá trị.
    const tep = execFileSync("git", ["-C", join(import.meta.dirname, "../.."), "diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" })
      .split("\n").filter((f) => VUNG_E9.some((re) => re.test(f)));
    assert.ok(tep.length > 0, "tiền đề: phải có tệp của hàng để soát");
    const noiDungTep = Object.fromEntries(tep.map((f) => {
      try { return [f, boDinhDanh(readFileSync(join(import.meta.dirname, "../..", f), "utf8"))]; } catch { return [f, ""]; }
    }));
    const trung = guardValues({ review_queue: the, log: log.map(boDinhDanh), tep: noiDungTep }, entries);
    assert.deepEqual(trung.map(noiTrung), [], "thẻ, log hay tệp của hàng mang tên nguồn thật");

    // Chiều đỏ: cấy một tên nguồn GIẢ LẬP vào thẻ → bộ soát nêu bảng và cột, không in giá trị.
    const GIA = "zz-nguon-gia-lap-e9";
    await db.query("UPDATE review_queue SET evidence = evidence || jsonb_build_object('ghi', $1::text) WHERE item_id = (SELECT min(item_id) FROM review_queue)", [`bài từ ${GIA}`]);
    const the2 = (await db.query("SELECT item_id, title, evidence, decision_note FROM review_queue ORDER BY item_id")).rows;
    const trung2 = guardValues({ review_queue: the2 }, [...entries, { code: "S99", realName: GIA, wholeOnly: false }]);
    const bao = trung2.map(noiTrung);
    assert.deepEqual(bao, ["review_queue.evidence"], "chiều đỏ: cấy tên giả lập vào thẻ phải bị bắt ở review_queue.evidence");
    assert.ok(!JSON.stringify(trung2).includes(GIA), "bộ soát in giá trị trúng");
    void N3;
  } finally {
    await db.query("ROLLBACK");
  }
});

// ---- E1 (AC-1): gói 1 nạp vào stg không nhân dòng ----------------------------------------------------------------------------
// Fixture pipeline/tests/fixtures/s09-danh-ba: tập con của bản thu gói 1 thật ngày 19/11 (che meta.duong), 7 item tốt
// (1 danh-muc · 2 toa · 2 tang · 1 khu-thap-tang · 1 can-thap-tang) + 3 item hỏng (phi-object, thiếu kind, thiếu sourceId).
const FIXTURE_E1 = join(import.meta.dirname, "../tests/fixtures/s09-danh-ba");
const SNAP_E1 = "vn__s09-danh-ba__fixture-e1";
const MIG = (n) => join(import.meta.dirname, "../../db/migrations", n);

test("DA42 E1 (AC-1): fixture thật nạp hai lần — lần một đúng số dòng, lần hai 0; item hỏng đếm theo lý do; áp 115, 125 lần hai không đổi lược đồ; đỏ khi sai băm", async () => {
  const luocDo = async () => (await db.query(`SELECT
      (SELECT string_agg(column_name || ':' || data_type, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name = 'stg_s09_danh_ba') AS cot,
      (SELECT string_agg(conname, ',' ORDER BY conname) FROM pg_constraint WHERE conrelid = 'stg_s09_danh_ba'::regclass) AS rang_buoc,
      (SELECT string_agg(c.relname || '=' || md5(pg_get_viewdef(c.oid)), ',' ORDER BY c.relname) FROM pg_class c WHERE c.relname LIKE 'v_s09_db_%') AS view`)).rows[0];
  const demDong = async (sn) => (await db.query("SELECT count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id = $1", [sn])).rows[0].n;
  const tam = mkdtempSync(join(tmpdir(), "s09t-e1-"));
  try {
    const r1 = await napDanhBaThuMuc(FIXTURE_E1, URL_THU);
    assert.equal(r1.ghi, 7, "lần một: số dòng ghi");
    assert.equal(r1.bo, 3);
    assert.deepEqual(r1.boTheoLyDo, { phi_object: 1, thieu_kind: 1, thieu_source_id: 1 }, "item hỏng đếm theo lý do");
    const r2 = await napDanhBaThuMuc(FIXTURE_E1, URL_THU);
    assert.equal(r2.ghi, 0, "lần hai ghi thêm dòng");
    assert.equal(r2.soCoSan, 7);
    assert.equal(await demDong(SNAP_E1), 7);
    const theoKind = Object.fromEntries((await db.query("SELECT kind, count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id = $1 GROUP BY 1", [SNAP_E1])).rows.map((r) => [r.kind, r.n]));
    assert.deepEqual(theoKind, { "danh-muc": 1, toa: 2, tang: 2, "khu-thap-tang": 1, "can-thap-tang": 1 });

    // Áp 115 rồi 125 lần hai: không lỗi, lược đồ bảng và định nghĩa view không đổi.
    const truoc = await luocDo();
    apTep(TEN, MIG("115_stg_s09_danh_ba.sql"));
    apTep(TEN, MIG("125_v_s09_db_du_an_ma_tinh.sql"));
    assert.deepEqual(await luocDo(), truoc, "áp 115, 125 lần hai đổi lược đồ");

    // Chiều đỏ: sửa một byte của tệp items (manifest đổi snapshotId để đếm riêng) → ném «sai băm», 0 dòng.
    cpSync(FIXTURE_E1, tam, { recursive: true });
    const tepItems = join(tam, "items-0001.json.gz");
    const b = readFileSync(tepItems); b[b.length - 5] ^= 0xff; writeFileSync(tepItems, b);
    const mf = JSON.parse(readFileSync(join(tam, "manifest.json"), "utf8"));
    writeFileSync(join(tam, "manifest.json"), JSON.stringify({ ...mf, snapshotId: `${SNAP_E1}-hong` }));
    await assert.rejects(napDanhBaThuMuc(tam, URL_THU), /sai băm/, "sửa một byte mà bộ nạp không báo «sai băm»");
    assert.equal(await demDong(`${SNAP_E1}-hong`), 0, "lượt sai băm vẫn ghi dòng");
  } finally {
    rmSync(tam, { recursive: true, force: true });
    await db.query("DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE $1", [`${SNAP_E1}%`]);
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
    const ra = await buocS09DanhBa(db, { noi: {}, noiS16: {}, log: () => {}, taoKhoa: (t) => `${t}_${String(++n).padStart(26, "0")}` });
    return { views, ra };
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT q42");
  }
}
