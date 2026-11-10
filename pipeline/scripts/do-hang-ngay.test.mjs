// do-hang-ngay.test.mjs — DO1 do-hieu-qua-hang-ngay. Ca thuần (hàm của lib/do-hang-ngay.mjs) và ca DB (DB thử của lượt,
// giao dịch ROLLBACK, nạp 083 trong giao dịch). Mỗi thước có cặp hai chiều trên cùng fixture: vật lành xanh, bản đột biến
// (cờ dotBien) đỏ với thông điệp ghim — tên thông điệp khớp evals.yaml của hồ sơ.
import assert from "node:assert/strict";
import { test } from "node:test";

import { chuanHoa } from "../lib/chuan-hoa-nhan.mjs";
import {
  boSot, chanLo, chuyenBac, demChuyenBac, gopOCam, loaiChuoi, trungCam, giuNhap, giuO, nhomO, phanRa, PHIEN_BAN_THUOC, soCap, soTuan, tinHieu, tuanIso, wilson,
} from "../lib/do-hang-ngay.mjs";

/** Wilson tham chiếu viết lại độc lập (công thức chuẩn), để so hàm thật tới 4 chữ số. */
function wilsonThamChieu(k, n) {
  const z = 1.959964, p = k / n;
  const tam = p + (z * z) / (2 * n);
  const can = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const mau = 1 + (z * z) / n;
  return { thap: (tam - can) / mau, cao: (tam + can) / mau };
}
const gan = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-3, `${msg}: ${a} ≠ ${b}`);

const NGAY = "2026-11-07"; // thứ Bảy, tuần 2026-W45
const TUAN_TRUOC = "2026-10-31"; // tuần 2026-W44
const KHOA_GOP = "doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3";

// ---- AC-3: ma trận viết trước 2 cách đọc × 3 ô × 2 tuần ----
// [cách đọc, ô, tuần, n, giữ]
const MA_TRAN = [
  ["bo-doc-luat", "listing_intent", NGAY, 10, 9], ["bo-doc-luat", "listing_intent", TUAN_TRUOC, 10, 9],
  ["bo-doc-luat", "price_min_vnd", NGAY, 10, 8], ["bo-doc-luat", "price_min_vnd", TUAN_TRUOC, 10, 6],
  ["bo-doc-luat", "area_m2", NGAY, 10, 7], ["bo-doc-luat", "area_m2", TUAN_TRUOC, 10, 7],
  [KHOA_GOP, "listing_intent", NGAY, 10, 10], [KHOA_GOP, "listing_intent", TUAN_TRUOC, 10, 9],
  [KHOA_GOP, "price_min_vnd", NGAY, 10, 9], [KHOA_GOP, "price_min_vnd", TUAN_TRUOC, 10, 8],
  [KHOA_GOP, "area_m2", NGAY, 10, 8], [KHOA_GOP, "area_m2", TUAN_TRUOC, 10, 9],
];
const GIA_TRI = { listing_intent: ["offer", "inquiry"], price_min_vnd: ["3400000000", "5000000000"], area_m2: ["62", "80"] };

/** Dựng 20 thẻ (10 mỗi tuần) sao cho mỗi (cách đọc × ô × tuần) có đúng số giữ của MA_TRAN. */
function theMaTran() {
  const the = [];
  for (const ngay of [NGAY, TUAN_TRUOC]) {
    for (let i = 0; i < 10; i++) {
      const nhan = {}, cach_doc = { "bo-doc-luat": { trang_thai: "co", o: {} }, [KHOA_GOP]: { trang_thai: "co", o: {} } };
      for (const [cach, o, ng, , giu] of MA_TRAN) {
        if (ng !== ngay) continue;
        nhan[o] = { value: GIA_TRI[o][0], not_stated: false };
        cach_doc[cach].o[o] = i < giu ? GIA_TRI[o][0] : GIA_TRI[o][1];
      }
      the.push({ ngay, nhan, draft: { hien: KHOA_GOP, cach_doc }, hienTai: { "bo-doc-luat": { listing_intent: "offer", price_min_vnd: "3400000000", area_m2: "62" } } });
    }
  }
  return the;
}

function kiemGiuNhap(kq) {
  if (kq.dong.length !== 6) throw new Error(`GOP CACH DOC: ${kq.dong.length} dòng`);
  for (const [cach, o, ng, n, giu] of MA_TRAN) {
    const r = kq.dong.find((d) => d.cach_doc === cach && d.o === o);
    if (!r) throw new Error(`GOP CACH DOC: thiếu ${cach}|${o}`);
    const t = ng === NGAY ? r.tuan_nay : r.tuan_truoc;
    if (t.n !== n || t.giu !== giu) throw new Error(`GIU NHAP SO SAI NHAP: ${cach}|${o}|${ng} ${t.giu}/${t.n} ≠ ${giu}/${n}`);
    const w = wilsonThamChieu(giu, n);
    gan(t.wilson.thap, w.thap, "wilson thấp");
    gan(t.wilson.cao, w.cao, "wilson cao");
  }
}

test("DO1-AC-3 giữ nháp theo cách đọc × ô × tuần, Wilson, chênh, ý nghĩa, dung sai, tỉ lệ soát, cơ cấu, phiên bản thước", () => {
  const the = theMaTran();
  const kq = giuNhap(the, NGAY);
  kiemGiuNhap(kq);
  const gia = kq.dong.find((d) => d.cach_doc === "bo-doc-luat" && d.o === "price_min_vnd");
  gan(gia.chenh, 0.2, "chênh");
  assert.equal(gia.co_y_nghia, false, "8/10 so 6/10: hai khoảng chồng");
  assert.ok(gia.nguong_phat_hien > 0.2, "ngưỡng phát hiện lớn hơn chênh");
  assert.equal(nhomO("listing_intent"), "A");
  assert.equal(gia.nhom, "B");
  // Ô người sửa = 1 − giữ của cách đọc hiện (đọc gộp): tuần này 3 ô × 10 thẻ, giữ 27 → sửa 3.
  assert.deepEqual([kq.nguoi_sua.tuan_nay.n, kq.nguoi_sua.tuan_nay.k], [30, 3]);
  assert.equal(kq.ty_le_soat.tuan_nay.ty_le, 1);
  assert.equal(kq.canh_bao_soat, false);
  assert.equal(kq.co_cau.tuan_nay["chua-ro|chua-ro"], 10);
  assert.match(kq.phien_ban_thuoc, /^[0-9a-f]{12}$/);
  assert.equal(kq.phien_ban_thuoc, PHIEN_BAN_THUOC);
  // Ý nghĩa: 19/20 so 5/20 → khoảng không chồng.
  assert.equal(soTuan({ k: 19, n: 20 }, { k: 5, n: 20 }).co_y_nghia, true);
  assert.throws(() => { if (soTuan({ k: 8, n: 10 }, { k: 6, n: 10 }, { dotBien: "y-nghia-bo-chong" }).co_y_nghia) throw new Error("CHENH NHIEU THANH Y NGHIA"); }, /CHENH NHIEU THANH Y NGHIA/);
  // Dung sai: giá ±1%, diện tích ±1 m².
  const nh = (v) => ({ value: v, not_stated: false });
  assert.equal(giuO("price_min_vnd", "3400000000", nh("3420000000")), true);
  assert.equal(giuO("price_min_vnd", "3400000000", nh("3450000000")), false);
  assert.equal(giuO("area_m2", "62", nh("62.8")), true);
  assert.equal(giuO("area_m2", "62", nh("64")), false);
  assert.throws(() => { if (!giuO("price_min_vnd", "3400000000", nh("3420000000"), { dotBien: "bo-dung-sai" })) throw new Error("DUNG SAI O SO"); }, /DUNG SAI O SO/);
  // Tỉ lệ soát: 12/20 thẻ tuần này đã soát → cảnh báo.
  const thieu = the.map((t, i) => (t.ngay === NGAY && i >= 6 ? { ...t, nhan: null } : t));
  const kt = giuNhap([...thieu, ...the.filter((t) => t.ngay === NGAY).slice(0, 10).map((t) => ({ ...t, nhan: null }))], NGAY);
  assert.equal(kt.ty_le_soat.tuan_nay.rut, 20);
  assert.equal(kt.ty_le_soat.tuan_nay.soat, 6);
  assert.equal(kt.canh_bao_soat, true);
  assert.throws(() => { if (!giuNhap(thieu, NGAY, { dotBien: "bo-canh-bao-soat" }).canh_bao_soat) throw new Error("THIEU CANH BAO SOAT"); }, /THIEU CANH BAO SOAT/);
  // Khoá prompt mới → dòng riêng, dòng cũ không đổi.
  const moi = the.map((t) => ({ ...t, draft: { ...t.draft, cach_doc: { ...t.draft.cach_doc, [KHOA_GOP.replace("v3", "v4")]: t.draft.cach_doc[KHOA_GOP] } } }));
  const km = giuNhap(moi, NGAY);
  assert.equal(km.dong.length, 9);
  assert.deepEqual(km.dong.find((d) => d.cach_doc === KHOA_GOP && d.o === "area_m2"), kq.dong.find((d) => d.cach_doc === KHOA_GOP && d.o === "area_m2"));
  // Chiều đỏ trên cùng fixture.
  assert.throws(() => kiemGiuNhap(giuNhap(the, NGAY, { dotBien: "so-sale-offers" })), /GIU NHAP SO SAI NHAP/);
  assert.throws(() => kiemGiuNhap(giuNhap(moi, NGAY, { dotBien: "gop-cach-doc" })), /GOP CACH DOC/);
});

