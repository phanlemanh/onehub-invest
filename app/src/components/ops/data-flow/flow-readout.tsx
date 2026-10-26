"use client"

import { ArrowRightIcon } from "lucide-react"

import { fmtInt, fmtPct } from "@/lib/format"

import { PREVIOUS_STAGE, type FlowLink, type FlowNode } from "./flow-sankey-data"
import { StageFace } from "./stage-face"

export type Hover = { type: "node" | "link"; index: number } | null

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground flex items-center justify-between gap-4">
      {label}
      <span className="text-foreground font-mono font-medium tabular-nums">{value}</span>
    </span>
  )
}

/** Bảng đọc khi rê chuột lên một nút hay một dòng chảy (readout của @reui/chart-49), thêm lý do rơi của nhánh. */
export function FlowReadout({ hover, nodes, links, total }: { hover: Hover; nodes: FlowNode[]; links: FlowLink[]; total: number }) {
  if (!hover) return null
  const amountOf = (id: string) => nodes.find((node) => node.id === id)?.amount ?? 0
  if (hover.type === "node") {
    const node = nodes[hover.index]
    const previous = PREVIOUS_STAGE[node.id]
    return (
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium">{node.name}</span>
          <span className="text-muted-foreground">
            <StageFace stage={node.stage} />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <Readout label="Số lượng" value={fmtInt(node.amount)} />
          <Readout label="So với bài nhận" value={fmtPct(node.amount / total)} />
          {previous ? <Readout label="Tỉ lệ bước" value={fmtPct(node.amount / Math.max(1, amountOf(previous)))} /> : null}
        </div>
        {node.hint ? <p className="text-muted-foreground text-xs text-pretty">{node.hint}</p> : null}
      </div>
    )
  }
  const link = links[hover.index]
  const source = nodes[link.source]
  const target = nodes[link.target]
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 font-medium [&_svg:not([class*=size-])]:size-3.5">
        {source.name}
        <span className="text-muted-foreground">
          <ArrowRightIcon aria-hidden="true" />
        </span>
        {target.name}
      </span>
      <div className="flex flex-col gap-1">
        <Readout label="Số lượng" value={fmtInt(link.value)} />
        <Readout label={`Trong ${source.name}`} value={fmtPct(link.value / Math.max(1, source.amount))} />
      </div>
    </div>
  )
}
