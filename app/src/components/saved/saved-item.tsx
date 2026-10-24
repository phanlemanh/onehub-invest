"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, MapIcon, MapPinIcon, XIcon } from "lucide-react"

import { toggleSaved } from "@/app/actions"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { AreaThumbnail } from "@/components/page/area-thumbnail"
import { Item } from "@/components/ui/item"
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format"
import type { AreaThumbnail as Thumb } from "@/lib/queries"

/** Link class của wishlist-2 (ECOMMERCE_LINK_CLASS_NAME). */
const LINK = "underline-offset-2 transition-colors hover:text-primary hover:underline"

export type SavedArea = {
  id: string
  name: string
  parentName: string | null
  regionType: "market" | "submarket"
  href: string
  savedAt: string
  listings: number | null
  revpar: number | null
  occupancy: number | null
  adr: number | null
  currency: string
  /** Ảnh một listing tự thu trong khu vực; null → panel số như cũ. */
  thumbnail: Thumb | null
}

/**
 * Thẻ khu vực đã lưu — chuyển thể WishlistItemCard của @reui/wishlist-2. Panel ảnh là ảnh một
 * listing tự thu trong khu vực (số RevPAR xuống dòng chữ dưới tên); khu vực chưa có ảnh thì panel
 * thành panel số (RevPAR + công suất, ADR). Nút ✕ gỡ lưu bằng server action; "Add to cart" → "Xem Insight".
 */
export function SavedItemCard({ area }: { area: SavedArea }) {
  const isMarket = area.regionType === "market"
  const [photoBroken, setPhotoBroken] = useState(false)
  const onBroken = useCallback(() => setPhotoBroken(true), [])
  const photo = area.thumbnail && !photoBroken ? area.thumbnail : null
  return (
    <article className="group/card flex min-w-0 flex-col gap-3">
      <Item variant="muted" className="relative aspect-[4/3] flex-col items-start justify-end gap-1 overflow-hidden p-4">
        {/* Ảnh đứng đầu để nằm dưới nhãn loại và nút ✕ (cùng lớp absolute, thứ tự DOM quyết lớp). */}
        {photo && <AreaThumbnail thumb={photo} areaName={area.name} onBroken={onBroken} />}
        <div className="pointer-events-none absolute top-2 left-2">
          {/* Trên ảnh dùng biến thể nền đặc — biến thể light/outline trong suốt, chìm vào ảnh. */}
          <Badge
            variant={photo ? (isMarket ? "info" : "secondary") : isMarket ? "info-light" : "outline"}
            radius="full"
            className="gap-1 pr-2 pl-1.5"
          >
            {isMarket ? (
              <MapIcon aria-hidden="true" className="size-3" />
            ) : (
              <MapPinIcon aria-hidden="true" className="size-3" />
            )}
            {isMarket ? "Thị trường" : "Phường"}
          </Badge>
        </div>
        <form action={toggleSaved} className="absolute top-2 right-2">
          <input type="hidden" name="areaId" value={area.id} />
          <input type="hidden" name="redirectTo" value="/saved" />
          <Button
            variant="secondary"
            size="icon-sm"
            type="submit"
            aria-label={`Bỏ lưu ${area.name}`}
            className="bg-background/90 opacity-0 backdrop-blur-sm transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-focus-within/card:opacity-100 group-hover/card:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
          >
            <XIcon aria-hidden="true" />
          </Button>
        </form>
        {!photo && (
          <>
            <span className="text-muted-foreground text-xs">RevPAR</span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {area.revpar ? fmtMoney(area.revpar, area.currency) : "—"}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              Công suất {fmtPct(area.occupancy)} · ADR {area.adr ? fmtMoney(area.adr, area.currency) : "—"}
            </span>
          </>
        )}
      </Item>

      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-muted-foreground min-w-0 truncate text-xs font-medium">
          {area.parentName ?? "Việt Nam"}
        </span>
        <h3 className="text-foreground min-w-0 text-sm leading-tight font-semibold tracking-tight sm:text-base">
          <Link href={area.href} prefetch={false} className={`${LINK} block truncate`}>
            {area.name}
          </Link>
        </h3>
        {photo && (
          <p className="flex items-baseline gap-1.5 tabular-nums">
            <span className="text-sm font-semibold">{area.revpar ? fmtMoney(area.revpar, area.currency) : "—"}</span>
            <span className="text-muted-foreground text-xs">RevPAR · Công suất {fmtPct(area.occupancy)}</span>
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          {area.listings !== null ? `${fmtInt(area.listings)} listing · ` : ""}
          Lưu ngày {area.savedAt.split("-").reverse().join("/")}
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        nativeButton={false}
        render={<Link href={area.href} prefetch={false} />}
      >
        Xem Insight
        <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
      </Button>
    </article>
  )
}
