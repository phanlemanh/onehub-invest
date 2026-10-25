/**
 * ops-cloud.ts — số của ô KPI Ops trên cloud (ON3 `o-kpi-chi-do-local`, ADR-0014). Trên cloud các bảng tầng A vắng nên
 * trang không tự đo; số lấy từ các khối máy local đẩy lên (`readOpsFacts`, ON22). Một lần đọc mỗi request, dựng sẵn số cho
 * /ops, /ops/collections, /ops/review. Khối vắng hoặc mang lỗi → `null`: trang hiện «—», không bao giờ 0.
 */
import type { JobStatus, ZaloGroupRow } from "./collections-queries"
import { bySource, type FreshnessRow } from "./freshness"
import { readOpsFacts, type FactsState } from "./ops-facts"
import { toCoverageRows, type CoverageRow, type LockdownLayer, type SourceFeedHealth } from "./ops-queries"

export type PendingCount = { byType: { type: string; n: number }[]; total: number }

/** Khối khoá an toàn máy thu đẩy lên (ON23). `stale` theo `measured_at` CỦA KHỐI (ADR-0014 §Ngưỡng trễ). */
export type CloudLockdown = { layers: LockdownLayer[]; lastWatchdogAt: string | null; agentTurnsToday: number | null; stale: boolean }
/** Khối `s03` máy thu đẩy lên (ON4): N nhóm bật + hàng từng nhóm (chỉ tên — tầng C, Hỏi-1 = A). Tên `""` = nhóm chưa có
 * tên (bên ghi bỏ mã nhóm); `accepted` null = không biết số tin vào. `stale` theo `measured_at` CỦA KHỐI. */
export type CloudS03 = { allowlistEnabled: number; groups: ZaloGroupRow[]; stale: boolean }
/** Một ngày của khối `luong7` (ON5): hai cột S03 máy thu đếm sẵn — bài S03 thật theo ngày đăng, tin rao nguồn S03. */
export type Luong7Day = { day: string; s03Posts: number; s03Offers: number }

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
  /** Khối `lockdown`; vắng, lỗi hay sai khuôn → null — trang hiện 8 lớp «Chỉ kiểm ở máy thu» (ON23 Hỏi-4 = A). */
  lockdown: CloudLockdown | null
  /** Khối `luong7` (ON5): 7 ngày VN; vắng hoặc lỗi → null (ô S03 hiện «—», không 0). */
  luong7: Luong7Day[] | null
  /** Khối `s03` (ON4); vắng, lỗi hay sai khuôn → null — bảng nhóm S03 không dựng, vùng ở lại Alert gom. */
  s03: CloudS03 | null
}

type SourceRun = { code: string; label_vi?: string | null; status?: string | null }

