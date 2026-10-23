import type { BadgeProps } from "@/components/reui/badge"
import { summarizeSources, type SloSummary } from "@/lib/freshness"
import type { SourceFeedHealth } from "@/lib/ops-queries"

export type FeedState = "ok" | "late" | "nodata" | "noslo" | "stopped"

/** Sức khoẻ một nguồn theo độ tươi chung (lib/freshness, AU6): ngừng (registry khác active) · trễ SLO ở ít nhất
 * một thành phố · chưa có dữ liệu ở bảng nạp · chưa khai SLO · đạt. Không có dữ liệu KHÔNG còn là «Ổn». */
export function feedState(f: SourceFeedHealth): FeedState {
  if (f.status !== "active") return "stopped"
  if (f.freshness === "stale") return "late"
  if (f.freshness === "none") return "nodata"
  if (f.freshness === "fresh") return "ok"
  return "noslo"
}

export const FEED_STATE: Record<FeedState, { label: string; variant: BadgeProps["variant"]; tone: string }> = {
  ok: { label: "Đạt", variant: "success-light", tone: "bg-success" },
  late: { label: "Trễ SLO", variant: "warning-light", tone: "bg-warning" },
  nodata: { label: "Chưa có dữ liệu", variant: "destructive-light", tone: "bg-destructive" },
  noslo: { label: "Chưa khai SLO", variant: "outline", tone: "bg-muted-foreground/70" },
  stopped: { label: "Ngừng", variant: "outline", tone: "bg-muted-foreground/40" },
}

/** «x/y nguồn đạt SLO» của /ops/collections — cùng luật với coverageSummary của /ops (summarizeSources). */
export const feedSloSummary = (feeds: SourceFeedHealth[]): SloSummary =>
  summarizeSources(feeds.flatMap((f) => (f.status === "active" && f.freshness ? [{ status: f.freshness }] : [])))
