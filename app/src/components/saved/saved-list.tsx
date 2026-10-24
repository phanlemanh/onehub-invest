"use client"

import { FilterIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SavedItemCard, type SavedArea } from "./saved-item"
import { useSavedFilter, type SavedFilter } from "./saved-filter"

const FILTERS: { value: SavedFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "market", label: "Thị trường" },
  { value: "submarket", label: "Phường" },
]

/**
 * Đã lưu — chuyển thể Wishlist của @reui/wishlist-2: tab lọc có số, lưới thẻ, trạng thái
 * trống của tab. Tiêu đề + đếm + "So sánh" nằm ở PageHeader của trang; trống hẳn (chưa lưu gì)
 * là c-empty-11 ở trang, không tới đây.
 */
export function SavedList({ areas }: { areas: SavedArea[] }) {
  const { filter, setFilter } = useSavedFilter()
  const counts: Record<SavedFilter, number> = {
    all: areas.length,
    market: areas.filter((a) => a.regionType === "market").length,
    submarket: areas.filter((a) => a.regionType === "submarket").length,
  }
  const shown = filter === "all" ? areas : areas.filter((a) => a.regionType === filter)

  return (
    <section aria-label="Khu vực đã lưu" className="flex flex-col gap-6">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as SavedFilter)}>
        <TabsList variant="line" className="w-full justify-start gap-1 border-b">
          {FILTERS.map((option) => {
            const count = counts[option.value]
            return (
              <TabsTrigger
                key={option.value}
                value={option.value}
                disabled={count === 0 && option.value !== "all"}
                aria-label={`${option.label}, ${count} khu vực`}
                className="gap-2"
              >
                <span>{option.label}</span>
                <Badge variant="secondary" radius="full" className="tabular-nums">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {shown.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilterIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Không có khu vực nào ở mục này</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" size="sm" onClick={() => setFilter("all")}>
              Xem tất cả
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul role="list" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {shown.map((area) => (
            <li key={area.id} className="min-w-0">
              <SavedItemCard area={area} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
