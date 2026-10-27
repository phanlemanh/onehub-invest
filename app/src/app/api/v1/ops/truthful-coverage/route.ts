import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { getTruthfulCoverage } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/truthful-coverage — bề mặt máy của thẻ "Độ phủ trung thực"
 * (E2 C2/D, ADR-0007 DCA). Quyền `ops.read` (lib/ops-access.ts): phiên từ vai người xem HOẶC bearer chung
 * của máy.
 *
 * ratio = listing tự thu ÷ listing active AirDNA (mẫu hiệu chuẩn, không phải
 * độ phủ quét thị trường).
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "ops.read");
  if (!q.ok) return q.res;
  const rows = await getTruthfulCoverage();
  return NextResponse.json({ generatedAt: new Date().toISOString(), rows });
}
