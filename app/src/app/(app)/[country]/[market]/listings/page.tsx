export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingsRegion, ListingsRegionSkeleton } from "@/components/listing/listings-region";
import { PageHeader } from "@/components/page/page-header";
import { RegionError } from "@/components/states/region-error";
import { currencyFor, getArea } from "@/lib/queries";

type Params = Promise<{ country: string; market: string }>;

const COUNTRY_VI: Record<string, string> = { vn: "Việt Nam" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? `Listing tại ${area.name}` : "Không tìm thấy" };
}

/**
 * Duyệt listing của một thị trường (IA §3.2): bộ lọc | lưới thẻ | bản đồ nhãn giá. PageHeader đứng ngay;
 * listing tải trong RegionError > Suspense (skeleton đúng bố cục, lỗi tại chỗ có Thử lại).
 */
export default async function MarketListingsPage({ params }: { params: Params }) {
  const { country, market } = await params;
  const marketId = `${country}-${market}`;
  const area = await getArea(marketId);
  if (!area || area.regionType !== "market") notFound();
  const marketPath = `/${country}/${market}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: COUNTRY_VI[country] ?? country.toUpperCase(), href: `/${country}` },
          { label: area.name, href: marketPath },
          { label: "Listing" },
        ]}
        title={`Listing tại ${area.name}`}
        stats={[]}
        description="Airbnb tự thu thập · công suất và doanh thu tính trên lịch đặt các tháng tới"
      />
      <RegionError what="listing của thị trường">
        <Suspense fallback={<ListingsRegionSkeleton />}>
          <ListingsRegion
            marketId={marketId}
            marketName={area.name}
            marketPath={marketPath}
            currency={currencyFor(marketId)}
          />
        </Suspense>
      </RegionError>
    </div>
  );
}
