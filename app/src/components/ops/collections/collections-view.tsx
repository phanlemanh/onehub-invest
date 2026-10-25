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
import { CloudFlowTable, FlowTable, ZaloGroupsTable } from "@/components/ops/collections-tables"
import { PageHeader } from "@/components/page/page-header"
import type {
  CloudFlowDay,
  FlowDay,
  GateFunnel,
  JobStatus,
  RotationPreview,
  ZaloAllowlistEntry,
  ZaloGroupRow,
  ZaloHealth,
} from "@/lib/collections-queries"
import { fmtInt, vnDayKey } from "@/lib/format"
import { sloSummaryKey, sloSummaryText } from "@/lib/freshness"
import { LOCKDOWN_LAYERS, type getLockdownStatus, type SourceFeedHealth } from "@/lib/ops-queries"
import type { CloudOpsView } from "@/lib/ops-cloud"
import type { SourceRoles } from "@/lib/source-labels"

export type CollectionsData = {
  days: FlowDay[]
  funnel: GateFunnel
  jobs: JobStatus[]
  rotation: RotationPreview
  zaloGroups: ZaloGroupRow[]
  /** null = cấu hình OpenClaw không đọc được (ON4) — bảng ghi «—», không «0 nhóm». */
  zaloAllowlist: ZaloAllowlistEntry[] | null
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
  /** Cloud (ON5): «Luồng 7 ngày» dựng từ khối `luong7` (`getCloudFlowDays`); rỗng khi chưa có bản tin. */
  cloudDays?: CloudFlowDay[]
}

/**
 * Phần hiển thị của /ops/collections "Thu Thập" — trang chỉ tải dữ liệu rồi truyền vào đây (AU6: phép đo render
 * trọn view để thấy cùng «x/y nguồn đạt SLO» với /ops). Trả lời 3 câu: hôm nay chảy vào gì / qua cổng nào / máy có
 * chạy không. Khung theo @reui/solution-dev-ops-6 (thẻ số · luồng + cần chú ý · lưới nguồn) và lưới job của
 * @reui/solution-dev-ops-1.
 */
export function CollectionsView(props: CollectionsData) {
  if (props.cloud) return <CloudCollections {...props} cloud={props.cloud} />
  const { days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, nowMs, roles = {} } = props
  const factsAgeMin = factsPushedAt ? Math.round((nowMs - new Date(factsPushedAt).getTime()) / 60_000) : null
  const lastPostHours = zaloHealth.lastPostAt ? Math.round((nowMs - new Date(zaloHealth.lastPostAt).getTime()) / 3_600_000) : null
  const issues = issuesOf({ feeds: feedHealth, layers: lockdown.layers, agentTurnsToday: lockdown.agentTurnsToday, zalo: zaloHealth, groups: zaloGroups, factsAgeMin, nowMs, roles })
  // Cùng một con số với /ops (AU6): x/y nguồn đạt SLO.
  const slo = feedSloSummary(feedHealth)

  return (
    <div className="flex flex-col gap-6" data-slo-summary={sloSummaryKey(slo)}>
      <PageHeader
        crumbs={CRUMBS}
        title="Thu thập"
        stats={[sloSummaryText(slo), `Hôm nay ${days[0]?.day ?? "—"}`, ...(factsAgeMin !== null ? [`Máy thu ${fmtInt(factsAgeMin)}′ trước`] : [])]}
        description={DESCRIPTION}
      />
      <CollectionsTiles feeds={feedHealth} funnel={funnel} layers={lockdown.layers} agentTurnsToday={lockdown.agentTurnsToday} roles={roles} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SyncActivity days={days} roles={roles} className="min-w-0 lg:col-span-2" />
        <AttentionList issues={issues} roles={roles} className="min-w-0" />
      </div>
      <FeedsGrid feeds={feedHealth} />
      <LockdownGrid layers={lockdown.layers} lastWatchdogAt={lockdown.lastWatchdogAt} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ZaloPipePanel zalo={zaloHealth} funnel={funnel} lastPostHours={lastPostHours} roles={roles} />
        <RotationPanel rotation={rotation} roles={roles} />
      </div>
      <FlowTable days={days} roles={roles} />
      <div id="nhom-s03" className="scroll-mt-4">
        <ZaloGroupsTable rows={zaloGroups} allowlist={zaloAllowlist} roles={roles} />
      </div>
      <JobsGrid jobs={jobs} />
    </div>
  )
}

