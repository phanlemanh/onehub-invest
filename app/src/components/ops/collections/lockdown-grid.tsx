"use client"

// Lớp lockdown Zalo + hạ tầng thu trong cùng khuôn lưới tab của solution-dev-ops-6.
import { useMemo } from "react"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import type { LockdownLayer } from "@/lib/ops-queries"

import { StatusGrid, type StatusTab } from "./status-grid"

type LayerState = "ok" | "bad" | "unknown"
const stateOf = (l: LockdownLayer): LayerState => (l.ok === true ? "ok" : l.ok === false ? "bad" : "unknown")
const LAYER: Record<LayerState, { label: string; variant: BadgeProps["variant"]; tone: string }> = {
  ok: { label: "Ổn", variant: "success-light", tone: "bg-success" },
  bad: { label: "Hỏng", variant: "destructive-light", tone: "bg-destructive" },
  unknown: { label: "Chưa kiểm được", variant: "outline", tone: "bg-muted-foreground/40" },
}
const TABS: StatusTab<LockdownLayer>[] = (["bad", "unknown", "ok"] as const).map((s) => ({
  value: s,
  label: LAYER[s].label,
  tone: LAYER[s].tone,
  match: (l) => stateOf(l) === s,
}))

export function LockdownGrid({ layers, lastWatchdogAt }: { layers: LockdownLayer[]; lastWatchdogAt: string | null }) {
  const columns = useMemo<InsightColumn<LockdownLayer>[]>(
    () => [
      { id: "layer", accessorKey: "layer", header: "Lớp", size: 120 },
      { id: "desc", accessorKey: "desc", header: "Kiểm", size: 420 },
      { id: "state", accessorFn: stateOf, header: "Trạng thái", cell: ({ row }) => <Badge variant={LAYER[stateOf(row.original)].variant}>{LAYER[stateOf(row.original)].label}</Badge>, size: 150 },
    ],
    []
  )
  return (
    <StatusGrid
      id="lockdown"
      title="Lockdown & hạ tầng thu"
      description={`Watchdog chạy cuối: ${lastWatchdogAt ?? "—"}`}
      data={layers}
      columns={columns}
      tabs={TABS}
      getRowId={(l) => `${l.layer}|${l.desc}`}
    />
  )
}
