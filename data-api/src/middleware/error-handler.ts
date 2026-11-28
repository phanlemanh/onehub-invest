import type { ErrorHandler } from "hono";

/**
 * Lỗi 4xx có chủ đích (HTTPException mang status < 500) giữ thông điệp của nó. Mọi lỗi khác trả thông điệp chung:
 * thông điệp gốc của pg mang chữ SQL, tên bảng, tên cột (vd «relation "buildings" does not exist») — chỉ ghi vào log máy
 * chủ, không vào thân trả về (PB6 AC-10).
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[${c.req.method}] ${c.req.path}:`, err.message);
  const raw = (err as { status?: number }).status;
  const status = (typeof raw === "number" && raw >= 400 && raw < 500 ? raw : 500) as 400 | 401 | 403 | 404 | 500;
  if (status === 500) {
    return c.json({ error: { code: "INTERNAL_ERROR", message: "An error occurred" } }, 500);
  }
  return c.json({ error: { code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST", message: err.message || "Bad request" } }, status);
};