// ---- AC-4 ----
function theBoSot() {
  const the = [];
  for (let i = 0; i < 12; i++) {
    const tt = (cach) => (cach === "bo" ? (i < 3 ? "khong-tin" : "co") : i < 1 ? "khong-tin" : i < 3 ? "vang" : "co");
    the.push({
      ngay: NGAY, nhan: { listing_intent: { value: "offer", not_stated: false } },
      draft: { hien: KHOA_GOP, cach_doc: { "bo-doc-luat": { trang_thai: tt("bo"), o: {} }, [KHOA_GOP]: { trang_thai: tt("gop"), o: {} } } },
      hienTai: { "bo-doc-luat": "co" },
    });
  }
  for (let i = 0; i < 2; i++) the.push({ ngay: NGAY, nhan: { listing_intent: { value: "not_listing", not_stated: false } }, draft: { hien: "bo-doc-luat", cach_doc: { "bo-doc-luat": { trang_thai: "khong-tin", o: {} } } } });
  return the;
}
function kiemBoSot(r) {
  const bo = r.find((x) => x.cach_doc === "bo-doc-luat").tuan_nay, gop = r.find((x) => x.cach_doc === KHOA_GOP).tuan_nay;
  if (bo.n !== 12) throw new Error(`BO SOT SAI MAU SO: n=${bo.n}`);
  if (bo.bo !== 3) throw new Error(`BO SOT DOC LAI SALE_OFFERS: bo=${bo.bo}`);
  if (gop.n !== 10 || gop.bo !== 1 || gop.thieu_nhap !== 2) throw new Error(`THIEU NHAP THANH BO SOT: ${JSON.stringify(gop)}`);
  const w = wilsonThamChieu(3, 12);
  gan(bo.wilson.thap, w.thap, "wilson bỏ sót");
}
test("DO1-AC-4 ước bỏ sót trên thẻ tin rao, đọc từ nháp đã chụp, thiếu nháp đếm riêng", () => {
  const the = theBoSot();
  const r = boSot(the, NGAY);
  kiemBoSot(r);
  assert.ok("co_y_nghia" in r[0] && "chenh" in r[0]);
  assert.throws(() => kiemBoSot(boSot(the, NGAY, { dotBien: "dem-ca-khong-tin" })), /BO SOT SAI MAU SO/);
  assert.throws(() => kiemBoSot(boSot(the, NGAY, { dotBien: "vang-thanh-bo" })), /THIEU NHAP THANH BO SOT/);
  assert.throws(() => kiemBoSot(boSot(the, NGAY, { dotBien: "doc-lai-sale-offers" })), /BO SOT DOC LAI SALE_OFFERS/);
});

// ---- AC-5 ----
function silverGop(i, { json_ok = true, area, sai = false, trich_ok = true, kind = "sale" } = {}) {
  const o = { listing_intent: { v: "offer", cc: "chu_bai", trich: "x", trich_ok }, kind: { v: kind, cc: "chu_bai", trich: "x", trich_ok: true },
    area_m2: { v: sai ? "sáu mươi" : area ?? null, cc: area ? "chu_bai" : null, trich: "", trich_ok: null } };
  return { post_id: `p${i}`, model: "gateway:anthropic/claude-haiku-5.5", prompt_version: "dg3-s03-v3", json_ok,
    listing_intent: "offer", kind, quote_ok: null, probabilities: json_ok ? { nguon: "doc-gop", o_duoc_giao: ["listing_intent", "kind", "area_m2"], o } : null };
}
function dongTinHieu() {
  const d = [];
  // 10 dòng: 2 JSON hỏng; 8 json ok: trích có ở listing_intent+kind (16 ô), 1 ô trich_ok=false; area có 6/8, 1 sai khuôn.
  d.push(silverGop(0, { json_ok: false }), silverGop(1, { json_ok: false }));
  for (let i = 2; i < 10; i++) d.push(silverGop(i, { area: i < 8 ? 62 : undefined, sai: i === 8, trich_ok: i !== 2, kind: i < 4 ? "rent_lt" : "sale" }));
  return d;
}
function kiemTinHieu(r) {
  const g = r.cach_doc.find((x) => x.cach_doc === KHOA_GOP);
  const chu = r.cach_doc.find((x) => x.cach_doc.startsWith("doc-chu"));
  if (chu.status !== "skip") throw new Error("KHONG LUOT GHI SO 0");
  gan(g.json_hong, 0.2, "json hỏng");
  gan(g.trich_lac, 1 / 16, "trích lạc");
  if (g.phu.area_m2.co !== 6 || g.phu.area_m2.giao !== 8 || g.phu.area_m2.sai_khuon !== 1) throw new Error(`SAI KHUON THANH TRONG: ${JSON.stringify(g.phu.area_m2)}`);
  const bd = r.bat_dong[`bo-doc-luat|${KHOA_GOP}`].kind;
  assert.deepEqual(bd, { ca_hai: 7, khac: 2 });
}
test("DO1-AC-5 tín hiệu không cần nhãn: JSON hỏng, trích lạc, phủ ô + sai khuôn, bất đồng, cách đọc vắng thì skip", () => {
  const d = dongTinHieu();
  const bo = new Map();
  for (let i = 2; i < 9; i++) bo.set(`p${i}`, { kind: "sale" });
  const daBiet = [KHOA_GOP, "doc-chu:gateway:anthropic/claude-haiku-5.5:dtb-s03-v1"];
  kiemTinHieu(tinHieu(d, daBiet, bo));
  // Lượt mà mọi lời gọi hỏng vẫn ra số 1,0 (Ngoài-3 của PL30).
  const hong = tinHieu([silverGop(0, { json_ok: false }), silverGop(1, { json_ok: false })], daBiet).cach_doc.find((x) => x.cach_doc === KHOA_GOP);
  assert.equal(hong.json_hong, 1);
  assert.throws(() => kiemTinHieu(tinHieu(d, daBiet, bo, { dotBien: "vang-ghi-0" })), /KHONG LUOT GHI SO 0/);
  assert.throws(() => kiemTinHieu(tinHieu(d, daBiet, bo, { dotBien: "sai-khuon-thanh-trong" })), /SAI KHUON THANH TRONG/);
});

// ---- AC-7 ----
/** Đơn vị đúng khuôn bộ ghi (donViHienTai): market_id, ward_id, building_key, core.toa_chu. */
function donViLat() {
  const r = [];
  for (let p = 0; p < 40; p++) for (let i = 0; i < 40 - p; i++) r.push({ market_id: p % 2 ? "vn-hanoi" : "vn-hcmc", ward_id: `vn-w${String(p).padStart(2, "0")}`, building_key: null, project_key: null, core: { toa_chu: false } });
  for (let i = 0; i < 3; i++) r.push({ market_id: "vn-hanoi", ward_id: null, building_key: null, project_key: null, core: { toa_chu: false } });
  for (let i = 0; i < 2; i++) r.push({ market_id: "vn-hanoi", ward_id: null, building_key: null, project_key: null, core: { toa_chu: true } });
  r.push({ market_id: "vn-hanoi", ward_id: null, building_key: "bld_X", project_key: null, core: { toa_chu: true } });
  return r;
}
const KHOA_LAT = KHOA_LAT_DON_VI;
function kiemLat(rows, dotBien) {
  const lat = Object.fromEntries(["thi_truong", "phuong", "toa"].map((k) => [k, phanRa(rows, KHOA_LAT[k], () => 1, 30, { dotBien })]));
  if (Object.keys(lat.thi_truong.o).filter((k) => k.startsWith("vn-")).length !== 2) throw new Error("THIEU THI TRUONG");
  for (const [k, v] of Object.entries(lat)) {
    const tong = Object.values(v.o).reduce((s, n) => s + n, 0);
    if (tong !== v.tong || v.tong !== rows.length) throw new Error(`TONG LAT LECH: ${k} ${tong} ≠ ${rows.length}`);
  }
  if (!("chua-co-danh-ba" in lat.toa.o) || lat.toa.o["chua-co-danh-ba"] !== 2) throw new Error("GOP HAI O CHUA GAN");
  return lat;
}
test("DO1-AC-7 phân rã thị trường, phường (30 ô + khác), hai ô chưa gắn, tổng ô = tổng chung", () => {
  const rows = donViLat();
  const lat = kiemLat(rows);
  assert.equal(Object.keys(lat.phuong.o).filter((k) => k.startsWith("vn-w")).length, 30);
  assert.equal(lat.phuong.o.khac, 10 + 9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1);
  assert.equal(lat.phuong.o["khong-tin-hieu"], 6); // phường: không đơn vị nào có phường → không nêu chỗ (6)
  assert.equal(lat.toa.o["khong-tin-hieu"], 1600 / 2 + 20 + 3); // 820 đơn vị có phường không nêu toà + 3 không nêu gì
  assert.equal(lat.toa.o.bld_X, 1);
  assert.throws(() => kiemLat(rows, "bo-khac"), /TONG LAT LECH/);
  assert.throws(() => kiemLat(rows, "gop-chua-gan"), /GOP HAI O CHUA GAN/);
  assert.throws(() => kiemLat(rows.map((r) => ({ ...r, market_id: "x" }))), /THIEU THI TRUONG/);
});

