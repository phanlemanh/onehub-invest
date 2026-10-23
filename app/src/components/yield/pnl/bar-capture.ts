import { type Period } from "./data"
import { OUT } from "./plot-reveal"

const FADE_OUT_MS = 160

export type Box = { x: number; y: number; width: number; height: number }

/** The last layout's bars, kept for the regroup that replaces them. */
export type Morph = { at: number; from: Map<string, Box>; reduce: boolean }

/** A bar's identity across layouts: its series and the months it covers. */
export const barId = (series: string, start: number, months: number) =>
  `${series}:${start}:${months}`

/** The old layer that fades out above the new layout. */
export const FADING = "[data-chart-36-lane], .recharts-cartesian-axis-tick-labels"

function boxOf(node: Element, origin: DOMRect): Box {
  const rect = node.getBoundingClientRect()
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  }
}

/** Whether a new bar grows from this old one: the same months, or the
 *  middle month of the quarter it joins. */
function continues(next: Period[], start: number, months: number) {
  return next.some(
    (row) =>
      (row.start === start && row.months === months) ||
      (months === 1 &&
        row.months > 1 &&
        row.start + Math.floor(row.months / 2) === start)
  )
}

/** A still copy of an element as it looks now, mid-animation included,
 *  stripped of the hooks that would animate or light it again. Reads only. */
function freeze(node: Element) {
  const copy = node.cloneNode(true)
  if (!(copy instanceof SVGElement)) return null
  const live = [node, ...node.querySelectorAll("*")]
  const still = [copy, ...copy.querySelectorAll("*")]
  live.forEach((source, index) => {
    const target = still[index]
    if (!(target instanceof SVGElement)) return
    const hooks = target
      .getAttributeNames()
      .filter((name) => name.startsWith("data-chart-36-"))
    // Only the block's own hooked elements ever carry a transform.
    if (hooks.length > 0) {
      const { transform } = getComputedStyle(source)
      if (transform !== "none") target.style.transform = transform
    }
    for (const name of hooks) target.removeAttribute(name)
  })
  // Out of the fade-in's reach, which finds the live axis labels by class.
  copy.classList.remove("recharts-cartesian-axis-tick-labels")
  return copy
}

function fadeOut(layer: SVGGElement, copy: SVGElement, blur: boolean) {
  layer.append(copy)
  // The blur blends the outgoing line into the incoming one.
  const frames = blur
    ? [
        { opacity: 1, filter: "blur(0px)" },
        { opacity: 0, filter: "blur(2px)" },
      ]
    : [{ opacity: 1 }, { opacity: 0 }]
  copy
    .animate(frames, { duration: FADE_OUT_MS, easing: OUT, fill: "forwards" })
    .finished.then(
      () => copy.remove(),
      () => copy.remove()
    )
}

/** Measures every bar where it stands, and fades out a copy of each old bar
 *  no new one grows from, of the margin lane and of the axis labels. */
export function captureMorph(
  svg: SVGSVGElement,
  layer: SVGGElement,
  next: Period[]
): Morph {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  // A regroup mid-morph starts over from what is on screen now.
  layer.replaceChildren()
  // Every read first, then every write, so the page lays out once.
  const origin = svg.getBoundingClientRect()
  const from = new Map<string, Box>()
  const leaving: { copy: SVGElement; blur: boolean }[] = []
  for (const bar of svg.querySelectorAll("[data-chart-36-bar]")) {
    const id = bar.getAttribute("data-chart-36-bar") ?? ""
    const [, start, months] = id.split(":").map(Number)
    from.set(id, boxOf(bar, origin))
    const copy = continues(next, start, months) ? null : freeze(bar)
    if (copy) leaving.push({ copy, blur: false })
  }
  for (const group of svg.querySelectorAll(FADING)) {
    const copy = freeze(group)
    const blur = !reduce && group.hasAttribute("data-chart-36-lane")
    if (copy) leaving.push({ copy, blur })
  }
  for (const { copy, blur } of leaving) fadeOut(layer, copy, blur)
  return { at: performance.now(), from, reduce }
}
