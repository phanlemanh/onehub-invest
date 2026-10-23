import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import { motion } from "motion/react"
import {
  Bar,
  BarChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
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
  formatAttainment,
  formatBurn,
  formatCount,
  formatDay,
  formatObjective,
  formatShare,
  plural,
  SLI_KINDS,
  type BudgetEvent,
  type EventKind,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import {
  BubbleText,
  budgetColor,
  CHART_FOCUS,
  Glyph,
  GUIDE_Z,
  keysAttr,
  LineTag,
  LitColumns,
  LollipopFrame,
  MARK,
  planChips,
  renderStem,
  useColumnKeys,
  useMarkMotion,
  withMonths,
  type ChipSpec,
  type ColumnSpan,
  type StemRow,
} from "./lollipop"
import { SectionFoot } from "./section-lead"
import {
  burnDownOf,
  DAY_MS,
  derive,
  eventShareOf,
  inWindow,
  REFERENCE_MS,
  WARN_REMAINING,
  type BurnDown,
  type BurnPoint,
} from "./slo-math"
import {
  budgetPhrase,
  budgetText,
  DotSeparator,
  TextLink,
  WARNING_TEXT,
} from "./value-faces"

/** One column per day close, then the forecast days. */
type BudgetRow = StemRow & { point: BurnPoint }

const CHART_CONFIG = {
  value: { label: "Budget Left" },
} satisfies ChartConfig

const KIND_RANK: EventKind[] = [
  "incident",
  "dependency",
  "deploy",
  "maintenance",
]
/** Exhaustion further out than this reads as holding. */
const FORECAST_HORIZON_DAYS = 60
/** A counted event that spent this share of the budget gets a halo and a chip. */
const HALO_SHARE = 0.05
/** The sentence names events that spent this share. */
const BIG_SHARE = 0.1
/** Room under 0% for the line when nothing is overspent. */
const CALM_FLOOR = -0.06
const NARROW_QUERY = "(max-width: 639px)"
const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
]

const countWord = (count: number) => NUMBER_WORDS[count] ?? String(count)

const spanOf = (a: number, b: number): ColumnSpan => ({
  first: Math.min(a, b),
  last: Math.max(a, b),
})

/** Counted events first, then by kind. */
const byRank = (events: BudgetEvent[]) =>
  [...events].sort(
    (a, b) =>
      Number(a.excluded) - Number(b.excluded) ||
      KIND_RANK.indexOf(a.kind) - KIND_RANK.indexOf(b.kind)
  )

const dayNumber = (ms: number) => String(new Date(ms).getUTCDate())

function subscribeNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** Below sm the hero rail chips every other week. */
function useNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false
  )
}

/** Counted in-window events that spent a big share, largest first. */
function bigEventsOf(slo: Slo) {
  return slo.events
    .filter(
      (event) =>
        !event.excluded &&
        inWindow(slo, event) &&
        eventShareOf(slo, event) >= BIG_SHARE
    )
    .sort((a, b) => eventShareOf(slo, b) - eventShareOf(slo, a))
}

/** The forecast exhaustion day, or null when it holds past the horizon. */
function runsOutOf({ exhaustAt }: BurnDown) {
  return exhaustAt !== null &&
    exhaustAt - REFERENCE_MS < FORECAST_HORIZON_DAYS * DAY_MS
    ? exhaustAt
    : null
}

/** The plain-language line under the headline figure. */
function sentenceOf(slo: Slo, burn: BurnDown, runsOut: number | null) {
  const { stats, rates, breach } = derive(slo)
  // A page outranks the 7 day pace: at the last hour's rate it empties in hours.
  if (stats.remaining > 0 && breach === "page" && rates["1h"] > 0) {
    const perHour = rates["1h"] / (slo.windowDays * 24)
    const hours = Math.max(1, Math.round(stats.remaining / perHour))
    return `Paging at ${formatBurn(rates["1h"])}, empty in ${plural(hours, "hour")}.`
  }
  if (stats.remaining > 0) {
    return runsOut === null
      ? "Burning under even pace, it holds."
      : `At this pace it runs out ${formatDay(runsOut)}.`
  }
  const big = bigEventsOf(slo)
  const noun = (count: number) =>
    big.every((event) => event.kind === "incident")
      ? count === 1
        ? "incident"
        : "incidents"
      : count === 1
        ? "event"
        : "events"
  if (big.length >= 2) {
    const spent = big.reduce((sum, event) => sum + eventShareOf(slo, event), 0)
    const days = big.map((event) => Math.floor(event.startedAt / DAY_MS))
    const span = Math.max(...days) - Math.min(...days) + 1
    return `${countWord(big.length)} ${noun(big.length)} spent ${formatShare(spent)} in ${countWord(span).toLowerCase()} ${span === 1 ? "day" : "days"}.`
  }
  if (big.length === 1) {
    return `One ${noun(1)} spent ${formatShare(eventShareOf(slo, big[0]))} on ${formatDay(big[0].startedAt)}.`
  }
  const { points, nowIndex } = burn
  const ranOut = points
    .slice(1, nowIndex + 1)
    .find((point) => point.remaining !== null && point.remaining <= 0)
  return `Ran out ${formatDay(ranOut?.day ?? points[nowIndex].day)} at a steady burn.`
}

