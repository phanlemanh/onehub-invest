// gom-tin.mjs — GT5 khoa-gom-hai-tang: công tắc của bước gom hai tầng (transform-zalo bước 4).
// Cùng nếp công tắc `danh-ba:gop-sdt` (danh-ba-nguoi.mjs): một dòng ops_audit, dòng id lớn nhất thắng, chỉ detail.bat === true là bật.
// Tắt (mặc định): bước 4 giữ nguyên văn khoá repostKey cũ.
import { docCongTac } from "./danh-ba-nguoi.mjs";

/** action của dòng công tắc trong ops_audit; detail = { bat: boolean, ly_do }. */
export const CONG_TAC_GOM = "gom-tin:hai-tang";

const SQL = Object.freeze({
  coBang: `SELECT to_regclass('public.ops_audit') IS NOT NULL AS co`,
  congTac: `SELECT id, detail FROM ops_audit WHERE action = '${CONG_TAC_GOM}' ORDER BY id DESC LIMIT 1`,
});

/**
 * Công tắc gom hai tầng hiện hành; DB không có bảng ops_audit → tắt. Dò bảng bằng to_regclass (không bắt lỗi SELECT trong giao dịch).
 * @param {import("pg").Client} client
 * @returns {Promise<"bat"|"tat">}
 */
export async function congTacGom(client) {
  if (!(await client.query(SQL.coBang)).rows[0].co) return "tat";
  return docCongTac((await client.query(SQL.congTac)).rows);
}
