"use client"

import { InfoIcon, PieChartIcon } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import { swatchOf, themeOf } from "@/components/charts/palette"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { KindMix } from "@/lib/data-flow-queries"
import { fmtCompact, fmtInt, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * «Loại giao dịch» — chuyển thể acquisition-mix-chart của @reui/solution-analytics-3: tổng + bánh cơ cấu + dòng chú
 * thích. Khác bản gốc: bỏ tab kỳ (khoảng ở đầu trang), ô icon là IconTile (bản gốc tự tô bóng), chú giải có số.
 */

const config = {
  value: { label: "Số bản ghi" },
  sale: { label: "Bán", theme: themeOf("kindSale") },
  rentLt: { label: "Cho thuê dài hạn", theme: themeOf("kindRentLt") },
  shortStay: { label: "Thuê ngắn hạn", theme: themeOf("kindShortStay") },
} satisfies ChartConfig

const KEYS = ["sale", "rentLt", "shortStay"] as const
const SWATCH = { sale: swatchOf("kindSale"), rentLt: swatchOf("kindRentLt"), shortStay: swatchOf("kindShortStay") }

export function KindMixChart({ mix }: { mix: KindMix }) {
  const total = mix.sale + mix.rentLt + mix.shortStay
  const data = KEYS.filter((k) => mix[k] > 0).map((k) => ({ kind: k, value: mix[k], fill: `var(--color-${k})` }))

  return (
    <Frame className="flex h-full w-full flex-col">
      <FrameHeader>
        <FrameTitle>Loại giao dịch</FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <IconTile variant="frame" size="default" aria-hidden="true">
            <PieChartIcon />
          </IconTile>
          <div className="flex flex-col gap-0.5">
            <div className="text-muted-foreground text-sm font-medium">Tin rao và listing</div>
            <div className="text-2xl font-semibold tabular-nums">{fmtInt(total)}</div>
          </div>
        </div>

        {total === 0 ? (
          <p className="text-muted-foreground px-2 text-sm">Chưa có tin nào trong khoảng này.</p>
        ) : (
          <ChartContainer config={config} className="mx-auto aspect-square max-h-50 w-full overflow-visible">
            <PieChart className="overflow-visible">
              <ChartTooltip content={<ChartTooltipContent nameKey="kind" hideLabel />} />
              <Pie
                data={data}
                innerRadius={35}
                outerRadius={100}
                dataKey="value"
                nameKey="kind"
                strokeWidth={4}
                stroke="var(--background)"
                cornerRadius={8}
                paddingAngle={2}
                isAnimationActive={false}
              >
                <LabelList dataKey="value" stroke="none" fontSize={12} fontWeight={600} fill="white" formatter={(v) => (Number(v) / total < 0.05 ? "" : fmtCompact(Number(v)))} />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        <ul className="flex flex-col gap-1.5 px-2 text-sm">
          {KEYS.map((k) => (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-2">
                <span aria-hidden="true" className={cn("size-2 rounded-full", SWATCH[k])} />
                {config[k].label}
              </span>
              <span className="tabular-nums">
                {fmtInt(mix[k])}
                <span className="text-muted-foreground ms-2 text-xs">{total > 0 ? fmtPct(mix[k] / total, 0) : "—"}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="text-muted-foreground mt-auto flex items-start gap-2 px-2 text-xs">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>Ngắn hạn là listing S01, chưa ghép vào căn.</span>
        </div>
      </FramePanel>
    </Frame>
  )
}
