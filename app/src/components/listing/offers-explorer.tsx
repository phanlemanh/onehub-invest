"use client"

import { useMemo, useState, useTransition, type MouseEvent, type ReactNode } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BedDoubleIcon, BanknoteIcon, HouseIcon, MapPinIcon, RulerIcon } from "lucide-react"

import { Filters } from "@/components/reui/filters/filters"
import type { FilterField, FilterQuery, FilterValueDisplayContext } from "@/components/reui/filters/filters-types"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { fmtInt } from "@/lib/format"
import {
  OFFERS_MAX_OFFSET,
  OFFERS_PAGE_SIZE,
  type OfferFilters,
  type OfferSort,
  type OfferWard,
  type PublicOffer,
} from "@/lib/offers-filters"
import { KIND, LABELS_VI, PROPERTY_TYPE } from "@/lib/vocab.generated"
import { FILTER_LABELS_VI, FILTER_OPERATORS_VI } from "./listings-filter-bar"
import { OfferCard } from "./offer-card"
import { OFFER_FIELD, paramsFromOfferQuery, priceUnit, queryFromOfferFilters } from "./offer-filter-query"
import { OffersFilterSheet } from "./offers-filter-sheet"

const SORTS: { value: OfferSort; label: string }[] = [
  { value: "newest", label: "Mới cập nhật" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "perm2-asc", label: "Giá/m² thấp → cao" },
]

const ICON = "size-4"

/** Các tham số bộ lọc trên URL; đổi bộ lọc thì về trang đầu. */
const FILTER_KEYS = ["ward", "type", "price_min", "price_max", "area_min", "area_max", "bedrooms"]

function ops(...values: string[]) {
  return values.map((value) => ({
    value,
    label: FILTER_OPERATORS_VI[value] ?? value,
    arity: value === "is_any_of" ? ("many" as const) : value === "between" ? ("range" as const) : ("one" as const),
  }))
}

/** Giá trị chip số: dấu phẩy thập phân kiểu Việt, phân nhóm nghìn; `1,5` tỷ không bị làm tròn thành 2. */
function numberText({ values }: FilterValueDisplayContext) {
  const one = (v: unknown) => (typeof v === "number" ? v.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "…")
  return values.length > 1 ? `${one(values[0])} – ${one(values[1])}` : one(values[0])
}

/** Số trang hiện ra: đầu, cuối, hai bên trang đang xem; `null` là chỗ ngắt. */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  const keep = [...new Set([1, page - 1, page, page + 1, pageCount])].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b)
  return keep.flatMap((n, i) => (i > 0 && n - keep[i - 1] > 1 ? [null, n] : [n]))
}

function offerFields(wards: OfferWard[], kind: OfferFilters["kind"]): FilterField[] {
  const unit = priceUnit(kind).label
  return [
    {
      id: OFFER_FIELD.ward,
      label: "Phường",
      icon: <MapPinIcon className={ICON} aria-hidden="true" />,
      type: "select",
      searchable: true,
      operators: ops("is_any_of"),
      defaultOperator: "is_any_of",
      options: wards.map((w) => ({ value: w.id, label: w.name, description: `${fmtInt(w.n)} tin` })),
    },
    {
      id: OFFER_FIELD.type,
      label: "Loại hình",
      icon: <HouseIcon className={ICON} aria-hidden="true" />,
      type: "select",
      searchable: false,
      operators: ops("is_any_of"),
      defaultOperator: "is_any_of",
      options: Object.values(PROPERTY_TYPE)
        .filter((t) => t !== PROPERTY_TYPE.unknown)
        .map((value) => ({ value, label: LABELS_VI.property_type[value] })),
    },
    {
      id: OFFER_FIELD.price,
      label: `Giá (${unit})`,
      icon: <BanknoteIcon className={ICON} aria-hidden="true" />,
      type: "number",
      operators: ops("between", "gte", "lte"),
      defaultOperator: "between",
      placeholder: unit,
      valueText: numberText,
      renderValue: numberText,
    },
    {
      id: OFFER_FIELD.bedrooms,
      label: "Phòng ngủ",
      icon: <BedDoubleIcon className={ICON} aria-hidden="true" />,
      type: "number",
      operators: ops("gte"),
      defaultOperator: "gte",
      placeholder: "số phòng ngủ",
    },
    {
      id: OFFER_FIELD.area,
      label: "Diện tích (m²)",
      icon: <RulerIcon className={ICON} aria-hidden="true" />,
      type: "number",
      operators: ops("between", "gte", "lte"),
      defaultOperator: "between",
      placeholder: "m²",
    },
  ]
}

/**
 * Duyệt tin bán, tin thuê dài hạn của một thị trường: lọc bằng thanh chip, lưới thẻ chung của Listing, phân trang ở máy
 * chủ. URL giữ trạng thái đã áp nên chia sẻ được; bộ lọc đang soạn dở chỉ ở trong cây chip.
 */
