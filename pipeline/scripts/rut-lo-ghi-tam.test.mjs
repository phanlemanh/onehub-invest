// rut-lo-ghi-tam.test.mjs — NB10 E5/E7: đối số của lệnh người cho lô ghi tạm. Hành vi DB của các hàm SQL ở
// agent/tests/ghi-tam.test.ts (cùng hàm rut_lo_ghi_tam, ghi_ket_qua_do_bu, xet_han_ghi_tam mà lệnh này gọi).
import { test } from "node:test";
import assert from "node:assert/strict";

import { docDoiSo } from "./rut-lo-ghi-tam.mjs";

test("E5 AC-5 chạy thử không cần người; rút cần --nguoi hitl: và --ly-do", () => {
  assert.deepEqual(docDoiSo(["--lo", "L1"]).loi, [], "AC-5 chạy thử bị từ chối");
  assert.match(docDoiSo(["--lo", "L1", "--ghi", "--ly-do", "x"]).loi.join(), /--nguoi hitl:/, "AC-5 rút không người lọt qua");
  assert.match(docDoiSo(["--lo", "L1", "--ghi", "--nguoi", "may:x", "--ly-do", "x"]).loi.join(), /--nguoi hitl:/, "AC-5 actor máy rút tay lọt qua");
  assert.match(docDoiSo(["--lo", "L1", "--ghi", "--nguoi", "hitl:thu"]).loi.join(), /--ly-do/, "AC-5 rút thiếu lý do lọt qua");
  assert.deepEqual(docDoiSo(["--lo", "L1", "--ghi", "--nguoi", "hitl:thu", "--ly-do", "x"]).loi, []);
});

test("E7 AC-7 kết quả đo bù chỉ nhận dat|khong-dat và người; --het-han không cần người; đúng một lệnh", () => {
  assert.deepEqual(docDoiSo(["--ket-qua", "L1", "dat", "--nguoi", "hitl:thu"]).a.ketQua, { lo: "L1", gia_tri: "dat" });
  assert.match(docDoiSo(["--ket-qua", "L1", "tot", "--nguoi", "hitl:thu"]).loi.join(), /dat\|khong-dat/, "AC-7 kết quả lạ lọt qua");
  assert.match(docDoiSo(["--ket-qua", "L1", "dat"]).loi.join(), /--nguoi hitl:/, "AC-7 máy ghi kết quả lọt qua");
  assert.deepEqual(docDoiSo(["--het-han"]).loi, [], "AC-6 --het-han bị đòi người");
  assert.match(docDoiSo(["--het-han", "--lo", "L1"]).loi.join(), /đúng một lệnh/, "hai lệnh một lượt lọt qua");
  assert.match(docDoiSo([]).loi.join(), /đúng một lệnh/);
});
