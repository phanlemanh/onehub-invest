import { NextResponse } from "next/server";

import { ghiAuditTrong, trongGiaoDich } from "@/lib/audit";
import { kiemQuyen } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/ingest — C4 P2: máy thu đẩy "local facts" (ống Zalo,
 * máy móc launchd, funnel, rotation, nhóm) lên cloud để Ops Portal trên
 * Vercel đầy đủ 3 tầng. Idempotent: upsert một dòng ops_heartbeat.
 * Quyền `ingest.push` (bảng ở lib/ops-access.ts): bearer chung của máy HOẶC phiên từ vai ops; nạp số và dòng
 * audit ghi cùng transaction.
 */
export async function POST(req: Request) {
  const q = await kiemQuyen(req, "ingest.push");
  if (!q.ok) return q.res;
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object" || !payload.pushedAt) {
    return NextResponse.json({ error: "payload thiếu pushedAt" }, { status: 400 });
  }
  await trongGiaoDich(async (c) => {
    await c.query(
      `INSERT INTO ops_heartbeat (id, payload, pushed_at)
       VALUES ('primary', $1::jsonb, $2)
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, pushed_at = EXCLUDED.pushed_at`,
      [JSON.stringify(payload), new Date(payload.pushedAt as string)],
    );
    await ghiAuditTrong(c, q.actor, "ingest.push", { thao_tac: "ingest", pushedAt: payload.pushedAt });
  });
  return NextResponse.json({ ok: true, pushedAt: payload.pushedAt });
}
