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
