"use client"

import { Badge, type BadgeProps } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"

import { Separator } from "@/components/ui/separator"
import { fmtInt, fmtMoney, fmtMoneyCompact, fmtPct } from "@/lib/format"
import type { SiblingBenchmark } from "@/lib/queries"

/**
 * Hàng KPI — chuyển thể từ @reui/stats-1. Khác bản gốc: không có menu "…"
 * (chưa có thao tác thật); badge là VỊ TRÍ so với các phường anh em (p30/p60/p90)
 * thay cho % so với tháng trước — dữ liệu chưa có lịch sử để so.
 */
type Tier = { label: string; variant: BadgeProps["variant"] }

function tierOf(mine: number | null, p: number[]): Tier | null {
  if (mine === null || p.length < 3) return null
  if (mine >= p[2]) return { label: "Nhóm đầu", variant: "success-light" }
  if (mine >= p[1]) return { label: "Khá", variant: "info-light" }
  if (mine >= p[0]) return { label: "Trung bình", variant: "outline" }
  return { label: "Thấp", variant: "warning-light" }
}

type StatItem = {
  title: string
  value: string
  tier: Tier | null
  footer: string
}

export function InsightStats({
  kpis,
  currency,
  months,
  benchmark,
}: {
  kpis: { revenue: number; listings: number; adr: number | null; occupancy: number | null }
  currency: string
  months: number
  benchmark: SiblingBenchmark | null
}) {
  const window = `${months} tháng tới`
  const peers = benchmark ? `${benchmark.nSiblings} phường cùng thị trường` : null
  const stats: StatItem[] = [
    {
      title: "Doanh thu",
      value: fmtMoneyCompact(kpis.revenue, currency),
      tier: null,
      footer: `Tổng giá niêm yết đêm đã đặt, ${window}`,
    },
    {
      title: "Listing hoạt động",
      value: fmtInt(kpis.listings),
      tier: null,
      footer: "Số listing có lịch cao nhất trong một tháng",
    },
    {
      title: "Giá phòng (ADR)",
      value: fmtMoney(kpis.adr, currency),
      tier: benchmark ? tierOf(benchmark.adr.mine, benchmark.adr.p) : null,
      footer: benchmark
        ? `Trung vị ${peers}: ${fmtMoney(benchmark.adr.p[1], currency)}`
        : `Doanh thu ÷ đêm đã đặt, ${window}`,
    },
    {
      title: "Công suất",
      value: fmtPct(kpis.occupancy),
      tier: benchmark ? tierOf(benchmark.occ.mine, benchmark.occ.p) : null,
      footer: benchmark
        ? `Trung vị ${peers}: ${fmtPct(benchmark.occ.p[1])}`
        : `Đêm đã đặt ÷ (đã đặt + còn trống), ${window}`,
    },
  ]

  return (
    <div className="grid grow grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Frame key={stat.title}>
          <FramePanel className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                  {stat.value}
                </span>
                {stat.tier && (
                  <Badge variant={stat.tier.variant}>{stat.tier.label}</Badge>
                )}
              </div>
              <Separator />
              <div className="text-muted-foreground text-xs">{stat.footer}</div>
            </div>
          </FramePanel>
        </Frame>
      ))}
    </div>
  )
}
