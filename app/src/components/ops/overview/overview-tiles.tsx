"use client"

// chuyển thể từ @reui/solution-dev-ops-5 (slo-health-strip.tsx): hàng 4 ô KPI ba dải
// (đầu · số + chú giải · chân nêu đối tượng). Khác bản gốc: bỏ biểu đồ kẹo mút
// mini trong ô vì chưa có chuỗi độ tươi theo ngày (chỉ có ảnh chụp hiện tại).
import type { ReactNode } from "react"
import { CalendarClockIcon, CircleOffIcon, ClockAlertIcon, TargetIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { fmtInt } from "@/lib/format"
import type { CoverageRow } from "@/lib/ops-queries"
import { cn } from "@/lib/utils"

import { SectionFoot, SectionFrame, SectionHead } from "./section-lead"
import { ageRatio, FRESHNESS, FRESHNESS_ORDER } from "./status"

function KpiTile({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: string; children: ReactNode }) {
  return (
    <SectionFrame>
      <SectionHead compact icon={icon} title={title} description={detail} />
      {children}
    </SectionFrame>
  )
}

function KpiValue({ value, unit, badge }: { value: ReactNode; unit?: string; badge?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums">
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

const where = (r: CoverageRow) => `${r.code} · ${r.city}`

export function OverviewTiles({ rows }: { rows: CoverageRow[] }) {
  const counts = FRESHNESS_ORDER.map((s) => ({ s, n: rows.filter((r) => r.status === s).length }))
  const fresh = rows.filter((r) => r.status === "fresh").length
  const stale = rows.filter((r) => r.status === "stale").sort((a, b) => (ageRatio(b) ?? 0) - (ageRatio(a) ?? 0))
  const none = rows.filter((r) => r.status === "none")
  // SLO lấy từ chính dữ liệu (SLO_DAYS ở lib/ops-queries), không chép tay.
  const slos = [...new Map(rows.map((r) => [r.code, r.sloDays])).entries()].sort(([a], [b]) => a.localeCompare(b))
  const newest = rows
    .filter((r) => r.lastSnapshotAt)
    .sort((a, b) => (b.lastSnapshotAt ?? "").localeCompare(a.lastSnapshotAt ?? ""))[0]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiTile icon={<TargetIcon aria-hidden="true" />} title="Đạt SLO" detail="Nguồn × thị trường còn trong hạn">
        <Panel
          head={<KpiValue value={fmtInt(fresh)} unit={`/ ${fmtInt(rows.length)}`} />}
          legend={
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
              {counts
                .filter((c) => c.n > 0)
                .map((c) => (
                  <span key={c.s} className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                    <ToneDot tone={FRESHNESS[c.s].tick} />
                    <span className="text-foreground">{fmtInt(c.n)}</span>
                    {FRESHNESS[c.s].label}
                  </span>
                ))}
            </div>
          }
          subject={<span className="truncate">{slos.length ? `SLO: ${slos.map(([c, d]) => `${c} ≤ ${d} ngày`).join(", ")}` : "Chưa có nguồn nào"}</span>}
        />
      </KpiTile>

      <KpiTile icon={<ClockAlertIcon aria-hidden="true" />} title="Quá hạn" detail="Snapshot cũ hơn SLO">
        <Panel
          head={<KpiValue value={fmtInt(stale.length)} badge={stale.length ? <Badge variant="destructive-light">Cần thu lại</Badge> : <Badge variant="success-light">Không có</Badge>} />}
          subject={
            stale[0] ? (
              <>
                <ToneDot tone={FRESHNESS.stale.tick} />
                <span className="truncate">Lâu nhất: {where(stale[0])}</span>
                <span className="text-foreground ms-auto shrink-0 font-medium tabular-nums">
                  {fmtInt(stale[0].ageDays)} / {fmtInt(stale[0].sloDays)} ngày
                </span>
              </>
            ) : (
              <span>Mọi nguồn có snapshot đều trong hạn</span>
            )
          }
        />
      </KpiTile>

      <KpiTile icon={<CircleOffIcon aria-hidden="true" />} title="Chưa có snapshot" detail="Nguồn chưa thu lần nào ở thị trường">
        <Panel
          head={<KpiValue value={fmtInt(none.length)} />}
          subject={<span className="truncate">{none.length ? none.map(where).join(", ") : "Mọi nguồn đã có snapshot"}</span>}
        />
      </KpiTile>

      <KpiTile icon={<CalendarClockIcon aria-hidden="true" />} title="Snapshot mới nhất" detail="Lần thu gần nhất của mọi nguồn">
        <Panel
          head={<KpiValue value={newest?.lastSnapshotAt?.slice(0, 10) ?? "—"} />}
          subject={<span className="truncate">{newest ? where(newest) : "Chưa có snapshot nào"}</span>}
        />
      </KpiTile>
    </div>
  )
}
