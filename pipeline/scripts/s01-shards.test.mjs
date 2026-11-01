// node --test pipeline/scripts/s01-shards.test.mjs
// 3110-7: xoay vòng shard khu vực stateless theo chỉ số ngày.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chonShards } from "../s01-shards.mjs";

const vung = (n) =>
  Array.from({ length: n }, (_, i) => ({ name: `V${String(i).padStart(2, "0")}`, listings: n - i }));

test("chonShards: xoay theo ngày — các ngày liên tiếp không trùng khu vực", () => {
  const areas = vung(20);
  const d1 = chonShards(areas, { ngay: "2026-11-01T00:00:00Z", perRun: 6 });
  const d2 = chonShards(areas, { ngay: "2026-11-02T00:00:00Z", perRun: 6 });
  assert.equal(d1.queries.length, 6);
  const trung = d1.queries.filter((q) => d2.queries.includes(q));
  assert.equal(trung.length, 0, "hai đêm liên tiếp phải rời nhau khi đủ vùng");
});

test("chonShards: quay vòng hết chu kỳ thì quay về đầu (wraparound)", () => {
  const areas = vung(7); // perRun 3 → chu kỳ lẻ
  const q = [];
  for (let i = 0; i < 7; i++) q.push(...chonShards(areas, { ngay: new Date(Date.UTC(2026, 10, 1 + i)), perRun: 3 }).queries);
  const duyNhat = new Set(q);
  assert.equal(duyNhat.size, 7, "7 đêm × 3/đêm trên 7 vùng phải phủ đủ, không sót");
});

test("chonShards: chạy lại trong cùng đêm ra cùng danh sách (stateless)", () => {
  const areas = vung(30);
  const a = chonShards(areas, { ngay: "2026-11-01T09:00:00Z", perRun: 6 });
  const b = chonShards(areas, { ngay: "2026-11-01T22:00:00Z", perRun: 6 });
  assert.deepEqual(a.queries, b.queries);
});

test("chonShards: danh sách rỗng → 0 query, không chia số 0", () => {
  const r = chonShards([], { ngay: "2026-11-01T00:00:00Z", perRun: 6 });
  assert.deepEqual(r.queries, []);
  assert.equal(r.tong, 0);
});

test("chonShards: perRun > số vùng → mỗi vùng đúng một lần", () => {
  const areas = vung(4);
  const r = chonShards(areas, { ngay: "2026-11-01T00:00:00Z", perRun: 10 });
  assert.equal(new Set(r.queries).size, 4);
});