// ---- Chuẩn hoá nháp về khuôn eval_labels (bản chép labels-normalize.ts) ----
test("DO1-CHUAN-HOA bảng vào/ra viết trước khớp quy tắc chuanHoaLuot", () => {
  const BANG = [
    ["kind", "sale", "sale"], ["multi_unit", "yes", "yes"], ["project", "  Vinhomes  Ocean Park ", "vinhomes ocean park"],
    ["unit_number", "S8.02 xx", "S8.02 xx"], ["area_m2", 64.5, "64.5"], ["area_m2", 62, "62"], ["bedrooms", 2, "2"],
    ["price_min_vnd", 2620000000, "2620000000"], ["seller_phone", "0912 345 678", "+84912345678"], ["view", "city,river", "city,river"],
    ["area_m2", null, null],
  ];
  for (const [o, vao, ra] of BANG) assert.deepEqual(chuanHoa(o, vao), { ok: true, v: ra }, `${o} ${vao}`);
  assert.equal(chuanHoa("area_m2", "sáu mươi").ok, false);
  assert.equal(chuanHoa("seller_phone", "12345").ok, false);
});

// ---- AC-6 phần thuần: lý do, đổi khoá, một dòng mỗi đơn vị ----
const core = (x = {}) => ({ kind: true, property_type: true, price_vnd: true, area_m2: true, area_id: true, measured: false, tin: [], ...x });
const u = (unit_key, data_level, c = {}, source = "S03") => ({ unit_key, unit: unit_key.startsWith("can:") ? "can" : "tin_le", source, data_level, core: core(c) });
export function boChuyenBac() {
  const truoc = new Map([
    ["tin:A", u("tin:A", "B1")], ["tin:B", u("tin:B", "B0", { area_m2: false })], ["tin:C", u("tin:C", "B1")],
    ["tin:D", u("tin:D", "B1")], ["tin:E", u("tin:E", "B1")], ["can:F", u("can:F", "B2", { tin: ["f1"] })],
    ["tin:G", u("tin:G", "B1")], ["can:P", u("can:P", "B2", { tin: ["h1"] }, "S06")],
  ]);
  const nay = new Map([
    ["tin:A", u("tin:A", "B0", { price_vnd: false })], ["tin:B", u("tin:B", "B1")], ["can:K", u("can:K", "B2", { tin: ["C"] })],
    ["tin:E", u("tin:E", "B1")], ["can:F", u("can:F", "B3", { measured: true, tin: ["f1"] })],
    ["tin:G", u("tin:G", "B0", { price_vnd: false, area_m2: false })], ["can:Q", u("can:Q", "B2", { tin: ["h1"] }, "S06")],
  ]);
  return { truoc, nay, nghi: new Set(["D"]) };
}
export function kiemChuyenBac(ds) {
  const by = Object.fromEntries(ds.map((d) => [d.unit_key, d]));
  if (by["tin:E"]) throw new Error("CHUYEN BAC GIA");
  if (ds.some((d) => !d.ly_do.length)) throw new Error("THIEU LY DO");
  if (ds.filter((d) => d.unit_key === "tin:G").length !== 1) throw new Error("HAI DONG MOT DON VI");
  if (!by["can:F"]?.ly_do.includes("do-luong")) throw new Error("THIEU DO LUONG");
  if (!by["can:P"]?.ly_do.includes("doi-khoa") || !by["can:Q"]?.ly_do.includes("doi-khoa")) throw new Error("DOI KHOA THANH BIEN DONG");
  const mong = {
    "tin:A": ["tut", ["thieu-gia"]], "tin:B": ["len", ["du-dien-tich"]], "tin:C": ["mat", ["gan-can"]], "can:K": ["moi", ["gan-can"]],
    "tin:D": ["mat", ["tin-nghi"]], "can:F": ["len", ["do-luong"]], "tin:G": ["tut", ["thieu-gia", "thieu-dien-tich"]],
    "can:P": ["mat", ["doi-khoa"]], "can:Q": ["moi", ["doi-khoa"]],
  };
  assert.equal(ds.length, Object.keys(mong).length);
  for (const [k, [h, ly]] of Object.entries(mong)) assert.deepEqual([by[k].huong, by[k].ly_do], [h, ly], k);
}
test("DO1-AC-6 phần thuần: hướng, mảng lý do, đổi khoá, một dòng mỗi đơn vị, nguồn", () => {
  const { truoc, nay, nghi } = boChuyenBac();
  const ds = chuyenBac(truoc, nay, { nghi });
  kiemChuyenBac(ds);
  const dem = demChuyenBac(ds);
  assert.equal(dem.doi_khoa, 2);
  assert.equal(dem.theo_nguon.S06.doi_khoa, 2);
  assert.equal(dem.theo_huong_ly_do["tut:thieu-gia"], 2);
  assert.equal(chuyenBac(nay, nay).length, 0, "chạy lại không đổi dữ liệu → 0 dòng");
  assert.throws(() => kiemChuyenBac(chuyenBac(truoc, nay, { nghi, dotBien: "dong-gia" })), /CHUYEN BAC GIA/);
  assert.throws(() => kiemChuyenBac(chuyenBac(truoc, nay, { nghi, dotBien: "bo-ly-do" })), /THIEU LY DO/);
  assert.throws(() => kiemChuyenBac(chuyenBac(truoc, nay, { nghi, dotBien: "bo-do-luong" })), /THIEU DO LUONG/);
  assert.throws(() => kiemChuyenBac(chuyenBac(truoc, nay, { nghi, dotBien: "hai-dong" })), /HAI DONG MOT DON VI/);
  assert.throws(() => kiemChuyenBac(chuyenBac(truoc, nay, { nghi, dotBien: "doi-khoa-thanh-bien-dong" })), /DOI KHOA THANH BIEN DONG/);
  assert.throws(() => { if (!demChuyenBac(ds, { dotBien: "bo-nguon" }).theo_nguon.S06) throw new Error("THIEU NGUON"); }, /THIEU NGUON/);
});

// ---- AC-10 phần thuần + AC-9 chặn rò ----
test("DO1-AC-10 phần thuần: so cặp có ý nghĩa và không ý nghĩa", () => {
  const cap = (giuCu, giuMoi, n = 30) => Array.from({ length: n }, (_, i) => ({ cu: i < giuCu, moi: i < giuMoi }));
  const a = soCap(cap(18, 28));
  assert.deepEqual([a.n_cap, a.giu_cu, a.giu_moi], [30, 18, 28]);
  gan(a.chenh_cap, 10 / 30, "chênh cặp");
  assert.equal(a.co_y_nghia, true);
  assert.equal(soCap(cap(24, 25)).co_y_nghia, false);
});
test("DO1-AC-9 phần thuần: chanLo bắt chuỗi cấm", () => {
  assert.doesNotThrow(() => chanLo({ n: 3 }, [{ nhan: "TRICH", chuoi: "TRICH_Y" }]));
  assert.throws(() => chanLo({ x: "…TRICH_Y…" }, [{ nhan: "TRICH", chuoi: "TRICH_Y" }]), /LO TRICH/);
  // Tên nguồn qua bộ soát tầng A dùng chung: bản viết liền, gập dấu, nằm ở KHOÁ lát (theo-chu-bai:<tên>) vẫn bị bắt.
  const ten = [{ nhan: "TEN NGUON", chuoi: "Tên Thật Vê" }];
  assert.doesNotThrow(() => chanLo({ o: { "theo-chu-bai:ocean park": 2 } }, ten));
  assert.throws(() => chanLo({ o: { "theo-chu-bai:tenthatve": 2 } }, ten), /LO TEN NGUON/);
  assert.throws(() => chanLo({ ghi: "TÊN THẬT VÊ" }, ten), /LO TEN NGUON/);
});
test("tuần ISO giờ VN", () => {
  assert.equal(tuanIso("2026-11-07"), "2026-W45");
  assert.equal(tuanIso("2026-11-02"), "2026-W45");
  assert.equal(tuanIso("2026-11-01"), "2026-W44");
  assert.equal(wilson(0, 0), null);
});

// ================= Ca DB (DB thử của lượt; giao dịch ROLLBACK; 083 nạp trong giao dịch) =================
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { chonMau as chonMauLib, textHash as bam } from "../lib/eval-labels.mjs";
import { khoaDocGopMacDinh, LAT_CUON_CHIEU, rutMau } from "../mau-soat-cuon-chieu.mjs";
import { chuoiCam, KHOA_LAT_DON_VI, KHOA_LAT_THE } from "../do-hang-ngay.mjs";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SQL_083 = readFileSync(path.join(GOC, "db/migrations/083_do_hang_ngay.sql"), "utf8");
// thang-bac-moi-b0-b5: DO1 đọc data_level_units() của 087 — nạp sau 083 trong giao dịch.
export const SQL_087 = readFileSync(path.join(GOC, "db/migrations/087_thang_bac_moi.sql"), "utf8");
const DB = process.env.DATABASE_URL;
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" };

