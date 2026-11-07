// tien-kiem.mjs — E9, lệnh chấm AC-9: test có sẵn của làn ZCode cho tiền kiểm khởi động lại và lệnh phán lùi của bộ tra
// (collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs, phai-lui-ho-so.test.mjs). Trả đúng mã thoát của test.
import { chayNodeTest } from "./chung-zcode.mjs";

export async function chay() {
  return chayNodeTest("tien-kiem-ho-so.test.mjs", "phai-lui-ho-so.test.mjs");
}
