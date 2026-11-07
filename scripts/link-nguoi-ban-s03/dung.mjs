// dung.mjs — E2, lệnh chấm AC-2: chạy test vitest có sẵn của bộ tra (làn ZCode, trong extension.patch). Trả đúng mã thoát của test.
import { chayVitestBoTra } from "./chung-zcode.mjs";

export async function chay() {
  return chayVitestBoTra();
}
