import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { StatTiles } from "@/components/page/stat-tiles"
import { tierOf, type StatTile, type Tier } from "@/components/page/tiers"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtInt, fmtMoney, fmtMoneyCompact, fmtPct } from "@/lib/format"
import { getListingPeers, getMarketListings, type ListingDetail } from "@/lib/queries"
import { bedroomsVi } from "./listing-labels"
import { CompsTable } from "./listing-tables"

/**
 * Hai vùng số liệu tải riêng của trang listing (mỗi vùng một truy vấn phụ): hàng KPI (so với listing
 * cùng phường) và bảng Listing tương tự. Trang bọc mỗi vùng bằng RegionError > Suspense — PageHeader,
 * đầu trang và lịch đứng ngay khi listing tải xong, vùng phụ hỏng thì chỉ vùng đó báo lỗi có Thử lại.
 */

type Peers = Awaited<ReturnType<typeof getListingPeers>>

/** Giá cao không phải "tốt" — bậc giá dùng nhãn trung tính, không xanh/vàng. */
function priceTier(price: number | null, p: number[] | undefined): Tier | null {
  if (price === null || !p) return null
  if (price >= p[2]) return { label: "Cao cấp", variant: "outline" }
  if (price >= p[1]) return { label: "Trên trung vị", variant: "outline" }
  if (price >= p[0]) return { label: "Tầm trung", variant: "outline" }
  return { label: "Giá thấp", variant: "outline" }
}

/** Bốn ô KPI — giữ đúng công thức trước đợt đổi giao diện (UI5 không đổi số). */
export function listingTiles(listing: ListingDetail, peers: Peers | null): StatTile[] {
  const peerScope =
    peers?.scope === "area" ? `${peers.n} listing cùng phường` : `${peers?.n ?? 0} listing cùng thị trường`
  const { stats, currency } = listing
  return [
    {
      title: "Giá niêm yết",
      value: fmtMoney(listing.priceListed, currency),
      tier: priceTier(listing.priceListed, peers?.price),
      footer: peers ? `Trung vị ${peerScope}: ${fmtMoney(peers.price[1], currency)}` : "Giá một đêm trên Airbnb",
    },
    {
      title: "Công suất",
      value: fmtPct(stats.occupancy),
      tier: tierOf(stats.occupancy, peers?.occ),
      footer:
        listing.priceListed === null
          ? "Listing chưa báo giá — lịch kín có thể do chủ nhà chặn, không tính công suất"
          : peers?.occ
            ? `Trung vị ${peerScope}: ${fmtPct(peers.occ[1])}`
            : "Đêm đã đặt ÷ tổng đêm của lịch",
    },
    {
      title: "Đêm đã đặt",
      value: `${fmtInt(stats.booked)}/${fmtInt(stats.nights)}`,
      footer: `Trong ${fmtInt(stats.nights)} đêm tới của lịch`,
    },
    {
      title: "Doanh thu ước tính",
      value: stats.revenue > 0 ? fmtMoneyCompact(stats.revenue, currency) : "—",
      footer:
        stats.revenue > 0
          ? "Tổng giá các đêm đã đặt trong lịch tới"
          : "Chưa thu được giá theo đêm của listing này",
    },
  ]
}

export async function ListingKpis({ listing, marketId }: { listing: ListingDetail; marketId: string | null }) {
  const peers = listing.areaId ? await getListingPeers(listing.areaId, marketId) : null
  return <StatTiles items={listingTiles(listing, peers)} />
}

export function ListingKpisSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Đang tải chỉ số">
      {Array.from({ length: 4 }, (_, i) => (
        <Frame key={i}>
          <FramePanel className="flex flex-col gap-5">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </FramePanel>
        </Frame>
      ))}
    </div>
  )
}

/**
 * Listing tương tự: 10 listing gần nhất cùng số phòng ngủ trong thị trường (chọn theo khoảng cách).
 * Không có thì là vùng trống có hành động, không ẩn vùng.
 */
export async function ListingComps({ listing, marketId }: { listing: ListingDetail; marketId: string | null }) {
  const rows =
    marketId && listing.lat !== null && listing.lng !== null
      ? (
          await getMarketListings(marketId, {
            limit: 10,
            excludeId: listing.id,
            bedrooms: listing.bedrooms,
            near: { lat: listing.lat, lng: listing.lng },
          })
        ).rows
      : []

  if (rows.length === 0) return <ListingCompsEmpty listing={listing} />
  return (
    <CompsTable
      rows={rows}
      currency={listing.currency}
      description={`${rows.length} listing gần nhất${listing.bedrooms !== null ? ` cùng ${bedroomsVi(listing.bedrooms)}` : ""} trong ${listing.marketName ?? "thị trường"}`}
    />
  )
}

export function ListingCompsEmpty({ listing }: { listing: Pick<ListingDetail, "marketName" | "marketPath"> }) {
  const href = listing.marketPath ? `${listing.marketPath}/listings` : "/vn"
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>
          Listing tương tự
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Chưa có listing tương tự</EmptyTitle>
            <EmptyDescription>
              Chưa tìm được listing cùng số phòng ngủ gần căn này — có thể listing chưa có toạ độ hoặc thị trường.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href} />}>
              {listing.marketName ? `Duyệt listing ở ${listing.marketName}` : "Tìm thị trường"}
            </Button>
          </EmptyContent>
        </Empty>
      </FramePanel>
    </Frame>
  )
}

export function ListingCompsSkeleton() {
  return (
    <Frame aria-busy="true" aria-label="Đang tải listing tương tự">
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>
          Listing tương tự
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] gap-4">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </FramePanel>
    </Frame>
  )
}
