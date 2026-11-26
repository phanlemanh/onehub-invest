// vai-may.mjs — vai của máy đang chạy (hồ sơ pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien, HT33).
// Đọc dòng `VAI=` của ~/.config/onehub/hai-may.env (mô hình hai máy, ADR-0019). CHỈ giá trị đúng `may-phat-trien` mới nới việc
// bỏ qua ca chỉ máy thu; tệp vắng, không đọc được, không có dòng `VAI=`, giá trị lạ → `may-thu` (không nới — hỏng thì hỏng đóng).
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const VAI_PHAT_TRIEN = "may-phat-trien";
export const VAI_THU = "may-thu";

/** Đường tệp cấu hình hai máy; `ONEHUB_HAI_MAY_TEP` chỉ để test trỏ tệp tạm. */
export const tepHaiMay = () => process.env.ONEHUB_HAI_MAY_TEP || path.join(homedir(), ".config/onehub/hai-may.env");

export function vaiMay({ tep = tepHaiMay() } = {}) {
  let text;
  try { text = readFileSync(tep, "utf8"); } catch { return VAI_THU; }
  let vai = null;
  for (const dong of text.split(/\r?\n/)) {
    const m = dong.match(/^\s*(?:export\s+)?VAI\s*=\s*(.*?)\s*$/);
    if (m) vai = m[1].replace(/^(["'])(.*)\1$/, "$2"); // dòng cuối thắng, như shell
  }
  return vai === VAI_PHAT_TRIEN ? VAI_PHAT_TRIEN : VAI_THU;
}
