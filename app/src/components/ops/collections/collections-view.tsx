import { CircleAlertIcon } from "lucide-react"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
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
  /** Cloud: không có bảng nguồn/bảng nạp — độ tươi chỉ đo ở máy local. */
  localOnly?: boolean
}

/**
 * Phần hiển thị của /ops/collections "Thu Thập" — trang chỉ tải dữ liệu rồi truyền vào đây (AU6: phép đo render
 * trọn view để thấy cùng «x/y nguồn đạt SLO» với /ops). Trả lời 3 câu: hôm nay chảy vào gì / qua cổng nào / máy có
 * chạy không. Khung theo @reui/solution-dev-ops-6 (thẻ số · luồng + cần chú ý · lưới nguồn) và lưới job của
 * @reui/solution-dev-ops-1.
 */
export function CollectionsView({ days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, nowMs, localOnly = false }: CollectionsData) {
  const factsAgeMin = factsPushedAt ? Math.round((nowMs - new Date(factsPushedAt).getTime()) / 60_000) : null
  const lastPostHours = zaloHealth.lastPostAt ? Math.round((nowMs - new Date(zaloHealth.lastPostAt).getTime()) / 3_600_000) : null
  const issues = issuesOf({ feeds: feedHealth, layers: lockdown.layers, agentTurnsToday: lockdown.agentTurnsToday, zalo: zaloHealth, groups: zaloGroups, factsAgeMin, nowMs })
  // Cùng một con số với /ops (AU6): x/y nguồn đạt SLO.
  const slo = feedSloSummary(feedHealth)

  return (
    <div className="flex flex-col gap-6" data-slo-summary={sloSummaryKey(slo)}>
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Thu thập" }]}
        title="Thu thập"
        stats={[
          sloSummaryText(slo, localOnly),
          `Hôm nay ${days[0]?.day ?? "—"}`,
          ...(factsAgeMin !== null ? [`Máy thu ${fmtInt(factsAgeMin)}′ trước`] : []),
        ]}
        description="Dữ liệu chảy vào theo nguồn và theo ngày — không phải mở log tay."
      />
      {localOnly ? <LocalOnlyAlert /> : null}
      {factsAgeMin !== null && factsAgeMin > 30 ? (
        <Alert variant="warning">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Máy thu có thể offline</AlertTitle>
          <AlertDescription>Dữ liệu máy thu cập nhật {fmtInt(factsAgeMin)} phút trước.</AlertDescription>
        </Alert>
      ) : null}
      <CollectionsTiles feeds={feedHealth} funnel={funnel} layers={lockdown.layers} agentTurnsToday={lockdown.agentTurnsToday} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SyncActivity days={days} className="min-w-0 lg:col-span-2" />
        <AttentionList issues={issues} className="min-w-0" />
      </div>
      <FeedsGrid feeds={feedHealth} />
      <LockdownGrid layers={lockdown.layers} lastWatchdogAt={lockdown.lastWatchdogAt} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ZaloPipePanel zalo={zaloHealth} funnel={funnel} lastPostHours={lastPostHours} />
        <RotationPanel rotation={rotation} />
      </div>
      <FlowTable days={days} />
      <div id="nhom-zalo" className="scroll-mt-4">
        <ZaloGroupsTable rows={zaloGroups} allowlist={zaloAllowlist} />
      </div>
      <JobsGrid jobs={jobs} />
    </div>
  )
}
