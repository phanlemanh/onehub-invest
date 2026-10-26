"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { fmtInt } from "@/lib/format"
import { ListingGallery } from "./listing-gallery"
import { roomTypeVi } from "./listing-labels"

/** Trường của listing mà đầu trang cần — trang server chọn từ ListingDetail rồi truyền xuống. */
export type ListingHeroData = {
  id: string
  name: string | null
  photoUrls: string[] | null
  roomType: string | null
  bedrooms: number | null
  bathrooms: number | null
  accommodates: number | null
  minimumNights: number | null
  reviewCount: number | null
  areaName: string | null
  areaPath: string | null
  marketName: string | null
  marketPath: string | null
  airbnbUrl: string | null
}

type Fact = { label: string; value: string; href?: string | null }

/** Dòng đặc điểm — trường null thì không có dòng (không in «—» thay số chưa thu). */
export function listingFacts(l: ListingHeroData): Fact[] {
  const rows: (Fact | null)[] = [
    l.roomType ? { label: "Loại phòng", value: roomTypeVi(l.roomType) ?? l.roomType } : null,
    l.bedrooms !== null
      ? { label: "Phòng ngủ", value: l.bedrooms === 0 ? "Studio" : `${l.bedrooms} phòng ngủ` }
      : null,
    l.bathrooms !== null ? { label: "Phòng tắm", value: `${l.bathrooms} phòng tắm` } : null,
    l.accommodates !== null ? { label: "Sức chứa", value: `${l.accommodates} khách` } : null,
    l.minimumNights !== null ? { label: "Đặt tối thiểu", value: `${l.minimumNights} đêm` } : null,
    l.reviewCount !== null ? { label: "Đánh giá", value: `${fmtInt(l.reviewCount)} đánh giá trên Airbnb` } : null,
    l.areaName ? { label: "Phường", value: l.areaName, href: l.areaPath } : null,
    l.marketName ? { label: "Thị trường", value: l.marketName, href: l.marketPath } : null,
  ]
  return rows.filter((r): r is Fact => r !== null)
}

/**
 * Đầu trang listing — chuyển thể hero của @reui/product-detail-5: gallery (trái, dính khi cuộn) + hộp
 * thông tin (phải). Khác bản gốc: hộp không có giá/biến thể/giỏ hàng — giá và số đã nằm ở hàng KPI
 * ngay dưới; hộp là bảng đặc điểm (khuôn «Specs» của block) + một nút «Mở trên Airbnb».
 * Không có ảnh tự thu (hoặc mọi ảnh chết trên CDN) → không gallery, hộp chiếm cả bề ngang.
 */
export function ListingHero({ listing }: { listing: ListingHeroData }) {
  const [galleryGone, setGalleryGone] = useState(false)
  const onEmpty = useCallback(() => setGalleryGone(true), [])
  const photos = listing.photoUrls ?? []
  const withGallery = photos.length > 0 && !galleryGone
  const facts = listingFacts(listing)

  return (
    <section
      aria-label="Thông tin listing"
      className={cn(
        "grid grid-cols-1 items-start gap-6",
        withGallery && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8"
      )}
    >
      {withGallery && (
        <div className="lg:sticky lg:top-8">
          <ListingGallery urls={photos} name={listing.name ?? listing.id} onEmpty={onEmpty} />
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="text-muted-foreground text-xs font-medium">Đặc điểm</h2>
        <dl className={cn("grid grid-cols-1", !withGallery && "sm:grid-cols-2 sm:gap-x-8")}>
          {facts.map((f) => (
            <div
              key={f.label}
              className="border-border/60 grid grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-3 border-t py-2.5"
            >
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="text-foreground text-sm leading-snug">
                {f.href ? (
                  <Link href={f.href} className="hover:underline">
                    {f.value}
                  </Link>
                ) : (
                  f.value
                )}
              </dd>
            </div>
          ))}
        </dl>
        {listing.airbnbUrl && (
          <Button
            variant="outline"
            className={cn(!withGallery && "sm:self-start")}
            nativeButton={false}
            render={<a href={listing.airbnbUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
            Mở trên Airbnb
          </Button>
        )}
      </div>
    </section>
  )
}
