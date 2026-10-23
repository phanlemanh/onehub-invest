import { useContext } from "react"
import { Badge } from "@/components/reui/badge"
import { type TooltipContentProps } from "recharts"

import { ChartTooltipContent } from "@/components/ui/chart"
import { CAP_BOX, KeyDot } from "@/components/charts/faces"
import { TooltipRow } from "@/components/charts/tooltip-row"

import { swatchOfMetric } from "./data"
import { formatLongMonth } from "./format"
import { PlotContext } from "./plot-scope"
import { annotationOn, type PlotRow } from "./series"

/** The read month: its name, any event in it, and the figure. */
export function Readout({
  active,
  payload,
}: Partial<Pick<TooltipContentProps, "active" | "payload">>) {
  const scope = useContext(PlotContext)
  const row: PlotRow | undefined = payload?.[0]?.payload
  if (!active || !row || !scope || !payload) return null
  const { metric, format } = scope
  const event = annotationOn(row.day)
  return (
    <ChartTooltipContent
      active
      payload={payload}
      className="min-w-52 gap-2"
      labelFormatter={() => (
        <span className="flex h-5 items-center justify-between gap-4">
          <span className={CAP_BOX}>{formatLongMonth(row.day)}</span>
          {event ? <Badge variant="outline">{event.label}</Badge> : null}
        </span>
      )}
      formatter={() => (
        <div className="flex flex-1 flex-col gap-1.5">
          <TooltipRow
            glyph={<KeyDot swatch={swatchOfMetric(metric)} />}
            label={metric.label}
            value={format.value(metric.key, row.current)}
            className="gap-6"
          />
        </div>
      )}
    />
  )
}
