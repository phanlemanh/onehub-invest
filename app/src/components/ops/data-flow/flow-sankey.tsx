"use client"

import { useEffect, useRef, useState } from "react"
import { PauseIcon, PlayIcon, RotateCcwIcon, WorkflowIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { FlowSource, SourceFlow } from "@/lib/data-flow-queries"
import { fmtInt } from "@/lib/format"
import type { SourceRoles } from "@/lib/source-labels"

import { buildFlow } from "./flow-sankey-data"
import { FlowJourney } from "./flow-journey"
import { StageFace } from "./stage-face"

type Pick = "all" | FlowSource

/**
 * «Đường ống» — chuyển thể chart.tsx của @reui/chart-49: Frame + ToggleGroup chọn nguồn (thay khoảng ngày; khoảng
 * ngày ở đầu trang), nút phát lại/tạm dừng của block. Nguồn chọn mặc định là «Tất cả».
 */
export function FlowSankey({ sources, roles }: { sources: SourceFlow[]; roles: SourceRoles }) {
  const [pick, setPick] = useState<Pick>("all")
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [onscreen, setOnscreen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const chosen = pick === "all" ? sources : sources.filter((s) => s.source === pick)
  const { nodes, links, headers, totals } = buildFlow(chosen, roles)
  const approx = chosen.some((s) => s.approx && s.received > 0)

  // Hạt ngừng chảy khi khung cuộn khỏi màn hình.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting))
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  const options: { value: Pick; label: string }[] = [
    { value: "all", label: "Tất cả" },
    ...sources.map((s) => ({ value: s.source, label: s.source })),
  ]

  return (
    <Frame dense spacing="default" className="@container w-full">
      <FrameHeader className="min-w-0 flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <FrameTitle className="truncate">Đường ống</FrameTitle>
            <Badge variant="outline" className="tabular-nums">
              {fmtInt(totals.received)} bài
            </Badge>
          </div>
          <FrameDescription className="truncate">Bài đi tới đâu và rơi ở chặng nào</FrameDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            multiple={false}
            value={[pick]}
            onValueChange={(value: string[]) => {
              const next = options.find((o) => o.value === value[0])
              if (!next) return
              setPick(next.value)
              setRun((count) => count + 1)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Nguồn"
          >
            {options.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value} className="text-muted-foreground data-pressed:text-foreground">
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button variant="outline" size="icon-sm" aria-label="Chảy lại" className="motion-reduce:hidden" onClick={() => setRun((c) => c + 1)}>
            <RotateCcwIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={paused ? "Cho chảy tiếp" : "Tạm dừng dòng chảy"}
            aria-pressed={paused}
            className="motion-reduce:hidden"
            onClick={() => setPaused((v) => !v)}
          >
            {paused ? <PlayIcon aria-hidden="true" /> : <PauseIcon aria-hidden="true" />}
          </Button>
        </div>
      </FrameHeader>

      <FramePanel ref={panelRef}>
        {totals.received === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WorkflowIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Chưa có bài trong khoảng này</EmptyTitle>
              <EmptyDescription>Chọn «Toàn kho» ở đầu trang hoặc một nguồn khác.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={() => setPick("all")}>
              Xem tất cả nguồn
            </Button>
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto">
              <FlowJourney key={`${pick}-${run}`} nodes={nodes} links={links} headers={headers} paused={paused || !onscreen} />
            </div>
            <ul className="sr-only">
              {links.map((link) => (
                <li key={`${link.source}-${link.target}`}>
                  {nodes[link.source].name} tới {nodes[link.target].name}: {fmtInt(link.value)}
                </li>
              ))}
            </ul>
          </>
        )}
      </FramePanel>

      <FrameFooter className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <StageFace stage="journey" />
          <StageFace stage="linked" />
          <StageFace stage="merged" />
          <StageFace stage="dropped" />
        </span>
        <span className="text-muted-foreground">
          {approx ? "S06 chưa nối ngược bài → tin: chặng «Đọc được» của S06 là ước lượng" : "Bài tính theo ngày đăng, tin theo ngày đăng bài đầu tiên"}
        </span>
      </FrameFooter>
    </Frame>
  )
}
