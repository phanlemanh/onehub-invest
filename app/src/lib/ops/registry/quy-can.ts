import type { PoolClient } from "pg"

import { pool } from "../../db"
import type { KetQua } from "../thuoc-tinh-can"

/**
 * Quỹ căn S09 trên Danh bạ Ops (DA56 `nap-s09-quy-can-va-can-cao-tang`). Chỉ SELECT trên hai view của migration 130
 * (`v_s09_db_quy_can`) và bảng nối `project_links`. Giá chủ đầu tư công khai (ROADMAP §3 mục 38); stg đã bỏ URL ảnh và toạ độ,
 * và lớp này không đọc cột nào ngoài các cột liệt kê dưới. DB chưa áp 130 → `null` (trang không hiện ô, không báo lỗi).
 * «Nối nút» = `project_links` nguồn S09 trạng thái `noi`, gồm cả nút ứng viên do DA42 đúc.
 */

type Q = Pick<PoolClient, "query">

export type QuyCanTong = {
  can: number
  coGia: number
  duAn: number
  /** Ba phần của `duAn`: đã nối nút · còn thẻ chưa duyệt (bảng nối `chua_noi`) · không có trong danh mục gói 1 (chưa có dòng nối). */
  noi: number
  theChua: number
  ngoaiDanhMuc: number
}

export type CanQuyCan = {
  id: string
  ma: string | null
  loaiHinh: string | null
  pn: number | null
  wc: number | null
  dienTich: [number | null, number | null]
  giaBan: [number | null, number | null]
  donGia: [number | null, number | null]
  trangThai: string | null
}

const CO_130 = `SELECT to_regclass('v_s09_db_quy_can') IS NOT NULL AS co`

const SQL_TONG = `
WITH d AS (
  SELECT du_an_id, count(*)::int AS can,
         (count(*) FILTER (WHERE gia_ban_min IS NOT NULL OR gia_ban_max IS NOT NULL))::int AS co_gia
    FROM v_s09_db_quy_can GROUP BY du_an_id
),
l AS (SELECT source_project_id AS du_an_id, bool_or(status = 'noi') AS noi FROM project_links WHERE source = 'S09' GROUP BY 1)
SELECT coalesce(sum(d.can), 0)::int AS can, coalesce(sum(d.co_gia), 0)::int AS co_gia, count(*)::int AS du_an,
       (count(*) FILTER (WHERE l.noi))::int AS noi, (count(*) FILTER (WHERE l.noi IS FALSE))::int AS the_chua,
       (count(*) FILTER (WHERE l.du_an_id IS NULL))::int AS ngoai
  FROM d LEFT JOIN l USING (du_an_id)`

// Một nút có thể nối nhiều mã dự án S09: gộp quỹ căn của mọi mã, mỗi căn một dòng.
const SQL_DU_AN = `
SELECT DISTINCT ON (v.can_id) v.can_id, v.ma_can, v.loai_hinh, v.phong_ngu::float8 AS pn, v.phong_tam::float8 AS wc,
       v.dien_tich_min::float8 AS dt_min, v.dien_tich_max::float8 AS dt_max, v.gia_ban_min::float8 AS gia_min,
       v.gia_ban_max::float8 AS gia_max, v.don_gia_min::float8 AS dg_min, v.don_gia_max::float8 AS dg_max, v.trang_thai_ban
  FROM v_s09_db_quy_can v
  JOIN (SELECT DISTINCT source_project_id FROM project_links WHERE source = 'S09' AND status = 'noi' AND asset_node_id = $1) l
    ON l.source_project_id = v.du_an_id
 ORDER BY v.can_id`

const loi = (e: unknown) => ({ ok: false as const, loi: e instanceof Error ? e.message : String(e) })

export async function docQuyCanTong(q: Q = pool): Promise<KetQua<QuyCanTong | null>> {
  try {
    if (!(await q.query<{ co: boolean }>(CO_130)).rows[0]?.co) return { ok: true, data: null }
    const r = (await q.query<{ can: number; co_gia: number; du_an: number; noi: number; the_chua: number; ngoai: number }>(SQL_TONG)).rows[0]
    return { ok: true, data: { can: r.can, coGia: r.co_gia, duAn: r.du_an, noi: r.noi, theChua: r.the_chua, ngoaiDanhMuc: r.ngoai } }
  } catch (e) {
    return loi(e)
  }
}

export async function docQuyCanDuAn(nodeId: number, q: Q = pool): Promise<KetQua<CanQuyCan[] | null>> {
  try {
    if (!(await q.query<{ co: boolean }>(CO_130)).rows[0]?.co) return { ok: true, data: null }
    const rows = (await q.query<{ can_id: string; ma_can: string | null; loai_hinh: string | null; pn: number | null; wc: number | null; dt_min: number | null; dt_max: number | null; gia_min: number | null; gia_max: number | null; dg_min: number | null; dg_max: number | null; trang_thai_ban: string | null }>(SQL_DU_AN, [nodeId])).rows
    const data = rows.map((r) => ({
      id: r.can_id,
      ma: r.ma_can,
      loaiHinh: r.loai_hinh,
      pn: r.pn,
      wc: r.wc,
      dienTich: [r.dt_min, r.dt_max] as [number | null, number | null],
      giaBan: [r.gia_min, r.gia_max] as [number | null, number | null],
      donGia: [r.dg_min, r.dg_max] as [number | null, number | null],
      trangThai: r.trang_thai_ban,
    }))
    data.sort((a, b) => (a.ma ?? "").localeCompare(b.ma ?? "", "vi", { numeric: true }) || a.id.localeCompare(b.id))
    return { ok: true, data }
  } catch (e) {
    return loi(e)
  }
}
