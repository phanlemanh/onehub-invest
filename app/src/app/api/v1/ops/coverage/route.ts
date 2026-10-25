import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import type { FreshnessRow } from "@/lib/freshness";
import { canAccessOps } from "@/lib/ops-access";
import { readOpsFacts } from "@/lib/ops-facts";
import { freshnessLocalOnly, getCoverageOverview, toCoverageRows, type CoverageRow } from "@/lib/ops-queries";

export const dynamic = "force-dynamic";

type CoverageBody = {
  generatedAt: string;
  /** `local` = máy thu đo trực tiếp; `facts` = máy chủ đọc khối `freshness` máy thu đẩy lên (AU12, ADR-0014). */
  source: "local" | "facts";
  /** `live` máy thu · `fresh` / `stale` theo `measured_at` CỦA KHỐI (45′) · `none` máy chủ không có số. */
  state: "live" | "fresh" | "stale" | "none";
  measuredAt: string | null;
  /** null = máy chủ không có số (Hỏi-2 = A) — không bao giờ `[]` như thể đã đo. */
  rows: CoverageRow[] | null;
  note?: string;
};

/** Khối `freshness` → hàng độ tươi; khối vắng, lỗi hay sai khuôn → null (máy chủ không có số). */
async function cloudCoverage(): Promise<Pick<CoverageBody, "state" | "measuredAt" | "rows">> {
  const none = { state: "none" as const, measuredAt: null, rows: null };
  let facts: Awaited<ReturnType<typeof readOpsFacts>>;
  try {
    facts = await readOpsFacts();
  } catch (e) {
    // Bảng ops_heartbeat vắng (42P01) = chưa có bản tin nào; lỗi khác vẫn ném để route trả lỗi thật.
    if ((e as { code?: string }).code === "42P01") return none;
    throw e;
  }
  const b = facts.blocks.freshness;
  if (!b || b.state === "error") return none;
  const rows = (b.data as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rows) || !rows.every((r) => typeof (r as { code?: unknown })?.code === "string")) return none;
  try {
    return { state: b.state, measuredAt: b.measuredAt, rows: toCoverageRows(rows as FreshnessRow[]) };
  } catch {
    return none;
  }
}

/**
 * GET /api/v1/ops/coverage — bề mặt máy của /ops (ADR-0007 DCA).
 * Auth: session cookie HOẶC Authorization: Bearer <OPS_API_TOKEN>.
 * Trả mã SPL tầng B — không bao giờ tên nguồn thật (xem /ops/sources). Trên máy chủ (không `source_registry`) đọc khối
 * `freshness` máy thu đẩy lên (AU12, ADR-0014): phản hồi chỉ mang trường của `CoverageRow` và các cờ, không chép bản tin.
 */
export async function GET(req: Request) {
  const expected = process.env.OPS_API_TOKEN;
  const bearer = req.headers.get("authorization") ?? "";
  const bearerOk = !!expected && bearer === `Bearer ${expected}`;
  if (!bearerOk) {
    const user = await getSessionUser();
    if (!canAccessOps(user)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const generatedAt = new Date().toISOString();
  if (!(await freshnessLocalOnly())) {
    const rows = await getCoverageOverview();
    return NextResponse.json({ generatedAt, source: "local", state: "live", measuredAt: generatedAt, rows } satisfies CoverageBody);
  }
  const cloud = await cloudCoverage();
  const body: CoverageBody = { generatedAt, source: "facts", ...cloud };
  if (cloud.state === "none") body.note = "Chỉ đo ở máy thu";
  return NextResponse.json(body);
}
