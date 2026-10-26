import { Suspense } from "react";

import { BookingHeatmap } from "./booking-heatmap";
import { ListingCalendarEmpty } from "./listing-calendar-empty";
import { ListingHero } from "./listing-hero";
import { airbnbUrlOf, roomTypeVi } from "./listing-labels";
import { ListingComps, ListingCompsSkeleton, ListingKpis, ListingKpisSkeleton } from "./listing-sections";
import { PageHeader, type Crumb } from "@/components/page/page-header";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { RegionError } from "@/components/states/region-error";
import { fmtInt } from "@/lib/format";
import type { ListingDetail } from "@/lib/queries";

const COUNTRY_VI: Record<string, string> = { vn: "Việt Nam" };

/**
 * Thân trang chi tiết listing (IA §3.2): đầu trang product-detail-5 (ảnh tự thu + Đặc điểm), KPI so với
 * listing cùng khu vực, lịch 12 tháng (form-5), comps. Đồng bộ — nhận listing đã tải; KPI và comps là
 * vùng tải riêng: RegionError > Suspense(skeleton đúng bố cục), PageHeader + đầu trang + lịch nằm ngoài.
 */
export function ListingBody({ listing }: { listing: ListingDetail }) {
  const marketId = listing.marketPath ? listing.marketPath.slice(1).replace("/", "-") : null;
  const airbnbUrl = airbnbUrlOf(listing.id);

  const cc = marketId?.split("-")[0] ?? "vn";
  const crumbs: Crumb[] = [
    { label: COUNTRY_VI[cc] ?? cc.toUpperCase(), href: `/${cc}` },
    ...(listing.marketName && listing.marketPath
      ? [{ label: listing.marketName, href: listing.marketPath }]
      : []),
    ...(listing.areaName && listing.areaPath
      ? [{ label: listing.areaName, href: listing.areaPath }]
      : []),
    { label: "Listing" },
  ];
  const roomType = roomTypeVi(listing.roomType);
  const { stats } = listing;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={crumbs}
        title={listing.name ?? listing.id}
        stats={roomType ? [roomType] : []}
        description={`Airbnb · ${listing.id}${listing.lastSeen ? ` · quét gần nhất ${listing.lastSeen.split("-").reverse().join("/")}` : ""}`}
      />

      <ListingHero
        listing={{
          id: listing.id,
          name: listing.name,
          photoUrls: listing.photoUrls,
          roomType: listing.roomType,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          accommodates: listing.accommodates,
          minimumNights: listing.minimumNights,
          reviewCount: listing.reviewCount,
          areaName: listing.areaName,
          areaPath: listing.areaPath,
          marketName: listing.marketName,
          marketPath: listing.marketPath,
          airbnbUrl,
        }}
      />

      <RegionError what="chỉ số của listing">
        <Suspense fallback={<ListingKpisSkeleton />}>
          <ListingKpis listing={listing} marketId={marketId} />
        </Suspense>
      </RegionError>

      <Frame spacing="default" className="w-full min-w-0">
        <FrameHeader>
          <FrameTitle role="heading" aria-level={2}>
            Lịch {fmtInt(stats.nights)} đêm tới
          </FrameTitle>
          <FrameDescription>
            Đêm không còn trống được tính là đã đặt — có thể gồm cả đêm chủ nhà tự khoá lịch.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          {listing.calendar.length > 0 ? (
            <BookingHeatmap nights={listing.calendar} currency={listing.currency} lastSeen={listing.lastSeen} />
          ) : (
            <ListingCalendarEmpty airbnbUrl={airbnbUrl} />
          )}
        </FramePanel>
      </Frame>

      <RegionError what="listing tương tự">
        <Suspense fallback={<ListingCompsSkeleton />}>
          <ListingComps listing={listing} marketId={marketId} />
        </Suspense>
      </RegionError>
    </div>
  );
}
