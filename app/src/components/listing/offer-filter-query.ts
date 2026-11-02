/**
 * Bộ lọc tin rao — phần thuần: cây `FilterQuery` của @reui/filters ↔ query string. Lọc chạy ở máy chủ (hàng chục nghìn
 * tin), nên URL là trạng thái đã áp; giá trên chip tính bằng tỷ đồng với tin bán, triệu đồng với tin thuê, trên URL bằng đồng.
 */
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query"
import type { FilterNode, FilterQuery } from "@/components/reui/filters/filters-types"
import type { OfferFilters } from "@/lib/offers-filters"
import { KIND } from "@/lib/vocab.generated"

export const OFFER_FIELD = {
  ward: "ward",
  type: "type",
  price: "price",
  area: "area",
  bedrooms: "bedrooms",
} as const

/** Đơn vị giá nhập theo loại tin: gần 99% tin bán từ một tỷ trở lên (đo 02/11), thuê thì tính theo triệu. */
export function priceUnit(kind: OfferFilters["kind"]) {
  return kind === KIND.sale ? { scale: 1_000_000_000, label: "tỷ" } : { scale: 1_000_000, label: "triệu" }
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

function rangeRule(id: string, min: number | null, max: number | null): FilterNode | null {
  if (min !== null && max !== null) return createFilterRule({ id: `offer-${id}`, path: [id], operator: "between", value: [min, max] })
  if (min !== null) return createFilterRule({ id: `offer-${id}`, path: [id], operator: "gte", value: min })
  if (max !== null) return createFilterRule({ id: `offer-${id}`, path: [id], operator: "lte", value: max })
  return null
}

/** Cây chip từ bộ lọc đang áp trên URL; id cố định theo trường để không lệch hydrate. */
export function queryFromOfferFilters(f: OfferFilters): FilterQuery {
  const { scale } = priceUnit(f.kind)
  const toUnit = (v: number | null) => (v === null ? null : v / scale)
  const rules = [
    f.wards.length ? createFilterRule({ id: "offer-ward", path: [OFFER_FIELD.ward], operator: "is_any_of", value: f.wards }) : null,
    f.types.length ? createFilterRule({ id: "offer-type", path: [OFFER_FIELD.type], operator: "is_any_of", value: f.types }) : null,
    rangeRule(OFFER_FIELD.price, toUnit(f.priceMin), toUnit(f.priceMax)),
    rangeRule(OFFER_FIELD.area, f.areaMin, f.areaMax),
    f.bedroomsMin !== null ? createFilterRule({ id: "offer-bedrooms", path: [OFFER_FIELD.bedrooms], operator: "gte", value: f.bedroomsMin }) : null,
  ].filter((r): r is FilterNode => r !== null)
  return createFilterQuery(rules, "and")
}

/**
 * Tham số URL từ cây chip. Điều kiện đang soạn dở bị `flattenFilterConditions` bỏ qua nên không đổi URL; tham số không
 * thuộc chip (loại tin, sắp xếp, chỉ tin có số) do bên gọi giữ.
 */
export function paramsFromOfferQuery(query: FilterQuery, kind: OfferFilters["kind"]): Record<string, string> {
  const out: Record<string, string> = {}
  const ranged = (c: { operator: string; values: unknown[] }, lo: string, hi: string, scale: number) => {
    const a = c.values[0]
    const b = c.values[1]
    if (c.operator === "gte" && isNum(a)) out[lo] = String(Math.round(a * scale))
    else if (c.operator === "lte" && isNum(a)) out[hi] = String(Math.round(a * scale))
    else if (c.operator === "between") {
      if (isNum(a)) out[lo] = String(Math.round(a * scale))
      if (isNum(b)) out[hi] = String(Math.round(b * scale))
    }
  }
  for (const c of flattenFilterConditions(query)) {
    if (c.field === OFFER_FIELD.ward && c.values.length) out.ward = c.values.join(",")
    else if (c.field === OFFER_FIELD.type && c.values.length) out.type = c.values.join(",")
    else if (c.field === OFFER_FIELD.price) ranged(c, "price_min", "price_max", priceUnit(kind).scale)
    else if (c.field === OFFER_FIELD.area) ranged(c, "area_min", "area_max", 1)
    else if (c.field === OFFER_FIELD.bedrooms && isNum(c.values[0])) out.bedrooms = String(c.values[0])
  }
  return out
}
