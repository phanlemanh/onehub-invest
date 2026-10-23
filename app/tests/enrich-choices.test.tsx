// enrich-choices.test.tsx — planEnrichApproval: route decide dùng để áp thẻ có field xung đột
// (AC-11). Đề xuất lấy từ khuôn thẻ chung do enrich-run thật sinh (agent/tests/fixtures).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { planEnrichApproval } from "../src/lib/enrich-choices";

type F = { proposal_id: number; field: string; source: string };
const CARD = JSON.parse(
  readFileSync(join(import.meta.dirname, "../../agent/tests/fixtures/e1-conflict-card.json"), "utf8"),
);
const queued = (CARD.evidence.fields as F[]).map((f) => ({ id: f.proposal_id, field: f.field }));
const pick = (field: string, source: string) =>
  (CARD.evidence.fields as F[]).find((f) => f.field === field && f.source === source)!.proposal_id;
const others = (CARD.evidence.fields as F[]).filter((f) => f.field !== "property_type").map((f) => f.proposal_id);

test("AC-11 planEnrichApproval: thiếu lựa chọn cho field xung đột thì từ chối", () => {
  const r = planEnrichApproval(queued, undefined);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.error, "thiếu lựa chọn: property_type");
  assert.equal(planEnrichApproval(queued, {}).ok, false);
});

test("AC-11 planEnrichApproval: chọn một bên → áp bên đó + field không xung đột", () => {
  const house = pick("property_type", "e2_llm");
  const r = planEnrichApproval(queued, { property_type: house });
  assert.deepEqual(r, { ok: true, applyIds: [house, ...others].sort((a, b) => a - b) });
  const land = pick("property_type", "e1_rule");
  const r2 = planEnrichApproval(queued, { property_type: land });
  assert.ok(r2.ok && r2.applyIds.includes(land) && !r2.applyIds.includes(house));
});

test("AC-11 planEnrichApproval: «Bỏ cả hai» (null) → không áp bên nào", () => {
  const r = planEnrichApproval(queued, { property_type: null });
  assert.deepEqual(r, { ok: true, applyIds: [...others].sort((a, b) => a - b) });
});

test("AC-11 planEnrichApproval: id không thuộc field thì từ chối", () => {
  const r = planEnrichApproval(queued, { property_type: others[0] });
  assert.equal(r.ok, false);
  assert.match(!r.ok ? r.error : "", /không thuộc trường property_type/);
});

test("AC-11 planEnrichApproval đối chứng: thẻ không xung đột áp mọi đề xuất", () => {
  const plain = [{ id: 1, field: "bedrooms" }, { id: 2, field: "street_raw" }];
  assert.deepEqual(planEnrichApproval(plain, undefined), { ok: true, applyIds: [1, 2] });
});
