// enrich-goi-y.test.ts — hồ sơ _acceptance/the-duyet-du-can-cu AC-6 (PL3): lượt bổ sung tin tạo thẻ duyệt mới KHÔNG mang
// gợi ý mặc định (ai_suggestion NULL). runEnrich thật trên Postgres local trong BEGIN…ROLLBACK (helpers/db.ts), đầu ra LLM
// từ fixtures/llm-outputs.json qua parser thật. Chiều đỏ: bản chép tạm của run.ts gắn lại 'apply', thông điệp ghim.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type pg from "pg";

import type { ContextResult } from "../src/agents/context-resolver.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import type { LlmFn, ResolveFn, runEnrich as RunEnrich } from "../src/enrich/run.js";
import { insertOffer, withTx } from "./helpers/db.js";

const FIXTURES: { output: string }[] = JSON.parse(readFileSync(join(import.meta.dirname, "fixtures/llm-outputs.json"), "utf8"));
const llm: LlmFn = async () => ({ result: parseEnrichOutput(FIXTURES[0].output), model: "qwen27b", tracePath: "traces/t.jsonl" });
const ctx: ContextResult = { projectSlug: null, projectName: null, projectCandidates: [], propertyType: null, buildingHint: null, areaHint: null, matchedBy: "" };
const resolve: ResolveFn = async () => ctx;

const CHEP: string[] = [];
after(() => {
  for (const f of CHEP) rmSync(f, { force: true });
});
/** Bản chép tạm của src/enrich/run.ts đổi đúng một chỗ; import tương đối đổi sang tuyệt đối. */
async function banChepRun(doi: (s: string) => string): Promise<{ runEnrich: typeof RunEnrich }> {
  const goc = join(import.meta.dirname, "../src/enrich/run.ts");
  const s = readFileSync(goc, "utf8");
  const sau = doi(s);
  assert.notEqual(sau, s, "đột biến không đổi gì — đối chứng vô nghĩa");
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${join(dirname(goc), p)}"`);
  const f = join(import.meta.dirname, `.td-cu-run-${process.pid}-${CHEP.length}.ts`);
  writeFileSync(f, tuyet);
  CHEP.push(f);
  return import(f);
}

let seq = 0;
async function offerWithPost(c: pg.Client) {
  const id = `t_td_${++seq}`;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, 'Nhóm thử')`, [
    `p_${id}`, "Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá thương lượng",
  ]);
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown", bedrooms: null });
  return id;
}

async function kiem(runEnrich: typeof RunEnrich) {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const { reviewIds } = await runEnrich({ client: c, runId: `td-${seq}`, dry: false, limit: 50, offerIds: [a], llm, resolve, buildings: [] });
    assert.equal(reviewIds.length, 1, "lượt phải tạo đúng một thẻ duyệt");
    const { rows } = await c.query(`SELECT ai_suggestion FROM review_queue WHERE id = ANY ($1::bigint[])`, [reviewIds]);
    assert.equal(rows[0].ai_suggestion, null, "TD-AC-6: thẻ bổ sung tin mới mang gợi ý apply");
  });
}

test("TD-AC-6 agent: thẻ bổ sung tin mới không gắn gợi ý mặc định (ai_suggestion NULL)", async () => {
  const { runEnrich } = await import("../src/enrich/run.js");
  await kiem(runEnrich);
  const sai = await banChepRun((s) =>
    s.replace("INSERT INTO review_queue (item_type, item_id, title)\n       VALUES ('agent_output', $1, $2) RETURNING id",
      "INSERT INTO review_queue (item_type, item_id, title, ai_suggestion)\n       VALUES ('agent_output', $1, $2, 'apply') RETURNING id"),
  );
  await assert.rejects(kiem(sai.runEnrich), /TD-AC-6: thẻ bổ sung tin mới mang gợi ý apply/);
});
