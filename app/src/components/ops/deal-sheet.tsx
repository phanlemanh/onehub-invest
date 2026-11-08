"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, PhoneIcon, XIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canCungTieuChi, type DealHang } from "@/lib/deals-chi-tiet"
import { fmtCompact, fmtInt, fmtVnDate } from "@/lib/format"

import { DealBody } from "./deal-body"
import { DealSimilar } from "./deal-similar"
import { DiscountBar } from "./deals-cells"

/**
 * Sheet một căn: khuôn record-sheet / review-detail-sheet của kho (đầu, thân cuộn, chân ghim), khối giá lấy ý
 * @reui/solution-crm-4. Hai tab: đủ thông tin một căn · căn cùng tiêu chí. Đầu sheet ghim giá nên đổi tab vẫn thấy căn đang xem.
 */
const trM2 = (v: number | null) => (v ? `${fmtInt(v / 1e6)} tr/m²` : null)

export function DealSheet({ d, rows, xemNoiDung, mayThu, viTri, tong, onChuyen, onMoCan, onOpenChange, choGhep }: {
  d: DealHang | null
  /** Thẻ Ghép căn còn chờ của căn đang mở (OD1 · ĐC7). */
  choGhep?: number[]
  rows: DealHang[]
  xemNoiDung: boolean
  mayThu: boolean
  /** Vị trí trong thứ tự bảng đang thấy; −1 khi căn mở từ danh sách cùng tiêu chí nằm ngoài lọc đang bật. */
  viTri: number
  tong: number
  onChuyen: (buoc: 1 | -1) => void
  onMoCan: (id: string) => void
  onOpenChange: (open: boolean) => void
}) {
  // Giữ tab khi chuyển căn: đang duyệt so sánh thì căn kế vẫn ở tab so sánh.
  const [tab, setTab] = useState<"chi-tiet" | "cung-tieu-chi">("chi-tiet")
  const soCung = d ? canCungTieuChi(d, rows).can.length : 0
  return (
    <Sheet open={d !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest?.("input, textarea, [contenteditable]")) return
          if (e.key === "j") onChuyen(1)
          if (e.key === "k") onChuyen(-1)
        }}
      >
        {d && (
          <>
            <SheetHeader className="gap-3 border-b pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <SheetTitle>{d.ten}</SheetTitle>
                  <SheetDescription className="text-xs tabular-nums">
                    {d.source} · thấy {fmtVnDate(d.firstSeen)} · đăng {fmtInt(d.nReposts)} lần
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {viTri >= 0 && <span className="text-muted-foreground px-1 text-xs tabular-nums">{viTri + 1}/{tong}</span>}
                  <Button variant="ghost" size="icon-sm" aria-label="Căn trước (phím K)" disabled={viTri <= 0} onClick={() => onChuyen(-1)}>
                    <ChevronUpIcon aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Căn kế (phím J)" disabled={viTri < 0 || viTri >= tong - 1} onClick={() => onChuyen(1)}>
                    <ChevronDownIcon aria-hidden />
                  </Button>
                  <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Đóng" />}>
                    <XIcon aria-hidden />
                  </SheetClose>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">{d.priceVnd === null ? "—" : fmtCompact(d.priceVnd)}</span>
                <span className="text-muted-foreground text-sm tabular-nums">{trM2(d.pricePerm2)}</span>
                {d.suspect && <Badge variant="warning-light">Cần xác minh</Badge>}
              </div>
              <DiscountBar d={d} />
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList variant="line" className="justify-start gap-5">
                  <TabsTrigger value="chi-tiet" className="flex-none px-1 text-sm">Chi tiết</TabsTrigger>
                  <TabsTrigger value="cung-tieu-chi" className="flex-none gap-1.5 px-1 text-sm">
                    Căn cùng tiêu chí
                    <Badge variant="outline" radius="full" className="tabular-nums">{soCung}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </SheetHeader>
            {/* key theo căn: đổi căn thì về đầu thân cuộn và trả lại trạng thái nới tiêu chí. */}
            <ScrollArea key={d.offerId} className="min-h-0 flex-1">
              {tab === "chi-tiet" ? <DealBody d={d} xemNoiDung={xemNoiDung} mayThu={mayThu} beMat="sheet" choGhep={choGhep} /> : <DealSimilar d={d} rows={rows} onMo={onMoCan} />}
            </ScrollArea>
            {xemNoiDung && (
              <SheetFooter className="flex-row items-center justify-between gap-3 border-t">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium" translate="no">{d.sellerName ?? "Người đăng chưa có tên"}</span>
                  <span className="text-muted-foreground truncate text-xs tabular-nums">{d.brokerNAds ? `${fmtInt(d.brokerNAds)} tin` : "Chưa rõ số tin"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="Mở trang một căn" nativeButton={false} render={<Link prefetch={false} href={`/ops/deals/${encodeURIComponent(d.offerId)}`} />}>
                    <ExternalLinkIcon aria-hidden />
                  </Button>
                  {d.tel && d.sdt ? (
                    <Button className="tabular-nums" nativeButton={false} render={<a href={d.tel} />}>
                      <PhoneIcon aria-hidden="true" />
                      <span translate="no">{d.sdt}</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa có SĐT</span>
                  )}
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
