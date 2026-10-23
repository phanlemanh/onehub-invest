import type { User } from "./auth";

/**
 * Quyền vào Ops Portal (portals.md luật 3 + clearance law) — ĐÓNG MẶC ĐỊNH.
 * /register mở cho mọi người nên "đã đăng nhập" KHÔNG đủ. Vào được khi:
 *   - users.role là `admin` hoặc `ops` (cấp bằng `UPDATE users SET role = 'ops'`), hoặc
 *   - email nằm trong OPS_EMAILS (danh sách cách nhau dấu phẩy) — cửa phụ theo env.
 * OPS_EMAILS trống thì chỉ còn đường role.
 */
export function canAccessOps(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "ops") return true;
  const allow = (process.env.OPS_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(user.email.toLowerCase());
}

/**
 * Quyền gọi API của đội vận hành — bearer HOẶC phiên ops (cùng luật các route /api/v1/ops/*).
 *   - `Authorization: Bearer <OPS_API_TOKEN>` khớp nguyên chuỗi → qua, KHÔNG đọc phiên;
 *   - OPS_API_TOKEN trống/thiếu → nhánh bearer luôn sai (chặn `Bearer ` rỗng, `Bearer undefined`);
 *   - còn lại → canAccessOps(phiên).
 * Token đọc lúc gọi, không chụp lúc nạp module. `getUser` là tham số để test chạy ngoài
 * request Next (getSessionUser cần cookies()). Dùng đầu tiên ở /api/v1/deals (hồ sơ deals-api-tam-dong).
 */
export async function canCallOpsApi(req: Request, getUser: () => Promise<User | null>): Promise<boolean> {
  const token = process.env.OPS_API_TOKEN;
  if (token && req.headers.get("authorization") === `Bearer ${token}`) return true;
  return canAccessOps(await getUser());
}

/** Clearance law (ADR-0007 + portals.md): admin-class trang /ops gated role=admin. */
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
