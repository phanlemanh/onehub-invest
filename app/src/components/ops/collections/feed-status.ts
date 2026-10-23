import type { BadgeProps } from "@/components/reui/badge"
import type { SourceFeedHealth } from "@/lib/ops-queries"

export type FeedState = "ok" | "late" | "stopped"

/** Sức khoẻ một nguồn: ngừng (registry khác active) · trễ SLO · ổn — như trang cũ. */
export function feedState(f: SourceFeedHealth): FeedState {
  if (f.status !== "active") return "stopped"
  if (f.sloHours && f.freshnessHrs !== null && f.freshnessHrs > f.sloHours) return "late"
  return "ok"
}

export const FEED_STATE: Record<FeedState, { label: string; variant: BadgeProps["variant"]; tone: string }> = {
  ok: { label: "Ổn", variant: "success-light", tone: "bg-success" },
  late: { label: "Trễ SLO", variant: "warning-light", tone: "bg-warning" },
  stopped: { label: "Ngừng", variant: "outline", tone: "bg-muted-foreground/40" },
}
