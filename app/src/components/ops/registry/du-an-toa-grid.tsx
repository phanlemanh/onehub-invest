"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTable, type ColumnDef, type ExpandedState, type PaginationState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable, DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmtInt } from "@/lib/format"

import { BacBadge, NguonBadges } from "./registry-badges"

/** Hàng bảng toà của một dự án: toà mang căn ở `subRows` (bấm mở). Căn chỉ có tầng, trục, mã tại nguồn. */
export type HangToa = {
  key: string
  laCan: boolean
  ten: string
  phu: string
  bac: string
  nguon: string[]
  soTruc: number | null
  soCan: number | null
  subRows?: HangToa[]
}

type Tab = "all" | "chua-can"

const COLUMNS: ColumnDef<DataGridFeatures, HangToa>[] = [
  {
    id: "ten",
    header: "Toà · căn",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-start gap-1">
        <DataGridTableRowExpand row={row} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={row.original.laCan ? "font-mono text-xs" : "text-sm font-medium"} translate="no">{row.original.ten}</span>
          {row.original.phu && <span className="text-muted-foreground truncate text-xs">{row.original.phu}</span>}
        </div>
      </div>
    ),
    size: 300,
    meta: { autoSize: true },
  },
  { id: "bac", header: "Bậc", cell: ({ row }) => <BacBadge bac={row.original.bac} />, size: 120 },
  { id: "nguon", header: "Nguồn", cell: ({ row }) => <NguonBadges nguon={row.original.nguon} />, size: 110, meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" } },
  {
    id: "truc",
    header: "Trục",
    cell: ({ row }) => (row.original.soTruc == null ? null : <span className="text-sm tabular-nums">{fmtInt(row.original.soTruc)}</span>),
    size: 80,
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
  {
    id: "can",
    header: "Căn",
    cell: ({ row }) =>
      row.original.soCan == null ? null : row.original.soCan === 0 ? (
        <Badge variant="warning-light">Chưa có căn</Badge>
      ) : (
        <span className="text-sm tabular-nums">{fmtInt(row.original.soCan)}</span>
      ),
    size: 110,
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
]

export function DuAnToaGrid({ rows }: { rows: HangToa[] }) {
  const [tab, setTab] = useState<Tab>("all")
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const chuaCan = useMemo(() => rows.filter((r) => r.soCan === 0), [rows])
  const data = tab === "all" ? rows : chuaCan
  const table = useTable({
    features: dataGridFeatures,
    columns: COLUMNS,
    data,
    getRowId: (r) => r.key,
    getSubRows: (r) => r.subRows,
    getRowCanExpand: (row) => Boolean(row.original.subRows?.length),
    state: { expanded, pagination },
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    paginateExpandedRows: false,
  })
  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      i18n={DATA_GRID_VI}
      tableLayout={{ dense: true, headerSticky: true }}
      emptyMessage={
        tab === "chua-can" ? (
          <span>Mọi toà của dự án đều đã có căn.</span>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4" data-registry-empty="toa">
            <span>Dự án chưa có toà nào trong danh bạ.</span>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/ops/registry" />}>Về danh bạ</Button>
          </div>
        )
      }
    >
      <Frame variant="default" spacing="sm" className="w-full min-w-0">
        <FrameHeader className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle role="heading" aria-level={2}>Toà và căn</FrameTitle>
            <FrameDescription>Mở một toà để xem căn theo tầng và trục. Mã căn là mã tại nguồn.</FrameDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setPagination((p) => ({ ...p, pageIndex: 0 })) }}>
            <TabsList variant="line" className="no-scrollbar max-w-full justify-start gap-5 overflow-x-auto">
              <TabsTrigger value="all" className="flex-none gap-1.5 px-1 text-sm">
                Mọi toà <Badge variant="outline" radius="full" className="tabular-nums">{rows.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="chua-can" className="flex-none gap-1.5 px-1 text-sm">
                Chưa có căn <Badge variant="outline" radius="full" className="tabular-nums">{chuaCan.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </FrameHeader>
        <FramePanel className="p-0! shadow-none!">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        <FrameFooter>
          <DataGridPagination />
        </FrameFooter>
      </Frame>
    </DataGrid>
  )
}
