import { useState } from "react"
import { Frame, FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import { Bar, BarChart, XAxis, YAxis, type TooltipContentProps } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  CATEGORIES,
  CATEGORY_ORDER,
  categoryOf,
  formatClock,
  formatCompact,
  HOUR_MS,
  HOURS,
  plural,
  REFERENCE_MS,
  type Connection,
  type IntegrationCategory,
} from "./data"
import {
  CARD_ORIGIN,
  DockedCard,
  HOUR_CHART,
  HOUR_SHAPES,
  HOUR_TRACK,
  HourColumns,
  HourHatches,
  HourLegend,
} from "./hour-columns"
import { SectionHeader } from "./section-header"

type Mode = "runs" | "rows"
type Outcome = "succeeded" | "partial" | "failed"
type Series = Outcome | "volume"

const MODES: { value: Mode; label: string }[] = [
  { value: "runs", label: "Runs" },
  { value: "rows", label: "Rows" },
]

/** Stack order, bottom to top. */
const SERIES: Record<Mode, Series[]> = {
  runs: ["succeeded", "partial", "failed"],
  rows: ["volume"],
}

// State tokens, never --chart-N: theme presets grey those out or flip their hue.
const ACTIVITY_CONFIG = {
  succeeded: { label: "Succeeded", color: "var(--success)" },
  partial: { label: "Slow", color: "var(--warning)" },
  failed: { label: "Failed", color: "var(--destructive)" },
  volume: { label: "Rows synced", color: "var(--info)" },
} satisfies ChartConfig

const LEGEND_TONE: Record<Series, string> = {
  succeeded: "bg-success",
  partial: "bg-warning",
  failed: "bg-destructive",
  volume: "bg-info",
}

type HourBucket = Record<Series, number> & {
  label: string
  start: number
  runs: number
  /** Rows by source category, for the Rows card. */
  sources: Record<IntegrationCategory, number>
  /** Connections with failed runs in the hour, worst first. */
  failedBy: { name: string; failed: number }[]
  /** The connection that moved the most rows in the hour. */
  busiest: { name: string; rows: number } | null
}

function bucketsOf(connections: Connection[]): HourBucket[] {
  return Array.from({ length: HOURS }, (_, index) => {
    const bucket: HourBucket = {
      label: "",
      start: 0,
      runs: 0,
      volume: 0,
      succeeded: 0,
      partial: 0,
      failed: 0,
      sources: { database: 0, warehouse: 0, app: 0, files: 0 },
      failedBy: [],
      busiest: null,
    }
    for (const connection of connections) {
      const cell = connection.hours[index]
      if (!cell) continue
      bucket.start = cell.start
      const landed = cell.runs - cell.failed
      if (cell.outcome === "partial") bucket.partial += landed
      else bucket.succeeded += landed
      bucket.failed += cell.failed
      bucket.sources[categoryOf(connection)] += cell.rows
      bucket.volume += cell.rows
      if (cell.failed > 0)
        bucket.failedBy.push({ name: connection.name, failed: cell.failed })
      if (cell.rows > (bucket.busiest?.rows ?? 0))
        bucket.busiest = { name: connection.name, rows: cell.rows }
    }
    bucket.label = formatClock(bucket.start)
    bucket.runs = bucket.succeeded + bucket.partial + bucket.failed
    bucket.failedBy.sort((a, b) => b.failed - a.failed)
    return bucket
  })
}

const rangeOf = (bucket: HourBucket) =>
  `${formatClock(bucket.start)} to ${bucket.start + HOUR_MS > REFERENCE_MS ? "now" : formatClock(bucket.start + HOUR_MS)}`

const isBucket = (value: unknown): value is HourBucket =>
  typeof value === "object" && value !== null && "failedBy" in value

/** The read hour's outcomes, or its rows by source. A stable component, so
 *  the card stays mounted between hours and only pops on entry. */
