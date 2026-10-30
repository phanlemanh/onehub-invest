import type { PoolClient } from "pg"

import { pool } from "./db"
import { DA_GAN_CUA_TOI, type LabelRow } from "./labels-normalize"

/**
 * Gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`) — truy vấn của trang /ops/labels và route /api/v1/ops/labels.
 * MÙ (AC-4): chỉ đọc eval_label_items, eval_labels, view đồng thuận và chữ gốc của tin ở stg (text, nhóm, giờ đăng) —
 * không đọc bảng hay cột nào mang giá trị máy đã đọc ra. Bảng chỉ ở máy thu (054_labels.sql); trên cloud trang không gọi.
 */

type Q = Pick<PoolClient, "query">

export type TinGan = {
  itemId: number
  lat: string
  doubleLabel: boolean
  soNguoi: number
  text: string
  groupName: string | null
  postedAt: string | null
}

export type TienDo = { tong: number; cuaToi: number; conChoToi: number; trungDu: number; trungTong: number }
export type DongThuanTruong = { field: string; capDu: number; khop: number; tiLe: number | null }

/** Số người được gắn một tin: tin gắn trùng hai người, tin đơn một. */
const CHO_PHEP = `CASE WHEN i.double_label THEN 2 ELSE 1 END`

/** Tin kế cho người này: chưa do họ gắn, còn chỗ; tin trùng đã có một người đứng trước (cặp mau đủ), rồi theo thứ tự. */
export async function tinKe(userId: string, lat: string, q: Q = pool): Promise<TinGan | null> {
  const { rows } = await q.query(
    `SELECT i.item_id::int, i.lat, i.double_label, coalesce(n.so, 0)::int AS so, p.text, p.group_name, p.posted_at
     FROM eval_label_items i
     LEFT JOIN LATERAL (SELECT count(DISTINCT labeler_id) AS so, bool_or(labeler_id = $1) AS cua_toi
                        FROM eval_labels WHERE item_id = i.item_id) n ON true
     JOIN LATERAL (SELECT text, group_name, posted_at FROM stg_zalo_posts
                   WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE i.lat = $2 AND NOT coalesce(n.cua_toi, false) AND coalesce(n.so, 0) < ${CHO_PHEP}
     ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.item_id
     LIMIT 1`,
    [userId, lat],
  )
  const r = rows[0]
  if (!r) return null
  return {
    itemId: r.item_id,
    lat: r.lat,
    doubleLabel: r.double_label,
    soNguoi: r.so,
    text: r.text,
    groupName: r.group_name,
    postedAt: r.posted_at ? new Date(r.posted_at).toISOString() : null,
  }
}

export type KetQuaGhi = { ok: true } | { ok: false; status: 400 | 409; error: string }

/**
 * Ghi một lượt (đủ chín trường đã chuẩn hoá) trong MỘT giao dịch. Khoá dòng tin (FOR UPDATE) trước khi đếm người đã gắn,
 * nên hai người ghi cùng lúc thì người sau thấy số đã đổi → 409. `c` là client riêng (pool.connect()).
 */
export async function ghiNhan(c: Q, userId: string, lat: string, itemId: number, rows: LabelRow[]): Promise<KetQuaGhi> {
  await c.query("BEGIN")
  try {
    const { rows: tin } = await c.query(
      `SELECT lat, double_label FROM eval_label_items WHERE item_id = $1 FOR UPDATE`, [itemId])
    if (!tin[0] || tin[0].lat !== lat) {
      await c.query("ROLLBACK")
      return { ok: false, status: 400, error: "Tin không thuộc lát" }
    }
    const { rows: da } = await c.query(
      `SELECT count(DISTINCT labeler_id)::int AS so, coalesce(bool_or(labeler_id = $2), false) AS cua_toi
       FROM eval_labels WHERE item_id = $1`, [itemId, userId])
    if (da[0].cua_toi) {
      await c.query("ROLLBACK")
      return { ok: false, status: 409, error: DA_GAN_CUA_TOI }
    }
    if (da[0].so >= (tin[0].double_label ? 2 : 1)) {
      await c.query("ROLLBACK")
      return { ok: false, status: 409, error: "Tin này vừa có người gắn" }
    }
    for (const r of rows) {
      await c.query(
        `INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated) VALUES ($1, $2, $3, $4, $5)`,
        [itemId, userId, r.field, r.value, r.not_stated])
    }
    await c.query("COMMIT")
    return { ok: true }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    throw e
  }
}

export async function tienDo(userId: string, lat: string, q: Q = pool): Promise<TienDo> {
  const { rows } = await q.query(
    `WITH n AS (
       SELECT i.item_id, i.double_label, count(DISTINCT l.labeler_id) AS so, coalesce(bool_or(l.labeler_id = $1), false) AS cua_toi
       FROM eval_label_items i LEFT JOIN eval_labels l USING (item_id)
       WHERE i.lat = $2 GROUP BY i.item_id, i.double_label)
     SELECT count(*)::int AS tong,
            (count(*) FILTER (WHERE cua_toi))::int AS cua_toi,
            (count(*) FILTER (WHERE NOT cua_toi AND so < CASE WHEN double_label THEN 2 ELSE 1 END))::int AS con,
            (count(*) FILTER (WHERE double_label AND so >= 2))::int AS trung_du,
            (count(*) FILTER (WHERE double_label))::int AS trung_tong
     FROM n`,
    [userId, lat],
  )
  const r = rows[0]
  return { tong: r.tong, cuaToi: r.cua_toi, conChoToi: r.con, trungDu: r.trung_du, trungTong: r.trung_tong }
}

export async function dongThuan(lat: string, q: Q = pool): Promise<DongThuanTruong[]> {
  const { rows } = await q.query(
    `SELECT field, cap_du, khop, ti_le::float8 AS ti_le FROM eval_label_agreement WHERE lat = $1`, [lat])
  return rows.map((r) => ({ field: r.field, capDu: r.cap_du, khop: r.khop, tiLe: r.ti_le }))
}
