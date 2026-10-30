import test from "node:test"; import assert from "node:assert/strict";
import { stripNullBytes } from "../import-airbnb.mjs";

/**
 * 3010-3 (GẤP): snapshot có byte U+0000 làm Postgres từ chối UTF8 — importer
 * phải lọc ĐỆ QUY khỏi mọi chuỗi (kể cả jsonb lồng trong mảng/đối tượng).
 */
test("stripNullBytes: chuỗi có \\0 → lọc sạch; mảng/đối tượng đệ quy; phần khác giữ nguyên", () => {
  assert.equal(stripNullBytes("thường"), "thường");
  assert.equal(stripNullBytes("có\0null"), "cónull", "\\0 bị lọc khỏi chuỗi phẳng");
  assert.equal(stripNullBytes("a\0b\0c"), "abc", "nhiều \\0 cùng lúc");
  assert.deepEqual(stripNullBytes(["x\0", "y", { z: "w\0" }]), ["x", "y", { z: "w" }], "đệ quy mảng + đối tượng");
  assert.deepEqual(stripNullBytes({ a: "b\0", c: { d: ["e\0"] }, f: 42, g: null }), { a: "b", c: { d: ["e"] }, f: 42, g: null }, "số/null giữ nguyên");
  assert.deepEqual(stripNullBytes({ "k\0ey": "v" }), { key: "v" }, "khoá có \\0 cũng lọc");
  assert.equal(stripNullBytes(null), null);
  assert.equal(stripNullBytes(undefined), undefined);
  assert.equal(stripNullBytes(123), 123);
  // JSON.stringify của kết quả KHÔNG còn \\0
  const dirty = { text: "a\0b", nested: [{ url: "http://x\0y" }] };
  assert.ok(!JSON.stringify(stripNullBytes(dirty)).includes("\\u0000"), "jsonb sạch \\0");
});
