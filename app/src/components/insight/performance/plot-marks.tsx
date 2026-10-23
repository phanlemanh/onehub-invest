import { useContext } from "react"
import { cn } from "cn"
import {
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  type DotItemDotProps,
} from "recharts"

import { HaloText } from "@/components/charts/halo-text"

import {
  GLIDE,
  LABEL_CHAR_PX,
  LABEL_GAP,
  LABEL_OFFSET,
  LAYER_FADE,
  PlotContext,
} from "./plot-scope"
import { annotationsIn } from "./series"

// Module scope keeps the dot prop one identity; Recharts draws it from the
// interpolated points, so the end mark rides the morphing line.
export const renderEndMark = (props: DotItemDotProps) => <EndMark {...props} />

/** The latest day: a haloed dot and its figure, above it unless the line
 *  runs too close to the top. */
function EndMark({ cx, cy, index }: DotItemDotProps) {
  const scope = useContext(PlotContext)
  const plot = usePlotArea()
  if (!scope || !plot || cx == null || cy == null) return null
  // An area's dot value is its [base, top] pair, so the figure comes from
  // the row.
  const row = scope.rows[index]
  if (index !== scope.rows.length - 1 || !row) return null
  const above = cy - 22 >= plot.y
  return (
    <g aria-hidden="true" className="pointer-events-none">
      <circle cx={cx} cy={cy} r={7} fill="currentColor" fillOpacity={0.16} />
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill="currentColor"
        stroke="var(--card)"
        strokeWidth={1.5}
      />
      {/* A panel-coloured halo keeps the figure legible over the fill. */}
      <HaloText
        x={cx - 10}
        y={above ? cy - 10 : cy + 18}
        textAnchor="end"
        className="fill-foreground text-xs font-medium tabular-nums"
      >
        {scope.format.value(scope.metric.key, row.current)}
      </HaloText>
    </g>
  )
}

/** Events inside the shown days: a release as a hairline, a sale as a soft
 *  band, each named in the margin above the plot. */
export function Annotations() {
  const scope = useContext(PlotContext)
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  if (!scope || !plot || !xScale || scope.rows.length === 0) return null
  const step = plot.width / scope.rows.length
  const first = scope.rows[0].day
  const last = scope.rows[scope.rows.length - 1].day
  const xOf = (day: number) =>
    xScale(Math.min(last, Math.max(first, day)), { position: "middle" })
  const marks = annotationsIn(scope.rows).flatMap((item) => {
    const from = xOf(item.from)
    const to = xOf(item.to)
    if (from === undefined || to === undefined) return []
    const band = item.kind === "band"
    const left = band ? from - step / 2 : from
    return [{ item, band, left, width: band ? to - from + step : 0 }]
  })
  // Labels go left to right, each clear of the one before; one that cannot
  // fit is left out, while its line or band still draws.
  const labels: (number | null)[] = []
  let edge = plot.x
  for (const { item, left, width } of marks) {
    const half = (item.label.length * LABEL_CHAR_PX) / 2
    const wanted = Math.max(left + width / 2, plot.x + half)
    const x = Math.max(wanted, edge + LABEL_GAP + half)
    if (x + half > plot.x + plot.width) {
      labels.push(null)
      continue
    }
    edge = x + half
    labels.push(x)
  }
  return (
    <g
      aria-hidden="true"
      className={cn(
        "pointer-events-none",
        LAYER_FADE,
        "group-data-[annotations=off]/c6:opacity-0"
      )}
    >
      {marks.map(({ item, band, left, width }, index) => {
        const labelX = labels[index]
        return (
          <g key={item.id}>
            {/* Placed by translate and scale, so a range switch glides the
                event with the series instead of jumping it. */}
            {band ? (
              <rect
                y={plot.y}
                width={1}
                height={plot.height}
                fill="var(--muted-foreground)"
                fillOpacity={0.08}
                style={{ translate: `${left}px 0`, scale: `${width} 1` }}
                className={GLIDE}
              />
            ) : (
              <line
                y1={plot.y}
                y2={plot.y + plot.height}
                style={{ translate: `${left}px 0` }}
                className={GLIDE}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                strokeDasharray="2 3"
              />
            )}
            {labelX == null ? null : (
              <text
                y={plot.y - LABEL_OFFSET}
                textAnchor="middle"
                style={{ translate: `${labelX}px 0` }}
                className={cn("fill-muted-foreground text-xs", GLIDE)}
              >
                {item.label}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** The window's daily mean as a dotted rule; the legend names its figure,
 *  so no label ever lands on the line. */
export function AverageRule() {
  const scope = useContext(PlotContext)
  const plot = usePlotArea()
  const yScale = useYAxisScale()
  const y = scope ? yScale?.(scope.average) : undefined
  if (!scope || !plot || y === undefined) return null
  // The group glides to the new mean with the series; the rule fades.
  return (
    <g
      aria-hidden="true"
      style={{ translate: `0 ${y}px` }}
      className={cn("pointer-events-none", GLIDE)}
    >
      <line
        x1={plot.x}
        x2={plot.x + plot.width}
        stroke="var(--foreground)"
        strokeOpacity={0.45}
        strokeDasharray="1 3"
        strokeLinecap="round"
        className={cn(
          LAYER_FADE,
          "opacity-0 group-data-[average=on]/c6:opacity-100"
        )}
      />
    </g>
  )
}
