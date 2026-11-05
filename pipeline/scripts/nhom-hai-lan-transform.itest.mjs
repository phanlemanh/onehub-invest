// nhom-hai-lan-transform.itest.mjs — hồ sơ _acceptance/nhom-hai-lan-s03-xu-goc E1, E2, E3: transform so khoá nhóm đã chuẩn hoá.
// Chỉ trên DB thử, BEGIN…ROLLBACK, xoá bài và sổ thật trong giao dịch để chỉ còn fixture. Khoá fixture `nhl-…`, không có khoá thật.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { KENH_NGUON } from "../lib/danh-ba-nguoi.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { docThiTruongNhom, runTransformZalo, tangLoai } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("nhom-hai-lan-transform: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");

const AGENT = Object.keys(KENH_NGUON).find((k) => KENH_NGUON[k] === "S03");
const KENH_S03 = "stg_zalo_posts".split("_")[1]; // khoá kênh S03 của loadStgPosts, lấy theo tên bảng stg
const TIEN_TO = (k) => `kx:group:${k}`;
const NHOM = (k) => `group:${k}`;
const NGUYEN_VAN = (k) => k;
const GOP_QUA_TAY = (k) => String(k).replace(/^.*:/, "");
const MAT_KHOA_RONG = (k) => String(k).replace(/^(?:[^:]+:)?group:/, "");
const loi = [];
const kiem = (dieu, ok, sai) => {
  console.log(dieu ? `ok ${ok}` : sai);
  if (!dieu) loi.push(sai);
};

