"use client"

import { useState } from "react"
import { ImageOffIcon } from "lucide-react"

import { Progress, ProgressLabel } from "@/components/ui/progress"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "cn"
import { type DealHang, NGHI_NGO_PCT, NGUONG_LOAI_PCT, soPct } from "@/lib/deals-chi-tiet"
import { fmtInt } from "@/lib/format"

/** Trục thanh giảm: 0 tới 50%, ngưỡng loại của ON11; vạch là ngưỡng cần xác minh. */
const TRUC_PCT = NGUONG_LOAI_PCT

/** Mức giảm so thước: mẫu MetricBarCell của kho (@reui/data-grid-base-2) cộng vạch ngưỡng (@reui/data-grid-advanced-1). */
export function DiscountBar({ d, gon = false }: { d: DealHang; gon?: boolean }) {
  const pct = d.discountPct ?? 0
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("shrink-0 text-end font-medium tabular-nums", gon ? "w-10 text-sm" : "text-sm")}>−{soPct(pct)}%</span>
        <div className="relative min-w-12 flex-1">
          <Progress
            value={(pct / TRUC_PCT) * 100}
            className={cn(
              "flex-row flex-nowrap items-center **:data-[slot=progress-track]:flex-1",
              d.suspect ? "**:data-[slot=progress-indicator]:bg-warning" : "**:data-[slot=progress-indicator]:bg-success",
            )}
          >
            <ProgressLabel className="sr-only">Mức giảm so thước phường</ProgressLabel>
          </Progress>
          <span aria-hidden="true" data-vach-nguong={NGHI_NGO_PCT} className="bg-foreground/50 absolute -inset-y-0.5 w-px" style={{ left: `${(NGHI_NGO_PCT / TRUC_PCT) * 100}%` }} />
        </div>
      </div>
      <span className="text-muted-foreground truncate text-xs tabular-nums">
        Thước {d.medianPerm2 ? `${fmtInt(d.medianPerm2 / 1e6)} tr/m²` : "—"} · {d.rulerN ? `${fmtInt(d.rulerN)} tin` : "—"}
      </span>
    </div>
  )
}

function OTrong({ nhan, ...attrs }: { nhan: string } & Record<`data-${string}`, boolean>) {
  return (
    <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md" title={nhan} {...attrs}>
      <ImageOffIcon className="size-4" aria-hidden="true" />
      <span className="sr-only">{nhan}</span>
    </span>
  )
}

/** Ảnh đầu 40 px, rê chuột xem lớn: đủ để loại căn bằng mắt mà chưa phải mở sheet. Link gốc hết hạn thì ghi «Ảnh hỏng», không để ô trống. */
export function DealThumb({ d }: { d: DealHang }) {
  const anh = d.images[0]?.src
  const [hong, setHong] = useState<string | null>(null)
  if (!anh) return <OTrong nhan="Chưa có ảnh" data-deal-khong-anh />
  if (hong === anh) return <OTrong nhan="Ảnh hỏng" data-deal-anh-hong />
  return (
    <HoverCard>
      <HoverCardTrigger render={<span className="size-10 shrink-0 overflow-hidden rounded-md" />}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh qua route proxy của Ops, không qua next/image */}
        <img src={anh} alt="" loading="lazy" className="size-full object-cover" onError={() => setHong(anh)} />
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-72 p-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- như trên */}
        <img src={anh} alt="" className="aspect-3/2 w-full rounded-md object-cover" />
      </HoverCardContent>
    </HoverCard>
  )
}
