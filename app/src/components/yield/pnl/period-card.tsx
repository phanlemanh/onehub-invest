import { useContext } from "react"
import { Badge } from "@/components/reui/badge"
import { type TooltipContentProps } from "recharts"

import { ChartTooltipContent } from "@/components/ui/chart"
import { CAP_BOX } from "@/components/charts/faces"
import { TREND_ICONS } from "@/components/charts/icons"
import { TooltipRow } from "@/components/charts/tooltip-row"

import { CHART_CONFIG, type Period } from "./data"
import { formatPercent, periodTitle } from "./format"
import { PlotContext, type BarKey } from "./plot-scope"
import { LineKey, SeriesDot } from "./value-faces"

function PeriodCard({
  active,
  payload,
}: Partial<Pick<TooltipContentProps, "active" | "payload">>) {
  const money = useContext(PlotContext)?.money ?? String
  const row: Period | undefined = payload?.[0]?.payload
  const items =
    payload?.filter(
      (item) => item.dataKey === "revenue" || item.dataKey === "expenses"
    ) ?? []
  if (!active || !row || items.length === 0) return null
  return (
    <ChartTooltipContent
      active
      payload={items}
      className="w-auto min-w-48"
      labelFormatter={() => (
        <span className="flex h-5 items-center justify-between gap-3">
          <span className={CAP_BOX}>{periodTitle(row)}</span>
          {row.forecast ? <Badge variant="outline">Ước tính</Badge> : null}
        </span>
      )}
      formatter={(value, name, _item, index) => {
        const key: BarKey = name === "expenses" ? "expenses" : "revenue"
        return (
          <div className="flex flex-1 flex-col gap-1.5">
            <TooltipRow
              glyph={<SeriesDot series={key} />}
              label={CHART_CONFIG[key].label}
              value={money(Number(value))}
            />
            {index === items.length - 1 ? (
              <div className="flex flex-col gap-1.5 border-t pt-1.5">
                <TooltipRow
                  glyph={row.net >= 0 ? TREND_ICONS.up : TREND_ICONS.down}
                  label="Thu nhập ròng"
                  value={money(row.net)}
                />
                <TooltipRow
                  glyph={<LineKey />}
                  label="Biên lợi nhuận"
                  value={formatPercent(row.margin)}
                />
              </div>
            ) : null}
          </div>
        )
      }}
    />
  )
}

// A stable element: a function content would remount the card every render.
export const PERIOD_CARD = <PeriodCard />
