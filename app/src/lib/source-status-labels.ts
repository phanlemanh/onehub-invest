import type { Nhan } from "./ops-labels"

/**
 * Trạng thái mã nguồn trong danh mục nguồn (`source_registry.status`, migration 012). Tách khỏi ops-labels.ts ở DB2b:
 * hai mã `active`/`retired` trùng chữ với trục registry_status của danh bạ, nên bảng nhãn viết tay này là ngoại lệ
 * có tên của `vocab --lint` (pipeline/mappings.yaml `enums_lint_allow`).
 */
const NHAN_TRANG_THAI: Record<string, string> = {
  active: "Đang dùng",
  paused: "Tạm dừng",
  completed: "Đã xong",
  retired: "Đã ngừng",
}

export const sourceStatusLabel = (v: string | null | undefined): Nhan =>
  v != null && Object.hasOwn(NHAN_TRANG_THAI, v) ? { label: NHAN_TRANG_THAI[v], known: true } : { label: "Giá trị khác", known: false }
