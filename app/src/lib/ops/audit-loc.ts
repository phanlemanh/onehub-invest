// audit-loc.ts — dấu máy trong ops_audit mà nhật ký thao tác Ops không trả (hồ sơ loc-enrich-thu-ops-audit).
// Danh sách ĐÓNG, đúng tên action: không lọc theo tiền tố (enrich:revert/reconcile/retire là thao tác hoàn tác, dọn)
// và không theo actor (thao tác người mang nhiều khuôn actor). Bên ghi: agent/src/enrich/run.ts — đổi tên dấu ở đó thì
// ca LA-AC-5 của app/tests/audit-loc.test.tsx đỏ.

/** Action ops_audit là sổ sách của máy (dấu «đã thử» của enrich), không phải một thao tác Ops. */
export const DAU_MAY: readonly string[] = ["enrich:thu"]
