// nhom-hai-lan-transform.itest.mjs — hồ sơ _acceptance/nhom-hai-lan-s03-xu-goc E1, E2, E3: transform so khoá nhóm đã chuẩn hoá.
// Chỉ trên DB thử, BEGIN…ROLLBACK, xoá bài và sổ thật trong giao dịch để chỉ còn fixture. Khoá fixture `nhl-…`, không có khoá thật.
import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { docThiTruongNhom, runTransformZalo, tangLoai } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("nhom-hai-lan-transform: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");

const SNAP = "hanoi__zalo-agent__2099-01-05T000000";
const TIEN_TO = (k) => `kx:group:${k}`;
const NGUYEN_VAN = (k) => k;
const GOP_QUA_TAY = (k) => String(k).replace(/^.*:/, "");
const loi = [];
const kiem = (dieu, ok, sai) => {
  console.log(dieu ? `ok ${ok}` : sai);
  if (!dieu) loi.push(sai);
};

async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await c.query("DELETE FROM stg_zalo_posts");
    await c.query("DELETE FROM collection_units WHERE source_code = 'S03'");
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
      ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Bài đệm nói rõ bán, nói rõ căn hộ: đủ để nhóm có mục đích và loại hình khi đếm trên hợp các dạng khoá. */
async function dem(c, khoa, n, tu) {
  for (let i = 0; i < n; i++) {
    const so = tu + i;
    await bai(c, `dem-${so}`, khoa, `Bán căn hộ chung cư 2PN ${50 + so}m2 giá ${(2 + so / 100).toFixed(2)} tỷ liên hệ`);
  }
}
const bai = (c, id, khoa, text) => c.query(
  `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, conversation_id)
   VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử NHL', $3, '2099-01-05T01:00:00Z', $4, $5)`, [`nhl_${id}`, SNAP, text, `nhl_nguoi_${id}`, khoa]);
/** Bài không tự nói loại tin: chỉ nhận loại nếu nhóm có mục đích. */
const baiMucDich = (c, id, khoa, so) => bai(c, `md-${id}`, khoa, `Căn 2PN ${70 + so}m2. Giá: ${4000 + so * 10}`);
/** Bài nói bán nhưng không nói loại hình: chỉ nhận loại hình nếu nhóm có loại hình. */
const baiLoaiHinh = (c, id, khoa, so) => bai(c, `lh-${id}`, khoa, `Bán 2PN ${90 + so}m2 giá ${(5 + so / 10).toFixed(1)} tỷ`);
/** Bài thường, để đọc khu vực nhóm gán. */
const baiThiTruong = (c, id, khoa, so) => bai(c, `tt-${id}`, khoa, `Bán căn hộ 2PN ${110 + so}m2 giá ${(7 + so / 10).toFixed(1)} tỷ`);
const dongSo = (c, khoa, thiTruong) => c.query(
  "INSERT INTO collection_units (source_code, group_key, name, status, market_codes) VALUES ('S03', $1, 'Nhóm thử NHL', 'active', $2)", [khoa, thiTruong]);

async function dungFixture(c) {
  // AC-1: mỗi dạng 12 bài đệm, riêng lẻ chưa đủ 20, hợp lại 24.
  await dem(c, "nhl-a", 12, 0);
  await dem(c, TIEN_TO("nhl-a"), 12, 12);
  await baiMucDich(c, "a-tran", "nhl-a", 1);
  await baiMucDich(c, "a-tt", TIEN_TO("nhl-a"), 2);
  await baiLoaiHinh(c, "a-tran", "nhl-a", 1);
  await baiLoaiHinh(c, "a-tt", TIEN_TO("nhl-a"), 2);
  // AC-2: dòng khoá trần khai, dòng tiền tố không khai; hai dòng khác thị trường theo hai thứ tự đăng ký; chỉ dòng tiền tố khai.
  await dongSo(c, "nhl-b", ["vn-hanoi"]);
  await dongSo(c, TIEN_TO("nhl-b"), []);
  await baiThiTruong(c, "b-tt", TIEN_TO("nhl-b"), 1);
  await dongSo(c, TIEN_TO("nhl-c"), ["vn-hcmc"]);
  await dongSo(c, "nhl-c", ["vn-hanoi"]);
  await baiThiTruong(c, "c-tt", TIEN_TO("nhl-c"), 2);
  await dongSo(c, "nhl-e", ["vn-hanoi"]);
  await dongSo(c, TIEN_TO("nhl-e"), ["vn-hcmc"]);
  await baiThiTruong(c, "e-tt", TIEN_TO("nhl-e"), 3);
  await dongSo(c, TIEN_TO("nhl-d"), ["vn-hcmc"]);
  await baiThiTruong(c, "d-tt", TIEN_TO("nhl-d"), 4);
  await baiThiTruong(c, "d-tran", "nhl-d", 5);
  // AC-3: khoá lạ cạnh một nhóm đủ mục đích và loại hình.
  await dem(c, "nhl-x", 24, 30);
  for (const [i, k] of ["conv:nhl-x", "a:b:group:nhl-x", "k:group:", null].entries()) {
    await baiMucDich(c, `x-${i}`, k, 10 + i);
    await baiLoaiHinh(c, `x-${i}`, k, 10 + i);
  }
}

