import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";
import { auditOpsWrite } from "@/lib/audit";
import { planEnrichApproval, type EnrichChoices } from "@/lib/enrich-choices";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/review/:id/decide — HITL quyết định review item.
 * Body: { status: "approved" | "rejected" | "deferred", choices?: { <field>: <proposal_id> | null } }
 *
 * Entity_match approved → property_candidates status='merged'
 * Entity_match rejected → property_candidates status='rejected'
 * Agent_output enrich:<offer_id> → decide_enrichment_review (migration 033):
 *   approved áp đề xuất fill-gap · rejected bác · deferred giữ chờ lượt sau
 *   Thẻ có field xung đột (luật E1 trái LLM, AC-11): approved bắt buộc `choices` cho mỗi
 *   field đó (thiếu → 400, không đổi gì) → apply_enrichment(đề xuất được chọn + không xung
 *   đột) rồi decide_enrichment_review(...,'rejected') bác phần còn lại, cùng transaction.
 * Audit mọi quyết định.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  const expected = process.env.OPS_API_TOKEN;
  const bearer = req.headers.get("authorization") ?? "";
  const authOk =
    (!!expected && bearer === `Bearer ${expected}`) || canAccessOps(user);
  if (!authOk) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { status?: string; choices?: unknown } | null;
  const status = body?.status;
  if (!status || !["approved", "rejected", "deferred"].includes(status)) {
    return NextResponse.json({ error: "status phải là approved|rejected|deferred" }, { status: 400 });
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

    // Cập nhật review_queue
    await client.query(
      `UPDATE review_queue SET status = $1, decided_by = $2, decided_at = now() WHERE id = $3`,
      [status, user?.id ?? "ops-api", id],
    );

    // Nếu entity_match → cập nhật property_candidates tương ứng
    if (item.item_type === "entity_match" && item.item_id.startsWith("pair:")) {
      const [offerA, offerB] = item.item_id.replace("pair:", "").split("|");
      const candStatus =
        status === "approved" ? "merged" :
        status === "rejected" ? "rejected" :
        "pending"; // deferred → về pending chờ thêm tín hiệu
      if (offerA && offerB) {
        await client.query(
          `UPDATE property_candidates SET status = $1, decided_by = $2
           WHERE (offer_a = $3 AND offer_b = $4) OR (offer_a = $4 AND offer_b = $3)`,
          [candStatus, `hitl:${user?.id ?? "api"}`, offerA, offerB],
        );
      }
    }

    // agent_output enrich:<offer_id> → áp/bác đề xuất enrichment qua hàm SQL duy nhất
    // (migration 033) — cùng transaction với cập nhật review_queue ở trên.
    if (isEnrich) {
      const actor = `hitl:${user?.id ?? "api"}`;
      if (applyIds) {
        // Thẻ xung đột: áp bên được chọn, bác phần còn lại — hai hàm SQL của 033.
        await client.query(`SELECT apply_enrichment($1, $2)`, [applyIds, actor]);
        await client.query(`SELECT decide_enrichment_review($1, 'rejected', $2)`, [id, actor]);
      } else {
        await client.query(`SELECT decide_enrichment_review($1, $2, $3)`, [id, status, actor]);
      }
    }
    await client.query("COMMIT");

    auditOpsWrite(user?.id ?? "ops-api", "review:decide", {
      reviewId: id, item_type: item.item_type, item_id: item.item_id,
      status, decided_by: user?.id ?? "api",
      ...(applyIds ? { choices } : {}),
    });

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
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
