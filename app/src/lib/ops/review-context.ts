import { pool } from "@/lib/db";

import { docCanCu, type BenGhepCan, type CanCuTin } from "./review-can-cu";

/**
 * Toàn văn + căn cứ từng trường của mọi tin trên hàng duyệt /ops/review (PL3). Một truy vấn cho cả hàng duyệt, chỉ
 * DB máy thu (`stg_*` và `field_provenance` không lên cloud — 045, sync-cloud PII_EXCLUDE). Evidence của thẻ chỉ giữ
 * 300 ký tự đầu (029, agent/src/enrich/run.ts); toàn văn đọc lại từ bảng nạp lúc mở trang, evidence cũ không sửa.
 *
 * Người gọi kiểm vai TRƯỚC (`xemNoiDungTin`) — hàm này không tự chặn vai.
 */

/**
 * Ngữ cảnh một tin: toàn văn (null khi máy thu không có bài gốc), tên nhóm S03 (tầng C), căn cứ theo trường trục, và
 * `ben` = mười trường bảng so đọc sống từ `sale_offers` (HD6). `ben: null` = tin không còn trong kho (rời kho); ngữ cảnh
 * thiếu khoá `ben` (dựng tay, đời trước) là «không biết», người đọc dùng `evidence`.
 */
export type OfferContext = { toanVan: string | null; nhom: string | null; canCu: CanCuTin; ben?: BenGhepCan | null };

/** Thẻ ghép căn: Tin A/Tin B; thẻ bổ sung tin: tin được bổ sung. Cùng khoá với `ReviewMedia`. */
export type ReviewContext = { offer_a?: OfferContext; offer_b?: OfferContext; offer?: OfferContext };

export type ReviewContextItem = { id: number; item_type: string; evidence: unknown };

type Row = {
  offer_id: string;
  field_provenance: unknown;
  toan_van: string | null;
  nhom: string | null;
} & Record<(typeof COT_SO)[number] | (typeof COT_CHU)[number], unknown>;
export type ContextQuery = (text: string, values: unknown[]) => Promise<{ rows: Row[] }>;

/**
 * Tin có `post_ids` (S03, S05 — bài nằm ở `stg_zalo_posts`): bài mới nhất theo `post_ids`; S06: `payload->>'body'` của
 * lượt thu mới nhất theo `originating_system_key` (= `list_id`). Nguồn khác chưa có bài gốc ở máy thu → toan_van NULL.
 * Tên nhóm chỉ lấy cho S03 (tầng C, AGENTS.md luật 6); nhóm của nguồn khác không hiện.
 */
export const CONTEXT_SQL = `
  SELECT o.offer_id, o.field_provenance,
         o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms, o.bathrooms,
         o.phuong_raw AS phuong, o.property_type, o.street_raw AS street, o.block_raw AS block, o.floor_raw AS floor,
         CASE WHEN o.source = 'S06' THEN c.body ELSE z.text END AS toan_van,
         CASE o.source WHEN 'S03' THEN z.group_name END AS nhom
  FROM sale_offers o
  LEFT JOIN LATERAL (
    SELECT p.text, p.group_name FROM stg_zalo_posts p
    WHERE p.post_id = ANY (o.post_ids)
    ORDER BY p.captured_at DESC NULLS LAST LIMIT 1
  ) z ON TRUE
  LEFT JOIN LATERAL (
    SELECT a.payload ->> 'body' AS body FROM stg_chotot_ads a
    WHERE o.source = 'S06' AND a.list_id::text = o.originating_system_key
    ORDER BY a.captured_at DESC NULLS LAST LIMIT 1
  ) c ON TRUE
  WHERE o.offer_id = ANY ($1::text[])`;

/** Cột số của bảng so — pg trả `numeric` dạng chuỗi, đổi về số để so với `evidence` (số JSON). */
const COT_SO = ["price_vnd", "area_m2", "price_perm2", "bedrooms", "bathrooms"] as const;
const COT_CHU = ["phuong", "property_type", "street", "block", "floor"] as const;

/** Mười trường bảng so của một dòng `sale_offers` — cùng khoá `BenGhepCan` mà thẻ gieo ghi vào `evidence`. */
function benSong(r: Row): BenGhepCan {
  const ben: Record<string, string | number | null> = {};
  for (const k of COT_SO) {
    const v = r[k];
    ben[k] = v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
  }
  for (const k of COT_CHU) ben[k] = typeof r[k] === "string" ? (r[k] as string) : null;
  return ben as BenGhepCan;
}

const defaultQuery: ContextQuery = (text, values) => pool.query<Row>(text, values);

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function sidesOf(item: ReviewContextItem): { key: keyof ReviewContext; offerId: string }[] {
  const ev = record(item.evidence);
  if (item.item_type === "entity_match") {
    return (["offer_a", "offer_b"] as const).flatMap((key) => {
      const id = record(ev[key]).offer_id;
      return typeof id === "string" ? [{ key, offerId: id }] : [];
    });
  }
  if (item.item_type === "agent_output" && typeof ev.offer_id === "string") return [{ key: "offer", offerId: ev.offer_id }];
  return [];
}

const rong = (v: string | null) => (v !== null && v.trim() !== "" ? v : null);

/** Ngữ cảnh từng thẻ, khoá theo `review_queue.id`. Tin không còn trong `sale_offers` → không toàn văn, không căn cứ, `ben: null`. */
export async function loadReviewContext(
  items: ReviewContextItem[],
  query: ContextQuery = defaultQuery,
): Promise<Record<number, ReviewContext>> {
  const plan = items.map((item) => ({ id: item.id, sides: sidesOf(item) })).filter((p) => p.sides.length > 0);
  if (plan.length === 0) return {};
  const offerIds = [...new Set(plan.flatMap((p) => p.sides.map((s) => s.offerId)))];
  const { rows } = await query(CONTEXT_SQL, [offerIds]);
  const byOffer = new Map(rows.map((r) => [r.offer_id, r]));

  const out: Record<number, ReviewContext> = {};
  for (const { id, sides } of plan) {
    const ctx: ReviewContext = {};
    for (const s of sides) {
      const r = byOffer.get(s.offerId);
      ctx[s.key] = {
        toanVan: rong(r?.toan_van ?? null),
        nhom: rong(r?.nhom ?? null),
        canCu: docCanCu(r?.field_provenance),
        ben: r ? benSong(r) : null,
      };
    }
    out[id] = ctx;
  }
  return out;
}
