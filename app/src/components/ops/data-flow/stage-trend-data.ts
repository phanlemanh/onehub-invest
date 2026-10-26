import type { FlowDay, FlowWindow } from "@/lib/data-flow-queries"
import { vnDayKey } from "@/lib/format"

/** Bốn chặng của «Chặng theo ngày» — các chặng lồng nhau, mỗi chặng đếm riêng. */
export type StageKey = "received" | "readable" | "offers" | "linked"
export const STAGE_KEYS: readonly StageKey[] = ["received", "readable", "offers", "linked"]

/** Một điểm của trục: khoá ngày giờ VN ("2026-10-24") và số bốn chặng của mọi nguồn trong ngày. */
export type DayPoint = { key: string } & Record<StageKey, number>

/** Số ngày của biểu đồ theo cửa sổ trang. Chuỗi ngày của getDataFlow chỉ quét 30 ngày, nên «Tất cả» vẽ 30. */
export function chartDaysOf(window: FlowWindow): number {
  return window === "7d" ? 7 : 30
}

/**
 * Trục ngày của «Chặng theo ngày» (Ngoài-8 của DF0): đúng `windowDays` ngày giờ VN liên tiếp kết thúc ở ngày VN của
 * `nowMs` (mốc request). Ngày không có số là điểm 0 ở cả bốn chặng; số của ngày ngoài cửa sổ bị bỏ — không để ngày
 * cũ hơn lấp chỗ, vì đó chính là cách biểu đồ che việc nguồn đã im.
 */
export function dailySeries(days: FlowDay[], nowMs: number, windowDays: number): DayPoint[] {
  // Lùi từng ngày lịch từ ngày cuối; tính trên 12:00 UTC của ngày đó nên phép trừ không trượt sang ngày khác.
  const endNoon = Date.parse(`${vnDayKey(nowMs)}T12:00:00Z`)
  const points = new Map<string, DayPoint>()
  for (let i = windowDays - 1; i >= 0; i--) {
    const key = new Date(endNoon - i * 86400000).toISOString().slice(0, 10)
    points.set(key, { key, received: 0, readable: 0, offers: 0, linked: 0 })
  }
  for (const d of days) {
    const p = points.get(d.day)
    if (!p) continue
    for (const s of STAGE_KEYS) p[s] += d[s]
  }
  return [...points.values()]
}
