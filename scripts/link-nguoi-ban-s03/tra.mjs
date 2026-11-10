// tra.mjs — E1, lệnh chấm AC-1: bộ chạy tích hợp độc lập của làn Claude (tich-hop.mjs) trên cây OpenClaw nền + extension.patch áp
// bằng git apply thật, chỉ các ca nhóm [E1] (giám sát duyệt 09/11, XONG U1-0911-5 — thay việc nối vào test của làn ZCode; test của
// ZCode giữ làm test đơn vị, không là thước cổng). Trả đúng mã thoát của vitest; thiếu thứ gì → 2 kèm tên.
import { chayTichHop } from "./tich-hop.mjs";

export async function chay() {
  return chayTichHop("E1");
}
