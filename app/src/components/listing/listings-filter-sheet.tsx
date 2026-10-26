"use client"

import { useMemo, useState } from "react"
import { FilterIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/reui/badge"
import type { FilterQuery, FilterRule } from "@/components/reui/filters/filters-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { fmtInt, fmtMoneyCompact } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"
import {
  BEDROOM_STEPS,
  EMPTY_FACETS,
  FIELD,
  activeFilterCount,
  compileListingFilter,
  facetCounts,
  facetsFromQuery,
  queryFromFacets,
  type Facets,
} from "./listing-filter-query"
import { roomTypeVi } from "./listing-labels"

const STEP = 100_000

/**
 * Khung thanh trượt giá: từ giá thấp nhất tới bách phân vị 95 (làm tròn 100 nghìn). Giá cao bất thường
 * (tới hàng chục triệu) không kéo dãn cả thanh; kéo đầu phải tới cùng = không chặn trên.
 */
export function priceBounds(listings: Pick<ListingCardRow, "priceListed">[]): [number, number] | null {
  const prices = listings
    .map((l) => l.priceListed)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b)
  if (prices.length === 0) return null
  const lo = Math.floor(prices[0] / STEP) * STEP
  const hi = Math.ceil(prices[Math.min(prices.length - 1, Math.floor(prices.length * 0.95))] / STEP) * STEP
  return hi > lo ? [lo, hi] : null
}

/** Khoảng tách các mục trong thân ngăn — nét đứt thụt lề như bản gốc. */
function ContentSeparator() {
  return (
    <div className="px-5 py-5" aria-hidden="true">
      <div className="border-border border-t border-dashed" />
    </div>
  )
}

function CheckList({
  name,
  options,
  selected,
  onToggle,
}: {
  name: string
  options: { value: string; label: string; count: number }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {options.map((option) => {
        const id = `listing-filter-${name}-${option.value}`
        const checked = selected.includes(option.value)
        // Chọn thêm sẽ ra 0 listing với các lựa chọn khác — tắt (vẫn bỏ chọn được nếu đang chọn).
        const dead = option.count === 0 && !checked
        return (
          <li key={option.value} className="flex items-center gap-2.5">
            <Checkbox id={id} checked={checked} disabled={dead} onCheckedChange={() => onToggle(option.value)} />
            <Label
              htmlFor={id}
              className={cn("text-foreground flex min-w-0 flex-1 justify-between gap-3 text-sm font-normal", dead && "text-muted-foreground")}
            >
              <span className="truncate">{option.label}</span>
              <span className="text-muted-foreground tabular-nums">{fmtInt(option.count)}</span>
            </Label>
          </li>
        )
      })}
    </ul>
  )
}

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

/**
 * Ngăn lọc màn hẹp — chuyển thể @reui/filter-sidebar-5: nút «Bộ lọc» mang số bộ lọc đang áp, Sheet bên phải
 * có đầu và chân ghim, thân cuộn. Khác bản gốc: bốn mục của listing (Loại phòng, Phòng ngủ tối thiểu, Giá/đêm,
 * Phường — danh sách dài nhất xếp cuối) thay cho mục thời trang; số cạnh mỗi lựa chọn đếm sống trên listing đã tải (bản gốc là số cố định);
 * chip đang chọn là Badge + nút bỏ (bản gốc tự dựng nút tròn); chọn trong ngăn là NHÁP, «Xem N listing» mới
 * ghi vào cây lọc chung với thanh chip. Mở ngăn → nháp đọc lại từ cây hiện tại; điều kiện thanh chip mà ngăn
 * không biểu diễn được giữ nguyên khi áp (có dòng báo), «Xoá hết»/«Đặt lại» mới bỏ chúng.
 */
