import { createContext, useSyncExternalStore } from "react"

import { type MetricSpec } from "./data"
import { type Formatters } from "./format"
import { type PlotRow } from "./series"

/** Every series moves in one rhythm: data changes settle in 400ms. */
export const SERIES_MOTION = {
  animationDuration: 400,
  // eslint-disable-next-line onehub-ui/no-banned-motion -- nguyên bản @reui/chart-6: nhịp easing có sẵn của Recharts, ReUI cấm đổi nhịp chuyển động của block
  animationEasing: "ease-out",
} as const
// Module scope, so a re-render hands Recharts the same objects.
export const MARGIN = { top: 28, right: 12, bottom: 0, left: 0 }
export const AXIS_WIDTH = 48
/** The event labels ride the margin above the plot. */
export const LABEL_OFFSET = 10
/** A text-xs character's rough width, and the air between two labels. */
export const LABEL_CHAR_PX = 6.4
export const LABEL_GAP = 12
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"
/** New axis figures fade in, the house view-switch length. */
export const AXIS_FADE_MS = 150
/** What moves with the series takes their beat: Recharts' "ease-out" is the
 *  CSS keyword, so both settle together. */
// eslint-disable-next-line onehub-ui/no-banned-motion -- nguyên bản @reui/chart-6: khớp animationDuration 400/"ease-out" của Recharts để lớp phụ trượt cùng đường
const SERIES_BEAT = "duration-400 ease-[ease-out]"
/** Context placed by translate or scale glides on the series' beat. */
export const GLIDE = `transition-[translate,scale] ${SERIES_BEAT}`
/** A new metric's colour eases in with its line. */
export const COLOR_TWEEN = `transition-[color,stop-color] ${SERIES_BEAT}`
/** A layer toggle is a quick state change: a short fade, never a keyframe. */
export const LAYER_FADE =
  "transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"

const subscribeNothing = () => () => {}
const readFrozenDemo = () => document.documentElement.dataset.demo === "frozen"
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (notify: () => void) => {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}
const readReduced = () => window.matchMedia(REDUCED_QUERY).matches

/** Series motion is off for the frozen demo and under reduced motion. */
export function useStillSeries() {
  const frozen = useSyncExternalStore(
    subscribeNothing,
    readFrozenDemo,
    () => false
  )
  const reduced = useSyncExternalStore(
    subscribeReduced,
    readReduced,
    () => false
  )
  return frozen || reduced
}

/** Round ticks from zero: the tightest step that covers the tallest point,
 *  with a little air, in at most five intervals. */
export function valueTicks(max: number) {
  // Một cửa sổ toàn số 0 vẫn cần một trục: log10(0) sẽ là -Infinity.
  const top = Math.max(max, Number.EPSILON) * 1.08
  const power = 10 ** Math.floor(Math.log10(top / 4))
  const step =
    [1, 2, 2.5, 5, 10]
      .map((unit) => unit * power)
      .find((size) => Math.ceil(top / size) <= 5) ?? 10 * power
  const ticks: number[] = []
  for (let tick = 0; tick <= Math.ceil(top / step) * step; tick += step) {
    ticks.push(tick)
  }
  return ticks
}

/** Mọi tháng khi cửa sổ ngắn, cách một tháng khi dài; đếm lùi từ tháng cuối
 *  để tháng cuối luôn có nhãn. */
export function monthTicks(rows: PlotRow[]) {
  const every = rows.length <= 6 ? 1 : 2
  return rows
    .filter((_, index) => (rows.length - 1 - index) % every === 0)
    .map((row) => row.day)
}

export type PlotScope = {
  rows: PlotRow[]
  metric: MetricSpec
  average: number
  format: Formatters
}
export const PlotContext = createContext<PlotScope | null>(null)
