// than-600.mjs — DV7 du-an-cua-tin-len-dinh-vi: thân của pipeline/sql/600_data_flow.sql để chạy BÊN TRONG một giao dịch do
// bộ gọi giữ (chạy thử trên DB máy thu, đo hiệu năng, itest). Tệp 600 tự mở `BEGIN;` và chốt `COMMIT;` — để nguyên thì
// `COMMIT` chốt luôn giao dịch ngoài (vd 105 vừa áp thử) lên DB. Hàm bỏ ĐÚNG MỘT dòng `BEGIN;` và MỘT dòng `COMMIT;`, rồi
// từ chối nếu thân còn chữ COMMIT/END/ROLLBACK đứng riêng làm câu lệnh — bộ gọi phải thoát trước khi gửi câu nào.

/** @param {string} sql nội dung 600_data_flow.sql @returns {string} thân không tự mở/chốt giao dịch */
export function than600(sql) {
  const dong = sql.split("\n");
  const iB = dong.findIndex((d) => /^\s*BEGIN\s*;\s*$/i.test(d));
  const iC = dong.findLastIndex((d) => /^\s*COMMIT\s*;\s*$/i.test(d));
  if (iB < 0 || iC < 0) throw new Error("than-600: không thấy đúng một dòng BEGIN; và một dòng COMMIT; trong 600");
  const con = dong.filter((_, i) => i !== iB && i !== iC);
  const sach = con.map((d) => d.replace(/--.*$/, "")).join("\n");
  if (/(^|;)\s*(COMMIT|END|ROLLBACK|BEGIN|START\s+TRANSACTION)\s*;/im.test(sach)) {
    throw new Error("than-600: thân còn câu mở/chốt giao dịch — không chạy");
  }
  return con.join("\n");
}

// DV7: hai hàm dưới nằm ở đây (không ở refresh-data-flow.mjs) để test import được mà không kéo URL DB chung theo (DT-AC-7).
/** Dòng nối ô Định vị của 600 vào nguồn chung offer_project (DV7, migration 105). */
export const DONG_DINH_VI = /^dinh_vi_link AS MATERIALIZED \(SELECT offer_id FROM offer_project WHERE status = 'mot_du_an'\),$/m;

/**
 * DV7: DB chưa có `offer_project` (máy thu sau gộp mà chưa áp 105, hay DB chép cũ) → thay dòng nối Định vị bằng CTE rỗng như
 * trước DV7 và báo một dòng stderr, thay vì để cả lượt làm tươi lỗi. Có view (hay bảng cùng tên trên search_path) → giữ nguyên.
 * @param {import("pg").Client} c @param {string} sql @returns {Promise<string>}
 */
export async function dinhViKhiCoView(c, sql) {
  if (!DONG_DINH_VI.test(sql)) return sql;
  const { rows: [r] } = await c.query("SELECT to_regclass('offer_project') IS NOT NULL AS co");
  if (r?.co) return sql;
  console.error("refresh-data-flow: chưa có offer_project (chưa áp 105) — ô Định vị tạm bằng 0");
  return sql.replace(DONG_DINH_VI, "dinh_vi_link AS (SELECT NULL::text AS offer_id WHERE false),");
}

/** Dòng nối «Khớp toà» của 600 vào bộ ghép toà PL20 (view offer_building, migration 117) — ON25 `ops-hien-dung-chang-s03`. */
export const DONG_KHOP_TOA = /^toa_link AS MATERIALIZED \(SELECT offer_id FROM offer_building WHERE status = 'gan' AND muc = 'toa'\),$/m;

/**
 * ON25: DB chưa có `offer_building` (DB chép cũ, lược đồ thử chưa áp 117) → thay dòng nối Khớp toà bằng CTE rỗng như trước ON25 và
 * báo một dòng stderr, thay vì để cả lượt làm tươi lỗi. Có view (hay bảng cùng tên trên search_path) → giữ nguyên. Cùng khuôn
 * `dinhViKhiCoView`.
 * @param {import("pg").Client} c @param {string} sql @returns {Promise<string>}
 */
export async function toaKhiCoView(c, sql) {
  if (!DONG_KHOP_TOA.test(sql)) return sql;
  const { rows: [r] } = await c.query("SELECT to_regclass('offer_building') IS NOT NULL AS co");
  if (r?.co) return sql;
  console.error("refresh-data-flow: chưa có offer_building (chưa áp 117) — ô Khớp toà tạm bằng 0");
  return sql.replace(DONG_KHOP_TOA, "toa_link AS (SELECT NULL::text AS offer_id WHERE false),");
}
