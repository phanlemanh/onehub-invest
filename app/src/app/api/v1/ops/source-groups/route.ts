import { NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";
import { auditOpsWrite } from "@/lib/audit";
import { LOI_NGOAI_NHOM, NHOM_TRANG_CU, datCheDo } from "@/lib/che-do-thu";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/ops/source-groups — danh sách nhóm cấu hình S05, S06 kèm volume dữ liệu đã thu theo nhóm (đơn vị
 * S02/S03 của sổ không lên đây — PL12; mã khác ở toggle/add/delete/set-mode → 400).
 * POST { action: "toggle" | "add" | "delete" | "set-mode", ... } — quản trị nhóm nguồn.
 *   toggle: { sourceCode, groupKey, enabled }
 *   add:    { sourceCode, groupKey, name, regionV2?, cityCode? } (Chợ Tốt)
 *   delete: { sourceCode, groupKey, purge: boolean } — purge=xoá cả posts
 *           stg_zalo_posts theo group_name (vô hiệu hóa với dữ liệu S06).
 *   set-mode: { id, mode: "cho" | "bung" | "duy_tri", burstUntil? } — CHỈ phiên admin (Bearer máy không đủ: bật
 *           Bùng là tăng tải, người duyệt từng lần); luật + giao dịch kèm audit ở lib/che-do-thu.ts.
 * Mọi action ghi ops_audit (actor, action, detail).
 */
async function auth(req: Request): Promise<boolean> {
  const expected = process.env.OPS_API_TOKEN;
  const bearer = req.headers.get("authorization") ?? "";
  if (!!expected && bearer === `Bearer ${expected}`) return true;
  return canAccessOps(await getSessionUser());
}

/**
 * TV2a `vong-doi-nguon`: đã áp migration 047 chưa (source_groups có cột status)? Hỏi mỗi lần ghi, không cache — tiến trình
 * app mở trước lúc áp 047 phải tự sang đường mới. Chưa áp → route chạy như trước (ghi enabled). Nhánh cũ bỏ ở TV5.
 */
async function coVongDoi(): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'source_groups' AND column_name = 'status'`,
  );
  return rows.length > 0;
}

const LY_DO_MAC_DINH = "tắt bằng công tắc /ops/sources"; // Hỏi-1 Cổng Phạm vi TV2a: trang chưa có ô nhập lý do

/** Bật/tắt theo vòng đời: tắt → paused kèm lý do; bật → active, xoá lý do; nhóm đã gỡ hay đã xong không bật lại (409). */
async function toggleVongDoi(b: Record<string, unknown>, sourceCode: string, groupKey: string) {
  const bat = Boolean(b.enabled);
  const to = bat ? "active" : "paused";
  const reason = typeof b.reason === "string" && b.reason.trim() ? b.reason.trim() : LY_DO_MAC_DINH;
  const resumeWhen = typeof b.resumeWhen === "string" && b.resumeWhen.trim() ? b.resumeWhen.trim() : null;
  const c = await pool.connect();
  let from: string;
  try {
    await c.query("BEGIN");
    const cu = (
      await c.query<{ status: string }>(
        "SELECT status FROM source_groups WHERE source_code = $1 AND group_key = $2 FOR UPDATE",
        [sourceCode, groupKey],
      )
    ).rows[0];
    if (!cu) {
      await c.query("ROLLBACK");
      return NextResponse.json({ ok: false });
    }
    if (bat && (cu.status === "retired" || cu.status === "completed")) {
      await c.query("ROLLBACK");
      return NextResponse.json({ error: "nhóm đã gỡ — không bật lại" }, { status: 409 });
    }
    if (cu.status === to) {
      await c.query("ROLLBACK");
      return NextResponse.json({ ok: true, unchanged: true });
    }
    await c.query(
      bat
        ? `UPDATE source_groups SET status = 'active', enabled = true, reason = NULL, resume_when = NULL, updated_at = now()
           WHERE source_code = $1 AND group_key = $2`
        : `UPDATE source_groups SET status = 'paused', enabled = false, reason = $3, resume_when = $4, updated_at = now()
           WHERE source_code = $1 AND group_key = $2`,
      bat ? [sourceCode, groupKey] : [sourceCode, groupKey, reason, resumeWhen],
    );
    await c.query("COMMIT");
    from = cu.status;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
  await auditOpsWrite("ops-user", "source-group:toggle", { sourceCode, groupKey, enabled: bat, from, to });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!(await auth(new Request("http://x")))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { rows } = await pool.query(
    `SELECT g.id, g.source_code, g.group_key, g.name, g.enabled, g.params, g.note,
            g.created_at::text, g.updated_at::text,
            (SELECT count(*)::int FROM stg_zalo_posts z
              WHERE z.agent_id = 'apify-facebook' AND z.group_name = g.name) AS fb_posts
     FROM source_groups g WHERE g.source_code IN ('S05', 'S06') ORDER BY g.source_code, g.id`,
  );
  return NextResponse.json({ groups: rows });
}

export async function POST(req: Request) {
  if (!(await auth(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b?.action) return NextResponse.json({ error: "thiếu action" }, { status: 400 });
  if (b.action === "set-mode") {
    const r = await datCheDo(b, getSessionUser);
    return NextResponse.json(r.body, { status: r.status });
  }
  const sourceCode = String(b.sourceCode ?? "");
  const groupKey = String(b.groupKey ?? "");
  // PL12: đơn vị S02/S03 của sổ không quản ở đây (nhóm S03 là bản soi gateway — bật/tắt là việc của TV6).
  if (["toggle", "add", "delete"].includes(String(b.action)) && sourceCode && !NHOM_TRANG_CU.includes(sourceCode)) {
    return NextResponse.json({ error: LOI_NGOAI_NHOM }, { status: 400 });
  }

  if (b.action === "toggle") {
    if (!sourceCode || !groupKey) {
      return NextResponse.json({ error: "thiếu sourceCode/groupKey" }, { status: 400 });
    }
    if (await coVongDoi()) return toggleVongDoi(b, sourceCode, groupKey);
    const { rowCount } = await pool.query(
      `UPDATE source_groups SET enabled = $1, updated_at = now()
       WHERE source_code = $2 AND group_key = $3`,
      [Boolean(b.enabled), sourceCode, groupKey],
    );
    await auditOpsWrite("ops-user", "source-group:toggle", { sourceCode, groupKey, enabled: b.enabled });
    return NextResponse.json({ ok: rowCount === 1 });
  }

  if (b.action === "add") {
    const name = String(b.name ?? "").trim();
    if (!sourceCode || !groupKey || !name) {
      return NextResponse.json({ error: "thiếu sourceCode/groupKey/name" }, { status: 400 });
    }
    if (!groupKey.startsWith("http") && sourceCode === "S05") {
      return NextResponse.json({ error: "nhóm S05 cần URL https://www.facebook.com/groups/…" }, { status: 400 });
    }
    const params: Record<string, unknown> = {};
    if (b.regionV2) params.region_v2 = Number(b.regionV2);
    if (b.cityCode) params.cityCode = String(b.cityCode);
    try {
      await pool.query(
        (await coVongDoi())
          ? `INSERT INTO source_groups (source_code, group_key, name, status, params)
             VALUES ($1, $2, $3, 'active', $4::jsonb)`
          : `INSERT INTO source_groups (source_code, group_key, name, enabled, params)
             VALUES ($1, $2, $3, true, $4::jsonb)`,
        [sourceCode, groupKey, name, JSON.stringify(params)],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("unique")) {
        return NextResponse.json({ error: "nhóm đã tồn tại" }, { status: 409 });
      }
      throw e;
    }
    await auditOpsWrite("ops-user", "source-group:add", { sourceCode, groupKey, name });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "delete") {
    if (!sourceCode || !groupKey) {
      return NextResponse.json({ error: "thiếu sourceCode/groupKey" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `SELECT name FROM source_groups WHERE source_code = $1 AND group_key = $2`,
      [sourceCode, groupKey],
    );
    const name = rows[0]?.name;
    let purged = 0;
    if (b.purge && name && sourceCode === "S05") {
      // xoá chọn lọc dữ liệu nhóm bị bỏ (nỗi "xoá cũng mệt" — giờ 1 click)
      const r = await pool.query(
        `DELETE FROM stg_zalo_posts WHERE agent_id = 'apify-facebook' AND group_name = $1`,
        [name],
      );
      purged = r.rowCount ?? 0;
    }
    await pool.query(`DELETE FROM source_groups WHERE source_code = $1 AND group_key = $2`, [
      sourceCode,
      groupKey,
    ]);
    await auditOpsWrite("ops-user", "source-group:delete", { sourceCode, groupKey, purge: purged });
    return NextResponse.json({ ok: true, purged });
  }

  return NextResponse.json({ error: `action lạ: ${String(b.action)}` }, { status: 400 });
}
