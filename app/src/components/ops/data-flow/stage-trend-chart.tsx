"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { swatchOf, themeOf, type SeriesKey } from "@/components/charts/palette"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { FlowDay, SourceFlow } from "@/lib/data-flow-queries"
import { fmtInt, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

import { dailySeries, type StageKey } from "./stage-trend-data"

/**
 * «Chặng theo ngày» — chuyển thể activation-funnel-chart của @reui/solution-analytics-3: bốn ô số của bốn chặng
 * (thay % so kỳ trước bằng tỉ lệ so với chặng trước), dưới là diện tích theo ngày. Khác bản gốc: các chặng lồng nhau
 * nên KHÔNG chồng (stackId) — mỗi đường là số thật của chặng đó; bỏ chọn khoảng (khoảng ở đầu trang).
 */

const STAGES: { key: StageKey; label: string; color: Exclude<SeriesKey, "rest">; of?: StageKey; ofLabel?: string }[] = [
  { key: "received", label: "Bài nhận", color: "flowReceived" },
  { key: "readable", label: "Đọc được", color: "flowReadable", of: "received", ofLabel: "bài nhận" },
  { key: "offers", label: "Tin rao mới", color: "flowOffers", of: "readable", ofLabel: "bài đọc được" },
  { key: "linked", label: "Gắn căn", color: "flowLinked", of: "offers", ofLabel: "tin rao" },
]

const chartConfig = Object.fromEntries(STAGES.map((s) => [s.key, { label: s.label, theme: themeOf(s.color) }])) satisfies ChartConfig

/** "2026-10-24" → "24/10". */
const dayLabel = (d: string) => `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}`

export function StageTrendChart({
  sources,
  days,
  nowMs,
  windowDays,
}: {
  sources: SourceFlow[]
  days: FlowDay[]
  /** Mốc request — cùng mốc getDataFlow dùng; ngày cuối của trục là ngày VN của mốc này. */
  nowMs: number
  windowDays: number
}) {
  const totals = Object.fromEntries(
    STAGES.map((s) => [s.key, sources.reduce((acc, src) => acc + src[s.key], 0)]),
  ) as Record<StageKey, number>

  // Gộp mọi nguồn theo ngày; mọi ngày của cửa sổ đều có điểm, ngày trống là 0 để trục liền.
  const series = dailySeries(days, nowMs, windowDays)
  const data = series.map((p) => ({ ...p, day: dayLabel(p.key) }))
  const empty = series.every((p) => STAGES.every((s) => p[s.key] === 0))

  return (
    <Frame className="flex h-full w-full flex-col">
      <FrameHeader className="flex flex-col gap-0.5">
        <FrameTitle>Chặng theo ngày</FrameTitle>
        <FrameDescription>Mỗi chặng đếm riêng theo ngày đăng (giờ VN), không cộng dồn</FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-6">
        <div className="grid grid-cols-2 gap-6 p-2 md:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <div className={cn("h-12 w-0.5 rounded-full", swatchOf(s.color))} aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-2">
                <div className="text-muted-foreground text-xs font-medium">{s.label}</div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-base leading-none font-semibold tabular-nums">{fmtInt(totals[s.key])}</span>
                  {s.of ? (
                    <span className="text-muted-foreground text-xs tabular-nums" title={`so với ${s.ofLabel}`}>
                      {totals[s.of] > 0 ? fmtPct(totals[s.key] / totals[s.of]) : "—"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        {empty ? (
          <p className="text-muted-foreground px-2 pb-2 text-sm">Chưa có số theo ngày trong khoảng này.</p>
        ) : (
          <ChartContainer config={chartConfig} className="mt-auto h-62 w-full">
            <AreaChart accessibilityLayer data={data} margin={{ top: 10, bottom: 10, left: 5, right: 5 }}>
              <defs>
                {STAGES.map((s) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} tick={{ fontSize: 12 }} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              {STAGES.map((s) => (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  type="monotone"
                  fill={`url(#fill-${s.key})`}
                  stroke={`var(--color-${s.key})`}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </FramePanel>
    </Frame>
  )
}
