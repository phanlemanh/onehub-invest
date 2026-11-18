import type { PoolClient } from "pg"

import { pool } from "../db"

/**
 * Thuộc tính căn S16 trên trang dự án Danh bạ (/ops/registry/[nodeId], chỉ Ops máy thu) — hồ sơ thuoc-tinh-can-s16 (DA40).
 * Chỉ SELECT; mọi số đếm tính ở SQL (luật 10), React chỉ hiện. Đọc theo danh sách khoá toà của dự án mà trang đã có, nên lớp
 * này không tự suy cây dự án → toà (việc của lớp đọc Danh bạ).
 * Nguồn: v_unit_thuoc_tinh (bộ phân xử phát biểu Unit), v_s16_gia_cdt (giá chủ đầu tư hiện hành), stg_s16_can_chi_tiet — 113.
 * DB chưa áp 113 → coi như chưa có nguồn thuộc tính (không lỗi).
 */

type Q = Pick<PoolClient, "query">

export type ThuocTinhCan = {
  unitKey: string
  thongThuy: number | null
  timTuong: number | null
  phongNgu: number | null
  wc: number | null
  /** Mã trục direction_faces (một hoặc hai — căn góc). */
  huong: string[]
  /** Mã trục property_type. */
  loaiHinh: string | null
  giaCdt: number | null
  giaM2ThongThuy: number | null
  nguon: string[]
  /** Mốc thu của thuộc tính (ISO). */
  lanThu: string | null
}

export type PhuThuocTinh =
  | { trangThai: "khong-nguon" }
  | { trangThai: "co"; trongDanhBa: number; coThuocTinh: number; coGia: number; chuaVaoDanhBa: number; lanThu: string | null }

export type KetQua<T> = { ok: true; data: T } | { ok: false; loi: string }

const CO_113 = `SELECT to_regclass('public.v_unit_thuoc_tinh') IS NOT NULL AS co`

const SQL_CAN = `
SELECT u.unit_key, v.living_area::float8 AS thong_thuy, v.building_area_total::float8 AS tim_tuong,
       v.bedrooms_total AS phong_ngu, v.bathrooms_total_integer AS wc, coalesce(v.direction_faces, '{}') AS huong,
       v.property_sub_type AS loai_hinh, g.list_price::float8 AS gia, g.gia_m2_thong_thuy::float8 AS gia_m2,
       coalesce(v.nguon, CASE WHEN g.unit_key IS NOT NULL THEN ARRAY['S16'] END, '{}') AS nguon,
       greatest(v.observed_at, g.thu_luc) AS lan_thu
  FROM units u
  LEFT JOIN v_unit_thuoc_tinh v USING (unit_key)
  LEFT JOIN v_s16_gia_cdt g USING (unit_key)
 WHERE u.status = 'active' AND u.building_key = ANY($1::text[]) AND (v.unit_key IS NOT NULL OR g.unit_key IS NOT NULL)`

const SQL_PHU = `
WITH can AS (SELECT u.unit_key FROM units u WHERE u.status = 'active' AND u.building_key = ANY($1::text[])),
da AS (
  SELECT DISTINCT split_part(a.value, '/', 1) AS du_an FROM registry_aliases a
   WHERE a.object_key = ANY($1::text[]) AND a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
),
snap AS (
  SELECT s.snapshot_id FROM airbnb_snapshots s
   WHERE EXISTS (SELECT 1 FROM stg_s16_can_chi_tiet x WHERE x.snapshot_id = s.snapshot_id)
   ORDER BY s.collected_at DESC NULLS LAST, s.snapshot_id DESC LIMIT 1
),
khoa AS (
  SELECT c.du_an, upper(btrim(c.ma_can)) AS ma FROM stg_s16_can_chi_tiet c JOIN snap USING (snapshot_id)
   WHERE c.du_an IN (SELECT du_an FROM da)
   GROUP BY 1, 2 HAVING count(DISTINCT c.toa) = 1
)
SELECT (SELECT count(*) FROM da)::int AS so_du_an,
       (SELECT count(*) FROM can)::int AS trong_danh_ba,
       (SELECT count(*) FROM can JOIN v_unit_thuoc_tinh v USING (unit_key))::int AS co_thuoc_tinh,
       (SELECT count(*) FROM can JOIN v_s16_gia_cdt g USING (unit_key))::int AS co_gia,
       (SELECT count(*) FROM khoa k WHERE NOT EXISTS (
          SELECT 1 FROM registry_aliases a WHERE a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
             AND a.object_key LIKE 'unt\\_%' AND a.value = k.du_an || '/' || k.ma))::int AS chua_vao_danh_ba,
       (SELECT max(v.observed_at) FROM can JOIN v_unit_thuoc_tinh v USING (unit_key)) AS lan_thu`

