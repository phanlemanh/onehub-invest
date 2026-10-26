import { DatabaseIcon, GaugeIcon, HouseIcon, MapIcon, TagIcon } from "lucide-react"

import { FILTER_OPERATORS_VI } from "@/components/listing/listings-filter-bar"
import { flattenFilterConditions } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import type { FlowRecord } from "@/lib/data-flow-queries"
import { fmtInt } from "@/lib/format"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"
import { LABELS_VI } from "@/lib/vocab.generated"

/**
 * Bộ lọc bảng «Tin mới nhất» (@reui/filters, cùng khuôn thanh chip của Duyệt listing): năm trường chọn, mỗi lựa
 * chọn lấy từ chính các tin đã tải kèm số tin. Lọc phía trình duyệt trên ≤ 150 tin mới nhất mỗi nguồn.
 */

export type DataLevel = "B1" | "B2"
/** Bậc của tin theo thang FRAMING §3.4: đã đọc thành tin = B1, đã gắn căn = B2 (B3+ chưa có số đo). */
export const levelOf = (r: FlowRecord): DataLevel => (r.linked ? "B2" : "B1")

const FIELDS = {
  source: (r: FlowRecord) => r.source,
  kind: (r: FlowRecord) => r.kind,
  type: (r: FlowRecord) => r.propertyType,
  market: (r: FlowRecord) => r.market ?? "Chưa gắn thị trường",
  level: (r: FlowRecord) => levelOf(r),
} as const
type FieldId = keyof typeof FIELDS

const ICON = "size-4"
const many = (value: string) => ({ value, label: FILTER_OPERATORS_VI[value] ?? value, arity: "many" as const })

export function recordFilterFields(records: FlowRecord[], roles: SourceRoles): FilterField[] {
  const counted = (id: FieldId, label: (v: string) => string) => {
    const m = new Map<string, number>()
    for (const r of records) m.set(FIELDS[id](r), (m.get(FIELDS[id](r)) ?? 0) + 1)
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, n]) => ({ value, label: label(value), description: `${fmtInt(n)} tin` }))
  }
  const base = { type: "select" as const, operators: [many("is_any_of"), many("is_none_of")], defaultOperator: "is_any_of" }
  return [
    { ...base, id: "source", label: "Nguồn", icon: <DatabaseIcon className={ICON} aria-hidden="true" />, options: counted("source", (v) => sourceLabel(v, roles)) },
    { ...base, id: "kind", label: "Loại tin", icon: <TagIcon className={ICON} aria-hidden="true" />, options: counted("kind", (v) => LABELS_VI.kind[v as keyof typeof LABELS_VI.kind] ?? v) },
    {
      ...base,
      id: "type",
      label: "Loại hình",
      icon: <HouseIcon className={ICON} aria-hidden="true" />,
      options: counted("type", (v) => LABELS_VI.property_type[v as keyof typeof LABELS_VI.property_type] ?? v),
    },
    { ...base, id: "market", label: "Thị trường", icon: <MapIcon className={ICON} aria-hidden="true" />, searchable: true, options: counted("market", (v) => v.replace(/^(Thành phố|Tỉnh) /, "")) },
    {
      ...base,
      id: "level",
      label: "Bậc",
      icon: <GaugeIcon className={ICON} aria-hidden="true" />,
      options: counted("level", (v) => `${v} · ${LABELS_VI.data_level[v as DataLevel]}`),
    },
  ]
}

/** Hàm lọc từ cây chip phẳng; điều kiện chưa có giá trị bị bỏ qua. */
export function compileRecordFilter(query: FilterQuery): (r: FlowRecord) => boolean {
  const conditions = flattenFilterConditions(query).filter((c) => c.field in FIELDS && c.values.length > 0)
  if (conditions.length === 0) return () => true
  const any = query.combinator === "or"
  return (r) => {
    const hits = conditions.map((c) => {
      const hit = c.values.includes(FIELDS[c.field as FieldId](r))
      const inv = c.operator === "is_none_of" ? !hit : hit
      return c.negated ? !inv : inv
    })
    return any ? hits.some(Boolean) : hits.every(Boolean)
  }
}
