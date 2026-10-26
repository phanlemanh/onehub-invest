"use client"

import { useMemo } from "react"
import { BedDoubleIcon, BanknoteIcon, HouseIcon, MapPinIcon } from "lucide-react"

import { Filters } from "@/components/reui/filters/filters"
import type { FilterOperatorLabels } from "@/components/reui/filters/filters-operators"
import type {
  FilterField,
  FilterLabels,
  FilterQuery,
  FilterValueDisplayContext,
} from "@/components/reui/filters/filters-types"
import { fmtInt, fmtMoneyCompact } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"
import { FIELD } from "./listing-filter-query"
import { roomTypeVi } from "./listing-labels"

/** Chữ khung của @reui/filters bằng tiếng Việt — chỉ các nhãn thanh chip (`variant="basic"`) hiện ra. */
export const FILTER_LABELS_VI: Partial<FilterLabels> = {
  addFilter: "Thêm bộ lọc",
  clearAll: "Xoá hết",
  searchFields: "Tìm trường lọc…",
  searchOperators: "Tìm điều kiện…",
  searchOptions: "Tìm…",
  back: "Quay lại",
  clear: "Xoá",
  apply: "Áp dụng",
  discard: "Bỏ thay đổi",
  empty: "Không có kết quả",
  loading: "Đang tải…",
  error: "Không tải được",
  retry: "Thử lại",
  remove: "Bỏ bộ lọc",
  duplicate: "Nhân đôi",
  negate: "Đảo điều kiện",
  chipMenu: (fieldLabel) => `Tuỳ chọn bộ lọc ${fieldLabel}`,
  filtersLabel: "Bộ lọc",
  valuePlaceholder: "nhập giá trị…",
  selectPlaceholder: "Chọn…",
  noValue: "chưa có giá trị",
  selectCondition: "Chọn điều kiện",
  incomplete: "bộ lọc chưa xong",
  itemCount: (count) => `${fmtInt(count)} mục`,
  fieldsLabel: "Trường lọc",
  resultsAnnouncement: (count) => `${fmtInt(count)} kết quả`,
  actionsLabel: "Thao tác",
  countAnnouncement: (count) => `Đang áp ${fmtInt(count)} bộ lọc`,
  valueCount: (count) => `${fmtInt(count)} đã chọn`,
  valueDetail: (summary, values) => `${summary}: ${values.join(", ")}`,
  valueRange: (from, to) => `${from} – ${to}`,
  rangeFrom: (fieldLabel) => `${fieldLabel} từ`,
  rangeTo: (fieldLabel) => `${fieldLabel} đến`,
  rangeSeparator: "–",
  negated: (operatorLabel) => `không ${operatorLabel}`,
  issueOperator: "Chọn điều kiện",
  issueValue: "Nhập giá trị",
  issueRange: "Nhập đủ hai đầu khoảng",
  issueRangeOrder: "Đầu cuối nhỏ hơn đầu đầu",
}

/** Điều kiện ngắn — cột điều kiện của menu hẹp, chip đọc liền một câu. */
export const FILTER_OPERATORS_VI: FilterOperatorLabels = {
  is_any_of: "là",
  is_none_of: "không phải",
  gte: "từ",
  lte: "tới",
  eq: "bằng",
  between: "trong khoảng",
}

const ICON = "size-4"

/** Giá trị chip «Giá/đêm»: số tiền rút gọn thay cho chuỗi số thô. */
const priceText =
  (currency: string) =>
  ({ values }: FilterValueDisplayContext) => {
    const money = (v: unknown) => (typeof v === "number" ? fmtMoneyCompact(v, currency) : "…")
    return values.length > 1 ? `${money(values[0])} – ${money(values[1])}` : money(values[0])
  }

/**
 * Trường lọc từ chính các listing đã tải: phường và loại phòng chỉ liệt giá trị có thật, kèm số listing.
 * Điều kiện mỗi trường thu hẹp có chủ đích (không «chứa», «trống»…) — thanh chip đọc như một câu.
 */
export function listingFilterFields(listings: ListingCardRow[], currency: string): FilterField[] {
  const count = (key: (l: ListingCardRow) => string | null) => {
    const m = new Map<string, number>()
    for (const l of listings) {
      const k = key(l)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  const areas = count((l) => l.areaName)
  const rooms = count((l) => l.roomType)
  const ops = (...values: string[]) =>
    values.map((value) => ({
      value,
      label: FILTER_OPERATORS_VI[value] ?? value,
      arity: value === "is_any_of" || value === "is_none_of" ? ("many" as const) : value === "between" ? ("range" as const) : ("one" as const),
    }))

  return [
    {
      id: FIELD.area,
      label: "Phường",
      icon: <MapPinIcon className={ICON} aria-hidden="true" />,
      type: "select",
      searchable: true,
      operators: ops("is_any_of", "is_none_of"),
      defaultOperator: "is_any_of",
      options: [...areas.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], "vi"))
        .map(([value, n]) => ({ value, label: value, description: `${fmtInt(n)} listing` })),
    },
    {
      id: FIELD.roomType,
      label: "Loại phòng",
      icon: <HouseIcon className={ICON} aria-hidden="true" />,
      type: "select",
      searchable: false,
      operators: ops("is_any_of", "is_none_of"),
      defaultOperator: "is_any_of",
      options: [...rooms.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([value, n]) => ({ value, label: roomTypeVi(value) ?? value, description: `${fmtInt(n)} listing` })),
    },
    {
      id: FIELD.bedrooms,
      label: "Phòng ngủ",
      icon: <BedDoubleIcon className={ICON} aria-hidden="true" />,
      type: "number",
      operators: ops("gte", "eq", "lte"),
      defaultOperator: "gte",
      placeholder: "số phòng ngủ",
    },
    {
      id: FIELD.price,
      label: "Giá/đêm",
      icon: <BanknoteIcon className={ICON} aria-hidden="true" />,
      type: "number",
      operators: ops("between", "gte", "lte"),
      defaultOperator: "between",
      placeholder: "₫",
      valueText: priceText(currency),
      renderValue: priceText(currency),
    },
  ]
}

/**
 * Thanh chip lọc (màn rộng) — @reui/filters `variant="basic"`. Một nguồn trạng thái với ngăn lọc màn hẹp:
 * cây `FilterQuery` do cha giữ.
 */
export function ListingsFilterBar({
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
  const fields = useMemo(() => listingFilterFields(listings, currency), [listings, currency])
  return (
    <Filters
      fields={fields}
      query={query}
      onQueryChange={onQueryChange}
      labels={FILTER_LABELS_VI}
      operatorLabels={FILTER_OPERATORS_VI}
      showClear
    />
  )
}
