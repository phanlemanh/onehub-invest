"use client"

import { useMemo } from "react"
import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { fmtInt } from "@/lib/format"
import type { CloudFlowDay, FlowDay } from "@/lib/collections-queries"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }

export function FlowTable({ days, roles = {} }: { days: FlowDay[]; roles?: SourceRoles }) {
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
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S02", roles)} — thị trường`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.airdnaMarkets),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airdnaListings",
        accessorFn: (r) => r.airdnaListings,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S02", roles)} — listing (12 tháng qua)`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.airdnaListings),
        size: 160,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airbnbSeen",
        accessorFn: (r) => r.airbnbListingsSeen,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S01", roles)} — listing tươi`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.airbnbListingsSeen),
        size: 150,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airbnbSnapshots",
        accessorFn: (r) => r.airbnbSnapshots,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S01", roles)} — snapshot`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.airbnbSnapshots),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloPosts",
        accessorFn: (r) => r.zaloPosts,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — bài thô`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.zaloPosts),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloOffers",
        accessorFn: (r) => r.zaloOffers,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — tin rao (đã đọc)`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.zaloOffers),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
    ],
    [roles]
  )
  return (
    <InsightGrid
      title="Luồng 7 ngày qua"
      description="Số bản ghi theo nguồn, theo ngày (giờ VN); S03 tính theo ngày đăng bài"
      data={days}
      columns={columns}
      getRowId={(r) => r.day}
      pageSize={10}
    />
  )
}

/** Ô S03 trên máy chủ: khối vắng → «—» (không 0); bản tin cũ → số mờ (ADR-0014 «Cũ»). */
function cloudCount(n: number | null, stale: boolean) {
  if (n === null) return "—"
  return stale ? <span className="text-muted-foreground">{fmtInt(n)}</span> : fmtInt(n)
}

/**
 * «Luồng 7 ngày qua» trên máy chủ (ON5, ADR-0014): hai cột S03 từ khối `luong7` máy thu đẩy lên, listing tươi S01 từ bảng
 * đã đồng bộ, snapshot S01 là bảng thô chỉ ở máy thu (ghi «Chỉ ở máy thu»), không cột S02 (luật 5 — ON6 gỡ cả ở máy thu).
 */
export function CloudFlowTable({ days, stale, roles = {} }: { days: CloudFlowDay[]; stale: boolean; roles?: SourceRoles }) {
  const columns = useMemo<InsightColumn<CloudFlowDay>[]>(
    () => [
      {
        id: "day",
        accessorKey: "day",
        header: ({ column }) => <DataGridColumnHeader title="Ngày" column={column} />,
        size: 110,
        enableSorting: false,
      },
      {
        id: "airbnbSeen",
        accessorFn: (r) => r.airbnbListingsSeen,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S01", roles)} — listing tươi`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.airbnbListingsSeen),
        size: 190,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airbnbSnapshots",
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S01", roles)} — snapshot`} column={column} />,
        cell: () => <span className="text-muted-foreground">Chỉ ở máy thu</span>,
        size: 180,
        enableSorting: false,
        meta: NUM,
      },
      {
        id: "zaloPosts",
        accessorFn: (r) => r.zaloPosts ?? -1,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — bài thô`} column={column} />,
        cell: ({ row }) => cloudCount(row.original.zaloPosts, stale),
        size: 200,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloOffers",
        accessorFn: (r) => r.zaloOffers ?? -1,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — tin rao (đã đọc)`} column={column} />,
        cell: ({ row }) => cloudCount(row.original.zaloOffers, stale),
        size: 230,
        meta: NUM,
        enableSorting: true,
      },
    ],
    [roles, stale]
  )
  return (
    <InsightGrid
      title="Luồng 7 ngày qua"
      description="Số bản ghi theo nguồn, theo ngày (giờ VN); S03 tính theo ngày đăng bài, máy thu đếm sẵn"
      data={days}
      columns={columns}
      getRowId={(r) => r.day}
      pageSize={10}
    />
  )
}

