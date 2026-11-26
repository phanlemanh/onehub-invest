import { createMiddleware } from "hono/factory";

/**
 * API Key authentication — closed by default.
 *
 * Set DATA_API_KEYS env as comma-separated list of keys. Example: DATA_API_KEYS=key1,key2,key3
 *
 * Running without keys is allowed ONLY when NODE_ENV is exactly "development" or "test" and VERCEL is not set.
 * Anywhere else, an empty key list makes every data route answer 503 AUTH_NOT_CONFIGURED, /health answer 503
 * "misconfigured", and the Node server (src/index.ts) refuse to start.
 */

/** Pinned message for a missing key list. Names the variable only — never a key value. */
export const MISSING_KEYS_MESSAGE =
  "DATA_API_KEYS is empty: refusing to serve data outside NODE_ENV=development or NODE_ENV=test (never on Vercel). " +
  "Set DATA_API_KEYS to a comma-separated list of API keys.";

/**
 * Đọc cấu hình xác thực ở MỖI lời gọi (không chốt lúc nạp module), để đặt hay gỡ khoá có hiệu lực ngay.
 *
 * Đóng mặc định (PB3, design.md §3): chỉ hai giá trị NODE_ENV khai rõ là dev/test mới được chạy không khoá. Quên đặt
 * NODE_ENV (bản Docker, máy chủ trần), giá trị lạ, hay bất kỳ bản nào trên Vercel đều là môi trường đóng.
 */
export function authConfig(env: NodeJS.ProcessEnv = process.env): { open: boolean; keys: string[] } {
  const keys = (env.DATA_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const open = (env.NODE_ENV === "development" || env.NODE_ENV === "test") && !env.VERCEL;
  return { open, keys };
}

export const auth = createMiddleware(async (c, next) => {
  const path = c.req.path;
  // OpenAPI docs are static and carry no data: always served.
  if (path === "/openapi.json") {
    return next();
  }

  const { open, keys } = authConfig();

  if (keys.length === 0) {
    // Development/test without keys: no auth.
    if (open) {
      return next();
    }
    // Closed environment without keys: refuse everything, never reach a handler or the DB.
    const error = { code: "AUTH_NOT_CONFIGURED", message: MISSING_KEYS_MESSAGE };
    if (path === "/health") {
      return c.json({ status: "misconfigured", error }, 503);
    }
    return c.json({ error }, 503);
  }

  // Keys configured: health check needs no key.
  if (path === "/health") {
    return next();
  }

  const authHeader = c.req.header("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : c.req.header("x-api-key") ?? "";

  if (!apiKey || !keys.includes(apiKey)) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      401,
    );
  }

  return next();
});
