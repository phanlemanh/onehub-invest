"use client"

import { useState } from "react"
import { FilterIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import type { FilterQuery } from "@/components/reui/filters/filters-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import { fmtInt } from "@/lib/format"
import type { OfferFilters, OfferWard } from "@/lib/offers-filters"
import { LABELS_VI, PROPERTY_TYPE } from "@/lib/vocab.generated"
import { BEDROOM_STEPS } from "./listing-filter-query"
import { priceUnit, queryFromOfferFilters } from "./offer-filter-query"

type Draft = {
  wards: string[]
  types: string[]
  price: [string, string]
  area: [string, string]
  bedrooms: number | null
}

const EMPTY: Draft = { wards: [], types: [], price: ["", ""], area: ["", ""], bedrooms: null }

const TYPES = Object.values(PROPERTY_TYPE)
  .filter((t) => t !== PROPERTY_TYPE.unknown)
  .map((value) => ({ value, label: LABELS_VI.property_type[value] }))

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

/** Ô số người dùng gõ, chấp nhận dấu phẩy thập phân; trống hoặc không dương là không chặn. */
function parseField(text: string, scale: number): number | null {
  const n = Number(text.trim().replace(",", "."))
  return text.trim() !== "" && Number.isFinite(n) && n > 0 ? Math.round(n * scale) : null
}

const showField = (v: number | null, scale: number) => (v === null ? "" : String(v / scale).replace(".", ","))

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
  options: { value: string; label: string; count?: number }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {options.map((option) => {
        const id = `offer-filter-${name}-${option.value}`
        return (
          <li key={option.value} className="flex items-center gap-2.5">
            <Checkbox id={id} checked={selected.includes(option.value)} onCheckedChange={() => onToggle(option.value)} />
            <Label htmlFor={id} className="text-foreground flex min-w-0 flex-1 justify-between gap-3 text-sm font-normal">
              <span className="truncate">{option.label}</span>
              {option.count !== undefined && <span className="text-muted-foreground tabular-nums">{fmtInt(option.count)}</span>}
            </Label>
          </li>
        )
      })}
    </ul>
  )
}

function RangeInputs({
  name,
  label,
  unit,
  value,
  onChange,
}: {
  name: string
  label: string
  unit: string
  value: [string, string]
  onChange: (next: [string, string]) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`offer-filter-${name}-min`} className="text-muted-foreground text-xs font-normal">
          Từ ({unit})
        </Label>
        <Input
          id={`offer-filter-${name}-min`}
          inputMode="decimal"
          aria-label={`${label} từ`}
          value={value[0]}
          onChange={(e) => onChange([e.target.value, value[1]])}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`offer-filter-${name}-max`} className="text-muted-foreground text-xs font-normal">
          Đến ({unit})
        </Label>
        <Input
          id={`offer-filter-${name}-max`}
          inputMode="decimal"
          aria-label={`${label} đến`}
          value={value[1]}
          onChange={(e) => onChange([value[0], e.target.value])}
        />
      </div>
    </div>
  )
}

/**
 * Ngăn lọc tin rao màn hẹp — chuyển thể @reui/filter-sidebar-5 theo ngăn của thuê ngắn hạn: nút «Bộ lọc» mang số bộ lọc
 * đang áp, Sheet có đầu và chân ghim, thân cuộn; chọn trong ngăn là NHÁP, «Áp dụng» mới ghi vào cây lọc chung với thanh
 * chip. Khác ngăn thuê ngắn hạn: lọc chạy ở máy chủ nên không có số tin sống; số cạnh phường là số tin của phường theo
 * loại tin, giá và diện tích nhập số vì khoảng giá quá rộng cho thanh trượt.
 */
