import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}:`, err.message);
  const status = ((err as { status?: number }).status ?? 500) as 400 | 401 | 403 | 404 | 500;
  return c.json(
    { error: { code: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR", message: err.message || "An error occurred" } },
    status,
  );
};
