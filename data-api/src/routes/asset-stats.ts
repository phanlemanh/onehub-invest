import { Hono } from "hono";
import { pool } from "../db/client.js";
import { giaiMaKhuVuc } from "../lib/ma-thi-truong.js";

export const assetStatsRoute = new Hono();

/**
 * GET /v1/asset-stats — thống kê giá/phường
 * Query: ?area=<area_id> (bắt buộc) | ?market=<market_id> (tất cả phường con)
 */
assetStatsRoute.get("/", async (c) => {
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const rawArea = c.req.query("area");
  const rawMarket = c.req.query("market");
  const area = rawArea ? await giaiMaKhuVuc(rawArea) : undefined;
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : undefined;

  if (!area && !market) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Cần ?area=<id> hoặc ?market=<id>" } },
      400,
    );
  }

  let query: string;
  const params: unknown[] = [];

  if (area) {
    params.push(area);
    query = `SELECT s.area_id, a.name AS area_name,
                    s.kind, s.n_offers,
                    round(s.median_price::numeric)::bigint AS median_price,
                    round(s.p25_price::numeric)::bigint AS p25_price,
                    round(s.p75_price::numeric)::bigint AS p75_price,
                    round(s.median_perm2::numeric)::bigint AS median_perm2,
                    round(s.median_rent::numeric)::bigint AS median_rent
             FROM market_asset_stats s
             LEFT JOIN areas a ON a.id = s.area_id
             WHERE s.area_id = $1`;
  } else {
    params.push(market);
    query = `SELECT s.area_id, a.name AS area_name,
                    s.kind, s.n_offers,
                    round(s.median_price::numeric)::bigint AS median_price,
                    round(s.p25_price::numeric)::bigint AS p25_price,
                    round(s.p75_price::numeric)::bigint AS p75_price,
                    round(s.median_perm2::numeric)::bigint AS median_perm2,
                    round(s.median_rent::numeric)::bigint AS median_rent
             FROM market_asset_stats s
             LEFT JOIN areas a ON a.id = s.area_id
             WHERE a.parent_id = $1 OR a.id = $1
             ORDER BY a.name`;
  }

  const { rows } = await pool.query(query, params);
  if (rows.length === 0) {
    return c.json(
      { error: { code: "NOT_FOUND", message: `Không có stats cho "${area ?? market}"` } },
      404,
    );
  }

  return c.json({
    data: rows.map((r) => ({
      areaId: r.area_id,
      areaName: r.area_name,
      kind: r.kind,
      nOffers: r.n_offers,
      medianPrice: r.median_price === null ? null : Number(r.median_price),
      p25Price: r.p25_price === null ? null : Number(r.p25_price),
      p75Price: r.p75_price === null ? null : Number(r.p75_price),
      medianPerm2: r.median_perm2 === null ? null : Number(r.median_perm2),
      medianRent: r.median_rent === null ? null : Number(r.median_rent),
    })),
  });
});
