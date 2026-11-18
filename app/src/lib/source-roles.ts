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

type RegRow = { code: string; real_name: string | null; ids: string[] | null; match_whole: boolean }
const CO_CO = "SELECT code, real_name, coalesce(source_ids, '{}') AS ids, match_whole FROM source_registry ORDER BY code"
const KHONG_CO = "SELECT code, real_name, coalesce(source_ids, '{}') AS ids, false AS match_whole FROM source_registry ORDER BY code"

/** Bản chép của pipeline/lib/source-name-entries.mjs (app không import pipeline) — che-ten-nguon-khong-lay-tu-dau.
 *  [{ code, realName, wholeOnly }]: mỗi token (tên thật và từng định danh) một mục, mang cờ match_whole (migration 112).
 *  CHỈ để che/soát tên trong chữ chạy, không bao giờ render. Thiếu cột (42703) → cờ false (che thừa); không có bảng
 *  (42P01) → []; lỗi khác → ném. */
export async function docSourceNameEntries(): Promise<SourceNameEntry[]> {
  let rows: RegRow[]
  try {
    ;({ rows } = await pool.query<RegRow>(CO_CO))
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "42P01") return []
    if (code !== "42703") throw e
    try {
      ;({ rows } = await pool.query<RegRow>(KHONG_CO))
    } catch (e2) {
      if ((e2 as { code?: string })?.code === "42P01") return []
      throw e2
    }
  }
  const out: SourceNameEntry[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    for (const t of [r.real_name, ...(r.ids ?? [])]) {
      if (typeof t !== "string" || t.trim() === "") continue
      const k = `${r.code}\u0000${t}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ code: r.code, realName: t, wholeOnly: r.match_whole === true })
    }
  }
  return out
}

export async function getSourceNameEntries(): Promise<SourceNameEntry[]> {
  try {
    return await docSourceNameEntries()
  } catch {
    return []
  }
}