/** "4 days ago", "in 3 days", "Today": a day against the reference date. */
function fromNow(day: number) {
  const days = Math.floor(day / DAY_MS) - Math.floor(REFERENCE_MS / DAY_MS)
  if (days === 0) return "Today"
  return days > 0 ? `in ${plural(days, "day")}` : `${plural(-days, "day")} ago`
}

/** One ribbon cell: label, figure, one quiet line under it. */
function Metric({
  label,
  hint,
  tone,
  className,
  children,
}: {
  label: string
  hint: ReactNode
  /** The figure's state colour. */
  tone?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 bg-(--frame-panel-bg) px-(--frame-panel-px) py-3",
        className
      )}
    >
      <dt className="text-muted-foreground truncate text-xs">{label}</dt>
      <dd
        className={cn(
          "flex min-w-0 items-baseline gap-1.5 text-2xl font-semibold tracking-tight whitespace-nowrap tabular-nums",
          tone
        )}
      >
        {children}
      </dd>
      <dd className="text-muted-foreground truncate text-xs">{hint}</dd>
    </div>
  )
}

/** The window as it stands now: never swapped by a hover or a drag. */
function BudgetRibbon({ slo, burn }: { slo: Slo; burn: BurnDown }) {
  const { stats, rates, breach } = derive(slo)
  const { points, nowIndex } = burn
  const exhausted = stats.remaining <= 0
  const pace = stats.allowed > 0 ? stats.dailyBad / stats.allowed : 0
  const even = 1 / slo.windowDays
  const ranOut =
    points
      .slice(1, nowIndex + 1)
      .find((point) => point.remaining !== null && point.remaining <= 0)?.day ??
    points[nowIndex].day
  const runsOut = runsOutOf(burn)
  // The sentence earns the cell only when it says what Runs out cannot:
  // a page, or what spent it; otherwise the budget reads in the SLI's unit.
  const paging = breach === "page" && rates["1h"] > 0
  const hint =
    exhausted || paging
      ? sentenceOf(slo, burn, runsOut)
      : `${formatCount(stats.bad)} of ${formatCount(stats.allowed)} bad ${SLI_KINDS[slo.sli].noun}`

  // One hairline grid: the headline spans the row until lg seats it first.
  return (
    <dl className="bg-border grid grid-cols-2 gap-px border-b sm:grid-cols-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]">
      <Metric
        label="Budget"
        hint={hint}
        className="col-span-2 sm:col-span-4 lg:col-span-1"
      >
        {formatShare(Math.abs(stats.remaining))}
        <span
          className={cn(
            "text-sm font-medium tracking-normal",
            exhausted
              ? "text-destructive"
              : stats.remaining < WARN_REMAINING
                ? WARNING_TEXT
                : "text-muted-foreground"
          )}
        >
          {exhausted ? "over" : "left"}
        </span>
      </Metric>
      <Metric
        label="Attained"
        hint={`Target ${formatObjective(slo.objective)}`}
      >
        {formatAttainment(stats.attainment)}
      </Metric>
      <Metric
        label="Burn 1h"
        hint={`${formatBurn(rates["6h"])} over 6h`}
        tone={burnTone(rates["1h"], "1h").text}
      >
        {formatBurn(rates["1h"])}
      </Metric>
      <Metric
        label="Daily pace"
        hint={`Even pace ${formatShare(even)}`}
        tone={pace > even ? WARNING_TEXT : undefined}
      >
        {formatShare(pace)}
      </Metric>
      {exhausted ? (
        <Metric label="Ran out" hint={fromNow(ranOut)} tone="text-destructive">
          {formatDay(ranOut)}
        </Metric>
      ) : (
        <Metric
          label="Runs out"
          hint={
            runsOut === null
              ? `Beyond ${FORECAST_HORIZON_DAYS} days`
              : `${fromNow(runsOut)}, 7d pace`
          }
          tone={runsOut === null ? "text-muted-foreground" : undefined}
        >
          {runsOut === null ? "Holds" : formatDay(runsOut)}
        </Metric>
      )}
    </dl>
  )
}

