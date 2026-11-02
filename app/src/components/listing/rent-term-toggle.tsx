"use client"

import { usePathname, useRouter } from "next/navigation"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LISTING_KIND, type ListingKind } from "@/lib/offers-filters"

// Pressed lifts to the card surface (chart-6 toolbar pattern), giống Danh sách | Bản đồ.
const TOGGLE_ITEM = "text-muted-foreground data-pressed:bg-card dark:data-pressed:bg-muted data-pressed:text-foreground"

/** Thời hạn thuê, đứng đầu hàng lọc của Cho thuê. Đổi thời hạn bỏ mọi bộ lọc vì trường lọc và đơn vị giá hai bên khác nhau. */
export function RentTermToggle({ kind }: { kind: ListingKind }) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <ToggleGroup
      multiple={false}
      value={[kind]}
      onValueChange={(value) => {
        if (value[0] && value[0] !== kind) router.push(value[0] === LISTING_KIND.rent_st ? `${pathname}?term=short` : pathname, { scroll: false })
      }}
      variant="outline"
      spacing={0}
      aria-label="Thời hạn thuê"
    >
      <ToggleGroupItem value={LISTING_KIND.rent_lt} className={TOGGLE_ITEM}>
        Dài hạn
      </ToggleGroupItem>
      <ToggleGroupItem value={LISTING_KIND.rent_st} className={TOGGLE_ITEM}>
        Ngắn hạn
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
