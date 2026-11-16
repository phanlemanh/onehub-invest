// Thẻ địa chỉ nhóm S03 (TG1 `the-dia-chi-nhom-s03`): đọc thẻ cho khu «Sổ đơn vị thu» trên /ops/sources và ghi quyết định
// nhận · sửa · bác của người vận hành. Khoá nhóm (group_key) KHÔNG BAO GIỜ rời hàm đọc — mọi thứ đi ra dùng card_code; tên nhóm trùng khoá (hay chỉ là dãy số) thì trả NULL (AC-6).
// Ghi thẻ, lịch sử thẻ và ops_audit trong CÙNG giao dịch; version lệch → 409. Bảng chỉ ở máy thu: chưa có bảng → null.
import type { Pool } from "pg"

import type { User } from "./auth"
import { pool } from "./db"

export type TrangThaiThe = "nhap" | "da_duyet" | "bac"
export type MucDich = "ban" | "thue" | "ca_hai"
export type CanCuO = { nguon: string | null; so_bai: number; [k: string]: unknown }
export type TheDiaChi = {
  card_code: string
  unit_code: string | null
  ten_nhom: string | null
  status: TrangThaiThe
  du_an: { id: number; name: string }[]
  phuong: { id: string; name: string } | null
  tinh: { id: string; name: string } | null
  phan_khu: { id: number; name: string } | null
  muc_dich: MucDich | null
  evidence: { so_bai?: number; so_bai_doc?: number; du_an?: CanCuO; phuong?: CanCuO; phan_khu?: CanCuO; muc_dich?: CanCuO & { ban?: number; thue?: number } }
  version: number
  decided_at: string | null
  decision_note: string | null
}
export type DanhMucThe = {
  projects: { id: number; name: string }[]
  wards: { id: string; name: string; province: string }[]
  subzones: { id: number; name: string; parent_id: number }[]
}
type Ket = { status: number; body: Record<string, unknown> }
type Db = Pick<Pool, "query">

const coBang = async (db: Db) =>
  Boolean((await db.query<{ co: boolean }>(`SELECT to_regclass('group_address_cards') IS NOT NULL AS co`)).rows[0]?.co)

/** Mọi thẻ, theo mã sổ rồi mã thẻ (nhóm chưa có trong sổ đứng cuối); null khi chưa có bảng thẻ (cloud, máy chưa áp 108). */
export async function docTheDiaChi(db: Db = pool): Promise<TheDiaChi[] | null> {
  if (!(await coBang(db))) return null
  const { rows } = await db.query<TheDiaChi>(
    `SELECT t.card_code, t.unit_code, (SELECT CASE WHEN n.x IS NULL OR n.x = t.group_key OR n.x = u.group_key
                         OR n.x = regexp_replace(u.group_key, '^([^:]+:)?group:(?=.)', '') OR n.x ~ '^[0-9]{8,}$' THEN NULL ELSE n.x END
               FROM collection_units u CROSS JOIN LATERAL (SELECT coalesce(nullif(btrim(u.original_name), ''), nullif(btrim(u.name), '')) AS x) n
              WHERE u.unit_code = t.unit_code) AS ten_nhom, t.status, t.purpose AS muc_dich, t.evidence, t.version,
            t.decided_at::text AS decided_at, t.decision_note,
            coalesce((SELECT json_agg(json_build_object('id', n.id::int, 'name', n.name) ORDER BY array_position(t.project_node_ids, n.id))
                        FROM asset_nodes n WHERE n.id = ANY (t.project_node_ids)), '[]'::json) AS du_an,
            (SELECT json_build_object('id', a.id, 'name', a.name) FROM areas a WHERE a.id = t.area_id) AS phuong,
            (SELECT json_build_object('id', a.id, 'name', a.name) FROM areas a WHERE a.id = t.province_area_id) AS tinh,
            (SELECT json_build_object('id', n.id::int, 'name', n.name) FROM asset_nodes n WHERE n.id = t.subzone_node_id) AS phan_khu
       FROM group_address_cards t
      ORDER BY t.unit_code NULLS LAST, t.card_code`,
  )
  return rows
}

