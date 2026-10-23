import {
  createContext,
  Fragment,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { cn } from "cn"
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react"
import {
  DefaultZIndexes,
  useYAxisScale,
  ZIndexLayer,
  type BarShapeProps,
} from "recharts"

import { useDemoFrozen, type PlotSpan } from "./chart-defs"
import { formatDay } from "./data"
import { WARN_REMAINING } from "./slo-math"

// ── Constants and helpers ──

export const MARK = {
  stem: 1.5,
  stemOpacity: 0.32,
  // Gap between a stem's end and its head's edge.
  detach: 3,
  head: 4,
  headActive: 5,
  // Active halo radius, drawn in the head colour at 0.18.
  halo: 10,
  // Panel-coloured ring under the active head.
  ring: 7,
  // A KPI mini's lit dot, on a 2px card ring.
  dot: 3.5,
  hollow: 3.5,
  // Bare under-pace dot radius.
  quiet: 1.5,
  // Even-burn notch half width.
  notch: 3.5,
} as const

export const budgetColor = (remaining: number) =>
  remaining >= WARN_REMAINING
    ? "var(--success)"
    : remaining >= 0
      ? "var(--warning)"
      : "var(--destructive)"

/** Burn values ride a linear axis as log10, so 0 is 1x pace and stems grow from it. */
export const toLog = (burn: number) => Math.log10(Math.max(burn, 0.1))

export type ColumnSpan = { first: number; last: number }

/** Centre of column `index` in a band scale that fills the plot span. */
const columnCenter = (plot: PlotSpan, count: number, index: number) =>
  plot.x + ((index + 0.5) * plot.width) / count

/** Guides paint on a pre-registered layer under the bars (300). */
export const GUIDE_Z = DefaultZIndexes.cursorRectangle

/** The focus ring of a chart that owns its arrow keys. Recharts' z-index
 *  layers take pointer focus (tabindex -1), so their default ring is hidden. */
export const CHART_FOCUS =
  "group/sdo5 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring/50 [&_[class*=recharts-zIndex-layer]]:outline-hidden"

/** The pointer crossfade between lit columns. Keys snap (keysAttr on the
 *  focus owner): a held key repeats faster than the fade would settle. */
const HOVER_FADE =
  "pointer-events-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity group-data-sdo5-keys/sdo5:transition-none"

/** Marks the CHART_FOCUS element while the arrow keys drive it. */
export const keysAttr = (keyIndex: number | null) => ({
  "data-sdo5-keys": keyIndex === null ? undefined : "",
})

type Lit = { active: number | null; range: ColumnSpan | null }

const LitContext = createContext<Lit>({ active: null, range: null })

/** Lights a column (or a range's ends) for the marks below. They read it
 *  themselves, so a hover never re-renders the Bar and they stay mounted. */
export function LitColumns({
  active,
  range = null,
  children,
}: {
  active: number | null
  range?: ColumnSpan | null
  children: ReactNode
}) {
  const value = useMemo(() => ({ active, range }), [active, range])
  return <LitContext.Provider value={value}>{children}</LitContext.Provider>
}

const isLit = ({ active, range }: Lit, index: number) =>
  index === active ||
  (range !== null && (index === range.first || index === range.last))

/** Arrow keys, Home and End walk the columns from `rest`; blur hands back to the pointer. */
export function useColumnKeys(count: number, rest: number | null) {
  const [keyIndex, setKeyIndex] = useState<number | null>(null)
  const index = keyIndex === null ? null : Math.min(keyIndex, count - 1)

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (count <= 0) return
    const from = index ?? rest ?? count - 1
    const next =
      event.key === "ArrowLeft"
        ? Math.max(0, from - 1)
        : event.key === "ArrowRight"
          ? Math.min(count - 1, from + 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? count - 1
              : null
    if (next === null) return
    event.preventDefault()
    setKeyIndex(next)
  }

  const clear = () => setKeyIndex(null)
  return { keyIndex: index, onKeyDown, clear }
}

/** `!frozen && !reducedMotion`: the one switch every kit motion reads. */
export function useMarkMotion() {
  const frozen = useDemoFrozen()
  const reduceMotion = useReducedMotion()
  return !frozen && !reduceMotion
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const GLIDE = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 0.6,
} as const

/** Springs to `target`, or jumps when motion is off or `jumpKey` changed. */
function useGlide(target: number, jumpKey: string, enabled: boolean) {
  const value = useMotionValue(target)
  const settledKey = useRef(jumpKey)
  useLayoutEffect(() => {
    const keyChanged = settledKey.current !== jumpKey
    settledKey.current = jumpKey
    if (!enabled || keyChanged) {
      value.jump(target)
      return
    }
    const controls = animate(value, target, GLIDE)
    return () => controls.stop()
  }, [enabled, jumpKey, target, value])
  return value
}

/** Centres a box on `center` px, held inside its @container's width. */
const shiftInside = (center: number) =>
  `translateX(clamp(0px, calc(${center}px - 50%), calc(100cqw - 100%)))`

// ── Stems: the Recharts Bar shape ──

export type StemDatum = {
  /** Axis units: budget share, or toLog(burn). */
  value: number
  /** Head colour, a CSS var. */
  color: string
  /** quiet = no stem, a bare dot. */
  kind: "measured" | "forecast" | "quiet"
  /** Even-burn notch value, in axis units. */
  guide?: number | null
  /** Event halo colour; the ring sits 3px outside the head radius. */
  halo?: string | null
  /** Older context: stem 0.16, head opacity 0.45. */
  dim?: boolean
  /** Head drawn as a ring: card fill, colour stroke. */
  hollow?: boolean
  /** Quiet healthy head at 0.7, so the state colours carry the emphasis. */
  soft?: boolean
}

export type StemRow = { key: string; value: number; stem: StemDatum }

type StemOptions = {
  /** 0 for budget and for burn (log10 of 1x). */
  baseline: number
  /** Head radius, default MARK.head. */
  head?: number
  /** Dense columns: 1px stems and lighter notches. */
  thin?: boolean
  /** A lit column's look: the head grows over a halo and a card ring, or
   *  (KPI minis) a lifted dot on a card ring over the resting head. */
  lit?: "halo" | "dot"
}

type StemMarkProps = StemOptions & {
  x: number
  width: number
  index: number
  payload?: { stem?: StemDatum }
}

function StemMark({
  x,
  width,
  index,
  payload,
  baseline,
  head = MARK.head,
  thin = false,
  lit = "halo",
}: StemMarkProps) {
  const scale = useYAxisScale()
  const isActive = isLit(useContext(LitContext), index)
  const stem = payload?.stem
  const yv = stem && scale ? scale(stem.value) : undefined
  const y0 = scale ? scale(baseline) : undefined
  if (!stem || !scale || yv === undefined || y0 === undefined) return null
  if (!Number.isFinite(yv) || !Number.isFinite(y0)) return null

  const cx = x + width / 2
  const quiet = stem.kind === "quiet"
  const hollow = stem.kind === "forecast" || stem.hollow === true
  // Only the halo look moves the stem; a mini's dot just sits on top.
  const grow = isActive && lit === "halo"
  const restR = quiet ? MARK.quiet : hollow ? MARK.hollow : head
  const litR = hollow ? 4.5 : MARK.headActive
  const r = grow ? litR : restR
  const dim = stem.dim === true && !grow
  const headOpacity = dim ? 0.45 : stem.soft ? 0.7 : undefined
  const reach = Math.abs(y0 - yv) - (r + MARK.detach)
  const stemEnd = yv + Math.sign(y0 - yv) * (r + MARK.detach)
  const guideY =
    stem.kind === "measured" && stem.guide != null
      ? scale(stem.guide)
      : undefined
  // Behind pace: a dotted lead runs on from the stem to a notch beyond it.
  let lead: [number, number] | null = null
  if (guideY !== undefined && Number.isFinite(guideY)) {
    const sameSide = Math.sign(guideY - y0) === Math.sign(yv - y0)
    const from = sameSide ? yv + Math.sign(guideY - yv) * (r + 1) : y0
    if (
      Math.abs(guideY - y0) > Math.abs(yv - y0) + r + 1 ||
      (!sameSide && Math.abs(guideY - y0) > 2)
    )
      lead = [from, guideY]
  }

  // Every lit layer stays mounted at opacity 0, so moving columns crossfades.
  const fade = { opacity: isActive ? 1 : 0 }
  const shownR = lit === "dot" ? MARK.dot : litR
  return (
    <g aria-hidden="true">
      {!quiet && reach >= 2 ? (
        <line
          x1={cx}
          x2={cx}
          y1={y0}
          y2={stemEnd}
          stroke="var(--muted-foreground)"
          strokeOpacity={dim ? 0.16 : thin ? 0.24 : MARK.stemOpacity}
          strokeWidth={thin ? 1 : MARK.stem}
          strokeLinecap="round"
          strokeDasharray={stem.kind === "forecast" ? "1.5 3.5" : undefined}
        />
      ) : null}
      {lead ? (
        <line
          x1={cx}
          x2={cx}
          y1={lead[0]}
          y2={lead[1]}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.35}
          strokeWidth={1}
          strokeDasharray="1 2"
        />
      ) : null}
      {guideY !== undefined && Number.isFinite(guideY) ? (
        <line
          x1={cx - MARK.notch}
          x2={cx + MARK.notch}
          y1={guideY}
          y2={guideY}
          stroke="var(--muted-foreground)"
          strokeOpacity={thin ? 0.4 : 0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : null}
      {lit === "halo" ? (
        <g className={HOVER_FADE} style={fade}>
          <circle
            cx={cx}
            cy={yv}
            r={MARK.halo}
            fill={stem.color}
            fillOpacity={0.18}
          />
          <circle cx={cx} cy={yv} r={MARK.ring} fill="var(--card)" />
        </g>
      ) : null}
      {stem.halo ? (
        <circle
          cx={cx}
          cy={yv}
          r={head + 3}
          fill="none"
          stroke={stem.halo}
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      ) : null}
      {quiet ? (
        <circle cx={cx} cy={yv} r={restR} fill={stem.color} fillOpacity={0.5} />
      ) : hollow ? (
        <circle
          cx={cx}
          cy={yv}
          r={restR}
          fill="var(--card)"
          stroke={stem.color}
          strokeWidth={1.5}
          opacity={headOpacity}
        />
      ) : (
        <circle
          cx={cx}
          cy={yv}
          r={restR}
          fill={stem.color}
          opacity={headOpacity}
        />
      )}
      {/* The lit head, or a mini's dot, grows out of the resting one. */}
      <g
        className={cn(HOVER_FADE, "origin-center [transform-box:fill-box]")}
        style={{ ...fade, scale: isActive ? "1" : String(restR / shownR) }}
      >
        {lit === "dot" ? (
          <circle
            cx={cx}
            cy={yv}
            r={MARK.dot}
            fill={stem.color}
            stroke="var(--card)"
            strokeWidth={2}
            paintOrder="stroke"
          />
        ) : hollow ? (
          <circle
            cx={cx}
            cy={yv}
            r={litR}
            fill="var(--card)"
            stroke={stem.color}
            strokeWidth={1.5}
          />
        ) : (
          <circle cx={cx} cy={yv} r={litR} fill={stem.color} />
        )}
      </g>
    </g>
  )
}

/** Bar `shape` drawing each row's `stem`; pair with dataKey="value" minPointSize={1}.
 *  Wrap the chart in LitColumns, and keep the shape stable across hovers. */
export function renderStem(options: StemOptions) {
  return function stemShape(props: BarShapeProps): ReactElement {
    return (
      <StemMark
        x={props.x}
        width={props.width}
        index={props.originalDataIndex}
        payload={props.payload}
        {...options}
      />
    )
  }
}

// ── Beads: the Budget Events abacus ──

export type Bead = { color: string; hollow?: boolean; halo?: boolean }

/** A bead's radius, and the lit day's top bead. */
const BEAD_R = 2.5
const BEAD_LIT_R = 3

type BeadColumnProps = {
  x: number
  width: number
  index: number
  payload?: { beads?: Bead[] }
  background?: { y: number | null; height: number }
}

function BeadColumn({ x, width, index, payload, background }: BeadColumnProps) {
  const isActive = isLit(useContext(LitContext), index)
  if (!background || background.y === null) return null
  const cx = x + width / 2
  const yb = background.y + background.height - 3
  const beads = (payload?.beads ?? []).slice(0, 4)

  if (beads.length === 0) {
    return (
      <circle
        aria-hidden="true"
        cx={cx}
        cy={yb}
        r={1}
        fill="var(--muted-foreground)"
        fillOpacity={0.35}
      />
    )
  }

  const topY = yb - 4 - (beads.length - 1) * 7
  const beadMark = (bead: Bead, cy: number, r: number) =>
    bead.hollow ? (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="var(--card)"
        stroke={bead.color}
        strokeWidth={1.25}
      />
    ) : (
      <circle cx={cx} cy={cy} r={r} fill={bead.color} />
    )
  return (
    <g aria-hidden="true">
      <line
        x1={cx}
        x2={cx}
        y1={yb}
        y2={topY}
        stroke="var(--muted-foreground)"
        strokeOpacity={0.3}
        strokeWidth={1}
      />
      {beads.map((bead, i) => {
        const cy = yb - 4 - i * 7
        return (
          <Fragment key={i}>
            {bead.halo ? (
              <circle
                cx={cx}
                cy={cy}
                r={5.5}
                fill="var(--destructive)"
                fillOpacity={0.18}
              />
            ) : null}
            {beadMark(bead, cy, BEAD_R)}
          </Fragment>
        )
      })}
      {/* The lit day's top bead swells: a larger copy grows in over it. */}
      <g
        className={cn(HOVER_FADE, "origin-center [transform-box:fill-box]")}
        style={{
          opacity: isActive ? 1 : 0,
          scale: isActive ? "1" : String(BEAD_R / BEAD_LIT_R),
        }}
      >
        {beadMark(beads[beads.length - 1], topY, BEAD_LIT_R)}
      </g>
    </g>
  )
}

/** Bar `shape` stacking each row's `beads` up from the column floor; the lit
 *  day comes from LitColumns. */
export function beadShape(props: BarShapeProps): ReactElement {
  return (
    <BeadColumn
      x={props.x}
      width={props.width}
      index={props.originalDataIndex}
      payload={props.payload}
      background={props.background}
    />
  )
}

// ── Chips: the date rail ──

type ChipKind =
  "plain" | "incident" | "event" | "today" | "forecast" | "active" | "live"

export type ChipSpec = { index: number; label: string; kind: ChipKind }

const CHIP_PRIORITY: Record<ChipKind, number> = {
  active: 0,
  live: 0,
  today: 1,
  incident: 2,
  event: 2,
  plain: 3,
  forecast: 3,
}

const CHIP_TONE: Record<ChipKind, string> = {
  plain: "bg-muted text-muted-foreground",
  incident:
    "bg-destructive/10 text-destructive ring-1 ring-destructive/25 ring-inset",
  event: "bg-muted text-foreground ring-1 ring-muted-foreground/30 ring-inset",
  today: "bg-card text-foreground ring-1 ring-foreground/20 ring-inset",
  forecast: "text-muted-foreground ring-1 ring-border ring-inset",
  active: "bg-foreground font-semibold text-background",
  live: "bg-foreground font-semibold text-background",
}

const isPill = (chip: ChipSpec) => chip.kind !== "live" && chip.label.length > 2

const chipWidth = (chip: ChipSpec) =>
  isPill(chip) ? 7.5 * chip.label.length + 16 : 24

/** A chip's estimated box, held inside the rail like the rendered chip. */
function chipBox(chip: ChipSpec, plot: PlotSpan, count: number) {
  const width = chipWidth(chip)
  const railEnd = plot.x * 2 + plot.width
  const left = clamp(
    columnCenter(plot, count, chip.index) - width / 2,
    0,
    Math.max(0, railEnd - width)
  )
  return { left, right: left + width }
}

/** Keeps the chips that fit: one per column, higher priority first, `gap` px apart. */
export function planChips(
  candidates: ChipSpec[],
  plot: PlotSpan,
  count: number,
  gap = 4
): ChipSpec[] {
  const byColumn = new Map<number, ChipSpec>()
  for (const chip of candidates) {
    if (chip.index < 0 || chip.index >= count) continue
    const held = byColumn.get(chip.index)
    if (!held || CHIP_PRIORITY[chip.kind] < CHIP_PRIORITY[held.kind])
      byColumn.set(chip.index, chip)
  }
  const ranked = [...byColumn.values()].sort(
    (a, b) => CHIP_PRIORITY[a.kind] - CHIP_PRIORITY[b.kind] || a.index - b.index
  )
  const kept: { chip: ChipSpec; left: number; right: number }[] = []
  for (const chip of ranked) {
    const box = chipBox(chip, plot, count)
    const crowded = kept.some(
      (other) => box.left < other.right + gap && other.left < box.right + gap
    )
    if (!crowded) kept.push({ chip, ...box })
  }
  return kept.map(({ chip }) => chip).sort((a, b) => a.index - b.index)
}

const monthOf = (ms: number) => {
  const date = new Date(ms)
  return date.getUTCFullYear() * 12 + date.getUTCMonth()
}

/** Day-number chips name their month once: the first chip and each month change. */
export function withMonths(
  chips: ChipSpec[],
  dayOf: (index: number) => number
): ChipSpec[] {
  let month: number | null = null
  return [...chips]
    .sort((a, b) => a.index - b.index)
    .map((chip) => {
      // Live dots and custom labels (a clock time) keep their face.
      if (chip.kind === "live" || (chip.label && !/^\d{1,2}$/.test(chip.label)))
        return chip
      const ms = dayOf(chip.index)
      const next = monthOf(ms)
      const named = month === null || next !== month
      month = next
      return {
        ...chip,
        label: named ? formatDay(ms) : String(new Date(ms).getUTCDate()),
      }
    })
}

/** The rail's chip face. */
const CHIP_FACE =
  "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium whitespace-nowrap tabular-nums"

function RailChip({ chip, center }: { chip: ChipSpec; center: number }) {
  return (
    <span
      className={cn(
        "absolute top-0 left-0",
        CHIP_FACE,
        isPill(chip) && "px-2",
        CHIP_TONE[chip.kind]
      )}
      style={{ transform: shiftInside(center) }}
    >
      {chip.kind === "live" ? (
        <>
          <span className="bg-background size-1.5 rounded-full" />
          <span className="sr-only">Now</span>
        </>
      ) : (
        chip.label
      )}
    </span>
  )
}

function ChipRail({
  plot,
  count,
  chips,
  beads,
}: {
  plot: PlotSpan | null
  count: number
  chips: ChipSpec[]
  beads?: (index: number) => boolean
}) {
  if (!plot || count <= 0) {
    return <div aria-hidden="true" className="relative mt-2 h-6 shrink-0" />
  }
  const boxes = chips.map((chip) => chipBox(chip, plot, count))
  const taken = new Set(chips.map((chip) => chip.index))
  const dots: { index: number; center: number }[] = []
  for (let index = 0; index < count; index++) {
    if (taken.has(index) || (beads && !beads(index))) continue
    const center = columnCenter(plot, count, index)
    // A tick keeps 3px clear of every chip box.
    const clear = boxes.every(
      (box) => center + 5 <= box.left || center - 5 >= box.right
    )
    if (clear) dots.push({ index, center })
  }

  return (
    <div aria-hidden="true" className="@container relative mt-2 h-6 shrink-0">
      {dots.map((dot) => (
        <span
          key={`bead-${dot.index}`}
          className="bg-muted-foreground/25 absolute top-1/2 h-1.5 w-px -translate-1/2 rounded-full"
          style={{ left: dot.center }}
        />
      ))}
      {chips.map((chip) => (
        <RailChip
          key={chip.index}
          chip={chip}
          center={columnCenter(plot, count, chip.index)}
        />
      ))}
    </div>
  )
}

// ── Frame: pill, bubble lane, plot lane, chip rail ──

function FramePill({
  left,
  width,
  radius,
  lowered,
  wrap,
  jumpKey,
}: {
  left: number
  width: number
  radius: number
  lowered: boolean
  /** Runs past the rail, so its round cap cradles the active chip. */
  wrap: boolean
  jumpKey: string
}) {
  const motionOn = useMarkMotion()
  const x = useGlide(left, jumpKey, motionOn)
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "from-foreground/2 to-foreground/8 pointer-events-none absolute left-0 bg-linear-to-b",
        lowered ? "top-3.5" : "top-0",
        wrap ? "-bottom-1.5" : "bottom-0"
      )}
      // Half the column pill width: a full radius at any span length.
      style={{ x: motionOn ? x : left, width, borderRadius: radius }}
    />
  )
}

