import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton theo bố cục Đã lưu: hàng tab rồi lưới thẻ (ô số 4:3 + 3 dòng chữ + nút), đúng số thẻ. */
export function SavedSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Đang tải khu vực đã lưu">
      <Skeleton className="h-9 w-72 max-w-full" />
      <ul role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-9 w-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}
