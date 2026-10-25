"use client"

// Lớp lockdown Zalo + hạ tầng thu trong cùng khuôn lưới tab của solution-dev-ops-6.
import { useMemo } from "react"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import type { LockdownLayer } from "@/lib/ops-queries"

import { StatusGrid, type StatusTab } from "./status-grid"
import { fmtVnDateTime } from "@/lib/format"

type LayerState = "ok" | "bad" | "unknown" | "machine"
const stateOf = (l: LockdownLayer): LayerState => (l.ok === true ? "ok" : l.ok === false ? "bad" : "unknown")
const LAYER: Record<LayerState, { label: string; variant: BadgeProps["variant"]; tone: string }> = {
  ok: { label: "Ổn", variant: "success-light", tone: "bg-success" },
  bad: { label: "Hỏng", variant: "destructive-light", tone: "bg-destructive" },
  unknown: { label: "Chưa kiểm được", variant: "outline", tone: "bg-muted-foreground/40" },
  // Máy chủ chưa có khối khoá an toàn (ON23 Hỏi-3 = A): vàng như ô Khoá an toàn — không bao giờ «Ổn» khi không kiểm.
  machine: { label: "Chỉ kiểm ở máy thu", variant: "warning-light", tone: "bg-warning" },
}
const tabsOf = (states: LayerState[]): StatusTab<LockdownLayer>[] =>
  states.map((s) => ({ value: s, label: LAYER[s].label, tone: LAYER[s].tone, match: (l) => stateOf(l) === s }))
const TABS = tabsOf(["bad", "unknown", "ok"])
// Số cũ: chấm tab «Ổn» cũng thôi xanh — lần đo cuối, không phải bây giờ.
const STALE_TABS = TABS.map((t) => (t.value === "ok" ? { ...t, tone: LAYER.unknown.tone } : t))
const MACHINE_TABS: StatusTab<LockdownLayer>[] = [{ value: "machine", label: LAYER.machine.label, tone: LAYER.machine.tone, match: () => true }]

/** `machineOnly`: máy chủ chưa có khối khoá an toàn — mọi lớp «Chỉ kiểm ở máy thu» (ON23). `stale`: khối cũ quá 45′ —
 * nhãn giữ nguyên, «Ổn» không tô xanh. */
export function LockdownGrid({
  layers,
  lastWatchdogAt,
  stale = false,
  machineOnly = false,
}: {
  layers: LockdownLayer[]
  lastWatchdogAt: string | null
  stale?: boolean
  machineOnly?: boolean
}) {
  const columns = useMemo<InsightColumn<LockdownLayer>[]>(
    () => [
      { id: "layer", accessorKey: "layer", header: "Lớp", size: 120 },
      { id: "desc", accessorKey: "desc", header: "Kiểm", size: 420 },
      {
        id: "state",
        accessorFn: (l) => (machineOnly ? "machine" : stateOf(l)),
        header: "Trạng thái",
        cell: ({ row }) => {
          const st = machineOnly ? "machine" : stateOf(row.original)
          return <Badge variant={stale && st === "ok" ? "outline" : LAYER[st].variant}>{LAYER[st].label}</Badge>
        },
        size: 150,
      },
    ],
    [stale, machineOnly]
  )
  return (
    <StatusGrid
      id="lockdown"
      title="Khoá an toàn & hạ tầng thu"
      description={machineOnly ? "Chưa có số từ máy thu" : `Bộ canh chạy cuối: ${fmtVnDateTime(lastWatchdogAt)}`}
      data={layers}
      columns={columns}
      tabs={machineOnly ? MACHINE_TABS : stale ? STALE_TABS : TABS}
      getRowId={(l) => `${l.layer}|${l.desc}`}
    />
  )
}
