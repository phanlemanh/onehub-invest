import { NextResponse } from "next/server";

import { ghiAuditTrong, trongGiaoDich } from "@/lib/audit";
import { kiemQuyen } from "@/lib/ops-access";
import { kiemTokenMay } from "@/lib/token-may";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/ingest — C4 P2: máy thu đẩy "local facts" (ống Zalo,
 * máy móc launchd, funnel, rotation, nhóm) lên cloud để Ops Portal trên
 * Vercel đầy đủ 3 tầng. Idempotent: upsert một dòng ops_heartbeat.
 * Quyền `ingest.push` (bảng ở lib/ops-access.ts): bearer chung của máy HOẶC phiên từ vai ops; nạp số và dòng
 * audit ghi cùng transaction.
 */
export async function POST(req: Request) {
  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  // TV4 `so-lenh-bo-ap` (ADR-0015 §8): kết quả lệnh đi cùng đường ingest, nhưng là khối riêng — chỉ token máy `ops:pull`,
  // không đụng ops_heartbeat.
  if (payload && payload.kind === KIND_KET_QUA) return nhanKetQuaLenh(req, payload);
  const q = await kiemQuyen(req, "ingest.push");
  if (!q.ok) return q.res;
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

const KIND_KET_QUA = "change_request_results";
const OUTCOME = new Set(["applied", "failed", "reverted"]);

type KetQua = {
  id: string;
  idempotency_key: string;
  outcome: "applied" | "failed" | "reverted";
  before?: unknown;
  after?: unknown;
  ly_do?: string;
  applied_at?: string;
};

const laKetQua = (r: unknown): r is KetQua => {
  if (!r || typeof r !== "object") return false;
  const k = r as Record<string, unknown>;
  return typeof k.id === "string" && typeof k.idempotency_key === "string" && typeof k.outcome === "string" && OUTCOME.has(k.outcome);
};

/**
 * Nhận kết quả lệnh từ máy thu (`push-ops-facts.mjs --chi-lenh`). Mỗi kết quả khớp `id` + `idempotency_key` của một lệnh
 * đang `queued` thì chuyển sang `applied|failed|reverted` kèm before/after/result/finished_at và một dòng audit actor
 * `machine:<tên token>`; không khớp, đã xong, sai khoá → bỏ qua và đếm. Lệnh không bao giờ thành «đã áp» khi không có
 * kết quả từ máy thu.
 */
async function nhanKetQuaLenh(req: Request, payload: Record<string, unknown>) {
  const t = await kiemTokenMay(req, "ops:pull");
  if (!t.ok) return t.res;
  const results = payload.results;
  if (!Array.isArray(results) || !results.every(laKetQua)) {
    return NextResponse.json({ error: "results phải là mảng kết quả {id, idempotency_key, outcome}" }, { status: 400 });
  }
  const actor = `machine:${t.ten}`;
  const dem = await trongGiaoDich(async (c) => {
    let capNhat = 0;
    for (const r of results) {
      const { rows } = await c.query(
        `UPDATE change_requests SET status = $3, before = $4::jsonb, after = $5::jsonb, result = $6::jsonb, finished_at = now()
          WHERE id::text = $1 AND idempotency_key = $2 AND status = 'queued'
          RETURNING id, target`,
        [r.id, r.idempotency_key, r.outcome, JSON.stringify(r.before ?? null), JSON.stringify(r.after ?? null),
          JSON.stringify({ outcome: r.outcome, ly_do: r.ly_do ?? null, applied_at: r.applied_at ?? null })],
      );
      if (!rows[0]) continue;
      capNhat++;
      await ghiAuditTrong(c, actor, "change_request.result", {
        change_request_id: r.id, idempotency_key: r.idempotency_key, outcome: r.outcome, target: rows[0].target,
      });
    }
    return capNhat;
  });
  return NextResponse.json({ ok: true, cap_nhat: dem, bo_qua: results.length - dem });
}
