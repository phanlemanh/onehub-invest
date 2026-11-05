import { chuKhongLink, danhSachAnhCum, docGhep, duongAnh, ghepHien, type GhepHien } from "./labels-anh"
import { docBaiCum } from "./labels-cum"
import type { PoolClient } from "pg"

import { pool } from "./db"
import { CASE_KINDS, GROUP_CARD_VERDICTS, chuanChu, type Basis, type CaseKind, type GroupCardVerdict, type LabelField } from "./labels-normalize"

/**
 * Lượt hai của màn gắn nhãn (GC0 `gan-nhan-theo-nhom-s03`): so nhãn với máy đọc, ghi trường hợp, bảng số theo nhóm.
 * Mọi đọc giá trị máy nằm ở tệp này, không ở `labels-queries.ts`, để phép đo «mù» của lượt một giữ được. `doiChieu` trả
 * null khi người gọi chưa lưu bài; chỉ đọc nhãn, lý do, trường hợp của chính người gọi, nên người gắn trùng không bị dẫn dắt.
 */

type Q = Pick<PoolClient, "query">

export type NhanCuaToi = { field: LabelField; value: string | null; notStated: boolean; basis: Basis | null }
export type TruongHopDaGhi = { caseKind: CaseKind | null; note: string | null; groupCardVerdict: GroupCardVerdict | null }
export type MayDoc = Partial<Record<LabelField, string>>
export type DoiChieu = {
  itemId: number
  lat: string
  /** Chữ hiện trên thẻ, đã bỏ link. */
  text: string
  anh: string[]
  soLinkKhac: number
  ghep: GhepHien | null
  groupName: string | null
  postedAt: string | null
  cuaToi: NhanCuaToi[]
  lyDo: string | null
  boDoc: MayDoc | null
  aiDoc: MayDoc | null
  soTin: number
  the: string | null
  truongHop: TruongHopDaGhi[]
}

/** «unknown» của máy nghĩa là máy không đọc được, nên coi như ô trống. */
const so = (v: unknown) => (v == null || v === "unknown" ? undefined : String(v))
const chu = (v: unknown) => (v == null || v === "" ? undefined : chuanChu(String(v)))

/** Bảng so của một bài. Bài nhiều tin so với tin có `offer_id` nhỏ nhất, `soTin` nói rõ tổng số. */
export async function doiChieu(userId: string, itemId: number, q: Q = pool): Promise<DoiChieu | null> {
  const { rows: nhan } = await q.query(
    `SELECT field, value, not_stated, basis FROM eval_labels WHERE item_id = $1 AND labeler_id = $2`, [itemId, userId])
  if (nhan.length === 0) return null
  const { rows: bai } = await q.query(
    `SELECT i.lat, i.ref_id, i.stratum, i.ghep, p.text, p.group_name, p.posted_at, p.media, p.media_files, p.snapshot_id
     FROM eval_label_items i
     LEFT JOIN LATERAL (SELECT text, group_name, posted_at, media, media_files, snapshot_id FROM stg_zalo_posts
                        WHERE post_id = i.ref_id ORDER BY captured_at DESC LIMIT 1) p ON true
     WHERE i.item_id = $1`, [itemId])
  const b = bai[0]
  if (!b) return null
  // Máy đọc tra theo tin chữ đã ghép: bài ảnh rời không có offer, và người gắn đọc chính tin chữ ấy.
  const g = docGhep(b.ghep)
  const refMay = g?.chu_ref ?? b.ref_id
  const [tin, ai, the, lyDo, tv] = await Promise.all([
    q.query(`SELECT * FROM sale_offers WHERE $1 = ANY (post_ids) ORDER BY offer_id`, [refMay]),
    q.query(`SELECT listing_intent, kind FROM silver_labels WHERE source_code = 'S03' AND post_id = $1 AND json_ok
             ORDER BY labeled_at DESC, label_id DESC LIMIT 1`, [refMay]),
    b.stratum
      ? q.query(`SELECT note FROM collection_units WHERE source_code = 'S03' AND unit_code = $1`, [b.stratum])
      : Promise.resolve({ rows: [] as { note: string | null }[] }),
    q.query(`SELECT reason FROM eval_label_reasons WHERE item_id = $1 AND labeler_id = $2`, [itemId, userId]),
    q.query(`SELECT case_kind, note, group_card_verdict FROM eval_label_cases WHERE item_id = $1 AND labeler_id = $2 ORDER BY id`, [itemId, userId]),
  ])
  const o = tin.rows[0]
  const boDoc: MayDoc | null = o
    ? {
        listing_intent: "offer",
        kind: so(o.kind),
        property_type: so(o.property_type),
        building: chu(o.block_raw),
        floor: chu(o.floor_raw),
        bedrooms: so(o.bedrooms),
        bathrooms: so(o.bathrooms),
        area_m2: o.area_m2 == null ? undefined : String(Number(o.area_m2)),
        price_min_vnd: so(o.price_vnd),
        price_max_vnd: so(o.price_vnd),
        seller_name: chu(o.seller_name),
        seller_phone: so(o.seller_phone),
      }
    : null
  const a = ai.rows[0]
  const baiCum = g ? await docBaiCum(q, b.ref_id, g) : [b]
  const nguon = danhSachAnhCum(baiCum)
  const hien = chuKhongLink(g?.chu_ref ? baiCum.find((x) => x.post_id === g.chu_ref)?.text : b.text, nguon)
  return {
    itemId,
    lat: b.lat,
    text: hien.chu,
    anh: nguon.map((_, i) => duongAnh(itemId, i)),
    soLinkKhac: hien.soLinkKhac,
    ghep: ghepHien(g),
    groupName: b.group_name,
    postedAt: b.posted_at ? new Date(b.posted_at).toISOString() : null,
    cuaToi: nhan.map((r) => ({ field: r.field, value: r.value, notStated: r.not_stated, basis: r.basis })),
    lyDo: lyDo.rows[0]?.reason ?? null,
    boDoc,
    aiDoc: a ? { listing_intent: so(a.listing_intent), kind: so(a.kind) } : null,
    soTin: tin.rows.length,
    the: the.rows[0]?.note || null,
    truongHop: tv.rows.map((r) => ({ caseKind: r.case_kind, note: r.note, groupCardVerdict: r.group_card_verdict })),
  }
}

