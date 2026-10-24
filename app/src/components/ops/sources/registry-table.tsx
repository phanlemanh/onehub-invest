"use client"

import { useMemo } from "react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { sourceStatusLabel } from "@/lib/ops-labels"
import { RawLabel } from "@/components/ops/raw-label"

export type RegistryRow = {
  code: string
  real_name: string
  label_vi: string
  status: string
  since: string
  retired_at: string | null
}

/** Bảng giải mã mã nguồn ↔ tên thật (tầng A, chỉ admin) — bảng thuần nên giữ InsightGrid. */
export function RegistryTable({ rows }: { rows: RegistryRow[] }) {
  const columns = useMemo<InsightColumn<RegistryRow>[]>(
    () => [
      { id: "code", accessorKey: "code", header: ({ column }) => <DataGridColumnHeader title="Mã" column={column} />, cell: ({ row }) => <span className="font-mono">{row.original.code}</span>, size: 80, enableSorting: true },
      {
        id: "real",
        accessorKey: "real_name",
        header: "Tên thật (tầng A)",
        cell: ({ row }) => (
          <span data-tier-a translate="no" className="font-mono">
            {row.original.real_name}
          </span>
        ),
        size: 200,
      },
      { id: "label", accessorKey: "label_vi", header: "Nhãn hiển thị (tầng C)", size: 180 },
      {
        id: "status",
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <Badge variant={row.original.status === "active" ? "success-light" : "outline"}><RawLabel n={sourceStatusLabel(row.original.status)} raw={row.original.status} /></Badge>,
        size: 120,
      },
      { id: "since", accessorKey: "since", header: "Từ", size: 120 },
      { id: "retired", accessorFn: (r) => r.retired_at ?? "", header: "Ngừng dùng", cell: ({ row }) => row.original.retired_at ?? "—", size: 120 },
    ],
    []
  )
  return (
    <InsightGrid
      title="Danh mục mã nguồn"
      description="Mã đã ngừng không tái sử dụng; đổi nhãn công khai phải có quyết định kiến trúc"
      data={rows}
      columns={columns}
      getRowId={(r) => r.code}
    />
  )
}