/** The sheet's compact headline, set like the Hourly Burn one. */
function Headline({ slo, burn }: { slo: Slo; burn: BurnDown }) {
  const { stats } = derive(slo)
  return (
    <div className="flex min-w-0 items-center gap-4">
      <p className="flex shrink-0 items-baseline gap-1.5">
        <span
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            budgetText(stats.remaining)
          )}
        >
          {formatShare(Math.abs(stats.remaining))}
        </span>
        <span className="text-muted-foreground text-sm">
          {stats.remaining <= 0 ? "over budget" : "left"}
        </span>
      </p>
      <p className="text-muted-foreground min-w-0 text-sm text-pretty">
        {sentenceOf(slo, burn, runsOutOf(burn))}
      </p>
    </div>
  )
}

/** What the screen reader hears for the day the keyboard is on. */
function describeRow(row: BudgetRow) {
  const day = formatDay(row.point.day)
  if (row.point.remaining === null)
    return `${day}: forecast ${budgetPhrase(row.value)}`
  const lead = byRank(row.point.events)[0]
  return `${day}: ${budgetPhrase(row.value)}, ${formatShare(row.point.spent)} spent that day${lead ? `, ${lead.title}` : ""}`
}

/** Names only the marks this SLO draws. */
function Legend({ incident, event }: { incident: boolean; event: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 max-sm:hidden">
      <span className="flex items-center gap-1.5">
        <Glyph kind="notch" />
        Even burn
      </span>
      <span className="flex items-center gap-1.5">
        <Glyph kind="ring" />
        Forecast
      </span>
      {incident ? (
        <span className="flex items-center gap-1.5">
          <Glyph kind="incident" />
          Incident
        </span>
      ) : null}
      {event ? (
        <span className="flex items-center gap-1.5">
          <Glyph kind="event" />
          Event
        </span>
      ) : null}
    </div>
  )
}

/** The plot alone, memoised so a hover or a drag never re-renders the Bar. */
const BudgetPlot = memo(function BudgetPlot({
  rows,
  floor,
  dipped,
  overspent,
  thin,
  onActiveKey,
  onPlot,
}: {
  rows: BudgetRow[]
  floor: number
  /** A stem hangs under 0%: the overspend band shows. */
  dipped: boolean
  overspent: boolean
  thin: boolean
  onActiveKey: (key: string | null) => void
  onPlot: (span: PlotSpan | null) => void
}) {
  const overspendId = `bbc-overspend-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  return (
    // Top room: an active 100% halo clears the bubble lane. Side room: half a
    // chip, so the edge chips sit on their stems.
    <BarChart
      accessibilityLayer={false}
      data={rows}
      margin={{ top: 10, right: 12, bottom: 4, left: 12 }}
    >
      <ActiveLabelReporter onChange={onActiveKey} />
      <PlotAreaReporter onChange={onPlot} />
      <defs>
        <linearGradient id={overspendId} x1={0} y1={0} x2={0} y2={1}>
          <stop
            offset={0}
            stopColor="var(--destructive)"
            stopOpacity={overspent ? 0.07 : 0.035}
          />
          <stop offset={1} stopColor="var(--destructive)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="key" hide />
      {/* Every value sits inside the domain: no clip cuts an edge head. */}
      <YAxis hide domain={[floor, 1]} />
      {dipped ? (
        <ReferenceArea
          y1={floor}
          y2={0}
          fill={`url(#${overspendId})`}
          fillOpacity={1}
          strokeOpacity={0}
        />
      ) : null}
      {/* Under the stems: the guides never cross a head. Tags sit at
          the start, where early heads ride near 100%. */}
      <ReferenceLine
        y={WARN_REMAINING}
        stroke="var(--warning)"
        strokeDasharray="4 4"
        zIndex={GUIDE_Z}
        label={
          <LineTag
            value="Warn 25%"
            side="start"
            placement="above"
            tone="warning"
          />
        }
      />
      <ReferenceLine
        y={0}
        stroke="var(--foreground)"
        strokeOpacity={0.22}
        zIndex={GUIDE_Z}
        label={<LineTag value="0%" side="start" placement="above" />}
      />
      {overspent ? (
        <ReferenceLine
          y={0}
          stroke="none"
          zIndex={GUIDE_Z}
          label={
            <LineTag
              value="Over budget"
              side="start"
              placement="below"
              tone="destructive"
            />
          }
        />
      ) : null}
      {/* A drag's range outranks the pointed day upstream, so it keeps tracking. */}
      <ChartTooltip
        cursor={false}
        isAnimationActive={false}
        content={() => null}
      />
      <Bar
        dataKey="value"
        minPointSize={1}
        isAnimationActive={false}
        shape={renderStem({ baseline: 0, head: MARK.head, thin })}
      />
    </BarChart>
  )
})

