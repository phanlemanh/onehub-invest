import { useContext, useLayoutEffect } from "react"
import {
  Rectangle,
  useActiveTooltipLabel,
  usePlotArea,
  useXAxisScale,
} from "recharts"

import { BAR_SHARE, HOVER_FADE, LANE, PlotContext, useRevealRef } from "./plot-scope"

/** Marks the read column's bars, band and dot lit, so a hover re-renders
 *  this alone and restyles only the columns it leaves and enters. */
export function ReadSync() {
  const label = useActiveTooltipLabel()
  const scope = useContext(PlotContext)
  const index =
    scope && label !== undefined
      ? scope.rows.findIndex((row) => row.key === `${label}`)
      : -1
  useLayoutEffect(() => {
    const host = scope?.host.current
    if (!host) return
    if (index < 0) {
      host.removeAttribute("data-chart-36-reading")
      return
    }
    host.setAttribute("data-chart-36-reading", "")
    const lit = host.querySelectorAll(
      `[data-chart-36-col="${index}"], [data-chart-36-band="${index}"], [data-chart-36-dot="${index}"]`
    )
    for (const node of lit) node.setAttribute("data-chart-36-lit", "")
    return () => {
      for (const node of lit) node.removeAttribute("data-chart-36-lit")
    }
  }, [scope, index])
  return null
}


/** A band behind every column, lit by the plot sheet while it is read;
 *  each keeps its own, so moving between columns crossfades. */
export function ColumnBands() {
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const rows = useContext(PlotContext)?.rows ?? []
  if (!plot || !xScale || rows.length === 0) return null
  const band = plot.width / rows.length
  return (
    <g aria-hidden="true" className="pointer-events-none">
      {rows.map((row, index) => {
        const middle = xScale(row.key, { position: "middle" })
        if (middle === undefined) return null
        return (
          <g key={row.key} data-chart-36-band={index} className={HOVER_FADE}>
            <Rectangle
              x={middle - band / 2}
              y={plot.y}
              width={band}
              height={plot.height}
              radius={4}
              className="fill-muted"
            />
          </g>
        )
      })}
    </g>
  )
}

/** Holds the old layer's fading copies during a regroup, above the plot. */
export function MorphLayer() {
  const layer = useContext(PlotContext)?.layer
  return <g ref={layer} aria-hidden="true" className="pointer-events-none" />
}

/** Where the books close: a rule between the last closed column and the
 *  first forecast one, named in the gap between the bars and the lane. */
export function ForecastRule() {
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const fadeRef = useRevealRef()
  const rows = useContext(PlotContext)?.rows ?? []
  const first = rows.findIndex((row) => row.forecast)
  if (!plot || !xScale || first <= 0) return null
  const middle = xScale(rows[first].key, { position: "middle" })
  if (middle === undefined) return null
  const x = middle - plot.width / rows.length / 2
  const top = plot.y + plot.height * (1 - (BAR_SHARE + LANE[0]) / 2)
  return (
    <g
      ref={fadeRef}
      data-chart-36-fade=""
      aria-hidden="true"
      className="pointer-events-none"
    >
      <line
        x1={x}
        x2={x}
        y1={top - 6}
        y2={plot.y + plot.height}
        stroke="var(--muted-foreground)"
        strokeOpacity={0.4}
        strokeDasharray="2 3"
      />
      <text
        x={x + 6}
        y={top}
        dy="0.35em"
        className="fill-muted-foreground text-xs"
      >
        Forecast
      </text>
    </g>
  )
}
