import test from "node:test"; import assert from "node:assert/strict";
import { isTestSnapshot } from "../import-airbnb.mjs";

// PL1 (claudedp-2310-4): snapshot THỬ (dữ liệu giả từ bench/e2e) không bao giờ
// được vào stg_* — importer phải nhận diện và bỏ qua có log.
test("isTestSnapshot: nhận diện zalo-mock / e2e / TEST; nguồn thật không dính", () => {
  assert.equal(isTestSnapshot("hanoi__zalo-mock__2026-10-18T034152"), true);
  assert.equal(isTestSnapshot("hanoi__e2e__2026-10-01T000000"), true);
  assert.equal(isTestSnapshot("hanoi__TEST__1"), true);
  assert.equal(isTestSnapshot("hanoi__zalo-agent__2026-10-23T012853"), false);
  assert.equal(isTestSnapshot("hanoi__airbnb-listing__2026-10-19T232601"), false);
  assert.equal(isTestSnapshot("hcmc__chotot-ads__2026-10-22T223513"), false);
  // chữ "test" nằm LÕI trong tên nguồn thật không tính — chỉ khớp nguyên segment
  assert.equal(isTestSnapshot("danang__airbnb-listing__2026-10-23T032239565"), false);
});
