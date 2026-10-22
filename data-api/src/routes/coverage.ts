import { Hono } from "hono";
import { pool } from "../db/client.js";

export const coverageRoute = new Hono();

/**
 * GET /v1/coverage — độ phủ dữ liệu theo market
 */
coverageRoute.get("/", async (c) => {
  const { rows } = await pool.query(
    `SELECT a.id AS area_id, a.name,
            (SELECT count(*)::int FROM listings l
             JOIN areas sa ON sa.id = l.area_id
             WHERE coalesce(sa.parent_id, sa.id) = a.id) AS our_listings,
            lc.value AS calibration_active,
            lc.period AS calibration_period,
            (SELECT count(*)::int FROM airdna_listings al
             WHERE al.airdna_market_id = ANY(ARRAY(
               SELECT x.source_area_key FROM area_sources x
               WHERE x.area_id = a.id AND x.source = 'S02'
             ))) AS calibration_universe,
            (SELECT count(DISTINCT period)::int FROM airdna_market_metrics mm
             WHERE mm.airdna_id = ANY(ARRAY(
               SELECT x.source_area_key FROM area_sources x
               WHERE x.area_id = a.id AND x.source = 'S02'
             ))) AS history_months
     FROM areas a
     JOIN LATERAL (
       SELECT m.value, m.period FROM airdna_market_metrics m
       WHERE m.metric = 'listing_count'
         AND m.airdna_id = ANY(ARRAY(
           SELECT x.source_area_key FROM area_sources x
           WHERE x.area_id = a.id AND x.source = 'S02'
         ))
       ORDER BY m.period DESC LIMIT 1
     ) lc ON TRUE
     WHERE a.region_type = 'market' AND a.country_code = 'vn'
     ORDER BY a.name`,
  );

  return c.json({
    data: rows.map((r) => {
      const active = r.calibration_active ? Number(r.calibration_active) : 0;
      const our = r.our_listings ?? 0;
      return {
        areaId: r.area_id,
        name: r.name,
        ourListings: our,
        calibrationActive: active,
        calibrationPeriod: r.calibration_period,
        calibrationUniverse: r.calibration_universe,
        historyMonths: r.history_months,
        coverageRatio: active > 0 ? Number((our / active).toFixed(4)) : null,
      };
    }),
    meta: { total: rows.length },
  });
});