function ActivityCard({
  buckets,
  mode,
  active,
  payload,
}: {
  buckets: HourBucket[]
  mode: Mode
} & Partial<Pick<TooltipContentProps, "active" | "payload">>) {
  const bucket: unknown = payload?.[0]?.payload
  const items = payload?.filter((item) => Number(item.value) > 0) ?? []
  if (!active || !payload || !isBucket(bucket)) return null
  const series = SERIES[mode]
  return (
    <DockedCard
      index={buckets.findIndex((item) => item.label === bucket.label)}
      count={buckets.length}
    >
      <ChartTooltipContent
        active
        // A quiet hour keeps one row to carry the card, so it never remounts.
        payload={items.length > 0 ? items : payload.slice(0, 1)}
        className="w-56"
        labelFormatter={() => (
          <span className="flex items-center justify-between gap-3">
            {rangeOf(bucket)}
            <span className="text-muted-foreground font-normal tabular-nums">
              {mode === "runs"
                ? plural(bucket.runs, "run")
                : `${formatCompact(bucket.volume)} rows`}
            </span>
          </span>
        )}
        formatter={(value, name, _item, index) => {
          if (items.length === 0)
            return (
              <span className="text-muted-foreground">
                {mode === "runs" ? "No runs" : "No rows synced"}
              </span>
            )
          const key = series.find((entry) => entry === name)
          if (!key) return null
          const last = index === items.length - 1
          return (
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-full", LEGEND_TONE[key])}
                  />
                  {ACTIVITY_CONFIG[key].label}
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {mode === "runs"
                    ? Number(value)
                    : formatCompact(Number(value))}
                </span>
              </div>
              {last && mode === "runs" && bucket.failedBy.length > 0 ? (
                <div className="border-border/50 flex flex-col gap-1 border-t pt-1.5">
                  {bucket.failedBy.map((entry) => (
                    <span
                      key={entry.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate">{entry.name}</span>
                      <span className="text-destructive shrink-0 font-medium tabular-nums">
                        {entry.failed} failed
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}
              {last && mode === "rows" ? (
                <div className="border-border/50 flex flex-col gap-1 border-t pt-1.5">
                  {CATEGORY_ORDER.filter(
                    (category) => bucket.sources[category] > 0
                  ).map((category) => (
                    <span
                      key={category}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-muted-foreground inline-flex items-center gap-1.5 [&_svg:not([class*=size-])]:size-3">
                        {CATEGORIES[category].icon}
                        {CATEGORIES[category].plural}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatCompact(bucket.sources[category])}
                      </span>
                    </span>
                  ))}
                  {bucket.busiest ? (
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        Most from {bucket.busiest.name}
                      </span>
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        }}
      />
    </DockedCard>
  )
}

export function SyncActivity({
  connections,
  className,
}: {
  connections: Connection[]
  className?: string
}) {
  const [mode, setMode] = useState<Mode>("runs")
  const buckets = bucketsOf(connections)
  const series = SERIES[mode]
  const runs = buckets.reduce((sum, bucket) => sum + bucket.runs, 0)
  const failed = buckets.reduce((sum, bucket) => sum + bucket.failed, 0)
  const rows = buckets.reduce((sum, bucket) => sum + bucket.volume, 0)
  const landed = runs === 0 ? 1 : (runs - failed) / runs
  const ticks = buckets
    .filter((_, index) => index % 4 === 3)
    .map((bucket) => bucket.label)

  return (
    <Frame spacing="default" className={cn("min-w-0", className)}>
      <SectionHeader
        title="Sync Activity"
        description={
          mode === "runs"
            ? `${formatCompact(runs)} runs in 24 hours, ${(landed * 100).toFixed(1)}% landed`
            : `${formatCompact(rows)} rows in 24 hours, by source`
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <HourLegend
            items={series.map((key) => ({
              key,
              label: ACTIVITY_CONFIG[key].label,
              tone: LEGEND_TONE[key],
            }))}
          />
          <ToggleGroup
            multiple={false}
            value={[mode]}
            onValueChange={(value: string[]) => {
              const next = MODES.find((item) => item.value === value[0])
              if (next) setMode(next.value)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Activity shown"
          >
            {MODES.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                className="text-muted-foreground data-pressed:text-foreground"
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </SectionHeader>
      <FramePanel>
        {connections.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyTitle>No Runs Yet</EmptyTitle>
              <EmptyDescription>
                Nothing connected in this environment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            config={ACTIVITY_CONFIG}
            className={cn(HOUR_CHART, "aspect-auto h-56 w-full min-w-0")}
            initialDimension={{ width: 720, height: 224 }}
          >
            <HourColumns stack={series}>
              <BarChart
                data={buckets}
                accessibilityLayer
                barCategoryGap="20%"
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <HourHatches />
                <XAxis
                  dataKey="label"
                  ticks={ticks}
                  tickFormatter={(label: string) =>
                    label === buckets[buckets.length - 1].label ? "Now" : label
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  height={26}
                />
                <YAxis
                  allowDecimals={false}
                  tickCount={4}
                  tickFormatter={(value: number) => formatCompact(value)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width="auto"
                />
                <ChartTooltip
                  cursor={false}
                  position={CARD_ORIGIN}
                  isAnimationActive={false}
                  content={<ActivityCard buckets={buckets} mode={mode} />}
                />
                {series.map((key, index) => (
                  <Bar
                    key={`${mode}-${key}`}
                    dataKey={key}
                    stackId={mode}
                    fill={`var(--color-${key})`}
                    maxBarSize={28}
                    isAnimationActive={false}
                    // The first series lays the full-height track behind each column.
                    background={index === 0 ? HOUR_TRACK : undefined}
                    shape={HOUR_SHAPES[key]}
                  />
                ))}
              </BarChart>
            </HourColumns>
          </ChartContainer>
        )}
      </FramePanel>
    </Frame>
  )
}