/** Một giao dịch trên DB thử: khoá 33033 (nạp migration song song), nạp 083, chạy fn, ROLLBACK. */
export async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử (db/db-thu.sh)");
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query(SQL_083);
    await c.query(SQL_087);
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('2025-01-15__s03', 'hanoi', 'zalo-agent', '{}')
                   ON CONFLICT DO NOTHING`);
    await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
/** Chạy fn trong SAVEPOINT rồi hoàn lại — để vật lành và bản đột biến đo trên cùng fixture. */
export async function thu(c, fn) {
  await c.query("SAVEPOINT do1");
  try { return await fn(); } finally { await c.query("ROLLBACK TO SAVEPOINT do1"); }
}

const MODEL = "gateway:anthropic/claude-haiku-5.5";
export async function themBai(c, { id, ngayGio, text, agent = null }) {
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, captured_at, text, agent_id)
                 VALUES ($1, '2025-01-15__s03', 'Nhóm DO1', $2, $2, $3, $4)`, [id, ngayGio, text, agent]);
}
export async function themTin(c, { id, pid, gia = 3400000000, dt = 62, kind = "sale" }) {
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, area_m2, first_seen, last_seen, post_ids, source)
                 VALUES ($1, $2, $3, $4, now(), now(), ARRAY[$5], 'S03')`, [id, kind, gia, dt, pid]);
}
export async function themSilver(c, { pid, text, o, ok = true, usd = 0.001, run = "r-test-do1", pv = "dg3-s03-v3" }) {
  const yd = o?.listing_intent?.v ?? "unknown";
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok,
                   error_kind, cost_usd, run_id, probabilities)
                 VALUES ('S03', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
    [pid, bam(text), MODEL, pv, ok ? yd : "unknown", o?.kind?.v ?? null, ok, ok ? null : "json-hong", usd, run,
      ok ? { nguon: "doc-gop", o_duoc_giao: Object.keys(o), o } : null]);
}
const O_GOP = { listing_intent: { v: "offer", cc: "chu_bai", trich: "bán", trich_ok: true }, kind: { v: "sale", cc: "chu_bai", trich: "bán", trich_ok: true },
  bedrooms: { v: 2, cc: "chu_bai", trich: "2pn", trich_ok: true }, bathrooms: { v: 2, cc: "chu_bai", trich: "2wc", trich_ok: true } };

const D = "2025-01-15";
/** Fixture AC-1: 26 bài ngày D (3 thử, 2 cặp trùng chữ, 6 không thành tin, 1 lúc 00:30 giờ VN), 4 bài ngày D-1. */
async function fixtureMau(c) {
  const bai = [];
  for (let i = 0; i < 26; i++) {
    const id = `do1p${String(i).padStart(2, "0")}`;
    const text = i === 21 ? "căn hộ mẫu 05" : i === 22 ? "căn hộ mẫu 06" : `căn hộ mẫu ${String(i).padStart(2, "0")} giá 3,4 tỷ`;
    const ngayGio = i === 0 ? "2025-01-14T17:30:00Z" : `2025-01-15T0${(i % 9) + 1}:00:00Z`;
    const agent = i >= 23 ? "test-do1" : null;
    await themBai(c, { id, ngayGio, text: i === 21 ? "căn hộ mẫu 05 giá 3,4 tỷ" : i === 22 ? "căn hộ mẫu 06 giá 3,4 tỷ" : text, agent });
    bai.push({ id, text: i === 21 ? "căn hộ mẫu 05 giá 3,4 tỷ" : i === 22 ? "căn hộ mẫu 06 giá 3,4 tỷ" : text, thu: i >= 23 });
  }
  for (let i = 0; i < 4; i++) await themBai(c, { id: `do1q${i}`, ngayGio: "2025-01-14T10:00:00Z", text: `bài hôm trước ${i}` });
  const coTin = bai.filter((b, i) => !b.thu && i >= 6);
  for (const b of coTin) await themTin(c, { id: `offer_do1_${b.id}`, pid: b.id });
  for (const b of coTin.slice(0, 5)) await themSilver(c, { pid: b.id, text: b.text, o: O_GOP });
  return { bai, coTin: new Set(coTin.map((b) => b.id)), thuSet: new Set(bai.filter((b) => b.thu).map((b) => b.id)) };
}
const goiGia = (c, { usd = 0.001, tran = 1 } = {}) => {
  const da = [];
  const f = async (ids, con) => {
    let chi = 0, cham = false;
    for (const id of ids) {
      if (chi + usd > con + 1e-12) { cham = true; break; }
      const { rows: [r] } = await c.query("SELECT text FROM stg_zalo_posts WHERE post_id = $1 LIMIT 1", [id]);
      await themSilver(c, { pid: id, text: r.text, o: O_GOP, usd, run: `do1-mau-${D}` });
      chi += usd; da.push(id);
    }
    return { goi: da.length, cham_tran: cham };
  };
  f.da = da;
  return f;
};

function kiemMau(kq, fx, ky) {
  const ids = kq.the.map((t) => t.post_id);
  if (ids.some((id) => fx.thuSet.has(id))) throw new Error("MAU CO BAI THU");
  if (ky.ids && JSON.stringify([...ids].sort()) !== JSON.stringify([...ky.ids].sort())) throw new Error("MAU KHONG TAT DINH");
  if (!ids.some((id) => !fx.coTin.has(id))) throw new Error("MAU BO BAI KHONG NHAN");
  for (const t of kq.the) {
    if (!fx.coTin.has(t.post_id) && t.draft.cach_doc["bo-doc-luat"].trang_thai !== "khong-tin") throw new Error("NULL KHONG TIN THANH GIU");
  }
}

test("DO1-AC-1 rút 20 bài ngày D, gạt bài thử, khử trùng, gồm bài không thành tin, chụp nháp mọi cách đọc, chạy lại 0 dòng", coDb, async () => {
  await trongGiaoDich(async (c) => {
    const fx = await fixtureMau(c);
    const kg = khoaDocGopMacDinh();
    assert.equal(kg.khoa, KHOA_GOP, "khoá đọc gộp suy từ agent/config + prompt.ts");
    // Tập kỳ vọng: ứng viên khác nội dung, không thử, của ngày D; chọn tất định theo hạt giống cc-D.
    const ungVien = fx.bai.filter((b) => !b.thu).map((b) => ({ post_id: b.id, text: b.text }));
    const ky = { ids: chonMauLib(ungVien, { n: 20, seed: `cc-${D}`, tiLeTrung: 0, tinCua: new Map([...fx.coTin].map((id) => [id, `offer_do1_${id}`])) }).chon.map((x) => x.ref_id) };
    await thu(c, async () => {
      const g = goiGia(c);
      const kq = await rutMau(c, { ngay: D, goiDocGop: g, log: () => {} });
      assert.equal(kq.them, 20);
      kiemMau(kq, fx, ky);
      assert.ok(kq.the.every((t) => t.draft.cach_doc["bo-doc-luat"] && t.draft.cach_doc[KHOA_GOP] && t.draft.hien));
      assert.ok(kq.the.some((t) => t.post_id === "do1p00"), "bài 00:30 giờ VN thuộc ngày D");
      assert.ok(!kq.the.some((t) => t.post_id.startsWith("do1q")), "bài D-1 không vào");
      const { rows } = await c.query("SELECT ref_id FROM eval_label_items WHERE lat = $1 AND stratum = $2 ORDER BY ref_id", [LAT_CUON_CHIEU, D]);
      const lai = await rutMau(c, { ngay: D, goiDocGop: goiGia(c), log: () => {} });
      assert.deepEqual([lai.them, lai.goi], [0, 0]);
      const { rows: sau } = await c.query("SELECT ref_id FROM eval_label_items WHERE lat = $1 AND stratum = $2 ORDER BY ref_id", [LAT_CUON_CHIEU, D]);
      assert.deepEqual(sau, rows);
      // Đổi prompt_version → khoá cách đọc mới.
      const b = kq.the[0];
      const { rows: [{ text }] } = await c.query("SELECT text FROM stg_zalo_posts WHERE post_id = $1", [b.post_id]);
      await themSilver(c, { pid: b.post_id, text, o: O_GOP, pv: "dg3-s03-v4" });
      const { dungNhap } = await import("../mau-soat-cuon-chieu.mjs");
      const { rows: sl } = await c.query("SELECT * FROM silver_labels WHERE post_id = $1", [b.post_id]);
      assert.ok(Object.keys(dungNhap({ tin: null, silver: sl, khoaGop: KHOA_GOP, oNguoi: [], luc: "" }).cach_doc).includes(KHOA_GOP.replace("v3", "v4")));
    });
    // Nhánh không có đọc gộp (đọc gộp không trả gì): thẻ phải hiện bộ đọc luật, nháp đọc gộp «vang».
    const kiemHien = (kq) => {
      const vang = kq.the.filter((t) => t.draft.cach_doc[KHOA_GOP].trang_thai === "vang");
      if (!vang.length) throw new Error("TIEN DE: không thẻ nào thiếu đọc gộp");
      if (vang.some((t) => t.draft.hien !== "bo-doc-luat")) throw new Error("HIEN SAI KHI VANG");
      return vang.length;
    };
    const khongTra = async (ids) => ({ goi: ids.length, cham_tran: false });
    await thu(c, async () => assert.ok(kiemHien(await rutMau(c, { ngay: D, goiDocGop: khongTra, log: () => {} })) >= 10));
    await thu(c, async () => {
      await assert.rejects(async () => kiemHien(await rutMau(c, { ngay: D, goiDocGop: khongTra, log: () => {}, dotBien: "hien-luon-gop" })), /HIEN SAI KHI VANG/);
    });
    for (const [dotBien, msg] of [["giu-bai-thu", /MAU CO BAI THU/], ["theo-thu-tu-chen", /MAU KHONG TAT DINH/], ["bo-bai-khong-nhan", /MAU BO BAI KHONG NHAN/], ["khong-tin-thanh-co", /NULL KHONG TIN THANH GIU/]]) {
      await thu(c, async () => {
        const kq = await rutMau(c, { ngay: D, goiDocGop: goiGia(c), log: () => {}, dotBien });
        assert.throws(() => kiemMau(kq, fx, dotBien === "theo-thu-tu-chen" ? ky : {}), msg, dotBien);
      });
    }
  });
});

const D2 = "2025-01-16";
/** Fixture AC-1-GOI: đúng 20 bài khác nội dung ngày D2, 12 bài đã có kết quả đọc gộp. */
async function fixtureGoi(c) {
  const bai = [];
  for (let i = 0; i < 20; i++) {
    const id = `do1g${String(i).padStart(2, "0")}`, text = `bài gọi ${i} bán căn 2pn`;
    await themBai(c, { id, ngayGio: `2025-01-16T0${(i % 9) + 1}:00:00Z`, text });
    await themTin(c, { id: `offer_do1_${id}`, pid: id });
    if (i < 12) await themSilver(c, { pid: id, text, o: O_GOP });
    bai.push(id);
  }
  return { thieu: bai.slice(12) };
}
function kiemGoi(kq, g, fx, tran) {
  if (g.da.length > fx.thieu.length || g.da.some((id) => !fx.thieu.includes(id))) throw new Error("GOI DOC GOP LAP");
  for (const t of kq.the) {
    if (g.da.includes(t.post_id) && t.draft.cach_doc[KHOA_GOP]?.trang_thai !== "co") throw new Error("NHAP THIEU DOC GOP");
  }
  if (tran !== undefined && g.da.length * 0.015 > tran + 1e-9) throw new Error("VUOT TRAN TIEN");
}
test("DO1-AC-1-GOI gọi đọc gộp đúng bài thiếu, một lần, trước khi chụp, dừng ở trần", coDb, async () => {
  await trongGiaoDich(async (c) => {
    const fx = await fixtureGoi(c);
    await thu(c, async () => {
      const g = goiGia(c);
      const kq = await rutMau(c, { ngay: D2, goiDocGop: g, log: () => {} });
      assert.equal(kq.them, 20);
      assert.deepEqual([...g.da].sort(), fx.thieu);
      kiemGoi(kq, g, fx);
      assert.equal((await rutMau(c, { ngay: D2, goiDocGop: g, log: () => {} })).goi, 0);
      assert.equal(g.da.length, 8, "chạy lại không gọi thêm");
    });
    await thu(c, async () => {
      const g = goiGia(c, { usd: 0.015 });
      const log = [];
      const kq = await rutMau(c, { ngay: D2, goiDocGop: g, log: (s) => log.push(s) });
      assert.equal(kq.them, 20);
      assert.equal(g.da.length, 3, "0,015 × 4 > 0,05 → dừng ở lời thứ tư");
      assert.equal(kq.the.filter((t) => t.draft.cach_doc[KHOA_GOP].trang_thai === "vang").length, 5);
      assert.ok(log.some((s) => s.includes("CHAM TRAN DOC GOP")));
      kiemGoi(kq, g, fx, 0.05);
    });
    await thu(c, async () => {
      const g = goiGia(c);
      const kq = await rutMau(c, { ngay: D2, goiDocGop: g, log: () => {}, dotBien: "chup-truoc-goi" });
      assert.throws(() => kiemGoi(kq, g, fx), /NHAP THIEU DOC GOP/);
    });
    await thu(c, async () => {
      const g = goiGia(c);
      const kq = await rutMau(c, { ngay: D2, goiDocGop: g, log: () => {}, dotBien: "goi-lai" });
      assert.throws(() => kiemGoi(kq, g, fx), /GOI DOC GOP LAP/);
    });
    await thu(c, async () => {
      const g = goiGia(c, { usd: 0.015 });
      const kq = await rutMau(c, { ngay: D2, goiDocGop: g, log: () => {}, dotBien: "bo-tran" });
      assert.throws(() => kiemGoi(kq, g, fx, 0.05), /VUOT TRAN TIEN/);
    });
  });
});

// ---- AC-6 trên DB: bộ ghi thật, hai lần chạy ----
test("DO1-AC-7 lát thẻ: người chọn «Không suy ra được» thì không lấy nháp máy", () => {
  const draft = { hien: "doc-gop:m:p", cach_doc: { "doc-gop:m:p": { trang_thai: "co", o: { building: "s8.02", project: "vinhomes ocean park" } } } };
  const nguoiKhong = { draft, nhan: { building: { value: null, not_stated: true }, project: { value: null, not_stated: true } } };
  assert.deepEqual(KHOA_LAT_THE.toa(nguoiKhong), { chua: "khong-tin-hieu" });
  assert.deepEqual(KHOA_LAT_THE.du_an(nguoiKhong), { chua: "khong-tin-hieu" });
  // Người chưa gắn ô đó (chỉ gắn ô khác) → nháp máy vẫn là căn cứ; người gắn có giá trị → theo người.
  assert.deepEqual(KHOA_LAT_THE.toa({ draft, nhan: { kind: { value: "sale" } } }), { chua: "chua-co-danh-ba" });
  assert.deepEqual(KHOA_LAT_THE.toa({ draft, nhan: { building: { value: "s9.01" } } }), { chua: "chua-co-danh-ba" });
});
test("DO1-AC-9 chặn rò không báo giả: mã khu vực, mã cách đọc, tên người đăng giữa từ; ô theo chữ bài trùng tên gộp vào khác", () => {
  const H = [{ nhan: "NGUOI DANG", chuoi: "Hưng" }];
  assert.doesNotThrow(() => chanLo({ lat: { thi_truong: { o: { "vn-hung-yen": 3 } } } }, H));
  assert.doesNotThrow(() => chanLo({ dong: [{ cach_doc: "doc-gop:gateway:x/hung:v1" }] }, H));
  assert.doesNotThrow(() => chanLo({ o: { "theo-chu-bai:hungthinh land": 1 } }, H));
  assert.throws(() => chanLo({ ghi: "anh Hưng bán" }, H), /LO NGUOI DANG/);
  assert.throws(() => chanLo({ o: { "theo-chu-bai:hung yen park": 1 } }, H), /LO NGUOI DANG/);
  // Khuôn mới (S4-r4): tên người không so trên nhãn do code sinh — «Hiếu», «Danh», «Khắc» không trúng khoá cố định của mọi lát.
  const latThat = { lat: { phuong: phanRa([{ k: "vn-hung-yen" }, { k: { chua: "khong-tin-hieu" } }], (r) => r.k) }, ly_do: "chua-co-the-soat", ngay: "2025-06-07" };
  for (const ten of ["Hiếu", "Danh", "Khắc", "Hưng", "Phường"]) assert.doesNotThrow(() => chanLo(latThat, [{ nhan: "NGUOI DANG", chuoi: ten }]), ten);
  assert.equal(loaiChuoi("khong-tin-hieu"), "cau-truc");
  assert.equal(loaiChuoi("theo-chu-bai:hiếu land"), "chu-bai");
  assert.equal(loaiChuoi("anh Hiếu bán"), "chu");
  // Định danh dài lọt nguyên vào một nhãn cấu trúc vẫn bị bắt khi trùng trọn.
  assert.throws(() => chanLo({ o: { phanlemanh: 1 } }, [{ nhan: "LABELER", chuoi: "phanlemanh" }]), /LO LABELER/);
  // Chuỗi cấm dài (chữ bài, trích) vẫn so chuỗi con; tên nguồn vẫn soát cả trên mã khu vực.
  assert.throws(() => chanLo({ x: "…TRICH_Y…" }, [{ nhan: "TRICH", chuoi: "TRICH_Y" }]), /LO TRICH/);
  assert.throws(() => chanLo({ o: { "vn-tenthatve": 1 } }, [{ nhan: "TEN NGUON", chuoi: "Tên Thật Vê" }]), /LO TEN NGUON/);
  // Ô theo chữ bài trùng tên người đăng: gộp vào «khac», tổng giữ nguyên, rồi qua cổng; ô khác không đụng.
  const d = { lat: { du_an_theo_chu: { o: { "theo-chu-bai:hung yen park": 2, "theo-chu-bai:ocean park": 3, khac: 1 }, tong: 6 } } };
  assert.equal(gopOCam(d, H), 1);
  assert.deepEqual(d.lat.du_an_theo_chu.o, { "theo-chu-bai:ocean park": 3, khac: 3 });
  assert.doesNotThrow(() => chanLo(d, H));
});
test("DO1-AC-9 chuoiCam dừng khi source_registry không có tên (không soát được thì không ghi)", async () => {
  const rong = { query: async () => ({ rows: [] }) };
  await assert.rejects(() => chuoiCam(rong, [], [], []), /LO TEN NGUON/);
  // Có source_ids → vào danh sách soát (cùng tập token với leak gate sync-cloud).
  let sql = "";
  const co = { query: async (q) => { sql += q; return { rows: q.includes("source_registry") ? [{ x: "TEN_THAT_V" }, { x: "ma-nguon-v" }] : [] }; } };
  const cam = await chuoiCam(co, [], [], []);
  assert.match(sql, /unnest\(source_ids\)/);
  assert.deepEqual(cam.filter((c) => c.nhan === "TEN NGUON").map((c) => c.chuoi), ["TEN_THAT_V", "ma-nguon-v"]);
});
import { resolveOffers, writeAssertions } from "../lib/assert.mjs";
import { doHangNgay } from "../do-hang-ngay.mjs";
import { FILL } from "../sync-cloud.mjs";

async function tinDu(c, { ma, source = "S03", gia = 3400000000, dt = 62, area = null }) {
  const oid = `offer_do1_${ma}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, price_vnd, area_m2, area_id, first_seen, last_seen,
                   post_ids, source) VALUES ($1, $2, 'sale', $3, $4, $5, now(), now(), ARRAY[$2], $6)`, [oid, `do1${ma}`, gia, dt, area, source]);
  await writeAssertions(c, [{ subject_key: `${source}:do1${ma}`, field: "property_type", value: "apartment", evidence_tier: "observed",
    method: "e1_rule", method_version: "do1-test", rule_id: "do1" }]);
  return oid;
}
/** Căn = căn danh bạ (082) có tin gắn, qua vị từ offer_unit_key của 087 (thang 08/11) — fixture thay thân vị từ bằng bảng
 * tạm tin → căn; mỗi lần gọi lấy một căn đang hiệu lực chưa dùng. Gỡ tin khỏi căn: `boGan`. */
let canDung = 0;
async function can(c, oids) {
  await c.query("CREATE TEMP TABLE IF NOT EXISTS do1_gan (offer_id text PRIMARY KEY, unit_key text) ON COMMIT DROP");
  await c.query(`CREATE OR REPLACE FUNCTION offer_unit_key(p_offer_id text) RETURNS text LANGUAGE sql STABLE AS
    $f$ SELECT unit_key FROM pg_temp.do1_gan WHERE offer_id = p_offer_id $f$`);
  const { rows: [u] } = await c.query("SELECT unit_key FROM units WHERE status = 'active' ORDER BY unit_key OFFSET $1 LIMIT 1", [canDung++]);
  assert.ok(u, "bản chép không đủ căn danh bạ đang hiệu lực (082)");
  for (const o of oids) await c.query("INSERT INTO pg_temp.do1_gan VALUES ($1, $2)", [o, u.unit_key]);
  return `can:${u.unit_key}`;
}
const boGan = (c, oids) => c.query("DELETE FROM pg_temp.do1_gan WHERE offer_id = ANY ($1)", [oids]);
test("DO1-AC-6 chuyển bậc trên DB: lập mốc, bảy loại đổi, đổi khoá, một dòng mỗi đơn vị, chạy lại 0 dòng", coDb, async () => {
  await trongGiaoDich(async (c) => {
    const { rows: [{ ward }] } = await c.query("SELECT id AS ward FROM areas WHERE region_type = 'submarket' LIMIT 1");
    const o = {};
    for (const m of ["A", "B", "C", "D", "E", "G", "f1"]) o[m] = await tinDu(c, { ma: m, area: ward, dt: m === "B" ? null : 62 });
    o.h1 = await tinDu(c, { ma: "h1", source: "S06", area: ward });
    await writeAssertions(c, [{ subject_key: "S03:do1A", field: "block_raw", value: "S8.02", evidence_tier: "observed", method: "e1_rule", method_version: "do1-test", rule_id: "do1" }]);
    await resolveOffers(c, Object.values(o));
    const F = await can(c, [o.f1]), P = await can(c, [o.h1]);
    // Trong giao dịch (ROLLBACK): DB đã có dòng đo từ trước (vd DB thử dựng mẫu) thì bắt đầu từ hai bảng rỗng.
    await c.query("DELETE FROM data_level_unit; DELETE FROM data_level_change");
    // Lập mốc ngày trước: ngày lập mốc giữ suốt cả ngày, không so bậc (do1-giu-dau-doi-thang) — lượt đo đổi bậc chạy ngày sau.
    const lan1 = await doHangNgay(c, { ngay: "2025-01-14", write: true });
    assert.equal(lan1.lap_moc, true);
    assert.equal(lan1.dq.find((r) => r.check_name === "do1-chuyen-bac").status, "skip");
    const { rows: [{ n: n0 }] } = await c.query("SELECT count(*)::int AS n FROM data_level_change");
    assert.equal(n0, 0);
    // Đổi dữ liệu.
    await c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id = $1", [o.A]);
    await c.query("UPDATE sale_offer_records SET area_m2 = 62 WHERE offer_id = $1", [o.B]);
    const K = await can(c, [o.C]);
    await c.query("UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1", [o.D]);
    await c.query(`UPDATE sale_offer_records SET field_provenance = (SELECT jsonb_object_agg(k, jsonb_build_object('measured', 'true'))
                   FROM unnest(ARRAY['kind','property_type','price_vnd','area_m2','area_id']) k) WHERE offer_id = $1`, [o.f1]);
    await c.query("UPDATE sale_offer_records SET price_vnd = NULL, area_m2 = NULL WHERE offer_id = $1", [o.G]);
    await boGan(c, [o.h1]);   // tin h1 rời căn P sang căn Q (bảng nối đổi) → đổi khoá
    const Q = await can(c, [o.h1]);
    const ky = {
      [`tin:${o.A}`]: ["tut", ["thieu-gia"]], [`tin:${o.B}`]: ["len", ["du-dien-tich"]], [`tin:${o.C}`]: ["mat", ["gan-can"]], [K]: ["moi", ["gan-can"]],
      [`tin:${o.D}`]: ["mat", ["tin-nghi"]], [F]: ["len", ["do-luong"]], [`tin:${o.G}`]: ["tut", ["thieu-gia", "thieu-dien-tich"]],
      [P]: ["mat", ["doi-khoa"]], [Q]: ["moi", ["doi-khoa"]],
    };
    const kiem = async () => {
      const { rows } = await c.query("SELECT unit_key, huong, ly_do FROM data_level_change WHERE snap_date = '2025-01-15'");
      const by = Object.fromEntries(rows.map((r) => [r.unit_key, r]));
      if (by[`tin:${o.E}`]) throw new Error("CHUYEN BAC GIA");
      if (rows.some((r) => !r.ly_do.length)) throw new Error("THIEU LY DO");
      if (!by[F]?.ly_do.includes("do-luong")) throw new Error("THIEU DO LUONG");
      if (!by[P]?.ly_do.includes("doi-khoa")) throw new Error("DOI KHOA THANH BIEN DONG");
      for (const [k, [h, ly]] of Object.entries(ky)) assert.deepEqual([by[k]?.huong, by[k]?.ly_do], [h, ly], k);
      assert.equal(rows.length, Object.keys(ky).length, "chỉ đơn vị đổi bậc mới có dòng");
    };
    await thu(c, async () => {
      const lan2 = await doHangNgay(c, { ngay: "2025-01-15", write: true });
      await kiem();
      const d = lan2.dq.find((r) => r.check_name === "do1-chuyen-bac").detail;
      assert.equal(d.doi_khoa, 2);
      assert.equal(d.theo_nguon.S06.doi_khoa, 2);
      assert.equal(d.theo_huong_ly_do["tut:thieu-gia"], 2);
      for (const [chieu, v] of Object.entries(d.lat)) assert.equal(Object.values(v.o).reduce((s, n) => s + n, 0), v.tong, `lát ${chieu}`);
      // Lát toà đọc core của đơn vị (bộ ghi): tin A nêu toà S8.02 mà danh bạ chưa có → đúng 1 ô chua-co-danh-ba.
      if (d.lat.toa.o["chua-co-danh-ba"] !== 1) throw new Error(`GOP HAI O CHUA GAN: toa ${JSON.stringify(d.lat.toa.o)}`);
      // data_level_unit khớp tập đơn vị data_level_units() của 087 ở mọi đơn vị (khoá và bậc).
      const { rows: [{ lech }] } = await c.query(`
        SELECT count(*)::int AS lech FROM data_level_unit u FULL JOIN data_level_units() d USING (unit_key)
         WHERE u.data_level IS DISTINCT FROM d.data_level`);
      assert.equal(lech, 0);
      await doHangNgay(c, { ngay: "2025-01-15", write: true });
      await kiem(); // chạy lại không đổi dữ liệu: vẫn đúng các dòng ấy
    });
    await thu(c, async () => {
      const r = await doHangNgay(c, { ngay: "2025-01-15", write: true, dotBien: "lat-tren-dong" });
      const toa = r.dq.find((x) => x.check_name === "do1-chuyen-bac").detail.lat.toa.o;
      assert.throws(() => { if (toa["chua-co-danh-ba"] !== 1) throw new Error("GOP HAI O CHUA GAN"); }, /GOP HAI O CHUA GAN/);
    });
    for (const [dotBien, msg] of [["dong-gia", /CHUYEN BAC GIA/], ["bo-do-luong", /THIEU DO LUONG/], ["doi-khoa-thanh-bien-dong", /DOI KHOA THANH BIEN DONG/]]) {
      await thu(c, async () => {
        await doHangNgay(c, { ngay: "2025-01-15", write: true, dotBien });
        await assert.rejects(kiem, msg, dotBien);
      });
    }
  });
});

// ---- AC-3, AC-4, AC-5, AC-7, AC-9 qua bộ ghi thật ----
test("DO1-AC-9 detail các dòng do1-* qua bộ ghi không mang chữ bài, trích, người đăng, labeler, tên nguồn; số đi qua writer", coDb, async () => {
  await trongGiaoDich(async (c) => {
    const fx = await fixtureMau(c);
    await c.query("UPDATE stg_zalo_posts SET text = 'CHU_BAI_X căn hộ mẫu đặc biệt dài hơn hai mươi ký tự', sender_name = 'NGUOI_Z' WHERE post_id = 'do1p10'");
    await c.query("UPDATE sale_offer_records SET seller_phone = '+84900000001', seller_name = 'NGUOI_Z' WHERE offer_id = 'offer_do1_do1p10'");
    await c.query("INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S09', 'TEN_THAT_V', 'thử') ON CONFLICT DO NOTHING");
    const kq = await rutMau(c, { ngay: D, goiDocGop: goiGia(c), log: () => {} });
    // Mạnh gắn nhãn 14 thẻ: giữ nháp bộ đọc luật ở giá, sửa diện tích ở 4 thẻ.
    let i = 0;
    for (const t of kq.the.slice(0, 14)) {
      const bo = t.draft.cach_doc["bo-doc-luat"];
      const yd = bo.trang_thai === "co" ? "offer" : "not_listing";
      const rows = [["listing_intent", yd], ["price_min_vnd", bo.o.price_min_vnd ?? null], ["area_m2", bo.o.area_m2 ? (i < 4 ? "70" : bo.o.area_m2) : null]];
      for (const [f, v] of rows) {
        await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, 'LABELER_W', $2, $3, $4)", [t.item_id, f, v, v === null]);
      }
      i++;
    }
    await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, quote, quote_ok,
                     cost_usd, run_id, labeled_at) VALUES ('S03', 'do1p10', 'h', $1, 'dtb-s03-v1', 'offer', 'sale', true,
                     'TRICH_Y câu trích dài', true, 0, 'r', '2025-01-15T05:00:00Z')`, [MODEL]);
    await c.query("DELETE FROM data_level_unit");
    const kqDo = await doHangNgay(c, { ngay: D, write: true });
    const dq = Object.fromEntries(kqDo.dq.map((r) => [r.check_name, r]));
    // AC-3 qua writer: giữ giá 100%, diện tích 10/14 trên bộ đọc luật ở thẻ có tin.
    const giu = dq["do1-giu-nhap"];
    assert.equal(giu.status, "pass");
    const gia = giu.detail.dong.find((d) => d.cach_doc === "bo-doc-luat" && d.o === "price_min_vnd");
    assert.equal(gia.tuan_nay.giu, gia.tuan_nay.n);
    const dt = giu.detail.dong.find((d) => d.cach_doc === "bo-doc-luat" && d.o === "area_m2");
    assert.equal(dt.tuan_nay.n - dt.tuan_nay.giu, kq.the.slice(0, 4).filter((t) => t.draft.cach_doc["bo-doc-luat"].o.area_m2).length);
    assert.equal(giu.detail.ty_le_soat.tuan_nay.soat, 14);
    assert.equal(giu.detail.ty_le_soat.tuan_nay.rut, 20);
    assert.equal(giu.detail.canh_bao_soat, false);
    // AC-4 qua writer.
    assert.equal(dq["do1-bo-sot"].status, "pass");
    // AC-5 qua writer: đọc chữ có lượt trong ngày D.
    assert.ok(dq["do1-tin-hieu"].detail.cach_doc.some((x) => x.cach_doc.startsWith("doc-chu") && x.status === "pass"));
    // AC-7 qua writer: mọi chiều tổng ô = tổng.
    for (const [ten, r] of Object.entries(dq)) {
      for (const [chieu, v] of Object.entries(r.detail?.lat ?? {})) {
        if (Object.values(v.o).reduce((s, n) => s + n, 0) !== v.tong) throw new Error(`TONG LAT LECH: ${ten} ${chieu}`);
      }
    }
    assert.ok("du_an_theo_chu" in giu.detail.lat && "thi_truong" in giu.detail.lat);
    // AC-4 qua bộ ghi: số bỏ sót của bộ đọc luật = tính lại từ chính nháp đã chụp và nhãn vừa gắn.
    const daGan = kq.the.slice(0, 14);
    const tinRao = daGan.filter((t) => t.draft.cach_doc["bo-doc-luat"].trang_thai === "co");
    const boLuat = dq["do1-bo-sot"].detail.cach_doc.find((x) => x.cach_doc === "bo-doc-luat").tuan_nay;
    assert.deepEqual([boLuat.n, boLuat.bo], [tinRao.length, 0], "thẻ người gắn «offer» đều là thẻ bộ đọc luật có tin");
    // AC-9: sáu chuỗi cấm không có trong JSON nào (dạng lưu: SĐT E.164).
    const CAM = ["CHU_BAI_X", "TRICH_Y", "NGUOI_Z", "+84900000001", "LABELER_W", "TEN_THAT_V"];
    const { rows } = await c.query("SELECT detail FROM dq_check_results WHERE check_name LIKE 'do1-%' AND checked_at > now() - interval '1 minute'");
    const json = rows.map((r) => r.detail).join("\n");
    for (const x of CAM) assert.ok(!json.includes(x), `lộ ${x}`);
    // Đối chứng dương: mỗi chuỗi trong sáu chuỗi, cài vào detail, đều bị chặn — danh sách cấm thật sự chứa nó (kể cả viết thường).
    const NGUON = ["CHU_BAI_X căn hộ mẫu đặc biệt dài hơn hai mươi ký tự", "TRICH_Y câu trích dài", "NGUOI_Z", "+84900000001", "LABELER_W", "TEN_THAT_V"];
    for (const x of [...NGUON, "chu_bai_x căn hộ mẫu đặc biệt dài hơn hai mươi ký tự", "Ten_That_V"]) {
      await thu(c, async () => assert.rejects(doHangNgay(c, { ngay: D, dotBien: `lo:${x}` }), /^Error: LO /, `không chặn ${x}`));
    }
    assert.ok(fx.coTin.size > 0);
    await thu(c, async () => assert.rejects(doHangNgay(c, { ngay: D, dotBien: "lo-trich" }), /LO TRICH/));
    await thu(c, async () => assert.rejects(doHangNgay(c, { ngay: D, dotBien: "lo-labeler" }), /LO LABELER/));
    // Không báo rò giả (S4-r3 t1): người đăng tên trùng một đoạn mã khu vực của chính detail (như «Hưng» ↔ vn-hung-yen) —
    // mã khu vực không mang chữ người, bước đo vẫn ghi đủ bốn nhóm số.
    const { rows: [{ ma }] } = await c.query(
      "SELECT id AS ma FROM areas WHERE region_type = 'submarket' AND id ~ '-[a-z]{4,}$' ORDER BY id LIMIT 1");
    const doan = ma.split("-").at(-1);
    await thu(c, async () => {
      const { rowCount } = await c.query("UPDATE sale_offer_records SET area_id = $1 WHERE source = 'S03' AND post_ids && $2::text[]", [ma, kq.the.map((t) => t.post_id)]);
      assert.ok(rowCount > 0, "có tin của thẻ để gán phường");
      await c.query("UPDATE stg_zalo_posts SET sender_name = $1 WHERE post_id = ANY ($2)", [doan, kq.the.map((t) => t.post_id)]);
      const lai = await doHangNgay(c, { ngay: D, write: true });
      assert.equal(lai.dq.filter((r) => r.check_name.startsWith("do1-")).length >= 4, true);
      assert.ok(lai.dq.find((r) => r.check_name === "do1-giu-nhap").detail.lat.phuong.o[ma] > 0, "mã phường vẫn trong detail");
      // Cùng tên ấy đứng thành từ trong một chuỗi chữ của detail thì vẫn chặn.
      await assert.rejects(doHangNgay(c, { ngay: D, dotBien: `lo:anh ${doan} bán` }), /LO NGUOI DANG/);
    });
    // Tự soát: mọi từ (≥4 ký tự) của mọi nhãn do bộ ghi sinh ra, đem làm tên người đăng — không từ nào được làm dừng lượt đo.
    const tu = new Set();
    for (const r of kqDo.dq) {
      (function di(x) {
        if (typeof x === "string") { if (loaiChuoi(x) === "cau-truc") for (const w of x.split(/[^a-z0-9]+/)) if (w.length >= 4) tu.add(w); return; }
        if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { di(k); di(v); }
      })(r.detail);
    }
    assert.ok(tu.has("hieu") && tu.has("danh"), "có từ của khoá cố định trong tập tự soát");
    const chuoiCua = (d) => { const o = []; (function di(x) { if (typeof x === "string") o.push(x); else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { o.push(k); di(v); } })(d); return o; };
    for (const r of kqDo.dq) {
      for (const w of tu) {
        const trung = chuoiCua(r.detail).filter((x) => trungCam(x, [{ nhan: "NGUOI DANG", chuoi: w }]));
        assert.deepEqual(trung, [], `nhãn máy trúng tên «${w}» ở ${r.check_name}`);
      }
    }
    await thu(c, async () => {
      // Người đăng «Hiếu» cho mọi thẻ, qua bộ ghi thật: vẫn ghi đủ bốn nhóm số.
      await c.query("UPDATE stg_zalo_posts SET sender_name = 'Hiếu' WHERE post_id = ANY ($1)", [kq.the.map((t) => t.post_id)]);
      const lai = await doHangNgay(c, { ngay: D, write: true });
      assert.equal(lai.dq.filter((r) => r.check_name.startsWith("do1-")).length >= 4, true);
    });
    // Ô theo chữ bài trùng tên người đăng (có dấu, chữ hoa) qua bộ ghi: gộp vào «khac», tổng giữ nguyên; bỏ bước gộp thì dừng.
    await thu(c, async () => {
      const t0 = kq.the[0];
      await c.query("UPDATE stg_zalo_posts SET sender_name = 'Hiếu' WHERE post_id = $1", [t0.post_id]);
      await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, 'LABELER_W', 'project', 'Hiếu Land', false)", [t0.item_id]);
      const lai = await doHangNgay(c, { ngay: D, write: true });
      const theoChu = lai.dq.find((r) => r.check_name === "do1-giu-nhap").detail.lat.du_an_theo_chu;
      assert.ok(!Object.keys(theoChu.o).some((k) => k.startsWith("theo-chu-bai:")), `ô mang tên người đăng đã gộp: ${JSON.stringify(theoChu.o)}`);
      assert.ok(theoChu.o.khac >= 1);
      assert.equal(Object.values(theoChu.o).reduce((a, b) => a + b, 0), theoChu.tong);
      await assert.rejects(doHangNgay(c, { ngay: D, dotBien: "bo-gop-o-cam" }), /LO NGUOI DANG/);
    });
  });
});
test("DO1-AC-9-FILL bảng 083 và thẻ nhãn không vào FILL của sync-cloud, dq_check_results có", () => {
  assert.ok(FILL.includes("dq_check_results"));
  for (const t of ["data_level_unit", "data_level_change", "eval_label_items", "eval_labels"]) assert.ok(!FILL.includes(t), t);
});

