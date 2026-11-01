export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ListingsPageBody } from "@/components/listing/listings-page-body";
import { noiQuery, thiTruongDaDoi } from "@/lib/ma-thi-truong";
import { currencyFor, getArea } from "@/lib/queries";

type Params = Promise<{ country: string; market: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const COUNTRY_VI: Record<string, string> = { vn: "Việt Nam" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? `Listing tại ${area.name}` : "Không tìm thấy" };
}

/** Duyệt listing của một thị trường (IA §3.2) — thân trang ở `listing/listings-page-body.tsx`. */
export default async function MarketListingsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { country, market } = await params;
  const marketId = `${country}-${market}`;
  const area = await getArea(marketId);
  if (!area) {
    // Mã thị trường dài đã đổi sang mã ngắn (migration 064) → link cũ chuyển vĩnh viễn sang mã mới.
    const moi = await thiTruongDaDoi(country, market);
    if (moi) permanentRedirect(noiQuery(`/${country}/${moi}/listings`, await searchParams));
  }
  if (!area || area.regionType !== "market") notFound();
  return (
    <ListingsPageBody
      country={country}
      countryName={COUNTRY_VI[country] ?? country.toUpperCase()}
      marketId={marketId}
      marketName={area.name}
      marketPath={`/${country}/${market}`}
      currency={currencyFor(marketId)}
    />
  );
}
