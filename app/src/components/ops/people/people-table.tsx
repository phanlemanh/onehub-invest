"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useTable, type ColumnDef } from "@tanstack/react-table"

import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Button } from "@/components/ui/button"
import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { fmtInt } from "@/lib/format"

import { MoiGioiBadge } from "./people-badges"
import { AN_VOI_VIEWER, type HangNguoi } from "./people-text"

/** Ô bí danh: null khi vai không được xem (che), «—» khi người không có bí danh loại ấy. */
function BiDanh({ an, value }: { an: boolean; value: string | null }) {
  if (an) return <span className="text-muted-foreground text-xs">{AN_VOI_VIEWER}</span>
  return <span className="text-sm wrap-anywhere">{value ?? "—"}</span>
}

/** Bảng một trang của /ops/people (khuôn data-grid của /ops/review): máy chủ đã chia trang 100 người. */
export function PeopleTable({ rows }: { rows: HangNguoi[] }) {
  const columns = useMemo<ColumnDef<DataGridFeatures, HangNguoi>[]>(
    () => [
      {
        id: "nguoi",
        header: "Người",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <BiDanh an={row.original.an} value={row.original.ten} />
            {!row.original.an && row.original.tel && (
              <Button
                variant="link"
                size="xs"
                className="justify-start px-0 tabular-nums"
                nativeButton={false}
                render={<a href={row.original.tel} />}
              >
                <span translate="no">{row.original.sdt}</span>
              </Button>
            )}
            {!row.original.an && !row.original.tel && row.original.sdt && (
              <span className="text-muted-foreground font-mono text-xs">{row.original.sdt}</span>
            )}
            <Button
              variant="link"
              size="xs"
              className="max-w-full justify-start px-0"
              nativeButton={false}
              render={<Link href={`/ops/people/${row.original.partyKey}`} />}
            >
              <span className="truncate font-mono" translate="no">{row.original.partyKey}</span>
            </Button>
          </div>
        ),
        size: 300,
        meta: { autoSize: true },
      },
      {
        id: "source",
        accessorKey: "source",
        header: "Nguồn",
        cell: ({ row }) => <span className="text-sm" translate="no">{row.original.source}</span>,
        size: 80,
      },
      {
        id: "soTin",
        accessorKey: "soTin",
        header: "Số tin",
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm tabular-nums">{fmtInt(row.original.soTin)}</span>
            {row.original.moiGioi && <MoiGioiBadge />}
          </div>
        ),
        size: 180,
      },
      {
        id: "taiKhoan",
        header: "Tài khoản",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <BiDanh an={row.original.an} value={row.original.taiKhoan} />
          </div>
        ),
        size: 220,
      },
      {
        id: "soBiDanh",
        accessorKey: "soBiDanh",
        header: "Bí danh",
        cell: ({ row }) => <span className="text-sm tabular-nums">{fmtInt(row.original.soBiDanh)}</span>,
        size: 90,
      },
    ],
    [],
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (r) => r.partyKey,
    // Máy chủ đã chia trang; bảng vẽ đủ hàng được gửi, không cắt ở 10 hàng mặc định.
    state: { pagination: { pageIndex: 0, pageSize: Math.max(rows.length, 1) } },
  })

  return (
    <DataGrid table={table} recordCount={rows.length} i18n={DATA_GRID_VI} tableLayout={{ dense: true, width: "auto" }}>
      <DataGridContainer>
        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  )
}
