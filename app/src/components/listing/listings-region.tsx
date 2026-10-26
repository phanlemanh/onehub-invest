import Link from "next/link"

import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtInt } from "@/lib/format"
import { getMarketListings } from "@/lib/queries"
import { ListingsExplorer } from "./listings-explorer"

/** Số listing gửi xuống trình duyệt (nhãn bản đồ + thẻ) — xếp theo doanh thu. */
export const LISTINGS_LIMIT = 300

/**
 * Vùng dữ liệu của trang Duyệt listing — tải trong `RegionError > Suspense` để PageHeader đứng trước. Thị
 * trường chưa có listing tự thu → Empty «đang thu thập» (khác «bộ lọc ra 0», copy-vi.md); quá giới hạn tải
 * → dòng ghi chú nói rõ chỉ hiện các listing doanh thu cao nhất.
 */
export async function ListingsRegion({
  marketId,
  marketName,
  marketPath,
  currency,
}: {
  marketId: string
  marketName: string
  marketPath: string
  currency: string
}) {
  const { rows, total } = await getMarketListings(marketId, { limit: LISTINGS_LIMIT })

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Đang thu thập listing ở {marketName}</EmptyTitle>
          <EmptyDescription>Chưa có listing tự thu ở thị trường này; số liệu khu vực vẫn xem được ở Insight.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link prefetch={false} href={marketPath} />}>
          Xem Insight {marketName}
        </Button>
      </Empty>
    )
  }

  const capNote =
    total > rows.length
      ? `Hiện ${fmtInt(rows.length)}/${fmtInt(total)} listing doanh thu cao nhất của thị trường.`
      : null
  return <ListingsExplorer listings={rows} currency={currency} capNote={capNote} />
}

/** Skeleton đúng bố cục: hàng công cụ · lưới 4 thẻ (ảnh 3:2 + chữ) | khung bản đồ. */
export function ListingsRegionSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải listing">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Frame key={i}>
                <FramePanel className="aspect-[3/2] p-0">
                  <Skeleton className="size-full" />
                </FramePanel>
                <FramePanel className="flex flex-col gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </FramePanel>
              </Frame>
            ))}
          </div>
        </div>
        <Frame className="max-lg:hidden">
          <FrameHeader>
            <Skeleton className="h-5 w-24" />
          </FrameHeader>
          <FramePanel className="h-[calc(100svh-12rem)] p-0">
            <Skeleton className="size-full" />
          </FramePanel>
        </Frame>
      </div>
    </div>
  )
}
