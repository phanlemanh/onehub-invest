// run.ts — một lượt enrichment qua ĐỀ XUẤT (spec 2026-10-22-enrich-qua-de-xuat §3).
// E1 (luật) + E2 (LLM) → routeFields → INSERT enrichment_proposals →
//   direct/corroborated: apply_enrichment (hàm SQL duy nhất ghi sale_offers/properties)
//   review: thẻ /ops/review agent_output enrich:<offer_id> (người quyết)
//   superseded: lưu, không làm gì
// File này KHÔNG có câu UPDATE sale_offers/properties nào (AC-1).
import type pg from "pg";

import type { ContextResult } from "../agents/context-resolver.js";
import { needsLLM, type EnrichResult } from "../agents/enrich-text.js";
import { llmFieldsFromEnrich, routeFields, summarizeRun, type BuildingNode, type Routed } from "./route.js";

export type LlmFn = (
  text: string,
  ctx: ContextResult,
) => Promise<{ result: EnrichResult | null; model: string; tracePath: string | null }>;
export type ResolveFn = (groupName: string | null, text: string) => Promise<ContextResult>;

export type RunEnrichOpts = {
  client: pg.Client;
  runId: string;
  dry: boolean;
  limit: number;
  /** Giới hạn tập offer (test dùng); vắng → backlog offer S03/S05 còn thiếu field. */
  offerIds?: string[];
  llm: LlmFn;
  resolve: ResolveFn;
  buildings?: BuildingNode[];
};

type OfferRow = {
  offer_id: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  street_raw: string | null;
  block_raw: string | null;
  text: string | null;
  group_name: string | null;
};

const OFFER_SELECT = `
  SELECT o.offer_id, o.property_type, o.bedrooms, o.bathrooms, o.street_raw, o.block_raw,
         z.text, z.group_name
  FROM sale_offers o
  LEFT JOIN LATERAL (
    SELECT left(s.text, 500) AS text, s.group_name FROM stg_zalo_posts s
    WHERE s.post_id = ANY (o.post_ids) ORDER BY s.captured_at DESC NULLS LAST LIMIT 1
  ) z ON true`;

async function selectOffers(c: pg.Client, limit: number, offerIds?: string[]): Promise<OfferRow[]> {
  if (offerIds) {
    const { rows } = await c.query(`${OFFER_SELECT} WHERE o.offer_id = ANY ($1) ORDER BY o.offer_id`, [offerIds]);
    return rows;
  }
  const { rows } = await c.query(
    `SELECT * FROM (${OFFER_SELECT}
       WHERE o.source IN ('S03','S05') AND o.kind = 'sale' AND o.confidence IN ('high','medium')
         AND (o.property_type = 'unknown' OR o.street_raw IS NULL OR o.bathrooms IS NULL)) t
     WHERE text IS NOT NULL AND length(text) > 20
     ORDER BY random() LIMIT $1`,
    [Math.max(1, limit)],
  );
  return rows;
}

async function loadBuildings(c: pg.Client): Promise<BuildingNode[]> {
  const { rows } = await c.query(`SELECT slug, name, aliases FROM asset_nodes WHERE node_type = 'building'`);
  return rows.map((r) => ({ slug: r.slug, name: r.name, aliases: r.aliases ?? [] }));
}

/**
 * Đề xuất review còn queued mà chưa nằm trên thẻ ĐANG CHỜ → gắn vào thẻ chờ của offer
 * (tạo mới khi chưa có, kể cả khi thẻ cũ đã bị hoãn), rồi dựng lại evidence từ mọi đề
 * xuất queued của thẻ. Trả id thẻ chờ, hoặc null khi offer không có gì chờ duyệt.
 */
