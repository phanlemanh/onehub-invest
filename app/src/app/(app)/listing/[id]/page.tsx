export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingBody } from "@/components/listing/listing-body";
import { OfferBody } from "@/components/listing/offer-body";
import { offerTitle } from "@/components/listing/offer-card";
import { listingBranch, listingIdOf } from "@/lib/listing-branch";
import { getPublicOffer } from "@/lib/offers-public";
import { getListingDetail } from "@/lib/queries";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = listingIdOf((await params).id);
  if (id === null) return { title: "Listing" };
  if (listingBranch(id) === "offer") {
    // Chưa lên máy tìm kiếm: trang có tên người đăng, đã vào chỉ mục thì rút rất chậm (hồ sơ trang-chi-tiet-tin, Hỏi-1).
    const offer = await getPublicOffer(id);
    return { title: offer ? offerTitle(offer) : "Tin không còn hiện", robots: { index: false, follow: false } };
  }
  const listing = await getListingDetail(id);
  return { title: listing?.name ?? "Listing" };
}

/** Chi tiết một Listing: tin rao hoặc listing thuê ngắn hạn, theo id. Không có thì 404 chung. */
export default async function ListingPage({ params }: { params: Params }) {
  const id = listingIdOf((await params).id);
  if (id === null) notFound();
  if (listingBranch(id) === "offer") {
    const offer = await getPublicOffer(id);
    if (!offer) notFound();
    return <OfferBody offer={offer} />;
  }
  const listing = await getListingDetail(id);
  if (!listing) notFound();
  return <ListingBody listing={listing} />;
}
