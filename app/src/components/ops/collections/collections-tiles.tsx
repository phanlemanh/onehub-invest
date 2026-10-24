"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (stat-cards.tsx): hàng 4 thẻ số — sức khoẻ
// nguồn, bản ghi 24h, cổng Zalo hôm nay, lớp lockdown. Thanh phân đoạn thay cho
// biểu đồ xu hướng khi chưa có chuỗi theo ngày; bản ghi 7 ngày ở vùng Luồng bên dưới.
import { MessageSquareIcon, PlugIcon, ShieldCheckIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import type { GateFunnel } from "@/lib/collections-queries"
import { fmtInt } from "@/lib/format"
import type { LockdownLayer, SourceFeedHealth } from "@/lib/ops-queries"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

import { sloSummaryKey } from "@/lib/freshness"

import { FEED_STATE, feedSloSummary, feedState } from "./feed-status"
import { SegmentBar, StatCard } from "./section"

export function CollectionsTiles({
  feeds,
  funnel,
  layers,
  agentTurnsToday,
  roles = {},
}: {
  feeds: SourceFeedHealth[]
  funnel: GateFunnel
  layers: LockdownLayer[]
  /** null = chưa kiểm được log agent-turn hôm nay (ON2). */
  agentTurnsToday: number | null
  /** Vai trò nguồn cho nhãn «S0x · vai trò» (ON7). */
  roles?: SourceRoles
}) {
  const s03 = sourceLabel("S03", roles)
  const states = feeds.map(feedState)
  const count = (s: ReturnType<typeof feedState>) => states.filter((x) => x === s).length
  // Cùng con số với ô «Đạt SLO» của /ops (AU6): nguồn đạt khi mọi thị trường đạt; y = nguồn active có SLO.
  const slo = feedSloSummary(feeds)
  const items24h = feeds.reduce((sum, f) => sum + (f.items24h || 0), 0)
  const busiest = [...feeds].sort((a, b) => (b.items24h || 0) - (a.items24h || 0))[0]
  const layersOk = layers.filter((l) => l.ok === true).length
  const layersBad = layers.filter((l) => l.ok === false).length

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:gap-3">
      <StatCard
        icon={<PlugIcon aria-hidden="true" />}
        title="Sức khoẻ nguồn"
        period="Bây giờ"
        value={fmtInt(slo.ok)}
        total={fmtInt(slo.total)}
        basis="Đạt khi mọi thị trường đạt"
        sloSummary={sloSummaryKey(slo)}
        action={{ label: "Xem từng nguồn", href: "#nguon" }}
      >
        <SegmentBar
          label="Nguồn theo sức khoẻ"
          segments={(["ok", "late", "nodata", "noslo", "stopped"] as const).map((s) => ({ key: s, label: FEED_STATE[s].label, count: count(s), tone: FEED_STATE[s].tone }))}
        />
      </StatCard>

      <StatCard
        icon={<TrendingUpIcon aria-hidden="true" />}
        title="Bản ghi 24h"
        period="24 giờ"
        value={fmtInt(items24h)}
        basis={busiest && busiest.items24h ? `Nhiều nhất: ${busiest.code} (${fmtInt(busiest.items24h)})` : "Chưa có bản ghi trong 24 giờ"}
        action={{ label: "Xem luồng 7 ngày", href: "#luong" }}
      />

      <StatCard
        icon={<MessageSquareIcon aria-hidden="true" />}
        title={`Cổng ${s03} hôm nay`}
        period="Hôm nay"
        value={fmtInt(funnel.today.passed)}
        total={fmtInt(funnel.today.messages)}
        basis={`${fmtInt(funnel.today.skipped)} tin bị cổng chặn`}
        action={{ label: `Xem nhóm ${s03}`, href: "#nhom-s03" }}
      >
        <SegmentBar
          label={`Tin ${s03} hôm nay`}
          segments={[
            { key: "passed", label: "Qua cổng", count: funnel.today.passed, tone: "bg-success" },
            { key: "skipped", label: "Bị chặn", count: funnel.today.skipped, tone: "bg-muted-foreground/40" },
          ]}
        />
      </StatCard>

      <StatCard
        icon={<ShieldCheckIcon aria-hidden="true" />}
        title="Lockdown"
        period="Bây giờ"
        value={fmtInt(layersOk)}
        total={fmtInt(layers.length)}
        badge={agentTurnsToday !== null && agentTurnsToday > 0 ? <Badge variant="destructive-light">{fmtInt(agentTurnsToday)} agent-turn</Badge> : undefined}
        basis={
          agentTurnsToday === null
            ? "Chưa kiểm được agent-turn hôm nay"
            : agentTurnsToday > 0
              ? "Có agent-turn hôm nay — kiểm ngay"
              : "Không có agent-turn hôm nay"
        }
        action={{ label: "Xem các lớp", href: "#lockdown" }}
      >
        <SegmentBar
          label="Lớp lockdown"
          segments={[
            { key: "ok", label: "Ổn", count: layersOk, tone: "bg-success" },
            { key: "bad", label: "Hỏng", count: layersBad, tone: "bg-destructive" },
            { key: "unknown", label: "Chưa kiểm được", count: layers.length - layersOk - layersBad, tone: "bg-muted-foreground/40" },
          ]}
        />
      </StatCard>
    </div>
  )
}
