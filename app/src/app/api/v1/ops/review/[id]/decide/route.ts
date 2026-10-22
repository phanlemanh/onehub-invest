import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";
import { auditOpsWrite } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/review/:id/decide — HITL quyết định review item.
 * Body: { status: "approved" | "rejected" | "deferred" }
 *
 * Entity_match approved → property_candidates status='merged'
 * Entity_match rejected → property_candidates status='rejected'
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

  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (!status || !["approved", "rejected", "deferred"].includes(status)) {
    return NextResponse.json({ error: "status phải là approved|rejected|deferred" }, { status: 400 });
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

    // Cập nhật review_queue
    await client.query(
      `UPDATE review_queue SET status = $1, decided_by = $2, decided_at = now() WHERE id = $3`,
      [status, user?.id ?? "ops-api", id],
    );

    // Nếu entity_match → cập nhật property_candidates tương ứng
    const item = items[0];
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

    await client.query("COMMIT");

    auditOpsWrite(user?.id ?? "ops-api", "review:decide", {
      reviewId: id, item_type: item.item_type, item_id: item.item_id,
      status, decided_by: user?.id ?? "api",
    });

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
