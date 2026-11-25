// tinh-cu.mjs — DA3 bang-noi-ma-du-an: tên 63 tỉnh, thành trước sáp nhập 01/07/2025 → mã thống kê hai chữ số (danh mục đơn vị
// hành chính của Tổng cục Thống kê, Quyết định 124/2004/QĐ-TTg và cập nhật tới 2025). Mã cũ → tỉnh mới đi qua area_aliases
// (old_province_code → province_code) của kho; tệp này chỉ giữ phần kho không có: tên tỉnh cũ. Thiết kế §3.1.
import { chuanTen } from "./noi-du-an-s06-lop.mjs";

const BANG = [
  ["01", "Hà Nội"], ["02", "Hà Giang"], ["04", "Cao Bằng"], ["06", "Bắc Kạn"], ["08", "Tuyên Quang"], ["10", "Lào Cai"],
  ["11", "Điện Biên"], ["12", "Lai Châu"], ["14", "Sơn La"], ["15", "Yên Bái"], ["17", "Hoà Bình"], ["19", "Thái Nguyên"],
  ["20", "Lạng Sơn"], ["22", "Quảng Ninh"], ["24", "Bắc Giang"], ["25", "Phú Thọ"], ["26", "Vĩnh Phúc"], ["27", "Bắc Ninh"],
  ["30", "Hải Dương"], ["31", "Hải Phòng"], ["33", "Hưng Yên"], ["34", "Thái Bình"], ["35", "Hà Nam"], ["36", "Nam Định"],
  ["37", "Ninh Bình"], ["38", "Thanh Hoá"], ["40", "Nghệ An"], ["42", "Hà Tĩnh"], ["44", "Quảng Bình"], ["45", "Quảng Trị"],
  ["46", "Thừa Thiên Huế"], ["48", "Đà Nẵng"], ["49", "Quảng Nam"], ["51", "Quảng Ngãi"], ["52", "Bình Định"], ["54", "Phú Yên"],
  ["56", "Khánh Hoà"], ["58", "Ninh Thuận"], ["60", "Bình Thuận"], ["62", "Kon Tum"], ["64", "Gia Lai"], ["66", "Đắk Lắk"],
  ["67", "Đắk Nông"], ["68", "Lâm Đồng"], ["70", "Bình Phước"], ["72", "Tây Ninh"], ["74", "Bình Dương"], ["75", "Đồng Nai"],
  ["77", "Bà Rịa - Vũng Tàu"], ["79", "Hồ Chí Minh"], ["80", "Long An"], ["82", "Tiền Giang"], ["83", "Bến Tre"], ["84", "Trà Vinh"],
  ["86", "Vĩnh Long"], ["87", "Đồng Tháp"], ["89", "An Giang"], ["91", "Kiên Giang"], ["92", "Cần Thơ"], ["93", "Hậu Giang"],
  ["94", "Sóc Trăng"], ["95", "Bạc Liêu"], ["96", "Cà Mau"],
];

/** Tên tỉnh cũ đã chuẩn hoá (chuanTen) → mã thống kê. Đúng 63 dòng. */
export const TINH_CU = new Map(BANG.map(([ma, ten]) => [chuanTen(ten), ma]));

// Cách viết tắt, tên gọi khác hay gặp trong địa chỉ danh mục (bộ đo S1, probes/s1/do.mjs) → mã. Không nằm trong 63 dòng.
const BI_DANH = new Map([
  ["tp ho chi minh", "79"], ["tphcm", "79"], ["tp hcm", "79"], ["hcm", "79"], ["sai gon", "79"],
  ["hn", "01"], ["vung tau", "77"], ["ba ria vung tau", "77"], ["hue", "46"],
]);

/** Bỏ «(cũ)», tiền tố «tỉnh», «thành phố», «tp.», «t.» và dấu chấm cuối. */
export function boTienToTinh(s) {
  return String(s ?? "")
    .replace(/\(c[uũ]\)/giu, "")
    .replace(/^\s*(thành phố|tỉnh|tp\.?|t\.)\s*/iu, "")
    .replace(/[.\s]+$/u, "")
    .trim();
}

/** Tên tỉnh (cũ hoặc tên gọi khác) → mã thống kê cũ; không khớp trọn thì null (không khớp gần). */
export function maTinhCu(ten) {
  const k = chuanTen(boTienToTinh(ten));
  if (!k) return null;
  return TINH_CU.get(k) ?? BI_DANH.get(k) ?? BI_DANH.get(chuanTen(String(ten ?? "").replace(/\(c[uũ]\)/giu, ""))) ?? null;
}
