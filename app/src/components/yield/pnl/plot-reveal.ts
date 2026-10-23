/** Nhịp hiện dần của chart-36: keyframes, độ trễ, khung mượt đầu tiên. */
export const OUT = "cubic-bezier(0.23, 1, 0.32, 1)"
export const IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)"

/** The reveal: columns rise in date order as the margin line draws across. */
const RISE_MS = 420
const SWEEP_MS = 320
const STAGGER_MAX_MS = 40
export const EXPENSE_LAG_MS = 50
const DRAW_DELAY_MS = 120
const DRAW_MS = 640
const LAND_DELAY_MS = DRAW_DELAY_MS + DRAW_MS - 80
const FADE_DELAY_MS = 200
/** Past this from the reveal's start, every reveal animation has landed. */
export const REVEAL_MS = 1000

/** Reduced motion keeps a short fade and drops the movement. */
export const PLOT_STYLE = `
@keyframes chart-36-rise { from { transform: scaleY(0); } }
@keyframes chart-36-draw { from { clip-path: inset(0 100% 0 0); } }
@keyframes chart-36-land { from { opacity: 0; transform: scale(0.6); } }
@keyframes chart-36-fade { from { opacity: 0; } }
[data-chart-36-rise] { animation: chart-36-rise ${RISE_MS}ms ${OUT} var(--chart-36-delay, 0ms) backwards; }
[data-chart-36-draw] { animation: chart-36-draw ${DRAW_MS}ms ${IN_OUT} ${DRAW_DELAY_MS}ms backwards; }
[data-chart-36-land] { animation: chart-36-land 200ms ${OUT} ${LAND_DELAY_MS}ms backwards; transform-box: fill-box; transform-origin: center; }
[data-chart-36-fade] { animation: chart-36-fade 240ms ${OUT} ${FADE_DELAY_MS}ms backwards; }
@media (prefers-reduced-motion: reduce) {
  :is([data-chart-36-rise], [data-chart-36-draw], [data-chart-36-land], [data-chart-36-fade]) { animation: chart-36-fade 200ms ${OUT} backwards; }
}
[data-chart-36-settled] :is([data-chart-36-rise], [data-chart-36-draw], [data-chart-36-land], [data-chart-36-fade]) { animation: none; }
[data-chart-36-reading] [data-chart-36-col]:not([data-chart-36-lit]) { opacity: 0.3; }
:is([data-chart-36-band], [data-chart-36-dot]):not([data-chart-36-lit]) { opacity: 0; }
`

/** The delay between two columns' rises: 4 to 12 columns share one sweep. */
export const staggerOf = (count: number) =>
  Math.min(STAGGER_MAX_MS, SWEEP_MS / Math.max(1, count - 1))

/** The mount's own frame runs long, so the reveal starts on the first frame
 *  that follows its predecessor within this, or after a few frames. */
const SMOOTH_FRAME_MS = 50
const MAX_WAIT_FRAMES = 6
const FALLBACK_MS = 1000

/** Calls back with the time of the first smooth frame after this one. */
export function onSmoothFrame(start: (at: number) => void) {
  let started = false
  let last: number | undefined
  let frames = 0
  const fire = (at: number) => {
    if (started) return
    started = true
    start(at)
  }
  const tick = (at: number) => {
    frames += 1
    const smooth = last !== undefined && at - last < SMOOTH_FRAME_MS
    if (smooth || frames >= MAX_WAIT_FRAMES) return fire(at)
    last = at
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  window.setTimeout(() => fire(performance.now()), FALLBACK_MS)
}
