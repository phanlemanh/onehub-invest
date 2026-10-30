import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";
import { serveZaloMedia } from "@/lib/ops/zalo-media";

export const dynamic = "force-dynamic";

/**
 * GET /api/zalo-media — ảnh tin (tầng A) cho trang /ops. Sổ bề mặt API khai ops-session; mã chặt hơn sổ:
 *   ?snapshot=<snapshotId>&file=media/<f>  ảnh N1 trong raw snapshot (/ops/review) — vai Vận hành trở lên
 *   ?path=<mediaPath>                      ảnh staging OpenClaw (/ops/deals) — chỉ admin
 * Vai Người xem qua cổng phiên Ops nhưng lõi trả 404. Rào chặn đọc file tuỳ ý (isInside + realpath) nằm ở
 * `@/lib/ops/zalo-media`. KHÔNG sync cloud — file chỉ có ở máy local, ở cloud route trả 404.
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!canAccessOps(user)) return new Response("not found", { status: 404 });
  return serveZaloMedia(req, user);
}
