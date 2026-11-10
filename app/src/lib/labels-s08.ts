/**
 * Căn cứ «Danh mục CĐT» (truong-nhan-s03-081 AC-4): một ô chỉ nhận căn cứ này khi mã căn của thẻ có trong danh mục S08 và giá trị
 * của ô bằng giá trị của một dòng danh mục cùng mã. Chỉ đọc `stg_s08_inventory` (chỉ có ở máy thu, AGENTS.md luật 5 — không tái
 * xuất); route ghi nhãn gọi sau `chuanHoaLuot`. Mã trùng giữa dự án: khớp một dòng là đủ.
 */
import type { PoolClient } from "pg"

import { pool } from "./db"
import { DIRECTION_FACES } from "./vocab.generated"
import { CDT_FIELDS, chuanChu, type LabelRow, type LoiLuot } from "./labels-normalize"

type Q = Pick<PoolClient, "query">

export const MSG_CDT_KHONG_TRUONG = "Danh mục CĐT không có trường này"
export const MSG_CDT_CHUA_CO_MA = "Mã căn chưa có trong danh mục CĐT"
export const MSG_CDT_LECH = "Giá trị khác danh mục CĐT"
export const MSG_CDT_KHONG_DOC = "Không đọc được danh mục CĐT ở máy này"

/** Tên hướng của danh mục (chữ hoa có dấu) → mã trục `direction_faces` của sổ từ vựng. */
export const HUONG_S08: Record<string, string> = {
  "ĐÔNG": DIRECTION_FACES.east,
  "TÂY": DIRECTION_FACES.west,
  "NAM": DIRECTION_FACES.south,
  "BẮC": DIRECTION_FACES.north,
  "ĐÔNG BẮC": DIRECTION_FACES.northeast,
  "ĐÔNG NAM": DIRECTION_FACES.southeast,
  "TÂY BẮC": DIRECTION_FACES.northwest,
  "TÂY NAM": DIRECTION_FACES.southwest,
}

export type DongS08 = {
  product_code: string | null
  subdivision_name: string | null
  base_direction_name: string | null
  construction_area: string | number | null
  land_area: string | number | null
  number_of_room: number | null
  number_of_wc: number | null
}

/** Các mã hướng của một dòng; hướng đôi «ĐÔNG BẮC - TÂY NAM» cho cả hai. */
export function huongCua(ten: string | null): string[] {
  if (!ten) return []
  return ten
    .normalize("NFC")
    .toUpperCase()
    .split("-")
    .map((x) => HUONG_S08[x.trim().replace(/\s+/g, " ")])
    .filter((x): x is string => Boolean(x))
}

const bangSo = (a: string | number | null, b: string): boolean => a != null && Math.abs(Number(a) - Number(b)) < 0.005

/** Giá trị đã chuẩn hoá của một ô có khớp một dòng danh mục không. */
export function soVoiDong(field: string, value: string, d: DongS08): boolean {
  switch (field) {
    case "unit_number":
      return (d.product_code ?? "").trim().toLowerCase() === value.trim().toLowerCase()
    case "subzone":
      return d.subdivision_name != null && chuanChu(d.subdivision_name) === chuanChu(value)
    case "direction_faces":
      return huongCua(d.base_direction_name).includes(value)
    case "area_m2":
      return bangSo(d.construction_area, value) || bangSo(d.land_area, value)
    case "bedrooms":
      return d.number_of_room != null && d.number_of_room === Number(value)
    case "bathrooms":
      return d.number_of_wc != null && d.number_of_wc === Number(value)
    default:
      return false
  }
}

/** Mã căn bị che («PR6.xx10») không tra được danh mục. */
const biChe = (ma: string) => /x{2,}/i.test(ma)

/** Lỗi theo ô của các ô căn cứ «Danh mục CĐT»; rỗng khi mọi ô nhận được (hoặc không ô nào dùng căn cứ này). */
export async function kiemDanhMuc(rows: LabelRow[], q: Q = pool): Promise<LoiLuot> {
  const cdt = rows.filter((r) => r.basis === "danh_muc_cdt" && !r.not_stated && r.value != null)
  if (cdt.length === 0) return {}
  const loi: LoiLuot = {}
  const coTruong = cdt.filter((r) => (CDT_FIELDS as readonly string[]).includes(r.field))
  for (const r of cdt) if (!coTruong.includes(r)) loi[r.field] = MSG_CDT_KHONG_TRUONG
  if (coTruong.length === 0) return loi
  const ma = rows.find((r) => r.field === "unit_number" && !r.not_stated && r.value)?.value ?? null
  if (!ma || biChe(ma)) {
    for (const r of coTruong) loi[r.field] = MSG_CDT_CHUA_CO_MA
    return loi
  }
  let dong: DongS08[]
  try {
    dong = (
      await q.query<DongS08>(
        `SELECT product_code, subdivision_name, base_direction_name, construction_area, land_area, number_of_room, number_of_wc
         FROM stg_s08_inventory WHERE lower(btrim(product_code)) = lower(btrim($1))`,
        [ma],
      )
    ).rows
  } catch (e) {
    // Bảng chỉ có ở máy thu: vắng (42P01) thì báo dưới ô, không 500.
    if ((e as { code?: string }).code === "42P01") {
      for (const r of coTruong) loi[r.field] = MSG_CDT_KHONG_DOC
      return loi
    }
    throw e
  }
  if (dong.length === 0) {
    for (const r of coTruong) loi[r.field] = MSG_CDT_CHUA_CO_MA
    return loi
  }
  for (const r of coTruong) if (!dong.some((d) => soVoiDong(r.field, r.value!, d))) loi[r.field] = MSG_CDT_LECH
  return loi
}
