// chuyển thể từ @reui/solution-dev-ops-6 (section-header.tsx, stat-cards.tsx): dải đầu
// vùng dùng chung, thẻ số ba dải và thanh phân đoạn có chú giải đếm.
// Khác bản gốc: hành động ở chân thẻ là liên kết neo tới vùng chi tiết trên trang
// (không mở sheet bản ghi), bỏ chip so với hôm qua khi chưa có số hôm qua.
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { cn } from "@/lib/utils"

export function SectionHeader({ title, description, children }: { title: string; description: ReactNode; children?: ReactNode }) {
  return (
    <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-px">
        <FrameTitle role="heading" aria-level={3}>
          {title}
        </FrameTitle>
        <FrameDescription>{description}</FrameDescription>
      </div>
      {children}
    </FrameHeader>
  )
}

export type Segment = { key: string; label: string; count: number; tone: string }

export function StatCard({
  icon,
  title,
  period,
  value,
  total,
  badge,
  basis,
  children,
  action,
  sloSummary,
}: {
  icon: ReactNode
  title: string
  period: string
  value: string
  total?: string
  badge?: ReactNode
  basis: string
  children?: ReactNode
  action: { label: string; href: string }
  /** Giá trị `data-slo-summary` (AU6) — chỉ ô «Sức khoẻ nguồn» mang. */
  sloSummary?: string
}) {
  return (
    <Frame spacing="default" className="h-full min-w-0" data-slo-summary={sloSummary}>
      <FramePanel className="flex flex-col gap-3">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 [&_svg:not([class*=size-])]:size-4">
          {icon}
          <span className="text-foreground truncate text-sm font-medium">{title}</span>
          <span className="ms-auto shrink-0 text-xs">{period}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-2xl leading-8 font-semibold tracking-tight tabular-nums">
              {value}
              {total === undefined ? null : <span className="text-muted-foreground text-base font-normal">/{total}</span>}
            </span>
            {badge}
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">{basis}</span>
        </div>
        {children}
      </FramePanel>
      <FrameFooter>
        <Link
          href={action.href}
          className="group/action text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex w-full min-w-0 items-center justify-between gap-3 rounded-full text-sm transition-colors outline-none focus-visible:ring-3"
        >
          <span className="truncate">{action.label}</span>
          <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 transition-transform duration-150 group-hover/action:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </FrameFooter>
    </Frame>
  )
}

export function SegmentBar({ segments, label }: { segments: Segment[]; label: string }) {
  const shown = segments.filter((s) => s.count > 0)
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <div
        role="img"
        aria-label={`${label}: ${shown.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(", ")}`}
        className="flex h-2 w-full gap-1"
      >
        {shown.map((s) => (
          <span key={s.key} className={cn("h-full min-w-1 rounded-full", s.tone)} style={{ flexGrow: s.count }} />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {segments.map((s) => (
          <div key={s.key} className="flex min-w-0 items-center gap-1.5 text-xs">
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", s.tone)} />
            <dt className="text-muted-foreground min-w-0 truncate">{s.label}</dt>
            <dd className="ms-auto font-medium tabular-nums">{s.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
