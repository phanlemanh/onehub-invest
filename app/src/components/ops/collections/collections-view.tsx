import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status"
import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { AttentionList, issuesOf } from "@/components/ops/collections/attention-list"
import { CollectionsTiles } from "@/components/ops/collections/collections-tiles"
import { feedSloSummary } from "@/components/ops/collections/feed-status"
import { FeedsGrid } from "@/components/ops/collections/feeds-grid"
import { JobsGrid } from "@/components/ops/collections/jobs-grid"
import { LockdownGrid } from "@/components/ops/collections/lockdown-grid"
import { RotationPanel, ZaloPipePanel } from "@/components/ops/collections/pipe-panels"
import { SyncActivity } from "@/components/ops/collections/sync-activity"
import { FlowTable, ZaloGroupsTable } from "@/components/ops/collections-tables"
import { PageHeader } from "@/components/page/page-header"
import type {
  FlowDay,
  GateFunnel,
  JobStatus,
  RotationPreview,
  ZaloAllowlistEntry,
  ZaloGroupRow,
  ZaloHealth,
} from "@/lib/collections-queries"
import { fmtInt } from "@/lib/format"
import { sloSummaryKey, sloSummaryText } from "@/lib/freshness"
import type { getLockdownStatus, SourceFeedHealth } from "@/lib/ops-queries"
import type { CloudOpsView } from "@/lib/ops-cloud"
import type { SourceRoles } from "@/lib/source-labels"

export type CollectionsData = {
  days: FlowDay[]
  funnel: GateFunnel
  jobs: JobStatus[]
  rotation: RotationPreview
  zaloGroups: ZaloGroupRow[]
  zaloAllowlist: ZaloAllowlistEntry[]
  zaloHealth: ZaloHealth
  factsPushedAt: string | null
  feedHealth: SourceFeedHealth[]
  lockdown: Awaited<ReturnType<typeof getLockdownStatus>>
  /** Mốc "bây giờ" của request (trang force-dynamic đọc một lần, truyền xuống các vùng). */
  nowMs: number
  /** Vai trò nguồn cho nhãn «S0x · vai trò» (ON7, lib/source-roles.ts); vắng → mã trần. */
  roles?: SourceRoles
  /** Cloud (ON3): số của ô đọc từ bản tin máy local (`getCloudOpsView`); vắng = máy local. */
  cloud?: CloudOpsView | null
}

/**
 * Phần hiển thị của /ops/collections "Thu Thập" — trang chỉ tải dữ liệu rồi truyền vào đây (AU6: phép đo render
 * trọn view để thấy cùng «x/y nguồn đạt SLO» với /ops). Trả lời 3 câu: hôm nay chảy vào gì / qua cổng nào / máy có
 * chạy không. Khung theo @reui/solution-dev-ops-6 (thẻ số · luồng + cần chú ý · lưới nguồn) và lưới job của
 * @reui/solution-dev-ops-1.
 */
export function CollectionsView({ days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, nowMs, roles = {}, cloud = null }: CollectionsData) {
  const factsAgeMin = factsPushedAt ? Math.round((nowMs - new Date(factsPushedAt).getTime()) / 60_000) : null
  const lastPostHours = zaloHealth.lastPostAt ? Math.round((nowMs - new Date(zaloHealth.lastPostAt).getTime()) / 3_600_000) : null
  const issues = issuesOf({ feeds: feedHealth, layers: lockdown.layers, agentTurnsToday: lockdown.agentTurnsToday, zalo: zaloHealth, groups: zaloGroups, factsAgeMin: cloud ? null : factsAgeMin, nowMs, roles })
  // Cùng một con số với /ops (AU6): x/y nguồn đạt SLO.
  const slo = feedSloSummary(feedHealth)

  return (
    <div className="flex flex-col gap-6" data-slo-summary={sloSummaryKey(slo)}>
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Thu thập" }]}
        title="Thu thập"
        stats={[
          ...(cloud && !cloud.feeds ? [] : [sloSummaryText(slo)]),
          `Hôm nay ${days[0]?.day ?? "—"}`,
          ...(!cloud && factsAgeMin !== null ? [`Máy thu ${fmtInt(factsAgeMin)}′ trước`] : []),
        ]}
        description="Dữ liệu chảy vào theo nguồn và theo ngày — không phải mở log tay."
      />
      {cloud ? <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud ? <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud?.state === "none" ? (
        <LocalOnlyAlert title="Chỉ đo ở máy local">
          Máy local chưa đẩy số tổng hợp lên cloud. Kiểm cloud-sync ở máy thu, hoặc xem Ops trên máy thu.
        </LocalOnlyAlert>
      ) : null}
      <CollectionsTiles
        feeds={feedHealth}
        funnel={funnel}
        layers={lockdown.layers}
        agentTurnsToday={lockdown.agentTurnsToday}
        roles={roles}
        cloud={cloud ? { feedsMeasured: cloud.feeds !== null, records24h: cloud.records24h ? cloud.records24h.reduce((a, r) => a + r.n, 0) : null, stale: cloud.state === "stale", funnelMeasured: cloud.state !== "none" } : undefined}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SyncActivity days={days} roles={roles} className="min-w-0 lg:col-span-2" />
        <AttentionList issues={issues} roles={roles} className="min-w-0" />
      </div>
      <FeedsGrid feeds={feedHealth} stale={cloud?.state === "stale"} />
      {/* Cloud: lớp lockdown chưa kiểm được ở đây tới ON23 (Hỏi-1 = A) — khớp ô Lockdown, không «Ổn» từ máy đang chạy trang. */}
      <LockdownGrid layers={cloud ? lockdown.layers.map((l) => ({ ...l, ok: null })) : lockdown.layers} lastWatchdogAt={lockdown.lastWatchdogAt} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ZaloPipePanel zalo={zaloHealth} funnel={funnel} lastPostHours={lastPostHours} roles={roles} />
        <RotationPanel rotation={rotation} roles={roles} />
      </div>
      <FlowTable days={days} roles={roles} />
      <div id="nhom-s03" className="scroll-mt-4">
        <ZaloGroupsTable rows={zaloGroups} allowlist={zaloAllowlist} roles={roles} />
      </div>
      <JobsGrid jobs={jobs} stale={cloud?.state === "stale"} />
    </div>
  )
}
