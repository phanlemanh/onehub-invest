import { getSessionUser } from "@/lib/auth";
import { serveZaloMedia } from "@/lib/ops/zalo-media";

export const dynamic = "force-dynamic";

/**
 * GET /api/zalo-media — ảnh tin (tầng A) cho trang /ops, chỉ admin.
 *   ?path=<mediaPath>                      ảnh staging OpenClaw (/ops/deals)
 *   ?snapshot=<snapshotId>&file=media/<f>  ảnh N1 trong raw snapshot (/ops/review)
 * Rào chặn đọc file tuỳ ý (isInside + realpath) nằm ở `@/lib/ops/zalo-media`.
 * KHÔNG sync cloud — file chỉ có ở máy local, ở cloud route trả 404.
 */
export async function GET(req: Request) {
  return serveZaloMedia(req, await getSessionUser());
}
