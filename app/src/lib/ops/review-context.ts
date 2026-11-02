import { pool } from "@/lib/db";

import { chonNguoiNeo, docCanCu, type BenGhepCan, type BenNguoi, type CanCuTin, type NguoiDang } from "./review-can-cu";

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
 * thiếu khoá `ben` (dựng tay, đời trước) là «không biết», người đọc dùng `evidence`. `nguoiDang` chỉ có ở tin của thẻ ghép
 * căn (HD7): `null` = rời kho, thiếu khoá = thẻ không có hàng Người đăng.
 */
export type OfferContext = { toanVan: string | null; nhom: string | null; canCu: CanCuTin; ben?: BenGhepCan | null; nguoiDang?: BenNguoi };

/** Thẻ ghép căn: Tin A/Tin B; thẻ bổ sung tin: tin được bổ sung. Cùng khoá với `ReviewMedia`. */
export type ReviewContext = { offer_a?: OfferContext; offer_b?: OfferContext; offer?: OfferContext };

export type ReviewContextItem = { id: number; item_type: string; evidence: unknown };

type Row = {
  offer_id: string;
  field_provenance: unknown;
  toan_van: string | null;
  nhom: string | null;
  source: string;
  seller_name: string | null;
  seller_phone: string | null;
  seller_ref: string | null;
} & Record<(typeof COT_SO)[number] | (typeof COT_CHU)[number], unknown>;
type NguoiRow = {
  offer_id: string;
  party_key: string;
  evidence_tier: string;
  method: string;
  ten: string | null;
  sdts: string[];
  tai_khoan: string[];
  so_tin: string | number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hai truy vấn hai dạng dòng; pg trả `any[]` như nhau
export type ContextQuery = (text: string, values: unknown[]) => Promise<{ rows: any[] }>;

/**
 * Tin có `post_ids` (S03, S05 — bài nằm ở `stg_zalo_posts`): bài mới nhất theo `post_ids`; S06: `payload->>'body'` của
 * lượt thu mới nhất theo `originating_system_key` (= `list_id`). Nguồn khác chưa có bài gốc ở máy thu → toan_van NULL.
 * Tên nhóm chỉ lấy cho S03 (tầng C, AGENTS.md luật 6); nhóm của nguồn khác không hiện.
 */
export const CONTEXT_SQL = `
  SELECT o.offer_id, o.field_provenance, o.source, o.seller_name, o.seller_phone, o.seller_ref,
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

/**
 * Người đăng của các tin thẻ ghép căn (HD7): đọc lúc mở thẻ, không ghi gì. `so_tin` = số tin khác nhau còn trong kho của
 * người đó, vai còn sống (`/ops/people` đếm cả tin đã rời kho — trang này nói «đang rao» nên phải đếm tin sống).
 */
export const NGUOI_SQL = `
  WITH vai AS (
    SELECT o.offer_id, r.party_key, r.evidence_tier, r.method
    FROM sale_offers o
    JOIN party_roles r ON r.subject_key = o.source || ':' || o.originating_system_key
    WHERE o.offer_id = ANY ($1::text[]) AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL
  ), dem AS (
    SELECT r.party_key, count(DISTINCT r.subject_key) AS so_tin
    FROM party_roles r
    JOIN sale_offers o ON r.subject_key = o.source || ':' || o.originating_system_key
    WHERE r.party_key IN (SELECT party_key FROM vai) AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL
    GROUP BY r.party_key
  )
  SELECT v.offer_id, v.party_key, v.evidence_tier, v.method, COALESCE(d.so_tin, 0) AS so_tin,
         (SELECT a.value FROM registry_aliases a
          WHERE a.object_key = v.party_key AND a.kind = 'ten' AND a.retired_at IS NULL AND lower(btrim(a.value)) <> 'unknown'
          ORDER BY a.first_seen DESC, a.value LIMIT 1) AS ten,
         ARRAY(SELECT a.value FROM registry_aliases a
               WHERE a.object_key = v.party_key AND a.kind = 'sdt' AND a.retired_at IS NULL ORDER BY a.value) AS sdts,
         ARRAY(SELECT a.value FROM registry_aliases a
               WHERE a.object_key = v.party_key AND a.kind = 'tai_khoan_nguon' AND a.retired_at IS NULL ORDER BY a.value) AS tai_khoan
  FROM vai v LEFT JOIN dem d USING (party_key)`;

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

const defaultQuery: ContextQuery = (text, values) => pool.query(text, values);

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
/** Tên trên tin: S05 ghi chữ «unknown» khi nguồn không có tên — không phải một tên. */
const tenTin = (v: string | null) => (rong(v)?.trim().toLowerCase() === "unknown" ? null : rong(v));

function nguoiCuaTin(r: NguoiRow): NguoiDang {
  return {
    partyKey: r.party_key,
    ten: r.ten,
    sdts: r.sdts,
    taiKhoan: r.tai_khoan,
    soTin: Number(r.so_tin),
    canCu: docCanCu({ vai: { tier: r.evidence_tier, method: r.method } }).vai,
  };
}

/** Ngữ cảnh từng thẻ, khoá theo `review_queue.id`. Tin không còn trong `sale_offers` → không toàn văn, không căn cứ, `ben: null`. */
export async function loadReviewContext(
  items: ReviewContextItem[],
  query: ContextQuery = defaultQuery,
): Promise<Record<number, ReviewContext>> {
  const plan = items.map((item) => ({ id: item.id, sides: sidesOf(item) })).filter((p) => p.sides.length > 0);
  if (plan.length === 0) return {};
  const offerIds = [...new Set(plan.flatMap((p) => p.sides.map((s) => s.offerId)))];
  const { rows } = await query(CONTEXT_SQL, [offerIds]);
  const byOffer = new Map((rows as Row[]).map((r) => [r.offer_id, r]));

  const oGhepCan = [
    ...new Set(plan.flatMap((p) => p.sides.filter((s) => s.key !== "offer").map((s) => s.offerId))),
  ].filter((id) => byOffer.has(id));
  const nguoiTheoTin = new Map<string, NguoiDang[]>();
  if (oGhepCan.length > 0) {
    for (const r of (await query(NGUOI_SQL, [oGhepCan])).rows as NguoiRow[]) {
      nguoiTheoTin.set(r.offer_id, [...(nguoiTheoTin.get(r.offer_id) ?? []), nguoiCuaTin(r)]);
    }
  }

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
        ...(s.key === "offer" || !r
          ? {}
          : {
              nguoiDang: {
                source: r.source,
                ten: tenTin(r.seller_name),
                sdt: rong(r.seller_phone),
                ds: chonNguoiNeo(nguoiTheoTin.get(s.offerId) ?? [], r.seller_ref),
              },
            }),
      };
    }
    out[id] = ctx;
  }
  return out;
}
