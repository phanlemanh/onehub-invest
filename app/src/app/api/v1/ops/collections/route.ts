import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import {
  getFlowDays,
  getZaloAccountsFromFacts,
  getZaloGroups,
  readGateFunnel,
  readRotationPreview,
  readSchedulerStatus,
  readZaloAllowlist,
  readZaloHealth,
} from "@/lib/collections-queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/collections — bề mặt máy của trang "Thu thập" (ADR-0007
 * DCA). Quyền `ops.read` (lib/ops-access.ts): phiên từ vai người xem HOẶC bearer chung của máy. Query: ?days=7
 * (tối đa 90).
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "ops.read");
  if (!q.ok) return q.res;
  const days = Math.min(
    90,
    Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 7) || 7),
  );
  const [flow, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, zaloAccounts] = await Promise.all([
    getFlowDays(days),
    readGateFunnel(),
    readSchedulerStatus(),
    readRotationPreview(),
    getZaloGroups(),
    readZaloAllowlist(),
    readZaloHealth(),
    getZaloAccountsFromFacts(),
  ]);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    flow,
    funnel,
    jobs,
    rotation,
    zaloGroups,
    zaloAllowlist,
    zaloHealth,
    zaloAccounts,
  });
}
