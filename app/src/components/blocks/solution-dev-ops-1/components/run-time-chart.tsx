import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { Frame, FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import {
  Bar,
  BarChart,
  CartesianGrid,
  DefaultZIndexes,
  Rectangle,
  ReferenceLine,
  useActiveTooltipLabel,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
  ZIndexLayer,
  type BarShapeProps,
  type TooltipContentProps,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  formatClock,
  formatCount,
  formatDuration,
  formatPercent,
  REFERENCE_MS,
  RUN_STATUS,
  SECONDS_KEY,
  type FleetActivity,
  type FleetBucket,
  type FleetOutcome,
  type SlowestRun,
} from "./data"
import { SectionHeader } from "./section-header"
import { DotSeparator } from "./value-faces"

/** Stack order, bottom to top: routine success at the base, failures on top. */
const OUTCOMES: FleetOutcome[] = ["succeeded", "timedOut", "failed"]

// State tokens through RUN_STATUS, never --chart-N: those flip hue between themes.
const RUN_TIME_CHART_CONFIG = {
  succeededSec: {
    label: RUN_STATUS.succeeded.label,
    color: RUN_STATUS.succeeded.color,
  },
  timedOutSec: {
    label: RUN_STATUS.timedOut.label,
    color: RUN_STATUS.timedOut.color,
  },
  failedSec: { label: RUN_STATUS.failed.label, color: RUN_STATUS.failed.color },
} satisfies ChartConfig

const OUTCOME_BY_KEY = new Map<string, FleetOutcome>(
  OUTCOMES.map((outcome) => [SECONDS_KEY[outcome], outcome])
)

/** Segments are tinted bodies; each stack wears one solid cap in its top
 *  outcome's tone. The cap is the floor, so a sliver of failure still shows. */
const CAP_HEIGHT = 3
const CAP_RADII: [number, number, number, number] = [
  CAP_HEIGHT / 2,
  CAP_HEIGHT / 2,
  0,
  0,
]
const BODY_TINT = 0.2
/** The tint mixed into the panel surface: opaque, so neither the hover band
 *  nor the average line shows through a body. */
const bodyFill = (tone: string) =>
  `color-mix(in oklab, ${tone} ${BODY_TINT * 100}%, var(--card))`
/** The hairline between stacked segments. */
const SEAM = 1
const MAX_BAR_SIZE = 24
/** Every column but the hovered or focused one rests at this opacity. */
const DIMMED = 0.3
/** The pointer crossfade, opacity only. Arrow keys snap: a held key repeats
 *  faster than the fade and would leave half-lit columns behind. */
const HOVER_FADE =
  "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-has-[:focus-visible]/sdo1:transition-none"
/** The tooltip card pops in once per visit; reduced motion keeps the fade. */
const MOTION_STYLE = `
@keyframes sdo1-pop { from { opacity: 0; transform: scale(0.97); } }
@keyframes sdo1-fade { from { opacity: 0; } }
[data-sdo1-pop] { animation: sdo1-pop 125ms cubic-bezier(0.23, 1, 0.32, 1); }
@media (prefers-reduced-motion: reduce) {
  [data-sdo1-pop] { animation-name: sdo1-fade; }
}
`
/** The card docks itself, so Recharts pins its wrapper at the chart origin. */
const CARD_ORIGIN = { x: 0, y: 0 }
/** Room right of the plot for the average label. */
const AVERAGE_GUTTER = 56
/** Room above the plot for the timeout callout's label. */
const CALLOUT_BAND = 28
/** About half the callout label's width, so it never clips at a plot edge. */
const CALLOUT_HALF_WIDTH = 42
/** The tooltip card's widest size (max-w-56) and its air beside the column. */
const TOOLTIP_MAX_WIDTH = 224
const TOOLTIP_GAP = 4
const PEAK_HEADROOM = 1.08
const HOUR_MS = 3_600_000
/** Axis steps in minutes: the smallest that keeps the scale to 3 or 4 ticks. */
const MINUTE_STEPS = [5, 10, 15, 20, 30, 60, 120, 240]
/** Clock labels on every third hour; the axis thins them when narrow. */
const TICK_EVERY_HOURS = 3

const OUTCOME_LIST = new Intl.ListFormat("en-US", { type: "conjunction" })
const OUTCOME_CHOICE = new Intl.ListFormat("en-US", { type: "disjunction" })

const secondsOf = (bucket: FleetBucket, outcome: FleetOutcome) =>
  bucket[SECONDS_KEY[outcome]]

/** A column's plotted height: its shown outcomes stacked. */
const stackOf = (bucket: FleetBucket, shown: FleetOutcome[]) =>
  shown.reduce((sum, outcome) => sum + secondsOf(bucket, outcome), 0)

/** The hour the pointer or keyboard is reading; undefined at rest. */
function useReadHour() {
  const label = useActiveTooltipLabel()
  return label === undefined ? undefined : `${label}`
}

/** Ticks at round minutes from zero; the tallest stack may pass the last one. */
function minuteTicks(maxSec: number) {
  const maxMin = maxSec / 60
  const step =
    MINUTE_STEPS.find((candidate) => Math.floor(maxMin / candidate) <= 3) ??
    MINUTE_STEPS[MINUTE_STEPS.length - 1]
  const count = Math.max(1, Math.floor(maxMin / step))
  return Array.from({ length: count + 1 }, (_, index) => index * step * 60)
}

/** "13:00 to 14:00 UTC"; the current hour ends at the reference time. */
function hourWindow(bucket: FleetBucket) {
  const end = Math.min(bucket.start + HOUR_MS, REFERENCE_MS)
  return `${formatClock(bucket.start)} to ${formatClock(end)} UTC`
}

/** "-5% vs prior 24h"; a flat day says so. */
function changeLine(current: number, prior: number) {
  const percent = Math.round((current / prior - 1) * 100)
  if (percent === 0) return "Level with prior 24h"
  return `${percent > 0 ? "+" : ""}${percent}% vs prior 24h`
}

/** "77%"; a share too small to round up still reads as present. */
function shareOf(part: number, whole: number) {
  if (part <= 0 || whole <= 0) return "0%"
  const percent = (part / whole) * 100
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`
}

/** "40m" for the average label; under a minute keeps its seconds. */
const shortDuration = (sec: number) =>
  sec < 60 ? `${Math.round(sec)}s` : `${Math.round(sec / 60)}m`

/** "No runs"; with outcomes hidden, "No failed or timed out runs". */
function noRunsLine(shown: FleetOutcome[]) {
  if (shown.length === OUTCOMES.length) return "No runs"
  const names = shown.map((outcome) => RUN_STATUS[outcome].label.toLowerCase())
  return `No ${OUTCOME_CHOICE.format(names)} runs`
}

type PlotBox = { x: number; y: number; width: number }
type Dock = { x: number; y: number; flip: boolean }

/** Docks the card at the plot's top beside the active column, right when it
 *  fits, else the roomier side; a flipped card hangs from x by its right edge. */
function dockOf(
  plot: PlotBox | undefined,
  index: number,
  count: number,
  cardWidth: number
): Dock | undefined {
  if (!plot || index < 0 || count === 0) return undefined
  const band = plot.width / count
  const start = plot.x + index * band
  const end = start + band
  const roomRight = plot.x + plot.width + AVERAGE_GUTTER - end - TOOLTIP_GAP
  const roomLeft = start - TOOLTIP_GAP
  const flip = cardWidth > roomRight && roomLeft > roomRight
  return { x: flip ? start - TOOLTIP_GAP : end + TOOLTIP_GAP, y: plot.y, flip }
}

/** What a segment needs from the chart, read through context so the shape
 *  functions stay stable: an inline one would remount every bar per render. */
type SegmentScope = { buckets: FleetBucket[]; shown: FleetOutcome[] }

const SegmentContext = createContext<SegmentScope | null>(null)

function Segment({
  outcome,
  ...props
}: BarShapeProps & { outcome: FleetOutcome }) {
  const scope = useContext(SegmentContext)
  // Read here, not lifted: a hover re-renders the segments, never the chart,
  // so they stay mounted and the crossfade plays.
  const readHour = useReadHour()
  const bucket = scope?.buckets[props.originalDataIndex]
  if (!scope || !bucket || secondsOf(bucket, outcome) <= 0) return <g />
  const filled = scope.shown.filter((item) => secondsOf(bucket, item) > 0)
  const at = filled.indexOf(outcome)
  const isTop = at === filled.length - 1
  const tone = RUN_STATUS[outcome].color
  const dimmed = readHour !== undefined && readHour !== bucket.label
  return (
    <g style={{ opacity: dimmed ? DIMMED : 1 }} className={HOVER_FADE}>
      {/* A segment resting on another gives its bottom pixel to the seam. */}
      <Rectangle
        x={props.x}
        y={props.y}
        width={props.width}
        height={Math.max(0, props.height - (at > 0 ? SEAM : 0))}
        radius={isTop ? CAP_RADII : 0}
        fill={bodyFill(tone)}
      />
      {isTop ? (
        <Rectangle
          x={props.x}
          y={props.y}
          width={props.width}
          height={CAP_HEIGHT}
          radius={CAP_RADII}
          fill={tone}
        />
      ) : null}
    </g>
  )
}

const SEGMENT_SHAPES: Record<
  FleetOutcome,
  (props: BarShapeProps) => ReactElement
> = {
  succeeded: (props) => <Segment {...props} outcome="succeeded" />,
  timedOut: (props) => <Segment {...props} outcome="timedOut" />,
  failed: (props) => <Segment {...props} outcome="failed" />,
}

/** A band behind every hour, lit while that hour is read. Each hour keeps
 *  its own, so moving between hours crossfades instead of jumping. */
function ColumnBands({ labels }: { labels: string[] }) {
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const readHour = useReadHour()
  if (!plot || !xScale || labels.length === 0) return null
  const band = plot.width / labels.length
  return (
    <g aria-hidden="true" className="pointer-events-none">
      {labels.map((label) => {
        const middle = xScale(label, { position: "middle" })
        if (middle === undefined) return null
        return (
          <Rectangle
            key={label}
            x={middle - band / 2}
            y={plot.y}
            width={band}
            height={plot.height}
            radius={4}
            className={cn(
              "fill-muted",
              HOVER_FADE,
              readHour === label ? "opacity-100" : "opacity-0"
            )}
          />
        )
      })}
    </g>
  )
}

/** A pin on the hour that burned the most time on timeouts. Its label rides
 *  the band above the plot, so it never meets a bar or the average label. */
function TimeoutCallout({ label, top }: { label: string; top: number }) {
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const readHour = useReadHour()
  const x = xScale?.(label, { position: "middle" })
  const stackTop = yScale?.(top)
  if (!plot || x === undefined || stackTop === undefined) return null
  const dimmed = readHour !== undefined && readHour !== label
  const markerY = stackTop - 7
  const textY = plot.y - 10
  const textX = Math.min(
    Math.max(x, plot.x + CALLOUT_HALF_WIDTH),
    plot.x + plot.width - CALLOUT_HALF_WIDTH
  )

  return (
    <g
      aria-hidden="true"
      style={{ opacity: dimmed ? DIMMED : 1 }}
      className={cn("pointer-events-none", HOVER_FADE)}
    >
      {markerY - textY > 12 ? (
        <line
          x1={x}
          x2={x}
          y1={textY + 5}
          y2={markerY - 5}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.5}
          strokeDasharray="2 2"
        />
      ) : null}
      <circle
        cx={x}
        cy={markerY}
        r={2.5}
        fill="var(--warning)"
        stroke="var(--card)"
        strokeWidth={1.5}
      />
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        stroke="var(--card)"
        strokeWidth={3}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        Timeout burn
      </text>
    </g>
  )
}

/** The tooltip's foot: the hour's plotted total, its runs and its slowest run. */
function HourSummary({
  bucket,
  shown,
  single,
}: {
  bucket: FleetBucket
  shown: FleetOutcome[]
  /** One outcome row already states the total, so the total row would repeat it. */
  single: boolean
}) {
  const seconds = stackOf(bucket, shown)
  const runs = shown.reduce((sum, outcome) => sum + bucket[outcome], 0)
  const slowest = shown.reduce<SlowestRun | undefined>((longest, outcome) => {
    const run = bucket.slowest[outcome]
    return run && (!longest || run.durationSec > longest.durationSec)
      ? run
      : longest
  }, undefined)

  return (
    <div className="flex flex-col gap-1.5 border-t pt-1.5">
      {single ? null : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Runner time</span>
          <span className="font-mono font-medium tabular-nums">
            {formatDuration(seconds)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Runs</span>
        <span className="font-mono font-medium tabular-nums">
          {formatCount(runs)}
        </span>
      </div>
      {slowest ? (
        <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center justify-between gap-4">
            Slowest
            <span className="font-mono tabular-nums">
              {formatDuration(slowest.durationSec)}
            </span>
          </span>
          {/* Zero intrinsic width: the numbers size the card, the name wraps. */}
          <span className="line-clamp-2 w-0 min-w-full">
            {slowest.job.name}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** Docks the card beside the read column; it pops in once, then snaps, so it
 *  never slides across the column when the dock flips sides. */
function DockedCard({
  index,
  count,
  children,
}: {
  index: number
  count: number
  children: ReactNode
}) {
  const plot = usePlotArea()
  const card = useRef<HTMLDivElement>(null)
  // Measured before paint, so the dock never uses the last hour's width.
  const [cardWidth, setCardWidth] = useState(TOOLTIP_MAX_WIDTH)
  useLayoutEffect(() => {
    const width = card.current?.offsetWidth
    if (width && width !== cardWidth) setCardWidth(width)
  })
  const dock = dockOf(plot, index, count, cardWidth)
  if (!dock) return null
  return (
    <div
      style={{
        transform: `translate(${dock.x}px, ${dock.y}px)${dock.flip ? " translateX(-100%)" : ""}`,
      }}
    >
      {/* It grows from the edge that faces the column. */}
      <div
        ref={card}
        data-sdo1-pop=""
        style={{ transformOrigin: dock.flip ? "right top" : "left top" }}
      >
        {children}
      </div>
    </div>
  )
}

/** The read hour's outcomes and summary. A stable component, so the card
 *  stays mounted between hours and only pops on entry. */
function HourCard({
  buckets,
  shown,
  active,
  payload,
}: {
  buckets: FleetBucket[]
  shown: FleetOutcome[]
} & Partial<Pick<TooltipContentProps, "active" | "payload">>) {
  const bucket: FleetBucket | undefined = payload?.[0]?.payload
  if (!active || !bucket) return null
  const plotted =
    payload?.filter((item) => {
      const outcome = OUTCOME_BY_KEY.get(String(item.dataKey))
      return outcome !== undefined && shown.includes(outcome)
    }) ?? []
  // An outcome with no run this hour drops out of the card.
  const rows = plotted.filter((item) => {
    const outcome = OUTCOME_BY_KEY.get(String(item.dataKey))
    return outcome !== undefined && bucket[outcome] > 0
  })
  // A lone row's share would always read 100%; under a 28rem chart
  // no card with shares fits beside a middle column.
  const showShare = rows.length > 1
  const stack = stackOf(bucket, shown)
  return (
    <DockedCard
      index={buckets.findIndex((item) => item.label === bucket.label)}
      count={buckets.length}
    >
      <ChartTooltipContent
        active
        // An empty hour keeps one row to carry the card; it reads No runs.
        payload={rows.length > 0 ? rows : plotted.slice(0, 1)}
        className="w-auto max-w-56"
        labelFormatter={() => hourWindow(bucket)}
        formatter={(value, name, _item, index) => {
          if (rows.length === 0)
            return (
              <span className="text-muted-foreground">{noRunsLine(shown)}</span>
            )
          const outcome = OUTCOME_BY_KEY.get(String(name))
          if (!outcome) return null
          const seconds = Number(value)
          // One column per row: the wrapping row would size the
          // card to the outcome and the summary side by side.
          return (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full",
                      RUN_STATUS[outcome].tick
                    )}
                  />
                  {RUN_STATUS[outcome].label}
                </span>
                <span className="inline-flex items-baseline gap-2 tabular-nums">
                  <span className="font-mono font-medium">
                    {formatDuration(seconds)}
                  </span>
                  {showShare ? (
                    <span className="text-muted-foreground w-8 text-end @max-md:hidden">
                      {shareOf(seconds, stack)}
                    </span>
                  ) : null}
                </span>
              </div>
              {index === rows.length - 1 ? (
                <HourSummary
                  bucket={bucket}
                  shown={shown}
                  single={rows.length === 1}
                />
              ) : null}
            </div>
          )
        }}
      />
    </DockedCard>
  )
}

/** Runner time by start hour: the nightly batch window and timeout burn show. */
export function RunTimeChart({
  fleet,
  className,
}: {
  fleet: FleetActivity
  className?: string
}) {
  const [shown, setShown] = useState<FleetOutcome[]>(OUTCOMES)
  const buckets = fleet.buckets

  // Chips always carry every outcome's time, so they sum to the focal total.
  const totals: Record<FleetOutcome, number> = {
    succeeded: 0,
    timedOut: 0,
    failed: 0,
  }
  for (const bucket of buckets)
    for (const outcome of OUTCOMES)
      totals[outcome] += secondsOf(bucket, outcome)
  const total = OUTCOMES.reduce((sum, outcome) => sum + totals[outcome], 0)

  // One scope per dataset and filter, so an unrelated render skips the shapes.
  const segmentScope = useMemo(() => ({ buckets, shown }), [buckets, shown])
  const plotted = buckets.reduce(
    (sum, bucket) => sum + stackOf(bucket, shown),
    0
  )
  const peak = Math.max(0, ...buckets.map((bucket) => stackOf(bucket, shown)))
  const ticks = minuteTicks(peak)
  const domainTop = Math.max(ticks[ticks.length - 1], peak * PEAK_HEADROOM)
  const average = buckets.length > 0 ? plotted / buckets.length : 0
  // The hour that burned the most runner time on timeouts, while plotted.
  const burn = shown.includes("timedOut")
    ? buckets.reduce<FleetBucket | null>(
        (most, bucket) =>
          bucket.timedOutSec > (most?.timedOutSec ?? 0) ? bucket : most,
        null
      )
    : null
  const hourTicks = buckets
    .filter(
      (bucket) => Math.floor(bucket.start / HOUR_MS) % TICK_EVERY_HOURS === 0
    )
    .map((bucket) => bucket.label)

  const chartLabel = `Runner time per hour, last 24 hours: ${OUTCOME_LIST.format(
    shown.map((outcome) => RUN_STATUS[outcome].label)
  )}. Arrow keys move between hours.`

  return (
    <Frame
      spacing="default"
      className={cn("flex h-full min-w-0 flex-col", className)}
    >
      <SectionHeader
        title="Run Time"
        description="Runner time by start hour, UTC"
      >
        {/* The stock pressed fill is bg-muted, the band's own tone, so an on
            chip lifts to the card surface instead. */}
        <ToggleGroup
          multiple
          variant="outline"
          size="sm"
          value={shown}
          onValueChange={(next) => {
            // One outcome always stays plotted, so the chart never blanks.
            const picked = OUTCOMES.filter((outcome) => next.includes(outcome))
            if (picked.length > 0) setShown(picked)
          }}
          aria-label="Outcomes in the chart"
          className="flex-wrap"
        >
          {OUTCOMES.map((outcome) => (
            <ToggleGroupItem
              key={outcome}
              value={outcome}
              aria-label={`${RUN_STATUS[outcome].label}, ${formatDuration(totals[outcome])} runner time`}
              className="text-muted-foreground aria-pressed:bg-card aria-pressed:text-foreground gap-1.5"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  shown.includes(outcome)
                    ? RUN_STATUS[outcome].tick
                    : "border-muted-foreground/60 border"
                )}
              />
              {RUN_STATUS[outcome].label}
              <span className="tabular-nums">
                {formatDuration(totals[outcome])}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SectionHeader>
      <FramePanel className="flex min-h-0 flex-1 flex-col gap-4">
        <style>{MOTION_STYLE}</style>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatDuration(total)}
            </span>
            <span className="text-muted-foreground text-sm">runner time</span>
          </div>
          <p className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
            {/* Proportional: Inter's tabular figures widen the minus sign. */}
            <span>
              {fleet.priorSec > 0
                ? changeLine(total, fleet.priorSec)
                : "No prior day to compare"}
            </span>
            {total > 0 ? (
              <>
                <DotSeparator />
                <span className="tabular-nums">
                  {formatPercent((totals.failed + totals.timedOut) / total)} on
                  failed or timed out runs
                </span>
              </>
            ) : null}
          </p>
        </div>
        {/* Fills the row beside Up Next; the floor keeps a stacked layout readable.
            A container, so a narrow chart can drop the tooltip's share column. */}
        <div className="@container relative flex min-h-56 min-w-0 flex-1 flex-col">
          <ChartContainer
            config={RUN_TIME_CHART_CONFIG}
            role="group"
            aria-label={chartLabel}
            className="group/sdo1 has-[.recharts-surface:focus-visible]:ring-ring/50 ring-offset-card aspect-auto w-full min-w-0 flex-1 rounded-md has-[.recharts-surface:focus-visible]:ring-[3px] has-[.recharts-surface:focus-visible]:ring-offset-2"
          >
            <SegmentContext.Provider value={segmentScope}>
              <BarChart
                accessibilityLayer
                data={buckets}
                barCategoryGap="24%"
                margin={{
                  top: burn ? CALLOUT_BAND : 8,
                  right: AVERAGE_GUTTER,
                  bottom: 0,
                  left: 0,
                }}
              >
                {/* Lines on the ticks only, never a stray one at the plot's top edge. */}
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  syncWithTicks
                />
                <XAxis
                  dataKey="label"
                  ticks={hourTicks}
                  interval="equidistantPreserveStart"
                  minTickGap={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  ticks={ticks}
                  domain={[0, domainTop]}
                  tickFormatter={(value: number) =>
                    `${Math.round(value / 60)}m`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={36}
                />
                <ZIndexLayer zIndex={DefaultZIndexes.cursorRectangle}>
                  <ColumnBands labels={buckets.map((bucket) => bucket.label)} />
                </ZIndexLayer>
                <ChartTooltip
                  cursor={false}
                  position={CARD_ORIGIN}
                  isAnimationActive={false}
                  content={<HourCard buckets={buckets} shown={shown} />}
                />
                {/* All three stay mounted and hide instead: a remounted series
                  re-registers last and would jump to the top of the stack. */}
                {OUTCOMES.map((outcome) => (
                  <Bar
                    key={outcome}
                    dataKey={SECONDS_KEY[outcome]}
                    stackId="runs"
                    hide={!shown.includes(outcome)}
                    fill={`var(--color-${SECONDS_KEY[outcome]})`}
                    maxBarSize={MAX_BAR_SIZE}
                    isAnimationActive={false}
                    shape={SEGMENT_SHAPES[outcome]}
                  />
                ))}
                {average > 0 ? (
                  // Above the hover band, behind the opaque stacks: it never cuts one.
                  <ReferenceLine
                    zIndex={250}
                    y={average}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.6}
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${shortDuration(average)}`,
                      position: "right",
                      offset: 6,
                      fill: "var(--muted-foreground)",
                    }}
                  />
                ) : null}
                {burn ? (
                  // Its own layer above the hover band, so the pin stays lit on its hour.
                  <ZIndexLayer zIndex={DefaultZIndexes.line}>
                    <TimeoutCallout
                      label={burn.label}
                      top={stackOf(burn, shown)}
                    />
                  </ZIndexLayer>
                ) : null}
              </BarChart>
            </SegmentContext.Provider>
          </ChartContainer>
          {total === 0 ? (
            <p className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-xs">
              No runs in the last 24 hours
            </p>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  )
}