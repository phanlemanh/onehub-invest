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
  /** Diện tích đất — chỉ nhà thấp tầng (Mạnh chốt 18/11); khi có, `thongThuy` là sàn sử dụng. */
  datDat: number | null
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

// Hai view được nạp sẵn (MATERIALIZED) rồi nối băm: để planner đẩy danh sách căn vào view có hàm cửa sổ thì chạy vòng lặp
// lồng hàng phút trên bản chép máy thu (đo 18/11); đọc trọn hai view mất khoảng một giây (đo lại 27/11: ≈3,3 s).
// DA67: MỘT câu cho cả lưới lẫn ô phủ — hai view chỉ dựng một lần. `ket` giữ mọi căn của toà (cả căn không có thuộc tính) để
// `phu` đếm bằng hàm gộp trên chính nó; dòng lưới là `ket` lọc căn có thuộc tính hay giá, LEFT JOIN sau `phu` nên câu luôn có
// ít nhất một dòng mang số ô phủ. Mọi số đếm ở SQL (luật 10).
const SQL_GOP = `
WITH can AS MATERIALIZED (SELECT u.unit_key FROM units u WHERE u.status = 'active' AND u.building_key = ANY($1::text[])),
v AS MATERIALIZED (SELECT * FROM v_unit_thuoc_tinh),
g AS MATERIALIZED (SELECT * FROM v_s16_gia_cdt),
ket AS MATERIALIZED (
  SELECT can.unit_key, v.living_area::float8 AS thong_thuy, v.building_area_total::float8 AS tim_tuong, v.lot_size_area::float8 AS dat,
         v.bedrooms_total AS phong_ngu, v.bathrooms_total_integer AS wc, coalesce(v.direction_faces, '{}') AS huong,
         v.property_sub_type AS loai_hinh, g.list_price::float8 AS gia, g.gia_m2_thong_thuy::float8 AS gia_m2,
         coalesce(v.nguon, CASE WHEN g.unit_key IS NOT NULL THEN ARRAY['S16'] END, '{}') AS nguon,
         greatest(v.observed_at, g.thu_luc) AS lan_thu, v.observed_at AS v_luc,
         v.unit_key IS NOT NULL AS co_v, g.unit_key IS NOT NULL AS co_g
    FROM can
    LEFT JOIN v ON v.unit_key = can.unit_key
    LEFT JOIN g ON g.unit_key = can.unit_key
),
phu AS (
  SELECT count(*)::int AS trong_danh_ba, (count(*) FILTER (WHERE co_v))::int AS co_thuoc_tinh,
         (count(*) FILTER (WHERE co_g))::int AS co_gia, max(v_luc) FILTER (WHERE co_v) AS phu_lan_thu
    FROM ket
),
da AS (
  SELECT DISTINCT split_part(a.value, '/', 1) AS du_an FROM registry_aliases a
   WHERE a.object_key = ANY($1::text[]) AND a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
),
snap AS (
  SELECT s.snapshot_id FROM airbnb_snapshots s
   WHERE EXISTS (SELECT 1 FROM stg_s16_can_chi_tiet x WHERE x.snapshot_id = s.snapshot_id)
   ORDER BY s.collected_at DESC NULLS LAST, s.snapshot_id DESC LIMIT 1
),
khoa AS MATERIALIZED (
  SELECT c.du_an || '/' || upper(btrim(c.ma_can)) AS gia_tri FROM stg_s16_can_chi_tiet c JOIN snap USING (snapshot_id)
   WHERE c.du_an IN (SELECT du_an FROM da)
   GROUP BY c.du_an, upper(btrim(c.ma_can)) HAVING count(DISTINCT c.toa) = 1
),
mo_ho AS MATERIALIZED (
  -- mã ở hai toà theo luật chọn toà của DA33 (snapshot thuộc tính chỉ giữ một item mỗi mã nên bảng nạp không thấy hai toà)
  SELECT v.du_an || '/' || v.ma_can AS gia_tri FROM v_s16_can v WHERE v.mo_ho AND v.du_an IN (SELECT du_an FROM da)
),
bi_danh AS MATERIALIZED (
  SELECT a.value FROM registry_aliases a
   WHERE a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\\_%'
),
so AS (
  SELECT (SELECT count(*) FROM da)::int AS so_du_an,
         (SELECT count(*) FROM khoa k LEFT JOIN bi_danh b ON b.value = k.gia_tri LEFT JOIN mo_ho m ON m.gia_tri = k.gia_tri
           WHERE b.value IS NULL AND m.gia_tri IS NULL)::int AS chua_vao_danh_ba
)
SELECT so.so_du_an, phu.trong_danh_ba, phu.co_thuoc_tinh, phu.co_gia, so.chua_vao_danh_ba, phu.phu_lan_thu,
       ket.unit_key, ket.thong_thuy, ket.tim_tuong, ket.dat, ket.phong_ngu, ket.wc, ket.huong, ket.loai_hinh, ket.gia, ket.gia_m2,
       ket.nguon, ket.lan_thu
  FROM phu CROSS JOIN so
  LEFT JOIN ket ON ket.co_v OR ket.co_g`

