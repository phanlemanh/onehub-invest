// gom-tin-ma.mjs — GT5 khoa-gom-hai-tang AC-6: bộ tìm mã toà/căn và mã tin môi giới cho khoá gom hai tầng.
// Khác MA_TOA_CAN cũ (transform-zalo): nhận chữ thường, mã toà 1–3 chữ + 1–4 số (+ đuôi căn «.03», «-1203», «xx13»), mã tin môi giới
// 2–4 chữ + 4–6 số; trả mã viết HOA để hai cách viết của một mã chung tin. Chỉ để gom, không nối danh bạ.
// Đầu vào là chữ đã qua gatSo (gạt URL, SĐT) — người gọi lo.

const MA = /(?<![\p{L}\p{N}])([a-z]{1,4})(\d{1,6})((?:[.\-]\d{2,4}|xx\d{2})?)(?![\p{L}\p{N}])/giu;

/** Nhiễu khai ở Cổng Phạm vi (bảng phủ ca §3.3): mốc tháng, đơn vị, cọc, OCP, giao dịch, hệ số «x2»; thêm khi soát bài thật 20/11:
 *  quận «Q9» (bài Grand Park ghi kèm địa chỉ) và mốc tháng.năm «T6.2027». So trên mã đã viết HOA. */
export const NHIEU = Object.freeze([/^T\d+$/, /^T\d{1,2}[.\-]\d{2,4}$/, /^Q\d{1,2}$/, /^M2$/, /^PN\d+$/, /^WC\d+$/, /^COC\d+$/, /^OCP\d+$/, /^GD\d+$/, /^X\d+$/]);

/**
 * Mã đọc từ chữ, viết HOA, không trùng, sắp xếp.
 * @param {string} so chữ đã qua gatSo
 * @param {{ nhieu?: RegExp[] }} [opts] `nhieu` chỉ để test chứng thước đỏ khi bỏ danh sách
 * @returns {string[]}
 */
export function maMoi(so, { nhieu = NHIEU } = {}) {
  const ra = new Set();
  for (const m of String(so ?? "").normalize("NFC").matchAll(MA)) {
    const [chu, so_, duoi] = [m[1], m[2], m[3]];
    const toa = chu.length <= 3 && so_.length <= 4;
    const tinMoiGioi = chu.length >= 2 && so_.length >= 4 && !duoi;
    if (!toa && !tinMoiGioi) continue;
    const ma = m[0].toUpperCase();
    if (nhieu.some((re) => re.test(ma))) continue;
    ra.add(ma);
  }
  return [...ra].sort();
}
