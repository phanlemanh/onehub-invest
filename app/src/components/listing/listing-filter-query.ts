/**
 * Bộ lọc trang Duyệt listing — phần thuần (không "use client": test và trang server gọi được).
 *
 * Trạng thái DUY NHẤT là cây `FilterQuery` của @reui/filters: thanh chip (màn rộng) sửa nó trực tiếp,
 * ngăn lọc filter-sidebar-5 (màn hẹp) đọc cây thành `Facets`, người chỉnh rồi «Xem N listing» ghi
 * ngược bằng `queryFromFacets` (điều kiện ngăn không biểu diễn được giữ nguyên). Lọc chạy trên các listing đã tải (≤ LIMIT của trang) — không gọi lại server.
 */
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterConditions,
  flattenFilterRules,
  isFilterRuleComplete,
  type FilterCondition,
} from "@/components/reui/filters/filters-query"
import type { FilterNode, FilterQuery, FilterRule } from "@/components/reui/filters/filters-types"
import type { ListingCardRow } from "@/lib/queries"

/** Id trường lọc = khoá trên rule.path[0]. */
export const FIELD = {
  area: "area",
  roomType: "roomType",
  bedrooms: "bedrooms",
  price: "price",
} as const

export type ListingFilterRow = Pick<ListingCardRow, "areaName" | "roomType" | "bedrooms" | "priceListed">

/** Giá trị của listing cho từng trường; null = listing không có số/nhãn đó. */
function valueOf(row: ListingFilterRow, field: string): string | number | null {
  switch (field) {
    case FIELD.area:
      return row.areaName
    case FIELD.roomType:
      return row.roomType
    case FIELD.bedrooms:
      return row.bedrooms
    case FIELD.price:
      return row.priceListed
    default:
      return null
  }
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

/**
 * Một điều kiện có khớp listing không. Điều kiện chưa đủ giá trị (đang soạn dở) trả `undefined` —
 * bỏ qua, không lọc mất listing nào. Số so sánh với listing không có số → không khớp (trừ «trống»).
 */
export function matchCondition(row: ListingFilterRow, c: FilterCondition): boolean | undefined {
  const v = valueOf(row, c.field)
  const vals = c.values
  let hit: boolean
  switch (c.operator) {
    case "is":
    case "is_not": {
      if (vals.length === 0) return undefined
      hit = v === vals[0]
      if (c.operator === "is_not") hit = !hit
      break
    }
    case "is_any_of":
    case "is_none_of": {
      if (vals.length === 0) return undefined
      hit = vals.includes(v)
      if (c.operator === "is_none_of") hit = !hit
      break
    }
    case "empty":
      hit = v === null
      break
    case "not_empty":
      hit = v !== null
      break
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const x = vals[0]
      if (!isNum(x)) return undefined
      if (!isNum(v)) {
        hit = false
        break
      }
      hit =
        c.operator === "eq" ? v === x
        : c.operator === "neq" ? v !== x
        : c.operator === "gt" ? v > x
        : c.operator === "gte" ? v >= x
        : c.operator === "lt" ? v < x
        : v <= x
      break
    }
    case "between":
    case "not_between": {
      const lo = isNum(vals[0]) ? vals[0] : null
      const hi = isNum(vals[1]) ? vals[1] : null
      if (lo === null && hi === null) return undefined
      if (!isNum(v)) {
        hit = false
        break
      }
      hit = (lo === null || v >= lo) && (hi === null || v <= hi)
      if (c.operator === "not_between") hit = !hit
      break
    }
    default:
      return undefined
  }
  return c.negated ? !hit : hit
}

/**
 * Hàm lọc từ cây. Thanh chip chỉ dựng cây phẳng; `combinator` của gốc quyết «và»/«hoặc» (mặc định «và»).
 * Không có điều kiện đủ giá trị nào → giữ mọi listing.
 */
export function compileListingFilter(query: FilterQuery): (row: ListingFilterRow) => boolean {
  const conditions = flattenFilterConditions(query)
  if (conditions.length === 0) return () => true
  const any = query.combinator === "or"
  return (row) => {
    let decided = 0
    for (const c of conditions) {
      const hit = matchCondition(row, c)
      if (hit === undefined) continue
      decided += 1
      if (any && hit) return true
      if (!any && !hit) return false
    }
    return any ? decided === 0 : true
  }
}

/** Số điều kiện đang thật sự lọc (đủ giá trị) — số trên nút «Bộ lọc». */
export function activeFilterCount(query: FilterQuery): number {
  const probe: ListingFilterRow = { areaName: null, roomType: null, bedrooms: null, priceListed: null }
  return flattenFilterConditions(query).filter((c) => matchCondition(probe, c) !== undefined).length
}

/* -------------------------------------------------------------------------- */
/*                       Ngăn lọc màn hẹp (filter-sidebar-5)                   */
/* -------------------------------------------------------------------------- */

