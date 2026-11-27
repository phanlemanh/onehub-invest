import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { marketsRoute } from "./routes/markets.js";
import { KIND, listingsRoute } from "./routes/listings.js";
import { dealsRoute } from "./routes/deals.js";
import { assetStatsRoute } from "./routes/asset-stats.js";
import { priceStatsRoute } from "./routes/price-stats.js";
import { schemaListing } from "./contract/listing.js";
import { coverageRoute } from "./routes/coverage.js";
import { auth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: "*" }));
app.use("*", auth);

app.onError(errorHandler);

export const API_VERSION = "0.2.0";
app.get("/health", (c) => c.json({ status: "ok", version: API_VERSION }));

app.route("/v1/markets", marketsRoute);
app.route("/v1/listings", listingsRoute);
app.route("/v1/deals", dealsRoute); // 410 — gộp vào /v1/listings?minBelowMedianPct=
app.route("/v1/asset-stats", assetStatsRoute); // 410 — đổi tên thành /v1/price-stats
app.route("/v1/price-stats", priceStatsRoute);
app.route("/v1/coverage", coverageRoute);

app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "OneHub Data API",
      description: "Real estate data API for Vietnam",
      version: API_VERSION,
      license: { name: "MIT" },
    },
    servers: [{ url: `http://localhost:${process.env.PORT ?? 3001}` }],
    paths: {
      "/health": { get: { summary: "Health check", responses: { 200: { description: "OK" } } } },
      "/v1/markets": { get: { summary: "List markets", responses: { 200: { description: "Market list" } } } },
      "/v1/markets/{id}": { get: { summary: "Market detail", responses: { 200: { description: "Detail" } } } },
      "/v1/markets/{id}/submarkets": { get: { summary: "Submarkets", responses: { 200: { description: "Submarket list" } } } },
      "/v1/markets/{id}/insights": { get: { summary: "Market insights", responses: { 200: { description: "Insights" } } } },
      "/v1/listings": { get: { summary: `Listings (RESO Property resource): ?kind=${KIND.join("|")}, market, area, bedroomsTotal, minBelowMedianPct, project, limit, offset`, responses: { 200: { description: "Listing list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Listing" } } } } } } } } } },
      "/v1/listings/{listingKey}": { get: { summary: "One listing by listingKey", responses: { 200: { description: "Listing", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Listing" } } } } } }, 404: { description: "Not found" } } } },
      "/v1/price-stats": { get: { summary: "Price statistics by area (?area= or ?market=)", responses: { 200: { description: "Stats" } } } },
      "/v1/coverage": { get: { summary: "Data coverage", responses: { 200: { description: "Coverage" } } } },
    },
    components: {
      schemas: {
        // Sinh từ data-api/src/contract/listing.ts — nguồn duy nhất của khoá phần tử Listing.
        Listing: schemaListing(),
      },
    },
  });
});

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } }, 404));

export default app;
