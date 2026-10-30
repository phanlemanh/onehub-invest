"use client"

import { XIcon } from "lucide-react"

import { ReviewCard } from "@/components/ops/review-card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { fmtVnDateTime } from "@/lib/format"
import type { ReviewContext } from "@/lib/ops/review-context"
import type { ReviewMedia } from "@/lib/ops/review-media"
import type { ReviewItem } from "@/lib/ops/review-queue"

import { ReviewStatusBadge, ReviewTypeBadge } from "./review-badges"

/**
 * Sheet chi tiết một thẻ (chuyển thể request-detail-sheet của @reui/solution-agents-5): đầu = tên + badge,
 * thân cuộn = nội dung thẻ hiện có + dải ảnh tin, chân ghim = nút quyết định. Màn hẹp: toàn bề ngang.
 * `key` theo id để trạng thái chọn của thẻ xung đột không dính sang thẻ khác.
 */
export function ReviewDetailSheet({ item, media, context, onOpenChange }: {
  item: ReviewItem | null
  media: ReviewMedia | undefined
  context?: ReviewContext
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        {item && (
          <ReviewCard key={item.id} item={item} media={media} context={context}>
            {({ body, actions }) => (
              <>
                <SheetHeader className="gap-2 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <SheetTitle translate="no">{item.title}</SheetTitle>
                    {/* Nút đóng có nhãn tiếng Việt (nút mặc định của Sheet đọc «Close») — mẫu request-detail-sheet. */}
                    <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Đóng" />}>
                      <XIcon aria-hidden />
                    </SheetClose>
                  </div>
                  <SheetDescription className="text-xs tabular-nums">
                    #{item.id} · {fmtVnDateTime(item.created_at)}
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewTypeBadge type={item.item_type} />
                    <ReviewStatusBadge status={item.status} />
                  </div>
                </SheetHeader>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="p-4">{body}</div>
                </ScrollArea>
                {actions && <SheetFooter className="border-t">{actions}</SheetFooter>}
              </>
            )}
          </ReviewCard>
        )}
      </SheetContent>
    </Sheet>
  )
}
