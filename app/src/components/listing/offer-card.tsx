import Link from "next/link"
import { cn } from "cn"

import { Badge } from "@/components/reui/badge"
import { fmtCompact, fmtInt } from "@/lib/format"
import type { PublicOffer } from "@/lib/offers-filters"
import { KIND, LABELS_VI, PROPERTY_TYPE } from "@/lib/vocab.generated"
import { LISTING_LINK, ListingCardFrame } from "./listing-card"
import { bedroomsVi } from "./listing-labels"
import { OfferContact } from "./offer-contact"
import { OfferLabelHelp } from "./offer-label-help"

/** Thông số theo loại hình; trường thiếu thì bỏ, không in chữ «chưa có». */
export function offerSpecs(o: PublicOffer): string[] {
  const pn = bedroomsVi(o.bedrooms)
  const wc = o.bathrooms === null ? null : `${o.bathrooms} WC`
  const tang = o.stories === null ? null : `${o.stories} tầng`
  const matTien = o.frontageLength === null ? null : `Mặt tiền ${fmtCompact(o.frontageLength)} m`
  const rieng =
    o.propertyType === PROPERTY_TYPE.apartment ? [pn, wc]
    : o.propertyType === PROPERTY_TYPE.house ? [tang, pn]
    : o.propertyType === PROPERTY_TYPE.land ? [matTien]
    : [pn]
  return [
    LABELS_VI.property_type[o.propertyType as keyof typeof LABELS_VI.property_type] ?? o.propertyType,
    `${fmtInt(o.areaM2)} m²`,
    ...rieng,
  ].filter((s): s is string => Boolean(s))
}

/** Tuổi tin tính từ lần đầu hệ thống thấy, nên chữ nói «thấy», không nói «đăng». */
export function firstSeenVi(days: number): string {
  return `Thấy từ ${days === 0 ? "hôm nay" : days === 1 ? "hôm qua" : `${fmtInt(days)} ngày trước`}`
}

/** Tiêu đề của tin dựng từ thông số, không dùng tên người đăng: «Căn hộ 75 m² · 3 PN». */
export function offerTitle(o: PublicOffer): string {
  return offerSpecs(o).slice(0, 3).join(" · ")
}

/** Giá của tin theo loại tin; thuê thì theo tháng. */
export function offerPrice(o: PublicOffer): string {
  return `${fmtCompact(o.priceVnd)}${o.kind === KIND.rent_lt ? "/tháng" : ""}`
}

/**
 * Thẻ tin bán, tin thuê dài hạn: khung thẻ chung, hàng cuối là người đăng và nút lấy số. Chưa có ô ảnh (hàng anh-tin-cong-khai).
 * Liên kết ở giá phủ cả thân thẻ; liên kết phường, nhãn, Xem số nằm trên nó vì mỗi thứ có việc riêng.
 */
export function OfferCard({ offer: o, wardHref }: { offer: PublicOffer; wardHref: string | null }) {
  return (
    <ListingCardFrame
      data-listing-id={o.offerId}
      price={
        <Link
          prefetch={false}
          href={`/listing/${o.offerId}`}
          aria-label={`${offerPrice(o)}, xem tin ${offerTitle(o)}`}
          className="focus-visible:ring-ring rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2"
        >
          {offerPrice(o)}
        </Link>
      }
      priceNote={o.kind === KIND.sale && o.pricePerm2 !== null ? `${fmtCompact(o.pricePerm2)}/m²` : null}
      meta={firstSeenVi(o.firstSeenDays)}
      name={o.unverified ? <div className="relative z-10 w-fit"><OfferLabelHelp what="offer"><Badge variant="warning-light">Chưa xác minh</Badge></OfferLabelHelp></div> : null}
      specs={offerSpecs(o)}
      place={
        <p className="truncate">
          {wardHref ? (
            <Link prefetch={false} href={wardHref} className={cn(LISTING_LINK, "relative z-10")}>
              {o.ward.name}
            </Link>
          ) : (
            o.ward.name
          )}
          {o.street ? ` · ${o.street}` : ""}
        </p>
      }
      footer={
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 grow basis-32 truncate text-sm">
            {o.sellerName ? (
              <>
                <span className="text-muted-foreground">Đăng bởi </span>
                <span className="font-medium">{o.sellerName}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{o.sellerManyNames ? "Tài khoản nhiều tên" : "Chưa có tên"}</span>
            )}
          </p>
          <div className="relative z-10 ml-auto max-w-full">
            <OfferContact offerId={o.offerId} hasPhone={o.hasPhone} inferred={o.phoneInferred} />
          </div>
        </div>
      }
    />
  )
}
