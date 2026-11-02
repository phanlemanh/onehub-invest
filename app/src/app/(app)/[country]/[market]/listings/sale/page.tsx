export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { ListingsRoute, listingsTitle, type ListingsRouteProps } from "@/components/listing/listings-route";
import { getArea } from "@/lib/queries";

export async function generateMetadata({ params }: Pick<ListingsRouteProps, "params">): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? listingsTitle("sale", area.name) : "Không tìm thấy" };
}

/** Tin bán của một thị trường (IA §3.2). */
export default async function SaleListingsPage(props: ListingsRouteProps) {
  return ListingsRoute({ ...props, segment: "sale" });
}
