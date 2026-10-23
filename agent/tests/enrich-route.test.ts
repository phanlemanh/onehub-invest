// enrich-route.test.ts — luật định tuyến enrichment thuần (không model, không DB).
// Tên ca chứa mã AC để eval đọc (E3, E8). Fixture LLM chép nguyên văn từ
// agent/traces/*enrich-text.jsonl ngày 22/10, đi qua parseEnrichOutput thật.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import {
  normalizeValue,
  routeFields,
  summarizeRun,
  llmFieldsFromEnrich,
  type BuildingNode,
  type Routed,
} from "../src/enrich/route.js";

type FixtureRow = { trace: string; output: string };
const fixtures = JSON.parse(
  readFileSync(new URL("./fixtures/llm-outputs.json", import.meta.url), "utf8"),
) as FixtureRow[];

const LBV: BuildingNode = {
  slug: "gpk-lumiere-boulevard",
  name: "Lumiere Boulevard",
  aliases: ["lbv"],
};

const llmOnly = (rs: Routed[]) => rs.filter((r) => r.source === "e2_llm");
const e1Only = (rs: Routed[]) => rs.filter((r) => r.source === "e1_rule");

// ── normalizeValue ──────────────────────────────────────────────────────────

test('normalize "2"↔2', () => {
  assert.equal(normalizeValue("bedrooms", "2"), "2");
  assert.equal(normalizeValue("bedrooms", 2), "2");
  assert.equal(normalizeValue("bedrooms", "2 "), "2");
  assert.equal(normalizeValue("bathrooms", 0), "0");
  assert.equal(
    normalizeValue("bedrooms", "2"),
    normalizeValue("bedrooms", 2),
    'normalize "2"↔2: chuỗi và số phải ra cùng một khoá',
  );
});

test("normalize 'Apartment'→'apartment'", () => {
  assert.equal(normalizeValue("property_type", "Apartment"), "apartment");
  assert.equal(normalizeValue("property_type", " HOUSE "), "house");
  // 'unknown' coi như trống → không thành đề xuất
  assert.equal(normalizeValue("property_type", "unknown"), null);
  // street/block: NFC, trim, gộp khoảng trắng, giữ hoa thường gốc
  assert.equal(normalizeValue("street_raw", "  phố   Ba Đình "), "phố Ba Đình");
  assert.equal(
    normalizeValue("street_raw", "Ba Đình"),
    "Ba Đình",
    "street_raw phải chuẩn NFC",
  );
  assert.equal(normalizeValue("block_raw", "LD2"), "LD2");
});

test("normalize từ chối", () => {
  assert.equal(normalizeValue("bedrooms", "2 phòng"), null);
  assert.equal(normalizeValue("property_type", "Căn hộ"), null);
  assert.equal(normalizeValue("bedrooms", 99), null);
  assert.equal(normalizeValue("bedrooms", 2.5), null);
  assert.equal(normalizeValue("bedrooms", -1), null);
  assert.equal(normalizeValue("bedrooms", null), null);
  assert.equal(normalizeValue("bathrooms", undefined), null);
  assert.equal(normalizeValue("street_raw", "x"), null); // < 2 ký tự
  assert.equal(normalizeValue("street_raw", "a".repeat(201)), null);
  assert.equal(normalizeValue("block_raw", "b".repeat(31)), null); // block ≤ 30
  assert.equal(normalizeValue("street_raw", 12), null);
});

// ── AC-3: căn cứ độc lập ────────────────────────────────────────────────────

test("AC-3 corroborated e1", () => {
  const rs = routeFields({
    current: {},
    e1: { bedrooms: 2 },
    llm: { bedrooms: "2" },
    buildings: [],
  });
  assert.deepEqual(
    llmOnly(rs),
    [{ field: "bedrooms", value: "2", source: "e2_llm", route: "corroborated", corroboratedBy: "e1" }],
    'AC-3: LLM "2" + E1 2 phải corroborated by e1 sau chuẩn hoá',
  );
  assert.deepEqual(e1Only(rs), [], "AC-3: cùng giá trị thì không sinh thêm E1 direct (đề xuất LLM mới là cái được áp)");

  const pt = routeFields({
    current: {},
    e1: { property_type: "apartment" },
    llm: { property_type: "Apartment" },
    buildings: [],
  });
  assert.deepEqual(
    llmOnly(pt).map((r) => [r.route, r.corroboratedBy]),
    [["corroborated", "e1"]],
    "AC-3: LLM 'Apartment' + E1 'apartment' phải corroborated by e1",
  );
});

