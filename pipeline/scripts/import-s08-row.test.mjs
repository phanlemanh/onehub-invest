import test from "node:test"; import assert from "node:assert/strict";
import { s08RowOf } from "../import-s08-row.mjs";

// 2410-12: mapping item S08 → dòng stg_s08_inventory (hàm pure tách từ
// importer để test không cần DB). Item state=detail KHÔNG phải dòng stg.
test("s08RowOf: mapping đủ cột từ payload/meta, giữ đơn vị nguồn", () => {
  const it = {
    sourceId: "abc123",
    fetchedAt: "2026-10-24T09:58:00Z",
    payload: {
      product_code: "GIA-A-01", row_code: "GA", subdivision_name: "PHÂN KHU GIẢ A",
      apartment_type_name: "SHOPHOUSE", land_area: 100, construction_area: 80,
      base_direction_name: "Đông", number_of_room: null, number_of_wc: null,
      apartment_price: 25000000000, early_payment_price: 24000000000,
      state_line: "Còn hàng", delivery_standard_name: "Bàn giao thô",
      fund_groups_sell_code: "QC",
    },
    meta: { projectId: "900001", projectType: "low_rise", state: "notSold", productCode: "GIA-A-01" },
  };
  const r = s08RowOf(it, "snap1");
  assert.equal(r.source_id, "abc123");
  assert.equal(r.snapshot_id, "snap1");
  assert.equal(r.project_id, "900001");
  assert.equal(r.state, "notSold");
  assert.equal(r.product_code, "GIA-A-01");
  assert.equal(r.apartment_price, 25000000000);
  assert.equal(r.payload.product_code, "GIA-A-01");
});

test("s08RowOf: state detail/lạ → null (bỏ, không ghi stg)", () => {
  assert.equal(s08RowOf({ meta: { state: "detail" }, payload: {} }, "s"), null);
  assert.equal(s08RowOf({ meta: { state: "weird" }, payload: {} }, "s"), null);
});

// PL10 (BÁO 2510-12): dữ liệu 171 dự án có trường số là chuỗi rác/""/"S" —
// bộ đổi phải về null thay vì làm postgres lỗi cast (đã vấp khi nạp thật).
test("s08Num/s08Int: chuỗi số hợp lệ đổi được; '', 'S', '2PN', thiếu → null", async () => {
  const { s08Num, s08Int } = await import("../import-airbnb.mjs");
  assert.equal(s08Num("75.5"), 75.5);
  assert.equal(s08Num("1,5"), 1.5);
  assert.equal(s08Num(""), null);
  assert.equal(s08Num(null), null);
  assert.equal(s08Num(undefined), null);
  assert.equal(s08Num("S"), null);
  assert.equal(s08Int("2"), 2);
  assert.equal(s08Int("S"), null, "'S' (studio) là nhãn — null, không phải số phòng");
  assert.equal(s08Int("2PN"), null);
});

// 2610-22(4): siết s08Num — trim; chỉ MỘT dấu phẩy/chấm thập phân; hex/nhiều
// dấu/phẩy nghìn bị loại; phẩy = thập phân (nguồn ghi chấm — bằng chứng
// built_up_area 100.1/100.78; '1,500' → 1.5 theo quyết chữ trong DATA-CONTRACT).
test("s08Num siết (2610-22): ' ', '0x10', '1.500.000', '1 500' → null; ' 100,5 ' → 100.5; '1,500' → 1.5", async () => {
  const { s08Num } = await import("../import-airbnb.mjs");
  assert.equal(s08Num(" "), null, "khoảng trắng trim hết → null");
  assert.equal(s08Num("0x10"), null, "hex — trước đây Number('0x10')=16 lọt");
  assert.equal(s08Num("1.500.000"), null, "nhiều dấu chấm (nghìn) → null");
  assert.equal(s08Num("1 500"), null, "khoảng trắng giữa số → null");
  assert.equal(s08Num(" 100,5 "), 100.5, "trim + phẩy thập phân");
  assert.equal(s08Num("100.78"), 100.78, "chấm thập phân — dạng thật của nguồn");
  assert.equal(s08Num("1,500"), 1.5, "một dấu phẩy = thập phân (quyết 2610-22)");
  assert.equal(s08Num("13579135000"), 13579135000, "số nguyên to (giá) vẫn qua");
});

// 2610-10 vòng 2 (BÁO 2610-17): s08RowOf áp đổi số — 'S' (studio) và '' → null
test("s08RowOf: cột số qua s08Num/s08Int — 'S', '', chuỗi phẩy đổi đúng", () => {
  const r = s08RowOf({
    sourceId: "sid", fetchedAt: "2026-10-26T00:00:00Z",
    payload: { land_area: "100,5", apartment_price: "12300000000", number_of_room: "S", number_of_wc: "" },
    meta: { projectId: "900001", projectType: "low_rise", state: "notSold", productCode: "GIA-A-01" },
  }, "snap1");
  assert.equal(r.land_area, 100.5, "chuỗi phẩy thập phân → số");
  assert.equal(r.apartment_price, 12300000000);
  assert.equal(r.number_of_room, null, "'S' là nhãn — null");
  assert.equal(r.number_of_wc, null, "'' — null");
});
