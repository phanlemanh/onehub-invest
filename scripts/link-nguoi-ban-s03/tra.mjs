// tra.mjs — E1, lệnh chấm AC-1: chạy test vitest có sẵn của bộ tra (làn ZCode, trong extension.patch). Trả đúng mã thoát của test.
import { chayVitestBoTra } from "./chung-zcode.mjs";

export async function chay() {
  return chayVitestBoTra();
}
