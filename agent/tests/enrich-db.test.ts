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
    // E1 ra toà, LLM không có ý kiến về toà → toà áp thẳng; các field LLM vẫn chờ.
    // (E1 trái LLM cùng field là AC-7 — không áp, xem ca AC-7.)
    await run(c, [a], llmWith(real(0)), resolveWith({ buildingHint: "S1.03" }));
    assert.equal((await offerRow(c, a)).block_raw, "S1.03");
    const ev = (await pendingCards(c, a))[0].evidence;
    assert.deepEqual(
      ev.fields.map((f: { field: string }) => f.field).sort(),
      ["bedrooms", "property_type", "street_raw"],
      "AC-4",
    );
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

// ── AC-7 / AC-11: E1 trái LLM — hai tin S05 thật của lượt chạy thử 23/10 ─────────

type ConflictCase = { offer_id: string; trace: string; text: string; output: string };
const CONFLICT: { group_name: string; cases: ConflictCase[] } = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/e1-conflict-cases.json"), "utf8"),
);
/**
 * E1 của lượt chạy thử 23/10: luật cũ ra land vì chữ «đất» trong tên nhóm. Vòng enrich-hau-ky đã siết
 * luật thật (context-resolver.test.ts AC-8), nên các ca xung đột E1↔LLM dưới đây dựng lại đúng đầu ra
 * cũ đó trên nền resolveContext thật — cơ chế xung đột vẫn được đo, chỉ nguồn sinh xung đột đổi.
 */
const resolveOldLand: ResolveFn = async (g, t) => ({
  ...(await resolveContext(g, t)),
  propertyType: "land",
  typeBasis: `luật từ khoá: «đất» trong tên nhóm «${g}» → land`,
});
/** Khuôn evidence thẻ xung đột mà app/tests nạp (E16) — writer thật phải khớp khuôn khoá này. */
const CARD_FIXTURE = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/e1-conflict-card.json"), "utf8"),
);
/** bedrooms thật của hai tin lúc chạy thử (LLM không đề xuất bedrooms). */
const REAL_BEDROOMS = [3, 9];

/** Tập «đường:kiểu» của mọi khoá (mảng: hợp mọi phần tử) — so khuôn, không so giá trị. */
function shape(v: unknown, path = ""): Set<string> {
  const out = new Set<string>();
  if (Array.isArray(v)) {
    for (const x of v) for (const s of shape(x, `${path}[]`)) out.add(s);
  } else if (v !== null && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      out.add(`${path}.${k}`);
      for (const s of shape(x, `${path}.${k}`)) out.add(s);
    }
  } else {
    out.add(`${path}:${v === null ? "null" : typeof v}`);
  }
  return out;
}

const llmFrom = (cc: ConflictCase): EnrichResult => {
  const r = parseEnrichOutput(cc.output);
  assert.ok(r, `${cc.trace} phải parse được`);
  return r;
};

/** Offer fixture của ca thật (property_type='unknown') — trả offer_id. */
const conflictOffer = (c: pg.Client, i: number) =>
  offerWithPost(c, { text: CONFLICT.cases[i].text, group: CONFLICT.group_name, bedrooms: REAL_BEDROOMS[i] });

const ptypeProposals = async (c: pg.Client, id: string) =>
  (await proposals(c, id)).filter((p) => p.field === "property_type");

