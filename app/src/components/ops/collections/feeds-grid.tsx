"use client"

// Lưới "All connections" của solution-dev-ops-6 cho sức khoẻ từng nguồn S0x.
import { useMemo } from "react"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { fmtInt } from "@/lib/format"
import { fmtAge } from "@/lib/freshness"
import type { SourceFeedHealth } from "@/lib/ops-queries"

import { FEED_STATE, feedState } from "./feed-status"
import { StatusGrid, type StatusTab } from "./status-grid"

const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }
const TABS: StatusTab<SourceFeedHealth>[] = (["late", "stopped", "ok"] as const).map((s) => ({
  value: s,
  label: FEED_STATE[s].label,
  tone: FEED_STATE[s].tone,
  match: (f) => feedState(f) === s,
}))

export function FeedsGrid({ feeds }: { feeds: SourceFeedHealth[] }) {
  const columns = useMemo<InsightColumn<SourceFeedHealth>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        header: ({ column }) => <DataGridColumnHeader title="Nguồn" column={column} />,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="font-mono">{row.original.code}</span>
            <span className="text-muted-foreground truncate">{row.original.labelVi}</span>
          </span>
        ),
        size: 200,
        enableSorting: true,
      },
      {
        id: "state",
        accessorFn: (f) => feedState(f),
        header: "Trạng thái",
        cell: ({ row }) => {
          const s = FEED_STATE[feedState(row.original)]
          return <Badge variant={s.variant}>{row.original.status !== "active" ? row.original.status : s.label}</Badge>
        },
        size: 120,
      },
      {
        id: "last",
        accessorFn: (f) => f.lastRunAt ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Chạy cuối" column={column} />,
        cell: ({ row }) => (row.original.lastRunAt ? row.original.lastRunAt.slice(0, 16).replace("T", " ") : "—"),
        size: 150,
        enableSorting: true,
      },
      {
        id: "fresh",
        accessorFn: (f) => f.freshnessHrs ?? Number.POSITIVE_INFINITY,
        header: ({ column }) => <DataGridColumnHeader title="Độ tươi" column={column} />,
        cell: ({ row }) => (
          <>
            {fmtAge(row.original.freshnessHrs)}
            {row.original.sloHours ? <span className="text-muted-foreground"> / {fmtAge(row.original.sloHours)}</span> : null}
          </>
        ),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      { id: "n24", accessorKey: "items24h", header: "24h", cell: ({ row }) => (row.original.items24h ? fmtInt(row.original.items24h) : "—"), size: 90, meta: NUM },
      { id: "stg", accessorKey: "stgRows", header: "Staging", cell: ({ row }) => (row.original.stgRows ? fmtInt(row.original.stgRows) : "—"), size: 100, meta: NUM },
      { id: "offers", accessorFn: (f) => f.offers ?? -1, header: "Offers", cell: ({ row }) => fmtInt(row.original.offers), size: 100, meta: NUM },
    ],
    []
  )
  return (
    <StatusGrid
      id="nguon"
      title="Sức khoẻ nguồn"
      description="Kênh nào sống, chết hay trễ SLO — theo mã nguồn"
      data={feeds}
      columns={columns}
      tabs={TABS}
      getRowId={(f) => f.code}
    />
  )
}
