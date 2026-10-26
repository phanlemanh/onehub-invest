import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Giữ chỗ vùng hàng chờ: Frame + hai ô lọc + 6 dòng — fallback của <Suspense> trong trang (không loading.tsx). */
export function ReviewQueueSkeleton() {
  return (
    <Frame spacing="default" className="w-full min-w-0" aria-busy="true" aria-label="Đang tải hàng duyệt">
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-32" />
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} data-skeleton-row className="h-10 w-full" />
        ))}
      </FramePanel>
    </Frame>
  )
}
