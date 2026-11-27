// can-gia-tot-ba-vai-ten-nguon.mjs — danh sách tên nguồn thật để script đo ba vai (can-gia-tot-ba-vai.mjs) soát xem trang có lộ tên
// nguồn không (hàng can-gia-tot-ba-vai-ten-nguon-trong). Dòng sổ nguồn có real_name NULL, rỗng hay chỉ khoảng trắng bị bỏ: NULL làm
// script ném lỗi, còn tên rỗng thì khớp MỌI chuỗi ("…".includes("") luôn đúng) — mọi trang thành «lộ tên nguồn» giả.

/** Tên nguồn (chữ thường, đã cắt khoảng trắng) từ các dòng `source_registry`; bỏ dòng không có tên dùng được. */
export function danhSachTenNguon(rows) {
  return rows
    .map((r) => (r && typeof r.real_name === "string" ? r.real_name.trim().toLowerCase() : ""))
    .filter((t) => t.length > 0);
}

/** Chuỗi `s` có chứa một tên trong danh sách không (không phân biệt hoa thường). */
export const coTenNguonTrong = (ten, s) => {
  const thap = String(s).toLowerCase();
  return ten.some((t) => thap.includes(t));
};

/** Câu đọc sổ nguồn của script đo ba vai — một chỗ, để test chạy đúng câu này trên DB thật. */
export const CAU_TEN_NGUON = "SELECT real_name FROM source_registry";

/** Nạp tên nguồn qua client pg: `ten` là danh sách soát, `bo` là số dòng sổ nguồn bị bỏ vì không có tên. */
export async function napTenNguon(c) {
  const rows = (await c.query(CAU_TEN_NGUON)).rows;
  const ten = danhSachTenNguon(rows);
  return { ten, bo: rows.length - ten.length };
}

/** Không còn tên nào để soát thì bộ soát tên nguồn vô nghĩa (mọi trang «sạch» giả) — ném lỗi để script dừng «chưa đo được». */
export function batBuocCoTen({ ten, bo }) {
  if (!ten.length) throw new Error(`0 tên nguồn để soát (bỏ ${bo} dòng sổ nguồn không có tên)`);
  return ten;
}
