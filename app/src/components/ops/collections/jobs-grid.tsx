"use client"

// chuyển thể từ @reui/solution-dev-ops-1 (data-grid-view.tsx, columns.tsx): lưới job theo
// lịch có tab sức khoẻ. Khác bản gốc: bỏ công tắc bật/tắt job, cột 20 lần chạy, lần chạy kế
// và bộ sửa cron (launchd không sửa từ web; chưa có lịch sử từng lần chạy).
import { useMemo } from "react"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import type { JobStatus } from "@/lib/collections-queries"

import { StatusGrid, type StatusTab } from "./status-grid"
import { fmtVnDateTime } from "@/lib/format"

const ALIVE: Record<JobStatus["alive"], { label: string; variant: BadgeProps["variant"]; tone: string }> = {
  yes: { label: "Sống", variant: "success-light", tone: "bg-success" },
  no: { label: "Không phản hồi", variant: "warning-light", tone: "bg-warning" },
  unknown: { label: "Theo lịch", variant: "outline", tone: "bg-muted-foreground/40" },
}
const TABS: StatusTab<JobStatus>[] = (["no", "yes", "unknown"] as const).map((a) => ({
  value: a,
  label: ALIVE[a].label,
  tone: ALIVE[a].tone,
  match: (j) => j.alive === a,
}))

export function JobsGrid({ jobs }: { jobs: JobStatus[] }) {
  const columns = useMemo<InsightColumn<JobStatus>[]>(
    () => [
      { id: "label", accessorKey: "label", header: ({ column }) => <DataGridColumnHeader title="Job" column={column} />, size: 280, enableSorting: true },
      { id: "schedule", accessorKey: "schedule", header: "Lịch", size: 180 },
      { id: "alive", accessorKey: "alive", header: "Trạng thái", cell: ({ row }) => <Badge variant={ALIVE[row.original.alive].variant}>{ALIVE[row.original.alive].label}</Badge>, size: 140 },
      {
        id: "last",
        accessorFn: (j) => j.lastLogAt ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Chạy cuối" column={column} />,
        cell: ({ row }) => fmtVnDateTime(row.original.lastLogAt),
        size: 150,
        enableSorting: true,
      },
      {
        id: "line",
        accessorKey: "lastLine",
        header: "Dòng log cuối",
        cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{row.original.lastLine ?? "—"}</span>,
        size: 340,
      },
    ],
    []
  )
  return (
    <StatusGrid
      id="may-moc"
      title="Máy móc (launchd)"
      description="Agent tự chạy — log lần cuối và probe dịch vụ KeepAlive"
      data={jobs}
      columns={columns}
      tabs={TABS}
      getRowId={(j) => j.id}
    />
  )
}
