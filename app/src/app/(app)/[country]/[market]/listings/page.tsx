export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingsPageBody } from "@/components/listing/listings-page-body";
import { currencyFor, getArea } from "@/lib/queries";

type Params = Promise<{ country: string; market: string }>;

const COUNTRY_VI: Record<string, string> = { vn: "Việt Nam" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? `Listing tại ${area.name}` : "Không tìm thấy" };
}

/** Duyệt listing của một thị trường (IA §3.2) — thân trang ở `listing/listings-page-body.tsx`. */
export default async function MarketListingsPage({ params }: { params: Params }) {
  const { country, market } = await params;
  const marketId = `${country}-${market}`;
  const area = await getArea(marketId);
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