test("AC-7 hai tin S05 thật không bị áp land", async () => {
  for (const [i, cc] of CONFLICT.cases.entries()) {
    await withTx(async (c) => {
      const a = await conflictOffer(c, i);
      const llm = llmFrom(cc);
      await run(c, [a], llmWith(llm), resolveOldLand);

      assert.equal((await offerRow(c, a)).property_type, "unknown", "AC-7: E1 không được áp khi trái LLM");
      const ps = await ptypeProposals(c, a);
      assert.deepEqual(
        ps.map((p) => [p.source, p.value, p.route, p.status]),
        [["e1_rule", "land", "review", "queued"], ["e2_llm", "house", "review", "queued"]],
        "AC-7: hai đề xuất chờ duyệt",
      );
      assert.equal(Number(ps[0].review_id), Number(ps[1].review_id), "AC-7: cùng một thẻ");

      const cards = await pendingCards(c, a);
      assert.equal(cards.length, 1);
      const ev = cards[0].evidence;
      const pt = ev.fields.filter((f: { field: string }) => f.field === "property_type");
      assert.equal(pt.length, 2);
      assert.ok(pt.every((f: { conflict?: boolean }) => f.conflict === true), "AC-7: thẻ phải đánh dấu xung đột");
      const e1f = pt.find((f: { source: string }) => f.source === "e1_rule");
      const llmf = pt.find((f: { source: string }) => f.source === "e2_llm");
      assert.match(e1f.basis, /đất/, "AC-7: căn cứ E1 phải nêu từ khoá");
      assert.match(e1f.basis, /tên nhóm/, "AC-7: căn cứ E1 phải nêu khớp ở tên nhóm");
      assert.match(llmf.basis, /qwen27b/, "AC-7: căn cứ LLM phải nêu model");
      // Field không xung đột của cùng thẻ (bathrooms, street) không mang cờ.
      assert.ok(ev.fields.filter((f: { field: string }) => f.field !== "property_type")
        .every((f: { conflict?: boolean }) => f.conflict === undefined));
      assert.deepEqual([...shape(ev)].sort(), [...shape(CARD_FIXTURE.evidence)].sort(), "AC-11 lệch khoá evidence");

      // Lượt hai cùng dữ liệu: không nhân, thẻ vẫn giữ dấu xung đột.
      const nP = (await proposals(c, a)).length;
      await run(c, [a], llmWith(llm), resolveOldLand);
      assert.equal((await proposals(c, a)).length, nP);
      const again = await pendingCards(c, a);
      assert.equal(again.length, 1);
      assert.ok(again[0].evidence.fields.filter((f: { field: string }) => f.field === "property_type")
        .every((f: { conflict?: boolean }) => f.conflict === true));

      // Lượt sau LLM vắng property_type, rồi LLM lỗi: E1 không được áp vượt thẻ.
      await run(c, [a], llmWith({ ...llm, property_type: undefined }), resolveOldLand);
      await run(c, [a], llmWith(null), resolveOldLand);
      // Lượt sau LLM đổi ý, đồng ý luật («land» của LLM là dòng đề xuất MỚI): vẫn không áp.
      await run(c, [a], llmWith({ ...llm, property_type: "land" }), resolveOldLand);
      assert.equal((await offerRow(c, a)).property_type, "unknown", "AC-7 lượt sau áp E1 vượt thẻ");
      const after = await ptypeProposals(c, a);
      assert.ok(after.every((p) => p.status === "queued" && p.route === "review"), "AC-7 lượt sau áp E1 vượt thẻ");
      assert.equal(after.length, 3);
    });
  }
});

test("AC-7 để sau thẻ xung đột giữ dấu xung đột", async () => {
  await withTx(async (c) => {
    const a = await conflictOffer(c, 0);
    const llm = llmFrom(CONFLICT.cases[0]);
    const r1 = await run(c, [a], llmWith(llm), resolveOldLand);
    await c.query(`SELECT decide_enrichment_review($1, 'deferred', 'hitl:test')`, [r1.reviewIds[0]]);
    await c.query(`UPDATE review_queue SET status='deferred' WHERE id=$1`, [r1.reviewIds[0]]);
    await run(c, [a], llmWith(llm), resolveOldLand);
    const cards = await pendingCards(c, a);
    assert.equal(cards.length, 1, "AC-7: để sau → đúng một thẻ chờ mới");
    assert.notEqual(Number(cards[0].id), r1.reviewIds[0]);
    const pt = cards[0].evidence.fields.filter((f: { field: string }) => f.field === "property_type");
    assert.equal(pt.length, 2);
    assert.ok(
      pt.every((f: { conflict?: boolean; source?: string; basis?: string }) => f.conflict === true && f.source && f.basis),
      "AC-7 dựng lại mất xung đột",
    );
    assert.equal((await offerRow(c, a)).property_type, "unknown");
  });
});

