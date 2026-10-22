import { createMiddleware } from "hono/factory";

/**
 * API Key authentication.
 * 
 * Set DATA_API_KEYS env as comma-separated list of keys.
 * If not set or empty, auth is disabled (for local development).
 * 
 * Example: DATA_API_KEYS=key1,key2,key3
 */
const VALID_KEYS = (process.env.DATA_API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

export const auth = createMiddleware(async (c, next) => {
  // Skip auth for health check and OpenAPI docs
  const path = c.req.path;
  if (path === "/health" || path === "/openapi.json") {
    return next();
  }

  // If no keys configured, allow all (development mode)
  if (VALID_KEYS.length === 0) {
    return next();
  }

  const authHeader = c.req.header("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : c.req.header("x-api-key") ?? "";

  if (!apiKey || !VALID_KEYS.includes(apiKey)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      401,
    );
  }

  return next();
});