/** Danh mục để sửa thẻ: dự án, phường (kèm tỉnh), phân khu/toà (kèm dự án cha). */
export async function docDanhMucThe(db: Db = pool): Promise<DanhMucThe> {
  const [projects, wards, subzones] = await Promise.all([
    db.query<{ id: number; name: string }>(`SELECT id::int AS id, name FROM asset_nodes WHERE node_type = 'project' ORDER BY name`),
    db.query<{ id: string; name: string; province: string }>(
      `SELECT w.id, w.name, p.name AS province FROM areas w JOIN areas p ON p.id = w.parent_id
        WHERE w.region_type = 'submarket' ORDER BY p.name, w.name`,
    ),
    db.query<{ id: number; name: string; parent_id: number }>(
      `SELECT id::int AS id, name, parent_id::int AS parent_id FROM asset_nodes
        WHERE node_type IN ('subzone', 'building') AND parent_id IS NOT NULL ORDER BY name`,
    ),
  ])
  return { projects: projects.rows, wards: wards.rows, subzones: subzones.rows }
}

const HANH_DONG = ["nhan", "sua", "bac"] as const
type HanhDongThe = (typeof HANH_DONG)[number]
const MUC_DICH: MucDich[] = ["ban", "thue", "ca_hai"]

const banThe = (r: Record<string, unknown>) => ({
  unit_code: r.unit_code, status: r.status,
  du_an: ((r.project_node_ids as (string | number)[]) ?? []).map(Number), phuong: r.area_id, tinh: r.province_area_id,
  phan_khu: r.subzone_node_id == null ? null : Number(r.subzone_node_id), muc_dich: r.purpose,
})

/** Đọc giá trị sửa; trả lỗi chữ khi sai dạng. */
function docGiaTri(v: unknown): { ok: true; gt: { du_an: number[]; phuong: string | null; phan_khu: number | null; muc_dich: MucDich | null } } | { ok: false; loi: string } {
  if (!v || typeof v !== "object") return { ok: false, loi: "sửa cần values" }
  const o = v as Record<string, unknown>
  const duAn = o.projectNodeIds
  if (!Array.isArray(duAn) || !duAn.every((x) => Number.isInteger(x) && (x as number) > 0)) return { ok: false, loi: "ô du_an: cần mảng mã dự án" }
  if (new Set(duAn).size > 3) return { ok: false, loi: "ô du_an: tối đa 3 dự án" }
  const phuong = o.areaId == null || o.areaId === "" ? null : typeof o.areaId === "string" ? o.areaId : undefined
  if (phuong === undefined) return { ok: false, loi: "ô phuong: cần mã phường" }
  const pk = o.subzoneNodeId == null ? null : Number.isInteger(o.subzoneNodeId) ? (o.subzoneNodeId as number) : undefined
  if (pk === undefined) return { ok: false, loi: "ô phan_khu: cần mã phân khu" }
  const md = o.purpose == null || o.purpose === "" ? null : MUC_DICH.includes(o.purpose as MucDich) ? (o.purpose as MucDich) : undefined
  if (md === undefined) return { ok: false, loi: "ô muc_dich: chỉ ban, thue, ca_hai" }
  return { ok: true, gt: { du_an: [...new Set(duAn as number[])], phuong, phan_khu: pk, muc_dich: md } }
}

/**
 * Action `card-decide` của route source-groups: { cardCode, version, card: nhan|sua|bac, values?, note? }. Quyền
 * `unit.card_decide` (vai ops) kiểm ở route; hàm này nhận người đã qua cổng. Nhận giữ giá trị nháp; sửa ghi giá trị mới (tỉnh
 * suy từ phường); bác đòi lý do ≥ 3 ký tự. Lỗi tham chiếu của trigger 108 → 400 nêu ô.
 */
