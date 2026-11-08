"use client"

import type { ReactNode } from "react"
import { ChevronDownIcon, ChevronUpIcon, InboxIcon, KeyboardIcon, XIcon } from "lucide-react"

import { ReviewCard } from "@/components/ops/review-card"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import type { ReviewContext } from "@/lib/ops/review-context"
import type { ReviewMedia } from "@/lib/ops/review-media"
import type { ReviewItem } from "@/lib/ops/review-queue"

import { ReviewStatusBadge, ReviewTypeBadge } from "./review-badges"

/** Vị trí thẻ đang mở trong hàng của chế độ duyệt (OD2 · ĐC4). */
export type DieuHuong = {
  viTri: number
  tong: number
  nhan: string
  onTruoc: (() => void) | null
  onSau: (() => void) | null
  onPhim: () => void
}

/** Hết thẻ của hạng mục đang duyệt: nút sang hạng mục kế, không còn mục nào thì «Đóng». */
export type HetThe = { nhanKe: string | null; onKe: () => void }

/**
 * Sheet chi tiết một thẻ (chuyển thể request-detail-sheet của @reui/solution-agents-5): đầu = tên + badge,
 * thân cuộn = nội dung thẻ hiện có + dải ảnh tin, chân ghim = nút quyết định. Màn hẹp: toàn bề ngang.
 * `key` theo id để trạng thái chọn của thẻ xung đột (và đồng hồ thẻ OD1) không dính sang thẻ khác.
 * Chế độ duyệt (OD2): `dieuHuong` thêm thanh «k/N · hạng mục» + Trước/Sau + Phím tắt; quyết xong bên gọi đổi `item` sang
 * thẻ kế, sheet KHÔNG đóng. `het` (item null) giữ sheet mở với Empty «Hết thẻ chờ ở hạng mục này».
 */
export function ReviewDetailSheet({ item, media, context, onOpenChange, dieuHuong = null, het = null }: {
  item: ReviewItem | null
  media: ReviewMedia | undefined
  context?: ReviewContext
  onOpenChange: (open: boolean) => void
  dieuHuong?: DieuHuong | null
  het?: HetThe | null
}) {
  return (
    <Sheet open={item !== null || het !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        data-review-sheet
      >
        {item ? (
          <ReviewCard key={item.id} item={item} media={media} context={context}>
            {({ body, actions }) => (
              <>
                <SheetHeader className="gap-2 border-b">
                  {dieuHuong && <ThanhDieuHuong d={dieuHuong} />}
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle translate="no">{item.title}</SheetTitle>
                    {/* Nút đóng có nhãn tiếng Việt (nút mặc định của Sheet đọc «Close») — mẫu request-detail-sheet. */}
                    {!dieuHuong && <NutDong />}
                  </div>
                  <SheetDescription className="text-xs tabular-nums">
                    #{item.id} · {fmtVnDateTime(item.created_at)}
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewTypeBadge item={item} />
                    <ReviewStatusBadge item={item} />
                  </div>
                </SheetHeader>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="p-4">{body}</div>
                </ScrollArea>
                {actions && <SheetFooter className="border-t">{actions}</SheetFooter>}
              </>
            )}
          </ReviewCard>
        ) : het ? (
          <HetTheView het={het} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function NutDong() {
  return (
    <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Đóng" />}>
      <XIcon aria-hidden />
    </SheetClose>
  )
}

function ThanhDieuHuong({ d }: { d: DieuHuong }) {
  return (
    <div className="flex items-center justify-between gap-2" data-review-dieu-huong>
      <span className="text-muted-foreground min-w-0 truncate text-xs tabular-nums" data-review-vi-tri>
        {fmtInt(d.viTri)}/{fmtInt(d.tong)} · {d.nhan}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={d.onTruoc ?? undefined} disabled={!d.onTruoc} aria-label="Thẻ trước" data-review-truoc>
          <ChevronUpIcon aria-hidden />
          <Kbd>K</Kbd>
        </Button>
        <Button variant="ghost" size="sm" onClick={d.onSau ?? undefined} disabled={!d.onSau} aria-label="Thẻ sau" data-review-sau>
          <ChevronDownIcon aria-hidden />
          <Kbd>J</Kbd>
        </Button>
        <Button variant="ghost" size="sm" onClick={d.onPhim} aria-label="Phím tắt" data-review-mo-phim>
          <KeyboardIcon aria-hidden />
          <Kbd>?</Kbd>
        </Button>
        <NutDong />
      </div>
    </div>
  )
}

function HetTheView({ het }: { het: HetThe }): ReactNode {
  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <SheetTitle>Chế độ duyệt</SheetTitle>
          <NutDong />
        </div>
        <SheetDescription className="sr-only">Hạng mục đang duyệt đã hết thẻ chờ.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty className="border-0" data-review-het>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Hết thẻ chờ ở hạng mục này</EmptyTitle>
            <EmptyDescription>
              {het.nhanKe ? `Còn thẻ chờ ở «${het.nhanKe}».` : "Không còn hạng mục nào có thẻ chờ."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={het.onKe} data-review-het-ke>
              {het.nhanKe ? `Sang ${het.nhanKe}` : "Đóng"}
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </>
  )
}