export type GhiTruongHop = { case_kind?: unknown; note?: unknown; group_card_verdict?: unknown; request_id?: unknown }
export type KetQuaTruongHop = { ok: true } | { ok: false; status: 400 | 403; error: string }

/** Thêm một dòng trường hợp. Không đụng `eval_labels`; chưa lưu nhãn bài này thì 403. Bỏ qua là không gọi hàm này. `request_id` là
 * khoá của một lần bấm Ghi: lỗi mạng có thể xảy ra sau khi đã ghi, nên «Thử lại» cùng khoá không sinh dòng thứ hai. */
export async function ghiTruongHop(c: Q, userId: string, itemId: number, g: GhiTruongHop): Promise<KetQuaTruongHop> {
  const kind = g.case_kind == null || g.case_kind === "" ? null : String(g.case_kind)
  const the = g.group_card_verdict == null || g.group_card_verdict === "" ? null : String(g.group_card_verdict)
  const khoa = typeof g.request_id === "string" && g.request_id ? g.request_id : null
  const note = typeof g.note === "string" ? g.note.trim() || null : null
  if (kind && !CASE_KINDS.some((k) => k.value === kind)) return { ok: false, status: 400, error: "Loại trường hợp không hợp lệ" }
  if (the && !(GROUP_CARD_VERDICTS as readonly string[]).includes(the)) return { ok: false, status: 400, error: "Trả lời thẻ nhóm không hợp lệ" }
  if (!kind && !the && !note) return { ok: false, status: 400, error: "Chưa có gì để ghi" }
  const { rows } = await c.query(`SELECT 1 FROM eval_labels WHERE item_id = $1 AND labeler_id = $2 LIMIT 1`, [itemId, userId])
  if (rows.length === 0) return { ok: false, status: 403, error: "Chỉ ghi được sau khi đã lưu nhãn bài này" }
  await c.query(
    `INSERT INTO eval_label_cases (item_id, labeler_id, case_kind, note, group_card_verdict, request_id) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (item_id, labeler_id, request_id) DO NOTHING`,
    [itemId, userId, kind, note, the, khoa])
  return { ok: true }
}

export type DongTruongHop = {
  unitCode: string
  ten: string
  tong: number
  daGan: number
  canNguCanh: number
  theoLoai: Partial<Record<CaseKind, number>>
}

/** Bảng trường hợp theo nhóm: chỉ có số, cho mọi vai; chữ lý do và ghi chép chỉ đọc qua `pipeline/label-cases.mjs`. */
export async function bangTruongHop(lat: string, q: Q = pool): Promise<DongTruongHop[]> {
  const { rows } = await q.query(
    `WITH i AS (
       SELECT item_id, stratum, ref_id FROM eval_label_items WHERE lat = $1 AND stratum IS NOT NULL AND (ghep->>'trung_voi') IS NULL
     ), ten AS (
       SELECT DISTINCT ON (i.stratum) i.stratum, p.group_name
       FROM i JOIN stg_zalo_posts p ON p.post_id = i.ref_id
       WHERE p.group_name IS NOT NULL
       ORDER BY i.stratum, p.captured_at DESC
     ), bai AS (
       SELECT i.item_id, i.stratum,
              EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id) AS da_gan,
              EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id AND l.basis IN ('ngu_canh_nhom', 'kien_thuc_nghe')) AS can_ngu_canh
       FROM i
     ), loai AS (
       SELECT i.stratum, jsonb_object_agg(k.case_kind, k.so) AS theo_loai
       FROM (SELECT DISTINCT stratum FROM i) i
       JOIN LATERAL (SELECT c.case_kind, count(*)::int AS so
                     FROM eval_label_cases c JOIN eval_label_items x USING (item_id)
                     WHERE x.lat = $1 AND x.stratum = i.stratum AND c.case_kind IS NOT NULL
                     GROUP BY c.case_kind) k ON true
       GROUP BY i.stratum
     )
     SELECT b.stratum, ten.group_name, count(*)::int AS tong,
            (count(*) FILTER (WHERE b.da_gan))::int AS da_gan,
            (count(*) FILTER (WHERE b.can_ngu_canh))::int AS can_ngu_canh,
            loai.theo_loai
     FROM bai b LEFT JOIN ten USING (stratum) LEFT JOIN loai USING (stratum)
     GROUP BY b.stratum, ten.group_name, loai.theo_loai
     ORDER BY tong DESC, b.stratum`,
    [lat],
  )
  return rows.map((r) => ({
    unitCode: r.stratum,
    ten: r.group_name ?? r.stratum,
    tong: r.tong,
    daGan: r.da_gan,
    canNguCanh: r.can_ngu_canh,
    theoLoai: r.theo_loai ?? {},
  }))
}
