import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { marketsRoute } from "./routes/markets.js";
import { listingsRoute } from "./routes/listings.js";
import { dealsRoute } from "./routes/deals.js";
import { assetStatsRoute } from "./routes/asset-stats.js";
import { coverageRoute } from "./routes/coverage.js";
import { auth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: "*" }));
app.use("*", auth);

app.onError(errorHandler);

app.get("/health", (c) => c.json({ status: "ok", version: "0.1.0" }));

app.route("/v1/markets", marketsRoute);
app.route("/v1/listings", listingsRoute);
app.route("/v1/deals", dealsRoute);
app.route("/v1/asset-stats", assetStatsRoute);
app.route("/v1/coverage", coverageRoute);

app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "OneHub Data API",
      description: "Real estate data API for Vietnam",
      version: "0.1.0",
      license: { name: "MIT" },
    },
    servers: [{ url: `http://localhost:${process.env.PORT ?? 3001}` }],
    paths: {
      "/health": { get: { summary: "Health check", responses: { 200: { description: "OK" } } } },
      "/v1/markets": { get: { summary: "List markets", responses: { 200: { description: "Market list" } } } },
      "/v1/markets/{id}": { get: { summary: "Market detail", responses: { 200: { description: "Detail" } } } },
      "/v1/markets/{id}/submarkets": { get: { summary: "Submarkets", responses: { 200: { description: "Submarket list" } } } },
      "/v1/markets/{id}/insights": { get: { summary: "Market insights", responses: { 200: { description: "Insights" } } } },
      "/v1/listings": { get: { summary: "List listings", responses: { 200: { description: "Listing list" } } } },
      "/v1/listings/{id}": { get: { summary: "Listing detail", responses: { 200: { description: "Detail" } } } },
      "/v1/deals": { get: { summary: "Best-value deals", responses: { 200: { description: "Deals" } } } },
      "/v1/asset-stats": { get: { summary: "Asset statistics", responses: { 200: { description: "Stats" } } } },
      "/v1/coverage": { get: { summary: "Data coverage", responses: { 200: { description: "Coverage" } } } },
    },
  });
});

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } }, 404));

export default app;
