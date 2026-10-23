import { fmtCompact, fmtMoneyCompact, fmtPct } from "@/lib/format"
import { formatLongMonth } from "@/components/charts/format"

import { type Period } from "./data"

/** Tiền theo đơn vị của thị trường: "1,2 tỷ ₫", "9,7 tr ₫". */
export const moneyFormatter = (currency: string) => (value: number) =>
  fmtMoneyCompact(value, currency)

/** Nhãn trục: "40 tr", "0" — đơn vị ghi ở chân khung. */
export const formatAxis = (value: number) => (value === 0 ? "0" : fmtCompact(value))

/** Biên: "28,9%" — một chữ số thập phân. */
export const formatPercent = (ratio: number) => fmtPct(ratio)

/** Tiêu đề tooltip: "Tháng 11/2026" hoặc "T11–T1 (từ 11/2026)". */
export const periodTitle = (period: Period) => {
  if (period.months === 1) return formatLongMonth(period.time)
  const d = new Date(period.time)
  return `${period.key} (từ ${d.getUTCMonth() + 1}/${d.getUTCFullYear()})`
}
