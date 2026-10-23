import { Badge } from "@/components/reui/badge"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { fmtInt } from "@/lib/format"
import { CAP_BOX, CAP_TRUNCATE } from "@/components/charts/faces"
import { CHART_ICONS } from "@/components/charts/icons"

import { SliceDot } from "./value-faces"
import { type Slice } from "./view"

export function InfoTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Về cơ cấu doanh thu"
            className="text-muted-foreground -my-1"
          />
        }
      >
        {CHART_ICONS.info}
      </TooltipTrigger>
      <TooltipContent side="top">
        Tổng giá niêm yết các đêm đã đặt, chia theo loại phòng Airbnb.
      </TooltipContent>
    </Tooltip>
  )
}

/** The room types on one shared grid, so amounts and shares line up. */
export function SliceLegend({
  slices,
  format,
}: {
  slices: Slice[]
  format: (v: number) => string
}) {
  return (
    <ul
      aria-label="Doanh thu theo loại phòng"
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 divide-y @max-sm:grid-cols-[minmax(0,1fr)_auto_auto]"
    >
      {slices.map((slice) => (
        <li
          key={slice.key}
          className="col-span-full grid h-11 grid-cols-subgrid items-center"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <SliceDot slice={slice.key} />
            <span className={cn("min-w-0 text-sm font-medium", CAP_TRUNCATE)}>
              {slice.name}
            </span>
          </span>
          <span
            className={cn("text-end text-sm font-medium tabular-nums", CAP_BOX)}
          >
            {format(slice.amount)}
          </span>
          <span
            className={cn(
              "text-muted-foreground w-8 text-end text-xs tabular-nums @max-sm:hidden",
              CAP_BOX
            )}
          >
            {slice.share}%
          </span>
          <span className="flex justify-end">
            <Badge variant="outline" className="tabular-nums">
              <span className={CAP_BOX}>{fmtInt(slice.listings)} listing</span>
            </Badge>
          </span>
        </li>
      ))}
    </ul>
  )
}
