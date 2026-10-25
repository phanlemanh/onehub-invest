import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton theo đúng bố cục bảng so sánh: cột nhãn + một cột mỗi khu vực, ô đầu cột
 * (ô RevPAR, tên, nút) rồi các hàng số. Không có khu vực nào thì giữ chỗ cho khung trống.
 */
export function CompareSkeleton({ columns }: { columns: number }) {
  if (columns === 0) return <Skeleton className="h-64" aria-busy="true" aria-label="Đang tải" />
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải bảng so sánh">
      <div className="flex gap-4 overflow-hidden">
        <div className="flex w-48 shrink-0 flex-col gap-3 sm:w-56">
          <Skeleton className="h-44" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
        {Array.from({ length: columns }, (_, c) => (
          <div key={c} className="flex w-64 shrink-0 flex-col gap-3">
            <Skeleton className="h-44" />
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  )
}
