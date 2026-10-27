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
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — bài nhận`} column={column} />,
        cell: ({ row }) => fmtInt(row.original.zaloPosts),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloOffers",
        accessorFn: (r) => r.zaloOffers,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — tin rao mới`} column={column} />,
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
      description="Số bản ghi theo nguồn, theo ngày (giờ VN); S03 tính theo ngày đăng bài; tin rao mới có sau lượt đọc đêm nên hôm nay chưa đủ"
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
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — bài nhận`} column={column} />,
        cell: ({ row }) => cloudCount(row.original.zaloPosts, stale),
        size: 200,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "zaloOffers",
        accessorFn: (r) => r.zaloOffers ?? -1,
        header: ({ column }) => <DataGridColumnHeader title={`${sourceLabel("S03", roles)} — tin rao mới`} column={column} />,
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
      description="Số bản ghi theo nguồn, theo ngày (giờ VN); S03 tính theo ngày đăng bài, máy thu đếm sẵn; tin rao mới có sau lượt đọc đêm nên hôm nay chưa đủ"
      data={days}
      columns={columns}
      getRowId={(r) => r.day}
      pageSize={10}
    />
  )
}

function groupStatusBadge(lastSeenAt: string | null, stale = false) {
  if (!lastSeenAt) return <Badge variant="outline">Chưa thấy tin</Badge>
  const hours = (Date.now() - new Date(lastSeenAt).getTime()) / 3600000
  // Số cũ trên máy chủ (ADR-0014): không badge trạng thái xanh.
  if (hours <= 24) return <Badge variant={stale ? "outline" : "success-light"}>Hoạt động</Badge>
  if (hours <= 72) return <Badge variant="warning-light">Im {Math.floor(hours)}h</Badge>
  return <Badge variant="warning-light">Im {Math.floor(hours / 24)} ngày</Badge>
}

export function ZaloGroupsTable({
  rows,
  allowlist,
  roles = {},
  cloud,
}: {
  rows: import("@/lib/collections-queries").ZaloGroupRow[]
  /** null = cấu hình OpenClaw không đọc được (ON4) — mô tả ghi «—», không «0 nhóm». */
  allowlist: import("@/lib/collections-queries").ZaloAllowlistEntry[] | null
  roles?: SourceRoles
  /** Máy chủ (ON4): N nhóm bật và cờ cũ của khối `s03`; không có mã nhóm (Hỏi-1 = A). Vắng = máy thu, đo trực tiếp. */
  cloud?: { allowlistEnabled: number; stale: boolean }
}) {
  const stale = cloud?.stale ?? false
  const columns = useMemo<InsightColumn<import("@/lib/collections-queries").ZaloGroupRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader title="Nhóm" column={column} />,
        // Tên nhóm là tầng C (Mạnh chốt 24/10, sửa đổi ADR-0007) — không đánh data-tier-a.
        cell: ({ row }) =>
          row.original.name ? (
            <span className="whitespace-normal break-words" translate="no">{row.original.name}</span>
          ) : (
            // Bên ghi bỏ tên khi handler chỉ ghi được mã nhóm (ON4) — mã không lên máy chủ.
            <span className="text-muted-foreground">Nhóm chưa có tên</span>
          ),
        size: 160,
        enableSorting: false,
      },
      {
        id: "status",
        accessorFn: (r) => r.lastSeenAt ?? "",
        header: "Trạng thái",
        cell: ({ row }) => groupStatusBadge(row.original.lastSeenAt, stale),
        size: 150,
      },
      {
        id: "seen",
        accessorFn: (r) => r.seen ?? -1,
        header: ({ column }) => <DataGridColumnHeader title="Thấy (nhật ký)" column={column} />,
        cell: ({ row }) => cloudCount(row.original.seen, stale),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "passed",
        accessorFn: (r) => r.passed ?? -1,
        header: ({ column }) => <DataGridColumnHeader title="Qua cổng" column={column} />,
        cell: ({ row }) => cloudCount(row.original.passed, stale),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "accepted",
        accessorFn: (r) => r.accepted ?? -1,
        header: ({ column }) => <DataGridColumnHeader title="Vào bảng thô" column={column} />,
        // null = đã qua cổng mà không biết số tin vào, hay nhật ký không đọc được (ON4) — «—», không 0.
        cell: ({ row }) => cloudCount(row.original.accepted, stale),
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
        cell: ({ row }) => cloudCount(row.original.realPosts7d, stale),
        size: 140,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "mock7",
        accessorFn: (r) => r.mockPosts7d,
        header: ({ column }) => <DataGridColumnHeader title="Bài thử" column={column} />,
        cell: ({ row }) => (row.original.mockPosts7d ? cloudCount(row.original.mockPosts7d, stale) : "—"),
        size: 100,
        meta: NUM,
        enableSorting: true,
      },
    ],
    [stale]
  )
  const enabled = allowlist?.filter((a) => a.enabled) ?? null
  // Số cũ trên máy chủ (ADR-0014): mọi ô số mờ, badge không xanh; không đọc được → «—».
  const nEnabled = cloud ? cloud.allowlistEnabled : enabled?.length ?? null
  // Khoá hàng theo vị trí, không theo tên nhóm: tên là tầng A, khoá hàng lọt vào thuộc tính DOM (data-row-id).
  const rowKey = new Map(rows.map((r, i) => [r, `nhom-${i}`]))
  return (
    <InsightGrid
      title={`Nhóm ${sourceLabel("S03", roles)}`}
      description={`Danh mục nguồn cộng đồng — bài thật tách bài thử; ${nEnabled === null ? "danh sách cho phép: — (chưa đọc được cấu hình ở máy thu)" : `danh sách cho phép đang bật ${nEnabled} nhóm`}`}
      data={rows}
      columns={columns}
      getRowId={(r) => rowKey.get(r) ?? ""}
      pageSize={10}
      footnote={
        <>
          Qua cổng = cổng Kev ≥ 0,9 (đọc nhật ký cổng).{" "}
          {cloud ? (
            <>Danh sách cho phép: mã nhóm chỉ xem ở máy thu.</>
          ) : (
            <>
              Danh sách cho phép (mã nhóm, chưa ghép tên):{" "}
              {enabled?.map((a) => a.groupId.replace("group:", "…").slice(-6)).join(", ") || "—"}.
            </>
          )}{" "}
          Nhóm im quá 72h: kiểm tra bị mời ra hoặc đổi tên;
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