test("AC-7 đối chứng: LLM đồng ý luật thì áp như cũ", async () => {
  await withTx(async (c) => {
    const a = await conflictOffer(c, 0);
    await run(c, [a], llmWith({ ...llmFrom(CONFLICT.cases[0]), property_type: "land" }), resolveOldLand);
    assert.equal((await offerRow(c, a)).property_type, "land");
    assert.deepEqual(
      (await ptypeProposals(c, a)).map((p) => [p.source, p.route, p.corroborated_by, p.status]),
      [["e2_llm", "corroborated", "e1", "applied"]],
    );
    const ev = (await pendingCards(c, a))[0]?.evidence;
    assert.ok(!ev || ev.fields.every((f: { field: string }) => f.field !== "property_type"));
  });
});

test("AC-11 chọn một bên rồi áp", async () => {
  await withTx(async (c) => {
    // Chọn «Theo LLM»: đúng chuỗi SQL route chạy — apply_enrichment(chọn + không xung đột) rồi rejected.
    const a = await conflictOffer(c, 0);
    const llm = llmFrom(CONFLICT.cases[0]);
    const r = await run(c, [a], llmWith(llm), resolveOldLand);
    const card = r.reviewIds[0];
    const queued = (await c.query(
      `SELECT id, field, source FROM enrichment_proposals WHERE review_id=$1 AND status='queued' ORDER BY id`, [card],
    )).rows;
    const land = queued.find((p) => p.field === "property_type" && p.source === "e1_rule");
    const applyIds = queued.filter((p) => p !== land).map((p) => Number(p.id));
    await c.query(`SELECT apply_enrichment($1, 'hitl:test')`, [applyIds]);
    await c.query(`SELECT decide_enrichment_review($1, 'rejected', 'hitl:test')`, [card]);
    await c.query(`UPDATE review_queue SET status='approved' WHERE id=$1`, [card]);

    const o = await offerRow(c, a);
    assert.equal(o.property_type, "house", "AC-11: giá trị được chọn phải áp");
    assert.equal(o.bathrooms, 4);
    assert.equal(o.street_raw, "Quang Trung");
    const pt = await ptypeProposals(c, a);
    assert.deepEqual(pt.map((p) => [p.source, p.status]), [["e1_rule", "rejected"], ["e2_llm", "applied"]]);
    const nP = (await proposals(c, a)).length;
    await run(c, [a], llmWith(llm), resolveOldLand);
    assert.equal((await proposals(c, a)).length, nP, "AC-11: chạy lại không sinh đề xuất mới");
    assert.equal((await pendingCards(c, a)).length, 0, "AC-11: chạy lại không mở thẻ mới");

    // «Bỏ»: cả hai rejected, ô giữ trống, chạy lại không đẩy lại.
    const b = await conflictOffer(c, 1);
    const llmB = llmFrom(CONFLICT.cases[1]);
    const rb = await run(c, [b], llmWith(llmB), resolveOldLand);
    await c.query(`SELECT decide_enrichment_review($1, 'rejected', 'hitl:test')`, [rb.reviewIds[0]]);
    await c.query(`UPDATE review_queue SET status='rejected' WHERE id=$1`, [rb.reviewIds[0]]);
    assert.deepEqual((await ptypeProposals(c, b)).map((p) => p.status), ["rejected", "rejected"]);
    assert.equal((await offerRow(c, b)).property_type, "unknown");
    const nB = (await proposals(c, b)).length;
    await run(c, [b], llmWith(llmB), resolveOldLand);
    assert.equal((await proposals(c, b)).length, nB, "AC-11: «Bỏ» rồi chạy lại không đẩy lại");
    assert.equal((await offerRow(c, b)).property_type, "unknown");
  });
});