function FrameBubble({
  mid,
  jumpKey,
  children,
}: {
  mid: number
  jumpKey: string
  children: ReactNode
}) {
  const motionOn = useMarkMotion()
  const glide = useGlide(mid, jumpKey, motionOn)
  const transform = useMotionTemplate`translateX(clamp(0px, calc(${glide}px - 50%), calc(100cqw - 100%)))`
  return (
    <div
      aria-hidden="true"
      className="@container pointer-events-none absolute inset-x-0 top-1 h-7"
    >
      <motion.div
        className="absolute top-0 left-0 flex"
        style={{ transform: motionOn ? transform : shiftInside(mid) }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function spanOf(
  plot: PlotSpan,
  count: number,
  focus: ColumnSpan,
  pillWidth: number
) {
  const first = clamp(Math.min(focus.first, focus.last), 0, count - 1)
  const last = clamp(Math.max(focus.first, focus.last), 0, count - 1)
  const start = columnCenter(plot, count, first)
  const end = columnCenter(plot, count, last)
  return {
    left: start - pillWidth / 2,
    width: end - start + pillWidth,
    mid: (start + end) / 2,
    // A new span length or a new plot jumps; a moved column glides.
    jumpKey: `${plot.x}|${plot.width}|${count}|${last - first}|${pillWidth}`,
  }
}

/** Active-column chrome around a chart: the pill, the value bubble and the chip rail. */
export function LollipopFrame({
  plot,
  count,
  focus,
  bubble,
  chips,
  beads,
  pillWidth = 28,
  className,
  children,
}: {
  /** From PlotAreaReporter inside the chart. */
  plot: PlotSpan | null
  count: number
  /** Pill span; null hides the pill and the bubble. */
  focus: ColumnSpan | null
  /** BubbleText; omitted = no bubble lane. */
  bubble?: ReactNode
  /** Omitted = no rail. */
  chips?: ChipSpec[]
  /** Which chipless columns get a bead; default all. */
  beads?: (index: number) => boolean
  /** 28 hero and sheet hourly, 26 compact, 12 KPI minis. */
  pillWidth?: number
  className?: string
  children: ReactNode
}) {
  const hasBubble = bubble !== undefined
  const span =
    plot && focus && count > 0 ? spanOf(plot, count, focus, pillWidth) : null

  return (
    <div className={cn("relative flex min-w-0 flex-col", className)}>
      {span ? (
        <FramePill
          left={span.left}
          width={span.width}
          radius={pillWidth / 2}
          lowered={hasBubble}
          wrap={chips !== undefined}
          jumpKey={span.jumpKey}
        />
      ) : null}
      {hasBubble ? <div aria-hidden="true" className="h-8 shrink-0" /> : null}
      <div className="relative min-h-0 flex-1">{children}</div>
      {chips ? (
        <ChipRail plot={plot} count={count} chips={chips} beads={beads} />
      ) : null}
      {hasBubble && span ? (
        <FrameBubble mid={span.mid} jumpKey={span.jumpKey}>
          {bubble}
        </FrameBubble>
      ) : null}
    </div>
  )
}

/** The dark value bubble: a value, then dot-separated context. */
export function BubbleText({
  value,
  meta = [],
}: {
  value: string
  meta?: (string | null | undefined)[]
}): ReactElement {
  const parts = meta.filter((part): part is string => Boolean(part))
  return (
    <span
      aria-hidden="true"
      className="bg-foreground text-background inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap tabular-nums"
    >
      {value}
      {parts.map((part, index) => (
        <Fragment key={index}>
          <span className="bg-background/40 size-1 rounded-full" />
          <span className="text-background/65 font-medium">{part}</span>
        </Fragment>
      ))}
    </span>
  )
}

// ── Plain SVG marks ──

const pct = (value: number) => `${clamp(value, 0, 1) * 100}%`

/** Horizontal lollipop on a 0..1 track: Burn Rate rows, sheet windows, grid Budget cell. */
export function HLollipop({
  position,
  base = null,
  color,
  ghost = null,
  guides = [],
  rail = false,
  head = 4.25,
  className,
  label,
}: {
  /** Head, 0..1. */
  position: number
  /** Stem start, 0..1; null = no stem. */
  base?: number | null
  color: string
  /** Hollow ring at 0..1 (the 6h rate). */
  ghost?: number | null
  guides?: {
    at: number
    color: string
    height?: number
    dashed?: boolean
    opacity?: number
  }[]
  /** Soft full-width rail behind the marks. */
  rail?: boolean
  head?: number
  /** Sizes the svg; the caller fixes its height (h-3.5 or h-4). */
  className?: string
  /** Given: role="img" with this label; omitted: aria-hidden. */
  label?: string
}) {
  const maskId = `lollipop-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const headX = pct(position)

  return (
    <svg
      width="100%"
      className={cn("block overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rail ? (
        <line
          x1="0"
          x2="100%"
          y1="50%"
          y2="50%"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.12}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
      {guides.map((guide, index) => {
        const half = (guide.height ?? 10) / 2
        return (
          // A nested svg anchors px offsets on a % point.
          <svg key={index} x={pct(guide.at)} y="50%" overflow="visible">
            <line
              y1={-half}
              y2={half}
              stroke={guide.color}
              strokeOpacity={guide.opacity ?? 1}
              strokeWidth={1.25}
              strokeDasharray={guide.dashed ? "2 2" : undefined}
            />
          </svg>
        )
      })}
      {base !== null ? (
        <>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <rect x="-50%" y="-50%" width="200%" height="200%" fill="white" />
            {/* Cuts the stem 2px short of the head at any track width. */}
            <circle cx={headX} cy="50%" r={head + 2} fill="black" />
          </mask>
          <line
            x1={pct(base)}
            x2={headX}
            y1="50%"
            y2="50%"
            stroke="var(--muted-foreground)"
            strokeOpacity={0.4}
            strokeWidth={2}
            mask={`url(#${maskId})`}
          />
        </>
      ) : null}
      {ghost !== null ? (
        <circle
          cx={pct(ghost)}
          cy="50%"
          r={3.5}
          fill="var(--card)"
          stroke="var(--muted-foreground)"
          strokeWidth={1.25}
        />
      ) : null}
      <g className="origin-center transition-transform duration-150 [transform-box:fill-box] group-hover/item:scale-125 group-focus-visible/item:scale-125 motion-reduce:transition-none [[data-demo=frozen]_&]:transition-none">
        <circle
          cx={headX}
          cy="50%"
          r={head}
          fill={color}
          stroke="var(--card)"
          strokeWidth={2}
          paintOrder="stroke"
        />
      </g>
    </svg>
  )
}

/** Bead line: small dots, the last value a full lollipop (grid Trend cell). */
export function BeadSpark({
  values,
  domain,
  color,
  width = 96,
  height = 28,
}: {
  values: number[]
  /** [-0.5, 1] in the grid. */
  domain: [number, number]
  /** The last head's colour. */
  color: string
  width?: number
  height?: number
}) {
  const count = values.length
  const [low, high] = domain
  const range = high - low || 1
  const xOf = (index: number) =>
    count > 1 ? 2 + (index * (width - 4)) / (count - 1) : width / 2
  const yOf = (value: number) =>
    3 + (1 - (clamp(value, low, high) - low) / range) * (height - 6)
  // Older beads fade: 0.35 for the oldest up to 0.75 for the newest.
  const rampOf = (index: number) =>
    0.35 + (0.75 - 0.35) * (index / Math.max(1, count - 2))

  const zero = Math.round(yOf(0) - 0.5) + 0.5
  const last = count > 0 ? values[count - 1] : null
  const lastX = xOf(count - 1)
  const lastY = last === null ? zero : yOf(last)
  const reach = Math.abs(lastY - zero) - (2.75 + 1.5)

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block overflow-visible"
    >
      {low <= 0 && high >= 0 ? (
        <line
          x1={0}
          x2={width}
          y1={zero}
          y2={zero}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ) : null}
      {values.slice(0, -1).map((value, index) => (
        <circle
          key={index}
          cx={xOf(index)}
          cy={yOf(value)}
          r={1.5}
          fill={value < 0 ? "var(--destructive)" : "var(--muted-foreground)"}
          fillOpacity={value < 0 ? 0.7 : rampOf(index)}
        />
      ))}
      {last !== null && reach > 0.5 ? (
        <line
          x1={lastX}
          x2={lastX}
          y1={zero}
          y2={lastY + Math.sign(zero - lastY) * (2.75 + 1.5)}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.45}
          strokeWidth={1.25}
        />
      ) : null}
      {last !== null ? (
        <circle
          cx={lastX}
          cy={lastY}
          r={2.75}
          fill={color}
          stroke="var(--card)"
          strokeWidth={1.5}
          paintOrder="stroke"
        />
      ) : null}
    </svg>
  )
}

