import { test } from "node:test";
import assert from "node:assert/strict";

import { discoveryQueries } from "../collectors/airbnb-discovery.js";

/** 3110-7: danh sách query discovery — shards từ s01-shards đi SAU query
 * thành phố (toàn cảnh); AIRBNB_DISCOVERY_QUERY cũ vẫn đè hẳn đúng một query. */
test("discoveryQueries: QUERIES → [thành phố, ...shards]", () => {
  const q = discoveryQueries("Hà Nội", {
    AIRBNB_DISCOVERY_QUERIES: "Tây Hồ, Hà Nội | Hoàn Kiếm, Hà Nội",
  } as NodeJS.ProcessEnv);
  assert.deepEqual(q, ["Hà Nội", "Tây Hồ, Hà Nội", "Hoàn Kiếm, Hà Nội"]);
});

test("discoveryQueries: chỉ AIRBNB_DISCOVERY_QUERY (cũ) → đúng một query, không thêm thành phố", () => {
  const q = discoveryQueries("Hà Nội", {
    AIRBNB_DISCOVERY_QUERY: "Quận Hoàn Kiếm",
  } as NodeJS.ProcessEnv);
  assert.deepEqual(q, ["Quận Hoàn Kiếm"]);
});

test("discoveryQueries: không env → tên thành phố", () => {
  assert.deepEqual(discoveryQueries("Hà Nội", {} as NodeJS.ProcessEnv), ["Hà Nội"]);
});

test("discoveryQueries: QUERIES rỗng/toàn khoảng trắng → rơi về mặc định", () => {
  assert.deepEqual(
    discoveryQueries("Hà Nội", { AIRBNB_DISCOVERY_QUERIES: "  |  | " } as NodeJS.ProcessEnv),
    ["Hà Nội"],
  );
});