test("AC-3 corroborated asset_nodes", () => {
  const input = { current: {}, e1: {}, llm: { block_raw: "lbv" } };

  const ok = routeFields({ ...input, buildings: [LBV] });
  assert.deepEqual(
    ok,
    [{
      field: "block_raw",
      value: "Lumiere Boulevard",
      source: "e2_llm",
      route: "corroborated",
      corroboratedBy: "asset_nodes:gpk-lumiere-boulevard",
    }],
    "AC-3: block khớp alias node building → corroborated, value = tên chuẩn node",
  );

  // Chiều đỏ cùng fixture: alias không khớp node nào → review.
  const miss = routeFields({ ...input, buildings: [{ ...LBV, aliases: [] }] });
  assert.deepEqual(
    miss.map((r) => [r.route, r.value, r.corroboratedBy]),
    [["review", "lbv", null]],
    "AC-3: alias không khớp node nào phải ra review, không corroborated",
  );
});

// ── AC-7: E1 trái LLM ───────────────────────────────────────────────────────

test("AC-3 viết tắt toà khớp tên chuẩn E1", () => {
  const rs = routeFields({
    current: {},
    e1: { block_raw: "Lumiere Boulevard" },
    llm: { block_raw: "LBV" },
    buildings: [{ slug: "gpk-lumiere-boulevard", name: "Lumiere Boulevard", aliases: ["lbv"] }],
  });
  assert.deepEqual(
    rs.map((r) => [r.source, r.route, r.value, r.corroboratedBy]),
    [["e2_llm", "corroborated", "Lumiere Boulevard", "e1"]],
    "AC-3: 'LBV' của LLM là cùng toà với 'Lumiere Boulevard' của E1 — không được thành xung đột",
  );
});

test("AC-3 E1 trả mã thô toà", () => {
  const lbv = [{ slug: "gpk-lumiere-boulevard", name: "Lumiere Boulevard", aliases: ["lbv"] }];
  // E1 thật (context-resolver) trả mã IN HOA "LBV", LLM cũng "LBV" → một đề xuất, tên chuẩn
  assert.deepEqual(
    routeFields({ current: {}, e1: { block_raw: "LBV" }, llm: { block_raw: "LBV" }, buildings: lbv })
      .map((r) => [r.source, r.route, r.value, r.corroboratedBy]),
    [["e2_llm", "corroborated", "Lumiere Boulevard", "e1"]],
    "AC-3: mã thô của E1 và LLM là cùng một toà — không xung đột, áp tên chuẩn",
  );
  // E1 một mình trả mã thô → áp thẳng bằng tên chuẩn, không áp mã thô
  assert.deepEqual(
    routeFields({ current: {}, e1: { block_raw: "LBV" }, llm: null, buildings: lbv }).map((r) => [r.route, r.value]),
    [["direct", "Lumiere Boulevard"]],
    "AC-3: E1 mã thô khớp node phải áp tên chuẩn",
  );
});

test("AC-7 xung đột E1/LLM lên thẻ", () => {
  // Ca thật 23/10: E1 «land» (chữ «đất» trong tên nhóm) trái LLM «house» (nhà 4 tầng).
  const input = { current: {}, llm: { property_type: "house" }, buildings: [] };

  const rs = routeFields({ ...input, e1: { property_type: "land" } });
  assert.deepEqual(
    rs.map((r) => [r.source, r.value, r.route, r.conflict]),
    [
      ["e1_rule", "land", "review", true],
      ["e2_llm", "house", "review", true],
    ],
    "AC-7: E1 không được áp khi trái LLM — cả hai lên thẻ, đánh dấu xung đột",
  );
  assert.ok(!rs.some((r) => r.route === "direct"), "AC-7: E1 không được áp khi trái LLM");
  const sum = summarizeRun([rs]);
  assert.equal(sum.xungDot, 1, "AC-7: summarizeRun phải đếm 1 field xung đột");
  assert.equal(sum.review, 2, "AC-7: hai đề xuất chờ duyệt");

  // Đối chứng dương (a): E1 = LLM → một đề xuất LLM corroborated, không xung đột.
  const same = routeFields({ ...input, e1: { property_type: "house" } });
  assert.deepEqual(
    same.map((r) => [r.source, r.route, r.corroboratedBy, r.conflict]),
    [["e2_llm", "corroborated", "e1", undefined]],
    "AC-7: E1 cùng LLM thì áp như AC-3",
  );
  assert.equal(summarizeRun([same]).xungDot, 0);

  // Đối chứng dương (b): LLM im lặng cho field → E1 áp thẳng như AC-2.
  const llmSilent = routeFields({ current: {}, e1: { property_type: "land" }, llm: { bedrooms: 3 }, buildings: [] });
  assert.deepEqual(
    llmSilent.filter((r) => r.field === "property_type").map((r) => [r.source, r.route, r.conflict]),
    [["e1_rule", "direct", undefined]],
    "AC-7: LLM không có giá trị thì E1 áp thẳng",
  );

  // E1 vắng → LLM review thường (không xung đột).
  const noE1 = routeFields({ ...input, e1: {} });
  assert.deepEqual(noE1.map((r) => [r.source, r.route, r.conflict]), [["e2_llm", "review", undefined]]);
  assert.equal(summarizeRun([noE1]).xungDot, 0, "AC-7: không E1 thì không xung đột");
});

