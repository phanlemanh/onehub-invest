import { useId, type ReactNode } from "react"
import {
  Frame,
  FrameFooter,
  FramePanel,
} from "@/components/reui/frame"
import { cn } from "cn"
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  DAY_MS,
  FAILED_BY_DAY,
  formatCompact,
  formatDay,
  formatDelta,
  HEALTHY_YESTERDAY,
  LINKED_LAST_WEEK,
  linkedOf,
  REFERENCE_MS,
  ROWS_BY_DAY,
  rowsOf,
  type Connection,
  type SheetTab,
} from "./data"
import { UI_ICONS } from "./icons"

type OpenConnection = (id: string, tab: SheetTab, origin: HTMLElement) => void

type Segment = { key: string; label: string; count: number; tone: string }

// State tokens, never --chart-N: those flip hue between themes.
const TREND_CONFIG = {
  rows: { label: "Rows", color: "var(--success)" },
} satisfies ChartConfig

/** Change against a baseline: a toned arrow, then the share. Tone follows
 *  meaning, not direction: more failures is up and still bad. */
function DeltaChip({
  current,
  previous,
  better,
  basis,
}: {
  current: number
  previous: number
  better: "up" | "down"
  basis: string
}) {
  const share = formatDelta(current, previous)
  if (share === null || current === previous) return null
  const up = current > previous
  const good = up === (better === "up")
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 font-mono text-sm font-medium tabular-nums",
        good ? "text-success" : "text-destructive"
      )}
    >
      {/* The arrow inherits the value's tone, so the pair reads as one signal. */}
      <span
        aria-hidden="true"
        className="flex [&_svg:not([class*=size-])]:size-3.5"
      >
        {up ? UI_ICONS.up : UI_ICONS.down}
      </span>
      {share}
      <span className="sr-only">
        {up ? "up" : "down"} {basis}
      </span>
    </span>
  )
}

/** The shared card: header, value with its change, a basis line, the
 *  card's own picture, and a footer action pinned under the panel. */
function StatCard({
  icon,
  title,
  period,
  value,
  total,
  delta,
  basis,
  children,
  action,
}: {
  icon: ReactNode
  title: string
  /** The window the card's picture covers. */
  period: string
  value: string
  total?: number
  delta: ReactNode
  basis: string
  children?: ReactNode
  action: { label: string; onClick: (origin: HTMLElement) => void }
}) {
  return (
    <Frame spacing="default" className="h-full min-w-0">
      <FramePanel className="flex flex-col gap-3">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 [&_svg:not([class*=size-])]:size-4">
          {icon}
          <span className="text-foreground truncate text-sm font-medium">
            {title}
          </span>
          <span className="ms-auto shrink-0 text-xs">{period}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-2xl leading-8 font-semibold tracking-tight tabular-nums">
              {value}
              {total === undefined ? null : (
                <span className="text-muted-foreground text-base font-normal">
                  /{total}
                </span>
              )}
            </span>
            {delta}
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {basis}
          </span>
        </div>
        {children}
      </FramePanel>
      <FrameFooter>
        <button
          type="button"
          onClick={(event) => action.onClick(event.currentTarget)}
          className="group/action text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-full text-sm outline-none focus-visible:ring-3"
        >
          <span className="truncate">{action.label}</span>
          <span className="flex shrink-0 transition-transform duration-150 group-hover/action:translate-x-0.5 motion-reduce:transition-none [&_svg:not([class*=size-])]:size-4">
            {UI_ICONS.go}
          </span>
        </button>
      </FrameFooter>
    </Frame>
  )
}

