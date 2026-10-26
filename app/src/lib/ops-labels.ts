/**
 * Nhãn tiếng Việt cho giá trị thô từ dữ liệu hiện trên cổng Ops (ON12 `ops-nhan-theo-context`, design doc §2.5).
 * Thuần, không truy vấn. Giá trị chưa có nhãn → «Giá trị khác» kèm `known: false` để nơi hiện in mã trong `<code>`.
 */

import { LABELS_VI } from "@/lib/vocab.generated"

export type Nhan = { label: string; known: boolean }

const nhan = (bang: Record<string, string>) => (v: string | null | undefined): Nhan =>
  v != null && Object.hasOwn(bang, v) ? { label: bang[v], known: true } : { label: "Giá trị khác", known: false }

/** Trạng thái mã nguồn trong danh mục nguồn (`source_registry.status`). */
export const sourceStatusLabel = nhan({
  active: "Đang dùng",
  paused: "Tạm dừng",
  completed: "Đã xong",
  retired: "Đã ngừng",
})

/** Loại hình của tin rao (`sale_offers.property_type`) — nhãn từ sổ từ vựng (PL6). */
export const propertyTypeLabel = nhan(LABELS_VI.property_type)

/** Loại tin (`sale_offers.kind`) — nhãn từ sổ từ vựng. */
export const offerKindLabel = nhan(LABELS_VI.kind)

/** Độ tin trích xuất (`sale_offers.confidence`) — nhãn từ sổ từ vựng. */
export const confidenceLabel = nhan(LABELS_VI.confidence)

/** Đề xuất của AI ở thẻ ghép tin (`ai_suggestion`). */
export const aiSuggestionLabel = nhan({ yes: "cùng căn", no: "khác căn", apply: "nên áp", unsure: "chưa chắc" })

/** Bậc giá của tin rao (`price_tier`) — nhãn CONTEXT «Bậc giá» kèm mã, từ sổ từ vựng. */
export const priceTierLabel = nhan(LABELS_VI.price_tier)
