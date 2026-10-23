import test from "node:test"; import assert from "node:assert/strict";
import { prioritize } from "../export-airdna-worklist.mjs";
test("prioritize: ưu tiên market rồi revenue DESC, dedupe, chỉ abnb_", () => {
  const rows = [
    { id: "abnb_9", market: "89491", revenue_ltm: 100 },
    { id: "abnb_2", market: "47", revenue_ltm: null },
    { id: "abnb_1", market: "47", revenue_ltm: 50 },
    { id: "abnb_1", market: "47", revenue_ltm: 50 }, // trùng
    { id: "abnb_5", market: "48", revenue_ltm: 900 },
    { id: "vrbo_x", market: "47", revenue_ltm: 999 },
  ];
  assert.deepEqual(prioritize(rows), ["abnb_1", "abnb_2", "abnb_5", "abnb_9"]);
});
