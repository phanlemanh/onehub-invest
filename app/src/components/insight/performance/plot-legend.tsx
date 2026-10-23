import { cn } from "cn"

import { CAP_BOX, Fact, KeyDot } from "@/components/charts/faces"

import { swatchOfMetric, type MetricSpec, type ViewState } from "./data"
import { formatSpan, type Formatters } from "./format"
import { averageOf, type PlotRow } from "./series"
import { AverageKey } from "./value-faces"

/** What the plot measures on the left; its span and average on the right. */
export function PlotLegend({
  metric,
  rows,
  view,
  format,
}: {
  metric: MetricSpec
  rows: PlotRow[]
  view: ViewState
  format: Formatters
}) {
  const first = rows[0]?.day ?? 0
  const last = rows.at(-1)?.day ?? 0
  const average = averageOf(rows)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
      <Fact className="text-muted-foreground">{metric.basis}</Fact>
      <ul
        aria-label="Chú giải"
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        <li className="flex h-4 items-center gap-1.5">
          <KeyDot swatch={swatchOfMetric(metric)} />
          <span className={cn(CAP_BOX, "tabular-nums")}>
            {formatSpan(first, last)}
          </span>
        </li>
        {view.average ? (
          <li className="text-muted-foreground flex h-4 items-center gap-1.5">
            <AverageKey />
            <span className={cn(CAP_BOX, "tabular-nums")}>
              TB {format.value(metric.key, average)}
            </span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