// ---- AC-10 trên DB: so cặp trước/sau ----
import { soSanh } from "../so-sanh-cach-doc.mjs";

const KHOA_MOI = KHOA_GOP.replace("v3", "v4");
test("DO1-AC-10 so cặp trên cùng bài 4 tuần: gọi đúng bài thiếu, cặp đủ hai bên, ý nghĩa, dừng ở trần", coDb, async () => {
  await trongGiaoDich(async (c) => {
    const ngay = "2025-02-10";
    const bai = [];
    for (let i = 0; i < 35; i++) {
      const id = `do1s${String(i).padStart(2, "0")}`;
      const stratum = i < 30 ? `2025-0${i < 15 ? "1-2" : "2-0"}${(i % 9) + 1}` : "2024-12-01";
      // bedrooms: cũ giữ ở 18/30, mới giữ ở 28/30 · area_m2: cũ giữ 24/30, mới giữ 25/30 (lệch một bài).
      const cuPn = i < 18 ? 2 : 3, moiPn = i < 28 ? 2 : 3, cuDt = i < 24 ? 62 : 80, moiDt = i < 25 ? 62 : 80;
      const draft = { hien: KHOA_GOP, cach_doc: { [KHOA_GOP]: { trang_thai: "co", o: { bedrooms: String(cuPn), area_m2: String(cuDt) } } } };
      const { rows: [{ item_id }] } = await c.query(
        `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum, draft)
         VALUES ($1, 'S03', $2, $3, 'dev', false, 'cc', $4, $5) RETURNING item_id`, [LAT_CUON_CHIEU, id, `h${id}`, stratum, draft]);
      for (const [f, v] of [["bedrooms", "2"], ["area_m2", "62"]]) {
        await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES ($1, 'u', $2, $3)", [item_id, f, v]);
      }
      bai.push({ id, moi: { listing_intent: { v: "offer" }, bedrooms: { v: moiPn }, area_m2: { v: moiDt } } });
    }
    for (const b of bai.slice(0, 6)) await themSilver(c, { pid: b.id, text: b.id, o: b.moi, pv: "dg3-s03-v4" });
    const goi = ({ usd = 0.001 } = {}) => {
      const da = [];
      const f = async (ids, tran) => {
        let chi = 0, cham = false;
        for (const id of ids) {
          if (chi + usd > tran + 1e-12) { cham = true; break; }
          await themSilver(c, { pid: id, text: id, o: bai.find((b) => b.id === id).moi, pv: "dg3-s03-v4", usd });
          chi += usd; da.push(id);
        }
        return { goi: da.length, cham_tran: cham };
      };
      f.da = da;
      return f;
    };
    const kiemCapDu = (kq, n) => { for (const r of Object.values(kq.dong.detail.o)) if (r.n_cap !== n) throw new Error(`SO SANH KHONG CAP: ${r.n_cap} ≠ ${n}`); };
    const kiem = (kq, g) => {
      if (g.da.some((id) => bai.slice(0, 6).some((b) => b.id === id))) throw new Error("GOI LAI BAI DA CO");
      if (g.da.length * (g.usd ?? 0.001) > 0.3 + 1e-9) throw new Error("VUOT TRAN SO SANH");
      const pn = kq.dong.detail.o.bedrooms, dt = kq.dong.detail.o.area_m2;
      if (pn.n_cap !== 30 || dt.n_cap !== 30) throw new Error(`SO SANH KHONG CAP: ${pn.n_cap}/${dt.n_cap}`);
      assert.deepEqual([pn.giu_cu, pn.giu_moi, pn.co_y_nghia], [18, 28, true]);
      assert.deepEqual([dt.giu_cu, dt.giu_moi, dt.co_y_nghia], [24, 25, false]);
      gan(pn.chenh_cap, 10 / 30, "chênh cặp");
    };
    await thu(c, async () => {
      const g = goi();
      const kq = await soSanh(c, { cu: KHOA_GOP, moi: KHOA_MOI, ngay, goiDocGop: g, log: () => {} });
      assert.equal(g.da.length, 24);
      assert.ok(g.da.every((id) => Number(id.slice(4)) >= 6 && Number(id.slice(4)) < 30));
      kiem(kq, g);
    });
    await thu(c, async () => {
      const g = goi({ usd: 0.031 });
      g.usd = 0.031;
      const log = [];
      const kq = await soSanh(c, { cu: KHOA_GOP, moi: KHOA_MOI, ngay, goiDocGop: g, log: (s) => log.push(s) });
      assert.equal(g.da.length, 9);
      assert.ok(log.some((s) => s.includes("CHAM TRAN SO SANH")));
      kiemCapDu(kq, 15); // chỉ cặp đủ hai bên: 6 sẵn + 9 vừa gọi
    });
    await thu(c, async () => {
      const g = goi();
      const kq = await soSanh(c, { cu: KHOA_GOP, moi: KHOA_MOI, ngay, goiDocGop: g, log: () => {}, dotBien: "goi-lai" });
      assert.throws(() => kiem(kq, g), /GOI LAI BAI DA CO/);
    });
    await thu(c, async () => {
      const g = goi({ usd: 0.031 }); g.usd = 0.031;
      const kq = await soSanh(c, { cu: KHOA_GOP, moi: KHOA_MOI, ngay, goiDocGop: g, log: () => {}, dotBien: "bo-tran" });
      assert.throws(() => kiem(kq, g), /VUOT TRAN SO SANH/);
    });
    await thu(c, async () => {
      const g = goi({ usd: 0.031 }); g.usd = 0.031;
      const kq = await soSanh(c, { cu: KHOA_GOP, moi: KHOA_MOI, ngay, goiDocGop: g, log: () => {}, dotBien: "khong-cap" });
      assert.throws(() => kiemCapDu(kq, 15), /SO SANH KHONG CAP/);
    });
    // do-hang-ngay ghi skip «chưa so cặp» cho khoá mới chưa có dòng so sánh.
    await thu(c, async () => {
      await c.query("UPDATE silver_labels SET labeled_at = '2025-02-09T05:00:00Z' WHERE prompt_version = 'dg3-s03-v4' AND post_id LIKE 'do1s%'");
      await themSilver(c, { pid: "do1s00", text: "khac", o: bai[0].moi });
      await c.query("UPDATE silver_labels SET labeled_at = '2025-02-01T05:00:00Z' WHERE prompt_version = 'dg3-s03-v3' AND post_id = 'do1s00'");
      await c.query("DELETE FROM data_level_unit");
      const r = await doHangNgay(c, { ngay });
      const ss = r.dq.find((x) => x.check_name === "do1-so-sanh" && x.entity === KHOA_MOI);
      assert.deepEqual([ss?.status, ss?.detail.ly_do], ["skip", "chua-so-cap"]);
    });
  });
});
