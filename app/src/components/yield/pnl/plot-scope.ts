import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react"

import { type Period } from "./data"
import { type Morph } from "./bar-capture"
import { onSmoothFrame, REVEAL_MS } from "./plot-reveal"

export type BarKey = "revenue" | "expenses"

/** The bars' top tick sits at this share of the plot; the margin line runs
 *  between the lane's two shares above it. */
export const BAR_SHARE = 0.6
export const LANE: [number, number] = [0.68, 0.95]
/** Where the money axis's labels end, left of the plot; the lane's share it. */
export const AXIS_LABEL_INSET = 12
/** Axis steps in USD thousands; whole millions past one fit the axis. */
export const RADIUS = 3
export const MAX_BAR_SIZE = 18
export const BAR_GAP = 3
export const AXIS_WIDTH = 44
/** Air right of the plot, so the last column's band never meets the edge. */
const PLOT_RIGHT = 4
export const MARGIN = { top: 16, right: PLOT_RIGHT, bottom: 0, left: 0 }
/** The pointer crossfade; arrow keys snap, since a held key outruns it. */
export const HOVER_FADE =
  "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-has-[:focus-visible]/c36:transition-none"
/** Set on the host once the first reveal has landed. */
export const SETTLED = "data-chart-36-settled"
/** Bars morph from their own top-left corner in plot coordinates. */
export const FLIP_ORIGIN: CSSProperties = {
  transformBox: "view-box",
  transformOrigin: "0 0",
}

/** A reveal's start, and the animations held until it is set. */
export type RevealClock = { at: number | null; waiting: Animation[] }

/** What the custom layers read, through context so the shape functions stay
 *  stable: an inline one would remount every bar per render. */
export type PlotScope = {
  rows: Period[]
  id: string
  target: boolean
  /** Biên lợi nhuận để ngang thuê dài hạn; null = không vẽ mốc. */
  targetMargin: number | null
  targetLabel: string
  money: (value: number) => string
  joinReveal: (animation: Animation) => void
  host: RefObject<HTMLDivElement | null>
  layer: RefObject<SVGGElement | null>
  morph: RefObject<Morph | null>
}
export const PlotContext = createContext<PlotScope | null>(null)

/** Pins the element's CSS animation to the reveal's clock as it attaches,
 *  before paint, so no frame shows it unpinned. */
export function useRevealRef() {
  const scope = useContext(PlotContext)
  const join = scope?.joinReveal
  const host = scope?.host
  // Mã gốc của @reui/chart-36: callback ref đọc host.current lúc gắn node. Giữ
  // nguyên useCallback (đổi danh tính ref mỗi render sẽ ghim lại animation).
  return useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (node: SVGGElement | null) => {
      // After the reveal the sheet drops these keyframes; skip the lookup,
      // which flushes style for every element that mounts.
      if (!node || !join || host?.current?.hasAttribute(SETTLED)) return
      for (const animation of node.getAnimations()) {
        if (animation instanceof CSSAnimation) join(animation)
      }
    },
    [join, host]
  )
}


/** Round ticks from zero; the domain leaves the plot's top to the lane.
 *  Bước "đẹp" theo bậc độ lớn (1/2/2,5/5 × 10^k) — số tiền VND lên tới tỷ. */
export function moneyAxis(rows: Period[]) {
  const max = Math.max(
    1,
    ...rows.map((row) => Math.max(row.revenue, row.expenses))
  )
  const power = 10 ** Math.floor(Math.log10(max / 3))
  const step =
    [1, 2, 2.5, 5, 10].map((unit) => unit * power).find((size) => max / size <= 3) ??
    10 * power
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let tick = 0; tick <= top; tick += step) ticks.push(tick)
  const domain: [number, number] = [0, top / BAR_SHARE]
  return { ticks, domain }
}

/** The reveal's clock, shared by every layer: unset until its first smooth
 *  frame, when every animation waiting on it starts together. */
export function useRevealClock(host: RefObject<HTMLDivElement | null>) {
  const clock = useRef<RevealClock | null>(null)
  return useCallback((animation: Animation) => {
    // Frozen demo guard: ?demo=frozen pins the demo, so it lands settled.
    if (document.documentElement.dataset.demo === "frozen") {
      animation.finish()
      return
    }
    let current = clock.current
    if (!current) {
      const next: RevealClock = { at: null, waiting: [] }
      clock.current = current = next
      onSmoothFrame((at) => {
        next.at = at
        for (const waiting of next.waiting) waiting.startTime = at
        next.waiting = []
        window.setTimeout(
          () => host.current?.setAttribute(SETTLED, ""),
          REVEAL_MS
        )
      })
    }
    // Held at its first frame, so a bar waits hidden on the zero line; a
    // bar mounted after the reveal lands settled.
    if (current.at === null) {
      animation.pause()
      current.waiting.push(animation)
    } else animation.startTime = current.at
    // host là ref ổn định: thêm vào deps không đổi danh tính hàm.
  }, [host])
}