/** One rounded run per group, sized by its count, then a counted legend. */
function SegmentBar({
  segments,
  label,
}: {
  segments: Segment[]
  label: string
}) {
  const shown = segments.filter((segment) => segment.count > 0)
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <div
        role="img"
        aria-label={`${label}: ${shown.map((segment) => `${segment.count} ${segment.label.toLowerCase()}`).join(", ")}`}
        className="flex h-2 w-full gap-1"
      >
        {shown.map((segment) => (
          <span
            key={segment.key}
            className={cn("h-full min-w-1 rounded-full", segment.tone)}
            style={{ flexGrow: segment.count }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex min-w-0 items-center gap-1.5 text-xs"
          >
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", segment.tone)}
            />
            <dt className="text-muted-foreground min-w-0 truncate">
              {segment.label}
            </dt>
            <dd className="ms-auto font-medium tabular-nums">
              {segment.count}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

type TrendPoint = { day: string; rows: number }

/** Daily rows across the card's full width, today marked by a ringed dot
 *  on a dashed guide. */
function TrendArea({ points, good }: { points: TrendPoint[]; good: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const fillId = `stat-fill-${uid}`
  const tone = good ? "var(--success)" : "var(--destructive)"
  const last = points[points.length - 1]
  const values = points.map((point) => point.rows)
  // A low floor keeps the day-to-day swing gentle, as a trend should read.
  const floor = Math.min(...values) * 0.45
  return (
    <div
      role="img"
      aria-label={`Rows synced per day, last ${points.length} days, today ${formatCompact(last.rows)}`}
      className="mt-auto h-14 w-full"
    >
      <ChartContainer
        config={TREND_CONFIG}
        className="aspect-auto h-14 w-full"
        initialDimension={{ width: 240, height: 56 }}
      >
        <AreaChart
          data={points}
          accessibilityLayer={false}
          margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone} stopOpacity={0.24} />
              <stop offset="100%" stopColor={tone} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <YAxis hide domain={[floor, "dataMax"]} />
          <ReferenceLine
            x={last.day}
            stroke={tone}
            strokeOpacity={0.5}
            strokeDasharray="2 3"
          />
          <Area
            dataKey="rows"
            type="monotone"
            baseValue={floor}
            stroke={tone}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            fillOpacity={1}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={last.day}
            y={last.rows}
            r={4}
            fill={tone}
            stroke="var(--card)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

/** Failures per day on tracks across the card's full width; today stands out. */
function DayBars({ values }: { values: number[] }) {
  const peak = Math.max(1, ...values)
  return (
    <div
      role="img"
      aria-label={`Failed runs per day, last ${values.length} days: ${values.join(", ")}`}
      className="mt-auto flex h-14 w-full items-end gap-1"
    >
      {values.map((value, index) => (
        // The track and the fill are siblings: neither wraps content.
        <span key={index} className="relative h-full flex-1">
          <span className="bg-muted absolute inset-0 rounded-full" />
          {value > 0 ? (
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-full",
                index === values.length - 1
                  ? "bg-destructive"
                  : "bg-destructive/40"
              )}
              style={{ height: `${Math.max((value / peak) * 100, 14)}%` }}
            />
          ) : null}
        </span>
      ))}
    </div>
  )
}

export function StatCards({
  connections,
  onOpenConnection,
  onShowAll,
}: {
  connections: Connection[]
  onOpenConnection: OpenConnection
  /** Brings the connections grid into view. */
  onShowAll: () => void
}) {
  // Grouped by health, not live status: a failing source mid-sync still fails.
  const live = connections.filter((connection) => !connection.paused)
  const failing = live.filter((connection) => connection.health === "failing")
  const degraded = live.filter((connection) => connection.health === "degraded")
  const paused = connections.filter((connection) => connection.paused)
  const healthy = live.length - failing.length - degraded.length
  const worst = failing[0] ?? degraded[0] ?? paused[0] ?? null

  const datasets = connections.flatMap((connection) =>
    connection.datasets.map((dataset) => ({ connection, dataset }))
  )
  const linked = connections.reduce(
    (sum, connection) => sum + linkedOf(connection).length,
    0
  )
  const drifted = datasets.filter(
    ({ dataset }) => dataset.linked && dataset.drift.length > 0
  )
  const mostUnlinked =
    [...connections].sort(
      (a, b) =>
        b.datasets.length -
        linkedOf(b).length -
        (a.datasets.length - linkedOf(a).length)
    )[0] ?? null

  const rowsToday = connections.reduce(
    (sum, connection) => sum + rowsOf(connection),
    0
  )
  const rowSeries = [...ROWS_BY_DAY, rowsToday]
  const rowPoints = rowSeries.map((rows, index) => ({
    day: formatDay(REFERENCE_MS - (rowSeries.length - 1 - index) * DAY_MS),
    rows,
  }))
  const rowsYesterday = ROWS_BY_DAY[ROWS_BY_DAY.length - 1]
  const busiest =
    [...connections].sort((a, b) => rowsOf(b) - rowsOf(a))[0] ?? null

  const failedBy = connections
    .map((connection) => ({
      connection,
      failed: connection.hours.reduce((sum, hour) => sum + hour.failed, 0),
    }))
    .filter((entry) => entry.failed > 0)
    .sort((a, b) => b.failed - a.failed)
  const failedToday = failedBy.reduce((sum, entry) => sum + entry.failed, 0)
  const failedYesterday = FAILED_BY_DAY[FAILED_BY_DAY.length - 1]

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:gap-3">
      <StatCard
        icon={UI_ICONS.plug}
        title="Connection Health"
        period="Now"
        value={String(healthy)}
        total={connections.length}
        delta={
          <DeltaChip
            current={healthy}
            previous={HEALTHY_YESTERDAY}
            better="up"
            basis="against yesterday"
          />
        }
        basis={`${HEALTHY_YESTERDAY} healthy yesterday`}
        action={
          worst
            ? {
                label: `View ${worst.name}`,
                onClick: (origin) =>
                  onOpenConnection(worst.id, "overview", origin),
              }
            : { label: "View all connections", onClick: onShowAll }
        }
      >
        <SegmentBar
          label="Connections by health"
          segments={[
            {
              key: "healthy",
              label: "Healthy",
              count: healthy,
              tone: "bg-success",
            },
            {
              key: "degraded",
              label: "Degraded",
              count: degraded.length,
              tone: "bg-warning",
            },
            {
              key: "failing",
              label: "Failing",
              count: failing.length,
              tone: "bg-destructive",
            },
            {
              key: "paused",
              label: "Paused",
              count: paused.length,
              tone: "bg-muted-foreground/40",
            },
          ]}
        />
      </StatCard>

      <StatCard
        icon={UI_ICONS.link}
        title="Linked Datasets"
        period="Now"
        value={String(linked)}
        total={datasets.length}
        delta={
          <DeltaChip
            current={linked}
            previous={LINKED_LAST_WEEK}
            better="up"
            basis="against last week"
          />
        }
        basis={`${LINKED_LAST_WEEK} linked last week`}
        action={
          drifted[0]
            ? {
                label: "Review schema drift",
                onClick: (origin) =>
                  onOpenConnection(
                    drifted[0].connection.id,
                    "datasets",
                    origin
                  ),
              }
            : mostUnlinked
              ? {
                  label: "Link more datasets",
                  onClick: (origin) =>
                    onOpenConnection(mostUnlinked.id, "datasets", origin),
                }
              : { label: "View all connections", onClick: onShowAll }
        }
      >
        <SegmentBar
          label="Datasets by sync state"
          segments={[
            {
              key: "current",
              label: "In sync",
              count: linked - drifted.length,
              tone: "bg-info",
            },
            {
              key: "drift",
              label: "Drifted",
              count: drifted.length,
              tone: "bg-warning",
            },
            {
              key: "idle",
              label: "Unlinked",
              count: datasets.length - linked,
              tone: "bg-muted-foreground/30",
            },
          ]}
        />
      </StatCard>

      <StatCard
        icon={UI_ICONS.rowsIn}
        title="Rows Synced"
        period={`${rowPoints.length} days`}
        value={formatCompact(rowsToday)}
        delta={
          <DeltaChip
            current={rowsToday}
            previous={rowsYesterday}
            better="up"
            basis="against yesterday"
          />
        }
        basis={`${formatCompact(rowsYesterday)} yesterday`}
        action={
          busiest
            ? {
                label: `View ${busiest.name}`,
                onClick: (origin) =>
                  onOpenConnection(busiest.id, "overview", origin),
              }
            : { label: "View all connections", onClick: onShowAll }
        }
      >
        <TrendArea points={rowPoints} good={rowsToday >= rowsYesterday} />
      </StatCard>

      <StatCard
        icon={UI_ICONS.alert}
        title="Failed Syncs"
        period={`${FAILED_BY_DAY.length + 1} days`}
        value={String(failedToday)}
        delta={
          <DeltaChip
            current={failedToday}
            previous={failedYesterday}
            better="down"
            basis="against yesterday"
          />
        }
        basis={`${failedYesterday} yesterday, ${FAILED_BY_DAY.reduce((sum, value) => sum + value, failedToday)} in ${FAILED_BY_DAY.length + 1} days`}
        action={
          failedBy[0]
            ? {
                label: `View ${failedBy[0].connection.name}`,
                onClick: (origin) =>
                  onOpenConnection(
                    failedBy[0].connection.id,
                    "overview",
                    origin
                  ),
              }
            : { label: "View all connections", onClick: onShowAll }
        }
      >
        <DayBars values={[...FAILED_BY_DAY, failedToday]} />
      </StatCard>
    </div>
  )
}