export function OffersExplorer({
  rows,
  total,
  withPhone,
  filters,
  wards,
  wardHrefs,
  toolbarStart = null,
}: {
  rows: PublicOffer[]
  total: number
  withPhone: number
  filters: OfferFilters
  wards: OfferWard[]
  /** Đường tới trang Insight của từng phường, tính ở máy chủ. */
  wardHrefs: Record<string, string>
  /** Ô đứng đầu hàng công cụ (thời hạn thuê). */
  toolbarStart?: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState<FilterQuery>(() => queryFromOfferFilters(filters))
  const fields = useMemo(() => offerFields(wards, filters.kind), [wards, filters.kind])

  function go(change: (q: URLSearchParams) => void) {
    const q = new URLSearchParams(search.toString())
    change(q)
    const qs = q.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  /** Đổi tham số lọc thì về trang đầu. */
  function apply(change: (q: URLSearchParams) => void) {
    go((q) => {
      change(q)
      q.delete("page")
    })
  }

  function changeQuery(next: FilterQuery) {
    setQuery(next)
    const applied = paramsFromOfferQuery(next, filters.kind)
    const current = Object.fromEntries(FILTER_KEYS.flatMap((k) => (search.get(k) ? [[k, search.get(k) as string]] : [])))
    if (JSON.stringify(Object.entries(applied).sort()) === JSON.stringify(Object.entries(current).sort())) return
    apply((q) => {
      for (const k of FILTER_KEYS) q.delete(k)
      for (const [k, v] of Object.entries(applied)) q.set(k, v)
    })
  }

  function clearAll() {
    setQuery(queryFromOfferFilters({ ...filters, wards: [], types: [], priceMin: null, priceMax: null, areaMin: null, areaMax: null, bedroomsMin: null }))
    apply((q) => {
      for (const k of [...FILTER_KEYS, "has_phone"]) q.delete(k)
    })
  }

  const reachable = Math.min(total, OFFERS_MAX_OFFSET + OFFERS_PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(reachable / OFFERS_PAGE_SIZE))
  const page = Math.floor(filters.offset / OFFERS_PAGE_SIZE) + 1
  const pageHref = (next: number) => {
    const q = new URLSearchParams(search.toString())
    if (next > 1) q.set("page", String(next))
    else q.delete("page")
    const qs = q.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }
  /** Link thật (mở tab mới, chia sẻ được); bấm thường thì chuyển trang mềm và lên đầu trang. */
  const pageLink = (next: number) => {
    const href = pageHref(next)
    return {
      href,
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        startTransition(() => router.push(href))
      },
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarStart}
        <div className="hidden min-w-0 flex-1 lg:block">
          <Filters
            fields={fields}
            query={query}
            onQueryChange={changeQuery}
            labels={FILTER_LABELS_VI}
            operatorLabels={FILTER_OPERATORS_VI}
            showClear
          />
        </div>
        <div className="lg:hidden">
          <OffersFilterSheet filters={filters} wards={wards} onQueryChange={changeQuery} />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            id="offers-has-phone"
            checked={filters.hasPhone}
            onCheckedChange={(on) => apply((q) => (on ? q.set("has_phone", "1") : q.delete("has_phone")))}
          />
          <Label htmlFor="offers-has-phone">Chỉ tin có số</Label>
        </div>
        <Select
          value={filters.sort}
          items={SORTS}
          onValueChange={(value) => value && apply((q) => (value === "newest" ? q.delete("sort") : q.set("sort", value)))}
        >
          <SelectTrigger aria-label="Sắp xếp" className="min-w-44">
            <span className="text-muted-foreground">Xếp theo</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {fmtInt(total)} tin {filters.kind === KIND.rent_lt ? "thuê dài hạn" : "bán"} · {fmtInt(withPhone)} tin có số · cập
          nhật trong 30 ngày
        </p>
        {total > reachable && (
          <p className="text-muted-foreground text-xs">Hiện {fmtInt(reachable)} tin đầu, thu hẹp bộ lọc để xem thêm.</p>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Không có tin khớp bộ lọc</EmptyTitle>
            <EmptyDescription>Nới khoảng giá, diện tích hoặc bỏ bớt điều kiện.</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" size="sm" onClick={clearAll}>Xoá bộ lọc</Button>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4" aria-busy={pending}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((offer) => (
              <OfferCard key={offer.offerId} offer={offer} wardHref={wardHrefs[offer.ward.id] ?? null} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm tabular-nums">
                Trang {fmtInt(page)} / {fmtInt(pageCount)}
              </p>
              <Pagination aria-label="Phân trang" className="mx-0 w-auto">
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious text="Trước" aria-label="Trang trước" {...pageLink(page - 1)} />
                    </PaginationItem>
                  )}
                  {pageWindow(page, pageCount).map((n, i) =>
                    n === null ? (
                      <PaginationItem key={`gap-${i}`} className="max-sm:hidden">
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={n} className="max-sm:hidden">
                        <PaginationLink isActive={n === page} aria-label={`Trang ${n}`} {...pageLink(n)}>
                          {fmtInt(n)}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  {page < pageCount && (
                    <PaginationItem>
                      <PaginationNext text="Sau" aria-label="Trang sau" {...pageLink(page + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
