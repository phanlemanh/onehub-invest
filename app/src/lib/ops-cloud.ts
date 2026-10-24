/**
 * ops-cloud.ts — số của ô KPI Ops trên cloud (ON3 `o-kpi-chi-do-local`, ADR-0014). Trên cloud các bảng tầng A vắng nên
 * trang không tự đo; số lấy từ các khối máy local đẩy lên (`readOpsFacts`, ON22). Một lần đọc mỗi request, dựng sẵn số cho
 * /ops, /ops/collections, /ops/review. Khối vắng hoặc mang lỗi → `null`: trang hiện «—», không bao giờ 0.
 */
import { bySource, type FreshnessRow } from "./freshness"
import { readOpsFacts, type FactsState } from "./ops-facts"
import { toCoverageRows, type CoverageRow, type SourceFeedHealth } from "./ops-queries"

export type PendingCount = { byType: { type: string; n: number }[]; total: number }

export type CloudOpsView = {
  state: FactsState
  /** `pushedAt` của lần đẩy cuối (null khi chưa có bản tin). */
  measuredAt: string | null
  coverage: CoverageRow[] | null
  /** Sức khoẻ từng nguồn cho ô Thu thập: độ tươi từ khối `freshness`; `items24h` từ `records24h` (0 khi khối 24h thiếu
   * nhưng khi đó `records24h` là null và ô «Bản ghi 24h» hiện «—»). */
  feeds: SourceFeedHealth[] | null
  records24h: { code: string; n: number }[] | null
  pending: PendingCount | null
}

type SourceRun = { code: string; label_vi?: string | null; status?: string | null }

/** Đọc bản tin máy local và dựng số cho ba trang. `now` chỉ để phép đo trỏ mốc giờ. */
export async function getCloudOpsView({ now }: { now?: Date } = {}): Promise<CloudOpsView> {
  const empty: CloudOpsView = { state: "none", measuredAt: null, coverage: null, feeds: null, records24h: null, pending: null }
  let f: Awaited<ReturnType<typeof readOpsFacts>>
  try {
    f = await readOpsFacts({ now })
  } catch (e) {
    // Bảng ops_heartbeat vắng (42P01) = chưa có bản tin nào; lỗi khác vẫn ném để trang hiện lỗi thật.
    if ((e as { code?: string }).code === "42P01") return empty
    throw e
  }
  const view: CloudOpsView = { ...empty, state: f.state, measuredAt: f.measuredAt }
  if (f.state === "none") return view

  const fresh = f.blocks.freshness
  const rows = fresh?.state !== "error" ? (fresh?.data?.rows as FreshnessRow[] | undefined) : undefined
  const rec = f.blocks.records24h
  const recRows = rec?.state !== "error" ? (rec?.data?.bySource as { code: string; n: number }[] | undefined) : undefined
  const rq = f.blocks.reviewQueue
  const pending = rq?.state !== "error" ? (rq?.data as PendingCount | null | undefined) : undefined

  if (Array.isArray(rows)) view.coverage = toCoverageRows(rows)
  if (Array.isArray(recRows)) view.records24h = recRows
  if (pending && Array.isArray(pending.byType) && typeof pending.total === "number") {
    view.pending = { byType: pending.byType, total: pending.total }
  }
  if (Array.isArray(rows)) {
    const runs = new Map(((f.facts?.sourceRuns as SourceRun[] | undefined) ?? []).map((r) => [r.code, r]))
    const n24 = new Map((recRows ?? []).map((r) => [r.code, r.n]))
    view.feeds = bySource(rows).map((s) => ({
      code: s.code,
      labelVi: runs.get(s.code)?.label_vi ?? s.code,
      status: runs.get(s.code)?.status ?? "active",
      note: null,
      lastRunAt: rows.filter((r) => r.code === s.code && r.last).map((r) => r.last as string).sort().at(-1) ?? null,
      lastRunSource: null,
      items24h: n24.get(s.code) ?? 0,
      stgRows: 0,
      offers: null,
      freshnessHrs: s.ageHours,
      sloHours: s.sloHours,
      freshness: s.status,
    }))
  }
  return view
}
