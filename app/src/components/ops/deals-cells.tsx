"use client"

import { ImageOffIcon } from "lucide-react"

import { Progress, ProgressLabel } from "@/components/ui/progress"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "cn"
import type { DealChiTiet } from "@/lib/deals-chi-tiet"
import { fmtInt } from "@/lib/format"

/** Một hàng của bảng Căn giá tốt: các chữ phải tính phía máy chủ vì lib/deals, lib/ops/people mang pg. */
export type DealHang = DealChiTiet & {
  ten: string
  thieu: string[]
  cau: string | null
  tel: string | null
  sdt: string | null
  xacMinhPct: number
  xemAnh: boolean
}

/** Trục thanh giảm: 0 tới 50%, ngưỡng loại của ON11; vạch là ngưỡng cần xác minh. */
const TRUC_PCT = 50

/** Mức giảm so thước: mẫu MetricBarCell của kho (@reui/data-grid-base-2) cộng vạch ngưỡng (@reui/data-grid-advanced-1). */
export function DiscountBar({ d, gon = false }: { d: DealHang; gon?: boolean }) {
  const pct = d.discountPct ?? 0
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("shrink-0 text-end font-medium tabular-nums", gon ? "w-10 text-sm" : "text-sm")}>−{pct.toFixed(0)}%</span>
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
          <span aria-hidden="true" className="bg-foreground/50 absolute -inset-y-0.5 w-px" style={{ left: `${(d.xacMinhPct / TRUC_PCT) * 100}%` }} />
        </div>
      </div>
      <span className="text-muted-foreground truncate text-xs tabular-nums">
        Thước {d.medianPerm2 ? `${fmtInt(d.medianPerm2 / 1e6)} tr/m²` : "—"} · {d.rulerN ? `${fmtInt(d.rulerN)} tin` : "—"}
      </span>
    </div>
  )
}

/** Ảnh đầu 40 px, rê chuột xem lớn: đủ để loại căn bằng mắt mà chưa phải mở sheet. */
export function DealThumb({ d }: { d: DealHang }) {
  const anh = d.images[0]?.src
  if (!anh) {
    return (
      <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md" title="Chưa có ảnh">
        <ImageOffIcon className="size-4" aria-hidden="true" />
      </span>
    )
  }
  return (
    <HoverCard>
      <HoverCardTrigger render={<span className="size-10 shrink-0 overflow-hidden rounded-md" />}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh qua route proxy của Ops, không qua next/image */}
        <img src={anh} alt="" loading="lazy" className="size-full object-cover" />
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-72 p-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- như trên */}
        <img src={anh} alt="" className="aspect-3/2 w-full rounded-md object-cover" />
      </HoverCardContent>
    </HoverCard>
  )
}
