import { Hono } from "hono";
import { pool } from "../db/client.js";

export const listingsRoute = new Hono();

/**
 * GET /v1/listings — danh sách listings với filter
 * Query: ?market=<id>&area=<id>&bedrooms=2&limit=50&offset=0
 */
listingsRoute.get("/", async (c) => {
  const market = c.req.query("market");
  const area = c.req.query("area");
  const bedrooms = c.req.query("bedrooms");
  const limit = Math.min(200, Number(c.req.query("limit") ?? 50) || 50);
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);

  const params: unknown[] = [];
  const conditions: string[] = ["l.id IS NOT NULL"];

  if (area) {
    params.push(area);
    conditions.push(`(l.area_id = $${params.length} OR a.parent_id = $${params.length})`);
  } else if (market) {
    params.push(market);
    conditions.push(`(a.id = $${params.length} OR a.parent_id = $${params.length} OR a.parent_id = (SELECT id FROM areas WHERE id = $${params.length}))`);
  }
  if (bedrooms) {
    params.push(Number(bedrooms));
    conditions.push(`l.bedrooms = $${params.length}`);
  }

  params.push(limit, offset);
  const query = `
    SELECT l.id, l.name, l.room_type, l.bedrooms, l.price_listed,
           l.latitude, l.longitude, l.photo_urls, l.review_count,
           a.id AS area_id, a.name AS area_name,
           p.id AS market_id, p.name AS market_name,
           ls.occupancy, ls.revenue
    FROM listings l
    LEFT JOIN areas a ON a.id = l.area_id
    LEFT JOIN areas p ON p.id = a.parent_id
    LEFT JOIN LATERAL (
      SELECT round(avg(CASE WHEN available THEN 0 ELSE 1 END::numeric) * 100, 1) AS occupancy,
             round(sum(CASE WHEN available THEN 0 ELSE price END)::numeric / nullif(count(*) FILTER (WHERE NOT available), 0)) AS revenue
      FROM nights WHERE listing_id = l.id
    ) ls ON TRUE
    WHERE ${conditions.join(" AND ")}
    ORDER BY l.name
    LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(query, params);

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      roomType: r.room_type,
      bedrooms: r.bedrooms,
      priceListed: r.price_listed === null ? null : Number(r.price_listed),
      lat: r.latitude === null ? null : Number(r.latitude),
      lng: r.longitude === null ? null : Number(r.longitude),
      photoUrls: r.photo_urls ?? null,
      reviewCount: r.review_count ?? null,
      area: { id: r.area_id, name: r.area_name },
      market: { id: r.market_id, name: r.market_name },
      stats: {
        occupancy: r.occupancy === null ? null : Number(r.occupancy),
        revenue: r.revenue === null ? null : Number(r.revenue),
      },
    })),
    meta: { total: rows.length, limit, offset },
  });
});

/**
 * GET /v1/listings/:id — chi tiết 1 listing
 */
listingsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { rows } = await pool.query(
    `SELECT l.*, l.last_seen::text AS last_seen_text,
            a.name AS area_name, a.id AS area_id, a.region_type AS area_type,
            p.id AS parent_id, p.name AS parent_name,
            al.photo_urls AS airdna_photos, al.listing_url
     FROM listings l
     LEFT JOIN areas a ON a.id = l.area_id
     LEFT JOIN areas p ON p.id = a.parent_id
     LEFT JOIN airdna_listings al ON al.id = l.id
     WHERE l.id = $1`,
    [id],
  );

  const r = rows[0];
  if (!r) {
    return c.json({ error: { code: "NOT_FOUND", message: `Listing "${id}" not found` } }, 404);
  }

  // Photos: prefer self-collected, fallback to calibration
  const photoUrls = Array.isArray(r.photo_urls) && r.photo_urls.length > 0
    ? r.photo_urls
    : r.airdna_photos ?? null;
  const photoSource = Array.isArray(r.photo_urls) && r.photo_urls.length > 0
    ? "self"
    : r.airdna_photos ? "calibration" : null;

  return c.json({
    data: {
      id: r.id,
      name: r.name,
      roomType: r.room_type,
      propertyType: r.property_type,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms === null ? null : Number(r.bathrooms),
      accommodates: r.accommodates,
      minimumNights: r.minimum_nights,
      priceListed: r.price_listed === null ? null : Number(r.price_listed),
      lat: r.latitude === null ? null : Number(r.latitude),
      lng: r.longitude === null ? null : Number(r.longitude),
      area: { id: r.area_id, name: r.area_name, type: r.area_type },
      market: { id: r.parent_id, name: r.parent_name },
      photos: { urls: photoUrls, source: photoSource },
      listingUrl: r.listing_url ?? null,
      reviewCount: r.review_count ?? null,
      lastSeen: r.last_seen_text,
    },
  });
});
