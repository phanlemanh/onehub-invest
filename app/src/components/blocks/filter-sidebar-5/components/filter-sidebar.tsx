"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/reui/badge"
import { Rating } from "@/components/reui/rating"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
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
import { Switch } from "@/components/ui/switch"
import { FilterIcon, XIcon, CheckIcon } from "lucide-react"

type FacetOption = {
  id: string
  label: string
  count: number
}

const DEPARTMENTS = [
  { id: "all", label: "All" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "kids", label: "Kids" },
] as const

type DepartmentId = (typeof DEPARTMENTS)[number]["id"]

const CATEGORIES: FacetOption[] = [
  { id: "outerwear", label: "Outerwear", count: 128 },
  { id: "knitwear", label: "Knitwear", count: 84 },
  { id: "tops", label: "Tops", count: 156 },
  { id: "bottoms", label: "Bottoms", count: 92 },
  { id: "dresses", label: "Dresses", count: 74 },
  { id: "footwear", label: "Footwear", count: 67 },
]

const MATERIALS: FacetOption[] = [
  { id: "cotton", label: "Cotton", count: 184 },
  { id: "linen", label: "Linen", count: 56 },
  { id: "wool", label: "Wool", count: 48 },
  { id: "cashmere", label: "Cashmere", count: 22 },
  { id: "leather", label: "Leather", count: 31 },
  { id: "recycled", label: "Recycled fibers", count: 64 },
]

const BRANDS: FacetOption[] = [
  { id: "northline", label: "Northline", count: 38 },
  { id: "aster", label: "Aster Goods", count: 24 },
  { id: "field", label: "Field Supply", count: 19 },
  { id: "maven", label: "Maven & Co.", count: 31 },
]

const COLORS: { id: string; label: string; swatch: string }[] = [
  { id: "black", label: "Black", swatch: "oklch(0.205 0 0)" },
  { id: "ivory", label: "Ivory", swatch: "oklch(0.96 0.012 90)" },
  { id: "beige", label: "Beige", swatch: "oklch(0.83 0.04 80)" },
  { id: "olive", label: "Olive", swatch: "oklch(0.55 0.07 120)" },
  { id: "navy", label: "Navy", swatch: "oklch(0.32 0.06 250)" },
  { id: "rust", label: "Rust", swatch: "oklch(0.55 0.13 40)" },
]

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const

const RATINGS = [
  { id: "4", label: "4 & up", stars: 4 },
  { id: "3", label: "3 & up", stars: 3 },
  { id: "2", label: "2 & up", stars: 2 },
] as const

type RatingId = (typeof RATINGS)[number]["id"] | "any"

const PRICE_MIN = 0
const PRICE_MAX = 240

