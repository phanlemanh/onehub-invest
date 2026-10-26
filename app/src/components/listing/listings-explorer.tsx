"use client"

import { useMemo, useState } from "react"
import { XIcon } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/reui/badge"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import type { FilterQuery } from "@/components/reui/filters/filters-types"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RegionError } from "@/components/states/region-error"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fmtInt } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"
import { activeFilterCount, compileListingFilter } from "./listing-filter-query"
import { ListingCard } from "./listing-card"
import { ListingsFilterBar } from "./listings-filter-bar"
import { ListingsFilterSheet } from "./listings-filter-sheet"
import { ListingsMap, inView, type ViewBounds } from "./listings-map"

type SortKey = "revenue" | "occupancy" | "price-desc" | "price-asc"

const SORTS: { value: SortKey; label: string }[] = [
  { value: "revenue", label: "Doanh thu" },
  { value: "occupancy", label: "Công suất" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "price-asc", label: "Giá thấp → cao" },
]

const COMPARE: Record<SortKey, (a: ListingCardRow, b: ListingCardRow) => number> = {
  revenue: (a, b) => b.revenue - a.revenue || b.booked - a.booked,
  occupancy: (a, b) => (b.occupancy ?? -1) - (a.occupancy ?? -1),
  "price-desc": (a, b) => (b.priceListed ?? -1) - (a.priceListed ?? -1),
  "price-asc": (a, b) =>
    (a.priceListed ?? Number.POSITIVE_INFINITY) - (b.priceListed ?? Number.POSITIVE_INFINITY),
}

const PAGE = 24

// Pressed lifts to the card surface (chart-6 toolbar pattern).
const TOGGLE_ITEM =
  "text-muted-foreground data-pressed:bg-card dark:data-pressed:bg-muted data-pressed:text-foreground"

/**
 * Duyệt listing (IA §3.2, AirDNA "Short-term Rentals"): bộ lọc | lưới thẻ | bản đồ nhãn giá.
 * Bộ lọc thuộc tính là MỘT cây `FilterQuery`: thanh chip @reui/filters ở màn rộng, ngăn filter-sidebar-5
 * ở màn hẹp. Kéo/zoom bản đồ → lưới lọc thêm theo vùng đang xem (cả hai lớp lọc cùng áp); bản đồ chỉ
 * hiện listing khớp bộ lọc thuộc tính; rê chuột thẻ ↔ nhãn sáng.
 */
export function ListingsExplorer({
  listings,
  currency,
  capNote = null,
}: {
  listings: ListingCardRow[]
  currency: string
  /** Ghi chú khi trang chỉ tải một phần listing của thị trường. */
  capNote?: string | null
}) {
  const [sort, setSort] = useState<SortKey>("revenue")
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())
  const [view, setViewBounds] = useState<ViewBounds | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const [mode, setMode] = useState<"list" | "map">("list")
  const [resetKey, setResetKey] = useState(0)

  // Bản đồ hiện mọi listing khớp bộ lọc thuộc tính; lưới còn lọc thêm theo khung nhìn.
  const matched = useMemo(() => listings.filter(compileListingFilter(query)), [listings, query])
  const rows = useMemo(
    () => (view ? matched.filter((l) => inView(view, l)) : matched).sort(COMPARE[sort]),
    [matched, view, sort]
  )
  const filtering = activeFilterCount(query) > 0

  function changeQuery(next: FilterQuery) {
    setQuery(next)
    setShown(PAGE)
  }
  function clearViewport() {
    setViewBounds(null)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden min-w-0 flex-1 lg:block">
          <ListingsFilterBar listings={listings} currency={currency} query={query} onQueryChange={changeQuery} />
        </div>
        <div className="lg:hidden">
          <ListingsFilterSheet listings={listings} currency={currency} query={query} onQueryChange={changeQuery} />
        </div>

        <Select
          value={sort}
          items={SORTS}
          onValueChange={(value) => value && setSort(value as SortKey)}
        >
          <SelectTrigger aria-label="Sắp xếp" className="min-w-44">
            <span className="text-muted-foreground">Xếp theo</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          multiple={false}
          value={[mode]}
          onValueChange={(value) => value[0] && setMode(value[0] as "list" | "map")}
          variant="outline"
          spacing={0}
          aria-label="Chế độ xem"
          className="ml-auto lg:hidden"
        >
          <ToggleGroupItem value="list" className={TOGGLE_ITEM}>
            Danh sách
          </ToggleGroupItem>
          <ToggleGroupItem value="map" className={TOGGLE_ITEM}>
            Bản đồ
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className={cn("flex min-w-0 flex-col gap-4", mode === "map" && "max-lg:hidden")}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {fmtInt(rows.length)} listing
              {view ? " trong vùng bản đồ" : filtering ? " khớp bộ lọc" : ""}
            </p>
            {capNote && <p className="text-muted-foreground text-xs">{capNote}</p>}
            {view && (
              <Badge variant="info-light" className="gap-1.5">
                Đang lọc theo vùng bản đồ
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="-me-1"
                  aria-label="Bỏ lọc theo vùng bản đồ"
                  onClick={clearViewport}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </Badge>
            )}
          </div>
          {rows.length === 0 ? (
            matched.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>Không có listing khớp bộ lọc</EmptyTitle>
                  <EmptyDescription>Nới điều kiện, hoặc xoá bộ lọc để xem mọi listing.</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" size="sm" onClick={() => changeQuery(createFilterQuery())}>
                  Xoá bộ lọc
                </Button>
              </Empty>
            ) : (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>Không có listing trong vùng này</EmptyTitle>
                  <EmptyDescription>Kéo bản đồ sang chỗ khác, hoặc bỏ lọc theo vùng.</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" size="sm" onClick={clearViewport}>
                  Bỏ lọc vùng
                </Button>
              </Empty>
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.slice(0, shown).map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currency={currency}
                  active={listing.id === activeId}
                  onHover={setActiveId}
                />
              ))}
            </div>
          )}
          {rows.length > shown && (
            <Button variant="outline" className="self-center" onClick={() => setShown((n) => n + PAGE)}>
              Xem thêm {fmtInt(Math.min(PAGE, rows.length - shown))} listing
            </Button>
          )}
        </div>

        <div className={cn("min-w-0 lg:sticky lg:top-4", mode === "list" && "max-lg:hidden")}>
          <Frame spacing="default" className="w-full min-w-0">
            <FrameHeader>
              <FrameTitle role="heading" aria-level={3}>
                Bản đồ giá
              </FrameTitle>
              <FrameDescription>
                Nhãn = giá niêm yết một đêm · kéo hoặc zoom để lọc danh sách
              </FrameDescription>
            </FrameHeader>
            <FramePanel className="h-[60svh] overflow-hidden p-0 lg:h-[calc(100svh-12rem)]">
              <RegionError what="bản đồ">
                <ListingsMap
                  listings={matched}
                  currency={currency}
                  activeId={activeId}
                  onHover={setActiveId}
                  onViewportChange={(bounds) => {
                    setViewBounds(bounds)
                    setShown(PAGE)
                  }}
                  holdView={view !== null}
                  resetKey={resetKey}
                />
              </RegionError>
            </FramePanel>
          </Frame>
        </div>
      </div>
    </div>
  )
}
