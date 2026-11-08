"use client"

import Link from "next/link"
import { HistoryIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { fmtVnDateTime } from "@/lib/format"
import type { QuyetGanDay } from "@/lib/ops/review-gan-day"

/**
 * Quyết định gần đây (OD2 · ĐC5) — chuyển thể `recent-decisions` của `@reui/solution-agents-5` (đã cài): Card → Frame
 * theo họ khung trang (routes.md), timeline giữ nguyên, bỏ avatar người duyệt (chỉ quyết định của chính người đang duyệt —
 * Hỏi-3), chữ tiếng Việt. #id mở thẻ đã quyết qua `?card=` để xem lại; đảo quyết định là lệnh đảo ADR-0015 (việc sau).
 */
export function ReviewGanDay({ rows, onDuyetLien }: { rows: QuyetGanDay[]; onDuyetLien?: () => void }) {
  return (
    <Frame spacing="default" className="w-full min-w-0" data-review-gan-day>
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>Quyết định gần đây</FrameTitle>
        <FrameDescription>Lượt quyết của chính mình trong 7 ngày, mới nhất trước.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        {rows.length === 0 ? (
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HistoryIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>Chưa có quyết định nào trong 7 ngày</EmptyTitle>
              <EmptyDescription>Quyết một thẻ thì lượt đó hiện ở đây để xem lại.</EmptyDescription>
            </EmptyHeader>
            {onDuyetLien && (
              <EmptyContent>
                <Button variant="outline" size="sm" onClick={onDuyetLien}>Duyệt liền</Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <Timeline>
            {rows.map((r, i) => (
              <TimelineItem key={`${r.id}-${r.at}`} step={i + 1} className={i === rows.length - 1 ? "pb-0" : "pb-6"} data-review-gan-day-dong={r.id}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <TimelineTitle className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                      <Link
                        href={`/ops/review?card=${r.id}`}
                        className="text-muted-foreground hover:text-primary shrink-0 tabular-nums underline-offset-2 transition-colors hover:underline"
                      >
                        #{r.id}
                      </Link>
                      <span className="min-w-0 truncate" translate="no">{r.title}</span>
                    </TimelineTitle>
                    <Badge variant="outline">{r.nhan}</Badge>
                  </div>
                </TimelineHeader>
                <TimelineContent className="mt-1 flex flex-col gap-0.5">
                  {r.lyDo && <span className="text-muted-foreground text-xs break-words" data-review-gan-day-ly-do>Lý do: {r.lyDo}</span>}
                  <span className="text-muted-foreground text-xs tabular-nums">{fmtVnDateTime(r.at)}</span>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </FramePanel>
    </Frame>
  )
}
