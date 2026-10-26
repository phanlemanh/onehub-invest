// vocab-enrich.test.ts — PL6 (VL-AC-5 hành vi giữ nguyên): route enrich và prompt enrich-text đọc sổ từ vựng
// mà giữ hành vi trước vòng — đề xuất property_type 'unknown' bị bỏ (ô trống), chuỗi enum prompt giữ byte.
import { test } from "node:test";
import assert from "node:assert/strict";

import { enrichTextAgent } from "../src/agents/enrich-text.js";
import { ENRICH_FIELDS, normalizeValue } from "../src/enrich/route.js";

test("VL-AC-5 route bỏ đề xuất property_type 'unknown'; nhận năm loại còn lại", () => {
  assert.equal(normalizeValue("property_type", "unknown"), null);
  assert.equal(normalizeValue("property_type", "Unknown"), null);
  for (const c of ["apartment", "house", "land", "room", "commercial"]) assert.equal(normalizeValue("property_type", c), c);
  assert.equal(normalizeValue("property_type", "shophouse"), null);
  assert.deepEqual([...ENRICH_FIELDS], ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw"]);
});

test("VL-AC-5 prompt enrich-text giữ byte chuỗi enum property_type", () => {
  assert.ok(
    enrichTextAgent.systemPrompt.includes('"property_type": "apartment|house|land|room|commercial|unknown",'),
    "prompt đổi byte",
  );
});