// ── SVG text and legend glyphs ──

const TAG_TONE = {
  muted: "fill-muted-foreground",
  warning: "fill-warning-foreground dark:fill-warning",
  destructive: "fill-destructive",
} as const

/** A ReferenceLine label; its card-coloured halo knocks out the stems behind it. */
export function LineTag({
  viewBox,
  value,
  side,
  placement,
  tone = "muted",
}: {
  /** Injected by Recharts. */
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  value: string
  side: "start" | "end"
  placement: "above" | "below"
  tone?: keyof typeof TAG_TONE
}) {
  const x = (viewBox?.x ?? 0) + (side === "end" ? (viewBox?.width ?? 0) : 0)
  const y = (viewBox?.y ?? 0) + (placement === "above" ? -6 : 15)
  return (
    // The label layer: the tag reads over the stems whatever its line's layer.
    <ZIndexLayer zIndex={DefaultZIndexes.label}>
      <text
        aria-hidden="true"
        x={x}
        y={y}
        textAnchor={side === "end" ? "end" : "start"}
        className={cn("text-xs font-medium", TAG_TONE[tone])}
        stroke="var(--card)"
        strokeWidth={4}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {value}
      </text>
    </ZIndexLayer>
  )
}

/** A 12px legend mark matching one chart mark. */
export function Glyph({
  kind,
  color = "var(--muted-foreground)",
}: {
  kind: "notch" | "ring" | "dot" | "incident" | "event" | "dash" | "line"
  color?: string
}) {
  if (kind === "incident" || kind === "event") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "size-3 shrink-0 rounded-full ring-1 ring-inset",
          kind === "incident"
            ? "bg-destructive/10 ring-destructive/25"
            : "bg-muted ring-muted-foreground/30"
        )}
      />
    )
  }
  return (
    <svg
      aria-hidden="true"
      width={12}
      height={12}
      viewBox="0 0 12 12"
      className="shrink-0"
    >
      {kind === "notch" ? (
        <line
          x1={6 - MARK.notch}
          x2={6 + MARK.notch}
          y1={6}
          y2={6}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : null}
      {kind === "ring" ? (
        <circle
          cx={6}
          cy={6}
          r={MARK.hollow}
          fill="var(--card)"
          stroke={color}
          strokeWidth={1.5}
        />
      ) : null}
      {kind === "dot" ? <circle cx={6} cy={6} r={3} fill={color} /> : null}
      {kind === "dash" ? (
        <line
          x1={0}
          x2={12}
          y1={6}
          y2={6}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 1.5"
        />
      ) : null}
      {kind === "line" ? (
        <line
          x1={0.75}
          x2={11.25}
          y1={6}
          y2={6}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}