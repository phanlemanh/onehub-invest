import { Suspense } from "react"

import { PageHeader } from "@/components/page/page-header"
import { RegionError } from "@/components/states/region-error"
import type { OfferFilters } from "@/lib/offers-public"
import { ListingsRegion, ListingsRegionSkeleton } from "./listings-region"
import { LISTING_KIND, type ListingKind } from "@/lib/offers-filters"
import { listingsTitle } from "./listings-title"
import { OffersRegion, OffersRegionSkeleton } from "./offers-region"
import { RentTermToggle } from "./rent-term-toggle"

/**
 * Thân trang Bán và Cho thuê (IA §3.2): cùng khuôn bộ lọc | đếm + sắp xếp | lưới thẻ; Cho thuê thêm ô thời hạn, thuê ngắn
 * hạn thêm bản đồ nhãn giá. PageHeader đứng ngay; dữ liệu tải trong RegionError > Suspense (skeleton đúng bố cục, lỗi tại
 * chỗ có Thử lại). Đồng bộ — trang đã kiểm thị trường.
 */
export function ListingsPageBody({
  country,
  countryName,
  marketId,
  marketName,
  marketPath,
  currency,
  kind,
  filters,
}: {
  country: string
  countryName: string
  marketId: string
  marketName: string
  marketPath: string
  currency: string
  kind: ListingKind
  filters: OfferFilters
}) {
  // Ô thời hạn nằm trong hàng công cụ của từng vùng, kể cả lúc tải và lúc trống, để luôn đổi được.
  const term = kind === LISTING_KIND.sale ? null : <RentTermToggle kind={kind} />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: countryName, href: `/${country}` },
          { label: marketName, href: marketPath },
          { label: kind === LISTING_KIND.sale ? "Bán" : "Cho thuê" },
        ]}
        title={listingsTitle(kind, marketName)}
        stats={[]}
        description={
          kind !== LISTING_KIND.rent_st
            ? "Tin tự thu từ nhiều nguồn · bấm Xem số để liên hệ người đăng"
            : "Airbnb tự thu thập · công suất và doanh thu tính trên lịch đặt các tháng tới"
        }
      />
      {kind !== LISTING_KIND.rent_st ? (
        <RegionError what="tin rao của thị trường">
          <Suspense key={JSON.stringify(filters)} fallback={<OffersRegionSkeleton toolbarStart={term} />}>
            <OffersRegion marketId={marketId} marketName={marketName} marketPath={marketPath} kind={kind} filters={filters} toolbarStart={term} />
          </Suspense>
        </RegionError>
      ) : (
        <RegionError what="listing của thị trường">
          <Suspense fallback={<ListingsRegionSkeleton toolbarStart={term} />}>
            <ListingsRegion marketId={marketId} marketName={marketName} marketPath={marketPath} currency={currency} toolbarStart={term} />
          </Suspense>
        </RegionError>
      )}
    </div>
  )
}
