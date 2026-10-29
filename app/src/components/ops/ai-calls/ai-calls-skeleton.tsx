import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo bố cục trang «Cuộc gọi AI»: đầu trang + một lưới. */
export function AiCallsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải cuộc gọi AI" data-ai-calls-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Frame>
        <FramePanel className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, r) => (
            <Skeleton key={r} className="h-8 w-full" />
          ))}
        </FramePanel>
      </Frame>
    </div>
  )
}
