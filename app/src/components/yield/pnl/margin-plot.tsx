"use client"

import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type Ref,
} from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  DefaultZIndexes,
  XAxis,
  YAxis,
  ZIndexLayer,
} from "recharts"

import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import { captureMorph, type Morph } from "./bar-capture"
import { fadeInLayers } from "./bar-morph"
import { CHART_CONFIG, type Period } from "./data"
import { formatAxis } from "./format"
import { MarginLane } from "./margin-lane"
import { PERIOD_CARD } from "./period-card"
import { Hatch, SHAPES } from "./plot-bars"
import { ColumnBands, ForecastRule, MorphLayer, ReadSync } from "./plot-layers"
import { PLOT_STYLE } from "./plot-reveal"
import {
  AXIS_WIDTH,
  BAR_GAP,
  MARGIN,
  MAX_BAR_SIZE,
  moneyAxis,
  PlotContext,
  useRevealClock,
} from "./plot-scope"

export type PlotHandle = {
  /** Called before the rows change, so the new layout morphs from this one. */
  regroup: (next: Period[]) => void
}

export function MarginPlot({
  rows,
  target,
  targetMargin,
  targetLabel,
  money,
  label,
  ref,
}: {
  rows: Period[]
  target: boolean
  targetMargin: number | null
  targetLabel: string
  money: (value: number) => string
  label: string
  ref?: Ref<PlotHandle>
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const host = useRef<HTMLDivElement>(null)
  const layer = useRef<SVGGElement>(null)
  const morph = useRef<Morph | null>(null)
  const joinReveal = useRevealClock(host)

  useImperativeHandle(
    ref,
    () => ({
      regroup(next) {
        const svg = layer.current?.ownerSVGElement
        // Frozen demo guard: a frozen demo regroups without motion.
        if (!svg || !layer.current) return
        if (document.documentElement.dataset.demo === "frozen") return
        morph.current = captureMorph(svg, layer.current, next)
      },
    }),
    []
  )

  // The new margin lane and axis labels fade in under the outgoing copies.
  useLayoutEffect(() => {
    if (host.current) fadeInLayers(host.current, morph.current)
  }, [rows])

  const scope = useMemo(
    () => ({ rows, id, target, targetMargin, targetLabel, money, joinReveal, host, layer, morph }),
    [rows, id, target, targetMargin, targetLabel, money, joinReveal]
  )
  const axis = moneyAxis(rows)

  return (
    <>
      <style>{PLOT_STYLE}</style>
      {/* A click focuses Recharts' layer group; only keyboard focus rings. */}
      <ChartContainer
        ref={host}
        config={CHART_CONFIG}
        role="group"
        aria-label={label}
        className="group/c36 has-[:focus-visible]:ring-ring/50 aspect-auto h-72 w-full min-w-0 has-[:focus-visible]:ring-[3px] [&_[class*=recharts-zIndex-layer]]:outline-hidden"
      >
        <PlotContext.Provider value={scope}>
          <ComposedChart
            accessibilityLayer
            data={rows}
            barGap={BAR_GAP}
            barCategoryGap="26%"
            margin={MARGIN}
          >
            <defs>
              <Hatch id={id} series="revenue" />
              <Hatch id={id} series="expenses" />
            </defs>
            <ReadSync />
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              syncWithTicks
            />
            <XAxis
              dataKey="key"
              interval="equidistantPreserveStart"
              minTickGap={6}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              ticks={axis.ticks}
              domain={axis.domain}
              allowDataOverflow
              tickFormatter={formatAxis}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={AXIS_WIDTH}
            />
            <ZIndexLayer zIndex={DefaultZIndexes.cursorRectangle}>
              <ColumnBands />
            </ZIndexLayer>
            <ChartTooltip
              cursor={false}
              isAnimationActive={false}
              content={PERIOD_CARD}
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              maxBarSize={MAX_BAR_SIZE}
              isAnimationActive={false}
              shape={SHAPES.revenue}
            />
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              maxBarSize={MAX_BAR_SIZE}
              isAnimationActive={false}
              shape={SHAPES.expenses}
            />
            <ZIndexLayer zIndex={DefaultZIndexes.line}>
              <ForecastRule />
              <MarginLane />
            </ZIndexLayer>
            <ZIndexLayer zIndex={DefaultZIndexes.activeBar}>
              <MorphLayer />
            </ZIndexLayer>
          </ComposedChart>
        </PlotContext.Provider>
      </ChartContainer>
    </>
  )
}
