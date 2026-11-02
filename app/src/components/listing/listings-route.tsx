import { notFound, permanentRedirect } from "next/navigation"

import { noiQuery, thiTruongDaDoi } from "@/lib/ma-thi-truong"
import { LISTING_KIND, parseOfferFilters, type ListingKind } from "@/lib/offers-filters"
import { currencyFor, getArea } from "@/lib/queries"
import { ListingsPageBody } from "./listings-page-body"

export { listingsTitle } from "./listings-title"

type Search = Record<string, string | string[] | undefined>

export type ListingsRouteProps = {
  params: Promise<{ country: string; market: string }>
  searchParams: Promise<Search>
}

const COUNTRY_VI: Record<string, string> = { vn: "Việt Nam" }

/** Cho thuê: dài hạn mặc định vì nhiều tin hơn; chỉ `?term=short` mới sang thuê ngắn hạn. */
export const rentKind = (term: Search[string]): ListingKind => (term === "short" ? LISTING_KIND.rent_st : LISTING_KIND.rent_lt)

/** Phần chung của trang Bán và Cho thuê: kiểm thị trường, đọc loại tin từ đường dẫn, dựng thân trang. */
export async function ListingsRoute({ params, searchParams, segment }: ListingsRouteProps & { segment: "sale" | "rent" }) {
  const { country, market } = await params
  const marketId = `${country}-${market}`
  const search = await searchParams
  const area = await getArea(marketId)
  if (!area) {
    // Mã thị trường dài đã đổi sang mã ngắn (migration 064) → link cũ chuyển vĩnh viễn sang mã mới.
    const moi = await thiTruongDaDoi(country, market)
    if (moi) permanentRedirect(noiQuery(`/${country}/${moi}/listings/${segment}`, search))
  }
  if (!area || area.regionType !== "market") notFound()
  const kind = segment === "sale" ? LISTING_KIND.sale : rentKind(search.term)
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(search)) if (typeof v === "string") q.set(k, v)
  q.set("kind", kind)
  return (
    <ListingsPageBody
      country={country}
      countryName={COUNTRY_VI[country] ?? country.toUpperCase()}
      marketId={marketId}
      marketName={area.name}
      marketPath={`/${country}/${market}`}
      currency={currencyFor(marketId)}
      kind={kind}
      filters={parseOfferFilters(q)}
    />
  )
}
