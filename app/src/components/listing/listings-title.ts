import { LISTING_KIND, type ListingKind } from "@/lib/offers-filters"

const TITLE: Record<ListingKind, string> = {
  [LISTING_KIND.sale]: "Tin bán",
  [LISTING_KIND.rent_lt]: "Tin cho thuê",
  [LISTING_KIND.rent_st]: "Thuê ngắn hạn",
}

export const listingsTitle = (kind: ListingKind, marketName: string) => `${TITLE[kind]} tại ${marketName}`
