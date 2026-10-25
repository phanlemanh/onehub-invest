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

/** Trên máy chủ vùng chưa dựng thì nút trỏ Alert «chưa có số trên máy chủ» (collections-view). Bảng luồng 7 ngày dựng khi
 * đã có bản tin (ON5, `flowShown`), bảng nhóm S03 khi có khối `s03` (ON4, `s03Shown`) — nút trỏ về bảng. */
const CLOUD_ANCHOR = "#tren-may-thu"

export function CollectionsTiles({
  feeds,
  funnel,
  layers,
  agentTurnsToday,
  roles = {},
  cloud,
}: {
  feeds: SourceFeedHealth[]
  funnel: GateFunnel
  layers: LockdownLayer[]
  /** null = chưa kiểm được log agent-turn hôm nay (ON2). */
  agentTurnsToday: number | null
  /** Vai trò nguồn cho nhãn «S0x · vai trò» (ON7). */
  roles?: SourceRoles
  /** Trên máy chủ (ON3): ô nào chưa có số thì «—»; `stale` = số là lần đo cuối, hiện mờ. Khoá an toàn đọc khối `lockdown`
   * (ON23): có khối → như máy thu, `lockdown.stale` theo mốc đo của khối; không khối → «—» kèm «Chưa kiểm được trên máy
   * chủ» (ON3 Hỏi-1 = A). Vắng = máy thu, đo trực tiếp. */
  cloud?: { feedsMeasured: boolean; records24h: number | null; stale: boolean; funnelMeasured: boolean; lockdown: { stale: boolean } | null; flowShown?: boolean; s03Shown?: boolean }
}) {
  const s03 = sourceLabel("S03", roles)
  const states = feeds.map(feedState)
  const count = (s: ReturnType<typeof feedState>) => states.filter((x) => x === s).length
  // Cùng con số với ô «Đạt SLO» của /ops (AU6): nguồn đạt khi mọi thị trường đạt; y = nguồn active có SLO.
  const slo = feedSloSummary(feeds)
  const items24h = cloud ? cloud.records24h : feeds.reduce((sum, f) => sum + (f.items24h || 0), 0)
  const muted = cloud?.stale ?? false
  // Số cũ (ADR-0014 hàng «Cũ»): thanh phân đoạn cũng mờ, không tô màu trạng thái — số là lần đo cuối, không phải bây giờ.
  const tone = (t: string) => (muted ? "bg-muted-foreground/40" : t)
  const busiest = [...feeds].sort((a, b) => (b.items24h || 0) - (a.items24h || 0))[0]
  const layersOk = layers.filter((l) => l.ok === true).length
  // Khối khoá an toàn cũ quá 45′ (ON23): số mờ, đoạn «Ổn» không tô xanh.
  const lockMuted = cloud?.lockdown?.stale ?? false
  const layersBad = layers.filter((l) => l.ok === false).length

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:gap-3">
      <StatCard
        icon={<PlugIcon aria-hidden="true" />}
        title="Sức khoẻ nguồn"
        period="Bây giờ"
        value={cloud && !cloud.feedsMeasured ? "—" : fmtInt(slo.ok)}
        total={cloud && !cloud.feedsMeasured ? undefined : fmtInt(slo.total)}
        basis={cloud && !cloud.feedsMeasured ? "Chưa có số" : "Đạt khi mọi thị trường đạt"}
        sloSummary={sloSummaryKey(slo)}
        muted={muted}
        action={{ label: "Xem từng nguồn", href: "#nguon" }}
      >
        {cloud && !cloud.feedsMeasured ? null : <SegmentBar
          label="Nguồn theo sức khoẻ"
          segments={(["ok", "late", "nodata", "noslo", "stopped"] as const).map((s) => ({ key: s, label: FEED_STATE[s].label, count: count(s), tone: tone(FEED_STATE[s].tone) }))}
        />}
      </StatCard>

      <StatCard
        icon={<TrendingUpIcon aria-hidden="true" />}
        title="Bản ghi 24h"
        period="24 giờ"
        value={items24h === null ? "—" : fmtInt(items24h)}
        basis={items24h === null ? "Chưa có số" : busiest && busiest.items24h ? `Nhiều nhất: ${busiest.code} (${fmtInt(busiest.items24h)})` : "Chưa có bản ghi trong 24 giờ"}
        muted={muted}
        action={{ label: "Xem luồng 7 ngày", href: cloud && !cloud.flowShown ? CLOUD_ANCHOR : "#luong" }}
      />

      <StatCard
        icon={<MessageSquareIcon aria-hidden="true" />}
        title={`Cổng ${s03} hôm nay`}
        period="Hôm nay"
        value={cloud && !cloud.funnelMeasured ? "—" : fmtInt(funnel.today.passed)}
        total={cloud && !cloud.funnelMeasured ? undefined : fmtInt(funnel.today.messages)}
        basis={cloud && !cloud.funnelMeasured ? "Chưa có số" : `${fmtInt(funnel.today.skipped)} tin bị cổng chặn`}
        muted={muted}
        action={{ label: `Xem nhóm ${s03}`, href: cloud && !cloud.s03Shown ? CLOUD_ANCHOR : "#nhom-s03" }}
      >
        {cloud && !cloud.funnelMeasured ? null : <SegmentBar
          label={`Tin ${s03} hôm nay`}
          segments={[
            { key: "passed", label: "Qua cổng", count: funnel.today.passed, tone: tone("bg-success") },
            { key: "skipped", label: "Bị chặn", count: funnel.today.skipped, tone: "bg-muted-foreground/40" },
          ]}
        />}
      </StatCard>

      {cloud && !cloud.lockdown ? (
        <StatCard
          icon={<ShieldCheckIcon aria-hidden="true" />}
          title="Khoá an toàn"
          period="Bây giờ"
          value="—"
          badge={<Badge variant="warning-light">Chưa kiểm được trên máy chủ</Badge>}
          basis="Kiểm ở cổng Ops trên máy thu"
          action={{ label: "Xem các lớp", href: "#lockdown" }}
        />
      ) : (
        <StatCard
          icon={<ShieldCheckIcon aria-hidden="true" />}
          title="Khoá an toàn"
          period="Bây giờ"
          value={fmtInt(layersOk)}
          total={fmtInt(layers.length)}
          badge={agentTurnsToday !== null && agentTurnsToday > 0 ? <Badge variant="destructive-light">{fmtInt(agentTurnsToday)} lượt tự trả lời</Badge> : undefined}
          basis={
            agentTurnsToday === null
              ? "Chưa kiểm được lượt máy tự trả lời hôm nay"
              : agentTurnsToday > 0
                ? "Có lượt máy tự trả lời hôm nay — kiểm ngay"
                : "Không có lượt máy tự trả lời hôm nay"
          }
          muted={lockMuted}
          action={{ label: "Xem các lớp", href: "#lockdown" }}
        >
          <SegmentBar
            label="Lớp khoá an toàn"
            segments={[
              { key: "ok", label: "Ổn", count: layersOk, tone: lockMuted ? "bg-muted-foreground/40" : "bg-success" },
              { key: "bad", label: "Hỏng", count: layersBad, tone: "bg-destructive" },
              { key: "unknown", label: "Chưa kiểm được", count: layers.length - layersOk - layersBad, tone: "bg-muted-foreground/40" },
            ]}
          />
        </StatCard>
      )}
    </div>
  )
}
