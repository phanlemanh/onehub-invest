// ranh-gioi.mjs — E4, lệnh chấm AC-4: test vitest có sẵn của bộ tra (ca «lời gọi API mới duy nhất là getUserInfo», bẫy đếm lời gọi)
// cộng kiểm tĩnh .patch của làn ZCode (tien-kiem-ho-so.test.mjs: đúng một điểm gọi api.getUserInfo, không login/loginQR/tạo client).
// Trả mã thoát khác 0 đầu tiên.
import { chayNodeTest, chayVitestBoTra } from "./chung-zcode.mjs";

export async function chay() {
  return chayVitestBoTra() || chayNodeTest("tien-kiem-ho-so.test.mjs");
}
