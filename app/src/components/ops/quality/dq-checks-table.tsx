"use client"

import { useMemo } from "react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DqCheckRow, dqResult } from "@/lib/dq-checks"
import { fmtVnDateTime } from "@/lib/format"

export type { DqCheckRow }

export function DqChecksTable({ rows }: { rows: DqCheckRow[] }) {
  const columns = useMemo<InsightColumn<DqCheckRow>[]>(
    () => [
      {
        id: "check",
        accessorKey: "check_name",
        header: ({ column }) => <DataGridColumnHeader title="Kiểm" column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.check_name}</span>,
        size: 200,
        enableSorting: true,
      },
      { id: "entity", accessorKey: "entity", header: "Đối tượng", size: 160 },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Kết quả" column={column} />,
        cell: ({ row }) => {
          // Nhãn + màu theo nghĩa của từng kiểm (ON9): kiểm số tham chiếu không bao giờ «Đạt» xanh lá.
          const r = dqResult(row.original.check_name, row.original.status)
          return <Badge variant={r.variant}>{r.label}</Badge>
        },
        size: 120,
        enableSorting: true,
      },
      {
        id: "detail",
        accessorKey: "detail",
        header: "Chi tiết",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.detail ?? "—"}</span>,
        size: 320,
      },
      {
        id: "at",
        accessorKey: "checked_at",
        header: ({ column }) => <DataGridColumnHeader title="Lúc kiểm" column={column} />,
        cell: ({ row }) => fmtVnDateTime(row.original.checked_at),
        size: 150,
        enableSorting: true,
      },
    ],
    []
  )
  return (
    <InsightGrid
      title="Kiểm chất lượng (7 ngày)"
      description="Bản mới nhất của mỗi kiểm theo từng đối tượng, trong 7 ngày"
      data={rows}
      columns={columns}
      getRowId={(r) => `${r.check_name}|${r.entity}|${r.checked_at}`}
      initialSort={[{ id: "at", desc: true }]}
    />
  )
}