let lo = null;
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
    // Lô chép từ một bài thật của kênh, không viết tên lô vào tệp.
    const { rows: [goc] } = await c.query("SELECT snapshot_id FROM stg_zalo_posts WHERE agent_id = $1 ORDER BY captured_at DESC LIMIT 1", [AGENT]);
    if (!goc) throw new Error("DB thử không có bài của kênh");
    lo = goc.snapshot_id;
    await c.query("DELETE FROM stg_zalo_posts");
    await c.query("DELETE FROM collection_units WHERE source_code = 'S03'");
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
   VALUES ($1, $2, $3, 'Nhóm thử NHL', $4, '2099-01-05T01:00:00Z', $5, $6)`, [`nhl_${id}`, lo, AGENT, text, `nhl_nguoi_${id}`, khoa]);
/** Bài không tự nói loại tin: chỉ nhận loại nếu nhóm có mục đích. */
const baiMucDich = (c, id, khoa, so) => bai(c, `md-${id}`, khoa, `Căn 2PN ${70 + so}m2. Giá: ${4000 + so * 10}`);
/** Bài nói bán nhưng không nói loại hình: chỉ nhận loại hình nếu nhóm có loại hình. */
const baiLoaiHinh = (c, id, khoa, so) => bai(c, `lh-${id}`, khoa, `Bán 2PN ${90 + so}m2 giá ${(5 + so / 10).toFixed(1)} tỷ`);
/** Bài thường, để đọc khu vực nhóm gán. */
const baiThiTruong = (c, id, khoa, so) => bai(c, `tt-${id}`, khoa, `Bán căn hộ 2PN ${110 + so}m2 giá ${(7 + so / 10).toFixed(1)} tỷ`);
const dongSo = (c, khoa, thiTruong) => c.query(
  "INSERT INTO collection_units (source_code, group_key, name, status, market_codes) VALUES ('S03', $1, 'Nhóm thử NHL', 'active', $2)", [khoa, thiTruong]);

/** Nhóm đăng ký hai dạng: mỗi dạng 12 bài đệm, riêng lẻ chưa đủ 20, hợp lại 24; dòng khoá trần khai thị trường, dòng kia không. */
async function nhomHaiDang(c, ten, dang, tu, so) {
  await dem(c, ten, 12, tu);
  await dem(c, dang(ten), 12, tu + 12);
  await dongSo(c, ten, ["vn-hanoi"]);
  await dongSo(c, dang(ten), []);
  for (const [duoi, khoa, n] of [["tran", ten, so], ["dang", dang(ten), so + 1]]) {
    await baiMucDich(c, `${ten}-${duoi}`, khoa, n);
    await baiLoaiHinh(c, `${ten}-${duoi}`, khoa, n);
    await baiThiTruong(c, `${ten}-${duoi}`, khoa, n);
  }
}

async function dungFixture(c) {
  // AC-1: hai dạng có tiền tố của khoá trần.
  await nhomHaiDang(c, "nhl-a", TIEN_TO, 0, 1);
  await nhomHaiDang(c, "nhl-g", NHOM, 200, 3);
  // AC-2: dòng khoá trần khai, dòng tiền tố không khai; hai dòng khác thị trường theo hai thứ tự đăng ký; chỉ dòng tiền tố khai.
  await dongSo(c, "nhl-b", ["vn-hanoi"]);
  await dongSo(c, TIEN_TO("nhl-b"), []);
  await baiThiTruong(c, "b-tt", TIEN_TO("nhl-b"), 11);
  await dongSo(c, TIEN_TO("nhl-c"), ["vn-hcmc"]);
  await dongSo(c, "nhl-c", ["vn-hanoi"]);
  await baiThiTruong(c, "c-tt", TIEN_TO("nhl-c"), 12);
  await dongSo(c, "nhl-e", ["vn-hanoi"]);
  await dongSo(c, TIEN_TO("nhl-e"), ["vn-hcmc"]);
  await baiThiTruong(c, "e-tt", TIEN_TO("nhl-e"), 13);
  await dongSo(c, TIEN_TO("nhl-d"), ["vn-hcmc"]);
  await baiThiTruong(c, "d-tt", TIEN_TO("nhl-d"), 14);
  await baiThiTruong(c, "d-tran", "nhl-d", 15);
  // AC-3: khoá lạ cạnh một nhóm đủ mục đích, loại hình, thị trường, ở cả bài lẫn sổ. Khoá `k:group:` là một nhóm riêng đủ bài;
  // đủ 24 bài không khoá để nếu chúng còn gom thành một nhóm thì bài không khoá nhận mục đích.
  await dem(c, "nhl-x", 24, 30);
  await dongSo(c, "nhl-x", ["vn-hanoi"]);
  await dem(c, "k:group:", 24, 60);
  await dem(c, null, 24, 90);
  for (const [i, k] of ["conv:nhl-x", "a:b:group:nhl-x", "k:group:", null].entries()) {
    await baiMucDich(c, `x-${i}`, k, 20 + i);
    await baiLoaiHinh(c, `x-${i}`, k, 20 + i);
    await baiThiTruong(c, `x-${i}`, k, 20 + i);
    if (k) await dongSo(c, k, ["vn-hcmc"]);
  }
}

/** Bản sao transform đột biến, chép cạnh tệp thật để ./lib còn giải được, xoá ngay sau khi nạp. Chỗ cũ không còn thì ném. */
async function banDotBien(thay) {
  const f = join(import.meta.dirname, `../.nhl-dot-${process.pid}.mjs`);
  let src = readFileSync(join(import.meta.dirname, "../transform-zalo.mjs"), "utf8");
  for (const [cu, moi] of thay) {
    if (!src.includes(cu)) throw new Error(`chỗ đột biến không còn: ${cu}`);
    src = src.replace(cu, moi);
  }
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

async function chay(khoaNhom, mod = { runTransformZalo, tangLoai }) {
  return trongGiaoDich(async (c) => {
    await dungFixture(c);
    const r = await imLog(() => mod.runTransformZalo(c, khoaNhom ? { khoaNhom } : {}));
    const { rows } = await c.query("SELECT post_ids, kind, property_type, area_id FROM sale_offers WHERE source = 'S03'");
    const tin = new Map(rows.flatMap((o) => o.post_ids.map((id) => [id, o])));
    const { posts } = await loadStgPosts(c, KENH_S03);
    const tang = mod.tangLoai(posts, khoaNhom ? { khoaNhom } : {});
    return { r, tin, tang, thiTruong: await docThiTruongNhom(c, ...(khoaNhom ? [khoaNhom] : [])) };
  });
}
const kind = (s, id) => s.tin.get(`nhl_md-${id}`)?.kind ?? null;
const loai = (s, id) => s.tin.get(`nhl_lh-${id}`)?.property_type ?? null;
const khuVuc = (s, id) => s.tin.get(`nhl_tt-${id}`)?.area_id ?? null;
const tang = (s, id) => s.tang.get(`nhl_md-${id}`);
const LE = ["x-0", "x-1", "x-2", "x-3"];
const anhKhoaLe = (s) => JSON.stringify(LE.flatMap((id) => [kind(s, id), loai(s, id), khuVuc(s, id), tang(s, id)]));

const mac = await chay(null);
const van = await chay(NGUYEN_VAN);
const qua = await chay(GOP_QUA_TAY);
const matRong = await chay(MAT_KHOA_RONG);
const gomRong = await banDotBien([[`const k = b.conversation_id;
    if (!k) continue; // Bài không có khoá không thuộc nhóm nào, như loaiHinhNhom.`, `const k = b.conversation_id ?? "";`]]);
const rong = await chay(null, gomRong);

