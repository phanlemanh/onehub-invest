import { Suspense } from "react"

import { PageHeader } from "@/components/page/page-header"
import { RegionError } from "@/components/states/region-error"
import { ListingsRegion, ListingsRegionSkeleton } from "./listings-region"

/**
 * Thân trang Duyệt listing (IA §3.2): bộ lọc | lưới thẻ | bản đồ nhãn giá. PageHeader đứng ngay; listing tải
 * trong RegionError > Suspense (skeleton đúng bố cục, lỗi tại chỗ có Thử lại). Đồng bộ — trang đã kiểm thị trường.
 */
export function ListingsPageBody({
  country,
  countryName,
  marketId,
  marketName,
  marketPath,
  currency,
}: {
  country: string
  countryName: string
  marketId: string
  marketName: string
  marketPath: string
  currency: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: countryName, href: `/${country}` },
          { label: marketName, href: marketPath },
          { label: "Listing" },
        ]}
        title={`Listing tại ${marketName}`}
        stats={[]}
        description="Airbnb tự thu thập · công suất và doanh thu tính trên lịch đặt các tháng tới"
      />
      <RegionError what="listing của thị trường">
        <Suspense fallback={<ListingsRegionSkeleton />}>
          <ListingsRegion marketId={marketId} marketName={marketName} marketPath={marketPath} currency={currency} />
        </Suspense>
      </RegionError>
    </div>
  )
}
