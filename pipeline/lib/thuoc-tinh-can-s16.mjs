// thuoc-tinh-can-s16.mjs — DA40 thuoc-tinh-can-s16: lõi thuần biến dòng stg_s16_can_chi_tiet thành phát biểu thuộc tính căn.
// Thiết kế: _acceptance/thuoc-tinh-can-s16/design.md §5. Không DB, không I/O.
// Luật (ma trận ghim ở pipeline/tests/thuoc-tinh-can-s16.test.mjs):
//   - giá trị có mặt trong dòng nguồn là của chủ đầu tư (trường rỗng ⇔ chủ căn được sửa — bảng phủ ca §2) → lớp fact;
//   - diện tích > 0 → living_area + building_area_total (cao tầng) hay lot_size_area (thấp tầng); PN, WC > 0 → bedrooms /
//     bathrooms; 0 hay trống = chưa có;
//   - loại hình: 11 mã → apartment / house / commercial (shophouse = commercial, Mạnh duyệt Hỏi-4 18/11); UNDEF, mã lạ → bỏ;
//   - hướng: toà cao tầng lấy hướng ban công, thấp tầng lấy hướng cửa (Hỏi-2 18/11) → tám mã direction_faces; hai mã nối
//     gạch (căn góc) → hai phát biểu; OTHER, trống, mã lạ → bỏ;
//   - tầng, giá: không phát biểu (tầng ở units.floor; giá đọc qua view v_s16_gia_cdt — ADR-0016 §7.1);
//   - một mã có dòng ở hai toà trở lên trong cùng snapshot → không phát biểu (nhóm mo_ho của v_s16_can, 0 căn danh bạ).

import { ASSERTION_FIELD as F, DIRECTION_FACES as H, PROPERTY_TYPE as PT } from "./vocab.generated.mjs";

export const NGUON_S16 = "S16";

/** Loại hình nguồn → mã trục property_type. Mã ngoài bảng (UNDEF, mã lạ) không phát biểu. */
export const LOAI_HINH_S16 = Object.freeze({
  APARTMENT: PT.apartment,
  PENT_HOUSE: PT.apartment,
  ROW_HOUSE: PT.house,
  SEMI_DETACHED_VILLA: PT.house,
  DETACHED_VILLA: PT.house,
  QUADRUPLE_VILLA: PT.house,
  SHOP_HOUSE: PT.commercial,
  ROW_SHOP_HOUSE: PT.commercial,
  SEMI_DETACHED_SHOP: PT.commercial,
  DETACHED_SHOP: PT.commercial,
  COMMERCIAL_SERVICE: PT.commercial,
});

const HUONG = Object.freeze({
  N: H.north, S: H.south, E: H.east, W: H.west,
  NORTH: H.north, SOUTH: H.south, EAST: H.east, WEST: H.west,
  NE: H.northeast, NW: H.northwest, SE: H.southeast, SW: H.southwest,
});

/** Chữ hướng nguồn → mảng mã direction_faces (rỗng khi bỏ) + lý do bỏ. */
export function chuanHuong(chu) {
  const s = String(chu ?? "").trim().toUpperCase();
  if (s === "") return { ma: [], ly_do: "huong-trong" };
  if (s === "OTHER") return { ma: [], ly_do: "huong-other" };
  const phan = s.split("_");
  // N_E, S_W…: hai chữ cái đơn là một hướng chéo viết tách
  const gop = phan.length === 2 && phan.every((p) => /^[NSEW]$/.test(p)) ? [phan.join("")] : phan;
  const ma = [];
  for (const p of gop) {
    const m = HUONG[p];
    if (!m) return { ma: [], ly_do: "huong-ma-la" };
    if (!ma.includes(m)) ma.push(m);
  }
  return { ma, ly_do: null };
}

const so = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const chuoiSo = (n) => String(Number(n));

/**
 * Một dòng stg (cột của migration 113) → { phat: [{field, value}], bo: [{field, ly_do}] }.
 * Không xét chuyện mã ở nhiều toà — việc của gopKhoa.
 */
export function phatBieuTuDong(r) {
  const phat = [];
  const bo = [];
  const cao = String(r.height_type ?? "").trim().toUpperCase();
  // Căn hộ cao tầng: thông thuỷ + tim tường. Nhà thấp tầng: sàn sử dụng + diện tích đất (Mạnh chốt 18/11 — đo trên bản chép
  // máy thu: thấp tầng có area_using > area_building ở 99,8% dòng, trung vị 285 ↔ 84 m²).
  const truongXay = cao === "HIGH_RISE" ? F.building_area_total : cao === "LOW_RISE" ? F.lot_size_area : null;
  for (const [cot, field] of [["area_using", F.living_area], ["area_building", truongXay]]) {
    const v = so(r[cot]);
    if (field === null) bo.push({ field: F.building_area_total, ly_do: "khong-ro-cao-thap" });
    else if (v !== null && Number.isFinite(v) && v > 0) phat.push({ field, value: chuoiSo(v) });
    else bo.push({ field, ly_do: v === null ? "trong" : "khong-duong" });
  }
  for (const [cot, field] of [["bedroom", F.bedrooms], ["bathroom", F.bathrooms]]) {
    const v = so(r[cot]);
    if (v !== null && Number.isInteger(v) && v > 0) phat.push({ field, value: String(v) });
    else bo.push({ field, ly_do: v === null ? "trong" : "bang-0" });
  }
  const lh = String(r.property_type ?? "").trim().toUpperCase();
  if (LOAI_HINH_S16[lh]) phat.push({ field: F.property_type, value: LOAI_HINH_S16[lh] });
  else bo.push({ field: F.property_type, ly_do: lh === "" ? "trong" : lh === "UNDEF" ? "undef" : "ma-la" });
  if (cao === "HIGH_RISE" || cao === "LOW_RISE") {
    const h = chuanHuong(cao === "HIGH_RISE" ? r.balcony_direction : r.direction);
    if (h.ma.length) for (const m of h.ma) phat.push({ field: F.direction_faces, value: m });
    else bo.push({ field: F.direction_faces, ly_do: h.ly_do });
  } else {
    bo.push({ field: F.direction_faces, ly_do: "khong-ro-cao-thap" });
  }
  return { phat, bo };
}

/** Khoá mã căn: '<du_an>/<MÃ HOA>' — đúng khuôn giá trị bí danh ma_nguon S16 của căn (DA33). */
export const khoaCan = (duAn, ma) => `${duAn}/${String(ma).trim().toUpperCase()}`;

/**
 * Gộp các dòng của một snapshot theo khoá mã căn. Trả Map khoá → { du_an, ma, toa: [..], dong, nhieu_toa }.
 * dong = dòng đầu (theo `dong` nhỏ nhất) của toà duy nhất; dòng trùng cùng toà là bản lặp của cùng câu trả lời nguồn.
 */
export function gopKhoa(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = khoaCan(r.du_an, r.ma_can);
    let g = m.get(k);
    if (!g) m.set(k, (g = { du_an: r.du_an, ma: String(r.ma_can).trim().toUpperCase(), toa: [], dong: null }));
    const toa = String(r.toa ?? "");
    if (!g.toa.includes(toa)) g.toa.push(toa);
    if (!g.dong || (r.dong ?? 0) < (g.dong.dong ?? 0)) g.dong = r;
  }
  for (const g of m.values()) {
    g.toa.sort();
    g.nhieu_toa = g.toa.length > 1;
  }
  return m;
}