/** Mốc «Phòng ngủ tối thiểu» của ngăn lọc (≥ n); «Bất kỳ» = null. */
export const BEDROOM_STEPS = [1, 2, 3, 4] as const

export type Facets = {
  areas: string[]
  roomTypes: string[]
  /** Tối thiểu số phòng ngủ (≥), null = bất kỳ. */
  minBedrooms: number | null
  /** Khoảng giá/đêm đã chọn; null ở một đầu = không chặn đầu đó. */
  price: [number | null, number | null]
}

export const EMPTY_FACETS: Facets = { areas: [], roomTypes: [], minBedrooms: null, price: [null, null] }

/**
 * Đọc cây thành facet. Chỉ hiểu dạng ngăn lọc tự ghi (phường/loại phòng `is_any_of`/`is`, phòng ngủ `gte`,
 * giá `between`); điều kiện khác dựng ở thanh chip (vd «không phải», «bằng») về `rest` NGUYÊN VẸN — ngăn hiện
 * dòng báo và `queryFromFacets` nối lại chúng khi áp, không xoá im lặng điều kiện người đã nhập. Điều kiện soạn
 * dở bị bỏ (không lọc gì). Gốc «hoặc» (thanh basic không dựng được) → mọi điều kiện về `rest`.
 */
export function facetsFromQuery(query: FilterQuery): { facets: Facets; rest: FilterRule[] } {
  const facets: Facets = { ...EMPTY_FACETS, price: [null, null] }
  const rules = flattenFilterRules(query).filter(isFilterRuleComplete)
  if (query.combinator === "or" && rules.length > 1) return { facets, rest: rules }
  const rest: FilterRule[] = []
  for (const rule of rules) {
    const [c] = flattenFilterConditions(createFilterQuery([rule], "and"))
    if (!c || c.negated) {
      if (c) rest.push(rule)
      continue
    }
    if ((c.field === FIELD.area || c.field === FIELD.roomType) && (c.operator === "is_any_of" || c.operator === "is")) {
      const list = c.values.filter((v): v is string => typeof v === "string")
      if (c.field === FIELD.area) facets.areas = [...new Set([...facets.areas, ...list])]
      else facets.roomTypes = [...new Set([...facets.roomTypes, ...list])]
    } else if (c.field === FIELD.bedrooms && c.operator === "gte" && isNum(c.values[0]) && facets.minBedrooms === null) {
      facets.minBedrooms = c.values[0]
    } else if (c.field === FIELD.price && c.operator === "between" && facets.price[0] === null && facets.price[1] === null) {
      facets.price = [isNum(c.values[0]) ? c.values[0] : null, isNum(c.values[1]) ? c.values[1] : null]
    } else {
      rest.push(rule)
    }
  }
  return { facets, rest }
}

/** Ghi facet thành cây phẳng «và» (thứ tự trường cố định để chip không nhảy chỗ; id cố định theo trường — không sinh ngẫu nhiên, khỏi lệch hydrate). */
export function queryFromFacets(f: Facets, rest: FilterRule[] = []): FilterQuery {
  const rules: FilterNode[] = []
  if (f.areas.length > 0)
    rules.push(createFilterRule({ id: "facet-area", path: [FIELD.area], operator: "is_any_of", value: f.areas }))
  if (f.roomTypes.length > 0)
    rules.push(createFilterRule({ id: "facet-roomType", path: [FIELD.roomType], operator: "is_any_of", value: f.roomTypes }))
  if (f.minBedrooms !== null)
    rules.push(createFilterRule({ id: "facet-bedrooms", path: [FIELD.bedrooms], operator: "gte", value: f.minBedrooms }))
  if (f.price[0] !== null || f.price[1] !== null)
    rules.push(createFilterRule({ id: "facet-price", path: [FIELD.price], operator: "between", value: [f.price[0] ?? undefined, f.price[1] ?? undefined] }))
  // Điều kiện ngăn không biểu diễn được đi tiếp nguyên vẹn (cùng id — chip của thanh không nhảy).
  rules.push(...rest)
  return createFilterQuery(rules, "and")
}

/**
 * Số listing cho từng giá trị của một facet khi giữ nguyên các facet khác — đếm sống, khác bản gốc
 * filter-sidebar-5 (số cố định). Bỏ chính facet đó ra khi đếm để người thấy chọn thêm sẽ được bao nhiêu.
 */
export function facetCounts(
  rows: ListingFilterRow[],
  f: Facets,
  field: typeof FIELD.area | typeof FIELD.roomType,
  rest: FilterRule[] = []
): Map<string, number> {
  const others = compileListingFilter(queryFromFacets(field === FIELD.area ? { ...f, areas: [] } : { ...f, roomTypes: [] }, rest))
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!others(row)) continue
    const key = field === FIELD.area ? row.areaName : row.roomType
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