export function ListingsFilterSheet({
  listings,
  currency,
  query,
  onQueryChange,
}: {
  listings: ListingCardRow[]
  currency: string
  query: FilterQuery
  onQueryChange: (query: FilterQuery) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Facets>(EMPTY_FACETS)
  const [rest, setRest] = useState<FilterRule[]>([])
  const bounds = useMemo(() => priceBounds(listings), [listings])

  const areaCounts = useMemo(() => facetCounts(listings, draft, FIELD.area, rest), [listings, draft, rest])
  const roomCounts = useMemo(() => facetCounts(listings, draft, FIELD.roomType, rest), [listings, draft, rest])
  const allAreas = useMemo(
    () => [...new Set(listings.map((l) => l.areaName).filter((a): a is string => Boolean(a)))].sort((a, b) => a.localeCompare(b, "vi")),
    [listings]
  )
  const allRooms = useMemo(
    () => [...new Set(listings.map((l) => l.roomType).filter((r): r is string => Boolean(r)))],
    [listings]
  )
  const matching = useMemo(() => listings.filter(compileListingFilter(queryFromFacets(draft, rest))).length, [listings, draft, rest])
  const applied = activeFilterCount(query)

  function clearAll() {
    setDraft(EMPTY_FACETS)
    setRest([])
  }

  function onOpenChange(next: boolean) {
    if (next) {
      const read = facetsFromQuery(query)
      setDraft(read.facets)
      setRest(read.rest)
    }
    setOpen(next)
  }

  const price: [number, number] | null = bounds && [draft.price[0] ?? bounds[0], draft.price[1] ?? bounds[1]]
  const priceLabel = (v: number, end: 0 | 1) =>
    bounds && end === 1 && v >= bounds[1] ? `${fmtMoneyCompact(v, currency)}+` : fmtMoneyCompact(v, currency)

  const chips = [
    ...draft.areas.map((a) => ({ key: `a:${a}`, label: a, remove: () => setDraft((d) => ({ ...d, areas: d.areas.filter((x) => x !== a) })) })),
    ...draft.roomTypes.map((r) => ({
      key: `r:${r}`,
      label: roomTypeVi(r) ?? r,
      remove: () => setDraft((d) => ({ ...d, roomTypes: d.roomTypes.filter((x) => x !== r) })),
    })),
    ...(draft.minBedrooms !== null
      ? [{ key: "b", label: `Từ ${draft.minBedrooms} phòng ngủ`, remove: () => setDraft((d) => ({ ...d, minBedrooms: null })) }]
      : []),
    ...(price && (draft.price[0] !== null || draft.price[1] !== null)
      ? [{ key: "p", label: `${priceLabel(price[0], 0)} – ${priceLabel(price[1], 1)}`, remove: () => setDraft((d) => ({ ...d, price: [null, null] })) }]
      : []),
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline">
            <FilterIcon data-icon="inline-start" aria-hidden="true" />
            Bộ lọc
            {applied > 0 ? (
              <Badge variant="secondary" size="sm" radius="full" className="ml-1 tabular-nums">
                {fmtInt(applied)}
              </Badge>
            ) : null}
          </Button>
        }
      />

      <SheetContent
        side="right"
        showCloseButton={false}
        initialFocus={false}
        aria-label="Bộ lọc listing"
        className="inset-y-4 right-4 left-auto h-[calc(100svh-2rem)] w-[min(28rem,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-xl p-0 outline-none"
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-foreground text-sm font-semibold tracking-tight">Bộ lọc</SheetTitle>
            <SheetDescription className="sr-only">Lọc listing theo phường, loại phòng, số phòng ngủ và giá một đêm.</SheetDescription>
          </div>
          <div className="flex items-center gap-1">
            {chips.length > 0 || rest.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Xoá hết
              </Button>
            ) : null}
            <SheetClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Đóng bộ lọc"
                  className="text-muted-foreground hover:text-foreground size-7"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              }
            />
          </div>
        </SheetHeader>

        <Separator />

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col py-5">
            {rest.length > 0 && (
              <p className="text-muted-foreground px-5 pb-4 text-xs">
                Còn {fmtInt(rest.length)} điều kiện từ thanh lọc màn rộng không chỉnh được ở đây — vẫn được áp; «Xoá hết» bỏ cả chúng.
              </p>
            )}
            {chips.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5 px-5" aria-label="Bộ lọc đang chọn">
                  {chips.map((chip) => (
                    <Badge key={chip.key} variant="outline" className="gap-1">
                      {chip.label}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="-me-1"
                        aria-label={`Bỏ ${chip.label}`}
                        onClick={chip.remove}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <ContentSeparator />
              </>
            ) : null}

            <section className="flex flex-col gap-3 px-5" aria-labelledby="listing-filter-room">
              <h3 id="listing-filter-room" className="text-foreground text-sm font-semibold tracking-tight">
                Loại phòng
              </h3>
              <CheckList
                name="room"
                options={allRooms.map((r) => ({ value: r, label: roomTypeVi(r) ?? r, count: roomCounts.get(r) ?? 0 }))}
                selected={draft.roomTypes}
                onToggle={(v) => setDraft((d) => ({ ...d, roomTypes: toggle(d.roomTypes, v) }))}
              />
            </section>

            <ContentSeparator />

            <section className="flex flex-col gap-3 px-5" aria-labelledby="listing-filter-bedrooms">
              <h3 id="listing-filter-bedrooms" className="text-foreground text-sm font-semibold tracking-tight">
                Phòng ngủ
              </h3>
              <RadioGroup
                value={draft.minBedrooms === null ? "any" : String(draft.minBedrooms)}
                onValueChange={(value) => setDraft((d) => ({ ...d, minBedrooms: value === "any" ? null : Number(value) }))}
                className="flex flex-col gap-2"
              >
                {[{ value: "any", label: "Bất kỳ" }, ...BEDROOM_STEPS.map((n) => ({ value: String(n), label: `Từ ${n} phòng ngủ` }))].map(
                  (option) => {
                    const id = `listing-filter-bedrooms-${option.value}`
                    return (
                      <div key={option.value} className="flex items-center gap-2.5">
                        <RadioGroupItem id={id} value={option.value} />
                        <Label htmlFor={id} className="text-foreground text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    )
                  }
                )}
              </RadioGroup>
            </section>

            {bounds && price && (
              <>
                <ContentSeparator />
                <section className="flex flex-col gap-4 px-5" aria-labelledby="listing-filter-price">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 id="listing-filter-price" className="text-foreground text-sm font-semibold tracking-tight">
                      Giá/đêm
                    </h3>
                    <span className="text-muted-foreground text-xs font-medium tabular-nums">
                      <span className="text-foreground font-semibold">{priceLabel(price[0], 0)}</span> –{" "}
                      <span className="text-foreground font-semibold">{priceLabel(price[1], 1)}</span>
                    </span>
                  </div>
                  <Slider
                    value={price}
                    onValueChange={(value) => {
                      const [lo, hi] = value as [number, number]
                      setDraft((d) => ({ ...d, price: [lo <= bounds[0] ? null : lo, hi >= bounds[1] ? null : hi] }))
                    }}
                    min={bounds[0]}
                    max={bounds[1]}
                    step={STEP}
                    aria-label="Khoảng giá một đêm"
                  />
                </section>
              </>
            )}

            {allAreas.length > 0 && (
              <>
                <ContentSeparator />
                <section className="flex flex-col gap-3 px-5" aria-labelledby="listing-filter-area">
                  <h3 id="listing-filter-area" className="text-foreground text-sm font-semibold tracking-tight">
                    Phường
                  </h3>
                  <CheckList
                    name="area"
                    options={allAreas.map((a) => ({ value: a, label: a, count: areaCounts.get(a) ?? 0 }))}
                    selected={draft.areas}
                    onToggle={(v) => setDraft((d) => ({ ...d, areas: toggle(d.areas, v) }))}
                  />
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="flex flex-row items-center gap-2 px-5 py-4">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => {
              onQueryChange(queryFromFacets(draft, rest))
              setOpen(false)
            }}
          >
            Xem {fmtInt(matching)} listing
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={chips.length === 0 && rest.length === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            Đặt lại
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