const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Thu thập" }]
const DESCRIPTION = "Dữ liệu chảy vào theo nguồn và theo ngày — không phải mở nhật ký tay."
/** Vùng đo trực tiếp trên máy thu — trên cloud không có nguồn số (ADR-0014); ON4/ON23 đưa dần lên bằng khối bản tin. */
export const MACHINE_ONLY_REGIONS = ["Cần chú ý", "ống S03", "xoay vòng", "nhóm S03"]
/** Vùng chỉ dựng trên máy chủ khi đã có bản tin (ON5 «Luồng 7 ngày», lưới «tác vụ») — chưa có thì vào Alert. */
const NEEDS_FACTS_REGIONS = ["Luồng 7 ngày", "tác vụ"]

/** Cloud (ON3, ADR-0014): chỉ dựng vùng đọc bản tin máy thu — ô số, lưới sức khoẻ nguồn, lưới khoá an toàn (khối
 * `lockdown`, ON23; chưa có khối thì 8 lớp «Chỉ kiểm ở máy thu»), bảng luồng 7 ngày (khối `luong7`, ON5), bảng nhóm S03
 * (khối `s03`, ON4) và lưới job (luồng và job chỉ khi đã có bản tin, nhóm S03 chỉ khi có khối). Mọi vùng đo trực tiếp trên máy thu gộp về một Alert, để không vùng nào hiện «ổn», số 0
 * hay màu đạt khi máy chủ không đo được nó. */
function CloudCollections({ funnel, jobs, feedHealth, nowMs, roles = {}, cloud, cloudDays = [] }: CollectionsData & { cloud: CloudOpsView }) {
  const slo = feedSloSummary(feedHealth)
  const stale = cloud.state === "stale"
  const lockdown = cloud.lockdown
  // Khối `s03` (ON4): có thì bảng nhóm dựng từ số máy thu đẩy lên; không có thì «nhóm S03» ở lại Alert gom.
  const s03 = cloud.s03
  return (
    <div className="flex flex-col gap-6" data-slo-summary={sloSummaryKey(slo)}>
      <PageHeader
        crumbs={CRUMBS}
        title="Thu thập"
        stats={[...(cloud.feeds ? [sloSummaryText(slo)] : []), `Hôm nay ${vnDayKey(nowMs)}`]}
        description={DESCRIPTION}
      />
      <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} />
      <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} />
      {cloud.state === "none" ? (
        <LocalOnlyAlert title="Chỉ đo ở máy thu">
          Máy thu chưa đẩy số tổng hợp lên máy chủ. Kiểm tác vụ đồng bộ ở máy thu, hoặc xem cổng Ops trên máy thu.
        </LocalOnlyAlert>
      ) : null}
      <CollectionsTiles
        feeds={feedHealth}
        funnel={funnel}
        layers={lockdown?.layers ?? []}
        agentTurnsToday={lockdown?.agentTurnsToday ?? null}
        roles={roles}
        cloud={{
          feedsMeasured: cloud.feeds !== null,
          records24h: cloud.records24h ? cloud.records24h.reduce((a, r) => a + r.n, 0) : null,
          stale,
          funnelMeasured: cloud.state !== "none",
          lockdown: lockdown ? { stale: lockdown.stale } : null,
          flowShown: cloud.state !== "none",
          s03Shown: s03 !== null,
        }}
      />
      <FeedsGrid feeds={feedHealth} stale={stale} />
      {cloud.state === "none" ? null : (
        <div id="luong" className="scroll-mt-4">
          <CloudFlowTable days={cloudDays} stale={stale} roles={roles} />
        </div>
      )}
      <LockdownGrid
        layers={lockdown?.layers ?? LOCKDOWN_LAYERS.map((l) => ({ ...l, ok: null }))}
        lastWatchdogAt={lockdown?.lastWatchdogAt ?? null}
        stale={lockdown?.stale ?? false}
        machineOnly={!lockdown}
      />
      {s03 ? (
        <div id="nhom-s03" className="scroll-mt-4">
          <ZaloGroupsTable rows={s03.groups} allowlist={[]} roles={roles} cloud={{ allowlistEnabled: s03.allowlistEnabled, stale: s03.stale }} />
        </div>
      ) : null}
      <div id="tren-may-thu" className="scroll-mt-4">
        <LocalOnlyAlert title="Phần còn lại của trang chưa có số trên máy chủ">
          {[
            ...MACHINE_ONLY_REGIONS.filter((r) => !(s03 && r === "nhóm S03")),
            ...(cloud.state === "none" ? NEEDS_FACTS_REGIONS : []),
          ].join(", ")}{" "}
          đo trực tiếp trên máy thu — xem ở cổng Ops trên máy thu.
        </LocalOnlyAlert>
      </div>
      {cloud.state === "none" ? null : <JobsGrid jobs={jobs} stale={stale} />}
    </div>
  )
}
