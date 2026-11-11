import { NextResponse } from "next/server";

import { trongGiaoDich } from "@/lib/audit";
import { kiemTokenMay } from "@/lib/token-may";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ops/change-requests/pull — máy thu kéo lệnh (TV4, ADR-0015 §2). CHỈ token máy có scope `ops:pull`: phiên
 * người, bearer chung, token thu hồi hay thiếu scope → 401/403, không lệnh nào đổi. Trả lệnh `approved` và `queued`
 * (chưa có kết quả — lần gửi kết quả trước có thể hỏng), cũ trước; `approved` chuyển `queued` + `queued_at`.
 * Khuôn phản hồi `{commands: [{id, type, target, payload, idempotency_key, requested_by, approved_by}]}` là hợp đồng với
 * pipeline/ops-apply.mjs (ca đầu-cuối SL-NOI).
 */
export async function GET(req: Request) {
  const t = await kiemTokenMay(req, "ops:pull");
  if (!t.ok) return t.res;
  const commands = await trongGiaoDich(async (c) => {
    await c.query(`UPDATE change_requests SET status = 'queued', queued_at = now() WHERE status = 'approved'`);
    const { rows } = await c.query(
      `SELECT id, type, target, payload, idempotency_key, requested_by, approved_by
         FROM change_requests WHERE status = 'queued' ORDER BY created_at, id`,
    );
    return rows;
  });
  return NextResponse.json({ commands });
}
