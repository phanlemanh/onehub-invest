// lib/thi-truong.mjs — MỘT chỗ ánh xạ thành phố ↔ thị trường (s06-vung-moi-len-canonical AC-3).
// Mã thị trường cấp tỉnh là `vn-<x>` (migration 064); hai thị trường tự thu giữ mã cũ vn-hanoi, vn-hcmc.
// reassign-areas và transform-chotot lấy tập thành phố CHỈ từ đây — thêm thành phố là thêm một dòng ở đây.

/**
 * Khoá thành phố của bộ thu (id trong collector/src/config/cities.ts — cũng là tiền tố snapshot `<khoá>__…`) → thị
 * trường. `ten` là tên ngắn dùng khi cần chèn thị trường tự thu chưa có (chỉ hanoi/hcmc được chèn — `tuChen`).
 */
export const THANH_PHO = {
  hanoi: { id: "vn-hanoi", ten: "Hà Nội", tuChen: true },
  hcmc: { id: "vn-hcmc", ten: "TP. Hồ Chí Minh", tuChen: true },
  danang: { id: "vn-da-nang", ten: "Đà Nẵng", tuChen: false },
  haiphong: { id: "vn-hai-phong", ten: "Hải Phòng", tuChen: false },
};

/** Tỉnh cũ đã sáp nhập (đơn vị hành chính 2025, 34 tỉnh) → thị trường mới chứa nó. */
export const SAP_NHAP = {
  "vn-binh-duong": "vn-hcmc",
  "vn-ba-ria-vung-tau": "vn-hcmc",
  "vn-hai-duong": "vn-hai-phong",
  "vn-quang-nam": "vn-da-nang",
};

const MA_THI_TRUONG = new Set(Object.values(THANH_PHO).map((t) => t.id));

/**
 * `cityCode` của tin (mã thị trường, mã tỉnh cũ, hay khoá bộ thu) → mã thị trường; không ánh xạ được → null.
 * Mã thị trường cấp tỉnh khác (vn-<x> có trong areas) đi qua nguyên vẹn khi người gọi truyền `thiTruongCo`.
 * @param {string | null | undefined} cityCode
 * @param {Set<string>} [thiTruongCo] mã thị trường đang có trong areas
 */
export function thiTruongCua(cityCode, thiTruongCo) {
  if (!cityCode || typeof cityCode !== "string") return null;
  const ma = cityCode.trim();
  if (THANH_PHO[ma]) return THANH_PHO[ma].id;
  if (SAP_NHAP[ma]) return SAP_NHAP[ma];
  if (MA_THI_TRUONG.has(ma)) return ma;
  if (thiTruongCo?.has(ma)) return ma;
  return null;
}

/** Khoá bộ thu theo thứ tự khai. */
export const khoaThanhPho = () => Object.keys(THANH_PHO);