export async function quyetThe(
  body: Record<string, unknown>,
  nguoi: User,
  { db = pool }: { db?: Pick<Pool, "connect"> } = {},
): Promise<Ket> {
  const cardCode = typeof body.cardCode === "string" ? body.cardCode : ""
  const version = Number.isInteger(body.version) ? (body.version as number) : NaN
  const action = HANH_DONG.includes(body.card as HanhDongThe) ? (body.card as HanhDongThe) : null
  if (!cardCode || !Number.isFinite(version) || !action) return { status: 400, body: { error: "cần cardCode, version và card nhan|sua|bac" } }
  const note = typeof body.note === "string" ? body.note.trim() : ""
  if (action === "bac" && note.length < 3) return { status: 400, body: { error: "bác thẻ cần lý do (từ 3 ký tự)" } }
  const sua = action === "sua" ? docGiaTri(body.values) : null
  if (sua && !sua.ok) return { status: 400, body: { error: sua.loi } }

  const c = await db.connect()
  try {
    await c.query("BEGIN")
    const { rows } = await c.query(`SELECT * FROM group_address_cards WHERE card_code = $1 FOR UPDATE`, [cardCode])
    const cu = rows[0]
    if (!cu) {
      await c.query("ROLLBACK")
      return { status: 404, body: { error: "không có thẻ này" } }
    }
    if (cu.version !== version) {
      await c.query("ROLLBACK")
      return { status: 409, body: { error: "thẻ đã đổi từ lúc anh mở — tải lại thẻ rồi làm lại", version: cu.version } }
    }
    const nguoiKy = `user:${nguoi.id}`
    let moi
    try {
      if (action === "sua" && sua?.ok) {
        const g = sua.gt
        moi = (await c.query(
          `UPDATE group_address_cards SET project_node_ids = $2, area_id = $3,
                  province_area_id = (SELECT parent_id FROM areas WHERE id = $3), subzone_node_id = $4, purpose = $5,
                  status = 'da_duyet', version = version + 1, decided_by = $6, decided_at = now(), decision_note = NULLIF($7, '')
            WHERE card_code = $1 RETURNING *`,
          [cardCode, g.du_an, g.phuong, g.phan_khu, g.muc_dich, nguoiKy, note],
        )).rows[0]
      } else {
        moi = (await c.query(
          `UPDATE group_address_cards SET status = $2, version = version + 1, decided_by = $3, decided_at = now(),
                  decision_note = NULLIF($4, '') WHERE card_code = $1 RETURNING *`,
          [cardCode, action === "bac" ? "bac" : "da_duyet", nguoiKy, note],
        )).rows[0]
      }
    } catch (e) {
      await c.query("ROLLBACK")
      if ((e as { code?: string }).code === "23514") {
        const m = /o (\w+)/.exec((e as Error).message)
        return { status: 400, body: { error: (e as Error).message, o: m?.[1] ?? null } }
      }
      throw e
    }
    await c.query(
      `INSERT INTO group_address_card_history (card_code, version, action, actor, before, after) VALUES ($1, $2, $3, $4, $5, $6)`,
      [cardCode, moi.version, action, nguoiKy, banThe(cu), banThe(moi)],
    )
    await c.query(`INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'unit.card_decide', $2, $3::jsonb)`, [
      nguoiKy,
      process.env.VERCEL === "1" ? "cloud" : "local",
      JSON.stringify({ thao_tac: "card-decide", card_code: cardCode, action, version: moi.version }),
    ])
    await c.query("COMMIT")
    return { status: 200, body: { ok: true, card_code: cardCode, status: moi.status, version: moi.version } }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    console.error("card-decide failed:", e instanceof Error ? e.message : e)
    return { status: 500, body: { error: "không ghi được thẻ" } }
  } finally {
    c.release()
  }
}
