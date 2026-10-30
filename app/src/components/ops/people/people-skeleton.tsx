import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo bố cục trang «Danh bạ người»: đầu trang + thanh lọc + bảng. */
export function PeopleSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải danh bạ người" data-people-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Frame>
        <FramePanel className="flex flex-col gap-3">
          <Skeleton className="h-8 w-80 max-w-full" />
          {Array.from({ length: 10 }, (_, r) => (
            <Skeleton key={r} className="h-6 w-full" />
          ))}
        </FramePanel>
      </Frame>
    </div>
  )
}
