// source-roles.ts — đọc vai trò nguồn cho nhãn «S0x · vai trò» (lib/source-labels.ts). ON7 `ops-nhan-ma-nguon`.
// Local: source_registry (code, label_vi). Cloud không có source_registry (sự cố 24/10) → facts.sourceRuns mà máy thu
// đã đẩy. Không có cả hai → {} (trang vẫn dựng, nhãn là mã trần). Chỉ đọc code + label_vi — không bao giờ real_name.
import { getFactsSourceRuns } from "./collections-queries"
import { pool } from "./db"
import type { SourceNameEntry } from "./mask-source-names"
import type { SourceRoles } from "./source-labels"

const toRoles = (rows: { code?: string | null; label_vi?: string | null }[]): SourceRoles =>
  Object.fromEntries(rows.filter((r) => r.code && r.label_vi).map((r) => [r.code as string, r.label_vi as string]))

export async function getSourceRoles(): Promise<SourceRoles> {
  try {
    const { rows } = await pool.query<{ code: string; label_vi: string | null }>("SELECT code, label_vi FROM source_registry")
    const roles = toRoles(rows)
    if (Object.keys(roles).length) return roles
  } catch {
    // cloud: bảng không có — rơi xuống facts
  }
  return toRoles(await getFactsSourceRuns())
}

/** Local: [{ code, realName }] từ source_registry — CHỈ để che tên trong chữ chạy (mask-source-names), không bao giờ
 *  render. Cloud/DB lỗi → [] → bộ che trả null (đóng chặt). */
export async function getSourceNameEntries(): Promise<SourceNameEntry[]> {
  try {
    const { rows } = await pool.query<{ code: string; real_name: string | null }>("SELECT code, real_name FROM source_registry")
    return rows.filter((r) => r.real_name).map((r) => ({ code: r.code, realName: r.real_name as string }))
  } catch {
    return []
  }
}
