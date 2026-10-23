import test from "node:test"; import assert from "node:assert/strict";
import { healthReport } from "../worklist-health.mjs";

test("healthReport: gone/done vượt 40% → verdict stop", () => {
  const r = healthReport({ doneIds: ["a", "b"], goneIds: ["g1"], pendingByMarket: { 47: 10 } });
  assert.equal(r.done, 2);
  assert.equal(r.gone, 1);
  assert.equal(r.rate, 50);
  assert.equal(r.verdict, "stop");
});

test("healthReport: tỉ lệ khoẻ → verdict ok; chia 0 an toàn", () => {
  const r = healthReport({ doneIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"], goneIds: ["x"], pendingByMarket: { 47: 10, 48: 5 } });
  assert.equal(r.rate, 10);
  assert.equal(r.verdict, "ok");
  const empty = healthReport({ doneIds: [], goneIds: [], pendingByMarket: {} });
  assert.equal(empty.rate, 0);
  assert.equal(empty.verdict, "ok");
});
