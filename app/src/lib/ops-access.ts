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

/** Clearance law (ADR-0007 + portals.md): admin-class trang /ops gated role=admin. */
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