function groupStatusBadge(lastSeenAt: string | null) {
  if (!lastSeenAt) return <Badge variant="outline">Chưa thấy tin</Badge>
  const hours = (Date.now() - new Date(lastSeenAt).getTime()) / 3600000
  if (hours <= 24) return <Badge variant="success-light">Hoạt động</Badge>
  if (hours <= 72) return <Badge variant="warning-light">Im {Math.floor(hours)}h</Badge>
  return <Badge variant="warning-light">Im {Math.floor(hours / 24)} ngày</Badge>
}

export function ZaloGroupsTable({
  rows,
  allowlist,
  roles = {},
}: {
  rows: import("@/lib/collections-queries").ZaloGroupRow[]
  allowlist: import("@/lib/collections-queries").ZaloAllowlistEntry[]
  roles?: SourceRoles
}) {
  const columns = useMemo<InsightColumn<import("@/lib/collections-queries").ZaloGroupRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader title="Nhóm" column={column} />,
        // Tên nhóm là tầng C (Mạnh chốt 24/10, sửa đổi ADR-0007) — không đánh data-tier-a.
        cell: ({ row }) => <span className="whitespace-normal break-words" translate="no">{row.original.name}</span>,
        size: 160,
        enableSorting: false,
      },
      {
        id: "status",
        accessorFn: (r) => r.lastSeenAt ?? "",
        header: "Trạng thái",
        cell: ({ row }) => groupStatusBadge(row.original.lastSeenAt),
        size: 150,
      },
      {
        id: "seen",
        accessorFn: (r) => r.seen,
        header: ({ column }) => <DataGridColumnHeader title="Thấy (nhật ký)" column={column} />,
        cell: ({ row }) => fmtInt(row.original.seen),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "passed",
        accessorFn: (r) => r.passed,
        header: ({ column }) => <DataGridColumnHeader title="Qua cổng" column={column} />,
        cell: ({ row }) => fmtInt(row.original.passed),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "accepted",
        accessorFn: (r) => r.accepted ?? -1,
        header: ({ column }) => <DataGridColumnHeader title="Vào bảng thô" column={column} />,
        // null = đã qua cổng mà không biết số tin vào (ON4) — «—», không 0.
        cell: ({ row }) => (row.original.accepted == null ? "—" : fmtInt(row.original.accepted)),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "owner",
        accessorFn: (r) => r.ownerAccount ?? "",
        header: "Tài khoản",
        cell: ({ row }) => row.original.ownerAccount ?? "—",
        size: 110,
        enableSorting: true,
      },
      {
        id: "real7",
        accessorFn: (r) => r.realPosts7d,
        header: ({ column }) => <DataGridColumnHeader title="Bài thật 7 ngày" column={column} />,
        cell: ({ row }) => fmtInt(row.original.realPosts7d),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "mock7",
        accessorFn: (r) => r.mockPosts7d,
        header: ({ column }) => <DataGridColumnHeader title="Bài thử" column={column} />,
        cell: ({ row }) => (row.original.mockPosts7d ? fmtInt(row.original.mockPosts7d) : "—"),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
    ],
    []
  )
  const enabled = allowlist.filter((a) => a.enabled)
  // Khoá hàng theo vị trí, không theo tên nhóm: tên là tầng A, khoá hàng lọt vào thuộc tính DOM (data-row-id).
  const rowKey = new Map(rows.map((r, i) => [r, `nhom-${i}`]))
  return (
    <InsightGrid
      title={`Nhóm ${sourceLabel("S03", roles)}`}
      description={`Danh mục nguồn cộng đồng — bài thật tách bài thử; danh sách cho phép đang bật ${enabled.length} nhóm`}
      data={rows}
      columns={columns}
      getRowId={(r) => rowKey.get(r) ?? ""}
      pageSize={10}
      footnote={
        <>
          Qua cổng = cổng Kev ≥ 0,9 (đọc nhật ký cổng). Danh sách cho phép (mã nhóm, chưa ghép tên):{" "}
          {enabled.map((a) => a.groupId.replace("group:", "…").slice(-6)).join(", ") || "—"}. Nhóm im quá 72h: kiểm tra bị mời ra hoặc đổi tên;
          nhóm thử chỉ để so sánh. Thêm tài khoản, bật/tắt nhóm:{" "}
          <Link prefetch={false} href="/ops/sources" className="font-medium underline">
            Nguồn dữ liệu
          </Link>{" "}
          (quyền quản trị, 1 nhóm – 1 tài khoản).
        </>
      }
    />
  )
}