export function BudgetBurnChart({
  slo,
  variant = "hero",
  onOpenEvents,
}: {
  slo: Slo
  /** Both return a FramePanel and its footer band; hero sets a ribbon of
   *  figures over a full width plot, compact a headline above it. */
  variant?: "hero" | "compact"
  /** Turns the range's event count into a link. */
  onOpenEvents?: (origin: HTMLElement) => void
}) {
  const hero = variant === "hero"
  const motionOn = useMarkMotion()
  const narrow = useNarrow()

  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [plot, setPlot] = useState<PlotSpan | null>(null)
  const [draft, setDraft] = useState<ColumnSpan | null>(null)
  const [selection, setSelection] = useState<ColumnSpan | null>(null)
  const dragRef = useRef<{ anchor: number } | null>(null)
  const dragging = draft !== null

  const burn = useMemo(() => burnDownOf(slo), [slo])
  const { points, nowIndex } = burn
  const rows = useMemo<BudgetRow[]>(
    () =>
      points.slice(1).map((point, index) => {
        const measured = point.remaining !== null
        const value = point.remaining ?? point.forecast ?? 0
        const big = point.events.filter(
          (event) => !event.excluded && eventShareOf(slo, event) >= HALO_SHARE
        )
        const halo = big.some((event) => event.kind === "incident")
          ? "var(--destructive)"
          : big.length
            ? "var(--muted-foreground)"
            : null
        return {
          key: point.key,
          value,
          point,
          stem: {
            value,
            color: budgetColor(value),
            kind: measured ? "measured" : "forecast",
            guide: measured ? point.ideal : null,
            halo,
            // Healthy history stays quiet; today and the warnings keep full colour.
            soft: measured && value >= WARN_REMAINING && index !== nowIndex - 1,
          },
        }
      }),
    [points, slo, nowIndex]
  )
  const count = rows.length
  const nowCol = nowIndex - 1
  const low = Math.min(...rows.map((row) => row.value))
  const measuredLow = Math.min(
    ...rows.slice(0, nowCol + 1).map((row) => row.value)
  )
  // Only measured days are over budget; a forecast dip draws a fainter band.
  const overspent = measuredLow < 0
  // The floor makes room under 0% only when a stem hangs there.
  const floor = low < 0 ? burn.floor : CALM_FLOOR
  const hasIncident = rows.some((row) => row.stem.halo === "var(--destructive)")
  const hasEvent = rows.some(
    (row) => row.stem.halo === "var(--muted-foreground)"
  )

  // A new record (a save, an exclusion, another SLO) drops a stale range.
  const [seenSlo, setSeenSlo] = useState(slo)
  if (seenSlo !== slo) {
    setSeenSlo(slo)
    if (seenSlo.id !== slo.id || seenSlo.windowDays !== slo.windowDays)
      setSelection(null)
  }

  // A pointer drag leaves focus where it was, so Escape cancels it page-wide.
  useEffect(() => {
    if (!dragging) return
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return
      dragRef.current = null
      setDraft(null)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [dragging])

  const keys = useColumnKeys(count, nowCol)
  const keyIndex = keys.keyIndex
  const hoverIndex =
    activeKey === null ? -1 : rows.findIndex((row) => row.key === activeKey)
  // Keys win until the pointer moves again.
  const pointed = keyIndex ?? (hoverIndex >= 0 ? hoverIndex : null)
  const activeIndex = pointed ?? nowCol
  const focus = draft ?? selection
  const tight = plot ? (hero ? narrow : plot.width < 400) : false
  // Dense columns thin the stems, so the heads carry the curve.
  const thin = plot ? plot.width / count < 20 : false

  // Weekly back from today, the forecast's last day, event days, today
  // and the active column; the planner drops what crowds a higher rank.
  const chips = useMemo(() => {
    if (!plot) return []
    const step = slo.windowDays <= 7 ? (tight ? 2 : 1) : tight ? 14 : 7
    const label = (index: number) => dayNumber(rows[index].point.day)
    const candidates: ChipSpec[] = []
    for (let index = nowCol; index >= 0; index -= step)
      candidates.push({ index, label: label(index), kind: "plain" })
    if (count - 1 > nowCol)
      candidates.push({
        index: count - 1,
        label: label(count - 1),
        kind: "forecast",
      })
    rows.forEach((row, index) => {
      if (index <= nowCol && row.stem.halo)
        candidates.push({
          index,
          label: label(index),
          kind: row.stem.halo === "var(--destructive)" ? "incident" : "event",
        })
    })
    candidates.push({
      index: nowCol,
      label: label(nowCol),
      kind: activeIndex === nowCol && !focus ? "active" : "today",
    })
    const ends = focus ? [focus.first, focus.last] : [activeIndex]
    for (const index of ends)
      candidates.push({ index, label: label(index), kind: "active" })
    const dayOf = (index: number) => rows[index].point.day
    return planChips(
      withMonths(planChips(candidates, plot, count), dayOf),
      plot,
      count
    )
  }, [plot, tight, slo.windowDays, rows, nowCol, count, activeIndex, focus])

  function indexAt(event: PointerEvent<HTMLDivElement>) {
    if (!plot || plot.width <= 0) return -1
    const offset =
      event.clientX - event.currentTarget.getBoundingClientRect().left - plot.x
    const index = Math.floor((offset / plot.width) * count)
    // Ranges cover measured days only.
    return Math.min(nowCol, Math.max(0, index))
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (keyIndex !== null) keys.clear()
    if (event.button !== 0) return
    const index = indexAt(event)
    if (index < 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { anchor: index }
    setDraft(spanOf(index, index))
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (keyIndex !== null) keys.clear()
    const drag = dragRef.current
    const index = drag ? indexAt(event) : -1
    if (!drag || index < 0) return
    setDraft((current) =>
      current &&
      current.first === Math.min(drag.anchor, index) &&
      current.last === Math.max(drag.anchor, index)
        ? current
        : spanOf(drag.anchor, index)
    )
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const index = drag ? indexAt(event) : -1
    cancelDrag()
    if (!drag || index < 0) return
    const next = spanOf(drag.anchor, index)
    // A repeat click on the one selected day clears it.
    const same = selection?.first === next.first && selection.last === next.last
    setSelection(same && next.first === next.last ? null : next)
  }

  function cancelDrag() {
    dragRef.current = null
    setDraft(null)
  }

  // The chart owns its keys: arrows walk from today, Enter selects a day.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && selection && !dragging) {
      event.preventDefault()
      setSelection(null)
      return
    }
    if (event.key === "Enter" || event.key === " ") {
      const day = keyIndex ?? nowCol
      if (day > nowCol) return
      event.preventDefault()
      if (event.shiftKey && selection) {
        setSelection(
          spanOf(Math.min(selection.first, day), Math.max(selection.last, day))
        )
      } else {
        const same = selection?.first === day && selection.last === day
        setSelection(same ? null : spanOf(day, day))
      }
      return
    }
    keys.onKeyDown(event)
  }

  // ── Bubble and readout ──

  let bubble: ReactNode
  let readout: ReactNode = <span>Drag across days to sum spend</span>
  if (focus) {
    const days = rows.slice(focus.first, focus.last + 1)
    const spent = days.reduce((sum, row) => sum + row.point.spent, 0)
    const events = days.flatMap((row) => row.point.events).length
    const first = formatDay(rows[focus.first].point.day)
    const last = formatDay(rows[focus.last].point.day)
    bubble = (
      <BubbleText
        value={`${formatShare(spent)} spent`}
        meta={[plural(days.length, "day")]}
      />
    )
    readout = (
      <>
        <span className="text-foreground shrink-0 font-medium">
          {formatShare(spent)} spent
        </span>
        <span className="truncate">
          {focus.first === focus.last ? `on ${first}` : `${first} to ${last}`}
        </span>
        <DotSeparator />
        {events === 0 ? (
          <span className="shrink-0">No events</span>
        ) : onOpenEvents && !draft ? (
          <TextLink
            className="shrink-0"
            onClick={(event) => onOpenEvents(event.currentTarget)}
          >
            {plural(events, "event")}
          </TextLink>
        ) : (
          <span className="shrink-0">{plural(events, "event")}</span>
        )}
        {selection && !draft ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear range"
            onClick={() => setSelection(null)}
          >
            {UI_ICONS.close}
          </Button>
        ) : null}
      </>
    )
  } else {
    const row = rows[activeIndex]
    const forecast = row.point.remaining === null
    const lead = byRank(row.point.events)[0]
    bubble = (
      <BubbleText
        value={`${formatShare(Math.abs(row.value))} ${row.value > 0 ? "left" : "over"}`}
        meta={[
          activeIndex === nowCol ? "Today" : formatDay(row.point.day),
          lead?.id,
          forecast ? "Forecast" : null,
        ]}
      />
    )
    if (pointed !== null) {
      readout = (
        <>
          <span className="text-foreground shrink-0 font-medium">
            {formatDay(row.point.day)}
          </span>
          <DotSeparator />
          <span className="shrink-0">
            {forecast
              ? `Forecast ${budgetPhrase(row.value)}`
              : `${formatShare(row.point.spent)} spent`}
          </span>
          {lead ? (
            <>
              <DotSeparator />
              <span className="truncate">{lead.title}</span>
            </>
          ) : null}
        </>
      )
    }
  }

  const { stats } = derive(slo)
  const chartLabel = `${slo.name} error budget, last ${slo.windowDays} days: ${budgetPhrase(stats.remaining)}. Arrow keys move, Enter selects a day, Shift+Enter extends, Escape clears.`

  const plotColumn = (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        hero && "flex-1 px-(--frame-panel-px) py-(--frame-panel-py)"
      )}
    >
      <motion.div
        key={slo.id}
        initial={motionOn ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        className={cn(
          "flex min-w-0 cursor-crosshair touch-pan-y flex-col select-none",
          hero && "min-h-0 flex-1"
        )}
      >
        <LollipopFrame
          plot={plot}
          count={count}
          focus={focus ?? { first: activeIndex, last: activeIndex }}
          bubble={bubble}
          chips={chips}
          beads={tight ? (index) => (nowCol - index) % 2 === 0 : undefined}
          pillWidth={hero ? 28 : 26}
          className={hero ? "min-h-60 flex-1 sm:min-h-64" : "h-60"}
        >
          <LitColumns active={focus ? null : activeIndex} range={focus}>
            <ChartContainer
              config={CHART_CONFIG}
              role="group"
              aria-label={chartLabel}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onBlur={keys.clear}
              {...keysAttr(keyIndex)}
              // Heads and halos at the plot edge draw past the svg box.
              className={cn(
                "absolute inset-0 aspect-auto h-auto min-w-0 [&_.recharts-surface]:overflow-visible",
                CHART_FOCUS
              )}
              initialDimension={{ width: 640, height: 280 }}
            >
              <BudgetPlot
                rows={rows}
                floor={floor}
                dipped={low < 0}
                overspent={overspent}
                thin={thin}
                onActiveKey={setActiveKey}
                onPlot={setPlot}
              />
            </ChartContainer>
          </LitColumns>
        </LollipopFrame>
      </motion.div>
    </div>
  )

  // Keyed days speak; a passing pointer stays silent.
  const liveDay = (
    <p aria-live="polite" className="sr-only">
      {keyIndex !== null ? describeRow(rows[keyIndex]) : ""}
    </p>
  )
  // Only a range sum speaks here; keyed days speak through liveDay.
  const readoutBand = (
    <div
      aria-live={focus ? "polite" : "off"}
      aria-busy={dragging}
      className="flex min-w-0 items-center gap-1.5 sm:ms-auto"
    >
      {readout}
    </div>
  )

  if (!hero) {
    return (
      <>
        <FramePanel className="flex flex-col gap-4">
          <Headline slo={slo} burn={burn} />
          {plotColumn}
          {liveDay}
        </FramePanel>
        {/* The readout takes the band while it speaks, so it never wraps. */}
        <SectionFoot>
          {focus === null && pointed === null ? (
            <Legend incident={hasIncident} event={hasEvent} />
          ) : null}
          {readoutBand}
        </SectionFoot>
      </>
    )
  }
  // Figures across the top, the plot full width under them.
  return (
    <>
      <FramePanel className="flex flex-col p-0">
        <BudgetRibbon slo={slo} burn={burn} />
        {plotColumn}
        {liveDay}
      </FramePanel>
      <SectionFoot>
        <Legend incident={hasIncident} event={hasEvent} />
        {readoutBand}
      </SectionFoot>
    </>
  )
}