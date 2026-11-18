import type { Milestone } from "@/lib/data-flow-queries"
import { fmtInt, vnDayKey, vnDayStart } from "@/lib/format"

/** Bốn số mốc S03 (SM1), nhãn theo `CONTEXT.md` mục «Số mốc S03». */
export type MilestoneKey = "project_linked" | "building_linked" | "project_ranked" | "building_ranked"

export const MILESTONES: readonly { key: MilestoneKey; label: string }[] = [
  { key: "project_linked", label: "Có dự án" },
  { key: "building_linked", label: "Khớp toà" },
  { key: "project_ranked", label: "Có hạng cấp dự án" },
  { key: "building_ranked", label: "Có hạng cấp toà" },
]

export type MilestonePoint = { day: string; value: number | null }

export type MilestoneTile = {
  key: MilestoneKey
  label: string
  value: number
  /** Phần trên tin đang rao; null khi mẫu số bằng 0. */
  share: number | null
  /** Số ngày mới nhất trừ số của đúng ngày liền trước; null khi thiếu ngày đó. */
  delta: number | null
  stalled: boolean
  /** Đủ `windowDays` ngày liên tiếp, ngày máy không chạy là null để đường đứt đoạn. */
  series: MilestonePoint[]
}

/** "2026-11-18" lùi `n` ngày lịch. */
const dayBefore = (day: string, n: number) => vnDayKey(vnDayStart(day).getTime() - n * 86400000)

/**
 * Ô số mốc từ chuỗi ngày. «Hôm nay» là ngày mới nhất có số. Đứng yên = ba ngày ĐÃ CHỐT liền nhau trước ngày đó có cùng một số, tức hai
 * ngày liền không đổi; ngày mới nhất chưa chốt nên không tính, vì sáng sớm trước lượt đêm số nào cũng bằng hôm trước.
 */
export function milestoneTiles(rows: Milestone[], windowDays: number): MilestoneTile[] {
  if (rows.length === 0) return []
  const byDay = new Map(rows.map((r) => [r.ngay, r]))
  const latest = [...byDay.keys()].sort().at(-1) as string
  const today = byDay.get(latest) as Milestone
  const at = (n: number) => byDay.get(dayBefore(latest, n))
  return MILESTONES.map(({ key, label }) => {
    const [d1, d2, d3] = [at(1), at(2), at(3)]
    return {
      key,
      label,
      value: today[key],
      share: today.offers_total > 0 ? today[key] / today.offers_total : null,
      delta: d1 ? today[key] - d1[key] : null,
      stalled: Boolean(d1 && d2 && d3 && d1[key] === d2[key] && d2[key] === d3[key]),
      series: Array.from({ length: windowDays }, (_, i) => {
        const day = dayBefore(latest, windowDays - 1 - i)
        return { day, value: byDay.get(day)?.[key] ?? null }
      }),
    }
  })
}

/** Dòng phụ dưới số của ô. */
export function deltaLabel(delta: number | null): string {
  if (delta === null) return "Chưa có số hôm trước"
  if (delta === 0) return "Không đổi so với hôm trước"
  return `${delta > 0 ? "+" : "−"}${fmtInt(Math.abs(delta))} so với hôm trước`
}

/** Khoảng số của đường trong cửa sổ đang xem: mỗi ô tự co trục nên độ dốc không so được giữa các ô. */
export function rangeLabel(series: MilestonePoint[]): string {
  const values = series.flatMap((p) => (p.value === null ? [] : [p.value]))
  const [low, high] = [Math.min(...values), Math.max(...values)]
  return low === high ? `Cả khoảng: ${fmtInt(low)}` : `Thấp nhất ${fmtInt(low)} · cao nhất ${fmtInt(high)}`
}
