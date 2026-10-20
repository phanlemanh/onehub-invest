"use client"

import { useMemo } from "react"

import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { fmtInt } from "@/lib/format"
import type { FlowDay, JobStatus } from "@/lib/collections-queries"

const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }

export function FlowTable({ days }: { days: FlowDay[] }) {
  const columns = useMemo<InsightColumn<FlowDay>[]>(
    () => [
      {
        id: "day",
        accessorKey: "day",
        header: ({ column }) => <DataGridColumnHeader title="Ngày" column={column} />,
        size: 110,
        enableSorting: false,
      },
      {
        id: "airdnaMarkets",
        accessorFn: (r) => r.airdnaMarkets,
        header: ({ column }) => <DataGridColumnHeader title="AirDNA market" column={column} />,
        cell: ({ row }) => fmtInt(row.original.airdnaMarkets),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airdnaListings",
        accessorFn: (r) => r.airdnaListings,
        header: ({ column }) => <DataGridColumnHeader title="AirDNA listing (LTM)" column={column} />,
        cell: ({ row }) => fmtInt(row.original.airdnaListings),
        size: 160,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airbnbSeen",
        accessorFn: (r) => r.airbnbListingsSeen,
        header: ({ column }) => <DataGridColumnHeader title="Airbnb listing tươi" column={column} />,
        cell: ({ row }) => fmtInt(row.original.airbnbListingsSeen),
        size: 150,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airbnbSnapshots",
        accessorFn: (r) => r.airbnbSnapshots,
        header: ({ column }) => <DataGridColumnHeader title="Airbnb snapshot" column={column} />,
        cell: ({ row }) => fmtInt(row.original.airbnbSnapshots),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloPosts",
        accessorFn: (r) => r.zaloPosts,
        header: ({ column }) => <DataGridColumnHeader title="Zalo post (raw)" column={column} />,
        cell: ({ row }) => fmtInt(row.original.zaloPosts),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloOffers",
        accessorFn: (r) => r.zaloOffers,
        header: ({ column }) => <DataGridColumnHeader title="Zalo offer (parse)" column={column} />,
        cell: ({ row }) => fmtInt(row.original.zaloOffers),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
    ],
    []
  )
  return (
    <InsightGrid
      title="Luồng 7 ngày qua"
      description="Số bản ghi chảy vào theo nguồn, theo ngày (giờ máy)"
      data={days}
      columns={columns}
      getRowId={(r) => r.day}
      pageSize={10}
    />
  )
}

function aliveBadge(alive: JobStatus["alive"]) {
  if (alive === "yes") return <Badge variant="success-light">Sống</Badge>
  if (alive === "no") return <Badge variant="warning-light">Không phản hồi</Badge>
  return <Badge variant="outline">Theo lịch</Badge>
}

export function SchedulerTable({ jobs }: { jobs: JobStatus[] }) {
  const columns = useMemo<InsightColumn<JobStatus>[]>(
    () => [
      {
        id: "label",
        accessorKey: "label",
        header: ({ column }) => <DataGridColumnHeader title="Job" column={column} />,
        size: 300,
        enableSorting: false,
      },
      {
        id: "schedule",
        accessorKey: "schedule",
        header: "Lịch",
        size: 180,
      },
      {
        id: "alive",
        header: "Trạng thái",
        cell: ({ row }) => aliveBadge(row.original.alive),
        size: 130,
      },
      {
        id: "lastLogAt",
        accessorFn: (r) => r.lastLogAt ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Chạy cuối" column={column} />,
        cell: ({ row }) =>
          row.original.lastLogAt
            ? new Date(row.original.lastLogAt).toLocaleString("vi-VN", { hour12: false })
            : "—",
        size: 160,
        enableSorting: true,
      },
      {
        id: "lastLine",
        accessorKey: "lastLine",
        header: "Dòng log cuối",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.lastLine ?? "—"}
          </span>
        ),
        size: 320,
        enableSorting: false,
      },
    ],
    []
  )
  return (
    <InsightGrid
      title="Máy móc (launchd)"
      description="5 agent tự chạy — log lần cuối + probe dịch vụ KeepAlive"
      data={jobs}
      columns={columns}
      getRowId={(r) => r.id}
      pageSize={10}
    />
  )
}
