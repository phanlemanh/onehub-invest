"use client"

import { ReviewCard } from "@/components/ops/review-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { fmtVnDateTime } from "@/lib/format"
import type { ReviewMedia } from "@/lib/ops/review-media"
import type { ReviewItem } from "@/lib/ops/review-queue"

import { ReviewStatusBadge, ReviewTypeBadge } from "./review-badges"

/**
 * Sheet chi tiết một thẻ (chuyển thể request-detail-sheet của @reui/solution-agents-5): đầu = tên + badge,
 * thân cuộn = nội dung thẻ hiện có + dải ảnh tin, chân ghim = nút quyết định. Màn hẹp: toàn bề ngang.
 * `key` theo id để trạng thái chọn của thẻ xung đột không dính sang thẻ khác.
 */
export function ReviewDetailSheet({ item, media, onOpenChange }: {
  item: ReviewItem | null
  media: ReviewMedia | undefined
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        {item && (
          <ReviewCard key={item.id} item={item} media={media}>
            {({ body, actions }) => (
              <>
                <SheetHeader className="gap-2 border-b pe-12">
                  <SheetTitle translate="no">{item.title}</SheetTitle>
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
