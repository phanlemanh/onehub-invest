import { useEffect, useSyncExternalStore } from "react"
import { useActiveTooltipLabel, usePlotArea } from "recharts"

export type PlotSpan = { x: number; width: number }

const noSubscribe = () => () => {}

/** Frozen demo guard for chart motion: ?demo=frozen draws charts settled. */
export function useDemoFrozen() {
  return useSyncExternalStore(
    noSubscribe,
    () => document.documentElement.dataset.demo === "frozen",
    () => false
  )
}

/** Reports the point the pointer or keyboard is on. onChange sets the chart
 *  owner's state on every hover, so keep the BarChart in a memo child. */
export function ActiveLabelReporter({
  onChange,
}: {
  onChange: (label: string | null) => void
}) {
  const label = useActiveTooltipLabel()
  useEffect(() => {
    onChange(label === undefined || label === null ? null : String(label))
  }, [label, onChange])
  return null
}

/** Reports where the plot is drawn, so a pointer maps to a point itself. */
export function PlotAreaReporter({
  onChange,
}: {
  onChange: (span: PlotSpan | null) => void
}) {
  const plot = usePlotArea()
  const x = plot?.x
  const width = plot?.width
  useEffect(() => {
    onChange(x === undefined || width === undefined ? null : { x, width })
  }, [x, width, onChange])
  return null
}