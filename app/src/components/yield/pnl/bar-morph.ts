import { barId, FADING, type Box, type Morph } from "./bar-capture"
import { type Period } from "./data"
import { IN_OUT, OUT } from "./plot-reveal"

/** Under 300ms, eased in and out: every bar is already on screen. */
const MORPH_MS = 280
/** An entering bar waits for the slides to clear its slot, ending with them. */
const ENTER_DELAY_MS = 80
const FADE_IN_MS = 220
const FADE_IN_DELAY_MS = 60
/** A bar laid out again this soon after a regroup morphs; later, it snaps. */
const MORPH_WINDOW_MS = 600

const live = (morph: Morph | null): morph is Morph =>
  morph !== null && performance.now() - morph.at < MORPH_WINDOW_MS

/** Where a new bar was: itself, the middle month its quarter absorbed, or
 *  the quarter it split from. */
export function sourceOf(
  morph: Morph | null,
  series: string,
  row: Period
): Box | undefined {
  if (!morph) return undefined
  const { from } = morph
  return (
    from.get(barId(series, row.start, row.months)) ??
    (row.months > 1
      ? from.get(barId(series, row.start + Math.floor(row.months / 2), 1))
      : from.get(barId(series, row.start - (row.start % 3), 3)))
  )
}

/** Each bar's running morph, kept here: asking the element for its
 *  animations, or measuring it, would flush style once per bar. */
type Flip = { from: Box; to: Box; animation: Animation }
const flips = new WeakMap<Element, Flip>()

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Where a morphing bar is now, from its eased progress: the slide is
 *  linear in its box, so no layout read is needed. */
function boxNow({ from, to, animation }: Flip): Box {
  const t = animation.effect?.getComputedTiming().progress ?? 0
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  }
}

/** Slides and scales a bar from its source box into its new one, or grows
 *  it from the zero line when it has none. Transform only. */
export function morphBar(
  node: SVGGElement,
  morph: Morph | null,
  to: Box,
  source: Box | undefined
) {
  if (!live(morph) || to.width <= 0 || to.height <= 0) return
  const running = flips.get(node)
  // Interrupted mid-slide, or laid out again by Recharts' second pass, it
  // carries on from where it is.
  const current =
    running?.animation.playState === "running" ? boxNow(running) : source
  running?.animation.cancel()
  if (morph.reduce) {
    const fade = [{ opacity: 0 }, { opacity: 1 }]
    node.animate(fade, { duration: FADE_IN_MS, easing: OUT })
    return
  }
  // With nothing to come from, it grows out of the zero line.
  const from = current ?? { ...to, y: to.y + to.height, height: 0 }
  const scaleX = from.width / to.width
  const scaleY = Math.max(from.height / to.height, 0.001)
  const dx = from.x - scaleX * to.x
  const dy = from.y - scaleY * to.y
  const still =
    Math.abs(dx) < 0.5 &&
    Math.abs(dy) < 0.5 &&
    Math.abs(scaleX - 1) < 0.01 &&
    Math.abs(scaleY - 1) < 0.01
  if (still) return
  const frames = [
    { transform: `matrix(${scaleX}, 0, 0, ${scaleY}, ${dx}, ${dy})` },
    { transform: "none" },
  ]
  // Entering eases out; a bar already on screen eases in and out.
  const timing: KeyframeAnimationOptions = current
    ? { duration: MORPH_MS, easing: IN_OUT }
    : {
        duration: MORPH_MS - ENTER_DELAY_MS,
        delay: ENTER_DELAY_MS,
        easing: OUT,
        fill: "backwards",
      }
  const animation = node.animate(frames, timing)
  flips.set(node, { from, to, animation })
}

/** Fades the new margin lane and axis labels in under the outgoing copies. */
export function fadeInLayers(host: HTMLElement, morph: Morph | null) {
  if (!live(morph)) return
  for (const group of host.querySelectorAll(FADING)) {
    group.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: FADE_IN_MS,
      delay: FADE_IN_DELAY_MS,
      easing: OUT,
      fill: "backwards",
    })
  }
}
