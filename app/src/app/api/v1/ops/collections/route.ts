import { xuLyThuThap } from "@/lib/collections-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/collections — bề mặt máy của trang "Thu thập" (ADR-0007
 * DCA). Quyền `ops.read` (lib/ops-access.ts): phiên từ vai người xem HOẶC bearer chung của máy. Query: ?days=7
 * (tối đa 90). Người xem và bearer nhận bản đã che định danh tài khoản thu (lib/collections-api.ts).
 */
export async function GET(req: Request) {
  return xuLyThuThap(req);
}
