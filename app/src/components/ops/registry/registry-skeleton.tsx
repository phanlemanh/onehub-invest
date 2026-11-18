import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo bố cục trang «Danh bạ»: đầu trang + bốn ô số + bảng. */
export function RegistrySkeleton({ nhan = "Đang tải danh bạ" }: { nhan?: string }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label={nhan} data-registry-skeleton="">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Frame key={i}>
            <FramePanel className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </FramePanel>
          </Frame>
        ))}
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
