// run.ts — một lượt enrichment qua ĐỀ XUẤT (spec 2026-10-22-enrich-qua-de-xuat §3).
// E1 (luật) + E2 (LLM) → routeFields → INSERT enrichment_proposals →
//   direct/corroborated: apply_enrichment (hàm SQL duy nhất ghi sale_offers/properties)
//   review: thẻ /ops/review agent_output enrich:<offer_id> (người quyết)
//   review + conflict (E1 trái LLM): cả hai lên thẻ, người chọn một bên (AC-7, AC-11)
// File này KHÔNG có câu UPDATE sale_offers/properties nào (AC-1).
// enrich-chay-sau-nap: mỗi tin hai pha — đọc + gọi LLM NGOÀI giao dịch, ghi trong giao dịch riêng của tin
// (opts.giaoDich); tin ghi hỏng lui lại một mình. Bộ đếm cộng từ những gì thật sự ghi.
import type pg from "pg";

import type { ContextResult } from "../agents/context-resolver.js";
import { needsLLM, type EnrichResult } from "../agents/enrich-text.js";
import {
  llmFieldsFromEnrich, routeFields, summarizeRun, type BuildingNode, type EnrichField, type Routed,
} from "./route.js";
import { demRong, type DemLuot } from "./tong-ket.js";

/** `loi` = tên lớp lỗi khi lời gọi ném lỗi; `result: null` mà không `loi` = câu trả lời không đọc được. */
export type LlmFn = (
  text: string,
  ctx: ContextResult,
) => Promise<{ result: EnrichResult | null; model: string; tracePath: string | null; loi?: string }>;
/** Chạy fn trong giao dịch của một tin: commit khi xong, lui lại rồi ném lại khi lỗi. */
export type GiaoDich = <T>(fn: () => Promise<T>) => Promise<T>;

/** Cửa sổ không bốc lại tin đã thử (Hỏi-3, Mạnh duyệt 30/10). */
export const CUA_SO_THU_NGAY = 30;

/**
 * Giao dịch bằng SAVEPOINT — mặc định của runEnrich. Test chạy trong withTx (BEGIN ngoài cùng): BEGIN/COMMIT lồng
 * sẽ đóng giao dịch của test và ghi thật lên DB, nên ở đó chỉ dùng SAVEPOINT. CLI tiêm bản BEGIN/COMMIT.
 */
export function giaoDichSavepoint(c: pg.Client): GiaoDich {
  return async (fn) => {
    await c.query("SAVEPOINT enrich_tin");
    try {
      const r = await fn();
      await c.query("RELEASE SAVEPOINT enrich_tin");
      return r;
    } catch (e) {
      await c.query("ROLLBACK TO SAVEPOINT enrich_tin");
      await c.query("RELEASE SAVEPOINT enrich_tin");
      throw e;
    }
  };
}
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
  /** Vắng → giaoDichSavepoint(client). */
  giaoDich?: GiaoDich;
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
  // --offers chạy đúng tin chỉ định, không xét dấu đã thử.
  if (offerIds) {
    const { rows } = await c.query(`${OFFER_SELECT} WHERE o.offer_id = ANY ($1) ORDER BY o.offer_id`, [offerIds]);
    return rows;
  }
  // Offer còn đề xuất chờ mà không nằm trên thẻ đang chờ (thẻ bị «Để sau») ĐI TRƯỚC, kể cả khi
  // offer không còn khớp bộ lọc thiếu field — không thì thẻ hoãn chỉ quay lại nhờ random() (AC-6,
  // S4-r3). Phần còn lại của lượt bốc ngẫu nhiên từ backlog, trừ tin đã thử trong CUA_SO_THU_NGAY ngày
  // (ops_audit enrich:thu) — không thì tin LLM không tìm ra trường bị bốc lại mỗi đêm (AC-9).
  const { rows } = await c.query(
    `WITH loose AS (
       SELECT DISTINCT ep.offer_id FROM enrichment_proposals ep
       WHERE ep.status = 'queued' AND ep.route = 'review'
         AND NOT EXISTS (SELECT 1 FROM review_queue rq WHERE rq.id = ep.review_id AND rq.status = 'pending')
     )
     SELECT * FROM (
       SELECT t.*, (t.offer_id IN (SELECT offer_id FROM loose)) AS deferred_first FROM (${OFFER_SELECT}
         WHERE o.offer_id IN (SELECT offer_id FROM loose)
            OR (o.source IN ('S03','S05') AND o.kind = 'sale' AND o.confidence IN ('high','medium')
                AND (o.property_type = 'unknown' OR o.street_raw IS NULL OR o.bathrooms IS NULL)
                AND NOT EXISTS (
                  SELECT 1 FROM ops_audit a
                  WHERE a.action = 'enrich:thu' AND a.detail->>'offer_id' = o.offer_id
                    AND a.at > now() - make_interval(days => $2)))) t
       WHERE t.text IS NOT NULL AND length(t.text) > 20
     ) s
     ORDER BY deferred_first DESC, random() LIMIT $1`,
    [Math.max(1, limit), CUA_SO_THU_NGAY],
  );
  return rows;
}