const iso = (d: Date | string | null) => (d == null ? null : new Date(d).toISOString())

type DongGop = {
  so_du_an: number; trong_danh_ba: number; co_thuoc_tinh: number; co_gia: number; chua_vao_danh_ba: number; phu_lan_thu: Date | null
  unit_key: string | null; thong_thuy: number | null; tim_tuong: number | null; dat: number | null; phong_ngu: number | null; wc: number | null
  huong: string[]; loai_hinh: string | null; gia: number | null; gia_m2: number | null; nguon: string[]; lan_thu: Date | null
}

export type ThuocTinhDuAn = { thuocTinh: KetQua<Map<string, ThuocTinhCan>>; phu: KetQua<PhuThuocTinh> }

/**
 * Thuộc tính căn (lưới) và ô phủ của một dự án bằng MỘT câu (DA67). Căn không có thuộc tính không có dòng trong lưới (trang hiện
 * «Chưa có thuộc tính»); dự án không có toà, hay DB chưa áp 113 → không chạy câu thuộc tính, ô phủ «khong-nguon». Lỗi đọc trả
 * lỗi cho cả hai phần — trang hiện Alert nội tuyến, lưới toà vẫn hiện.
 */
export async function docThuocTinhDuAn(toaKeys: string[], q: Q = pool): Promise<ThuocTinhDuAn> {
  try {
    if (process.env.ONEHUB_TTC_LOI_THU === "1") throw new Error("lỗi thử (ONEHUB_TTC_LOI_THU)")
    const out = new Map<string, ThuocTinhCan>()
    if (!toaKeys.length || !(await q.query<{ co: boolean }>(CO_113)).rows[0]?.co) {
      return { thuocTinh: { ok: true, data: out }, phu: { ok: true, data: { trangThai: "khong-nguon" } } }
    }
    const { rows } = await q.query<DongGop>(SQL_GOP, [toaKeys])
    for (const r of rows) {
      if (r.unit_key == null) continue
      out.set(r.unit_key, {
        unitKey: r.unit_key, thongThuy: r.thong_thuy, timTuong: r.tim_tuong, datDat: r.dat, phongNgu: r.phong_ngu, wc: r.wc, huong: r.huong,
        loaiHinh: r.loai_hinh, giaCdt: r.gia, giaM2ThongThuy: r.gia_m2, nguon: r.nguon, lanThu: iso(r.lan_thu),
      })
    }
    const s = rows[0]
    const phu: PhuThuocTinh = !s || (s.so_du_an === 0 && s.co_thuoc_tinh === 0)
      ? { trangThai: "khong-nguon" }
      : { trangThai: "co", trongDanhBa: s.trong_danh_ba, coThuocTinh: s.co_thuoc_tinh, coGia: s.co_gia, chuaVaoDanhBa: s.chua_vao_danh_ba, lanThu: iso(s.phu_lan_thu) }
    return { thuocTinh: { ok: true, data: out }, phu: { ok: true, data: phu } }
  } catch (e) {
    const loi = { ok: false as const, loi: e instanceof Error ? e.message : String(e) }
    return { thuocTinh: loi, phu: loi }
  }
}

/** Lưới thuộc tính — lớp mỏng trên docThuocTinhDuAn (giữ chữ ký cho test DA40). */
export async function docThuocTinhCan(toaKeys: string[], q: Q = pool): Promise<KetQua<Map<string, ThuocTinhCan>>> {
  return (await docThuocTinhDuAn(toaKeys, q)).thuocTinh
}

/** Ô phủ của dự án — lớp mỏng trên docThuocTinhDuAn. */
export async function docPhuThuocTinh(toaKeys: string[], q: Q = pool): Promise<KetQua<PhuThuocTinh>> {
  return (await docThuocTinhDuAn(toaKeys, q)).phu
}
