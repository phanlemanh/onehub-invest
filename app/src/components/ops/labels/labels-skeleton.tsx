import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo bố cục trang «Gắn nhãn»: đầu trang + bộ chọn nhóm + biểu mẫu hai cột. */
export function LabelsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải tin để gắn nhãn" data-labels-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Frame>
        <FramePanel>
          <Skeleton className="h-8 w-full" />
        </FramePanel>
      </Frame>
      <Frame>
        <FramePanel className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, r) => (
              <Skeleton key={r} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid gap-x-8 gap-y-2 xl:grid-cols-2">
            {Array.from({ length: 18 }, (_, r) => (
              <Skeleton key={r} className="h-8 w-full" />
            ))}
          </div>
        </FramePanel>
      </Frame>
    </div>
  )
}
