/**
 * Hằng số + kiểu của trang So sánh — module thường (không "use client") vì
 * trang server cần GIÁ TRỊ của COMPARE_MAX: import từ file client chỉ nhận
 * được một tham chiếu client, và .slice(0, tham_chiếu) trả mảng rỗng.
 */
import type { AreaThumbnail } from "@/lib/queries"

export const COMPARE_MAX = 4

export type CompareArea = {
  id: string
  name: string
  parentName: string | null
  href: string
  /** Giá trị đã định dạng theo id hàng; null = chưa có số. */
  values: Record<string, { text: string; raw: number | null } | null>
  headline: string
  /** Ảnh một listing tự thu trong khu vực; null → ô RevPAR như cũ. */
  thumbnail: AreaThumbnail | null
}

export type CompareRow = {
  id: string
  label: string
  hint?: string
  /** Cao hơn là tốt (đánh dấu ô tốt nhất); null = không so tốt/xấu. */
  better: "high" | "low" | null
}

export type CompareGroup = { id: string; label: string; badge?: string; rows: CompareRow[] }
