import type { Nhan } from "./ops-labels"

/**
 * Trạng thái mã nguồn trong danh mục nguồn (`source_registry.status`; CHECK `source_registry_status_chk` của migration
 * 047). Tách khỏi ops-labels.ts ở DB2b vì `active`/`retired` trùng chữ với trục registry_status của danh bạ; từ khi có
 * `draft` (năm khoá, hai trùng chữ) `vocab --lint` không còn coi bảng là trục ấy nên ngoại lệ trong mappings.yaml đã gỡ.
 * Mọi giá trị CHECK cho phép phải có nhãn ở đây — test `app/tests/source-status-labels.test.tsx` đỏ khi thiếu.
 * Thuật ngữ: «Trạng thái mã nguồn» trong CONTEXT.md.
 */
export const NHAN_TRANG_THAI_NGUON: Readonly<Record<string, string>> = {
  // Mã nguồn đã đăng ký trong danh mục nhưng chưa thu (hàng nhan-trang-thai-nguon-draft).
  draft: "Chưa thu",
  active: "Đang dùng",
  paused: "Tạm dừng",
  completed: "Đã xong",
  retired: "Đã ngừng",
}

export const sourceStatusLabel = (v: string | null | undefined): Nhan =>
  v != null && Object.hasOwn(NHAN_TRANG_THAI_NGUON, v)
    ? { label: NHAN_TRANG_THAI_NGUON[v], known: true }
    : { label: "Giá trị khác", known: false }