test("AC-7 field đang xung đột: lượt sau không áp gì", () => {
  const held = new Set(["property_type"] as const);
  // LLM lượt sau vắng → E1 một mình vẫn KHÔNG direct.
  const silent = routeFields({ current: {}, e1: { property_type: "land" }, llm: null, buildings: [], held });
  assert.deepEqual(
    silent.map((r) => [r.source, r.route, r.conflict]),
    [["e1_rule", "review", true]],
    "AC-7 lượt sau áp E1 vượt thẻ",
  );
  // LLM lượt sau đồng ý E1 → vẫn vào thẻ, không corroborated.
  const agree = routeFields({ current: {}, e1: { property_type: "land" }, llm: { property_type: "land" }, buildings: [], held });
  assert.ok(agree.every((r) => r.route === "review" && r.conflict), "AC-7 lượt sau áp E1 vượt thẻ");
  // Field khác không bị giữ → đi như thường.
  const other = routeFields({ current: {}, e1: {}, llm: { bedrooms: 3 }, buildings: [], held });
  assert.deepEqual(other.map((r) => [r.field, r.route, r.conflict]), [["bedrooms", "review", undefined]]);
});

// ── fill-gap ────────────────────────────────────────────────────────────────

test("fill-gap", () => {
  const rs = routeFields({
    current: { bedrooms: 3, property_type: "unknown" },
    e1: { bedrooms: 2, property_type: "house" },
    llm: { bedrooms: "2", property_type: "house" },
    buildings: [],
  });
  assert.equal(
    rs.filter((r) => r.field === "bedrooms").length,
    0,
    "fill-gap: ô bedrooms đã có giá trị thì không sinh đề xuất",
  );
  // property_type='unknown' tính là trống → vẫn sinh đề xuất
  assert.deepEqual(
    rs.filter((r) => r.field === "property_type").map((r) => r.route),
    ["corroborated"],
  );
});

test("summarizeRun đếm theo route qua nhiều offer", () => {
  const a = routeFields({ current: {}, e1: { bedrooms: 2 }, llm: { bedrooms: 2, street_raw: "Xuân La" }, buildings: [] });
  const b = routeFields({ current: {}, e1: { property_type: "house" }, llm: { property_type: "land" }, buildings: [] });
  assert.deepEqual(summarizeRun([a, b]), { direct: 0, corroborated: 1, review: 3, xungDot: 1 });
});

// ── fixture thật ────────────────────────────────────────────────────────────

test("fixture thật", () => {
  assert.ok(fixtures.length >= 3, "fixture phải có ≥3 output trace thật");
  let total = 0;
  for (const f of fixtures) {
    const parsed = parseEnrichOutput(f.output);
    assert.ok(parsed, `parseEnrichOutput null cho ${f.trace}`);
    const llm = llmFieldsFromEnrich(parsed);
    const rs = routeFields({ current: {}, e1: {}, llm, buildings: [LBV] });
    for (const r of rs) {
      assert.equal(r.source, "e2_llm");
      assert.notEqual(r.route, "superseded", `${f.trace}: không có E1 thì không superseded`);
      assert.equal(normalizeValue(r.field, r.value), r.value, `${f.trace}: value phải đã chuẩn hoá`);
    }
    total += rs.length;
  }
  assert.ok(total > 0, "fixture thật phải sinh ít nhất một đề xuất");
});

test("llmFieldsFromEnrich map street→street_raw, building→block_raw", () => {
  assert.deepEqual(
    llmFieldsFromEnrich({ property_type: "apartment", bedrooms: 1, bathrooms: null, street: "Xuân La", building: "LD2", confidence: 0.8 }),
    { property_type: "apartment", bedrooms: 1, bathrooms: null, street_raw: "Xuân La", block_raw: "LD2" },
  );
});