test("AC-11 chiều đỏ: duyệt thẻ xung đột không chọn thì áp nhầm luật", async () => {
  // Vì sao route PHẢI chặn khi thiếu choices: decide 'approved' thẳng áp theo thứ tự id → E1 thắng.
  await withTx(async (c) => {
    const a = await conflictOffer(c, 0);
    const r = await run(c, [a], llmWith(llmFrom(CONFLICT.cases[0])), resolveOldLand);
    await c.query(`SELECT decide_enrichment_review($1, 'approved', 'hitl:test')`, [r.reviewIds[0]]);
    assert.equal((await offerRow(c, a)).property_type, "land", "AC-11 duyệt không chọn áp nhầm E1");
    assert.deepEqual((await ptypeProposals(c, a)).map((p) => p.status), ["applied", "skipped"]);
  });
});

test("AC-6 để sau: lượt backlog sau luôn mở lại thẻ, kể cả tin ngoài bộ lọc thiếu field", async () => {
  // S4-r3 t6: tin đã đủ loại/đường/WC, chỉ còn đề xuất phòng ngủ → không nằm trong bộ lọc backlog;
  // thẻ bị hoãn phải được lượt sau (không chỉ định offerIds) mở lại, không tuỳ random().
  await withTx(async (c) => {
    const a = await offerWithPost(c, { property_type: "apartment" });
    await c.query(`UPDATE sale_offers SET street_raw = 'Xuân La', bathrooms = 1, source = 'S05' WHERE offer_id = $1`, [a]);
    const r1 = await run(c, [a], llmWith({ ...real(0), street: undefined }), resolveWith());
    assert.equal(r1.reviewIds.length, 1);
    await c.query(`SELECT decide_enrichment_review($1, 'deferred', 'hitl:test')`, [r1.reviewIds[0]]);
    await c.query(`UPDATE review_queue SET status='deferred' WHERE id=$1`, [r1.reviewIds[0]]);
    // Khoanh lượt backlog vào tin của ca: DB :5433 dùng chung có thể có sẵn tin «hoãn» khác (đề xuất chờ, thẻ không
    // còn pending) — cùng hạng deferred_first, random() bốc nhầm khi limit 1. Trong giao dịch (rollback cuối ca) đẩy
    // các đề xuất ấy khỏi hàng; lượt dưới vẫn KHÔNG chỉ định offerIds, đúng điều AC-6 đo.
    await c.query(
      `UPDATE enrichment_proposals SET status = 'skipped' WHERE status = 'queued' AND route = 'review' AND offer_id <> $1`,
      [a],
    );
    // Kiểm đúng điều bước khoanh làm ra (không chép luật xếp hàng của selectOffers): mọi đề xuất chờ duyệt còn lại là của tin ca.
    const khac = await c.query(
      `SELECT count(*)::int AS n FROM enrichment_proposals WHERE status = 'queued' AND route = 'review' AND offer_id <> $1`,
      [a],
    );
    assert.equal(khac.rows[0].n, 0, "còn đề xuất chờ duyệt của tin khác — lượt backlog chưa được khoanh");

    await runEnrich({
      client: c, runId: "test-ac6-backlog", dry: false, limit: 1,
      llm: llmWith(null), resolve: resolveWith(), buildings: [],
    });
    const cards = await pendingCards(c, a);
    assert.equal(cards.length, 1, "AC-6 để sau không mở lại thẻ");
    assert.ok(
      (await proposals(c, a)).every((p) => p.status === "queued" && Number(p.review_id) === Number(cards[0].id)),
    );
  });
});
