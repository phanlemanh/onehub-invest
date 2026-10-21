import { Hono } from "hono";
import { pool } from "../db/client.js";

export const marketsRoute = new Hono();

/**
 * GET /v1/markets — danh sách markets + Market Score
 * Query: ?country=vn&limit=50
 */
marketsRoute.get("/", async (c) => {
  const country = c.req.query("country") ?? "vn";
  const limit = Math.min(200, Number(c.req.query("limit") ?? 50) || 50);

  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.region_type, a.country_code,
            ms.total AS market_score,
            (SELECT count(*)::int FROM listings l
             JOIN areas sa ON sa.id = l.area_id
             WHERE coalesce(sa.parent_id, sa.id) = a.id) AS listing_count
     FROM areas a
     LEFT JOIN airdna_scores ms ON ms.airdna_id = (
       SELECT x.source_area_key FROM area_sources x
       WHERE x.area_id = a.id AND x.source = 'S02' LIMIT 1
     )
     WHERE a.region_type = 'market' AND a.country_code = $1
     ORDER BY ms.total DESC NULLS LAST, a.name
     LIMIT $2`,
    [country, limit],
  );

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      countryCode: r.country_code,
      marketScore: r.market_score === null ? null : Number(r.market_score),
      listingCount: r.listing_count,
    })),
    meta: { total: rows.length, limit },
  });
});

/**
 * GET /v1/markets/:id — chi tiết market + insights
 */
marketsRoute.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { rows } = await pool.query(
    `SELECT a.id, a.name, a.region_type, a.country_code, a.meta,
            ms.total, ms.seasonality, ms.revenue_growth, ms.regulation, ms.rental_demand
     FROM areas a
     LEFT JOIN airdna_scores ms ON ms.airdna_id = (
       SELECT x.source_area_key FROM area_sources x
       WHERE x.area_id = a.id AND x.source = 'S02' LIMIT 1
     )
     WHERE a.id = $1 AND a.region_type = 'market'`,
    [id],
  );

  if (!rows[0]) {
    return c.json({ error: { code: "NOT_FOUND", message: `Market "${id}" not found` } }, 404);
  }

  const m = rows[0];
  return c.json({
    data: {
      id: m.id,
      name: m.name,
      countryCode: m.country_code,
      marketScore: m.total === null ? null : {
        total: Number(m.total),
        seasonality: Number(m.seasonality),
        revenueGrowth: Number(m.revenue_growth),
        regulation: Number(m.regulation),
        rentalDemand: Number(m.rental_demand),
      },
    },
  });
});

/**
 * GET /v1/markets/:id/submarkets — submarkets + metrics
 */
marketsRoute.get("/:id/submarkets", async (c) => {
  const id = c.req.param("id");
  const { rows } = await pool.query(
    `SELECT a.id, a.name,
            sm.meta->>'market_score' AS market_score,
            sm.meta->'metrics' AS metrics
     FROM areas a
     LEFT JOIN airdna_submarket_metrics sm ON sm.airdna_sub_id = (
       SELECT x.source_area_key FROM area_sources x
       WHERE x.area_id = a.id AND x.source = 'S02' LIMIT 1
     )
     WHERE a.parent_id = $1 AND a.region_type = 'submarket'
     ORDER BY a.name`,
    [id],
  );

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      marketScore: r.market_score ? Number(r.market_score) : null,
      metrics: r.metrics ?? null,
    })),
    meta: { total: rows.length },
  });
});

/**
 * GET /v1/markets/:id/insights — metrics theo tháng (ADR, occupancy, revenue)
 */
marketsRoute.get("/:id/insights", async (c) => {
  const id = c.req.param("id");
  const airdnaId = await pool
    .query(`SELECT source_area_key FROM area_sources WHERE area_id = $1 AND source = 'S02' LIMIT 1`, [id])
    .then((r) => r.rows[0]?.source_area_key);

  if (!airdnaId) {
    return c.json({ data: { metrics: [], timeseries: [] } });
  }

  const [metrics, timeseries] = await Promise.all([
    pool.query(
      `SELECT metric, period, value FROM airdna_market_metrics
       WHERE airdna_id = $1 AND period = (SELECT max(period) FROM airdna_market_metrics WHERE airdna_id = $1)
       ORDER BY metric`,
      [airdnaId],
    ),
    pool.query(
      `SELECT metric, period, value FROM airdna_market_metrics
       WHERE airdna_id = $1 ORDER BY metric, period`,
      [airdnaId],
    ),
  ]);

  return c.json({
    data: {
      latestMetrics: Object.fromEntries(metrics.rows.map((r) => [r.metric, Number(r.value)])),
      timeseries: timeseries.rows.reduce((acc: Record<string, { period: string; value: number }[]>, r) => {
        if (!acc[r.metric]) acc[r.metric] = [];
        acc[r.metric].push({ period: r.period, value: Number(r.value) });
        return acc;
      }, {}),
    },
  });
});
