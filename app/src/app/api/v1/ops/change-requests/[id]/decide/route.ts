import { NextResponse } from "next/server";

import { ghiAuditTrong, trongGiaoDich } from "@/lib/audit";
import { kiemQuyen } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/ops/change-requests/:id/decide `{decision: "approve" | "reject", note?}` — vai admin (TV4, ADR-0015 §6).
 * Chỉ từ `submitted`; khác → 409, dòng không đổi. Admin tự duyệt được lệnh của mình, TRỪ lệnh nhắm S03: cần người duyệt
 * khác người gửi (§4.8 #1) → 409 `can-nguoi-thu-hai`. Quyết định và dòng audit cùng giao dịch.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const q = await kiemQuyen(req, "lenh.duyet");
  if (!q.ok) return q.res;
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { decision?: unknown; note?: unknown } | null;
  const decision = body?.decision;
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "decision phải là approve hoặc reject" }, { status: 400 });
  }
  if (!UUID.test(id)) return NextResponse.json({ error: "không có lệnh" }, { status: 404 });
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
  const kq = await trongGiaoDich(async (c) => {
    const { rows } = await c.query(
      `SELECT id, target, status, requested_by FROM change_requests WHERE id = $1 FOR UPDATE`, [id],
    );
    const l = rows[0];
    if (!l) return { status: 404, body: { error: "không có lệnh" } };
    if (l.status !== "submitted") return { status: 409, body: { error: "lệnh không ở trạng thái đã gửi", status: l.status } };
    if (decision === "approve" && l.target === "S03" && l.requested_by === q.actor) {
      return { status: 409, body: { error: "can-nguoi-thu-hai" } };
    }
    const moi = decision === "approve" ? "approved" : "rejected";
    const { rows: sau } = await c.query(
      `UPDATE change_requests SET status = $2, approved_by = $3, decided_at = now(), note = $4 WHERE id = $1
       RETURNING id, status, approved_by, decided_at`,
      [id, moi, q.actor, note],
    );
    await ghiAuditTrong(c, q.actor, "change_request.decide", { change_request_id: id, decision, target: l.target });
    return { status: 200, body: sau[0] };
  });
  return NextResponse.json(kq.body, { status: kq.status });
}