async function loadBuildings(c: pg.Client): Promise<BuildingNode[]> {
  const { rows } = await c.query(`SELECT slug, name, aliases FROM asset_nodes WHERE node_type = 'building'`);
  return rows.map((r) => ({ slug: r.slug, name: r.name, aliases: r.aliases ?? [] }));
}

/**
 * Field đang xung đột chờ người: có từ hai đề xuất queued (giá trị khác nhau) cho cùng field.
 * Lượt này không được áp gì cho chúng (AC-7) — kể cả khi thẻ đã bị hoãn.
 */
async function heldFields(c: pg.Client, offerId: string): Promise<Set<EnrichField>> {
  const { rows } = await c.query(
    `SELECT field FROM enrichment_proposals
     WHERE offer_id = $1 AND status = 'queued' AND route = 'review'
     GROUP BY field HAVING count(DISTINCT value_key) > 1`,
    [offerId],
  );
  return new Set(rows.map((r) => r.field as EnrichField));
}

/** Căn cứ một bên cho người duyệt — E1: luật đã khớp; LLM: model · độ tự tin · trace. */
function basisOf(
  r: Routed,
  ctx: ContextResult,
  llm: { model: string; confidence: number | null; tracePath: string | null } | null,
): string | null {
  if (r.source === "e1_rule") {
    if (r.field === "property_type") return ctx.typeBasis ?? "luật E1";
    if (r.field === "block_raw") return ctx.buildingBasis ?? "luật E1";
    return "luật E1";
  }
  if (!llm) return null;
  const parts = [`LLM ${llm.model}`];
  if (llm.confidence !== null) parts.push(`tự tin ${Math.round(llm.confidence * 100)}%`);
  if (llm.tracePath) parts.push(`trace ${llm.tracePath.split("/").pop()}`);
  return parts.join(" · ");
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
    `SELECT id, field, value, confidence, source, evidence->>'basis' AS basis,
            count(*) OVER (PARTITION BY field) > 1 AS conflict
     FROM enrichment_proposals
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
    // Field có từ hai đề xuất chờ = xung đột E1/LLM: thẻ cho người chọn một bên (AC-11).
    // Dựng lại từ bảng mỗi lượt nên thẻ mới sau «Để sau» vẫn giữ dấu xung đột.
    fields: fields.map((f) => ({
      proposal_id: Number(f.id),
      field: f.field,
      value: f.value,
      confidence: f.confidence === null ? null : Number(f.confidence),
      source: f.source,
      basis: f.basis ?? null,
      ...(f.conflict ? { conflict: true as const } : {}),
    })),
  };
  const conf = evidence.fields.map((f) => f.confidence).filter((x): x is number => x !== null);
  await c.query(
    `UPDATE review_queue SET evidence = $2, title = $3, ai_confidence = $4 WHERE id = $1`,
    [cardId, evidence, `Bổ sung dữ liệu: ${o.offer_id} (${fields.length} trường)`, conf.length ? Math.max(...conf) : null],
  );
  return cardId;
}

export async function runEnrich(opts: RunEnrichOpts): Promise<{
  routed: Routed[][];
  summary: ReturnType<typeof summarizeRun>;
  reviewIds: number[];
  dem: DemLuot;
}> {
  const c = opts.client;
  const giaoDich = opts.giaoDich ?? giaoDichSavepoint(c);
  const buildings = opts.buildings ?? (await loadBuildings(c));
  const offers = await selectOffers(c, opts.limit, opts.offerIds);
  const routed: Routed[][] = [];
  const reviewIds: number[] = [];
  const dem = demRong();
  dem.tin = offers.length;

  for (const o of offers) {
    // Pha đọc — ngoài giao dịch: không giữ khoá dòng nào trong lúc chờ LLM (AC-1).
    const text = o.text ?? "";
    const ctx = await opts.resolve(o.group_name, text);
    // --dry: chỉ E1, 0 lượt gọi model, 0 lần ghi.
    const canLLM = !opts.dry && needsLLM(ctx, text);
    const llmRes = canLLM ? await opts.llm(text, ctx) : null;
    if (llmRes) {
      dem.llmGoi++;
      if (llmRes.loi) dem.llmLoi++;
      else if (!llmRes.result) dem.llmKhongDoc++;
    }
    const held = await heldFields(c, o.offer_id);
    const rs = routeFields({
      current: {
        property_type: o.property_type, bedrooms: o.bedrooms, bathrooms: o.bathrooms,
        street_raw: o.street_raw, block_raw: o.block_raw,
      },
      e1: { property_type: ctx.propertyType, block_raw: ctx.buildingHint },
      llm: llmRes?.result ? llmFieldsFromEnrich(llmRes.result) : null,
      buildings,
      held,
    });
    routed.push(rs);
    if (opts.dry) continue;

    const evidence = {
      text: text.slice(0, 300), group_name: o.group_name,
      matchedBy: ctx.matchedBy, projectSlug: ctx.projectSlug,
    };
    const llmMeta = llmRes?.result
      ? { model: llmRes.model, confidence: llmRes.result.confidence ?? null, tracePath: llmRes.tracePath }
      : null;

    // Pha ghi — một giao dịch của tin. Bộ đếm của tin chỉ cộng vào lượt khi giao dịch xong.
    const ghi = async () => {
      const t = { deXuatMoi: 0, daAp: 0, choDuyet: 0, card: null as number | null };
      const applyIds: number[] = [];
      for (const r of rs) {
        const llmRow = r.source === "e2_llm";
        const status = r.route === "superseded" ? "superseded" : "queued";
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
            { ...evidence, basis: basisOf(r, ctx, llmMeta) },
            status,
          ],
        );
        if (!rows[0]) continue;
        t.deXuatMoi++;
        if (r.route === "direct" || r.route === "corroborated") applyIds.push(Number(rows[0].id));
        else if (r.route === "review" && status === "queued") t.choDuyet++;
      }
      if (applyIds.length > 0) {
        const { rows } = await c.query(`SELECT apply_enrichment($1, $2) AS n`, [applyIds, `enrich-run:${opts.runId}`]);
        t.daAp = Number(rows[0].n ?? 0);
      }
      t.card = await syncReview(c, o, {
        runId: opts.runId, model: llmRes?.model ?? null, tracePath: llmRes?.tracePath ?? null,
      });
      // Dấu đã thử (AC-9) — trừ khi lời gọi LLM ném lỗi: đêm sau LLM sống lại thì thử tiếp.
      if (!llmRes?.loi) {
        await c.query(
          `INSERT INTO ops_audit (actor, action, detail) VALUES ($1, 'enrich:thu', $2)`,
          [`enrich-run:${opts.runId}`, { offer_id: o.offer_id, run_id: opts.runId }],
        );
      }
      return t;
    };

    try {
      const t = await giaoDich(ghi);
      dem.deXuatMoi += t.deXuatMoi;
      dem.daAp += t.daAp;
      dem.choDuyet += t.choDuyet;
      if (t.card !== null) reviewIds.push(t.card);
    } catch (e) {
      const err = e as { code?: string; name?: string };
      dem.loiGhi.push({ offer_id: o.offer_id, loi: err.code ?? err.name ?? "Error" });
    }
  }

  dem.the = new Set(reviewIds).size;
  return { routed, summary: summarizeRun(routed), reviewIds, dem };
}