async function chay(khoaNhom) {
  return trongGiaoDich(async (c) => {
    await dungFixture(c);
    const r = await imLog(() => runTransformZalo(c, khoaNhom ? { khoaNhom } : {}));
    const { rows } = await c.query("SELECT post_ids, kind, property_type, area_id FROM sale_offers WHERE source = 'S03'");
    const tin = new Map(rows.flatMap((o) => o.post_ids.map((id) => [id, o])));
    const { posts } = await loadStgPosts(c, "zalo");
    const tang = tangLoai(posts, khoaNhom ? { khoaNhom } : {});
    return { r, tin, tang, thiTruong: await docThiTruongNhom(c, ...(khoaNhom ? [khoaNhom] : [])) };
  });
}
const kind = (s, id) => s.tin.get(`nhl_md-${id}`)?.kind ?? null;
const loai = (s, id) => s.tin.get(`nhl_lh-${id}`)?.property_type ?? null;
const khuVuc = (s, id) => s.tin.get(`nhl_tt-${id}`)?.area_id ?? null;
const tang = (s, id) => s.tang.get(`nhl_md-${id}`);
const LE = ["x-0", "x-1", "x-2", "x-3"];
const anhKhoaLe = (s) => JSON.stringify(LE.flatMap((id) => [kind(s, id), loai(s, id), tang(s, id)]));

const mac = await chay(null);
const van = await chay(NGUYEN_VAN);
const qua = await chay(GOP_QUA_TAY);

// E1 — AC-1
kiem(kind(mac, "a-tran") === "sale" && kind(mac, "a-tt") === "sale", "AC-1 muc dich tinh tren hop", `loi muc dich hop: ${kind(mac, "a-tran")}, ${kind(mac, "a-tt")}`);
kiem(loai(mac, "a-tran") === "apartment" && loai(mac, "a-tt") === "apartment", "AC-1 loai hinh tinh tren hop", `loi loai hinh hop: ${loai(mac, "a-tran")}, ${loai(mac, "a-tt")}`);
kiem(tang(mac, "a-tran") === "moi-nhan" && tang(mac, "a-tt") === "moi-nhan", "AC-1 tangLoai cung ket qua", `loi tangLoai: ${tang(mac, "a-tran")}, ${tang(mac, "a-tt")}`);
kiem(mac.r.bai_doi_khoa > 0 && van.r.bai_doi_khoa === 0, `AC-1 bai doi khoa ${mac.r.bai_doi_khoa}`, `loi dem bai doi khoa: ${mac.r.bai_doi_khoa}, ${van.r.bai_doi_khoa}`);
kiem(kind(van, "a-tran") === null && kind(van, "a-tt") === null && tang(van, "a-tt") === "van-bo", "do: khoa nguyen van tach doi muc dich", "loi thuoc muc dich khong do");
kiem(loai(van, "a-tran") !== "apartment" && loai(van, "a-tt") !== "apartment", "do: khoa nguyen van tach doi loai hinh", "loi thuoc loai hinh khong do");

// E2 — AC-2
kiem(khuVuc(mac, "b-tt") === "vn-hanoi", "AC-2 bai tien to nhan thi truong dong tran", `loi thi truong dong tran: ${khuVuc(mac, "b-tt")}`);
kiem(khuVuc(mac, "c-tt") === "vn-hanoi" && khuVuc(mac, "e-tt") === "vn-hanoi", "AC-2 dong tran thang", `loi dong tran thang: ${khuVuc(mac, "c-tt")}, ${khuVuc(mac, "e-tt")}`);
kiem(khuVuc(mac, "d-tt") === "vn-hcmc" && khuVuc(mac, "d-tran") === "vn-hcmc", "AC-2 chi dong tien to khai", `loi chi dong tien to: ${khuVuc(mac, "d-tt")}, ${khuVuc(mac, "d-tran")}`);
const tra = (k) => mac.thiTruong.get(k)?.join();
kiem(tra("nhl-c") === "vn-hanoi" && tra(TIEN_TO("nhl-c")) === "vn-hcmc" && tra("nhl-e") === "vn-hanoi" && tra(TIEN_TO("nhl-e")) === "vn-hcmc",
  "AC-2 tra theo khoa nguyen van ca hai dong", "loi tra theo khoa nguyen van");
kiem(khuVuc(van, "b-tt") === null && khuVuc(van, "d-tran") === null, "do: khoa nguyen van mat thi truong", "loi thuoc thi truong khong do");

// E3 — AC-3
kiem(["x-0", "x-1", "x-2"].every((id) => kind(mac, id) === null && loai(mac, id) !== "apartment"), "AC-3 khoa la khong gop", "loi khoa la bi gop");
kiem(kind(mac, "x-3") === null && loai(mac, "x-3") !== "apartment", "AC-3 khong co khoa khong vao nhom", "loi bai khong khoa vao nhom");
kiem(anhKhoaLe(mac) === anhKhoaLe(van), "AC-3 y het nguyen van", "loi khoa la khac nguyen van");
kiem(kind(qua, "x-0") === "sale" && anhKhoaLe(qua) !== anhKhoaLe(van), "do: gop qua tay", "loi thuoc gop qua tay khong do");

console.log(loi.length ? `NHOM HAI LAN TRANSFORM FAIL (${loi.length})` : "NHOM HAI LAN TRANSFORM OK");
process.exit(loi.length ? 1 : 0);
