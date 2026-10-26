"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "cn"

import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { fmtMoney, fmtMoneyCompact, fmtPct } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"
import { photoSrc } from "./listing-gallery"
import { bedroomsVi, roomTypeVi } from "./listing-labels"

/** Link class của product-grid-2 (ECOMMERCE_LINK_CLASS_NAME). */
const LINK =
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
 * Thẻ listing — chuyển thể từ ProductCard của @reui/product-grid-2. Khác bản
 * gốc: panel ảnh là ảnh tự thu (`photo_urls`, không ảnh AirDNA — luật 5), khung
 * 3:2 thay cho vuông, không ảnh thì không panel; thay swatch/giá bằng badge loại
 * phòng và ba chỉ số. Rê chuột → nhãn giá trên bản đồ sáng lên.
 */
export function ListingCard({
  listing,
  currency,
  active,
  onHover,
}: {
  listing: ListingCardRow
  currency: string
  active: boolean
  onHover: (id: string | null) => void
}) {
  const badges = [
    roomTypeVi(listing.roomType),
    bedroomsVi(listing.bedrooms),
    listing.accommodates ? `${listing.accommodates} khách` : null,
  ].filter((b): b is string => Boolean(b))

  return (
    <Frame
      variant="default"
      spacing="default"
      dense={false}
      data-listing-id={listing.id}
      data-active={active || undefined}
      className={cn("group/card min-w-0 transition-colors", active && "ring-ring/50 ring-2")}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
    >
      <CardPhoto urls={listing.photoUrls} name={listing.name ?? listing.id} href={`/listing/${listing.id}`} />
      <FramePanel className="flex flex-col gap-3">
        {listing.areaName && listing.areaPath ? (
          <Link
            prefetch={false}
            href={listing.areaPath}
            className={cn(LINK, "text-muted-foreground w-fit text-xs font-medium tracking-wide uppercase")}
          >
            {listing.areaName}
          </Link>
        ) : (
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Chưa rõ phường
          </span>
        )}

        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-foreground min-w-0 text-base leading-snug font-medium tracking-tight">
            <Link
              prefetch={false}
              href={`/listing/${listing.id}`}
              className={cn(LINK, "block truncate")}
            >
              {listing.name ?? listing.id}
            </Link>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <Badge key={badge} variant="outline" size="sm">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <dl className="mt-auto grid grid-cols-3 gap-2 text-sm">
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs">Giá/đêm</dt>
            <dd className="truncate font-semibold tabular-nums">
              {fmtMoney(listing.priceListed, currency)}
            </dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs">Công suất</dt>
            <dd className="font-semibold tabular-nums">{fmtPct(listing.occupancy)}</dd>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-muted-foreground text-xs">Doanh thu</dt>
            <dd className="truncate font-semibold tabular-nums">
              {listing.revenue > 0 ? fmtMoneyCompact(listing.revenue, currency) : "—"}
            </dd>
          </div>
        </dl>
      </FramePanel>
    </Frame>
  )
}