/** Đọc bản tin máy local và dựng số cho ba trang. `now` chỉ để phép đo trỏ mốc giờ. */
export async function getCloudOpsView({ now }: { now?: Date } = {}): Promise<CloudOpsView> {
  const empty: CloudOpsView = { state: "none", measuredAt: null, coverage: null, feeds: null, records24h: null, pending: null, lockdown: null, luong7: null, s03: null }
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

  const l7 = f.blocks.luong7
  const l7Days = l7?.state !== "error" ? (l7?.data?.days as Luong7Day[] | undefined) : undefined
  if (Array.isArray(l7Days)) view.luong7 = l7Days
  if (Array.isArray(rows)) view.coverage = toCoverageRows(rows)
  view.lockdown = toCloudLockdown(f.blocks.lockdown)
  view.s03 = toCloudS03(f.blocks.s03)
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

/** Khối `lockdown` → dữ liệu lưới; mọi hàng phải đúng khuôn (lớp, mô tả là chữ; `ok` là true / false / null), sai một hàng
 * là cả khối không dùng được — không bao giờ đoán một lớp thành «Ổn». */
function toCloudLockdown(b: Awaited<ReturnType<typeof readOpsFacts>>["blocks"]["lockdown"]): CloudLockdown | null {
  if (!b || b.state === "error" || !b.data) return null
  const d = b.data as { layers?: unknown; lastWatchdogAt?: unknown; agentTurnsToday?: unknown }
  if (!Array.isArray(d.layers) || d.layers.length === 0) return null
  const layers: LockdownLayer[] = []
  for (const l of d.layers as Record<string, unknown>[]) {
    if (typeof l?.layer !== "string" || typeof l?.desc !== "string") return null
    if (l.ok !== true && l.ok !== false && l.ok !== null) return null
    layers.push({ layer: l.layer, desc: l.desc, ok: l.ok })
  }
  return {
    layers,
    lastWatchdogAt: typeof d.lastWatchdogAt === "string" ? d.lastWatchdogAt : null,
    agentTurnsToday: typeof d.agentTurnsToday === "number" ? d.agentTurnsToday : null,
    stale: b.state === "stale",
  }
}

/** Khối `s03` → hàng bảng nhóm. Số đếm phải là số, tên là chữ hoặc null; sai một hàng là cả khối không dùng được — bảng
 * không bao giờ hiện số đoán. Riêng `accepted` vắng hay null (bản tin đời cũ / không biết) → null, ô ghi «—». */
function toCloudS03(b: Awaited<ReturnType<typeof readOpsFacts>>["blocks"]["s03"]): CloudS03 | null {
  if (!b || b.state === "error" || !b.data) return null
  const d = b.data as { allowlistEnabled?: unknown; groups?: unknown }
  if (typeof d.allowlistEnabled !== "number" || !Array.isArray(d.groups)) return null
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v)
  const str = (v: unknown) => (typeof v === "string" ? v : null)
  const groups: ZaloGroupRow[] = []
  for (const g of d.groups as Record<string, unknown>[]) {
    if (g?.name !== null && typeof g?.name !== "string") return null
    if (!num(g.seen) || !num(g.passed) || !num(g.skipped) || !num(g.realPosts7d) || !num(g.mockPosts7d)) return null
    groups.push({
      name: (g.name as string | null) ?? "",
      seen: g.seen as number,
      passed: g.passed as number,
      skipped: g.skipped as number,
      accepted: num(g.accepted) ? (g.accepted as number) : null,
      realPosts7d: g.realPosts7d as number,
      mockPosts7d: g.mockPosts7d as number,
      isMockOnly: g.isMockOnly === true,
      lastSeenAt: str(g.lastSeenAt),
      lastEventAt: str(g.lastEventAt),
      ownerAccount: null,
    })
  }
  return { allowlistEnabled: d.allowlistEnabled, groups, stale: b.state === "stale" }
}

/** Hai hàng cổng của lưới Máy móc ↔ lớp «Hạ tầng» cùng cổng trong khối khoá an toàn (ON23 Hỏi-1 = A): một lần đo nên hai
 * bảng cùng trạng thái. Mỗi hàng đọc ĐÚNG lớp của cổng mình. */
const GATE_LAYER: Record<string, string> = { kev: "Cổng Kev :8009", "collector-api": "Cổng nhận tin :9210" }

/** Máy chủ: trạng thái hàng Kev gate / collector API lấy từ khối `lockdown` (true → Sống, false → Không phản hồi, null hay
 * không khối → Chưa kiểm được), cờ cũ theo khối; các hàng khác giữ nguyên khoá `jobs` của bản tin. */
export function withLockdownGates(jobs: JobStatus[], lockdown: CloudLockdown | null): JobStatus[] {
  return jobs.map((j) => {
    const desc = GATE_LAYER[j.id]
    if (!desc) return j
    const ok = lockdown?.layers.find((l) => l.layer === "Hạ tầng" && l.desc === desc)?.ok ?? null
    return { ...j, alive: ok === true ? "yes" : ok === false ? "no" : "unchecked", stale: lockdown?.stale ?? false }
  })
}
