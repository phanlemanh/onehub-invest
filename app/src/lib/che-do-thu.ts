// Đổi chế độ thu của một điểm thu (source_groups.params) — chỉ admin; ghi params và ops_audit trong CÙNG giao dịch, vì
// mỗi lần bật Bùng là một lần Mạnh duyệt (vet-dau-loang §6 Hỏi-3) và auditOpsWrite (ghi nền, nuốt lỗi) không bảo đảm vết.
// Detail audit chỉ mang id + mã nguồn: group_key của S05 là URL nhóm (tầng A). Máy hạ ở pipeline/ha-bung-het-han.mjs.
import type { Pool } from "pg"

import type { GroupRow } from "@/components/ops/sources/source-groups"

import type { User } from "./auth"
import { homNayVN, kiemCheDo } from "./che-do-thu-luat"
import { pool } from "./db"
import { isAdmin } from "./ops-access"

export * from "./che-do-thu-luat"

type Ket = { status: number; body: Record<string, unknown> }

/** Các điểm thu cho lưới /ops/sources — MỘT câu đọc dùng chung cho trang (sources-content) và phép đo (che-do-thu.test):
 *  chế độ, hạn bùng, ngày vào chế độ rút từ params; id bigserial ép số cho khớp thân set-mode. */
/** PL12: source_groups là view gồm mọi đơn vị của sổ; trang nhóm thu cũ chỉ quản S05/S06 — đơn vị S02/S03 ở khu
 *  «Sổ đơn vị thu», bật/tắt S03 là việc của TV6. */
export const NHOM_TRANG_CU = ["S05", "S06"]
export const LOI_NGOAI_NHOM = "chỉ quản nhóm S05/S06 ở đây"

export async function docNhomThu(db: Pick<Pool, "query"> = pool): Promise<GroupRow[]> {
  const { rows } = await db.query<GroupRow>(
    `SELECT g.id::int AS id, g.source_code, g.group_key, g.name, g.enabled, g.note,
            g.params->>'mode' AS mode, g.params->>'burst_until' AS burst_until, g.params->>'mode_since' AS mode_since,
            (SELECT count(*)::int FROM stg_zalo_posts z
              WHERE z.agent_id = 'apify-facebook' AND z.group_name = g.name) AS fb_posts
     FROM source_groups g WHERE g.source_code IN ('S05', 'S06') ORDER BY g.source_code, g.id`,
  )
  return rows
}

export async function datCheDo(
  body: Record<string, unknown>,
  getUser: () => Promise<User | null>,
  { db = pool, now = new Date() }: { db?: Pick<Pool, "connect">; now?: Date } = {},
): Promise<Ket> {
  const user = await getUser()
  if (!isAdmin(user)) return { status: 403, body: { error: "chỉ quản trị viên đổi được chế độ thu" } }
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) return { status: 400, body: { error: "thiếu id nhóm" } }
  const homNay = homNayVN(now)
  const k = kiemCheDo(body.mode, body.burstUntil, homNay)
  if (!k.ok) return { status: 400, body: { error: k.error } }

  const c = await db.connect()
  try {
    await c.query("BEGIN")
    const { rows } = await c.query<{ source_code: string; params: Record<string, unknown> | null }>(
      "SELECT source_code, params FROM source_groups WHERE id = $1 FOR UPDATE",
      [id],
    )
    if (!rows[0]) {
      await c.query("ROLLBACK")
      return { status: 404, body: { error: "không có nhóm này" } }
    }
    if (!NHOM_TRANG_CU.includes(rows[0].source_code)) {
      await c.query("ROLLBACK")
      return { status: 400, body: { error: LOI_NGOAI_NHOM } }
    }
    const cu = rows[0].params ?? {}
    const from = typeof cu.mode === "string" ? cu.mode : null
    const hanCu = typeof cu.burst_until === "string" ? cu.burst_until : null
    if (from === k.mode && hanCu === k.burstUntil) {
      await c.query("ROLLBACK")
      return { status: 200, body: { ok: true, unchanged: true, mode: from, burst_until: hanCu, mode_since: cu.mode_since ?? null } }
    }
    const moi: Record<string, unknown> = { ...cu, mode: k.mode, mode_since: from === k.mode ? (cu.mode_since ?? homNay) : homNay }
    if (k.burstUntil) moi.burst_until = k.burstUntil
    else delete moi.burst_until
    await c.query("UPDATE source_groups SET params = $1::jsonb, updated_at = now() WHERE id = $2", [JSON.stringify(moi), id])
    await c.query(
      `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'unit.set_mode', $2, $3::jsonb)`,
      [
        `user:${user!.id}`,
        process.env.VERCEL === "1" ? "cloud" : "local",
        JSON.stringify({ thao_tac: "set-mode", id, source_code: rows[0].source_code, from, to: k.mode, burst_until: k.burstUntil, burst_until_cu: hanCu }),
      ],
    )
    await c.query("COMMIT")
    return { status: 200, body: { ok: true, mode: k.mode, burst_until: k.burstUntil, mode_since: moi.mode_since } }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    console.error("set-mode failed:", e instanceof Error ? e.message : e)
    return { status: 500, body: { error: "không ghi được chế độ thu" } }
  } finally {
    c.release()
  }
}
