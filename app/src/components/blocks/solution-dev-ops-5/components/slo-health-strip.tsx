import {
  memo,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import {
  Bar,
  BarChart,
  ReferenceLine,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

import { burnTone } from "./burn-gauge"
import {
  ActiveLabelReporter,
  PlotAreaReporter,
  type PlotSpan,
} from "./chart-defs"
import {
  EVENT_KINDS,
  formatBurn,
  formatClock,
  formatDay,
  formatFactor,
  formatRelative,
  formatShare,
  formatSpan,
  plural,
  SLO_STATUS,
  STATUS_ORDER,
  type BudgetEvent,
  type SheetTab,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import {
  beadShape,
  budgetColor,
  CHART_FOCUS,
  Glyph,
  GUIDE_Z,
  keysAttr,
  LitColumns,
  LollipopFrame,
  renderStem,
  toLog,
  useColumnKeys,
  type Bead,
  type StemDatum,
} from "./lollipop"
import { SectionFoot, SectionFrame, SectionHead } from "./section-lead"
import {
  burnDownOf,
  DAY_MS,
  dayStartOf,
  derive,
  FAST_RULE,
  HISTORY_DAYS,
  HOUR_MS,
  isOngoing,
  REFERENCE_MS,
  rollingRemainingAt,
  WARN_REMAINING,
} from "./slo-math"
import {
  budgetPhrase,
  budgetText,
  DotSeparator,
  TextLink,
  WARNING_TEXT,
} from "./value-faces"

type OpenSlo = (id: string, tab: SheetTab, origin: HTMLElement) => void
type MedianPoint = { day: number; median: number }
type SwatchItem = {
  key: string
  /** A size-1.5 tone dot, or a lollipop Glyph for a line mark. */
  mark: ReactNode
  value: ReactNode
  label: string
  /** First to go when the legend runs out of room. */
  drop?: boolean
}

/** One column of a KPI mini: a stem or a bead stack, and its tooltip row. */
type MiniRow = {
  key: string
  value: number
  stem?: StemDatum
  beads?: Bead[]
  tip: { label: ReactNode; value: ReactNode }
}

const TREND_DAYS = 28
const PEAK_HOURS = 24
/** Every delta badge compares today's close with the close 7 days earlier. */
const WEEK_AGO_INDEX = HISTORY_DAYS - 8
/** The median mini's baseline column: the badge's 7 days ago. */
const ANCHOR_STEP = WEEK_AGO_INDEX - (HISTORY_DAYS - TREND_DAYS)
const MINI_HEAD = 2.5
/** Fleet and peak stems hang from 0; the lit column lifts a dot. */
const MINI_STEM = renderStem({ baseline: 0, head: MINI_HEAD, lit: "dot" })

const MINI_CONFIG = { value: { label: "Value" } } satisfies ChartConfig

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

/** A three band tile: the header band names it, the panel holds the value
 *  and the mini, and the footer band carries the subject. */
function KpiTile({
  icon,
  title,
  detail,
  children,
}: {
  icon: ReactNode
  title: string
  detail: string
  /** A KpiMini or EmptyMini; each renders the panel and the footer band. */
  children: ReactNode
}) {
  return (
    <SectionFrame>
      <SectionHead compact icon={icon} title={title} description={detail} />
      {children}
    </SectionFrame>
  )
}

/** The tile's figure: the value, its unit, then the badge beside it. */
function KpiValue({
  value,
  unit,
  className,
  badge,
}: {
  value: ReactNode
  unit?: string
  className?: string
  badge?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "shrink-0 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums",
          className
        )}
      >
        {value}
        {unit ? (
          <span className="text-muted-foreground ms-1 text-sm font-normal">
            {unit}
          </span>
        ) : null}
      </span>
      {badge}
    </div>
  )
}

/** Today against 7 days ago; higher is better on both tiles that use it.
 *  Only the arrow takes a tone, so a dip never reads as loud as a page. */
function DeltaBadge({ delta, unit = "" }: { delta: number; unit?: string }) {
  if (delta === 0) {
    return (
      <Badge variant="outline">
        No Change
        <span className="sr-only"> vs 7 days ago</span>
      </Badge>
    )
  }
  const up = delta > 0
  return (
    <Badge
      variant="outline"
      className={cn(
        "tabular-nums",
        up ? "[&_svg]:text-success" : "[&_svg]:text-destructive"
      )}
    >
      {up ? UI_ICONS.arrowUp : UI_ICONS.arrowDown}
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      {Math.abs(delta)}
      {unit}
      <span className="sr-only"> vs 7 days ago</span>
    </Badge>
  )
}

/** A legend mark for a point: the head's tone as a dot. */
function ToneDot({ tone, color }: { tone?: string; color?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", tone)}
      style={color ? { background: color } : undefined}
    />
  )
}

/** The mini's key, one row under it; a narrow tile drops the derivable item. */
function SwatchLegend({ items }: { items: SwatchItem[] }) {
  const crowded = items.length > 2
  return (
    <div className="@container min-w-0">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
        {items.map((item) => (
          <span
            key={item.key}
            className={cn(
              "flex items-center gap-1 whitespace-nowrap tabular-nums",
              crowded && item.drop && "@max-[15.5rem]:sr-only"
            )}
          >
            {item.mark}
            <span className="text-foreground">{item.value}</span>
            <span className={crowded ? undefined : "@max-[9rem]:sr-only"}>
              {item.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** The footer band: a subject at rest, the pointed column's readout while
 *  a pointer or the keys move. It speaks only while the keys drive it. */
function SubjectBand({
  live = false,
  children,
}: {
  live?: boolean
  children: ReactNode
}) {
  return (
    <SectionFoot
      aria-live={live ? "polite" : "off"}
      className="flex-nowrap justify-start gap-2"
    >
      {children}
    </SectionFoot>
  )
}

/** The flat track a mini leaves when nothing is in scope. */
function EmptyMini({ head, subject }: { head: ReactNode; subject: ReactNode }) {
  return (
    <>
      <FramePanel className="flex flex-col gap-3">
        {head}
        <div className="mt-auto flex h-10 items-end">
          <span className="bg-muted h-1 w-full rounded-full" />
        </div>
      </FramePanel>
      <SubjectBand>{subject}</SubjectBand>
    </>
  )
}

type MiniShape = (props: BarShapeProps) => ReactElement

/** The mini's plot alone, memoised so a hover never re-renders the Bar. */
const MiniPlot = memo(function MiniPlot({
  rows,
  domain,
  shape,
  guides,
  onActiveKey,
  onPlot,
}: {
  rows: MiniRow[]
  domain: [number, number]
  shape: MiniShape
  guides?: ReactNode
  onActiveKey: (key: string | null) => void
  onPlot: (span: PlotSpan | null) => void
}) {
  return (
    <BarChart
      accessibilityLayer={false}
      data={rows}
      margin={{ top: 4, right: 6, bottom: 4, left: 6 }}
    >
      <ActiveLabelReporter onChange={onActiveKey} />
      <PlotAreaReporter onChange={onPlot} />
      <XAxis dataKey="key" hide />
      {/* Values arrive clamped, so no overflow clip cuts an edge head. */}
      <YAxis hide domain={domain} />
      {guides}
      {/* The footer band is the readout: no box over a 40px plot. */}
      <ChartTooltip
        cursor={false}
        isAnimationActive={false}
        content={() => null}
      />
      <Bar
        dataKey="value"
        minPointSize={1}
        isAnimationActive={false}
        shape={shape}
      />
    </BarChart>
  )
})

/** A 40px lollipop chart over its key: the pill rests on `rest`, and hover
 *  or the arrow keys turn the footer band into that column's readout. */
function KpiMini({
  label,
  rows,
  rest,
  domain,
  shape,
  guides,
  head,
  legend,
  subject,
}: {
  label: string
  rows: MiniRow[]
  rest: number | null
  domain: [number, number]
  /** Stable across hovers: a stem shape, or beadShape. */
  shape: MiniShape
  guides?: ReactNode
  head: ReactNode
  legend?: ReactNode
  subject: ReactNode
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [plot, setPlot] = useState<PlotSpan | null>(null)
  const keys = useColumnKeys(rows.length, rest)
  const hovered =
    activeKey === null ? -1 : rows.findIndex((row) => row.key === activeKey)
  const pointed = keys.keyIndex ?? (hovered >= 0 ? hovered : null)
  const active = pointed ?? rest
  const readout = pointed === null ? null : rows[pointed]
  const readoutTone =
    readout?.stem?.color ??
    readout?.beads?.[0]?.color ??
    "var(--muted-foreground)"

  return (
    <>
      <FramePanel className="flex flex-col gap-3">
        {head}
        {/* Pinned down, so a wrapped value row never shifts a tile's mini. */}
        <div
          role="group"
          aria-label={label}
          tabIndex={0}
          onKeyDown={keys.onKeyDown}
          onBlur={keys.clear}
          {...keysAttr(keys.keyIndex)}
          onPointerMove={() => {
            if (keys.keyIndex !== null) keys.clear()
          }}
          className={cn("mt-auto min-w-0", CHART_FOCUS)}
        >
          <LollipopFrame
            plot={plot}
            count={rows.length}
            focus={active === null ? null : { first: active, last: active }}
            pillWidth={12}
            className="h-10"
          >
            <LitColumns active={active}>
              <ChartContainer
                config={MINI_CONFIG}
                // Heads at the domain's ends draw past the svg box, unclipped.
                className="aspect-auto size-full min-w-0 [&_.recharts-surface]:overflow-visible"
                initialDimension={{ width: 260, height: 40 }}
              >
                <MiniPlot
                  rows={rows}
                  domain={domain}
                  shape={shape}
                  guides={guides}
                  onActiveKey={setActiveKey}
                  onPlot={setPlot}
                />
              </ChartContainer>
            </LitColumns>
          </LollipopFrame>
        </div>
        {legend}
      </FramePanel>
      <SubjectBand live={keys.keyIndex !== null}>
        {readout ? (
          <>
            {/* The pointed head's colour ties the band to its column. */}
            <ToneDot color={readoutTone} />
            <span className="flex min-w-0 items-center gap-1.5 [&>span:last-child]:truncate">
              {typeof readout.tip.label === "string" ? (
                <span>{readout.tip.label}</span>
              ) : (
                readout.tip.label
              )}
            </span>
            <span className="text-foreground ms-auto shrink-0 font-medium tabular-nums">
              {readout.tip.value}
            </span>
          </>
        ) : (
          subject
        )}
      </SubjectBand>
    </>
  )
}

/** The SLO whose window budget ran out most recently, read off the same
 *  burn-down the Error Budget section draws, so both name one day. */
function newestMiss(slos: Slo[]) {
  let newest: { slo: Slo; day: number } | null = null
  for (const slo of slos) {
    const { points, nowIndex } = burnDownOf(slo)
    const ranOut = points
      .slice(1, nowIndex + 1)
      .find((point) => point.remaining !== null && point.remaining <= 0)
    if (ranOut && (!newest || ranOut.day > newest.day))
      newest = { slo, day: ranOut.day }
  }
  return newest
}

/** The trend column an event lands in; earlier starts fold into the first. */
const eventDayOf = (ms: number) =>
  clamp(
    Math.floor((ms - dayStartOf(HISTORY_DAYS - TREND_DAYS)) / DAY_MS),
    0,
    TREND_DAYS - 1
  )

/** Counted incidents sit at the foot of a day's stack, exclusions on top. */
const beadRank = (event: BudgetEvent) =>
  event.excluded ? 2 : event.kind === "incident" ? 0 : 1

function beadOf(event: BudgetEvent): Bead {
  return {
    color:
      !event.excluded && event.kind === "incident"
        ? "var(--destructive)"
        : "var(--muted-foreground)",
    hollow: event.excluded,
    halo: isOngoing(event),
  }
}

export function SloHealthStrip({
  slos,
  onOpenSlo,
}: {
  slos: Slo[]
  onOpenSlo: OpenSlo
}) {
  const empty = slos.length === 0

  // Meeting objective: budget left above zero, today and 7 days ago.
  const meeting = slos.filter((slo) => derive(slo).stats.remaining > 0).length
  const meetingThen = slos.filter(
    (slo) => rollingRemainingAt(slo, WEEK_AGO_INDEX) > 0
  ).length
  const miss = newestMiss(slos)
  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: slos.filter((slo) => derive(slo).status === status).length,
  }))
  // One rising curve from overspent to full; heads take the budget colour,
  // and a burn-driven risk above the warn line keeps a warning halo.
  const fleetRows = useMemo<MiniRow[]>(
    () =>
      [...slos]
        .sort((a, b) => derive(a).stats.remaining - derive(b).stats.remaining)
        .map((slo) => {
          const { stats, status } = derive(slo)
          const value = clamp(stats.remaining, -0.5, 1)
          return {
            key: slo.id,
            value,
            stem: {
              value,
              color: budgetColor(stats.remaining),
              kind: "measured",
              halo:
                status === "atRisk" && stats.remaining >= WARN_REMAINING
                  ? "var(--warning)"
                  : null,
            },
            tip: { label: slo.name, value: budgetPhrase(stats.remaining) },
          }
        }),
    [slos]
  )
  const missIndex = miss
    ? fleetRows.findIndex((row) => row.key === miss.slo.id)
    : -1

  const lowest = slos.reduce<Slo | null>(
    (low, slo) =>
      low === null || derive(slo).stats.remaining < derive(low).stats.remaining
        ? slo
        : low,
    null
  )
  const lowestLeft = lowest ? derive(lowest).stats.remaining : 0

  const medianPoints = useMemo<MedianPoint[]>(
    () =>
      empty
        ? []
        : Array.from({ length: TREND_DAYS }, (_, step) => {
            const index = HISTORY_DAYS - TREND_DAYS + step
            return {
              day: dayStartOf(index),
              median: median(slos.map((slo) => rollingRemainingAt(slo, index))),
            }
          }),
    [empty, slos]
  )
  const medianNow = medianPoints[medianPoints.length - 1]?.median ?? 0
  const medianThen = medianPoints[ANCHOR_STEP]?.median ?? 0
  const medianLow = medianPoints.length
    ? medianPoints.reduce((low, point) =>
        point.median < low.median ? point : low
      )
    : null
  const medianRows = medianPoints.map<MiniRow>((point, step) => {
    const today = step === medianPoints.length - 1
    return {
      key: String(point.day),
      value: point.median,
      stem: {
        value: point.median,
        color: today ? budgetColor(point.median) : "var(--muted-foreground)",
        kind: "measured",
        // Quiet context up to the 7 days ago anchor the badge compares with.
        dim: step <= ANCHOR_STEP,
        hollow: step === ANCHOR_STEP,
      },
      tip: {
        label:
          step === ANCHOR_STEP ? (
            <>
              {formatDay(point.day)}
              <DotSeparator />7 days ago
            </>
          ) : (
            formatDay(point.day)
          ),
        value: formatShare(point.median),
      },
    }
  })
  const medianValues = [
    ...medianPoints.map((point) => point.median),
    medianThen,
  ]
  const medianMin = Math.min(...medianValues)
  const medianMax = Math.max(...medianValues)
  const medianPad = Math.max(0.02, 0.15 * (medianMax - medianMin))

  const breached = slos
    .filter((slo) => derive(slo).breach !== null)
    .sort((a, b) => derive(b).rates["1h"] - derive(a).rates["1h"])
  const paging = breached.filter((slo) => derive(slo).breach === "page").length
  const ticketing = breached.length - paging
  const hottest = breached[0] ?? null
  const hottestBurn = hottest ? derive(hottest).rates["1h"] : 0

  // Each hour's fleet peak keeps its SLO, so the tallest stem is attributed.
  const { peakRows, dayPeak } = useMemo(() => {
    const peaks = Array.from({ length: PEAK_HOURS }, (_, index) => {
      let burn = 0
      let slo: Slo | null = null
      for (const candidate of slos) {
        const { hours } = derive(candidate)
        const value = hours[hours.length - PEAK_HOURS + index]?.burn ?? 0
        if (value > burn) {
          burn = value
          slo = candidate
        }
      }
      const at = REFERENCE_MS - (PEAK_HOURS - 1 - index) * HOUR_MS
      return { burn, slo, at }
    })
    const best = peaks.reduce((top, hour) =>
      hour.burn > top.burn ? hour : top
    )
    const rows = peaks.map(({ burn: peak, slo: top, at }): MiniRow => {
      const value = clamp(toLog(peak), -1, 2)
      return {
        key: String(at),
        value,
        stem: {
          value,
          color: burnTone(peak, "1h").stroke,
          kind: peak >= 1 ? "measured" : "quiet",
        },
        tip: {
          label: top ? (
            <>
              <span className="shrink-0">{formatClock(at)}</span>
              <DotSeparator />
              <span>{top.name}</span>
            </>
          ) : (
            formatClock(at)
          ),
          value: formatBurn(peak),
        },
      }
    })
    return { peakRows: rows, dayPeak: best }
  }, [slos])
  const pageHours = peakRows.filter(
    (row) => row.value >= toLog(FAST_RULE.factor)
  ).length
  // Over 1× but under the page line: the amber stems.
  const paceHours = peakRows.filter(
    (row) => row.value >= 0 && row.value < toLog(FAST_RULE.factor)
  ).length

  // One entry per incident id: a shared incident hits several SLOs.
  const { events, owners } = useMemo(() => {
    const from = REFERENCE_MS - TREND_DAYS * DAY_MS
    const byId = new Map<string, BudgetEvent>()
    const ownerOf = new Map<string, Slo>()
    for (const slo of slos) {
      for (const event of slo.events) {
        if (event.startedAt < from) continue
        const seen = byId.get(event.id)
        // Counted anywhere wins over excluded everywhere.
        if (!seen || (seen.excluded && !event.excluded))
          byId.set(event.id, event)
        if (!ownerOf.has(event.id)) ownerOf.set(event.id, slo)
      }
    }
    return {
      events: [...byId.values()].sort((a, b) => b.startedAt - a.startedAt),
      owners: ownerOf,
    }
  }, [slos])
  const incidents = events.filter(
    (event) => event.kind === "incident" && !event.excluded
  ).length
  const closed = events.filter((event) => !isOngoing(event))
  const mttr = closed.length
    ? closed.reduce((sum, event) => sum + (event.durationMin ?? 0), 0) /
      closed.length
    : null
  const latest = events[0] ?? null
  const latestSlo = latest ? owners.get(latest.id) : undefined

  const eventDays = useMemo(() => {
    const days: BudgetEvent[][] = Array.from({ length: TREND_DAYS }, () => [])
    for (const event of events) days[eventDayOf(event.startedAt)].push(event)
    return days.map<MiniRow>((day, index) => {
      const stack = [...day].sort(
        (a, b) => beadRank(a) - beadRank(b) || a.startedAt - b.startedAt
      )
      const at = dayStartOf(HISTORY_DAYS - TREND_DAYS + index)
      return {
        key: String(at),
        value: stack.length,
        beads: stack.map(beadOf),
        tip: { label: formatDay(at), value: plural(stack.length, "event") },
      }
    })
  }, [events])
  const latestIndex = latest ? eventDayOf(latest.startedAt) : null

  const missSubject = miss ? (
    <>
      <span className="shrink-0">Newest miss</span>
      <TextLink
        onClick={(event) =>
          onOpenSlo(miss.slo.id, "overview", event.currentTarget)
        }
        className="text-[13px]"
      >
        {miss.slo.name}
      </TextLink>
      <span className="ms-auto shrink-0 tabular-nums">
        {formatDay(miss.day)}
      </span>
    </>
  ) : (
    <span className="truncate">
      {empty ? "No SLOs in scope" : "Every SLO within budget"}
    </span>
  )

  const lowestSubject = lowest ? (
    <>
      <span className="shrink-0">Lowest</span>
      <TextLink
        onClick={(event) =>
          onOpenSlo(lowest.id, "overview", event.currentTarget)
        }
        className="text-[13px]"
      >
        {lowest.name}
      </TextLink>
      <span className="ms-auto shrink-0 tabular-nums">
        <span className={cn("font-medium", budgetText(lowestLeft))}>
          {formatShare(Math.abs(lowestLeft))}
        </span>{" "}
        {lowestLeft > 0 ? "left" : "over"}
      </span>
    </>
  ) : (
    <span className="truncate">No SLOs in scope</span>
  )

  const hottestSubject = hottest ? (
    <>
      <span className="shrink-0">Hottest</span>
      <TextLink
        onClick={(event) => onOpenSlo(hottest.id, "burn", event.currentTarget)}
        className="text-[13px]"
      >
        {hottest.name}
      </TextLink>
      <span
        className={cn(
          "ms-auto shrink-0 font-medium tabular-nums",
          burnTone(hottestBurn, "1h").text
        )}
      >
        {formatBurn(hottestBurn)}
      </span>
    </>
  ) : (
    <span className="truncate">
      {empty ? "No SLOs in scope" : "Every SLO under its burn lines"}
    </span>
  )

  const latestSubject =
    latest && latestSlo ? (
      <>
        <span className="shrink-0">Latest</span>
        <TextLink
          onClick={(event) =>
            onOpenSlo(latestSlo.id, "events", event.currentTarget)
          }
          className="text-[13px]"
        >
          {latest.title}
        </TextLink>
        {isOngoing(latest) ? (
          <span className={cn("ms-auto shrink-0", WARNING_TEXT)}>Ongoing</span>
        ) : (
          <span className="ms-auto shrink-0 tabular-nums">
            {formatRelative(latest.startedAt)}
          </span>
        )}
      </>
    ) : (
      <span className="truncate">
        {empty ? "No SLOs in scope" : `No events in ${TREND_DAYS} days`}
      </span>
    )

  const meetingHead = (
    <KpiValue
      value={meeting}
      unit={`of ${slos.length}`}
      badge={empty ? null : <DeltaBadge delta={meeting - meetingThen} />}
    />
  )
  const medianHead = (
    <KpiValue
      value={formatShare(medianNow)}
      className={empty ? undefined : budgetText(medianNow)}
      badge={
        empty ? null : (
          <DeltaBadge
            delta={Math.round((medianNow - medianThen) * 100)}
            unit=" pts"
          />
        )
      }
    />
  )
  const burningHead = (
    <KpiValue
      value={breached.length}
      unit="alerting"
      badge={
        empty ? null : breached.length > 0 ? (
          // Both levels show, so the figure is fully accounted for.
          <>
            {paging > 0 ? (
              <Badge variant="destructive-light" className="tabular-nums">
                {paging} Paging
              </Badge>
            ) : null}
            {ticketing > 0 ? (
              <Badge variant="warning-light" className="tabular-nums">
                {plural(ticketing, "Ticket")}
              </Badge>
            ) : null}
          </>
        ) : (
          <Badge variant="outline">Quiet</Badge>
        )
      }
    />
  )
  const eventsHead = (
    <KpiValue
      value={events.length}
      badge={
        mttr === null ? null : (
          <Badge variant="outline" className="tabular-nums">
            MTTR {formatSpan(mttr)}
          </Badge>
        )
      }
    />
  )

  const burnItems: SwatchItem[] = [
    {
      key: "page",
      tone: "bg-destructive",
      hours: pageHours,
      label: "over page",
    },
    { key: "pace", tone: "bg-warning", hours: paceHours, label: "over pace" },
  ]
    .filter((item) => item.hours > 0)
    .map((item) => ({
      key: item.key,
      mark: <ToneDot tone={item.tone} />,
      value: `${item.hours}h`,
      label: item.label,
    }))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile
        icon={UI_ICONS.target}
        title="Meeting Objective"
        detail="SLOs with budget left"
      >
        {empty ? (
          <EmptyMini head={meetingHead} subject={missSubject} />
        ) : (
          <KpiMini
            label={`Budget left by SLO, lowest first: ${statusCounts
              .map(
                (group) =>
                  `${group.count} ${SLO_STATUS[group.status].label.toLowerCase()}`
              )
              .join(
                ", "
              )}${miss ? `. Newest miss ${miss.slo.name}, ${formatDay(miss.day)}` : ""}`}
            rows={fleetRows}
            rest={missIndex >= 0 ? missIndex : null}
            domain={[-0.5, 1]}
            shape={MINI_STEM}
            guides={
              <>
                <ReferenceLine
                  y={0}
                  stroke="var(--foreground)"
                  strokeOpacity={0.25}
                  zIndex={GUIDE_Z}
                />
                <ReferenceLine
                  y={WARN_REMAINING}
                  stroke="var(--warning)"
                  strokeOpacity={0.5}
                  strokeDasharray="2 3"
                  zIndex={GUIDE_Z}
                />
              </>
            }
            head={meetingHead}
            legend={
              <SwatchLegend
                items={statusCounts
                  .filter((group) => group.count > 0)
                  .map((group) => ({
                    key: group.status,
                    mark: <ToneDot tone={SLO_STATUS[group.status].tick} />,
                    value: group.count,
                    label: SLO_STATUS[group.status].label,
                    // Healthy derives from the value, so it goes first.
                    drop: group.status === "healthy",
                  }))}
              />
            }
            subject={missSubject}
          />
        )}
      </KpiTile>

      <KpiTile
        icon={UI_ICONS.wallet}
        title="Median Budget Left"
        detail={`Fleet median, last ${TREND_DAYS} days`}
      >
        {empty || !medianLow ? (
          <EmptyMini head={medianHead} subject={lowestSubject} />
        ) : (
          <KpiMini
            label={`Median budget left, last ${TREND_DAYS} days: low ${formatShare(medianLow.median)} on ${formatDay(medianLow.day)}${lowest ? `. Lowest ${lowest.name}, ${budgetPhrase(lowestLeft)}` : ""}`}
            rows={medianRows}
            rest={medianRows.length - 1}
            domain={[medianMin - medianPad, medianMax + medianPad]}
            shape={renderStem({
              baseline: medianThen,
              head: MINI_HEAD,
              lit: "dot",
            })}
            guides={
              <ReferenceLine
                y={medianThen}
                stroke="var(--foreground)"
                strokeOpacity={0.25}
                strokeDasharray="2 3"
                zIndex={GUIDE_Z}
              />
            }
            head={medianHead}
            legend={
              <SwatchLegend
                items={[
                  {
                    key: "then",
                    // The stems hang from this dashed baseline.
                    mark: <Glyph kind="dash" />,
                    value: formatShare(medianThen),
                    label: `on ${formatDay(medianPoints[ANCHOR_STEP]?.day ?? 0)}`,
                  },
                  {
                    key: "today",
                    mark: <ToneDot color={budgetColor(medianNow)} />,
                    value: formatShare(medianNow),
                    label: "today",
                  },
                ]}
              />
            }
            subject={lowestSubject}
          />
        )}
      </KpiTile>

      <KpiTile
        icon={UI_ICONS.flame}
        title="Burning Now"
        detail={`Hourly fleet peak, last ${PEAK_HOURS}h`}
      >
        {empty ? (
          <EmptyMini head={burningHead} subject={hottestSubject} />
        ) : (
          <KpiMini
            label={`Peak burn by hour, last ${PEAK_HOURS} hours: ${plural(pageHours, "hour")} over the ${formatFactor(FAST_RULE.factor)} page line${dayPeak.slo ? `. Peak ${dayPeak.slo.name} at ${formatBurn(dayPeak.burn)}, ${formatClock(dayPeak.at)}` : ""}${hottest ? `. Hottest now ${hottest.name} at ${formatBurn(hottestBurn)}` : ""}`}
            rows={peakRows}
            rest={peakRows.length - 1}
            domain={[-1, 2]}
            shape={MINI_STEM}
            guides={
              <>
                <ReferenceLine
                  y={0}
                  stroke="var(--foreground)"
                  strokeOpacity={0.25}
                  zIndex={GUIDE_Z}
                />
                <ReferenceLine
                  y={toLog(FAST_RULE.factor)}
                  stroke="var(--destructive)"
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                  zIndex={GUIDE_Z}
                />
              </>
            }
            head={burningHead}
            legend={
              burnItems.length > 0 ? (
                <SwatchLegend items={burnItems} />
              ) : (
                <p className="text-muted-foreground text-xs font-medium">
                  Under pace all day
                </p>
              )
            }
            subject={hottestSubject}
          />
        )}
      </KpiTile>

      <KpiTile
        icon={UI_ICONS.events}
        title="Budget Events"
        detail={`Incidents and changes, ${TREND_DAYS} days`}
      >
        {empty ? (
          <EmptyMini head={eventsHead} subject={latestSubject} />
        ) : (
          <KpiMini
            label={`${plural(events.length, "event")} in ${TREND_DAYS} days, ${plural(incidents, "incident")}${latest ? `. Latest ${latest.title}, ${isOngoing(latest) ? "ongoing" : formatRelative(latest.startedAt)}` : ""}`}
            rows={eventDays}
            rest={latestIndex}
            domain={[0, 4]}
            shape={beadShape}
            head={eventsHead}
            legend={
              events.length > 0 ? (
                <SwatchLegend
                  items={[
                    {
                      key: "incident",
                      mark: <ToneDot tone={EVENT_KINDS.incident.dot} />,
                      value: incidents,
                      label:
                        incidents === 1
                          ? EVENT_KINDS.incident.label
                          : EVENT_KINDS.incident.many,
                    },
                    {
                      key: "other",
                      mark: <ToneDot tone="bg-muted-foreground" />,
                      value: events.length - incidents,
                      label: "Other",
                    },
                  ].filter((item) => item.value > 0)}
                />
              ) : null
            }
            subject={latestSubject}
          />
        )}
      </KpiTile>
    </div>
  )
}