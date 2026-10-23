import { useContext } from "react"
import { cn } from "cn"
import { Curve, usePlotArea, useXAxisScale } from "recharts"

import { HaloText } from "@/components/charts/halo-text"

import { formatPercent } from "./format"
import { AXIS_LABEL_INSET, LANE, PlotContext, useRevealRef } from "./plot-scope"

/** Operating margin in a lane above the bars: solid through the closed
 *  months, dashed with open dots through the forecast. */
export function MarginLane() {
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const revealRef = useRevealRef()
  const scope = useContext(PlotContext)
  if (!plot || !xScale || !scope || scope.rows.length === 0) return null
  // The target stays in the domain, so toggling it never moves the line.
  const target = scope.targetMargin
  const values = [
    ...scope.rows.map((row) => row.margin),
    ...(target === null ? [] : [target]),
  ]
  // Khoảng tối thiểu 20 điểm %: ước tính chia đều theo số đêm nên biên chỉ lệch
  // 1–2 điểm giữa các tháng; co làn theo đúng khoảng đó sẽ phóng đại thành sóng.
  const MIN_SPAN = 0.2
  const rawLow = Math.min(...values)
  const rawHigh = Math.max(...values)
  const pad = Math.max(0, MIN_SPAN - (rawHigh - rawLow)) / 2
  const low = rawLow - pad
  const span = Math.max(rawHigh - rawLow, MIN_SPAN)
  const yOf = (margin: number) =>
    plot.y +
    plot.height * (1 - LANE[0] - ((margin - low) / span) * (LANE[1] - LANE[0]))
  const points = scope.rows.flatMap((row) => {
    const x = xScale(row.key, { position: "middle" })
    return x === undefined ? [] : [{ x, y: yOf(row.margin), row }]
  })
  const closed = points.filter((point) => !point.row.forecast)
  // The forecast leg starts on the last close, so the two lines meet.
  const projected = points.slice(Math.max(0, closed.length - 1))
  const last = closed.at(-1)
  const targetY = target === null ? null : yOf(target)
  const right = plot.x + plot.width
  // 10% steps on a wide lane, 5% on a narrow one, so one always lands.
  const step = span >= 0.15 ? 0.1 : 0.05
  const ticks: number[] = []
  for (let k = Math.ceil(low / step); k * step <= low + span; k += 1)
    ticks.push(k * step)
  return (
    <g data-chart-36-lane="" aria-hidden="true" className="pointer-events-none">
      <g ref={revealRef} data-chart-36-fade="">
        {ticks.map((tick) => (
          <text
            key={tick}
            x={plot.x - AXIS_LABEL_INSET}
            y={yOf(tick)}
            dy="0.35em"
            textAnchor="end"
            className="fill-muted-foreground text-xs tabular-nums"
          >
            {`${Math.round(tick * 100)}%`}
          </text>
        ))}
        {targetY !== null && target !== null ? (
        <g
          className={cn(
            "transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            !scope.target && "opacity-0"
          )}
        >
          <line
            x1={plot.x}
            x2={right}
            y1={targetY}
            y2={targetY}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.7}
            strokeDasharray="4 4"
          />
          <HaloText
            x={right}
            y={targetY + 14}
            textAnchor="end"
            className="fill-muted-foreground text-xs tabular-nums"
          >
            {`${scope.targetLabel} ${formatPercent(target)}`}
          </HaloText>
        </g>
        ) : null}
      </g>
      <g ref={revealRef} data-chart-36-draw="">
        {projected.length > 1 ? (
          <Curve
            type="monotone"
            points={projected}
            fill="none"
            stroke="var(--color-margin)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        ) : null}
        <Curve
          type="monotone"
          points={closed}
          fill="none"
          stroke="var(--color-margin)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {points.map((point) => (
          <circle
            key={point.row.key}
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill={point.row.forecast ? "var(--card)" : "var(--color-margin)"}
            stroke={point.row.forecast ? "var(--color-margin)" : "var(--card)"}
            strokeWidth={1.5}
          />
        ))}
      </g>
      {last ? (
        <g ref={revealRef} data-chart-36-land="">
          <circle
            cx={last.x}
            cy={last.y}
            r={7}
            fill="var(--color-margin)"
            fillOpacity={0.16}
          />
          {/* The last close names the line; it drops below the dot when the
              lane's top leaves no room above. */}
          <HaloText
            x={last.x - 9}
            y={last.y - 22 >= 0 ? last.y - 9 : last.y + 18}
            textAnchor="end"
            className="fill-foreground text-xs font-medium tabular-nums"
          >
            {formatPercent(last.row.margin)}
          </HaloText>
        </g>
      ) : null}
      {/* The read column's dot, lit by the plot sheet. */}
      {points.map((point, index) => (
        <circle
          key={point.row.key}
          data-chart-36-dot={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="var(--color-margin)"
          stroke="var(--card)"
          strokeWidth={2}
        />
      ))}
    </g>
  )
}
