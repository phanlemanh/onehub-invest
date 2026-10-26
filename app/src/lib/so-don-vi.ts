// Sổ đơn vị thu (PL12 `so-nhom-mot-noi`): đọc sổ collection_units cho khu «Sổ đơn vị thu» trên /ops/sources và ghi
// thị trường, dự án của một đơn vị — chỉ admin, ghi sổ và ops_audit trong CÙNG giao dịch (như che-do-thu.ts). Khoá nhóm
// (group_key: URL nhóm S05, id nhóm S03) không bao giờ rời hàm đọc; detail audit chỉ mang mã đơn vị. Sổ là tầng A, chỉ có
// ở máy thu (không lên cloud — đi cùng TV4/TV11).
import type { Pool } from "pg"

import type { User } from "./auth"
import { pool } from "./db"
import { isAdmin } from "./ops-access"

export type DonViRow = {
  unit_code: string
  source_code: string
  unit_type: string
  original_name: string
  market_codes: string[]
  project_node_ids: number[]
  status: string
  reason: string | null
}
export type DanhMuc = { markets: { id: string; name: string }[]; projects: { id: number; name: string }[] }
type Ket = { status: number; body: Record<string, unknown> }

/** Mọi đơn vị của sổ, theo nguồn rồi mã; null khi chưa có bảng sổ. Ném khi DB lỗi — bên gọi hiện vùng lỗi. */
export async function docSoDonVi(db: Pick<Pool, "query"> = pool): Promise<DonViRow[] | null> {
  // Chưa có sổ (máy chưa áp 048, hay cloud — sổ là tầng A): null = không vẽ khu sổ, như các vùng chỉ có ở máy thu khác.
  const { rows: co } = await db.query<{ co: boolean }>(`SELECT to_regclass('collection_units') IS NOT NULL AS co`)
  if (!co[0]?.co) return null
  const { rows } = await db.query<DonViRow>(
    `SELECT unit_code, source_code, unit_type, original_name, market_codes, project_node_ids::int[] AS project_node_ids,
            status, reason
       FROM collection_units ORDER BY source_code, unit_code`,
  )
  return rows
}

/** Danh mục để khai: thị trường (areas cấp market) và khu đô thị (asset_nodes project — Hỏi-3). */
export async function docDanhMuc(db: Pick<Pool, "query"> = pool): Promise<DanhMuc> {
  const [markets, projects] = await Promise.all([
    db.query<{ id: string; name: string }>(`SELECT id, name FROM areas WHERE region_type = 'market' ORDER BY name`),
    db.query<{ id: number; name: string }>(`SELECT id::int AS id, name FROM asset_nodes WHERE node_type = 'project' ORDER BY name`),
  ])
  return { markets: markets.rows, projects: projects.rows }
}

const chuoiDuyNhat = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every((x) => typeof x === "string") ? [...new Set(v as string[])] : null
const soDuyNhat = (v: unknown): number[] | null =>
  Array.isArray(v) && v.every((x) => Number.isInteger(x) && (x as number) > 0) ? [...new Set(v as number[])] : null

/**
 * Action `set-meta` của route source-groups: { unitCode, marketCodes: string[], projectNodeIds: number[] }. Mảng rỗng xoá
 * khai báo; phần tử trùng gộp lại. Kiểm tham chiếu do trigger của 048 (collection_units_kiem_tham_chieu) — sai thì 400
 * kèm chữ lỗi của DB. Bearer máy không đủ: khai là quyết định của người.
 */
export async function khaiDonVi(
  body: Record<string, unknown>,
  getUser: () => Promise<User | null>,
  { db = pool }: { db?: Pick<Pool, "connect"> } = {},
): Promise<Ket> {
  // Không đọc được danh tính (Bearer máy, ngoài phiên) = không có người → 403, không 500.
  const user = await getUser().catch(() => null)
  if (!isAdmin(user)) return { status: 403, body: { error: "chỉ quản trị viên khai được đơn vị thu" } }
  const unitCode = typeof body.unitCode === "string" ? body.unitCode : ""
  const marketCodes = chuoiDuyNhat(body.marketCodes)
  const projectNodeIds = soDuyNhat(body.projectNodeIds)
  if (!unitCode || !marketCodes || !projectNodeIds) {
    return { status: 400, body: { error: "cần unitCode, marketCodes (mảng mã) và projectNodeIds (mảng số)" } }
  }

  const c = await db.connect()
  try {
    await c.query("BEGIN")
    const { rows } = await c.query<{ market_codes: string[]; project_node_ids: number[] }>(
      `SELECT market_codes, project_node_ids::int[] AS project_node_ids FROM collection_units WHERE unit_code = $1 FOR UPDATE`,
      [unitCode],
    )
    if (!rows[0]) {
      await c.query("ROLLBACK")
      return { status: 404, body: { error: "không có đơn vị này" } }
    }
    try {
      await c.query(
        `UPDATE collection_units SET market_codes = $2, project_node_ids = $3, updated_at = now() WHERE unit_code = $1`,
        [unitCode, marketCodes, projectNodeIds],
      )
    } catch (e) {
      await c.query("ROLLBACK")
      if ((e as { code?: string }).code === "23514") return { status: 400, body: { error: (e as Error).message } }
      throw e
    }
    await c.query(
      `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'source-group:set-meta', $2, $3::jsonb)`,
      [
        `user:${user!.id}`,
        process.env.VERCEL === "1" ? "cloud" : "local",
        JSON.stringify({ unit_code: unitCode, from: rows[0], to: { market_codes: marketCodes, project_node_ids: projectNodeIds } }),
      ],
    )
    await c.query("COMMIT")
    return { status: 200, body: { ok: true, market_codes: marketCodes, project_node_ids: projectNodeIds } }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    console.error("set-meta failed:", e instanceof Error ? e.message : e)
    return { status: 500, body: { error: "không ghi được khai báo đơn vị" } }
  } finally {
    c.release()
  }
}
