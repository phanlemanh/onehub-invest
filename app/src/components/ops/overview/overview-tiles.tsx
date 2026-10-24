"use client"

// chuyển thể từ @reui/solution-dev-ops-5 (slo-health-strip.tsx): hàng 4 ô KPI ba dải
// (đầu · số + chú giải · chân nêu đối tượng). Khác bản gốc: bỏ biểu đồ kẹo mút
// mini trong ô vì chưa có chuỗi độ tươi theo ngày (chỉ có ảnh chụp hiện tại).
import type { ReactNode } from "react"
import { CalendarClockIcon, CircleOffIcon, ClockAlertIcon, TargetIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { fmtInt, fmtVnDate } from "@/lib/format"
import { bySource, fmtAge, fmtOverdue, sloSummaryKey, sloSummaryText, summarizeSources } from "@/lib/freshness"
import type { CoverageRow } from "@/lib/ops-queries"
import { cn } from "@/lib/utils"

import { SectionFoot, SectionFrame, SectionHead } from "./section-lead"
import { ageRatio, FRESHNESS, FRESHNESS_ORDER, where } from "./status"

function KpiTile({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children: ReactNode }) {
  return (
    <SectionFrame>
      <SectionHead compact icon={icon} title={title} description={detail} />
      {children}
    </SectionFrame>
  )
}

function KpiValue({ value, unit, badge, sloSummary, muted = false }: { value: ReactNode; unit?: string; badge?: ReactNode; sloSummary?: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2" data-slo-summary={sloSummary}>
      <span className={cn("shrink-0 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums", muted && "text-muted-foreground")}>
        {value}
        {unit ? <span className="text-muted-foreground ms-1 text-sm font-normal">{unit}</span> : null}
      </span>
      {badge}
    </div>
  )
}

function ToneDot({ tone }: { tone: string }) {
  return <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", tone)} />
}

function Panel({ head, legend, subject }: { head: ReactNode; legend?: ReactNode; subject: ReactNode }) {
  return (
    <>
      <FramePanel className="flex flex-col gap-3">
        {head}
        {legend}
      </FramePanel>
      <SectionFoot className="flex-nowrap justify-start gap-2">{subject}</SectionFoot>
    </>
  )
}

/** `unmeasured`: trên máy chủ chưa có số độ tươi (chưa có bản tin hay khối lỗi) — mọi ô «—», không badge (ON3).
 * `stale`: số là lần đo cuối của bản tin cũ quá 45′ — số mờ, không badge xanh. */
export function OverviewTiles({ rows, unmeasured = false, stale = false, areaNames = {} }: { rows: CoverageRow[]; unmeasured?: boolean; stale?: boolean; areaNames?: Record<string, string> }) {
  if (unmeasured) return <UnmeasuredTiles />
  const names = new Map(Object.entries(areaNames))
  // Ô «Đạt SLO» đếm NGUỒN (Hỏi-1 AU6): nguồn đạt khi mọi thị trường có dữ liệu của nó đạt — cùng luật với
  // ô «Sức khoẻ nguồn» của /ops/collections (lib/freshness). Các ô còn lại vẫn kể từng cặp nguồn × thị trường.
  const sources = bySource(rows)
  const summary = summarizeSources(sources)
  const counts = FRESHNESS_ORDER.map((s) => ({ s, n: sources.filter((r) => r.status === s).length }))
  const late = rows.filter((r) => r.status === "stale").sort((a, b) => (ageRatio(b) ?? 0) - (ageRatio(a) ?? 0))
  const none = rows.filter((r) => r.status === "none")
  // SLO lấy từ chính dữ liệu (SLO_HOURS ở lib/freshness), không chép tay.
  const slos = [...new Map(rows.map((r) => [r.code, r.sloHours])).entries()].sort(([a], [b]) => a.localeCompare(b))
  const newest = rows
    .filter((r) => r.lastSnapshotAt)
    .sort((a, b) => (b.lastSnapshotAt ?? "").localeCompare(a.lastSnapshotAt ?? ""))[0]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile icon={<TargetIcon aria-hidden="true" />} title="Đạt SLO" detail="Nguồn đạt khi mọi thị trường của nó đạt">
        <Panel
          head={<KpiValue value={fmtInt(summary.ok)} unit={`/ ${fmtInt(summary.total)} nguồn`} sloSummary={sloSummaryKey(summary)} muted={stale} />}
          legend={
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
              {counts
                .filter((c) => c.n > 0)
                .map((c) => (
                  <span key={c.s} className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                    {/* Số cũ: chấm «Đạt» không tô xanh — đó là lần đo cuối (ON3). */}
                    <ToneDot tone={stale && c.s === "fresh" ? FRESHNESS.none.tick : FRESHNESS[c.s].tick} />
                    <span className="text-foreground">{fmtInt(c.n)}</span>
                    {FRESHNESS[c.s].label}
                  </span>
                ))}
            </div>
          }
          subject={<span className="truncate">{slos.length ? `SLO: ${slos.map(([c, h]) => `${c} ≤ ${fmtAge(h)}`).join(", ")}` : sloSummaryText(summary)}</span>}
        />
      </KpiTile>

      <KpiTile icon={<ClockAlertIcon aria-hidden="true" />} title="Quá hạn" detail="Cặp nguồn × thị trường cũ hơn SLO">
        <Panel
          head={<KpiValue value={fmtInt(late.length)} muted={stale} badge={late.length ? <Badge variant="destructive-light">Cần thu lại</Badge> : stale ? undefined : <Badge variant="success-light">Không có</Badge>} />}
          subject={
            late[0] ? (
              <>
                <ToneDot tone={FRESHNESS.stale.tick} />
                <span className="truncate">Lâu nhất: {where(late[0], names)}</span>
                <span className="text-foreground ms-auto shrink-0 font-medium tabular-nums">
                  {fmtAge(late[0].ageHours)} · {fmtOverdue(late[0].ageHours, late[0].sloHours) ?? `SLO ${fmtAge(late[0].sloHours)}`}
                </span>
              </>
            ) : (
              <span>{stale ? "Lần đo cuối: không cặp nào quá hạn" : "Mọi nguồn có snapshot đều trong hạn"}</span>
            )
          }
        />
      </KpiTile>

      <KpiTile icon={<CircleOffIcon aria-hidden="true" />} title="Chưa có snapshot" detail="Nguồn chưa thu lần nào ở thị trường">
        <Panel
          head={<KpiValue value={fmtInt(none.length)} muted={stale} />}
          subject={<span className="truncate">{none.length ? none.map((r) => where(r, names)).join(", ") : stale ? "Lần đo cuối: mọi nguồn đã có snapshot" : "Mọi nguồn đã có snapshot"}</span>}
        />
      </KpiTile>

      <KpiTile icon={<CalendarClockIcon aria-hidden="true" />} title="Snapshot mới nhất" detail="Lần thu gần nhất của mọi nguồn">
        <Panel
          head={<KpiValue value={fmtVnDate(newest?.lastSnapshotAt ?? null)} muted={stale} />}
          subject={<span className="truncate">{newest ? where(newest, names) : "Chưa có snapshot nào"}</span>}
        />
      </KpiTile>
    </div>
  )
}

const KPI = [
  { icon: <TargetIcon aria-hidden="true" />, title: "Đạt SLO", detail: "Nguồn đạt khi mọi thị trường của nó đạt" },
  { icon: <ClockAlertIcon aria-hidden="true" />, title: "Quá hạn", detail: "Cặp nguồn × thị trường cũ hơn SLO" },
  { icon: <CircleOffIcon aria-hidden="true" />, title: "Chưa có snapshot", detail: "Nguồn chưa thu lần nào ở thị trường" },
  { icon: <CalendarClockIcon aria-hidden="true" />, title: "Snapshot mới nhất", detail: "Lần thu gần nhất của mọi nguồn" },
]

/** Bốn ô khi trên cloud chưa có số độ tươi: «—» và «Chưa có số» — không 0, không badge (ON3). */
function UnmeasuredTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-kpi-unmeasured="">
      {KPI.map((k) => (
        <KpiTile key={k.title} icon={k.icon} title={k.title} detail={k.detail}>
          <Panel head={<KpiValue value="—" muted />} subject={<span className="truncate">Chưa có số</span>} />
        </KpiTile>
      ))}
    </div>
  )
}
