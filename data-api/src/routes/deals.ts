import { Hono } from "hono";
import { pool } from "../db/client.js";
import { giaiMaKhuVuc } from "../lib/ma-thi-truong.js";

export const dealsRoute = new Hono();

/**
 * GET /v1/deals — căn giá tốt (price/m² thấp hơn trung vị cùng phường × loại hình).
 * Thước = view v_ruler_p2 (một căn một phiếu, chỉ tin bán, n≥5); tin chưa rõ loại hình không có thước nên không vào danh sách,
 * và không lùi về thước cả phường (hồ sơ can-gia-tot-cung-loai, Hỏi-1 và Hỏi-2).
 * Query: ?area=<area_id>&market=<market_id>&limit=30&min_discount=5
 */
dealsRoute.get("/", async (c) => {
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const rawArea = c.req.query("area");
  const rawMarket = c.req.query("market");
  const area = rawArea ? await giaiMaKhuVuc(rawArea) : undefined;
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : undefined;
  const limit = Math.min(100, Number(c.req.query("limit") ?? 30) || 30);
  const minDiscount = Math.max(0, Math.min(50, Number(c.req.query("min_discount") ?? 5) || 5));

  let where = `o.kind = 'sale' AND o.price_perm2 > 0 AND o.area_id IS NOT NULL
    AND s.median_perm2 > 0
    AND o.property_type IS NOT NULL AND o.property_type <> 'unknown'
    AND o.last_seen >= now() - interval '45 days'
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) >= ${minDiscount}
    AND ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) <= 50`;

  const params: unknown[] = [];
  if (area) {
    params.push(area);
    where += ` AND o.area_id = $${params.length}`;
  } else if (market) {
    params.push(market);
    where += ` AND (a.id = $${params.length} OR a.parent_id = $${params.length})`;
  }
  params.push(limit);

  const { rows } = await pool.query(
    `SELECT o.offer_id, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
            o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
            o.area_id, a.name AS phuong, a.parent_id AS market_id, o.property_type,
            s.median_perm2,
            ROUND((1 - o.price_perm2::numeric / s.median_perm2) * 100, 1) AS discount_pct,
            z.sender_name, z.group_name, z.media->0->>'path' AS media_path,
            left(z.text, 200) AS post_text
     FROM sale_offers o
     LEFT JOIN areas a ON a.id = o.area_id
     JOIN (SELECT area_id, property_type, m::numeric AS median_perm2 FROM v_ruler_p2
            WHERE property_type IS NOT NULL AND property_type <> 'unknown') s
       ON s.area_id = o.area_id AND s.property_type = o.property_type
     LEFT JOIN LATERAL (
       SELECT sender_name, group_name, media, text
       FROM stg_zalo_posts z WHERE z.post_id = ANY(o.post_ids)
       ORDER BY z.captured_at DESC LIMIT 1
     ) z ON TRUE
     WHERE ${where}
     ORDER BY discount_pct DESC
     LIMIT $${params.length}`,
    params,
  );

  return c.json({
    data: rows.map((r) => ({
      offerId: r.offer_id,
      priceVnd: r.price_vnd === null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 === null ? null : Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
      bedrooms: r.bedrooms,
      phuong: r.phuong,
      marketId: r.market_id,
      propertyType: r.property_type,
      medianPerm2: r.median_perm2 === null ? null : Number(r.median_perm2),
      discountPct: r.discount_pct === null ? null : Number(r.discount_pct),
      confidence: r.confidence,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      nReposts: r.n_reposts,
      // Contact info — only available if stg data exists
      contact: r.sender_name ? {
        senderName: r.sender_name,
        groupName: r.group_name,
        mediaPath: r.media_path,
      } : null,
      postText: r.post_text,
    })),
    meta: { total: rows.length, minDiscount },
  });
});
