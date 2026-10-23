import { memo, useMemo, useState } from "react"
import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import { motion } from "motion/react"
import { Bar, BarChart, ReferenceLine, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"

import { burnTone, BurnTrack } from "./burn-gauge"
import {
  ActiveLabelReporter,
  PlotAreaReporter,
  type PlotSpan,
} from "./chart-defs"
import {
  ALERT_CHANNEL,
  formatBurn,
  formatClock,
  formatDay,
  formatFactor,
  formatShare,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import {
  BubbleText,
  CHART_FOCUS,
  Glyph,
  GUIDE_Z,
  keysAttr,
  LineTag,
  LitColumns,
  LollipopFrame,
  planChips,
  renderStem,
  toLog,
  useColumnKeys,
  useMarkMotion,
  withMonths,
  type ChipSpec,
  type StemRow,
} from "./lollipop"
import { SectionFoot, SectionFrame, SectionHead } from "./section-lead"
import {
  DAY_MS,
  derive,
  FAST_RULE,
  HOUR_MS,
  ruleSpendOf,
  SLOW_RULE,
  type BurnWindow,
  type HourPoint,
} from "./slo-math"
import { AlertFace, DotSeparator } from "./value-faces"

const CHART_CONFIG = {
  value: { label: "Burn Rate" },
} satisfies ChartConfig

const WINDOWS: { window: BurnWindow; label: string }[] = [
  { window: "5m", label: "5 minutes" },
  { window: "30m", label: "30 minutes" },
  { window: "1h", label: "1 hour" },
  { window: "6h", label: "6 hours" },
  { window: "3d", label: "3 days" },
]
/** Rail ticks mark the quarter days between the midnight chips. */
const BEAD_HOURS = [6, 12, 18]

type HourRow = StemRow & { at: number; raw: number }

/** Spend too small for one decimal reads as under it, never as 0%. */
const formatSpend = (value: number) =>
  value > 0 && value < 0.0005 ? "<0.1%" : formatShare(value)

const hourOf = (ms: number) => Math.floor((ms % DAY_MS) / HOUR_MS)

const HOUR_STEM = renderStem({ baseline: 0, head: 3 })

/** The plain-language line beside the last hour's figure. */
function sentenceOf(hours: HourPoint[], peak: HourPoint) {
  const last = hours[hours.length - 1]
  if (last.burn >= FAST_RULE.factor) {
    let start = hours.length - 1
    while (start > 0 && hours[start - 1].burn >= FAST_RULE.factor) start -= 1
    // An hour point closes its bucket, so the streak began an hour earlier.
    return `Over the page line since ${formatClock(hours[start].at - HOUR_MS)}.`
  }
  if (last.burn >= SLOW_RULE.factor)
    return `Burning ${formatBurn(last.burn)} faster than even pace.`
  return `Under even pace, peak ${formatBurn(peak.burn)} on ${formatDay(peak.at)}.`
}

/** The plot alone, memoised so a hover never re-renders the Bar. */
const HourlyPlot = memo(function HourlyPlot({
  rows,
  ceiling,
  pageShown,
  onActiveKey,
  onPlot,
}: {
  rows: HourRow[]
  ceiling: number
  pageShown: boolean
  onActiveKey: (key: string | null) => void
  onPlot: (span: PlotSpan | null) => void
}) {
  return (
    // Side room: half a chip, so the edge chips sit on their stems.
    <BarChart
      accessibilityLayer={false}
      data={rows}
      margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
    >
      <ActiveLabelReporter onChange={onActiveKey} />
      <PlotAreaReporter onChange={onPlot} />
      <XAxis dataKey="key" hide />
      {/* Room under the pace line for the active halo, no more. */}
      <YAxis hide domain={[-ceiling / 9, ceiling]} />
      {/* Under the stems; their tags ride the label layer. */}
      {pageShown ? (
        <ReferenceLine
          y={toLog(FAST_RULE.factor)}
          stroke="var(--destructive)"
          strokeOpacity={0.6}
          strokeDasharray="4 4"
          zIndex={GUIDE_Z}
          label={
            <LineTag
              value={`Page ${formatFactor(FAST_RULE.factor)}`}
              side="start"
              placement="above"
              tone="destructive"
            />
          }
        />
      ) : null}
      <ReferenceLine
        y={0}
        stroke="var(--foreground)"
        strokeOpacity={0.2}
        zIndex={GUIDE_Z}
        label={
          <LineTag
            value={`Pace ${formatFactor(SLOW_RULE.factor)}`}
            side="start"
            placement="above"
          />
        }
      />
      <ChartTooltip
        cursor={false}
        isAnimationActive={false}
        content={() => null}
      />
      <Bar
        dataKey="value"
        minPointSize={1}
        isAnimationActive={false}
        shape={HOUR_STEM}
      />
    </BarChart>
  )
})

/** Only the lines that judge hourly data: 6× is judged on 6h, so it is not
 *  drawn here. Returns the panel and its footer band for a SectionFrame. */
function HourlyBurnChart({ slo }: { slo: Slo }) {
  const motionOn = useMarkMotion()
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [plot, setPlot] = useState<PlotSpan | null>(null)

  const { hours } = derive(slo)
  // One identity per record: new rows would re-render the Bar on every hover.
  const rows = useMemo(
    () =>
      hours.map((point): HourRow => {
        const fast = point.burn >= SLOW_RULE.factor
        // Under-pace hours ride the pace line as beads; the bubble keeps the rate.
        const value = fast ? toLog(point.burn) : 0
        return {
          key: String(point.at),
          value,
          at: point.at,
          raw: point.burn,
          stem: {
            value,
            color: burnTone(point.burn, "1h").stroke,
            kind: fast ? "measured" : "quiet",
          },
        }
      }),
    [hours]
  )
  const peak = hours.reduce((top, point) =>
    point.burn > top.burn ? point : top
  )
  const lastIndex = rows.length - 1
  const last = rows[lastIndex]
  const over = hours.filter((point) => point.burn >= FAST_RULE.factor).length
  // A calm SLO spends the height on what it burned; a hot one keeps the page line.
  const ceiling =
    peak.burn >= FAST_RULE.factor * 0.6
      ? Math.max(toLog(30), toLog(peak.burn * 1.6))
      : Math.max(toLog(3), toLog(peak.burn * 1.6))
  const pageShown = toLog(FAST_RULE.factor) <= ceiling

  const keys = useColumnKeys(rows.length, lastIndex)
  const hoverIndex =
    activeKey === null ? -1 : rows.findIndex((row) => row.key === activeKey)
  const pointed = keys.keyIndex ?? (hoverIndex >= 0 ? hoverIndex : null)
  const activeIndex = pointed ?? lastIndex
  const active = rows[activeIndex]
  const isNow = activeIndex === lastIndex

  const chips = (() => {
    if (!plot) return []
    const candidates: ChipSpec[] = []
    rows.forEach((row, index) => {
      if (hourOf(row.at) === 0)
        candidates.push({
          index,
          label: String(new Date(row.at).getUTCDate()),
          kind: "plain",
        })
    })
    candidates.push(
      isNow
        ? { index: activeIndex, label: "", kind: "live" }
        : { index: activeIndex, label: formatClock(active.at), kind: "active" }
    )
    const dayOf = (index: number) => rows[index].at
    return planChips(
      withMonths(planChips(candidates, plot, rows.length), dayOf),
      plot,
      rows.length
    )
  })()

  return (
    <>
      <FramePanel className="flex flex-col gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <p className="flex shrink-0 items-baseline gap-1.5">
            <span
              className={cn(
                "text-3xl font-semibold tracking-tight tabular-nums",
                burnTone(last.raw, "1h").text
              )}
            >
              {formatBurn(last.raw)}
            </span>
            <span className="text-muted-foreground text-sm">last hour</span>
          </p>
          <p className="text-muted-foreground min-w-0 text-sm text-pretty">
            {sentenceOf(hours, peak)}
          </p>
        </div>
        <motion.div
          key={slo.id}
          initial={motionOn ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onPointerMove={() => {
            if (keys.keyIndex !== null) keys.clear()
          }}
          className="min-w-0"
        >
          <LollipopFrame
            plot={plot}
            count={rows.length}
            focus={{ first: activeIndex, last: activeIndex }}
            bubble={
              <BubbleText
                value={formatBurn(active.raw)}
                meta={[
                  isNow ? "Now" : formatClock(active.at),
                  isNow ? null : formatDay(active.at),
                ]}
              />
            }
            chips={chips}
            beads={(index) => BEAD_HOURS.includes(hourOf(rows[index].at))}
            pillWidth={28}
            className="h-60"
          >
            <LitColumns active={activeIndex}>
              <ChartContainer
                config={CHART_CONFIG}
                role="group"
                aria-label={`${slo.name} burn rate by hour, last 3 days: peak ${formatBurn(peak.burn)}, ${over} ${over === 1 ? "hour" : "hours"} over the ${formatFactor(FAST_RULE.factor)} page line. Arrow keys move by hour.`}
                tabIndex={0}
                onKeyDown={keys.onKeyDown}
                onBlur={keys.clear}
                {...keysAttr(keys.keyIndex)}
                // Heads and halos at the plot edge draw past the svg box.
                className={cn(
                  "absolute inset-0 aspect-auto h-auto min-w-0 [&_.recharts-surface]:overflow-visible",
                  CHART_FOCUS
                )}
                initialDimension={{ width: 500, height: 176 }}
              >
                <HourlyPlot
                  rows={rows}
                  ceiling={ceiling}
                  pageShown={pageShown}
                  onActiveKey={setActiveKey}
                  onPlot={setPlot}
                />
              </ChartContainer>
            </LitColumns>
          </LollipopFrame>
        </motion.div>
        {/* Keyed hours speak; a passing pointer stays silent. */}
        <p aria-live="polite" className="sr-only">
          {keys.keyIndex !== null
            ? `${formatDay(active.at)}, ${formatClock(active.at)}: ${formatBurn(active.raw)}, ${formatSpend(active.raw / (slo.windowDays * 24))} of budget`
            : ""}
        </p>
      </FramePanel>
      <SectionFoot>
        <div
          aria-hidden="true"
          className="flex items-center gap-4 max-sm:hidden"
        >
          <span className="flex items-center gap-1.5">
            <Glyph kind="dash" color="var(--destructive)" />
            {pageShown ? "Page" : "Page off scale"}
          </span>
          <span className="flex items-center gap-1.5">
            <Glyph kind="line" />
            Pace
          </span>
          <span className="flex items-center gap-1.5">
            <Glyph kind="dot" />
            Under pace
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 sm:ms-auto">
          <span className="text-foreground shrink-0 font-medium">
            {formatDay(active.at)}, {formatClock(active.at)}
          </span>
          <DotSeparator />
          <span className="truncate">
            {formatSpend(active.raw / (slo.windowDays * 24))} of budget
          </span>
        </div>
      </SectionFoot>
    </>
  )
}

export function SloBurnTab({ slo }: { slo: Slo }) {
  const { rates, rules, breach } = derive(slo)

  return (
    <>
      <SectionFrame>
        <SectionHead
          icon={UI_ICONS.activity}
          title="Hourly Burn"
          description="Last 72 hours, log scale"
          badges={
            breach ? <AlertFace level={breach} muted={!slo.alerting} /> : null
          }
        />
        <HourlyBurnChart slo={slo} />
      </SectionFrame>

      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-muted-foreground text-xs font-medium">Windows</h3>
        <ul className="flex flex-col gap-2.5">
          {WINDOWS.map((item) => (
            <li
              key={item.window}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <BurnTrack
                burn={rates[item.window]}
                window={item.window}
                label={item.label}
              />
              <span
                className={cn(
                  "text-right font-medium tabular-nums",
                  burnTone(rates[item.window], item.window).text
                )}
              >
                {formatBurn(rates[item.window])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex min-w-0 flex-col gap-3">
        <h3 className="text-muted-foreground text-xs font-medium">
          Alert Rules
        </h3>
        <ItemGroup className="gap-2">
          {rules.map((state) => {
            const enabled =
              slo.alerting &&
              (state.rule.level === "page"
                ? slo.pageOnFastBurn
                : slo.ticketOnSlowBurn)
            return (
              <Item key={state.rule.id} size="sm" variant="outline">
                <ItemContent className="min-w-0">
                  <ItemTitle className="max-w-full min-w-0">
                    <span className="min-w-0 truncate">{state.rule.label}</span>
                    <Badge variant="outline">
                      {state.rule.level === "page" ? "Page" : "Ticket"}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription className="flex min-w-0 items-center gap-1.5 tabular-nums">
                    <span className="truncate">
                      {state.rule.long} {formatBurn(state.long)} and{" "}
                      {state.rule.short} {formatBurn(state.short)} vs{" "}
                      {state.rule.factor}×
                    </span>
                    <DotSeparator className="max-sm:hidden" />
                    <span className="shrink-0 max-sm:hidden">
                      spends {formatShare(ruleSpendOf(slo, state.rule))} in{" "}
                      {state.rule.longLabel}
                    </span>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {state.firing ? (
                    <Badge variant="destructive-light">Firing</Badge>
                  ) : state.breached ? (
                    <Badge variant="warning-light">
                      {enabled ? "Breached" : "Silenced"}
                    </Badge>
                  ) : (
                    <Badge variant="success-light">Clear</Badge>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
        <p className="text-muted-foreground text-xs">
          A rule fires when both windows sit over its line, and notifies{" "}
          {ALERT_CHANNEL}.
        </p>
      </section>
    </>
  )
}