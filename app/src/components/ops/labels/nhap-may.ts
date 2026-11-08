import type { LabelField, PriceUnit } from "@/lib/labels-normalize"
import type { NhapMay } from "@/lib/labels-cuon-chieu"

import { O_TRONG, TAT_CA_O, type O } from "./nhom-fields"

/** Số thập phân kiểu Việt (dấu phẩy), tối đa `le` chữ số lẻ; nhiều hơn thì null. */
function phay(n: number, le: number): string | null {
  const s = String(Number(n.toFixed(6)))
  const [, p = ""] = s.split(".")
  return p.length <= le ? s.replace(".", ",") : null
}

/** Giá VND về cặp (giá trị, đơn vị) biểu mẫu nhận: tỷ khi ≥ 1 tỷ và ≤ 2 chữ số lẻ, không thì triệu. */
function giaVeO(vnd: number): { value: string; unit: PriceUnit } {
  const ty = vnd >= 1e9 ? phay(vnd / 1e9, 2) : null
  return ty ? { value: ty, unit: "ty" } : { value: phay(vnd / 1e6, 2) ?? String(vnd / 1e6), unit: "trieu" }
}

/**
 * Nháp máy (khuôn eval_labels) → ô của biểu mẫu nhóm. Ô vắng trong nháp để trống; nháp `null` là «không suy ra được».
 * Căn cứ mặc định Chữ bài — người sửa căn cứ khi máy đọc từ ảnh.
 */
export function nhapVeO(nhap: NhapMay): { cells: Partial<Record<LabelField, O>>; donVi: PriceUnit } {
  const cells: Partial<Record<LabelField, O>> = {}
  let donVi: PriceUnit = "ty"
  const gia = ["price_min_vnd", "price_max_vnd"].map((f) => nhap.o[f]).filter((v): v is string => typeof v === "string")
  if (gia.length) donVi = gia.map((v) => giaVeO(Number(v)).unit).includes("trieu") ? "trieu" : "ty"
  for (const d of TAT_CA_O) {
    if (!(d.id in nhap.o)) continue
    const v = nhap.o[d.id]
    if (v === null || v === undefined) {
      if (d.noBasis) continue
      cells[d.id] = { ...O_TRONG, unknown: true }
      continue
    }
    let value = v
    if (d.kind === "gia") value = (donVi === "ty" ? phay(Number(v) / 1e9, 2) : phay(Number(v) / 1e6, 2)) ?? String(Number(v) / 1e6)
    else if (d.id === "area_m2") value = v.replace(".", ",")
    else if (d.id === "seller_phone" && v.startsWith("+84")) value = `0${v.slice(3)}`
    cells[d.id] = { ...O_TRONG, value }
  }
  return { cells, donVi }
}
