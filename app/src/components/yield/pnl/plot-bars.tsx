import {
  memo,
  useContext,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactElement,
} from "react"
import { Rectangle, useXAxisScale, type BarShapeProps } from "recharts"

import { barId } from "./bar-capture"
import { morphBar, sourceOf } from "./bar-morph"
import { EXPENSE_LAG_MS, staggerOf } from "./plot-reveal"
import {
  BAR_GAP,
  FLIP_ORIGIN,
  HOVER_FADE,
  PlotContext,
  RADIUS,
  useRevealRef,
  type BarKey,
} from "./plot-scope"

type RiseStyle = CSSProperties & { "--chart-36-delay": string }

type BarGeometry = Pick<
  BarShapeProps,
  "x" | "y" | "width" | "height" | "originalDataIndex"
>

/** Memoised on its geometry, so Recharts' own re-renders skip it. */
const PlotBar = memo(function PlotBar({
  series,
  y,
  width,
  height,
  originalDataIndex,
  ...geometry
}: BarGeometry & { series: BarKey }) {
  const scope = useContext(PlotContext)
  const riseRef = useRevealRef()
  const flipRef = useRef<SVGGElement>(null)
  const xScale = useXAxisScale()
  const row = scope?.rows[originalDataIndex]
  // Recharts centres a clamped bar in its own slot, so a wide column would
  // split the pair; both hug the column's middle instead.
  const middle = row ? xScale?.(row.key, { position: "middle" }) : undefined
  const x =
    middle === undefined
      ? geometry.x
      : series === "revenue"
        ? middle - BAR_GAP / 2 - width
        : middle + BAR_GAP / 2
  useLayoutEffect(() => {
    const node = flipRef.current
    const morph = scope?.morph.current ?? null
    if (!node || !row) return
    morphBar(node, morph, { x, y, width, height }, sourceOf(morph, series, row))
  }, [scope, row, series, x, y, width, height])
  if (!scope || !row || height <= 0) return <g />
  const delay =
    originalDataIndex * staggerOf(scope.rows.length) +
    (series === "expenses" ? EXPENSE_LAG_MS : 0)
  const riseStyle: RiseStyle = {
    transformBox: "view-box",
    transformOrigin: `0 ${y + height}px`,
    "--chart-36-delay": `${Math.round(delay)}ms`,
  }
  return (
    <g
      ref={flipRef}
      data-chart-36-bar={barId(series, row.start, row.months)}
      data-chart-36-col={originalDataIndex}
      className={HOVER_FADE}
      style={FLIP_ORIGIN}
    >
      {/* Each bar scales from the zero line; a forecast one is hatched. */}
      <g ref={riseRef} data-chart-36-rise="" style={riseStyle}>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          radius={[RADIUS, RADIUS, 0, 0]}
          fill={
            row.forecast
              ? `url(#${scope.id}-${series})`
              : `var(--color-${series})`
          }
          // A pale hatch alone fades into the card; the outline holds its edge.
          stroke={row.forecast ? `var(--color-${series})` : undefined}
          strokeWidth={row.forecast ? 1 : undefined}
        />
      </g>
    </g>
  )
})

export const SHAPES = {
  revenue: (props: BarShapeProps) => (
    <PlotBar
      series="revenue"
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      originalDataIndex={props.originalDataIndex}
    />
  ),
  expenses: (props: BarShapeProps) => (
    <PlotBar
      series="expenses"
      x={props.x}
      y={props.y}
      width={props.width}
      height={props.height}
      originalDataIndex={props.originalDataIndex}
    />
  ),
} satisfies Record<BarKey, (props: BarShapeProps) => ReactElement>

/** A diagonal hatch in a series colour, for its forecast bars. */
export function Hatch({ id, series }: { id: string; series: BarKey }) {
  return (
    <pattern
      id={`${id}-${series}`}
      width={5}
      height={5}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect
        width={5}
        height={5}
        fill={`var(--color-${series})`}
        fillOpacity={0.18}
      />
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={5}
        stroke={`var(--color-${series})`}
        strokeWidth={2}
      />
    </pattern>
  )
}
