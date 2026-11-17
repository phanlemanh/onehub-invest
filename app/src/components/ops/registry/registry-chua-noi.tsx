"use client"

import { useMemo, useState } from "react"
import { useTable, type ColumnDef, type PaginationState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MaChuaNoi } from "@/lib/ops/registry/doc"

/** Lý do chưa nối của bảng nối (mã máy) → chữ cho người vận hành. Mã lạ hiện nguyên văn. */
const LY_DO: Record<string, string> = {
  "khong-ten": "Nguồn không có tên dự án",
  "khong-xa": "Chưa rõ xã/phường",
  "ngoai-lat": "Ngoài lát đang nối",
}

const COLUMNS: ColumnDef<DataGridFeatures, MaChuaNoi>[] = [
  { id: "ma", header: "Mã tại nguồn", cell: ({ row }) => <span className="font-mono text-xs" translate="no">{row.original.ma}</span>, size: 140 },
  { id: "ten", header: "Tên dự án ở nguồn", cell: ({ row }) => <span className="text-sm">{row.original.ten ?? "—"}</span>, size: 320, meta: { autoSize: true } },
  {
    id: "lyDo",
    header: "Vì sao chưa nối",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.lyDo ? (LY_DO[row.original.lyDo] ?? row.original.lyDo) : "Chưa qua bước nối"}
      </span>
    ),
    size: 220,
  },
]

/** Mã dự án nguồn đã nạp mà chưa nối nút danh bạ, theo nguồn (tab có đếm). */
export function RegistryChuaNoi({ rows }: { rows: MaChuaNoi[] }) {
  const nguon = useMemo(() => [...new Set(rows.map((r) => r.source))], [rows])
  const [tab, setTab] = useState(nguon[0] ?? "")
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const data = useMemo(() => rows.filter((r) => r.source === tab), [rows, tab])
  const table = useTable({
    features: dataGridFeatures,
    columns: COLUMNS,
    data,
    getRowId: (r) => `${r.source}:${r.ma}`,
    state: { pagination },
    onPaginationChange: setPagination,
  })
  return (
    <DataGrid table={table} recordCount={data.length} i18n={DATA_GRID_VI} tableLayout={{ dense: true }} emptyMessage="Mọi mã dự án đã nạp đều đã nối.">
      <Frame variant="default" spacing="sm" className="w-full min-w-0" data-registry-chua-noi="">
        <FrameHeader className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle role="heading" aria-level={2}>Mã dự án nguồn chưa nối</FrameTitle>
            <FrameDescription>Dự án nguồn đã nạp về máy thu nhưng chưa trỏ vào nút nào của danh bạ.</FrameDescription>
          </div>
          {nguon.length > 0 && (
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(String(v))
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
            >
              <TabsList variant="line" className="no-scrollbar max-w-full justify-start gap-5 overflow-x-auto">
                {nguon.map((s) => (
                  <TabsTrigger key={s} value={s} className="flex-none gap-1.5 px-1 text-sm" translate="no">
                    {s}
                    <Badge variant="outline" radius="full" className="tabular-nums">{rows.filter((r) => r.source === s).length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </FrameHeader>
        <FramePanel className="p-0! shadow-none!">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        {data.length > 0 && (
          <FrameFooter>
            <DataGridPagination />
          </FrameFooter>
        )}
      </Frame>
    </DataGrid>
  )
}
