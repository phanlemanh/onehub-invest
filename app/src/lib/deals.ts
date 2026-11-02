import { pool } from "./db";

/**
 * G2/P4 — Deals v2: căn giá tốt từ tín hiệu riêng P1 (Zalo S03 + Facebook
 * S05), đo bằng THƯỚC VẢI CÔNG KHAI P2 (median price/m² theo phường từ
 * Chợ Tốt S06, n≥5). Đây là hiện thực hoá "bait gap" của kiến trúc 3 tầng:
 * discount = % dưới giá rao công khai cùng phường (docs/research/
 * investment-pipeline-4-stages.md).
 *
 * Người bán trên tin rao là tầng C (ADR-0007 mục 9). Số gốc seller_phone ở lại máy thu (PII_EXCLUDE của
 * sync-cloud; ROADMAP §3 mục 24), nên bản cloud không có cột này. Broker chip join sellers registry (cũng ở máy thu).
 */
export type DealRow = {
  offerId: string;
  source: string; // 'S03' | 'S05'
  priceVnd: number | null;
  areaM2: number | null;
  pricePerm2: number | null;
  bedrooms: number | null;
  phuong: string | null;
  areaPath: string | null;
  medianPerm2: number | null; // thước P2 cùng phường
  rulerN: number | null; // số tin S06 dựng thước
  discountPct: number | null; // % dưới thước P2 — bait_gap_pct pipeline tính sẵn
  suspect: boolean; // giảm > NGHI_NGO_PCT: tin cần xác minh, đứng cuối danh sách
  confidence: string;
  firstSeen: string;
  lastSeen: string;
  nReposts: number;
  // liên hệ + broker (chỉ local)
  sellerName: string | null;
  sellerPhone: string | null;
  groupName: string | null;
  mediaPath: string | null;
  mediaUrl: string | null; // ảnh FB (CDN url) — khác path local Zalo
  postText: string | null;
  brokerNAds: number | null;
  brokerMedianGap: number | null;
};

/**
 * Bỏ trường theo vai trước khi đưa vào thẻ, để trường cấm không có mặt trong dữ liệu trang: `lienHe` = vai Vận hành trở
 * lên (Hỏi-B), `noiDung` = ảnh và chữ bài, giữ cho admin vì route ảnh `?path=` chỉ mở cho admin.
 */
export function dealTheoVai(d: DealRow, vai: { lienHe: boolean; noiDung: boolean }): DealRow {
  const lienHe = vai.lienHe ? {} : { sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null };
  const noiDung = vai.noiDung ? {} : { mediaPath: null, mediaUrl: null, postText: null };
  return { ...d, ...lienHe, ...noiDung };
}

/** Giảm hơn ngưỡng này so với thước → tin cần xác minh: vẫn hiện, đứng cuối (Mạnh chốt Hỏi-2, ON11 24/10). */
export const NGHI_NGO_PCT = 35;

/** Nguồn ảnh của thẻ: ảnh local đi qua route ảnh tin (chặn admin), ảnh CDN dùng thẳng url. */
export function dealMediaSrc(d: Pick<DealRow, "mediaPath" | "mediaUrl">): string {
  return d.mediaPath ? `/api/zalo-media?path=${encodeURIComponent(d.mediaPath)}` : (d.mediaUrl ?? "");
}

/** Nhãn số lần đăng trên thẻ — «mới» cũ thật ra nghĩa là «chưa đăng lại» (OPS-12). */
export function repostLabel(n: number | null | undefined): string {
  return `đăng ${n && n > 1 ? n : 1} lần`;
}

/**
 * Câu SQL của danh sách Căn giá tốt. Số giảm là `bait_gap_pct` pipeline đã tính sẵn (refresh-bait-gap, luật 10) —
 * tin phi lý đã bị pipeline gạt số giảm về NULL (ON11) nên không lọt vào đây. Thứ tự: tin thường trước tin cần xác
 * minh, mỗi nhóm giảm dần — sắp TRƯỚC LIMIT, không thì 30 thẻ vẫn toàn tin sát trần.
 * `cloud`: bản không đụng `stg_zalo_posts` hay cột người bán ở lại máy (sync-cloud `PII_EXCLUDE`).
 */
