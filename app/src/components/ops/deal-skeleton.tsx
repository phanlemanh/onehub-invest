import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải của bảng Căn giá tốt: tab, thanh lọc, các hàng. */
export function DealsSkeleton() {
  return (
    <Frame aria-busy="true" aria-label="Đang tải Căn giá tốt" data-deal-skeleton="">
      <FramePanel className="flex flex-col gap-3">
        <Skeleton className="h-8 w-96 max-w-full" />
        {Array.from({ length: 10 }, (_, r) => <Skeleton key={r} className="h-10 w-full" />)}
      </FramePanel>
    </Frame>
  )
}

/** Khung tải của trang một căn theo bố cục hai cột. */
export function DealPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải căn này" data-deal-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-72 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, r) => <Skeleton key={r} className="h-6 w-full" />)}
        </div>
      </div>
    </div>
  )
}
