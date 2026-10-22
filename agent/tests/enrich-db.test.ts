// enrich-db.test.ts — runEnrich trên Postgres local trong BEGIN…ROLLBACK.
// Đầu ra LLM lấy từ fixtures/llm-outputs.json (trace enrich-text thật 22/10) qua
// parseEnrichOutput thật; E1 tiêm vào bằng stub để mỗi ca điều khiển được căn cứ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type pg from "pg";

import type { ContextResult } from "../src/agents/context-resolver.js";
import { parseEnrichOutput, type EnrichResult } from "../src/agents/enrich-text.js";
import { resolveContext } from "../src/agents/context-resolver.js";
import { runEnrich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { withTx, insertOffer, insertProperty } from "./helpers/db.js";

const FIXTURES: { trace: string; output: string }[] = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/llm-outputs.json"), "utf8"),
);
/** Đầu ra LLM thật số i (qua parser thật). #0: apartment · 2pn · «phố Ba Đình» · conf 0.9 */
const real = (i: number): EnrichResult => {
  const r = parseEnrichOutput(FIXTURES[i].output);
  assert.ok(r, `fixture #${i} phải parse được`);
  return r;
};

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "", ...o,
});
const resolveWith = (o: Partial<ContextResult> = {}): ResolveFn => async () => ctx(o);
const llmWith = (r: EnrichResult | null): LlmFn => async () => ({ result: r, model: "qwen27b", tracePath: "traces/t.jsonl" });

let seq = 0;
/** Một offer S03 có tin nguồn trong stg_zalo_posts; trả offer_id. */
async function offerWithPost(
  c: pg.Client,
  o: { bedrooms?: number | null; property_type?: string | null; text?: string; group?: string } = {},
) {
  const id = `t_enr_${++seq}`;
  await c.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
     ON CONFLICT (snapshot_id) DO NOTHING`,
  );
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, $3)`,
    [`p_${id}`, o.text ?? "Bán gấp căn 2pn tầng trung phố Ba Đình, sẵn sổ, giá thương lượng", o.group ?? "Nhóm thử"],
  );
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: o.property_type ?? "unknown", bedrooms: o.bedrooms ?? null });
  return id;
}