// E1 — AC-1
const HOP = ["nhl-a-tran", "nhl-a-dang", "nhl-g-tran", "nhl-g-dang"];
kiem(HOP.every((id) => kind(mac, id) === "sale"), "AC-1 muc dich tinh tren hop", `loi muc dich hop: ${HOP.map((id) => kind(mac, id))}`);
kiem(HOP.every((id) => loai(mac, id) === "apartment"), "AC-1 loai hinh tinh tren hop", `loi loai hinh hop: ${HOP.map((id) => loai(mac, id))}`);
kiem(HOP.every((id) => tang(mac, id) === "moi-nhan"), "AC-1 tangLoai cung ket qua", `loi tangLoai: ${HOP.map((id) => tang(mac, id))}`);
kiem(mac.r.bai_doi_khoa > 0 && van.r.bai_doi_khoa === 0, `AC-1 bai doi khoa ${mac.r.bai_doi_khoa}`, `loi dem bai doi khoa: ${mac.r.bai_doi_khoa}, ${van.r.bai_doi_khoa}`);
kiem(HOP.every((id) => kind(van, id) === null) && tang(van, "nhl-a-dang") === "van-bo" && tang(van, "nhl-g-dang") === "van-bo", "do: khoa nguyen van tach doi muc dich", "loi thuoc muc dich khong do");
kiem(HOP.every((id) => loai(van, id) !== "apartment"), "do: khoa nguyen van tach doi loai hinh", "loi thuoc loai hinh khong do");

// E2 — AC-2
kiem(khuVuc(mac, "b-tt") === "vn-hanoi" && khuVuc(mac, "nhl-a-dang") === "vn-hanoi" && khuVuc(mac, "nhl-g-dang") === "vn-hanoi", "AC-2 bai tien to nhan thi truong dong tran", `loi thi truong dong tran: ${khuVuc(mac, "b-tt")}, ${khuVuc(mac, "nhl-g-dang")}`);
kiem(khuVuc(mac, "c-tt") === "vn-hanoi" && khuVuc(mac, "e-tt") === "vn-hanoi", "AC-2 dong tran thang", `loi dong tran thang: ${khuVuc(mac, "c-tt")}, ${khuVuc(mac, "e-tt")}`);
kiem(khuVuc(mac, "d-tt") === "vn-hcmc" && khuVuc(mac, "d-tran") === "vn-hcmc", "AC-2 chi dong tien to khai", `loi chi dong tien to: ${khuVuc(mac, "d-tt")}, ${khuVuc(mac, "d-tran")}`);
const tra = (k) => mac.thiTruong.get(k)?.join();
kiem(tra("nhl-c") === "vn-hanoi" && tra(TIEN_TO("nhl-c")) === "vn-hcmc" && tra("nhl-e") === "vn-hanoi" && tra(TIEN_TO("nhl-e")) === "vn-hcmc",
  "AC-2 tra theo khoa nguyen van ca hai dong", "loi tra theo khoa nguyen van");
kiem(khuVuc(van, "b-tt") === null && khuVuc(van, "d-tran") === null && khuVuc(van, "nhl-g-dang") === null, "do: khoa nguyen van mat thi truong", "loi thuoc thi truong khong do");

// E3 — AC-3: ma trận dạng khoá lạ × bốn chỗ đọc, viết trước.
const MA_TRAN = [
  { id: "x-0", kind: null, loai: null, khuVuc: "vn-hcmc", tang: "van-bo" },
  { id: "x-1", kind: null, loai: null, khuVuc: "vn-hcmc", tang: "van-bo" },
  { id: "x-2", kind: "sale", loai: "apartment", khuVuc: "vn-hcmc", tang: "moi-nhan" },
  { id: "x-3", kind: null, loai: null, khuVuc: null, tang: "van-bo" },
];
const dungO = (s, o) => kind(s, o.id) === o.kind && (o.loai ? loai(s, o.id) === o.loai : loai(s, o.id) !== "apartment") && khuVuc(s, o.id) === o.khuVuc && tang(s, o.id) === o.tang;
const sai = (s, ds) => ds.filter((o) => !dungO(s, o)).map((o) => `${o.id}: ${kind(s, o.id)}, ${loai(s, o.id)}, ${khuVuc(s, o.id)}, ${tang(s, o.id)}`);
kiem(sai(mac, MA_TRAN.slice(0, 3)).length === 0, "AC-3 khoa la khong gop", `loi khoa la bi gop: ${sai(mac, MA_TRAN.slice(0, 3))}`);
kiem(sai(mac, MA_TRAN.slice(3)).length === 0, "AC-3 khong co khoa khong vao nhom", `loi bai khong khoa vao nhom: ${sai(mac, MA_TRAN.slice(3))}`);
kiem(anhKhoaLe(mac) === anhKhoaLe(van), "AC-3 y het nguyen van", "loi khoa la khac nguyen van");
kiem(kind(qua, "x-0") === "sale" && khuVuc(qua, "x-0") === "vn-hanoi" && anhKhoaLe(qua) !== anhKhoaLe(van), "do: gop qua tay", "loi thuoc gop qua tay khong do");
kiem(kind(matRong, "x-2") === null, "do: khoa rong khong phai nhom rieng", "loi thuoc khoa rong khong do");
kiem(kind(rong, "x-3") === "sale" && tang(rong, "x-3") === "moi-nhan", "do: bai khong khoa gom nhom rong", "loi thuoc bai khong khoa khong do");

console.log(loi.length ? `NHOM HAI LAN TRANSFORM FAIL (${loi.length})` : "NHOM HAI LAN TRANSFORM OK");
process.exit(loi.length ? 1 : 0);
