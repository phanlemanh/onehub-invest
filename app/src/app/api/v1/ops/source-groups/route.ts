import { NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { kiemQuyen } from "@/lib/ops-access";
import { ghiAuditTrong, trongGiaoDich } from "@/lib/audit";
import { LOI_NGOAI_NHOM, NHOM_TRANG_CU, datCheDo } from "@/lib/che-do-thu";
import { khaiDonVi } from "@/lib/so-don-vi";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/ops/source-groups — danh sách nhóm cấu hình S05, S06 kèm volume dữ liệu đã thu theo nhóm (đơn vị
 * S02/S03 của sổ không lên đây — PL12; mã khác ở toggle/add/delete/set-mode → 400).
 * POST { action: "toggle" | "add" | "delete" | "set-mode", ... } — quản trị nhóm nguồn.
 *   toggle: { sourceCode, groupKey, enabled }
 *   add:    { sourceCode, groupKey, name, regionV2?, cityCode? } (Chợ Tốt)
 *   delete: { sourceCode, groupKey, purge: boolean } — purge=xoá cả posts
 *           stg_zalo_posts theo group_name (vô hiệu hóa với dữ liệu S06).
 *   set-meta: { unitCode, marketCodes, projectNodeIds } — CHỈ phiên admin: khai thị trường, dự án một đơn vị của sổ
 *           (PL12, lib/so-don-vi.ts; ghi sổ + audit cùng giao dịch).
 *   set-mode: { id, mode: "cho" | "bung" | "duy_tri", burstUntil? } — CHỈ phiên admin (Bearer máy không đủ: bật
 *           Bùng là tăng tải, người duyệt từng lần); luật + giao dịch kèm audit ở lib/che-do-thu.ts.
 * Quyền theo bảng ở lib/ops-access.ts (TV1): GET `ops.read` (bearer được); mỗi action POST một hành động admin
 * (toggle `unit.toggle`, add `unit.create`, delete `unit.delete`, set-mode `unit.set_mode`, set-meta `unit.update_meta`).
 * Mọi action ghi đúng một dòng ops_audit mang `user:<id>`, cùng transaction với thao tác.
 */

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

/** Chữ 409 theo trạng thái cuối (hồ sơ cong-tac-khong-ha-nhom-go): nhóm đã gỡ hay đã xong — công tắc không đổi gì. */
const CHU_KHONG_DOI: Record<string, { bat: string; tat: string }> = {
  retired: { bat: "nhóm đã gỡ — không bật lại", tat: "nhóm đã gỡ — công tắc không đổi trạng thái" },
  completed: { bat: "nhóm đã xong — không bật lại", tat: "nhóm đã xong — công tắc không đổi trạng thái" },
};

/**
 * Bật/tắt theo ma trận 5 × 2 của TV2a (design cong-tac-khong-ha-nhom-go): bật → active (xoá lý do), trừ nhóm đã gỡ hay đã
 * xong (409); tắt chỉ hạ nhóm đang thu (active → paused kèm lý do) — nhóm paused/draft giữ nguyên, nhóm đã gỡ hay đã xong
 * trả 409 có chữ (Hỏi-1). Ô không đổi không ghi gì, kể cả nhật ký.
 */
async function toggleVongDoi(b: Record<string, unknown>, sourceCode: string, groupKey: string, actor: string) {
  const bat = Boolean(b.enabled);
  const to = bat ? "active" : "paused";
  const reason = typeof b.reason === "string" && b.reason.trim() ? b.reason.trim() : LY_DO_MAC_DINH;
  const resumeWhen = typeof b.resumeWhen === "string" && b.resumeWhen.trim() ? b.resumeWhen.trim() : null;
  const c = await pool.connect();
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
    const chu = CHU_KHONG_DOI[cu.status];
    if (chu) {
      await c.query("ROLLBACK");
      return NextResponse.json({ error: bat ? chu.bat : chu.tat }, { status: 409 });
    }
    // Tắt chỉ hạ nhóm đang thu; nhóm paused/draft giữ nguyên (TV2a: «không đổi»).
    if (cu.status === to || (!bat && cu.status !== "active")) {
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
    await ghiAuditTrong(c, actor, "unit.toggle", { thao_tac: "toggle", sourceCode, groupKey, enabled: bat, from: cu.status, to });
    await c.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    console.error("toggle failed:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "không ghi được công tắc" }, { status: 500 });
  } finally {
    c.release();
  }
}

export async function GET(req: Request) {
  // TVN3: kiểm trên request thật — bearer của máy đọc được danh sách (hôm nay request rỗng làm bearer luôn trượt).
  const q = await kiemQuyen(req, "ops.read");
  if (!q.ok) return q.res;
  const { rows } = await pool.query(
    `SELECT g.id, g.source_code, g.group_key, g.name, g.enabled, g.params, g.note,
            g.created_at::text, g.updated_at::text,
            (SELECT count(*)::int FROM stg_zalo_posts z
              WHERE z.agent_id = 'apify-facebook' AND z.group_name = g.name) AS fb_posts
     FROM source_groups g WHERE g.source_code IN ('S05', 'S06') ORDER BY g.source_code, g.id`,
  );
  return NextResponse.json({ groups: rows });
}

/** Lỗi ghi trong transaction: 409 nếu trùng khoá, còn lại 500 — dòng audit không bao giờ còn khi thao tác hỏng. */
function loiGhi(e: unknown, viec: string): NextResponse {
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("unique")) return NextResponse.json({ error: "nhóm đã tồn tại" }, { status: 409 });
  console.error(`${viec} failed:`, msg);
  return NextResponse.json({ error: `không ghi được (${viec})` }, { status: 500 });
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (b?.action === "set-meta") {
    const q = await kiemQuyen(req, "unit.update_meta");
    if (!q.ok) return q.res;
    const r = await khaiDonVi(b, async () => q.nguoi);
    return NextResponse.json(r.body, { status: r.status });
  }
  if (b?.action === "set-mode") {
    const q = await kiemQuyen(req, "unit.set_mode");
    if (!q.ok) return q.res;
    const r = await datCheDo(b, async () => q.nguoi);
    return NextResponse.json(r.body, { status: r.status });
  }
  if (!b || !["toggle", "add", "delete"].includes(String(b.action))) {
    // Thiếu action hay action lạ: vẫn qua cổng quản trị trước khi trả 400 (người ngoài nhận 401/403, không đọc được luật).
    const q = await kiemQuyen(req, "unit.create");
    if (!q.ok) return q.res;
    return NextResponse.json({ error: b?.action ? `action lạ: ${String(b.action)}` : "thiếu action" }, { status: 400 });
  }
  const sourceCode = String(b.sourceCode ?? "");
  const groupKey = String(b.groupKey ?? "");
  // PL12: đơn vị S02/S03 của sổ không quản ở đây (nhóm S03 là bản soi gateway — bật/tắt là việc của TV6).
  if (["toggle", "add", "delete"].includes(String(b.action)) && sourceCode && !NHOM_TRANG_CU.includes(sourceCode)) {
    return NextResponse.json({ error: LOI_NGOAI_NHOM }, { status: 400 });
  }

  if (b.action === "toggle") {
    const q = await kiemQuyen(req, "unit.toggle");
    if (!q.ok) return q.res;
    if (!sourceCode || !groupKey) {
      return NextResponse.json({ error: "thiếu sourceCode/groupKey" }, { status: 400 });
    }
    if (await coVongDoi()) return toggleVongDoi(b, sourceCode, groupKey, q.actor);
    try {
      const rowCount = await trongGiaoDich(async (c) => {
        const r = await c.query(
          `UPDATE source_groups SET enabled = $1, updated_at = now()
       WHERE source_code = $2 AND group_key = $3`,
          [Boolean(b.enabled), sourceCode, groupKey],
        );
        if (r.rowCount === 1) {
          await ghiAuditTrong(c, q.actor, "unit.toggle", { thao_tac: "toggle", sourceCode, groupKey, enabled: b.enabled, to: Boolean(b.enabled) });
        }
        return r.rowCount;
      });
      return NextResponse.json({ ok: rowCount === 1 });
    } catch (e) {
      return loiGhi(e, "toggle");
    }
  }

  if (b.action === "add") {
    const q = await kiemQuyen(req, "unit.create");
    if (!q.ok) return q.res;
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
    const vongDoi = await coVongDoi();
    try {
      await trongGiaoDich(async (c) => {
        await c.query(
          vongDoi
            ? `INSERT INTO source_groups (source_code, group_key, name, status, params)
             VALUES ($1, $2, $3, 'active', $4::jsonb)`
            : `INSERT INTO source_groups (source_code, group_key, name, enabled, params)
             VALUES ($1, $2, $3, true, $4::jsonb)`,
          [sourceCode, groupKey, name, JSON.stringify(params)],
        );
        await ghiAuditTrong(c, q.actor, "unit.create", { thao_tac: "add", sourceCode, groupKey, name, from: null, to: vongDoi ? "active" : "enabled" });
      });
    } catch (e) {
      return loiGhi(e, "add");
    }
    return NextResponse.json({ ok: true });
  }

  if (b.action === "delete") {
    const q = await kiemQuyen(req, "unit.delete");
    if (!q.ok) return q.res;
    if (!sourceCode || !groupKey) {
      return NextResponse.json({ error: "thiếu sourceCode/groupKey" }, { status: 400 });
    }
    try {
      const purged = await trongGiaoDich(async (c) => {
        const { rows } = await c.query(
          `SELECT name FROM source_groups WHERE source_code = $1 AND group_key = $2`,
          [sourceCode, groupKey],
        );
        const name = rows[0]?.name;
        let purged = 0;
        if (b.purge && name && sourceCode === "S05") {
          // xoá chọn lọc dữ liệu nhóm bị bỏ (nỗi "xoá cũng mệt" — giờ 1 click)
          const r = await c.query(
            `DELETE FROM stg_zalo_posts WHERE agent_id = 'apify-facebook' AND group_name = $1`,
            [name],
          );
          purged = r.rowCount ?? 0;
        }
        const del = await c.query(`DELETE FROM source_groups WHERE source_code = $1 AND group_key = $2`, [
          sourceCode,
          groupKey,
        ]);
        if (del.rowCount) {
          await ghiAuditTrong(c, q.actor, "unit.delete", { thao_tac: "delete", sourceCode, groupKey, purge: purged, from: { name }, to: null });
        }
        return purged;
      });
      return NextResponse.json({ ok: true, purged });
    } catch (e) {
      return loiGhi(e, "delete");
    }
  }

  return NextResponse.json({ error: `action lạ: ${String(b.action)}` }, { status: 400 });
}
