import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/deals — căn giá tốt (public API).
 * Query: ?market=<id>&limit=30&min_discount=5
 * Lưu ý: contact info (PII tầng A) KHÔNG trả về từ public API.
 */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const market = u.searchParams.get("market");
  const limit = Math.min(100, Number(u.searchParams.get("limit") ?? 30) || 30);
  const minDiscount = Math.max(0, Math.min(50, Number(u.searchParams.get("min_discount") ?? 5) || 5));

  const params: unknown[] = [];
  let where = `o.kind = 'sale' AND o.price_perm2 > 0 AND o.area_id IS NOT NULL
    AND s.median_perm2 > 0
    AND o.last_seen >= now() - interval '45 days'
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) >= ${minDiscount}
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) <= 50`;

  if (market) {
    params.push(market);
    where += ` AND (a.id = $${params.length} OR a.parent_id = $${params.length})`;
  }
  params.push(limit);

  const { rows } = await pool.query(
    `SELECT o.offer_id, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.confidence, o.last_seen::text,
            o.area_id, a.name AS phuong,
            s.median_perm2,
            ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) AS discount_pct
     FROM sale_offers o
     LEFT JOIN areas a ON a.id = o.area_id
     LEFT JOIN market_asset_stats s ON s.area_id = o.area_id AND s.kind = o.kind
     WHERE ${where}
     ORDER BY discount_pct DESC
     LIMIT $${params.length}`,
    params,
  );

  return NextResponse.json({
    data: rows.map((r) => ({
      offerId: r.offer_id,
      priceVnd: r.price_vnd === null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 === null ? null : Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
      bedrooms: r.bedrooms,
      phuong: r.phuong,
      medianPerm2: r.median_perm2 === null ? null : Number(r.median_perm2),
      discountPct: r.discount_pct === null ? null : Number(r.discount_pct),
      confidence: r.confidence,
      lastSeen: r.last_seen,
    })),
    meta: { total: rows.length, minDiscount },
  });
}
