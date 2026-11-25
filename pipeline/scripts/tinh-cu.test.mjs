// tinh-cu.test.mjs — DA3 bang-noi-ma-du-an AC-1: bảng 63 tỉnh trước sáp nhập 2025 (tên → mã thống kê) cho bộ chuyển bản ghi nguồn.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { TINH_CU, maTinhCu } from "../lib/tinh-cu.mjs";

test("bang-du-63-tinh-ma-duy-nhat", () => {
  assert.equal(TINH_CU.size, 63, "bảng tỉnh cũ phải đủ 63 dòng");
  assert.equal(new Set(TINH_CU.values()).size, 63, "mỗi tỉnh một mã");
  for (const m of TINH_CU.values()) assert.match(m, /^\d{2}$/);
});

test("ten-co-tien-to-hau-to-ra-ma", () => {
  assert.equal(maTinhCu("Tỉnh Bình Dương"), "74");
  assert.equal(maTinhCu("TP. Hồ Chí Minh (cũ)"), "79");
  assert.equal(maTinhCu("Bà Rịa - Vũng Tàu"), "77");
  assert.equal(maTinhCu("Thừa Thiên Huế"), "46");
  assert.equal(maTinhCu("Thành phố Hà Nội"), "01");
});

test("bi-danh-viet-tat-ra-ma", () => {
  assert.equal(maTinhCu("TP.HCM"), "79");
  assert.equal(maTinhCu("Sài Gòn"), "79");
  assert.equal(maTinhCu("Vũng Tàu"), "77");
});

test("ten-cut-hay-ngoai-bang-ra-null-khong-ra-tinh-khac", () => {
  assert.equal(maTinhCu("Tỉnh Bình Dươn"), null, "tên cụt không được khớp gần");
  assert.equal(maTinhCu("Hà Tây"), null, "Hà Tây không thuộc 63 tỉnh 2008–2025");
  assert.equal(maTinhCu(""), null);
  assert.equal(maTinhCu(null), null);
  assert.equal(maTinhCu("Việt Nam"), null);
});
