import { MilestoneTrendSkeleton } from "@/components/ops/data-flow/milestone-trend"
import { Skeleton } from "@/components/ui/skeleton"

/** Khung tải của /ops/data-flow: đầu trang rồi vùng số mốc S03. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Đang tải Dòng chảy dữ liệu">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <MilestoneTrendSkeleton />
    </div>
  )
}
