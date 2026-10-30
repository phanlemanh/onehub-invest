// danh-ba-nguoi.mjs — DB2b ho-nguoi-theo-nguon: danh bạ Người theo từng nguồn + vai «người đăng» là phát biểu
// (ADR-0016 §3, §8, §10 Đợt 2b; design docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md).

/**
 * Chốt DB thử: không chạy thước/test trên DB `oneinvest` dùng chung khi 055 chưa áp (luật đo đợt dot0-cam-mau 27/10).
 * @returns {string|null} lời từ chối, hoặc null khi được chạy
 */
export function chotDbThuNguoi(dbName, coBangParties) {
  if (dbName === "oneinvest" && !coBangParties) {
    return "DATABASE_URL trỏ DB oneinvest dùng chung khi chưa có bảng parties — chạy trên DB thử (bash db/db-thu.sh oneinvest_p3_nguoi)";
  }
  return null;
}
