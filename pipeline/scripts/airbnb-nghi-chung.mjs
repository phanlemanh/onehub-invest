// airbnb-nghi-chung.mjs — phần dùng chung của hai tệp test airbnb-nghi-khong-hoi-sinh (AN-AC-n ↔
// _acceptance/airbnb-nghi-khong-hoi-sinh/evals.yaml): câu cho nghỉ CŨ của ghiListing (đối chứng) và bộ kiểm tĩnh nhánh cho nghỉ.

/** Câu cho nghỉ của ghiListing trước bản sửa — chép nguyên văn từ main 1649ab91, chỉ dùng làm đối chứng. */
export const CAU_NGHI_CU = `UPDATE listing_records SET retired_at = now(), retired_reason = 'ngoai_phuong'
       WHERE id = $1 AND retired_at IS NULL`;

/** Thân nhánh `if (!areaId) { … }` của ghiListing trong mã nguồn transform-airbnb.mjs; null khi không tìm thấy. */
export function nhanhNghi(src) {
  const ham = src.indexOf("export async function ghiListing");
  if (ham < 0) return null;
  const mo = src.indexOf("if (!areaId) {", ham);
  const dong = src.indexOf("return false;", mo);
  return mo < 0 || dong < 0 ? null : src.slice(mo, dong);
}

/**
 * Lỗi của nhánh cho nghỉ: phải ghi toạ độ của lần thu mới nhất và không chặn cập nhật bằng `retired_at IS NULL`.
 * @param {string | null} nhanh
 * @returns {string[]} rỗng = đạt
 */
export function kiemNhanhNghi(nhanh) {
  if (!nhanh) return ["không tìm thấy nhánh cho nghỉ của ghiListing"];
  const loi = [];
  if (!/UPDATE\s+listing_records/i.test(nhanh)) loi.push("nhánh cho nghỉ không UPDATE listing_records");
  if (!/\blatitude\s*=/.test(nhanh) || !/\blongitude\s*=/.test(nhanh)) loi.push("nhánh cho nghỉ không ghi toạ độ lần thu mới");
  if (/retired_at\s+IS\s+NULL/i.test(nhanh)) loi.push("nhánh cho nghỉ còn chặn 'retired_at IS NULL' — listing đã nghỉ không nhận toạ độ mới");
  return loi;
}
