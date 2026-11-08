import type { PoolClient } from "pg"

import { pool } from "./db"
import { docGhep, type GhepHien } from "./labels-anh"
import { docThe } from "./labels-cum"
import { nhapTuDraft, type NhapMay } from "./labels-cuon-chieu"
import { DA_GAN_CUA_TOI, type LabelRow } from "./labels-normalize"
import { maskSourceNames } from "./mask-source-names"
import { getSourceNameEntries } from "./source-roles"

/**
 * Gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`) — truy vấn của trang /ops/labels và route /api/v1/ops/labels.
 * MÙ (AC-4): chỉ đọc eval_label_items, eval_labels, view đồng thuận và chữ gốc của tin ở stg (text, nhóm, giờ đăng, tên và ID người đăng) —
 * và cột ảnh của bài (`media`, `media_files`, không phải kết quả đọc ảnh); không đọc bảng hay cột nào mang giá trị máy đã đọc ra. Bảng chỉ ở máy thu (054_labels.sql); trên cloud trang không gọi.
 */

type Q = Pick<PoolClient, "query">

export type TinGan = {
  itemId: number
  lat: string
  doubleLabel: boolean
  soNguoi: number
  /** Chữ hiện trên thẻ, đã bỏ link. Chữ gốc chỉ ở máy chủ (`baiDeGhi`). */
  text: string
  /** Đường `/api/zalo-media?nhan=&anh=`, không có URL gốc. */
  anh: string[]
  soLinkKhac: number
  /** Ghép suy ra từ luật PL28. Không có mã bài. Null là bài không ghép. */
  ghep: GhepHien | null
  groupName: string | null
  /** Tên người đăng ở stg, tên nguồn thật đã thành mã S0x; danh sách tên nguồn không đọc được thì null. Thẻ ghép: của tin chữ. */
  nguoiDang?: string | null
  /** ID tài khoản người đăng (tầng C, chỉ trong /ops). Tên trùng giữa nhiều người nên ID mới là định danh. */
  nguoiDangId?: string | null
  /** Giờ đăng của cùng bài với người đăng. */
  postedAt: string | null
  /** Nháp máy của lát mẫu soát cuốn chiếu (DO1); lát khác null — lượt một vẫn mù. */
  nhap?: NhapMay | null
}

/** Một nhóm của lát theo nhóm: `stratum` là `unit_code` trong sổ; tiến độ tính riêng cho người gọi. */
export type NhomCuaLat = { unitCode: string; ten: string; cuaToi: number; tong: number; conChoToi: number; choNguoiHai: number }

export type TienDo = { tong: number; cuaToi: number; conChoToi: number; trungDu: number; trungTong: number }
export type DongThuanTruong = { field: string; capDu: number; khop: number; tiLe: number | null }

/** Số người được gắn một tin: tin gắn trùng hai người, tin đơn một. */
const CHO_PHEP = `CASE WHEN i.double_label THEN 2 ELSE 1 END`

/** Tin kế cho người này: chưa do họ gắn, còn chỗ; tin trùng đã có một người đứng trước (cặp mau đủ), rồi tin đơn, tin
 * trùng chưa ai gắn xếp cuối để khi chỉ có một người gắn, chúng không chặn cả nhóm (Mạnh chốt 06/11), rồi theo thứ tự.
 * `nhom` là `unit_code`: chỉ lấy bài của nhóm đó. */
export async function tinKe(userId: string, lat: string, q: Q = pool, nhom: string | null = null): Promise<TinGan | null> {
  const sql =
    `SELECT i.item_id::int, i.lat, i.double_label, coalesce(n.so, 0)::int AS so, i.ref_id, i.ghep, to_jsonb(i) -> 'draft' AS draft, p.text, p.group_name, p.posted_at, p.media, p.media_files, p.snapshot_id, p.sender_name, p.sender_id
     FROM eval_label_items i
     LEFT JOIN LATERAL (SELECT count(DISTINCT labeler_id) AS so, bool_or(labeler_id = $1) AS cua_toi
                        FROM eval_labels WHERE item_id = i.item_id) n ON true
     JOIN LATERAL (SELECT text, group_name, posted_at, media, media_files, snapshot_id, sender_name, sender_id FROM stg_zalo_posts
                   WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE i.lat = $2 AND NOT coalesce(n.cua_toi, false) AND coalesce(n.so, 0) < ${CHO_PHEP} AND (i.ghep->>'trung_voi') IS NULL
     ORDER BY (i.double_label AND coalesce(n.so, 0) = 1) DESC, i.double_label, i.item_id
     LIMIT 1`
  // Câu không nhóm giữ nguyên hai tham số: phép đo mù của PL7 rút chính câu này để chạy lại.
  const { rows } = nhom
    ? await q.query(sql.replace("WHERE i.lat = $2", "WHERE i.stratum = $3 AND i.lat = $2"), [userId, lat, nhom])
    : await q.query(sql, [userId, lat])
  const r = rows[0]
  if (!r) return null
  const g = docGhep(r.ghep)
  const the = await docThe(q, r.item_id, r, g)
  const nguoiDang = the.nguoiDang ? maskSourceNames(the.nguoiDang, await getSourceNameEntries()) : null
  return {
    itemId: r.item_id,
    lat: r.lat,
    doubleLabel: r.double_label,
    soNguoi: r.so,
    text: the.text,
    anh: the.anh,
    soLinkKhac: the.soLinkKhac,
    ghep: the.ghep,
    groupName: r.group_name,
    nguoiDang,
    nguoiDangId: the.nguoiDangId,
    postedAt: the.postedAt ? new Date(the.postedAt).toISOString() : null,
    nhap: nhapTuDraft(r.draft),
  }
}

