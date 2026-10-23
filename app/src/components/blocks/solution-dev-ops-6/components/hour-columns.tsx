import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"
import { cn } from "cn"
import {
  Rectangle,
  useActiveTooltipLabel,
  useChartWidth,
  usePlotArea,
  type BarShapeProps,
} from "recharts"

/** Each segment is its own pill: this corner, and this much air between. */
const RADIUS = 4
const SEGMENT_GAP = 2
/** The track behind each column, a step rounder than its segments. */
const TRACK_RADIUS = 6
/** The widest card (w-56) until measured, and its air beside the column. */
const CARD_WIDTH = 224
const CARD_GAP = 4

type HourSeries = "succeeded" | "partial" | "failed" | "volume"

/** The pointer crossfade, opacity only. Arrow keys snap: a held key repeats
 *  faster than the fade and would leave half-lit columns behind. */
const HOVER_FADE =
  "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-has-[:focus-visible]/sdo6:transition-none"

/** The hover group on the ChartContainer. A click focuses Recharts' layer
 *  group, so only a keyboard read rings the chart. */
export const HOUR_CHART =
  "group/sdo6 has-[:focus-visible]:ring-ring/50 ring-offset-card has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-offset-2 [&_[class*=recharts-zIndex-layer]]:outline-hidden"

/** The card pops once per visit; a keyboard read skips it, reduced motion
 *  keeps the fade alone. */
const MOTION_STYLE = `
@keyframes sdo6-pop { from { opacity: 0; transform: scale(0.97); } }
@keyframes sdo6-fade { from { opacity: 0; } }
[data-sdo6-pop] { animation: sdo6-pop 125ms cubic-bezier(0.23, 1, 0.32, 1); }
.group\\/sdo6:has(:focus-visible) [data-sdo6-pop] { animation: none; }
@media (prefers-reduced-motion: reduce) {
  [data-sdo6-pop] { animation-name: sdo6-fade; }
}
`

/** What the shapes read, so they stay module-stable: an inline shape
 *  remounts every bar whenever the chart renders. */
type HourScope = { uid: string; stack: readonly HourSeries[] }

const HourContext = createContext<HourScope | null>(null)

