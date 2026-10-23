import type { BadgeProps } from "@/components/reui/badge"
import type { CoverageRow } from "@/lib/ops-queries"

export type Freshness = CoverageRow["status"]

/** Trạng thái độ tươi theo khuôn SLO_STATUS của solution-dev-ops-5: nhãn, Badge, chấm. */
export const FRESHNESS: Record<Freshness, { label: string; variant: BadgeProps["variant"]; tick: string }> = {
  fresh: { label: "Đạt", variant: "success-light", tick: "bg-success" },
  stale: { label: "Quá hạn", variant: "destructive-light", tick: "bg-destructive" },
  none: { label: "Chưa có", variant: "outline", tick: "bg-muted-foreground/50" },
}

export const FRESHNESS_ORDER: Freshness[] = ["stale", "none", "fresh"]

/** Tuổi chia SLO (theo giờ): >1 là quá hạn; null khi chưa có dữ liệu. */
export const ageRatio = (r: CoverageRow) => (r.ageHours === null ? null : r.ageHours / r.sloHours)

/** Ô nguồn × thị trường; mã chưa có dữ liệu không có thị trường. */
export const where = (r: CoverageRow) => (r.city ? `${r.code} · ${r.city}` : r.code)
