import { fold, maskSourceNames, type SourceNameEntry } from "../../mask-source-names"
import type { MaChuaNoi, NutDanhBa } from "./doc"

/**
 * Hàng bảng của /ops/registry — dựng ở máy chủ từ `docDanhBa`: dự án gốc mang cây con (phân khu) ở `subRows`, tên và
 * bí danh đã qua bộ che tên nguồn. Không tính số nào ở đây: số đếm là của SQL, hàm này chỉ xếp và che.
 */

export type ChoThieu = "chua-toa" | "toa-chua-can" | "chua-tin" | "chua-nguon"

export const CHO_THIEU_NHAN: Record<ChoThieu, string> = {
  "chua-toa": "Chưa có toà",
  "toa-chua-can": "Có toà chưa có căn",
  "chua-tin": "Chưa có tin đang rao",
  "chua-nguon": "Chưa nối nguồn danh mục",
}

export type HangCay = {
  id: number
  loai: NutDanhBa["loai"]
  ten: string
  biDanh: string[]
  bac: string
  tinh: string | null
  nguon: string[]
  soPhanKhu: number
  soToa: number
  toaChuaCan: number
  soCan: number
  tin: Record<string, number>
  /** Chỗ thiếu của nút (dự án gốc); hàng con không mang. */
  thieu: ChoThieu[]
  /** Chuỗi gộp tên + bí danh đã gấp dấu, cho ô tìm phía khách. */
  timKiem: string
  subRows?: HangCay[]
}

const che = (s: string, entries: SourceNameEntry[]) => maskSourceNames(s, entries) ?? "—"

function choThieu(n: NutDanhBa): ChoThieu[] {
  const out: ChoThieu[] = []
  if (n.soToa === 0) out.push("chua-toa")
  if (n.toaChuaCan > 0) out.push("toa-chua-can")
  if (Object.values(n.tin).every((v) => !v)) out.push("chua-tin")
  if (n.nguon.length === 0) out.push("chua-nguon")
  return out
}

/** Dựng cây: dự án gốc (`project`) xếp theo số căn rồi số tin giảm dần; con theo id. Nút mồ côi không hiện. */
export function dungCay(nut: NutDanhBa[], tinh: Record<string, string>, entries: SourceNameEntry[]): HangCay[] {
  const con = new Map<number, NutDanhBa[]>()
  for (const n of nut) if (n.parentId != null) con.set(n.parentId, [...(con.get(n.parentId) ?? []), n])
  const tongTin = (n: NutDanhBa) => Object.values(n.tin).reduce((a, b) => a + b, 0)
  const hang = (n: NutDanhBa, tinhCha: string | null, laGoc: boolean, sau: number): HangCay => {
    const ten = che(n.ten, entries)
    const biDanh = n.biDanh.map((b) => che(b, entries))
    const t = n.tinhId ? (tinh[n.tinhId] ?? null) : tinhCha
    const subRows = sau < 16 ? (con.get(n.id) ?? []).map((c) => hang(c, t, false, sau + 1)) : []
    return {
      id: n.id,
      loai: n.loai,
      ten,
      biDanh,
      bac: n.bac,
      tinh: t,
      nguon: n.nguon,
      soPhanKhu: n.soPhanKhu,
      soToa: n.soToa,
      toaChuaCan: n.toaChuaCan,
      soCan: n.soCan,
      tin: n.tin,
      thieu: laGoc ? choThieu(n) : [],
      timKiem: fold([ten, ...biDanh].join(" ")),
      ...(subRows.length > 0 ? { subRows } : {}),
    }
  }
  return nut
    .filter((n) => n.loai === "project" && n.parentId == null)
    .sort((a, b) => b.soCan - a.soCan || tongTin(b) - tongTin(a) || a.id - b.id)
    .map((n) => hang(n, null, true, 0))
}

/** Hàng khớp chữ tìm khi tên hay bí danh của nó hoặc của một nút con chứa chữ (gấp dấu, không phân biệt hoa thường). */
export function khopTim(h: HangCay, chu: string): boolean {
  const f = fold(chu.trim())
  if (!f) return true
  const sau = (x: HangCay): boolean => x.timKiem.includes(f) || (x.subRows ?? []).some(sau)
  return sau(h)
}

/** Mã chưa nối sau bộ che (tên dự án nguồn có thể chứa tên nguồn thật). */
export function cheChuaNoi(rows: MaChuaNoi[], entries: SourceNameEntry[]): MaChuaNoi[] {
  return rows.map((r) => ({ ...r, ten: r.ten == null ? null : che(r.ten, entries) }))
}
