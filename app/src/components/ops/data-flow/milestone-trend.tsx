"use client"

import { useRouter } from "next/navigation"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { themeOf } from "@/components/charts/palette"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { Milestone } from "@/lib/data-flow-queries"
import { fmtInt, fmtPct } from "@/lib/format"

import { deltaLabel, milestoneTiles, rangeLabel, type MilestoneTile } from "./milestone-trend-data"

const TITLE = "Số mốc S03 theo ngày"
const DESCRIPTION = "Tin S03 đang rao đạt từng mốc, chốt ở lượt làm tươi cuối mỗi ngày (giờ VN). Ngày chưa có số để trống."

/** "2026-11-18" → "18/11". */
const dayLabel = (d: string) => `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}`

function TileChart({ tile }: { tile: MilestoneTile }) {
  const config = { value: { label: tile.label, theme: themeOf("flowOffers") } } satisfies ChartConfig
  const data = tile.series.map((p) => ({ day: dayLabel(p.day), value: p.value }))
  return (
    <ChartContainer config={config} className="aspect-auto h-24 w-full">
      <LineChart accessibilityLayer data={data} margin={{ top: 6, bottom: 6, left: 16, right: 16 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="day"
          ticks={[data[0].day, data[data.length - 1].day]}
          interval={0}
          height={20}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        {/* Mỗi ô một trục riêng: các mốc chênh nhau hàng nghìn lần. */}
        <YAxis hide domain={["auto", "auto"]} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => (
                <span className="tabular-nums">
                  {tile.label}: {fmtInt(Number(value))}
                </span>
              )}
            />
          }
        />
        <Line dataKey="value" type="linear" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}

function Tile({ tile }: { tile: MilestoneTile }) {
  return (
    <FramePanel className="flex min-w-0 flex-col gap-3">
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">{tile.label}</span>
        {tile.stalled ? <Badge variant="warning-light">Đứng yên 2 ngày</Badge> : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-2xl leading-none font-semibold tabular-nums">{fmtInt(tile.value)}</span>
          {tile.share !== null ? (
            <span className="text-muted-foreground text-xs tabular-nums">{fmtPct(tile.share)} tin đang rao</span>
          ) : null}
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">{deltaLabel(tile.delta)}</span>
      </div>
      <div className="flex flex-col gap-1">
        <TileChart tile={tile} />
        {/* Mỗi ô tự co trục nên phải nói rõ khoảng số, đường dốc không có nghĩa là tăng nhiều. */}
        <span className="text-muted-foreground text-xs tabular-nums">{rangeLabel(tile.series)}</span>
      </div>
    </FramePanel>
  )
}

/** Bảng ẩn: trình đọc màn hình đọc được số từng ngày mà đường không nói ra. `sr-only` đặt ở thẻ bọc: `<table>` không nhận `width: 1px`, đặt
 * thẳng lên bảng thì bảng đẩy khung cuộn của trang rộng ra ở khổ điện thoại. */
function DaysTable({ tiles }: { tiles: MilestoneTile[] }) {
  return (
    <div className="sr-only">
      {/* eslint-disable-next-line onehub-ui/no-raw-table -- bảng chỉ cho trình đọc màn hình, không hiện trên màn nên không cần data-grid */}
      <table>
      <caption>{TITLE}</caption>
      <thead>
        <tr>
          <th scope="col">Ngày</th>
          {tiles.map((t) => (
            <th key={t.key} scope="col">
              {t.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tiles[0].series.map((p, i) => (
          <tr key={p.day}>
            <th scope="row">{dayLabel(p.day)}</th>
            {tiles.map((t) => (
              <td key={t.key}>{t.series[i].value === null ? "Không có số" : fmtInt(t.series[i].value)}</td>
            ))}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  )
}

/** Khung tải đúng bố cục bốn ô (ST-somoc-loading). */
export function MilestoneTrendSkeleton() {
  return (
    <Frame aria-hidden="true">
      <FrameHeader className="flex flex-col gap-0.5">
        <FrameTitle>{TITLE}</FrameTitle>
        <FrameDescription>{DESCRIPTION}</FrameDescription>
      </FrameHeader>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <FramePanel key={i} className="flex min-w-0 flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </FramePanel>
        ))}
      </div>
    </Frame>
  )
}

/** Vùng «Số mốc S03 theo ngày» của /ops/data-flow (SM1). Số tính sẵn ở 600_data_flow.sql; tệp này chỉ đọc. */
export function MilestoneTrend({ milestones, windowDays }: { milestones: Milestone[]; windowDays: number }) {
  const router = useRouter()
  const tiles = milestoneTiles(milestones, windowDays)
  return (
    <Frame data-milestone-trend="">
      <FrameHeader className="flex flex-col gap-0.5">
        <FrameTitle>{TITLE}</FrameTitle>
        <FrameDescription>{DESCRIPTION}</FrameDescription>
      </FrameHeader>
      {tiles.length === 0 ? (
        <FramePanel>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có số mốc theo ngày</EmptyTitle>
              <EmptyDescription>Số đầu tiên xuất hiện sau lượt làm tươi kế.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                Tải lại
              </Button>
            </EmptyContent>
          </Empty>
        </FramePanel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
            {tiles.map((t) => (
              <Tile key={t.key} tile={t} />
            ))}
          </div>
          <DaysTable tiles={tiles} />
        </>
      )}
    </Frame>
  )
}