const iso = (d: Date | string | null) => (d == null ? null : new Date(d).toISOString())

/** Thuộc tính của các căn thuộc danh sách toà; căn không có thuộc tính không có dòng (trang hiện «Chưa có thuộc tính»). */
export async function docThuocTinhCan(toaKeys: string[], q: Q = pool): Promise<KetQua<Map<string, ThuocTinhCan>>> {
  try {
    if (process.env.ONEHUB_TTC_LOI_THU === "1") throw new Error("lỗi thử (ONEHUB_TTC_LOI_THU)")
    const out = new Map<string, ThuocTinhCan>()
    if (!toaKeys.length || !(await q.query<{ co: boolean }>(CO_113)).rows[0]?.co) return { ok: true, data: out }
    const { rows } = await q.query<{
      unit_key: string; thong_thuy: number | null; tim_tuong: number | null; phong_ngu: number | null; wc: number | null
      huong: string[]; loai_hinh: string | null; gia: number | null; gia_m2: number | null; nguon: string[]; lan_thu: Date | null
    }>(SQL_CAN, [toaKeys])
    for (const r of rows) {
      out.set(r.unit_key, {
        unitKey: r.unit_key, thongThuy: r.thong_thuy, timTuong: r.tim_tuong, phongNgu: r.phong_ngu, wc: r.wc, huong: r.huong,
        loaiHinh: r.loai_hinh, giaCdt: r.gia, giaM2ThongThuy: r.gia_m2, nguon: r.nguon, lanThu: iso(r.lan_thu),
      })
    }
    return { ok: true, data: out }
  } catch (e) {
    return { ok: false, loi: e instanceof Error ? e.message : String(e) }
  }
}

/** Ô phủ của dự án: căn có thuộc tính / căn trong danh bạ, căn có giá, căn S16 có thuộc tính chưa vào danh bạ. */
export async function docPhuThuocTinh(toaKeys: string[], q: Q = pool): Promise<KetQua<PhuThuocTinh>> {
  try {
    if (process.env.ONEHUB_TTC_LOI_THU === "1") throw new Error("lỗi thử (ONEHUB_TTC_LOI_THU)")
    if (!toaKeys.length || !(await q.query<{ co: boolean }>(CO_113)).rows[0]?.co) return { ok: true, data: { trangThai: "khong-nguon" } }
    const r = (await q.query<{ so_du_an: number; trong_danh_ba: number; co_thuoc_tinh: number; co_gia: number; chua_vao_danh_ba: number; lan_thu: Date | null }>(SQL_PHU, [toaKeys])).rows[0]
    if (!r || (r.so_du_an === 0 && r.co_thuoc_tinh === 0)) return { ok: true, data: { trangThai: "khong-nguon" } }
    return { ok: true, data: { trangThai: "co", trongDanhBa: r.trong_danh_ba, coThuocTinh: r.co_thuoc_tinh, coGia: r.co_gia, chuaVaoDanhBa: r.chua_vao_danh_ba, lanThu: iso(r.lan_thu) } }
  } catch (e) {
    return { ok: false, loi: e instanceof Error ? e.message : String(e) }
  }
}
