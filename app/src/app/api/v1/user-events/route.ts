import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/user-events — M2: app beacon ghi user_events (memory episodic).
 * Body: { kind, payload } — kind enum khớp migration 028.
 * Auth: session. Rate-limit client: 1 event/kind/30s (localStorage dedupe
 * trong UserEventBeacon component, không server-side — đủ cho volume thấp).
 * KHÔNG sync cloud (bảng PII tầng A — cùng luật sellers/stg).
 */
const VALID_KINDS = new Set([
  "view_market", "view_listing", "saved_market", "saved_listing",
  "compare", "dau_tu_input", "advisor_msg", "deal_click", "feedback",
]);

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.kind || typeof body.kind !== "string" || !VALID_KINDS.has(body.kind)) {
    return NextResponse.json({ error: "kind không hợp lệ" }, { status: 400 });
  }

  const payload = (body.payload ?? {}) as Record<string, unknown>;

  await pool.query(
    `INSERT INTO user_events (user_id, kind, payload, source)
     VALUES ($1, $2, $3::jsonb, 'app')`,
    [user.id, body.kind, JSON.stringify(payload)],
  );

  return NextResponse.json({ ok: true });
}
