// Chữ của trang /ops/group-cards «Thẻ địa chỉ nhóm» (TG1 the-dia-chi-nhom-s03). Không "use client": trang máy chủ và
// thành phần client cùng import.
import { fmtInt } from "@/lib/format"
import type { CanCuO, MucDich, TheDiaChi, TrangThaiThe } from "@/lib/the-dia-chi-nhom"

export const LENH_DUNG = "node pipeline/scripts/the-dia-chi-nhom.mjs --ghi --may-thu"

export const NHAN_TRANG_THAI: Record<TrangThaiThe, { label: string; variant: "warning-light" | "success-light" | "destructive-light" }> = {
  nhap: { label: "Nháp", variant: "warning-light" },
  da_duyet: { label: "Đã duyệt", variant: "success-light" },
  bac: { label: "Bác", variant: "destructive-light" },
}

export const NHAN_MUC_DICH: Record<MucDich, string> = { ban: "Bán", thue: "Thuê", ca_hai: "Cả bán và thuê" }

const NGUON: Record<string, string> = {
  so: "theo sổ nhóm",
  nhan: "từ bài đã đọc",
  du_an: "theo dự án",
  tin: "theo tin của nhóm",
}

/** Dòng căn cứ của một ô: vì sao máy điền, hay vì sao để trống. */
export function dongCanCu(o: CanCuO | undefined, soBaiDoc: number, coGiaTri: boolean): string {
  if (!coGiaTri) return `Chưa đủ căn cứ (${fmtInt(soBaiDoc)} bài đã đọc)`
  if (!o || !o.nguon) return "Người vận hành điền"
  const nguon = NGUON[o.nguon] ?? o.nguon
  const don = o.nguon === "tin" ? "tin" : "bài"
  return o.so_bai > 0 ? `${nguon}, ${fmtInt(o.so_bai)} ${don}` : nguon
}

/** Dòng căn cứ của ô bán/thuê kèm số bài mỗi phía. */
export function dongCanCuMucDich(t: TheDiaChi): string {
  const o = t.evidence.muc_dich
  const doc = t.evidence.so_bai_doc ?? 0
  if (!t.muc_dich) return `Chưa đủ căn cứ (${fmtInt(doc)} bài đã đọc)`
  if (!o) return "Người vận hành điền"
  return `từ bài đã đọc: ${fmtInt(o.ban ?? 0)} bán, ${fmtInt(o.thue ?? 0)} thuê`
}

export const tenNhom = (t: TheDiaChi) => t.ten_nhom ?? "Chưa có trong sổ"
