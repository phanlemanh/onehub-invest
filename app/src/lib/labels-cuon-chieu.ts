/**
 * Lát «Mẫu soát cuốn chiếu» của DO1 (`do-hieu-qua-hang-ngay`): mỗi ngày 20 bài S03, máy chụp nháp của mọi cách đọc vào
 * `eval_label_items.draft` (pipeline/mau-soat-cuon-chieu.mjs). Màn gắn nhãn điền sẵn nháp của cách đọc `hien`; ô bảng chọn
 * model giao người (`draft.o_nguoi`) để trống. Giá trị nháp đã ở khuôn chuỗi của eval_labels (VND nguyên, «64.5», mã sổ).
 */
export const LAT_CUON_CHIEU = "s03-cuon-chieu"

export type NhapMay = { cachDoc: string; o: Record<string, string | null> }

type Draft = {
  hien?: string
  o_nguoi?: string[]
  cach_doc?: Record<string, { trang_thai?: string; o?: Record<string, string | null> }>
}

/** Nháp của cách đọc hiện, bỏ ô giao người; không có nháp `co` thì null. */
export function nhapTuDraft(draft: unknown, { dotBien }: { dotBien?: "bo-o-nguoi" | "tien-to" } = {}): NhapMay | null {
  const d = draft as Draft | null
  const hien = d?.hien
  const n = hien ? d?.cach_doc?.[dotBien === "tien-to" ? hien.split(":")[0] : hien] : undefined
  if (!hien || n?.trang_thai !== "co" || !n.o) return null
  const bo = new Set(dotBien === "bo-o-nguoi" ? [] : (d?.o_nguoi ?? []))
  return { cachDoc: hien, o: Object.fromEntries(Object.entries(n.o).filter(([f]) => !bo.has(f))) }
}
