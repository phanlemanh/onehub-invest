import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { ghiAuditTrong, trongGiaoDich } from "@/lib/audit";
import { pool } from "@/lib/db";
import { kiemLenh } from "@/lib/lenh";
import { LY_DO_TOI_DA } from "@/lib/lenh-hien";
import { isAdmin, kiemQuyen } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

/**
 * Sổ Lệnh trên cloud (TV4 `so-lenh-bo-ap`, ADR-0015). Cloud chỉ ghi ý muốn; máy thu kéo lệnh đã duyệt qua `…/pull`, áp,
 * rồi báo kết quả qua `ingest`. Route này không bao giờ đánh dấu một lệnh là đã áp.
 *
 * GET — danh sách lệnh mới nhất trước (vai viewer) kèm `last_pull_at`: lần dùng cuối của token máy còn hiệu lực có scope
 * `ops:pull` (null khi chưa máy nào kéo) — để màn TV4b báo «Máy thu chưa nhận lệnh từ HH:MM».
 *
 * POST `{type, target, payload?, idempotency_key?, tu_duyet?, ly_do?}` — tạo lệnh `submitted`. Hành động `lenh.gui` (vai
 * ops); `source.resume` còn đòi admin; khuôn sai → 400 `{error, ly_do}` (cùng hàm kiểm với bộ áp ở máy thu). Lệnh và dòng
 * audit cùng giao dịch.
 * TV4b: `tu_duyet: true` (đúng boolean) = người gửi đã xem trước/sau trên hộp thoại (ADR-0015 §6) → lệnh vào thẳng
 * `approved`, người duyệt là chính người gửi, thêm dòng audit `change_request.decide` cùng giao dịch — TRỪ đích S03: lệnh
 * vẫn `submitted`, chờ người thứ hai (§4.8 #1). `ly_do` (≤ 500 ký tự) ghi vào cột `note` — đường lý do của lệnh Bật lại,
 * vì payload của `source.resume` phải rỗng.
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "lenh.xem");
  if (!q.ok) return q.res;
  const [{ rows: commands }, { rows: keo }] = await Promise.all([
    pool.query(
      `SELECT id, type, target, payload, status, requested_by, approved_by, idempotency_key, before, after, result, note,
              inverse_of, created_at, decided_at, queued_at, finished_at
         FROM change_requests ORDER BY created_at DESC, id LIMIT 200`,
    ),
    pool.query<{ last_pull_at: Date | null }>(
      `SELECT max(last_used_at) AS last_pull_at FROM machine_tokens
        WHERE revoked_at IS NULL AND 'ops:pull' = ANY (scopes)`,
    ),
  ]);
  return NextResponse.json({ commands, last_pull_at: keo[0]?.last_pull_at ?? null });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const q = await kiemQuyen(req, "lenh.gui");
  if (!q.ok) return q.res;
  // Bật lại nguồn do admin bấm (tài liệu §4.8 #4) — chặt hơn hành động lenh.gui của bảng.
  if (body?.type === "source.resume" && !isAdmin(q.nguoi)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!body || typeof body !== "object") return NextResponse.json({ error: "body không phải JSON" }, { status: 400 });
  const kiem = kiemLenh({ type: body.type, target: body.target, payload: body.payload });
  if (!kiem.ok) return NextResponse.json({ error: "lenh-sai-khuon", ly_do: kiem.ly_do }, { status: 400 });
  const lyDo = typeof body.ly_do === "string" && body.ly_do.trim() ? body.ly_do.trim() : null;
  if (lyDo && lyDo.length > LY_DO_TOI_DA) return NextResponse.json({ error: "lenh-sai-khuon", ly_do: "ly-do-qua-dai" }, { status: 400 });
  const khoa = typeof body.idempotency_key === "string" && body.idempotency_key.trim() ? body.idempotency_key.trim() : randomUUID();
  const tuDuyet = body.tu_duyet === true && body.target !== "S03";
  const lenh = await trongGiaoDich(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO change_requests (type, target, payload, status, requested_by, approved_by, decided_at, note, idempotency_key)
       VALUES ($1, $2, $3::jsonb, CASE WHEN $6 THEN 'approved' ELSE 'submitted' END, $4,
               CASE WHEN $6 THEN $4 END, CASE WHEN $6 THEN now() END, $7, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id, type, target, payload, status, requested_by, approved_by, decided_at, note, idempotency_key, created_at`,
      [body.type, body.target, JSON.stringify(body.payload ?? {}), q.actor, khoa, tuDuyet, lyDo],
    );
    if (!rows[0]) return null;
    await ghiAuditTrong(c, q.actor, "change_request.create", {
      change_request_id: rows[0].id, type: body.type, target: body.target, idempotency_key: khoa,
    });
    if (tuDuyet) {
      await ghiAuditTrong(c, q.actor, "change_request.decide", {
        change_request_id: rows[0].id, decision: "approve", target: body.target, tu_duyet: true,
      });
    }
    return rows[0];
  });
  if (!lenh) return NextResponse.json({ error: "idempotency_key đã có" }, { status: 409 });
  return NextResponse.json(lenh, { status: 201 });
}
