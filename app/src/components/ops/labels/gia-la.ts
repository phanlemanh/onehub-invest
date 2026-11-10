import { veVnd, type PriceUnit } from "@/lib/labels-normalize"
import { KIND } from "@/lib/vocab.generated"

/** Đơn vị giá mặc định theo Loại tin: thuê tính theo tháng nên triệu, bán tính tỷ. Loại khác: không đổi. */
export function donViTheoLoai(kind: string | undefined): PriceUnit | null {
  return kind === KIND.rent_lt ? "trieu" : kind === KIND.sale ? "ty" : null
}

const MOT_TY = BigInt(1_000_000_000)
const TRAM_TRIEU = BigInt(100_000_000)
const TEN: Record<PriceUnit, string> = { ty: "tỷ", trieu: "triệu" }

/**
 * Câu hỏi lại khi giá lạ so với Loại tin: thuê từ 1 tỷ một tháng trở lên, hoặc bán dưới 100 triệu. Chỉ là hỏi lại một lần
 * trước khi lưu, không phải luật kiểm: luật kiểm vẫn ở `chuanHoaLuot`. Giá không đọc được thì để luật kiểm báo.
 */
export function cauGiaLa(kind: string | undefined, gia: string[], unit: PriceUnit): string | null {
  for (const s of gia) {
    const v = s.trim() ? veVnd(s, unit) : null
    if (typeof v !== "bigint") continue
    if (kind === KIND.rent_lt && v >= MOT_TY) return `Giá thuê ${s.trim()} ${TEN[unit]} một tháng — cao bất thường. Đơn vị có đúng không?`
    if (kind === KIND.sale && v < TRAM_TRIEU) return `Giá bán ${s.trim()} ${TEN[unit]} — thấp bất thường. Đơn vị có đúng không?`
  }
  return null
}
