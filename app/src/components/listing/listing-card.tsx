"use client"

import { useState, type ComponentProps, type ReactNode } from "react"
import Link from "next/link"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Frame, FramePanel } from "@/components/reui/frame"
import { fmtCompact, fmtPct } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"
import { photoSrc } from "./listing-gallery"
import { bedroomsVi, roomTypeVi } from "./listing-labels"

/** Link class của product-grid-2 (ECOMMERCE_LINK_CLASS_NAME). */
export const LISTING_LINK =
  "hover:text-foreground focus-visible:ring-ring rounded-sm outline-none hover:underline focus-visible:ring-2"

/** Ảnh đã lỗi trước khi React gắn sự kiện (lỗi giữa HTML server và hydrate): complete mà không có kích thước. */
const failedBeforeHydrate = (img: HTMLImageElement | null) =>
  Boolean(img && img.complete && img.currentSrc && img.naturalWidth === 0)

/**
 * Panel ảnh của thẻ (khung 3:2, `object-cover` để lưới đều — quy định khung ảnh ở catalog.md). Ảnh chết
 * trên CDN → lùi ảnh kế trong ≤ 3 ảnh tự thu; hết ảnh → không vẽ panel (thẻ không ảnh, không ô vỡ).
 */
function CardPhoto({ urls, name, href }: { urls: string[]; name: string; href: string }) {
  const [broken, setBroken] = useState<Set<string>>(() => new Set())
  const url = urls.find((u) => !broken.has(u))
  if (!url) return null
  const markBroken = (u: string) => setBroken((prev) => (prev.has(u) ? prev : new Set(prev).add(u)))
  return (
    <FramePanel className="group/media bg-muted relative aspect-[3/2] flex-none overflow-hidden p-0">
      <Link
        prefetch={false}
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 block outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- CDN Airbnb ngoài domain, kích thước động */}
        <img
          key={url}
          ref={(img) => {
            if (failedBeforeHydrate(img)) markBroken(url)
          }}
          src={photoSrc(url, false)}
          alt={name}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/media:scale-105 motion-reduce:transition-none"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => markBroken(url)}
        />
      </Link>
    </FramePanel>
  )
}

/**
 * Khung thẻ chung của mọi loại Listing — chuyển thể từ ProductCard của @reui/product-grid-2. Các ô cố định theo thứ tự:
 * Ảnh · Giá · (tên) · Thông số · Vị trí · hàng cuối (trái: thông tin, phải: một hành động). Không ảnh thì không có panel ảnh.
 * Giá/m² chung hàng giá, thông số là một dòng chữ, tuổi tin cuối hàng vị trí; không ký hiệu ₫ trên thẻ (hồ sơ tin-rao-tren-invest).
 * Khác nhau giữa các loại chỉ nằm ở giá trị của từng ô.
 */
export function ListingCardFrame({
  photo = null,
  price,
  priceNote = null,
  meta = null,
  name = null,
  specs,
  place,
  footer,
  className,
  ...frame
}: Omit<ComponentProps<typeof Frame>, "children"> & {
  photo?: ReactNode
  price: ReactNode
  priceNote?: ReactNode
  /** Ghi chú nhỏ cuối hàng vị trí (tuổi tin). */
  meta?: ReactNode
  name?: ReactNode
  specs: string[]
  place: ReactNode
  footer: ReactNode
}) {
  return (
    <Frame
      variant="default"
      spacing="default"
      dense={false}
      className={cn("group/card min-w-0 transition-colors", className)}
      {...frame}
    >
      {photo}
      <FramePanel className="flex flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="text-foreground truncate text-base leading-snug font-semibold tracking-tight tabular-nums">
            {price}
          </h3>
          {priceNote && <p className="text-muted-foreground flex-none text-xs tabular-nums">{priceNote}</p>}
        </div>
        {name}
        {specs.length > 0 && <p className="text-foreground text-sm tabular-nums">{specs.join(" · ")}</p>}
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <div className="text-muted-foreground min-w-0 text-sm">{place}</div>
          {meta && <span className="text-muted-foreground flex-none text-xs tabular-nums">{meta}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">{footer}</div>
      </FramePanel>
    </Frame>
  )
}

/**
 * Thẻ listing thuê ngắn hạn: panel ảnh là ảnh tự thu (`photo_urls`, không ảnh AirDNA — luật 5), khung 3:2. Rê chuột →
 * nhãn giá trên bản đồ sáng lên.
 */
export function ListingCard({
  listing,
  active,
  onHover,
}: {
  listing: ListingCardRow
  active: boolean
  onHover: (id: string | null) => void
}) {
  const href = `/listing/${listing.id}`
  const specs = [
    roomTypeVi(listing.roomType),
    bedroomsVi(listing.bedrooms),
    listing.accommodates ? `${listing.accommodates} khách` : null,
  ].filter((b): b is string => Boolean(b))

  return (
    <ListingCardFrame
      data-listing-id={listing.id}
      data-active={active || undefined}
      className={cn(active && "ring-ring/50 ring-2")}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      photo={<CardPhoto urls={listing.photoUrls} name={listing.name ?? listing.id} href={href} />}
      price={listing.priceListed === null ? "Chưa có giá" : `${fmtCompact(listing.priceListed)}/đêm`}
      name={
        <Link prefetch={false} href={href} className={cn(LISTING_LINK, "text-foreground block truncate text-sm font-medium")}>
          {listing.name ?? listing.id}
        </Link>
      }
      specs={specs}
      place={
        listing.areaName && listing.areaPath ? (
          <Link prefetch={false} href={listing.areaPath} className={LISTING_LINK}>
            {listing.areaName}
          </Link>
        ) : (
          "Chưa rõ phường"
        )
      }
      footer={
        <>
          <dl className="flex min-w-0 gap-4 text-sm">
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">Công suất</dt>
              <dd className="font-semibold tabular-nums">{fmtPct(listing.occupancy)}</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">Doanh thu</dt>
              <dd className="truncate font-semibold tabular-nums">
                {listing.revenue > 0 ? fmtCompact(listing.revenue) : "—"}
              </dd>
            </div>
          </dl>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link prefetch={false} href={href} />}>
            Xem listing
          </Button>
        </>
      }
    />
  )
}
