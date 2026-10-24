import test from "node:test"; import assert from "node:assert/strict";
import { isAllowedSource, isTestSnapshot } from "../import-airbnb.mjs";

// PL1 mở lại lần 2 (claudedp-2310-4): ALLOWLIST nguồn thật thay denylist —
// nguồn LẠ bất kỳ (example, zalo-mock, e2e, TEST…) đều bị chặn; nguồn thật qua.
test("allowlist: nguồn thật đi qua, mọi nguồn khác bị chặn (kể cả lạ)", () => {
  assert.equal(isAllowedSource("zalo-agent"), true);
  assert.equal(isAllowedSource("airbnb-listing"), true);
  assert.equal(isAllowedSource("airbnb-discovery"), true);
  assert.equal(isAllowedSource("airdna-research"), true);
  assert.equal(isAllowedSource("osm-boundaries"), true);
  // bị chặn: thử + lạ
  assert.equal(isAllowedSource("zalo-mock"), false);
  assert.equal(isAllowedSource("e2e"), false);
  assert.equal(isAllowedSource("example"), false, "example có thật trên đĩa — denylist cũ không bắt");
  assert.equal(isAllowedSource("TEST"), false);
  assert.equal(isAllowedSource("chotot-ads"), false, "chotot thuộc importer khác — vào nhầm bảng cũng chặn");
  assert.equal(isAllowedSource(""), false);
});

test("isTestSnapshot (nghĩa mới = ngoài allowlist): theo segment nguồn của tên dir", () => {
  assert.equal(isTestSnapshot("hanoi__zalo-mock__2026-10-18T034152"), true);
  assert.equal(isTestSnapshot("hanoi__example__2026-10-17T153258"), true);
  assert.equal(isTestSnapshot("hanoi__e2e__x"), true);
  assert.equal(isTestSnapshot("hanoi__TEST__1"), true);
  assert.equal(isTestSnapshot("hanoi__zalo-agent__2026-10-23T012853"), false);
  assert.equal(isTestSnapshot("hanoi__airbnb-listing__2026-10-19T232601"), false);
});
