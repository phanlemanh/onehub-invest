import { Hono } from "hono";

/**
 * GET /v1/asset-stats — đã đổi tên thành /v1/price-stats (PB2 AC-11). Trả 410 cho mọi lời gọi, không truy vấn.
 */
export const ASSET_STATS_GONE = "/v1/asset-stats đã đổi tên thành /v1/price-stats";
export const assetStatsRoute = new Hono();
assetStatsRoute.all("*", (c) => c.json({ error: { code: "GONE", message: ASSET_STATS_GONE } }, 410));
