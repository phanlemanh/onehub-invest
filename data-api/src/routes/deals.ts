import { Hono } from "hono";

/**
 * GET /v1/deals — đã gộp vào /v1/listings (PB2 AC-5, Mạnh 27/11: «deals … đang được dùng chưa đúng»). «Căn giá tốt» là bộ
 * lọc `?minBelowMedianPct=` và ba khoá so giá trên phần tử Listing. Trả 410 cho mọi lời gọi, không truy vấn.
 */
export const DEALS_GONE = "/v1/deals đã gộp vào /v1/listings: dùng ?minBelowMedianPct=";
export const dealsRoute = new Hono();
dealsRoute.all("*", (c) => c.json({ error: { code: "GONE", message: DEALS_GONE } }, 410));