async function syncReview(
  c: pg.Client,
  o: OfferRow,
  meta: { runId: string; model: string | null; tracePath: string | null },
): Promise<number | null> {
  const itemId = `enrich:${o.offer_id}`;
  const { rows: loose } = await c.query(
    `SELECT ep.id FROM enrichment_proposals ep
     WHERE ep.offer_id = $1 AND ep.status = 'queued' AND ep.route = 'review'
       AND NOT EXISTS (SELECT 1 FROM review_queue rq WHERE rq.id = ep.review_id AND rq.status = 'pending')`,
    [o.offer_id],
  );
  const { rows: pend } = await c.query(
    `SELECT id FROM review_queue WHERE item_type = 'agent_output' AND item_id = $1 AND status = 'pending'`,
    [itemId],
  );
  let cardId: number | null = pend[0] ? Number(pend[0].id) : null;
  if (loose.length === 0 && cardId === null) return null;
  if (cardId === null) {
    const { rows } = await c.query(
      `INSERT INTO review_queue (item_type, item_id, title, ai_suggestion)
       VALUES ('agent_output', $1, $2, 'apply') RETURNING id`,
      [itemId, `Bổ sung dữ liệu: ${o.offer_id}`],
    );
    cardId = Number(rows[0].id);
  }
  if (loose.length > 0) {
    await c.query(`UPDATE enrichment_proposals SET review_id = $1 WHERE id = ANY ($2)`, [
      cardId, loose.map((r) => r.id),
    ]);
  }
  const { rows: fields } = await c.query(
    `SELECT id, field, value, confidence FROM enrichment_proposals
     WHERE review_id = $1 AND status = 'queued' ORDER BY id`,
    [cardId],
  );
  const evidence = {
    offer_id: o.offer_id,
    text: o.text ? o.text.slice(0, 300) : null,
    group_name: o.group_name,
    run_id: meta.runId,
    model: meta.model,
    trace_path: meta.tracePath,
    fields: fields.map((f) => ({
      proposal_id: Number(f.id),
      field: f.field,
      value: f.value,
      confidence: f.confidence === null ? null : Number(f.confidence),
    })),
  };
  const conf = evidence.fields.map((f) => f.confidence).filter((x): x is number => x !== null);
  await c.query(
    `UPDATE review_queue SET evidence = $2, title = $3, ai_confidence = $4 WHERE id = $1`,
    [cardId, evidence, `Bổ sung dữ liệu: ${o.offer_id} (${fields.length} trường)`, conf.length ? Math.max(...conf) : null],
  );
  return cardId;
}

export async function runEnrich(
  opts: RunEnrichOpts,
): Promise<{ routed: Routed[][]; summary: ReturnType<typeof summarizeRun>; reviewIds: number[] }> {
  const c = opts.client;
  const buildings = opts.buildings ?? (await loadBuildings(c));
  const offers = await selectOffers(c, opts.limit, opts.offerIds);
  const routed: Routed[][] = [];
  const reviewIds: number[] = [];

  for (const o of offers) {
    const text = o.text ?? "";
    const ctx = await opts.resolve(o.group_name, text);
    // --dry: chỉ E1, 0 lượt gọi model, 0 lần ghi.
    const llmRes = !opts.dry && needsLLM(ctx, text) ? await opts.llm(text, ctx) : null;
    const rs = routeFields({
      current: {
        property_type: o.property_type, bedrooms: o.bedrooms, bathrooms: o.bathrooms,
        street_raw: o.street_raw, block_raw: o.block_raw,
      },
      e1: { property_type: ctx.propertyType, block_raw: ctx.buildingHint },
      llm: llmRes?.result ? llmFieldsFromEnrich(llmRes.result) : null,
      buildings,
    });
    routed.push(rs);
    if (opts.dry) continue;

    const evidence = {
      text: text.slice(0, 300), group_name: o.group_name,
      matchedBy: ctx.matchedBy, projectSlug: ctx.projectSlug,
    };
    const applyIds: number[] = [];
    for (const r of rs) {
      const llmRow = r.source === "e2_llm";
      const { rows } = await c.query(
        `INSERT INTO enrichment_proposals
           (run_id, offer_id, field, value, value_key, source, route, corroborated_by,
            confidence, model, trace_path, evidence, status)
         VALUES ($1, $2, $3, $4, lower($4), $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (offer_id, field, value_key, source) DO NOTHING
         RETURNING id`,
        [
          opts.runId, o.offer_id, r.field, r.value, r.source, r.route, r.corroboratedBy,
          llmRow ? (llmRes?.result?.confidence ?? null) : null,
          llmRow ? (llmRes?.model ?? null) : "context-resolver",
          llmRow ? (llmRes?.tracePath ?? null) : null,
          evidence,
          r.route === "superseded" ? "superseded" : "queued",
        ],
      );
      if (rows[0] && (r.route === "direct" || r.route === "corroborated")) applyIds.push(Number(rows[0].id));
    }
    if (applyIds.length > 0) {
      await c.query(`SELECT apply_enrichment($1, $2)`, [applyIds, `enrich-run:${opts.runId}`]);
    }
    const card = await syncReview(c, o, {
      runId: opts.runId, model: llmRes?.model ?? null, tracePath: llmRes?.tracePath ?? null,
    });
    if (card !== null) reviewIds.push(card);
  }

  return { routed, summary: summarizeRun(routed), reviewIds };
}
