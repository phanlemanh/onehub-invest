import { cn } from "cn"

import { KeyDot } from "@/components/charts/faces"

import { SWATCHES, type SeriesKey } from "./data"

export function SeriesDot({ series }: { series: SeriesKey }) {
  return <KeyDot swatch={SWATCHES[series]} />
}

/** The margin line's key: a short stroke with a dot at its end. */
export function LineKey() {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      <span className={cn("h-0.5 w-2.5 rounded-full", SWATCHES.margin)} />
      <span className={cn("-ms-0.5 size-1.5 rounded-full", SWATCHES.margin)} />
    </span>
  )
}

/** The target's key: a short dashed stroke. */
export function TargetKey() {
  return (
    <span
      aria-hidden="true"
      className="border-muted-foreground/70 w-3 shrink-0 border-t-2 border-dashed"
    />
  )
}
