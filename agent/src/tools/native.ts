// native.ts — tool nội bộ đọc DB trực tiếp (nhanh, PII-safe local).
// Judge-entity dùng queryPair để lấy dữ liệu 2 offers.
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

export type PairData = {
  a: {
    offerId: string;
    source: string;
    kind: string;
    priceVnd: number | null;
    areaM2: number | null;
    pricePerm2: number | null;
    bedrooms: number | null;
    phuong: string | null;
    propertyType: string | null;
    text: string | null; // P1 raw text
    sellerName: string | null;
    street: string | null; // street_raw (migration 030) — bốn trường của bảng so thẻ ghép căn
    block: string | null;
    floor: string | null;
    bathrooms: number | null;
  };
  b: {
    offerId: string;
    source: string;
    kind: string;
    priceVnd: number | null;
    areaM2: number | null;
    pricePerm2: number | null;
    bedrooms: number | null;
    phuong: string | null;
    propertyType: string | null;
    subject: string | null; // P2 title
    sellerName: string | null;
    street: string | null;
    block: string | null;
    floor: string | null;
    bathrooms: number | null;
  };
  score: number;
  signals: Record<string, unknown>;
};

/** Đọc cặp tin từ kho. `client` đã mở (test trên DB thử) thì dùng nó và không đóng; vắng thì tự mở kết nối như cũ. */
export async function queryPair(offerA: string, offerB: string, client?: pg.Client): Promise<PairData | null> {
  const c = client ?? new pg.Client({ connectionString: DB_URL });
  if (!client) await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT o.offer_id, o.source, o.kind, o.price_vnd, o.area_m2,
              o.price_perm2, o.bedrooms, o.phuong_raw, o.property_type, o.seller_name,
              o.street_raw, o.block_raw, o.floor_raw, o.bathrooms,
              (SELECT left(z.text, 300) FROM stg_zalo_posts z
                WHERE z.post_id = ANY(o.post_ids)
                  AND z.agent_id IS DISTINCT FROM 'apify-facebook'
                ORDER BY z.captured_at DESC LIMIT 1) AS text,
              (SELECT left(s.subject, 200) FROM stg_chotot_ads s
                WHERE 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16) = o.offer_id
                LIMIT 1) AS subject
       FROM sale_offers o WHERE o.offer_id IN ($1, $2)`,
      [offerA, offerB],
    );
    if (rows.length < 2) return null;
    const a = rows.find((r: { offer_id: string }) => r.offer_id === offerA);
    const b = rows.find((r: { offer_id: string }) => r.offer_id === offerB);
    if (!a || !b) return null;

    // score từ property_candidates
    const { rows: cand } = await c.query(
      `SELECT score, signals FROM property_candidates
       WHERE (offer_a = $1 AND offer_b = $2) OR (offer_a = $2 AND offer_b = $1)`,
      [offerA, offerB],
    );

    const n = (v: unknown) => (v === null ? null : Number(v));
    return {
      a: {
        offerId: a.offer_id, source: a.source, kind: a.kind,
        priceVnd: n(a.price_vnd), areaM2: n(a.area_m2), pricePerm2: n(a.price_perm2),
        bedrooms: a.bedrooms, phuong: a.phuong_raw, propertyType: a.property_type,
        text: a.text, sellerName: a.seller_name,
        street: a.street_raw, block: a.block_raw, floor: a.floor_raw, bathrooms: n(a.bathrooms),
      },
      b: {
        offerId: b.offer_id, source: b.source, kind: b.kind,
        priceVnd: n(b.price_vnd), areaM2: n(b.area_m2), pricePerm2: n(b.price_perm2),
        bedrooms: b.bedrooms, phuong: b.phuong_raw, propertyType: b.property_type,
        subject: b.subject, sellerName: b.seller_name,
        street: b.street_raw, block: b.block_raw, floor: b.floor_raw, bathrooms: n(b.bathrooms),
      },
      score: cand[0] ? Number(cand[0].score) : 0,
      signals: (cand[0]?.signals ?? {}) as Record<string, unknown>,
    };
  } finally {
    if (!client) await c.end();
  }
}