type Chip = {
  key: string
  label: string
  swatch?: string
  remove: () => void
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

function findLabel(options: FacetOption[], id: string) {
  return options.find((o) => o.id === id)?.label ?? id
}

function findDeptLabel(id: DepartmentId) {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? id
}

/**
 * Full-width separator used between the sheet header / body / footer
 * boundaries. Owns 20px vertical breathing room above and below; the line
 * itself spans edge to edge of the sheet for a sharp zone divide.
 */
function EdgeSeparator() {
  return <Separator />
}

/**
 * Inset dashed separator used between filter sections inside the scrollable
 * body. Indented to the same `px-5` horizontal content level so it reads as
 * a within-content division rather than a structural zone boundary.
 */
function ContentSeparator() {
  return (
    <div className="px-5 py-5" aria-hidden="true">
      <div className="border-border border-t border-dashed" />
    </div>
  )
}

export function FilterSidebar() {
  // Preview ergonomic: default to `true` so the sheet renders on first paint
  // and reviewers do not have to click through. In production this should
  // start as `false` and the trigger button drives the open state.
  const [open, setOpen] = useState(true)
  const [department, setDepartment] = useState<DepartmentId>("women")
  const [categories, setCategories] = useState<string[]>(["outerwear"])
  const [materials, setMaterials] = useState<string[]>(["cotton"])
  const [brands, setBrands] = useState<string[]>(["northline"])
  const [colors, setColors] = useState<string[]>(["black"])
  const [sizes, setSizes] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([40, 180])
  const [rating, setRating] = useState<RatingId>("4")
  const [inStockOnly, setInStockOnly] = useState(true)
  const [onSaleOnly, setOnSaleOnly] = useState(false)

  const priceChanged =
    priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX

  const chips: Chip[] = useMemo(() => {
    const items: Chip[] = []
    if (department !== "all") {
      items.push({
        key: "dept",
        label: findDeptLabel(department),
        remove: () => setDepartment("all"),
      })
    }
    categories.forEach((id) =>
      items.push({
        key: `cat:${id}`,
        label: findLabel(CATEGORIES, id),
        remove: () => setCategories((c) => c.filter((x) => x !== id)),
      })
    )
    materials.forEach((id) =>
      items.push({
        key: `mat:${id}`,
        label: findLabel(MATERIALS, id),
        remove: () => setMaterials((m) => m.filter((x) => x !== id)),
      })
    )
    colors.forEach((id) => {
      const color = COLORS.find((c) => c.id === id)
      items.push({
        key: `color:${id}`,
        label: color?.label ?? id,
        swatch: color?.swatch,
        remove: () => setColors((c) => c.filter((x) => x !== id)),
      })
    })
    sizes.forEach((s) =>
      items.push({
        key: `size:${s}`,
        label: `Size ${s}`,
        remove: () => setSizes((arr) => arr.filter((x) => x !== s)),
      })
    )
    brands.forEach((id) =>
      items.push({
        key: `brand:${id}`,
        label: findLabel(BRANDS, id),
        remove: () => setBrands((b) => b.filter((x) => x !== id)),
      })
    )
    if (rating !== "any") {
      items.push({
        key: "rating",
        label: `${rating}★ & up`,
        remove: () => setRating("any"),
      })
    }
    if (priceChanged) {
      items.push({
        key: "price",
        label: `$${priceRange[0]} − $${priceRange[1]}`,
        remove: () => setPriceRange([PRICE_MIN, PRICE_MAX]),
      })
    }
    if (inStockOnly) {
      items.push({
        key: "in-stock",
        label: "In stock",
        remove: () => setInStockOnly(false),
      })
    }
    if (onSaleOnly) {
      items.push({
        key: "sale",
        label: "On sale",
        remove: () => setOnSaleOnly(false),
      })
    }
    return items
  }, [
    department,
    categories,
    materials,
    brands,
    colors,
    sizes,
    priceRange,
    priceChanged,
    rating,
    inStockOnly,
    onSaleOnly,
  ])

  const activeCount = chips.length

  function handleClearAll() {
    setDepartment("all")
    setCategories([])
    setMaterials([])
    setBrands([])
    setColors([])
    setSizes([])
    setPriceRange([PRICE_MIN, PRICE_MAX])
    setRating("any")
    setInStockOnly(false)
    setOnSaleOnly(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger surface: lives in the catalog page, opens the filter sheet */}
      <div className="flex min-h-[360px] w-full items-center justify-center">
        <SheetTrigger
          render={
            <Button type="button" variant="outline" size="lg">
              <FilterIcon data-icon="inline-start" aria-hidden="true" />
              Filters
              {activeCount > 0 ? (
                <Badge
                  variant="secondary"
                  size="sm"
                  radius="full"
                  className="ml-1 tabular-nums"
                >
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          }
        />
      </div>

      <SheetContent
        side="right"
        showCloseButton={false}
        initialFocus={false}
        aria-label="Product filters"
        className="inset-y-4 right-4 left-auto h-[calc(100svh-2rem)] w-[min(28rem,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-xl p-0 outline-none"
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-foreground text-sm font-semibold tracking-tight">
              Filters
            </SheetTitle>
            <SheetDescription className="sr-only">
              Refine the catalog by department, category, price, color, size,
              material, brand, rating, and availability.
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            ) : null}
            <SheetClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Close filters"
                  className="text-muted-foreground hover:text-foreground size-7"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              }
            />
          </div>
        </SheetHeader>

        <EdgeSeparator />

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col py-5">
            {/* Active filter chips (selected preview) */}
            {chips.length > 0 ? (
              <>
                <div
                  className="flex flex-wrap gap-1.5 px-5"
                  aria-label="Active filters"
                >
                  {chips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={chip.remove}
                      aria-label={`Remove filter ${chip.label}`}
                      className="border-border bg-muted/40 text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                      {chip.swatch ? (
                        <span
                          aria-hidden="true"
                          className="border-border/60 inline-block size-2.5 shrink-0 rounded-full border"
                          style={{ backgroundColor: chip.swatch }}
                        />
                      ) : null}
                      {chip.label}
                      <XIcon className="text-muted-foreground size-3" aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <ContentSeparator />
              </>
            ) : null}

            {/* Department pill row */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-department"
            >
              <h3
                id="filter-5-department"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Department
              </h3>
              <div
                role="group"
                aria-label="Department"
                className="-mx-0.5 flex flex-wrap gap-1.5 px-0.5"
              >
                {DEPARTMENTS.map((dept) => {
                  const isActive = department === dept.id
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setDepartment(dept.id)}
                      aria-pressed={isActive}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground border"
                      )}
                    >
                      {dept.label}
                    </button>
                  )
                })}
              </div>
            </section>

            <ContentSeparator />

            {/* Category */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-category"
            >
              <h3
                id="filter-5-category"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Category
              </h3>
              <ul className="flex flex-col gap-2.5">
                {CATEGORIES.map((option) => {
                  const id = `filter-5-category-${option.id}`
                  const checked = categories.includes(option.id)
                  return (
                    <li key={option.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          setCategories((c) => toggle(c, option.id))
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="text-foreground flex min-w-0 flex-1 justify-between gap-3 text-sm font-normal"
                      >
                        <span className="truncate">{option.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {option.count}
                        </span>
                      </Label>
                    </li>
                  )
                })}
              </ul>
            </section>

            <ContentSeparator />

            {/* Price */}
            <section
              className="flex flex-col gap-4 px-5"
              aria-labelledby="filter-5-price"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3
                  id="filter-5-price"
                  className="text-foreground text-sm font-semibold tracking-tight"
                >
                  Price
                </h3>
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  <span className="text-foreground font-semibold">
                    ${priceRange[0]}
                  </span>{" "}
                  −{" "}
                  <span className="text-foreground font-semibold">
                    ${priceRange[1]}
                  </span>
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange(value as [number, number])
                }
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={5}
                aria-label="Price range"
              />
            </section>

            <ContentSeparator />

            {/* Color */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-color"
            >
              <h3
                id="filter-5-color"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Color
              </h3>
              <ul className="flex flex-wrap gap-3" aria-label="Color swatches">
                {COLORS.map((color) => {
                  const isSelected = colors.includes(color.id)
                  const isLightSwatch =
                    color.id === "ivory" || color.id === "beige"
                  return (
                    <li key={color.id}>
                      <button
                        type="button"
                        onClick={() => setColors((c) => toggle(c, color.id))}
                        aria-pressed={isSelected}
                        aria-label={color.label}
                        title={color.label}
                        className={cn(
                          "border-border relative flex size-7 items-center justify-center rounded-full border transition-shadow outline-none",
                          "focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:ring-offset-2",
                          isSelected && "ring-foreground ring-2 ring-offset-2"
                        )}
                        style={{ backgroundColor: color.swatch }}
                      >
                        {isSelected ? (
                          <CheckIcon className={cn(
                                                                "size-3",
                                                                isLightSwatch
                                                                  ? "text-foreground"
                                                                  : "text-background"
                                                              )} aria-hidden="true" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <ContentSeparator />

            {/* Size */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-size"
            >
              <h3
                id="filter-5-size"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Size
              </h3>
              <div className="flex flex-wrap gap-1.5" aria-label="Sizes">
                {SIZES.map((size) => {
                  const isSelected = sizes.includes(size)
                  return (
                    <Button
                      key={size}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSizes((s) => toggle(s, size))}
                      aria-pressed={isSelected}
                      className="min-w-12 tabular-nums"
                    >
                      {size}
                    </Button>
                  )
                })}
              </div>
            </section>

            <ContentSeparator />

            {/* Material */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-material"
            >
              <h3
                id="filter-5-material"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Material
              </h3>
              <ul className="flex flex-col gap-2.5">
                {MATERIALS.map((option) => {
                  const id = `filter-5-material-${option.id}`
                  const checked = materials.includes(option.id)
                  return (
                    <li key={option.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          setMaterials((m) => toggle(m, option.id))
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="text-foreground flex min-w-0 flex-1 justify-between gap-3 text-sm font-normal"
                      >
                        <span className="truncate">{option.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {option.count}
                        </span>
                      </Label>
                    </li>
                  )
                })}
              </ul>
            </section>

            <ContentSeparator />

            {/* Brand */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-brand"
            >
              <h3
                id="filter-5-brand"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Brand
              </h3>
              <ul className="flex flex-col gap-2.5">
                {BRANDS.map((option) => {
                  const id = `filter-5-brand-${option.id}`
                  const checked = brands.includes(option.id)
                  return (
                    <li key={option.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          setBrands((b) => toggle(b, option.id))
                        }
                      />
                      <Label
                        htmlFor={id}
                        className="text-foreground flex min-w-0 flex-1 justify-between gap-3 text-sm font-normal"
                      >
                        <span className="truncate">{option.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {option.count}
                        </span>
                      </Label>
                    </li>
                  )
                })}
              </ul>
            </section>

            <ContentSeparator />

            {/* Rating */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-rating"
            >
              <h3
                id="filter-5-rating"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Rating
              </h3>
              <RadioGroup
                value={rating}
                onValueChange={(value) => setRating(value as RatingId)}
                className="flex flex-col gap-2"
              >
                {RATINGS.map((option) => {
                  const id = `filter-5-rating-${option.id}`
                  return (
                    <div key={option.id} className="flex items-center gap-2.5">
                      <RadioGroupItem id={id} value={option.id} />
                      <Label
                        htmlFor={id}
                        className="text-foreground flex min-w-0 flex-1 items-center gap-2 text-sm font-normal"
                      >
                        <Rating
                          rating={option.stars}
                          size="sm"
                          aria-hidden="true"
                          className="gap-0.5"
                        />
                        <span className="text-muted-foreground text-xs">
                          {option.label}
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </section>

            <ContentSeparator />

            {/* Quick toggles */}
            <section
              className="flex flex-col gap-3 px-5"
              aria-labelledby="filter-5-quick"
            >
              <h3
                id="filter-5-quick"
                className="text-foreground text-sm font-semibold tracking-tight"
              >
                Quick filters
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="filter-5-in-stock"
                    className="text-foreground text-sm font-normal"
                  >
                    In stock only
                  </Label>
                  <Switch
                    id="filter-5-in-stock"
                    checked={inStockOnly}
                    onCheckedChange={setInStockOnly}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="filter-5-on-sale"
                    className="text-foreground text-sm font-normal"
                  >
                    On sale
                  </Label>
                  <Switch
                    id="filter-5-on-sale"
                    checked={onSaleOnly}
                    onCheckedChange={setOnSaleOnly}
                    size="sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <EdgeSeparator />

        <SheetFooter className="flex flex-row items-center gap-2 px-5 py-4">
          <Button type="button" size="sm" className="flex-1">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={activeCount === 0}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}