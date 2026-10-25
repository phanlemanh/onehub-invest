import test from "node:test"; import assert from "node:assert/strict";
import { s05Skip } from "../apify-facebook-collector.mjs";

// 2510-4 (claudedp): S05 paused trong source_registry → collector bỏ qua thu,
// không gọi mạng, exit 0. s05Skip là luật: mọi giá trị khác 'active' đều bỏ.
// (ngữ nghĩa thật kiểm trên bản chép DB — chạy collector thật, xem XONG)
test("s05Skip: chỉ 'active' là thu; mọi giá trị khác (paused/null/lạ) đều bỏ", () => {
  assert.equal(s05Skip("active"), false, "active → thu bình thường");
  assert.equal(s05Skip("paused"), true, "paused → bỏ qua thu");
  assert.equal(s05Skip("retired"), true, "trạng thái khác → bỏ qua");
  assert.equal(s05Skip(null), true, "thiếu dòng S05 trong registry → coi như không thu");
});

test("should-NOT-fire: 'active' bị đổi nhầm thành 'paused' sẽ chặn nhầm thu", () => {
  // rào cấu trúc: chuỗi so sánh phải là đẳng thức với 'active'
  assert.equal(s05Skip("ACTIVE"), true, "so BẤT ĐẲNG hoa thường — đúng luật 'active' thường");
});