export function OffersFilterSheet({
  filters,
  wards,
  onQueryChange,
}: {
  filters: OfferFilters
  wards: OfferWard[]
  onQueryChange: (query: FilterQuery) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const { scale, label: unit } = priceUnit(filters.kind)

  const applied =
    (filters.wards.length ? 1 : 0) +
    (filters.types.length ? 1 : 0) +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0) +
    (filters.areaMin !== null || filters.areaMax !== null ? 1 : 0) +
    (filters.bedroomsMin !== null ? 1 : 0)

  function onOpenChange(next: boolean) {
    if (next) {
      setDraft({
        wards: filters.wards,
        types: filters.types,
        price: [showField(filters.priceMin, scale), showField(filters.priceMax, scale)],
        area: [showField(filters.areaMin, 1), showField(filters.areaMax, 1)],
        bedrooms: filters.bedroomsMin,
      })
    }
    setOpen(next)
  }

  function apply() {
    onQueryChange(
      queryFromOfferFilters({
        ...filters,
        wards: draft.wards,
        types: draft.types,
        priceMin: parseField(draft.price[0], scale),
        priceMax: parseField(draft.price[1], scale),
        areaMin: parseField(draft.area[0], 1),
        areaMax: parseField(draft.area[1], 1),
        bedroomsMin: draft.bedrooms,
      })
    )
    setOpen(false)
  }

  const dirty =
    draft.wards.length > 0 || draft.types.length > 0 || draft.price.some(Boolean) || draft.area.some(Boolean) || draft.bedrooms !== null

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
        aria-label="Bộ lọc tin"
        className="inset-y-4 right-4 left-auto h-[calc(100svh-2rem)] w-[min(28rem,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-xl p-0 outline-none"
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-foreground text-sm font-semibold tracking-tight">Bộ lọc</SheetTitle>
            <SheetDescription className="sr-only">Lọc tin theo loại hình, giá, số phòng ngủ, diện tích và phường.</SheetDescription>
          </div>
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
        </SheetHeader>

        <Separator />

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col py-5">
            <section className="flex flex-col gap-3 px-5" aria-labelledby="offer-filter-type">
              <h3 id="offer-filter-type" className="text-foreground text-sm font-semibold tracking-tight">
                Loại hình
              </h3>
              <CheckList
                name="type"
                options={TYPES}
                selected={draft.types}
                onToggle={(v) => setDraft((d) => ({ ...d, types: toggle(d.types, v) }))}
              />
            </section>

            <ContentSeparator />

            <section className="flex flex-col gap-3 px-5" aria-labelledby="offer-filter-price">
              <h3 id="offer-filter-price" className="text-foreground text-sm font-semibold tracking-tight">
                Giá
              </h3>
              <RangeInputs name="price" label="Giá" unit={unit} value={draft.price} onChange={(price) => setDraft((d) => ({ ...d, price }))} />
            </section>

            <ContentSeparator />

            <section className="flex flex-col gap-3 px-5" aria-labelledby="offer-filter-bedrooms">
              <h3 id="offer-filter-bedrooms" className="text-foreground text-sm font-semibold tracking-tight">
                Phòng ngủ
              </h3>
              <RadioGroup
                value={draft.bedrooms === null ? "any" : String(draft.bedrooms)}
                onValueChange={(value) => setDraft((d) => ({ ...d, bedrooms: value === "any" ? null : Number(value) }))}
                className="flex flex-col gap-2"
              >
                {[{ value: "any", label: "Bất kỳ" }, ...BEDROOM_STEPS.map((n) => ({ value: String(n), label: `Từ ${n} phòng ngủ` }))].map((option) => {
                  const id = `offer-filter-bedrooms-${option.value}`
                  return (
                    <div key={option.value} className="flex items-center gap-2.5">
                      <RadioGroupItem id={id} value={option.value} />
                      <Label htmlFor={id} className="text-foreground text-sm font-normal">
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </section>

            <ContentSeparator />

            <section className="flex flex-col gap-3 px-5" aria-labelledby="offer-filter-area">
              <h3 id="offer-filter-area" className="text-foreground text-sm font-semibold tracking-tight">
                Diện tích
              </h3>
              <RangeInputs name="area" label="Diện tích" unit="m²" value={draft.area} onChange={(area) => setDraft((d) => ({ ...d, area }))} />
            </section>

            <ContentSeparator />

            <section className="flex flex-col gap-3 px-5" aria-labelledby="offer-filter-ward">
              <h3 id="offer-filter-ward" className="text-foreground text-sm font-semibold tracking-tight">
                Phường
              </h3>
              <CheckList
                name="ward"
                options={wards.map((w) => ({ value: w.id, label: w.name, count: w.n }))}
                selected={draft.wards}
                onToggle={(v) => setDraft((d) => ({ ...d, wards: toggle(d.wards, v) }))}
              />
            </section>
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="flex flex-row items-center gap-2 px-5 py-4">
          <Button type="button" size="sm" className="flex-1" onClick={apply}>
            Áp dụng
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDraft(EMPTY)}
            disabled={!dirty}
            className="text-muted-foreground hover:text-foreground"
          >
            Đặt lại
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
