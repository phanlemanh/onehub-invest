/**
 * Nhãn tiếng Việt cho giá trị thô từ dữ liệu hiện trên cổng Ops (ON12 `ops-nhan-theo-context`, design doc §2.5).
 * Thuần, không truy vấn. Giá trị chưa có nhãn → «Giá trị khác» kèm `known: false` để nơi hiện in mã trong `<code>`.
 */

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

/** Loại hình của tin rao (`sale_offers.property_type`). */
export const propertyTypeLabel = nhan({
  apartment: "Căn hộ",
  house: "Nhà riêng",
  land: "Đất",
  room: "Phòng",
  commercial: "Mặt bằng",
  unknown: "Chưa rõ",
})

/** Loại tin (`sale_offers.kind`). */
export const offerKindLabel = nhan({ sale: "Bán", rent_lt: "Cho thuê" })

/** Độ tin trích xuất (`sale_offers.confidence`). */
export const confidenceLabel = nhan({ high: "cao", medium: "trung bình", low: "thấp" })

/** Đề xuất của AI ở thẻ ghép tin (`ai_suggestion`). */
export const aiSuggestionLabel = nhan({ yes: "cùng căn", no: "khác căn" })

/** Bậc giá của tin rao (`price_tier`) — nhãn CONTEXT «Bậc giá» kèm mã. */
export const priceTierLabel = nhan({
  P0: "giá giao dịch (P0)",
  P1: "giá nội bộ (P1)",
  P2: "giá công khai (P2)",
})
