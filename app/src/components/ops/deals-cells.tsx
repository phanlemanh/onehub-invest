"use client"

import { useState } from "react"
import { ImageOffIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "cn"
import { chuGiaM2, chuLyDo, chuMatBang, type DealHang, NGHI_NGO_PCT, NGUONG_LOAI_PCT, NHAN_HANG, soPctVi } from "@/lib/deals-chi-tiet"
import { fmtInt } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

/** Trục thanh giảm: 0 tới 50%, ngưỡng loại của ON11; vạch là ngưỡng cần xác minh. */
const TRUC_PCT = NGUONG_LOAI_PCT

/** Nhãn hạng và nhóm so sánh của một dòng (CG3): nhãn, tên nhóm, số căn trong nhóm, lý do lùi cấp, độ tin. */
export function DealHangNhom({ d }: { d: DealHang }) {
  const r = d.rank
  if (!r) return null
  const nhom = r.level === "du_an" ? r.nodeName?.trim() || "Cùng dự án" : d.phuong ?? "Cùng phường"
  // Chữ lý do viết cho cấp phường; dòng cấp dự án phải nói đúng nhóm của nó.
  const lyDo = r.reason ? (r.level === "du_an" ? chuLyDo(r.reason).replace("trong phường", "trong dự án") : chuLyDo(r.reason)) : null
  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5" data-deal-hang={r.label ?? ""} data-deal-cap={r.level ?? ""}>
      {r.label && <Badge variant={r.label === "gia-tot" ? "success-light" : "info-light"}>{NHAN_HANG[r.label] ?? r.label}</Badge>}
      <span className="text-muted-foreground flex max-w-full min-w-0 gap-1 text-xs tabular-nums" title={nhom}>
        <span className="truncate">{nhom}</span>
        {r.n !== null && <span className="shrink-0">· {fmtInt(r.n)} căn</span>}
      </span>
      {lyDo && <span className="text-muted-foreground max-w-full truncate text-xs" title={lyDo} data-deal-ly-do={r.reason}>{lyDo}</span>}
      <span className="text-muted-foreground text-xs" data-deal-do-tin={d.confidence}>Độ tin: {(LABELS_VI.confidence as Record<string, string>)[d.confidence] ?? d.confidence}</span>
    </div>
  )
}

/** Mức giảm so thước: mẫu MetricBarCell của kho (@reui/data-grid-base-2) cộng vạch ngưỡng (@reui/data-grid-advanced-1). */
export function DiscountBar({ d, gon = false, donViCan = false }: { d: DealHang; gon?: boolean; donViCan?: boolean }) {
  const pct = d.discountPct ?? 0
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("shrink-0 text-end font-medium tabular-nums", gon ? "w-12 text-sm" : "text-sm")}>−{soPctVi(pct)}%</span>
        <div className="relative min-w-12 flex-1">
          <Progress
            value={(pct / TRUC_PCT) * 100}
            className={cn(
              "flex-row flex-nowrap items-center **:data-[slot=progress-track]:flex-1",
              d.suspect ? "**:data-[slot=progress-indicator]:bg-warning" : "**:data-[slot=progress-indicator]:bg-success",
            )}
          >
            <ProgressLabel className="sr-only">Mức thấp hơn trung vị nhóm</ProgressLabel>
          </Progress>
          <span aria-hidden="true" data-vach-nguong={NGHI_NGO_PCT} className="bg-foreground/50 absolute -inset-y-0.5 w-px" style={{ left: `${(NGHI_NGO_PCT / TRUC_PCT) * 100}%` }} />
        </div>
      </div>
      <span className="text-muted-foreground truncate text-xs tabular-nums">
        {d.rank?.metric === "gia-thang-pn" && d.rank.median
          ? `Trung vị ${fmtInt(d.rank.median / 1e6)} tr/tháng · ${d.rank.n ? fmtInt(d.rank.n) : "—"} căn`
          : <>Thước {d.medianPerm2 ? chuGiaM2(d.medianPerm2) : "—"} · {d.rulerN ? `${fmtInt(d.rulerN)} ${donViCan ? "căn" : "tin"}` : "—"}</>}
      </span>
      {d.matBang && (
        <span className="text-muted-foreground truncate text-xs tabular-nums" data-deal-mat-bang={d.matBang.trangThai}>
          {chuMatBang(d.matBang, d.rank?.metric ?? null)}
        </span>
      )}
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