/** Scopes the hatches and shapes inside one chart to its stack, bottom to top. */
export function HourColumns({
  stack,
  children,
}: {
  stack: readonly HourSeries[]
  children: ReactNode
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const scope = useMemo(() => ({ uid, stack }), [uid, stack])
  return (
    <HourContext.Provider value={scope}>
      <style>{MOTION_STYLE}</style>
      {children}
    </HourContext.Provider>
  )
}

/** The hour the pointer or keyboard is reading; undefined at rest. */
function useReadHour() {
  const label = useActiveTooltipLabel()
  return label === undefined ? undefined : `${label}`
}

function fieldOf(payload: unknown, key: string): unknown {
  if (typeof payload !== "object" || payload === null) return undefined
  return Reflect.get(payload, key)
}

const amountOf = (payload: unknown, key: string) => {
  const value = fieldOf(payload, key)
  return typeof value === "number" ? value : 0
}

/** One diagonal hatch per series in the stack. */
export function HourHatches() {
  const scope = useContext(HourContext)
  if (!scope) return null
  return (
    <defs>
      {scope.stack.map((key) => (
        <pattern
          key={key}
          id={`${scope.uid}-${key}`}
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect
            width={5}
            height={5}
            fill={`var(--color-${key})`}
            fillOpacity={0.22}
          />
          <rect
            width={2}
            height={5}
            fill={`var(--color-${key})`}
            fillOpacity={0.5}
          />
        </pattern>
      ))}
    </defs>
  )
}

/** A stacked segment, gapped from its neighbours. Its solid face fades in
 *  over the hatch while its hour is read. */
function HourSegment({
  series,
  ...props
}: BarShapeProps & { series: HourSeries }) {
  const scope = useContext(HourContext)
  // Read here, not lifted: a hover re-renders the shapes, never the chart,
  // so they stay mounted and the fade plays.
  const readHour = useReadHour()
  if (!scope || amountOf(props.payload, series) === 0) return <g />
  const filled = scope.stack.filter((item) => amountOf(props.payload, item) > 0)
  const at = filled.indexOf(series)
  const above = at < filled.length - 1 ? SEGMENT_GAP / 2 : 0
  const below = at > 0 ? SEGMENT_GAP / 2 : 0
  const lit =
    readHour !== undefined && fieldOf(props.payload, "label") === readHour
  const box = {
    x: props.x,
    y: props.y + above,
    width: props.width,
    height: Math.max(1, props.height - above - below),
    radius: RADIUS,
  }
  return (
    <g>
      <Rectangle {...box} fill={`url(#${scope.uid}-${series})`} />
      <Rectangle
        {...box}
        fill={`var(--color-${series})`}
        className={cn(HOVER_FADE, lit ? "opacity-100" : "opacity-0")}
      />
    </g>
  )
}

/** The full-height track behind a column. It deepens while its hour is read,
 *  so an hour with no segments still shows which column the card describes. */
function HourTrack(props: BarShapeProps) {
  const lit = useReadHour() === fieldOf(props.payload, "label")
  const box = {
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    radius: Math.min(TRACK_RADIUS, props.width / 2),
  }
  return (
    <g>
      <Rectangle {...box} className="fill-muted" />
      <Rectangle
        {...box}
        className={cn(
          "fill-muted-foreground/15 dark:fill-muted-foreground/25",
          HOVER_FADE,
          lit ? "opacity-100" : "opacity-0"
        )}
      />
    </g>
  )
}

/** The track the first series lays behind every column. */
export const HOUR_TRACK = (props: BarShapeProps) => <HourTrack {...props} />

export const HOUR_SHAPES: Record<
  HourSeries,
  (props: BarShapeProps) => ReactElement
> = {
  succeeded: (props) => <HourSegment {...props} series="succeeded" />,
  partial: (props) => <HourSegment {...props} series="partial" />,
  failed: (props) => <HourSegment {...props} series="failed" />,
  volume: (props) => <HourSegment {...props} series="volume" />,
}

/** The card docks itself, so Recharts pins its wrapper at the chart origin. */
export const CARD_ORIGIN = { x: 0, y: 0 }

/** The card's left edge, pinned at the plot's top. */
type Dock = { x: number; y: number; flip: boolean }

/** Right of the read column when the card fits, else the roomier side (it may
 *  cover the value axis). Never past the chart's edges: a narrow chart overlaps. */
function dockOf(
  plot: { x: number; y: number; width: number } | undefined,
  chartWidth: number | undefined,
  index: number,
  count: number,
  cardWidth: number
): Dock | undefined {
  if (!plot || index < 0 || count === 0) return undefined
  const band = plot.width / count
  const start = plot.x + index * band
  const end = start + band
  const edge = chartWidth ?? plot.x + plot.width
  const roomRight = edge - end - CARD_GAP
  const roomLeft = start - CARD_GAP
  const flip = cardWidth > roomRight && roomLeft > roomRight
  const x = flip ? start - CARD_GAP - cardWidth : end + CARD_GAP
  return { x: Math.max(0, Math.min(x, edge - cardWidth)), y: plot.y, flip }
}

/** Docks the card beside the read column. It pops in once per visit, then
 *  snaps between hours, so it never slides across the columns. */
export function DockedCard({
  index,
  count,
  children,
}: {
  index: number
  count: number
  children: ReactNode
}) {
  const plot = usePlotArea()
  const chartWidth = useChartWidth()
  const card = useRef<HTMLDivElement>(null)
  // Measured before paint, so no frame docks it by a stale width;
  // offsetWidth ignores the pop's scale.
  const [cardWidth, setCardWidth] = useState(CARD_WIDTH)
  useLayoutEffect(() => {
    const width = card.current?.offsetWidth
    if (width && width !== cardWidth) setCardWidth(width)
  })
  const dock = dockOf(plot, chartWidth, index, count, cardWidth)
  if (!dock) return null
  return (
    <div style={{ transform: `translate(${dock.x}px, ${dock.y}px)` }}>
      {/* It grows from the edge that faces the column. */}
      <div
        ref={card}
        data-sdo6-pop=""
        style={{ transformOrigin: dock.flip ? "right top" : "left top" }}
      >
        {children}
      </div>
    </div>
  )
}

/** The dot legend a chart carries in its header band. */
export function HourLegend({
  items,
}: {
  items: { key: string; label: string; tone: string }[]
}) {
  return (
    <ul className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", item.tone)}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}