/** Các nhóm của lát, nhiều bài trước. Lát đời trước không có `stratum` nên trả mảng rỗng: màn dùng đó để giữ biểu mẫu chín trường. */
export async function nhomCuaLat(userId: string, lat: string, q: Q = pool): Promise<NhomCuaLat[]> {
  const { rows } = await q.query(
    `WITH n AS (
       SELECT i.item_id, i.stratum, i.ref_id, i.double_label, count(DISTINCT l.labeler_id) AS so,
              coalesce(bool_or(l.labeler_id = $1), false) AS cua_toi
       FROM eval_label_items i LEFT JOIN eval_labels l USING (item_id)
       WHERE i.lat = $2 AND i.stratum IS NOT NULL AND (i.ghep->>'trung_voi') IS NULL
       GROUP BY i.item_id, i.stratum, i.ref_id, i.double_label
     ), ten AS (
       SELECT DISTINCT ON (n.stratum) n.stratum, p.group_name
       FROM n JOIN stg_zalo_posts p ON p.post_id = n.ref_id
       WHERE p.group_name IS NOT NULL
       ORDER BY n.stratum, p.captured_at DESC
     )
     SELECT n.stratum, ten.group_name, count(*)::int AS tong,
            (count(*) FILTER (WHERE n.cua_toi))::int AS cua_toi,
            (count(*) FILTER (WHERE NOT n.cua_toi AND n.so < CASE WHEN n.double_label THEN 2 ELSE 1 END))::int AS con,
            (count(*) FILTER (WHERE n.cua_toi AND n.double_label AND n.so < 2))::int AS cho
     FROM n LEFT JOIN ten USING (stratum)
     GROUP BY n.stratum, ten.group_name
     ORDER BY tong DESC, n.stratum`,
    [userId, lat],
  )
  return rows.map((r) => ({
    unitCode: r.stratum, ten: r.group_name ?? r.stratum, tong: r.tong, cuaToi: r.cua_toi, conChoToi: r.con, choNguoiHai: r.cho,
  }))
}

/** Chữ bài và nhóm của một tin, để route chuẩn hoá trước khi ghi. Chỉ chữ gốc, của tin chữ đã ghép khi có: lượt một vẫn mù giá trị máy. */
export async function baiDeGhi(itemId: number, q: Q = pool): Promise<{ text: string; stratum: string | null } | null> {
  const { rows } = await q.query(
    `SELECT i.stratum, i.ghep, p.text FROM eval_label_items i
     LEFT JOIN LATERAL (SELECT text FROM stg_zalo_posts WHERE post_id = coalesce(i.ghep->>'chu_ref', i.ref_id) ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE i.item_id = $1`, [itemId])
  return rows[0] ? { text: rows[0].text ?? "", stratum: rows[0].stratum } : null
}

export type KetQuaGhi = { ok: true } | { ok: false; status: 400 | 409; error: string }

/**
 * Ghi một lượt (đủ các trường đã chuẩn hoá, kèm lý do nếu có) trong MỘT giao dịch. Khoá dòng tin (FOR UPDATE) trước khi đếm
 * người đã gắn, nên hai người ghi cùng lúc thì người sau thấy số đã đổi → 409. `c` là client riêng (pool.connect()).
 */
export async function ghiNhan(c: Q, userId: string, lat: string, itemId: number, rows: LabelRow[], reason: string | null = null): Promise<KetQuaGhi> {
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
        `INSERT INTO eval_labels (item_id, labeler_id, field, value, not_stated, basis) VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, userId, r.field, r.value, r.not_stated, r.basis])
    }
    if (reason) {
      await c.query(`INSERT INTO eval_label_reasons (item_id, labeler_id, reason) VALUES ($1, $2, $3)`, [itemId, userId, reason])
    }
    await c.query("COMMIT")
    return { ok: true }
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {})
    throw e
  }
}

export async function tienDo(userId: string, lat: string, q: Q = pool, nhom: string | null = null): Promise<TienDo> {
  const { rows } = await q.query(
    `WITH n AS (
       SELECT i.item_id, i.double_label, count(DISTINCT l.labeler_id) AS so, coalesce(bool_or(l.labeler_id = $1), false) AS cua_toi
       FROM eval_label_items i LEFT JOIN eval_labels l USING (item_id)
       WHERE i.lat = $2 AND (i.ghep->>'trung_voi') IS NULL AND ($3::text IS NULL OR i.stratum = $3) GROUP BY i.item_id, i.double_label)
     SELECT count(*)::int AS tong,
            (count(*) FILTER (WHERE cua_toi))::int AS cua_toi,
            (count(*) FILTER (WHERE NOT cua_toi AND so < CASE WHEN double_label THEN 2 ELSE 1 END))::int AS con,
            (count(*) FILTER (WHERE double_label AND so >= 2))::int AS trung_du,
            (count(*) FILTER (WHERE double_label))::int AS trung_tong
     FROM n`,
    [userId, lat, nhom],
  )
  const r = rows[0]
  return { tong: r.tong, cuaToi: r.cua_toi, conChoToi: r.con, trungDu: r.trung_du, trungTong: r.trung_tong }
}

export async function dongThuan(lat: string, q: Q = pool): Promise<DongThuanTruong[]> {
  const { rows } = await q.query(
    `SELECT field, cap_du, khop, ti_le::float8 AS ti_le FROM eval_label_agreement WHERE lat = $1`, [lat])
  return rows.map((r) => ({ field: r.field, capDu: r.cap_du, khop: r.khop, tiLe: r.ti_le }))
}
