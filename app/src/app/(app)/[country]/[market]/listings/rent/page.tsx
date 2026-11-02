export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { ListingsRoute, listingsTitle, rentKind, type ListingsRouteProps } from "@/components/listing/listings-route";
import { getArea } from "@/lib/queries";

export async function generateMetadata({ params, searchParams }: ListingsRouteProps): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? listingsTitle(rentKind((await searchParams).term), area.name) : "Không tìm thấy" };
}

/** Tin cho thuê của một thị trường (IA §3.2): dài hạn mặc định, `?term=short` là thuê ngắn hạn. */
export default async function RentListingsPage(props: ListingsRouteProps) {
  return ListingsRoute({ ...props, segment: "rent" });
}
