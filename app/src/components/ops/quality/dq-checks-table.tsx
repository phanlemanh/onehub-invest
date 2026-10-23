"use client"

import { useMemo } from "react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"

export type DqCheckRow = {
  check_name: string
  entity: string
  status: string
  detail: string | null
  checked_at: string
}

/** Kết quả kiểm DQ → Badge trạng thái (không tô màu chữ tay). */
const RESULT: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  pass: { label: "Đạt", variant: "success-light" },
  warn: { label: "Cảnh báo", variant: "warning-light" },
}

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
          const r = RESULT[row.original.status] ?? { label: row.original.status, variant: "destructive-light" as const }
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
        cell: ({ row }) => row.original.checked_at.slice(0, 16).replace("T", " "),
        size: 150,
        enableSorting: true,
      },
    ],
    []
  )
  return (
    <InsightGrid
      title="Kiểm chất lượng (7 ngày)"
      description="Kết quả DQ check gần nhất — enum-vocab và các kiểm khác"
      data={rows}
      columns={columns}
      getRowId={(r) => `${r.check_name}|${r.entity}|${r.checked_at}`}
      initialSort={[{ id: "at", desc: true }]}
    />
  )
}
