// parsers.test.ts — hàm thuần của runtime + agents (không gọi model, không DB).
// Parse đầu ra LLM là chốt chặn LLM-off-data-path: output lệch khuôn phải ra
// null, không được lọt thành dữ liệu.
import { test } from "node:test";
import assert from "node:assert/strict";

import { offload, estimateTokens } from "../src/runtime/context.js";
import { parseJudgeOutput } from "../src/agents/judge-entity.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";

test("offload giữ nguyên text ngắn", () => {
  const s = "x".repeat(500);
  assert.equal(offload(s), s);
});

test("offload cắt giữa, giữ head/tail và ghi số ký tự đã bỏ", () => {
  const s = "a".repeat(300) + "b".repeat(1000) + "c".repeat(200);
  const out = offload(s);
  assert.ok(out.startsWith("a".repeat(300)));
  assert.ok(out.endsWith("c".repeat(200)));
  assert.match(out, /offloaded 1000 chars/);
  assert.ok(out.length < s.length);
});

test("estimateTokens: tiếng Việt có dấu đắt hơn ASCII", () => {
  assert.equal(estimateTokens(""), 0);
  assert.equal(estimateTokens("abcd"), 1);
  assert.ok(estimateTokens("đường") > estimateTokens("duong"));
});

test("parseJudgeOutput đọc JSON lẫn trong văn bản", () => {
  const r = parseJudgeOutput('Kết luận:\n{"same_house":"yes","confidence":0.9,"evidence":["cùng phường","giá lệch 2%"]}');
  assert.deepEqual(r, { same_house: "yes", confidence: 0.9, evidence: ["cùng phường", "giá lệch 2%"] });
});

test("parseJudgeOutput từ chối nhãn ngoài yes|no|unsure", () => {
  assert.equal(parseJudgeOutput('{"same_house":"maybe","confidence":0.8}'), null);
});

test("parseJudgeOutput trả null khi không có JSON hoặc JSON hỏng", () => {
  assert.equal(parseJudgeOutput("không chắc"), null);
  assert.equal(parseJudgeOutput('{"same_house": "yes",}'), null);
});

test("parseJudgeOutput điền mặc định confidence 0.5 và evidence rỗng", () => {
  assert.deepEqual(parseJudgeOutput('{"same_house":"unsure","confidence":"abc","evidence":"x"}'), {
    same_house: "unsure",
    confidence: 0.5,
    evidence: [],
  });
});

test("parseEnrichOutput đọc JSON, null khi hỏng", () => {
  assert.deepEqual(parseEnrichOutput('ok {"bedrooms":2,"building":"Lumiere Boulevard"}'), {
    bedrooms: 2,
    building: "Lumiere Boulevard",
  });
  assert.equal(parseEnrichOutput("không có json"), null);
});
