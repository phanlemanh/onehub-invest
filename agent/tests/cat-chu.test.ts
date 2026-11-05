// cat-chu.test.ts — cắt chữ cho evidence: không để lại nửa emoji, vì Postgres từ chối JSON có nửa cặp surrogate (22P02).
// Hàm thuần, không DB; ca trên đường ghi thật nằm ở doc-toan-bo-db.itest.ts và enrich-giao-dich.test.ts.
import { test } from "node:test";
import assert from "node:assert/strict";

import { catChu } from "../src/enrich/run.js";

test("catChu: emoji nằm đúng điểm cắt thì bỏ trọn emoji, không để lại nửa cặp", () => {
  const kq = catChu("x".repeat(299) + "🏠 sau", 300);
  assert.equal(kq, "x".repeat(299));
});

test("catChu: emoji gọn trước điểm cắt thì giữ; chữ ngắn hơn trần giữ nguyên", () => {
  assert.equal(catChu("x".repeat(298) + "🏠 sau", 300), "x".repeat(298) + "🏠");
  assert.equal(catChu("Bán căn 🏠", 300), "Bán căn 🏠");
  assert.equal(catChu("", 300), "");
});

test("catChu: chữ tiếng Việt không có emoji cắt đúng số đơn vị như slice", () => {
  const chu = "Bán căn hộ ".repeat(40);
  assert.equal(catChu(chu, 300), chu.slice(0, 300));
});
