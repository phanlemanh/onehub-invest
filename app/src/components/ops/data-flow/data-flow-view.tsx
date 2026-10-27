"use client"

import Link from "next/link"

import { PageHeader } from "@/components/page/page-header"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { DataFlow, FlowWindow } from "@/lib/data-flow-queries"
import type { ReviewImage } from "@/lib/ops/review-media"
import { fmtInt } from "@/lib/format"
import type { SourceRoles } from "@/lib/source-labels"

import { FlowSankey } from "./flow-sankey"
import { KindMixChart } from "./kind-mix-chart"
import { QualityGrid } from "./quality-grid"
import { groupRows, sourceRows } from "./quality-rows"
import { RecordsGrid } from "./records-grid"
import { StageTrendChart } from "./stage-trend-chart"
import { chartDaysOf } from "./stage-trend-data"

const WINDOWS: { value: FlowWindow; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "all", label: "Toàn kho" },
]

const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Dòng chảy dữ liệu" }]
const DESCRIPTION = "Một tin đi từ bài nhận tới căn: chặng nào đang chảy, chặng nào rơi, vì sao."

/** /ops/data-flow «Dòng chảy dữ liệu» (proto 26/10) — Dashboard grid trong khung Frame, chỉ đọc. */
export function DataFlowView({
  flow,
  roles,
  nowMs,
  media,
}: {
  flow: DataFlow
  roles: SourceRoles
  nowMs: number
  /** Ảnh tin theo offer_id — chỉ có khi người xem là admin. */
  media?: Record<string, ReviewImage[]>
}) {
  const windowDays = chartDaysOf(flow.window)
  const received = flow.sources.reduce((a, s) => a + s.received, 0)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={CRUMBS}
        title="Dòng chảy dữ liệu"
        stats={[`${fmtInt(received)} bài`, `${fmtInt(flow.reviewPending)} thẻ chờ duyệt`, `${fmtInt(flow.enrichPending)} đề xuất làm giàu`]}
        description={DESCRIPTION}
        actions={
          <ButtonGroup aria-label="Khoảng thời gian">
            {WINDOWS.map((w) => (
              <Button
                key={w.value}
                size="sm"
                variant={w.value === flow.window ? "secondary" : "outline"}
                aria-current={w.value === flow.window ? "page" : undefined}
                nativeButton={false}
                render={<Link href={w.value === "7d" ? "/ops/data-flow" : `/ops/data-flow?window=${w.value}`} scroll={false} />}
              >
                {w.label}
              </Button>
            ))}
          </ButtonGroup>
        }
      />
      <FlowSankey sources={flow.sources} roles={roles} />
      <QualityGrid bySource={sourceRows(flow, roles, nowMs)} byGroup={groupRows(flow, roles, nowMs)} />
      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 xl:col-span-8">
          <StageTrendChart sources={flow.sources} days={flow.days} nowMs={nowMs} windowDays={windowDays} />
        </div>
        <div className="flex min-w-0 xl:col-span-4">
          <KindMixChart mix={flow.mix} />
        </div>
      </div>
      <RecordsGrid records={flow.records} roles={roles} media={media} />
    </div>
  )
}