export function dealsSql({ cloud = false }: { cloud?: boolean } = {}): string {
  const full = `WITH ruler AS (SELECT area_id, m, n FROM v_ruler_p2_area), base AS (
       SELECT o.offer_id, o.source, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
              o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
              o.area_id, o.post_ids, o.seller_name, o.seller_phone,
              a.name AS phuong,
              r.m AS median_perm2, r.n AS ruler_n,
              o.bait_gap_pct AS discount_pct,
              o.bait_gap_pct > ${NGHI_NGO_PCT} AS suspect,
              sel.n_ads AS broker_n_ads,
              sel.flags->>'median_gap_pct' AS broker_med_gap
       FROM sale_offers o
       JOIN ruler r ON r.area_id = o.area_id
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
       WHERE o.price_tier = 'P1'
         AND o.kind = 'sale'
         AND o.bait_gap_pct IS NOT NULL
         AND o.last_seen >= now() - interval '45 days'
         AND o.bait_gap_pct >= $1
         AND o.bait_gap_pct <= 50 -- guard thước mỏng
       ORDER BY suspect, discount_pct DESC, o.offer_id
       LIMIT $2
     )
     SELECT b.*,
       z.sender_name, z.group_name,
       COALESCE(z.media->0->>'path', NULL) AS media_path,
       COALESCE(z.media->0->>'url', NULL) AS media_url,
       left(z.text, 200) AS post_text
     FROM base b
     LEFT JOIN LATERAL (
       SELECT sender_name, group_name, media, text
       FROM stg_zalo_posts z
       WHERE z.post_id = ANY(b.post_ids)
       ORDER BY z.captured_at DESC
       LIMIT 1
     ) z ON TRUE
     ORDER BY b.suspect, b.discount_pct DESC, b.offer_id`;
  if (!cloud) return full;
  return full
    .replace(/LEFT JOIN LATERAL \([\s\S]*?\) z ON TRUE/, "/* cloud: không có stg_zalo_posts (PII) */")
    .replace(/z\.sender_name, z\.group_name,[\s\S]*?AS post_text/, "NULL AS sender_name, NULL AS group_name, NULL AS media_path, NULL AS media_url, NULL AS post_text")
    // cột người bán cũng không tồn tại trên cloud sale_offers (sync loại) → NULL hoá
    .replace("o.area_id, o.post_ids, o.seller_name, o.seller_phone,", "o.area_id, o.post_ids, NULL AS seller_name, NULL AS seller_phone,");
}

type DealSqlRow = Record<string, unknown>;

/** Hàng SQL → DealRow (dùng chung cho trang và test). */
export function toDealRow(r: DealSqlRow): DealRow {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const areaId = (r.area_id as string | null) ?? null;
  return {
    offerId: r.offer_id as string,
    source: r.source as string,
    priceVnd: num(r.price_vnd),
    areaM2: num(r.area_m2),
    pricePerm2: num(r.price_perm2),
    bedrooms: (r.bedrooms as number | null) ?? null,
    phuong: (r.phuong as string | null) ?? null,
    areaPath: areaId ? `/${areaId.split("-")[0]}/${areaId.split("-").slice(1).join("-")}` : null,
    medianPerm2: num(r.median_perm2),
    rulerN: num(r.ruler_n),
    discountPct: num(r.discount_pct),
    suspect: r.suspect === true,
    confidence: r.confidence as string,
    firstSeen: r.first_seen as string,
    lastSeen: r.last_seen as string,
    nReposts: Number(r.n_reposts ?? 1),
    sellerName: (r.seller_name as string | null) ?? (r.sender_name as string | null) ?? null,
    sellerPhone: (r.seller_phone as string | null) ?? null,
    groupName: (r.group_name as string | null) ?? null,
    mediaPath: (r.media_path as string | null) ?? null,
    mediaUrl: (r.media_url as string | null) ?? null,
    postText: (r.post_text as string | null) ?? null,
    brokerNAds: num(r.broker_n_ads),
    brokerMedianGap: num(r.broker_med_gap),
  };
}

// Mã Postgres khi DB không có lược đồ riêng của máy thu: 42P01 thiếu bảng, 42703 thiếu cột.
const THIEU_LUOC_DO_MAY_THU = new Set(["42P01", "42703"]);

export async function getDeals(limit = 30, minDiscountPct = 5): Promise<DealRow[]> {
  // Cloud không có stg_zalo_posts và các cột seller_* (nơi chạy, không phải lỗi): chỉ hai mã thiếu lược đồ mới rơi về bản
  // cloud, trang tự nhiên không cột liên hệ. Lỗi khác (deadlock, khoá, mất kết nối) ở máy thu ném tiếp cho PageError có
  // Retry: nuốt nó thì trang vẫn đủ thẻ nhưng mất liên hệ và nói sai «chỉ có ở máy thu» (S4 r1 E12).
  let rows;
  try {
    ({ rows } = await pool.query(dealsSql(), [minDiscountPct, limit]));
  } catch (e) {
    if (!THIEU_LUOC_DO_MAY_THU.has((e as { code?: string }).code ?? "")) throw e;
    ({ rows } = await pool.query(dealsSql({ cloud: true }), [minDiscountPct, limit]));
  }
  return rows.map(toDealRow);
}
