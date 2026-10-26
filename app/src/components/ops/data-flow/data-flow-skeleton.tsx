import { Frame, FramePanel } from "@/components/reui/frame"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải theo đúng bố cục trang «Dòng chảy dữ liệu»: đầu trang, đường ống, hai biểu đồ, hai lưới. */
export function DataFlowSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải dòng chảy dữ liệu">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Frame>
        <FramePanel>
          <Skeleton className="h-104 w-full" />
        </FramePanel>
      </Frame>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Frame className="xl:col-span-8">
          <FramePanel>
            <Skeleton className="h-80 w-full" />
          </FramePanel>
        </Frame>
        <Frame className="xl:col-span-4">
          <FramePanel>
            <Skeleton className="h-80 w-full" />
          </FramePanel>
        </Frame>
      </div>
      {[0, 1].map((i) => (
        <Frame key={i}>
          <FramePanel className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, r) => (
              <Skeleton key={r} className="h-8 w-full" />
            ))}
          </FramePanel>
        </Frame>
      ))}
    </div>
  )
}
