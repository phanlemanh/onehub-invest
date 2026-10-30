import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo bố cục trang «Gắn nhãn»: đầu trang + khung tin + biểu mẫu. */
export function LabelsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải tin để gắn nhãn" data-labels-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, r) => (
              <Skeleton key={r} className="h-4 w-full" />
            ))}
          </FramePanel>
        </Frame>
        <Frame>
          <FramePanel className="flex flex-col gap-3">
            {Array.from({ length: 9 }, (_, r) => (
              <Skeleton key={r} className="h-8 w-full" />
            ))}
          </FramePanel>
        </Frame>
      </div>
    </div>
  )
}
