import { strict as assert } from "node:assert";
import { test } from "node:test";

import { jitterMs, inActivityWindow, dailyBudget } from "../core/conduct.js";

test("jitterMs trả giá trị trong [min, max] và min <= max", () => {
  for (let i = 0; i < 1000; i++) {
    const v = jitterMs();
    assert.ok(v >= 2000 && v <= 15000, `ngoài miền: ${v}`);
  }
  const lo = jitterMs(100, 100);
  assert.equal(lo, 100); // min == max → hằng
});

test("jitterMs từ chối min > max", () => {
  assert.throws(() => jitterMs(15000, 2000));
});

test("inActivityWindow: cửa sổ 19–23 đóng mở đúng giờ", () => {
  const at = (h: number, m: number) => new Date(2026, 9, 18, h, m);
  assert.equal(inActivityWindow(at(18, 59)), false, "18:59 ngoài cửa sổ");
  assert.equal(inActivityWindow(at(19, 0)), true, "19:00 vào cửa sổ");
  assert.equal(inActivityWindow(at(22, 59)), true, "22:59 còn trong cửa sổ");
  assert.equal(inActivityWindow(at(23, 1)), false, "23:01 ngoài cửa sổ");
});

test("inActivityWindow: 'off' tắt kiểm tra", () => {
  const noon = new Date(2026, 9, 18, 12, 0);
  assert.equal(inActivityWindow(noon, "off"), true);
});

test("dailyBudget: ngày mới reset used về 0", () => {
  const now = new Date(2026, 9, 18, 20, 0);
  const yesterday = { date: "2026-10-17", used: 500 };
  const b = dailyBudget(yesterday, now);
  assert.equal(b.date, "2026-10-18");
  assert.equal(b.used, 0, "qua ngày mới → reset");
});

test("dailyBudget: cùng ngày giữ used, undefined khởi tạo ngày hiện tại", () => {
  const now = new Date(2026, 9, 18, 20, 0);
  const same = dailyBudget({ date: "2026-10-18", used: 120 }, now);
  assert.equal(same.used, 120, "cùng ngày → giữ used");
  const fresh = dailyBudget(undefined, now);
  assert.equal(fresh.date, "2026-10-18");
  assert.equal(fresh.used, 0);
});