const offerRow = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT property_type, bedrooms, bathrooms, street_raw, block_raw FROM sale_offers WHERE offer_id=$1`, [id])).rows[0];
const proposals = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT * FROM enrichment_proposals WHERE offer_id=$1 ORDER BY id`, [id])).rows;
const pendingCards = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT * FROM review_queue WHERE item_id=$1 AND status='pending'`, [`enrich:${id}`])).rows;

const run = (c: pg.Client, offerIds: string[], llm: LlmFn, resolve: ResolveFn, dry = false) =>
  runEnrich({ client: c, runId: `test-${seq}`, dry, limit: 50, offerIds, llm, resolve, buildings: [] });

test("AC-2 E1 áp thẳng kèm nguồn", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    await insertProperty(c, a);
    const b = await offerWithPost(c); // không gắn căn nào
    await run(c, [a, b], llmWith(null), resolveWith({ propertyType: "house", matchedBy: "group_name" }));

    for (const id of [a, b]) {
      assert.equal((await offerRow(c, id)).property_type, "house", "AC-2: E1 phải được điền");
      const ps = await proposals(c, id);
      assert.equal(ps.length, 1);
      assert.equal(ps[0].source, "e1_rule");
      assert.equal(ps[0].route, "direct");
      assert.equal(ps[0].status, "applied");
      assert.match(ps[0].run_id, /^test-/);
      assert.equal(ps[0].evidence.matchedBy, "group_name");
      assert.ok(ps[0].evidence.text.includes("Ba Đình"));
    }
  });
});

test("AC-2 chiều đỏ: ô đã có thì không đề xuất", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c, { property_type: "land" });
    await run(c, [a], llmWith(null), resolveWith({ propertyType: "house" }));
    assert.equal((await offerRow(c, a)).property_type, "land", "AC-2: giá trị cũ phải giữ nguyên");
    assert.equal((await proposals(c, a)).length, 0, "AC-2: ô đã có giá trị thì không sinh đề xuất");
  });
});

test("AC-4 LLM không căn cứ vào hàng duyệt", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const before = await offerRow(c, a);
    const { reviewIds } = await run(c, [a], llmWith(real(0)), resolveWith());

    assert.deepEqual(await offerRow(c, a), before, "AC-4: sale_offers không được đổi khi LLM không căn cứ");
    const ps = await proposals(c, a);
    assert.deepEqual(ps.map((p) => [p.field, p.status, p.route]).sort(), [
      ["bedrooms", "queued", "review"], ["property_type", "queued", "review"], ["street_raw", "queued", "review"],
    ]);
    const cards = await pendingCards(c, a);
    assert.equal(cards.length, 1, "AC-4: đúng một thẻ chờ cho offer");
    assert.deepEqual(reviewIds, [Number(cards[0].id)]);
    const ev = cards[0].evidence;
    assert.equal(ev.offer_id, a);
    assert.equal(ev.model, "qwen27b");
    assert.equal(ev.trace_path, "traces/t.jsonl");
    assert.ok(ev.run_id);
    assert.deepEqual(
      ev.fields.map((f: { field: string; value: string; confidence: number }) => [f.field, f.value, f.confidence]).sort(),
      [["bedrooms", "2", 0.9], ["property_type", "apartment", 0.9], ["street_raw", "phố Ba Đình", 0.9]],
    );
  });
});

test("AC-4 chiều đỏ: field E1 áp, thẻ chỉ liệt field LLM", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    await run(c, [a], llmWith(real(0)), resolveWith({ propertyType: "house" }));
    assert.equal((await offerRow(c, a)).property_type, "house");
    const ev = (await pendingCards(c, a))[0].evidence;
    assert.deepEqual(ev.fields.map((f: { field: string }) => f.field).sort(), ["bedrooms", "street_raw"], "AC-4");
  });
});

test("AC-5 duyệt áp fill-gap + cascade (nối liền)", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const prop = await insertProperty(c, a);
    const { reviewIds } = await run(c, [a], llmWith(real(0)), resolveWith());
    const card = reviewIds[0];
    const queued = (await proposals(c, a)).filter((p) => p.status === "queued").length;
    assert.ok(queued > 0);

    const { rows: [{ n }] } = await c.query(`SELECT decide_enrichment_review($1, 'approved', 'hitl:test') AS n`, [card]);
    assert.equal(n, queued, "AC-5: mọi đề xuất queued của thẻ phải được áp");
    assert.deepEqual(await offerRow(c, a), {
      property_type: "apartment", bedrooms: 2, bathrooms: null, street_raw: "phố Ba Đình", block_raw: null,
    });
    const p = (await c.query(`SELECT bedrooms, street, enrichment_log FROM properties WHERE id=$1`, [prop])).rows[0];
    assert.equal(p.bedrooms, 2);
    assert.equal(p.street, "phố Ba Đình");
    const last = p.enrichment_log.at(-1);
    assert.equal(last.src, "enrich-proposals");
    assert.equal(last.actor, "hitl:test");
    assert.equal(last.proposal_ids.length, queued);
  });
});

test("AC-5 chiều đỏ: thẻ không trỏ đề xuất thì không áp gì", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const { reviewIds } = await run(c, [a], llmWith(real(0)), resolveWith());
    await c.query(`UPDATE enrichment_proposals SET review_id = NULL WHERE offer_id = $1`, [a]);
    const { rows: [{ n }] } = await c.query(`SELECT decide_enrichment_review($1, 'approved', 'hitl:test') AS n`, [reviewIds[0]]);
    assert.equal(n, 0, "AC-5 thẻ không trỏ đề xuất");
  });
});

test("AC-6 bỏ/để sau", async () => {
  await withTx(async (c) => {
    // Bỏ → chạy lại cùng giá trị (khác hoa thường) không đẩy lại
    const a = await offerWithPost(c);
    const r1 = await run(c, [a], llmWith(real(0)), resolveWith());
    await c.query(`SELECT decide_enrichment_review($1, 'rejected', 'hitl:test')`, [r1.reviewIds[0]]);
    await c.query(`UPDATE review_queue SET status='rejected' WHERE id=$1`, [r1.reviewIds[0]]);
    const nBefore = (await proposals(c, a)).length;
    await run(c, [a], llmWith({ ...real(0), property_type: "Apartment" }), resolveWith());
    assert.equal((await proposals(c, a)).length, nBefore, "AC-6 đẩy lại giá trị đã bác");
    assert.equal((await pendingCards(c, a)).length, 0, "AC-6: giá trị đã bác không mở thẻ mới");
    assert.equal((await offerRow(c, a)).bedrooms, null);

    // Để sau → lượt sau mở đúng một thẻ chờ mới cho các đề xuất cũ
    const b = await offerWithPost(c);
    const r2 = await run(c, [b], llmWith(real(0)), resolveWith());
    await c.query(`SELECT decide_enrichment_review($1, 'deferred', 'hitl:test')`, [r2.reviewIds[0]]);
    await c.query(`UPDATE review_queue SET status='deferred' WHERE id=$1`, [r2.reviewIds[0]]);
    await run(c, [b], llmWith(real(0)), resolveWith());
    const cards = await pendingCards(c, b);
    assert.equal(cards.length, 1, "AC-6: để sau → đúng một thẻ chờ mới");
    assert.notEqual(Number(cards[0].id), r2.reviewIds[0]);
    const ps = await proposals(c, b);
    assert.ok(ps.every((p) => p.status === "queued" && Number(p.review_id) === Number(cards[0].id)));
  });
});

test("AC-3 block LLM khớp asset_nodes được áp tên chuẩn", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c, { property_type: "apartment", bedrooms: 2 });
    await runEnrich({
      client: c, runId: "test-ac3", dry: false, limit: 50, offerIds: [a],
      llm: llmWith({ ...real(19), building: "LBV" }), resolve: resolveWith(),
      buildings: [{ slug: "gpk-lumiere-boulevard", name: "Lumiere Boulevard", aliases: ["lbv"] }],
    });
    assert.equal((await offerRow(c, a)).block_raw, "Lumiere Boulevard", "AC-3: áp tên chuẩn của node");
    const p = (await proposals(c, a)).find((x) => x.field === "block_raw");
    assert.equal(p.route, "corroborated");
    assert.equal(p.corroborated_by, "asset_nodes:gpk-lumiere-boulevard");
    assert.equal(p.status, "applied");
  });
});

test("AC-3 E1 thật + asset_nodes thật: mã toà thô áp tên chuẩn", async () => {
  await withTx(async (c) => {
    // E1 = resolveContext THẬT (trả buildingHint "LBV"), buildings = asset_nodes THẬT (seed 032)
    const a = await offerWithPost(c, {
      property_type: "apartment", bedrooms: 2, text: "LBV 2PN full đồ, view hồ bơi, sẵn sổ", group: "Vinhomes Grand Park",
    });
    const { summary } = await runEnrich({
      client: c, runId: "test-ac3-real", dry: false, limit: 50, offerIds: [a],
      llm: llmWith({ ...real(19), building: "LBV" }), resolve: resolveContext,
    });
    assert.equal((await offerRow(c, a)).block_raw, "Lumiere Boulevard", "AC-3: phải áp tên chuẩn, không áp mã thô 'LBV'");
    assert.equal(summary.xungDot, 0, "AC-3: cùng một toà không được tính là xung đột E1/LLM");
    const ps = (await proposals(c, a)).filter((p) => p.field === "block_raw");
    assert.deepEqual(ps.map((p) => [p.source, p.route, p.status]), [["e2_llm", "corroborated", "applied"]]);
  });
});

test("AC-8 chạy lại + dry", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const count = async () => ({
      proposals: (await proposals(c, a)).length,
      pending: (await pendingCards(c, a)).length,
    });
    await run(c, [a], llmWith(real(0)), resolveWith());
    const first = await count();
    await run(c, [a], llmWith(real(0)), resolveWith());
    assert.deepEqual(await count(), first, "AC-8: chạy lại không nhân đề xuất/thẻ");

    // dry trên offer mới: băm nội dung trước = sau
    const b = await offerWithPost(c);
    await insertProperty(c, b);
    const hash = async () =>
      (await c.query(
        `SELECT md5(string_agg(x, '|' ORDER BY x)) AS h FROM (
           SELECT md5(row(property_type, bedrooms, bathrooms, street_raw, block_raw)::text) AS x FROM sale_offers WHERE offer_id = $1
           UNION ALL SELECT md5(row(p.bedrooms, p.bathrooms, p.street, p.enrichment_log)::text)
             FROM properties p JOIN property_offers po ON po.property_id = p.id WHERE po.offer_id = $1
           UNION ALL SELECT md5(row(e.*)::text) FROM enrichment_proposals e WHERE e.offer_id = $1
           UNION ALL SELECT md5(row(r.*)::text) FROM review_queue r WHERE r.item_id = 'enrich:' || $1) t`,
        [b],
      )).rows[0].h;
    const h0 = await hash();
    await run(c, [b], llmWith(real(0)), resolveWith({ propertyType: "house" }), true);
    assert.equal(await hash(), h0, "AC-8 dry đã ghi");

    // Chiều đỏ cùng thước: một «dry» giả có ghi → băm phải khác
    await c.query(`SELECT apply_enrichment(ARRAY[]::bigint[], 'x')`); // không ghi gì → vẫn bằng
    assert.equal(await hash(), h0);
    await c.query(`UPDATE sale_offers SET bedrooms = 1 WHERE offer_id = $1`, [b]);
    assert.notEqual(await hash(), h0, "AC-8 dry đã ghi: thước băm phải bắt được một lần ghi");
  });
});
