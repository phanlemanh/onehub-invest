export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingBody } from "@/components/listing/listing-body";
import { getListingDetail } from "@/lib/queries";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingDetail(decodeURIComponent(id));
  return { title: listing?.name ?? "Listing" };
}

/** Chi tiết listing — tải listing (404 khi không có) rồi giao thân trang cho ListingBody. */
export default async function ListingPage({ params }: { params: Params }) {
  const { id } = await params;
  const listing = await getListingDetail(decodeURIComponent(id));
  if (!listing) notFound();
  return <ListingBody listing={listing} />;
}
