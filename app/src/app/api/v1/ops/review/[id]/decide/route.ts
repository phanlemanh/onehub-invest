import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { kiemQuyen } from "@/lib/ops-access";
import { ghiAuditTrong } from "@/lib/audit";
import { planEnrichApproval, type EnrichChoices } from "@/lib/enrich-choices";
import { LY_DO_TOI_DA, lyDoHopLe } from "@/lib/ops/review-can-cu";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/review/:id/decide — HITL quyết định review item.
 * Body: { status: "approved" | "rejected" | "deferred", reason: string, choices?: { <field>: <proposal_id> | null } }
 * `reason` bắt buộc (PL3): cắt khoảng trắng hai đầu, 1…1.000 ký tự — thiếu/trắng/quá dài → 400 trước BEGIN, không đổi gì.
 *
 * Entity_match approved → property_candidates status='merged' · rejected → 'rejected' · deferred → 'pending', CHỈ khi
 *   quyết định chạm đúng MỘT ứng viên còn chờ (khớp cặp `pair:<A>|<B>` theo hai chiều, status pending/needs_llm — HD9).
 *   Không chạm đúng một (0, 2, hay item_id sai khuôn) → ROLLBACK, 422 `{ error, code: "khong-cham-ung-vien", so_dong }`:
 *   thẻ vẫn chờ, không dòng audit nào (audit hàng duyệt 30/10, H2).
 * Agent_output enrich:<offer_id> → decide_enrichment_review (migration 033):
 *   approved áp đề xuất fill-gap · rejected bác · deferred giữ chờ lượt sau
 *   Thẻ có field xung đột (luật E1 trái LLM, AC-11): approved bắt buộc `choices` cho mỗi
 *   field đó (thiếu → 400, không đổi gì) → apply_enrichment(đề xuất được chọn + không xung
 *   đột) rồi decide_enrichment_review(...,'rejected') bác phần còn lại, cùng transaction.
 * Quyền `review.decide` (vai ops, không bearer); quyết định, lý do (`decision_note`) và dòng audit (`detail.ly_do`) ghi
 * cùng transaction — audit hỏng thì ROLLBACK cả quyết định lẫn lý do.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Quyền `review.decide`: một người từ vai ops — không bearer (quyết định ghi dữ liệu đi qua người, AGENTS.md luật 7).
  const q = await kiemQuyen(req, "review.decide");
  if (!q.ok) return q.res;
  const user = q.nguoi!;

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { status?: string; choices?: unknown; reason?: unknown } | null;
  const status = body?.status;
  if (!status || !["approved", "rejected", "deferred"].includes(status)) {
    return NextResponse.json({ error: "status phải là approved|rejected|deferred" }, { status: 400 });
  }
  const reason = lyDoHopLe(body?.reason);
  if (reason === null) {
    return NextResponse.json({ error: `lý do bắt buộc, 1–${LY_DO_TOI_DA.toLocaleString("vi-VN")} ký tự` }, { status: 400 });
  }
  const choices = parseChoices(body?.choices);
  if (choices === false) {
    return NextResponse.json({ error: "choices phải là { field: proposal_id | null }" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lấy item
    const { rows: items } = await client.query(
      `SELECT id, item_type, item_id, status FROM review_queue WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (items.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Không tìm thấy item" }, { status: 404 });
    }
    if (items[0].status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `Item đã quyết (${items[0].status})` }, { status: 409 });
    }

    // agent_output enrich: kiểm lựa chọn cho field xung đột TRƯỚC khi đổi bất cứ gì.
    const item = items[0];
    const isEnrich = item.item_type === "agent_output" && item.item_id.startsWith("enrich:");
    let applyIds: number[] | null = null;
    if (isEnrich && status === "approved") {
      const { rows: queued } = await client.query(
        `SELECT id::int AS id, field FROM enrichment_proposals WHERE review_id = $1 AND status = 'queued'`,
        [id],
      );
      const hasConflict = new Set(queued.map((q) => q.field)).size < queued.length;
      if (hasConflict) {
        const plan = planEnrichApproval(queued, choices);
        if (!plan.ok) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: plan.error }, { status: 400 });
        }
        applyIds = plan.applyIds;
      }
    }

    // entity_match → quyết định phải chạm đúng một ứng viên còn chờ, TRƯỚC khi đóng thẻ (HD9).
    let ungVien: number | null = null;
    if (item.item_type === "entity_match") {
      const cap = capKhoa(item.item_id);
      const candStatus =
        status === "approved" ? "merged" :
        status === "rejected" ? "rejected" :
        "pending"; // deferred → về pending chờ thêm tín hiệu
      const { rows: cham } = cap
        ? await client.query(
            `UPDATE property_candidates SET status = $1, decided_by = $2
             WHERE ((offer_a = $3 AND offer_b = $4) OR (offer_a = $4 AND offer_b = $3))
               AND status IN ('pending', 'needs_llm')
             RETURNING id::int AS id`,
            [candStatus, `hitl:${user.id}`, cap[0], cap[1]],
          )
        : { rows: [] as { id: number }[] };
      if (cham.length !== 1) {
        await client.query("ROLLBACK");
        const khoa = cap ? `${cap[0]} và ${cap[1]}` : `«${item.item_id}» (khoá thẻ sai khuôn)`;
        return NextResponse.json({
          error: `Thẻ không chạm đúng một ứng viên ghép căn còn chờ (${khoa}: khớp ${cham.length}) — quyết định không được ghi, thẻ vẫn chờ.`,
          code: "khong-cham-ung-vien",
          so_dong: cham.length,
        }, { status: 422 });
      }
      ungVien = cham[0].id;
    }

    // Cập nhật review_queue kèm lý do người duyệt (PL3)
    await client.query(
      `UPDATE review_queue SET status = $1, decided_by = $2, decided_at = now(), decision_note = $4 WHERE id = $3`,
      [status, user.id, id, reason],
    );

    // agent_output enrich:<offer_id> → áp/bác đề xuất enrichment qua hàm SQL duy nhất
    // (migration 033) — cùng transaction với cập nhật review_queue ở trên.
    if (isEnrich) {
      const actor = `hitl:${user.id}`;
      if (applyIds) {
        // Thẻ xung đột: áp bên được chọn, bác phần còn lại — hai hàm SQL của 033.
        await client.query(`SELECT apply_enrichment($1, $2)`, [applyIds, actor]);
        await client.query(`SELECT decide_enrichment_review($1, 'rejected', $2)`, [id, actor]);
      } else {
        await client.query(`SELECT decide_enrichment_review($1, $2, $3)`, [id, status, actor]);
      }
    }
    // Dòng audit trong CÙNG transaction: ghi hỏng → ROLLBACK cả quyết định.
    await ghiAuditTrong(client, q.actor, "review.decide", {
      thao_tac: "decide", reviewId: id, item_type: item.item_type, item_id: item.item_id,
      from: item.status, to: status, ly_do: reason,
      ...(ungVien !== null ? { ung_vien: ungVien } : {}),
      ...(applyIds ? { choices } : {}),
    });
    await client.query("COMMIT");

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("review decide failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "không ghi được quyết định" }, { status: 500 });
  } finally {
    client.release();
  }
}

/** Cặp khoá của thẻ ghép căn: đúng khuôn `pair:<A>|<B>`, A và B khác rỗng, không phần thừa → [A, B]; khác → null. */
function capKhoa(itemId: string): [string, string] | null {
  const m = /^pair:([^|\s]+)\|([^|\s]+)$/.exec(itemId);
  return m ? [m[1], m[2]] : null;
}

/** choices hợp lệ: vắng → undefined; object { field: số nguyên | null } → giữ; khác → false. */
function parseChoices(raw: unknown): EnrichChoices | undefined | false {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) return false;
  const out: EnrichChoices = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== null && !Number.isInteger(v)) return false;
    out[k] = v as number | null;
  }
  return out;
}
