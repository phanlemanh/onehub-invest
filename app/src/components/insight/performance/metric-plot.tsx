import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react"
import { cn } from "cn"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  DefaultZIndexes,
  XAxis,
  YAxis,
  ZIndexLayer,
} from "recharts"

import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import { chartConfigOf, type MetricSpec, type ViewState } from "./data"
import { formatMonth, type Formatters } from "./format"
import { Annotations, AverageRule, renderEndMark } from "./plot-marks"
import {
  AXIS_FADE_MS,
  AXIS_WIDTH,
  COLOR_TWEEN,
  EASE_OUT,
  MARGIN,
  monthTicks,
  PlotContext,
  SERIES_MOTION,
  useStillSeries,
  valueTicks,
} from "./plot-scope"
import { Readout } from "./readout"
import { averageOf, type PlotRow } from "./series"

export function MetricPlot({
  rows,
  metric,
  view,
  label,
  format,
}: {
  rows: PlotRow[]
  metric: MetricSpec
  view: ViewState
  label: string
  format: Formatters
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const still = useStillSeries()
  const plotRef = useRef<HTMLDivElement>(null)
  const average = averageOf(rows)
  const scope = useMemo(
    () => ({ rows, metric, average, format }),
    [rows, metric, average, format]
  )
  // Axis inputs keep their identity between switches: Recharts compares them
  // by reference and restarts the series tween on any new one.
  const ticks = useMemo(
    () =>
      valueTicks(Math.max(0, ...rows.map((row) => row.current))),
    [rows]
  )
  const xTicks = useMemo(() => monthTicks(rows), [rows])
  // New axis figures fade in while the series glide; the grid joins them
  // only when its lines move.
  const shownTicks = useRef({ y: ticks.join(), x: xTicks.join() })
  useLayoutEffect(() => {
    const shown = shownTicks.current
    const next = { y: ticks.join(), x: xTicks.join() }
    shownTicks.current = next
    // Frozen demo guard: ?demo=frozen pins the demo, so nothing animates.
    if (still || document.documentElement.dataset.demo === "frozen") return
    const fadeIn = (selector: string) =>
      plotRef.current?.querySelectorAll(selector).forEach((node) =>
        node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: AXIS_FADE_MS,
          easing: EASE_OUT,
        })
      )
    if (shown.y !== next.y) {
      fadeIn(".recharts-yAxis .recharts-cartesian-axis-tick-labels")
    }
    if (shown.y.split(",").length !== ticks.length) {
      fadeIn(".recharts-cartesian-grid-horizontal")
    }
    if (shown.x !== next.x) {
      fadeIn(".recharts-xAxis .recharts-cartesian-axis-tick-labels")
    }
  }, [ticks, xTicks, still])
  const formatTick = useCallback(
    (value: number) => format.axis(metric.key, value),
    [format, metric.key]
  )
  const config = useMemo(() => chartConfigOf(metric), [metric])

  return (
    <div
      ref={plotRef}
      data-annotations={view.annotations ? "on" : "off"}
      data-average={view.average ? "on" : "off"}
      data-grid={view.grid ? "on" : "off"}
      className="group/c6 w-full min-w-0 [&_.recharts-cartesian-grid]:transition-opacity [&_.recharts-cartesian-grid]:duration-200 data-[grid=off]:[&_.recharts-cartesian-grid]:opacity-0"
    >
      <PlotContext.Provider value={scope}>
        {/* A click focuses Recharts' layer group; only keyboard focus
            rings. */}
        <ChartContainer
          config={config}
          role="group"
          aria-label={label}
          className="has-[:focus-visible]:ring-ring/50 aspect-auto h-72 w-full min-w-0 has-[:focus-visible]:ring-[3px] [&_[class*=recharts-zIndex-layer]]:outline-hidden"
          initialDimension={{ width: 820, height: 288 }}
        >
          <ComposedChart accessibilityLayer data={rows} margin={MARGIN}>
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-current)"
                  className={COLOR_TWEEN}
                  stopOpacity={0.22}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-current)"
                  className={COLOR_TWEEN}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              ticks={xTicks}
              interval={0}
              tickFormatter={formatMonth}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              ticks={ticks}
              domain={[0, ticks[ticks.length - 1]]}
              tickFormatter={formatTick}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={AXIS_WIDTH}
            />
            <ZIndexLayer zIndex={DefaultZIndexes.area - 10}>
              <Annotations />
            </ZIndexLayer>
            <ZIndexLayer zIndex={DefaultZIndexes.line + 10}>
              <AverageRule />
            </ZIndexLayer>
            <ChartTooltip
              isAnimationActive={false}
              payloadUniqBy={ONE_READOUT}
              content={<Readout />}
            />
            {/* The curve and its end mark paint in currentColor: Recharts
                remounts them for every tween, so the colour eases here. */}
            <Area
              dataKey="current"
              type="monotone"
              stroke="currentColor"
              strokeWidth={2}
              fill={`url(#${id}-fill)`}
              dot={renderEndMark}
              activeDot={CURRENT_DOT}
              isAnimationActive={!still}
              {...SERIES_MOTION}
              className={cn("text-(--color-current)", COLOR_TWEEN)}
            />
          </ComposedChart>
        </ChartContainer>
      </PlotContext.Provider>
    </div>
  )
}

/** One readout per month, however many series the pointer crosses. */
const ONE_READOUT = () => "day"

const CURRENT_DOT = {
  r: 4,
  fill: "var(--color-current)",
  stroke: "var(--card)",
  strokeWidth: 2,
}
