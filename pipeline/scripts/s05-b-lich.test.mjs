import test from "node:test"; import assert from "node:assert/strict";
import { buildRunInput, s05ResultsLimit, s05NewerThan, S05_NEWER_THAN_MAC_DINH } from "../apify-facebook-collector.mjs";

// 2510-14 v2 (MỞ LẠI): hàm dựng input thuần — không gọi Apify.
// Lịch Thứ Ba + Thứ Sáu 06:00 → khoảng cách lượt dài nhất 4 ngày (Sáu→Ba):
// cửa sổ bài mới phải phủ ≥ 4 ngày; '12 hours' cũ chỉ hợp lịch 4 lượt/ngày.
const daysOf = (s) => Number(/([0-9]+)\s*day/.exec(s)?.[1] ?? 0);

test("cửa sổ mặc định phủ khoảng cách lượt dài nhất của lịch Ba/Sáu (≥ 4 ngày)", () => {
  assert.ok(daysOf(s05NewerThan()) >= 4, `cửa sổ '${s05NewerThan()}' phải ≥ 4 ngày`);
  const input = buildRunInput(["https://www.facebook.com/groups/a", "https://www.facebook.com/groups/b"]);
  assert.equal(input.onlyPostsNewerThan, S05_NEWER_THAN_MAC_DINH);
  assert.ok(daysOf(input.onlyPostsNewerThan) >= 4, "input dựng từ buildRunInput cùng cửa sổ");
});

test("S05_NEWER_THAN env đè được (G2/V1 chỉnh) — kiểm cả plist pin '4 days'", () => {
  process.env.S05_NEWER_THAN = "7 days";
  assert.equal(s05NewerThan(), "7 days");
  delete process.env.S05_NEWER_THAN;
  assert.equal(s05NewerThan(), S05_NEWER_THAN_MAC_DINH);
});

test("S05_RESULTS_LIMIT rác/không hợp lệ → về mặc định 100 (không NaN)", () => {
  assert.equal(s05ResultsLimit(), 100, "không đặt env → 100");
  process.env.S05_RESULTS_LIMIT = "rác";
  assert.equal(s05ResultsLimit(), 100, "env rác → 100, không NaN");
  process.env.S05_RESULTS_LIMIT = "-5";
  assert.equal(s05ResultsLimit(), 100, "số âm → 100");
  process.env.S05_RESULTS_LIMIT = "250";
  assert.equal(s05ResultsLimit(), 250, "số hợp lệ → dùng");
  delete process.env.S05_RESULTS_LIMIT;
});
