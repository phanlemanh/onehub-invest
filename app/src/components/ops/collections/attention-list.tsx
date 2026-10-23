// chuyển thể từ @reui/solution-dev-ops-6 (attention-list.tsx): danh sách việc cần chú
// ý, nặng nhất trước, mỗi dòng một Item có Badge mức. Khác bản gốc: không có nút sửa
// tại chỗ (trang chỉ quan sát — quản trị ở /ops/sources), không thẻ hover chi tiết.
import { ShieldCheckIcon } from "lucide-react"

import { Badge, type BadgeProps } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import type { ZaloGroupRow, ZaloHealth } from "@/lib/collections-queries"
import { fmtInt } from "@/lib/format"
import { fmtAge } from "@/lib/freshness"
import type { LockdownLayer, SourceFeedHealth } from "@/lib/ops-queries"

import { feedState } from "./feed-status"
import { SectionHeader } from "./section"

export type Issue = { key: string; title: string; detail: string; label: string; variant: BadgeProps["variant"]; rank: number }

/** Gom việc cần chú ý từ các nguồn số đã có trên trang; rank nhỏ = nặng hơn. */
export function issuesOf({
  feeds,
  layers,
  agentTurnsToday,
  zalo,
  groups,
  factsAgeMin,
  nowMs,
}: {
  feeds: SourceFeedHealth[]
  layers: LockdownLayer[]
  agentTurnsToday: number
  zalo: ZaloHealth
  groups: ZaloGroupRow[]
  factsAgeMin: number | null
  /** Mốc "bây giờ" do trang server truyền vào (trang force-dynamic). */
  nowMs: number
}): Issue[] {
  const out: Issue[] = []
  if (agentTurnsToday > 0)
    out.push({ key: "agent", title: "Agent-turn hôm nay", detail: `${fmtInt(agentTurnsToday)} lượt — lockdown phải giữ 0`, label: "Khẩn", variant: "destructive-light", rank: 0 })
  for (const l of layers.filter((x) => x.ok === false))
    out.push({ key: `layer-${l.layer}-${l.desc}`, title: `Lớp ${l.layer}`, detail: l.desc, label: "Hỏng", variant: "destructive-light", rank: 1 })
  if (zalo.connected === false)
    out.push({ key: "zalo-down", title: "Kênh Zalo đứt", detail: "Cần đăng nhập lại kênh zalouser", label: "Đứt", variant: "destructive-light", rank: 1 })
  if (factsAgeMin !== null && factsAgeMin > 30)
    out.push({ key: "facts", title: "Máy thu có thể offline", detail: `Dữ liệu máy thu cập nhật ${fmtInt(factsAgeMin)} phút trước`, label: "Trễ", variant: "warning-light", rank: 2 })
  for (const f of feeds.filter((x) => feedState(x) === "late"))
    out.push({ key: `feed-${f.code}`, title: `${f.code} trễ SLO`, detail: `Độ tươi ${fmtAge(f.freshnessHrs)} / SLO ${fmtAge(f.sloHours)}`, label: "Trễ SLO", variant: "warning-light", rank: 2 })
  for (const f of feeds.filter((x) => feedState(x) === "nodata"))
    out.push({ key: `feed-${f.code}`, title: `${f.code} chưa có dữ liệu`, detail: "Bảng nạp của nguồn chưa có bản ghi nào", label: "Chưa có dữ liệu", variant: "destructive-light", rank: 2 })
  if (zalo.silentAlert24h) out.push({ key: "silent", title: "Ống Zalo im 24h", detail: "Không có tin qua cổng trong 24 giờ", label: "Im lặng", variant: "warning-light", rank: 3 })
  if (zalo.driftAlert24h) out.push({ key: "drift", title: "Allowlist lệch membership", detail: "Đối chiếu lại ở Nguồn dữ liệu", label: "Lệch", variant: "warning-light", rank: 3 })
  const silentGroups = groups.filter((g) => !g.isMockOnly && g.lastSeenAt && nowMs - Date.parse(g.lastSeenAt) > 72 * 3_600_000)
  if (silentGroups.length)
    out.push({ key: "groups", title: `${fmtInt(silentGroups.length)} nhóm Zalo im > 72h`, detail: "Kiểm bị kick hoặc đổi tên", label: "Im lặng", variant: "warning-light", rank: 4 })
  return out.sort((a, b) => a.rank - b.rank)
}

export function AttentionList({ issues, className }: { issues: Issue[]; className?: string }) {
  return (
    <Frame spacing="default" className={className}>
      <SectionHeader title="Cần chú ý" description={issues.length ? `${fmtInt(issues.length)} việc, nặng nhất trước` : "Không có việc nào chờ"} />
      <FramePanel>
        {issues.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheckIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Mọi thứ ổn</EmptyTitle>
              <EmptyDescription>Nguồn trong hạn, lockdown đủ lớp, kênh Zalo kết nối.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-0">
            {issues.map((issue) => (
              <Item key={issue.key} size="xs" className="px-0">
                <ItemContent className="min-w-0">
                  <ItemTitle className="max-w-full min-w-0">
                    <span className="min-w-0 truncate">{issue.title}</span>
                    <Badge variant={issue.variant} className="shrink-0">
                      {issue.label}
                    </Badge>
                  </ItemTitle>
                  <ItemDescription className="truncate">{issue.detail}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </FramePanel>
    </Frame>
  )
}
