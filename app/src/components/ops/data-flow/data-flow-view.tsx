"use client"

import Link from "next/link"

import { CircleAlertIcon } from "lucide-react"

import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status"
import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { DataFlow, FlowWindow } from "@/lib/data-flow-queries"
import type { ReviewImage } from "@/lib/ops/review-media"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
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

/** Dòng trạng thái số dưới đầu trang (DF1). Máy thu: mốc tính của bảng. Máy chủ: chữ chung của các trang Ops
 * (facts-status.tsx, ADR-0014) theo `computedAt` — số vắng hay lỗi thì nói rõ, không vẽ 0. */
function FlowFactsStatus({ flow }: { flow: DataFlow }) {
  if (flow.mode === "local") {
    if (flow.factsState === "none")
      return (
        <LocalOnlyAlert title="Chưa có số tính sẵn">
          Máy thu chưa làm tươi bảng số dòng chảy. Bước làm tươi chạy cùng tác vụ đồng bộ mỗi 15 phút.
        </LocalOnlyAlert>
      )
    return (
      <p className="text-muted-foreground text-xs tabular-nums" data-flow-stamp="">
        Số tính lúc {fmtVnDateTime(flow.computedAt)}
      </p>
    )
  }
  if (flow.factsState === "none")
    return (
      <LocalOnlyAlert title="Chỉ đo ở máy thu">
        Máy thu chưa đẩy số dòng chảy lên máy chủ. Kiểm tác vụ đồng bộ ở máy thu, hoặc xem cổng Ops trên máy thu.
      </LocalOnlyAlert>
    )
  if (flow.factsState === "error")
    return (
      <Alert variant="destructive" data-flow-error="">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Số dòng chảy không đo được</AlertTitle>
        <AlertDescription>{flow.factsError ?? "không đo được"}</AlertDescription>
      </Alert>
    )
  return (
    <>
      <FactsStamp state={flow.factsState} measuredAt={flow.computedAt} />
      <FactsStaleAlert state={flow.factsState} measuredAt={flow.computedAt} />
    </>
  )
}

/** /ops/data-flow «Dòng chảy dữ liệu» — Dashboard grid trong khung Frame, chỉ đọc. Số tổng hợp từ bảng tính sẵn (máy
 * thu) hay khối bản tin (máy chủ); vắng hay lỗi thì bỏ các vùng số, giữ «Tin mới nhất». */
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
  const hasFacts = flow.factsState === "fresh" || flow.factsState === "stale"
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={CRUMBS}
        title="Dòng chảy dữ liệu"
        stats={
          hasFacts
            ? [`${fmtInt(received)} bài`, `${fmtInt(flow.reviewPending)} thẻ chờ duyệt`, `${fmtInt(flow.enrichPending)} đề xuất làm giàu`]
            : [`${fmtInt(flow.reviewPending)} thẻ chờ duyệt`]
        }
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
      <FlowFactsStatus flow={flow} />
      {hasFacts ? (
        <>
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
        </>
      ) : null}
      <RecordsGrid records={flow.records} roles={roles} media={media} cloud={flow.mode === "cloud"} />
    </div>
  )
}
