import type { ReactNode } from "react"
import Link from "next/link"

import { Frame, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getOfferWards, getPublicOffers, type ListingKind, type OfferFilters } from "@/lib/offers-public"
import { slugifyName } from "@/lib/queries"
import { OffersExplorer } from "./offers-explorer"

/** Vùng tin bán, tin thuê dài hạn — tải trong `RegionError > Suspense` để PageHeader và ô thời hạn đứng trước. */
export async function OffersRegion({
  marketId,
  marketName,
  marketPath,
  kind,
  filters,
  toolbarStart = null,
}: {
  marketId: string
  marketName: string
  marketPath: string
  kind: ListingKind
  filters: OfferFilters
  /** Ô đứng đầu hàng công cụ (thời hạn thuê). */
  toolbarStart?: ReactNode
}) {
  const [{ rows, total, withPhone }, wards] = await Promise.all([
    getPublicOffers(marketId, filters),
    getOfferWards(marketId, filters.kind),
  ])
  // Thị trường chưa có tin nào (không phải do bộ lọc) — khác «bộ lọc ra 0» (copy-vi.md).
  if (wards.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {toolbarStart && <div>{toolbarStart}</div>}
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Đang thu thập tin rao ở {marketName}</EmptyTitle>
            <EmptyDescription>Chưa có tin đủ giá, diện tích và phường ở thị trường này; số liệu khu vực vẫn xem được ở Insight.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link prefetch={false} href={marketPath} />}>
            Xem Insight {marketName}
          </Button>
        </Empty>
      </div>
    )
  }
  const wardHrefs = Object.fromEntries(wards.map((w) => [w.id, `${marketPath}/${slugifyName(w.name)}`]))
  return <OffersExplorer key={kind} rows={rows} total={total} withPhone={withPhone} filters={filters} wards={wards} wardHrefs={wardHrefs} toolbarStart={toolbarStart} />
}

/** Skeleton đúng bố cục: hàng công cụ · dòng đếm · lưới thẻ không ảnh. */
export function OffersRegionSkeleton({ toolbarStart = null }: { toolbarStart?: ReactNode } = {}) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải tin">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarStart}
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-44" />
      </div>
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Frame key={i}>
            <FramePanel className="flex flex-col gap-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full" />
            </FramePanel>
          </Frame>
        ))}
      </div>
    </div>
  )
}
