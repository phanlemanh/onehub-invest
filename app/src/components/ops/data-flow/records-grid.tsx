"use client"

import { useMemo, useState } from "react"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { FILTER_LABELS_VI, FILTER_OPERATORS_VI } from "@/components/listing/listings-filter-bar"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import type { FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import type { FlowRecord } from "@/lib/data-flow-queries"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import type { SourceRoles } from "@/lib/source-labels"
import { LABELS_VI } from "@/lib/vocab.generated"

import { RecordSheet, recordTitle } from "./record-sheet"
import { compileRecordFilter, levelOf, recordFilterFields } from "./records-filter"

/**
 * «Tin mới nhất» — cùng khuôn lưới của @reui/solution-analytics-3 (Frame + data-grid + phân trang) với thanh chip
 * @reui/filters ở đầu khung; bấm một hàng mở hồ sơ tin. Hiện tối đa 150 tin mới nhất mỗi nguồn trong khoảng đang chọn.
 */

const columnsOf = (onOpen: (r: FlowRecord) => void): ColumnDef<DataGridFeatures, FlowRecord>[] => [
  {
    id: "title",
    accessorFn: (r) => recordTitle(r),
    header: ({ column }) => <DataGridColumnHeader title="Tin" column={column} />,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <Button
          variant="link"
          size="xs"
          className="max-w-full justify-start"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(row.original)
          }}
        >
          <span className="truncate">{recordTitle(row.original)}</span>
        </Button>
        <span className="text-muted-foreground truncate ps-2 text-xs">
          {LABELS_VI.property_type[row.original.propertyType as keyof typeof LABELS_VI.property_type] ?? row.original.propertyType}
          {" · "}
          {row.original.ward ?? "chưa gắn phường"}
        </span>
      </div>
    ),
    enableSorting: false,
    minSize: 260,
    meta: { autoSize: true, headerClassName: "ps-5", cellClassName: "ps-5" },
  },
  {
    accessorKey: "source",
    id: "source",
    header: ({ column }) => <DataGridColumnHeader title="Nguồn" column={column} />,
    cell: ({ row }) => <span className="text-sm">{row.original.source}</span>,
    size: 90,
    enableSorting: true,
  },
  {
    id: "market",
    accessorFn: (r) => r.market ?? "",
    header: ({ column }) => <DataGridColumnHeader title="Thị trường" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.market?.replace(/^(Thành phố|Tỉnh) /, "") ?? "—"}</span>,
    size: 140,
    enableSorting: true,
    meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" },
  },
  {
    id: "level",
    accessorFn: (r) => levelOf(r),
    header: ({ column }) => <DataGridColumnHeader title="Bậc" column={column} />,
    cell: ({ row }) => (
      <Badge variant={row.original.linked ? "success-light" : "info-light"}>
        {levelOf(row.original)} · {LABELS_VI.data_level[levelOf(row.original)]}
      </Badge>
    ),
    size: 140,
    enableSorting: true,
  },
  {
    accessorKey: "nPosts",
    id: "nPosts",
    header: ({ column }) => <DataGridColumnHeader title="Bài gộp" column={column} />,
    cell: ({ row }) => <span className="text-sm tabular-nums">{fmtInt(row.original.nPosts)}</span>,
    size: 100,
    enableSorting: true,
    meta: { headerClassName: "hidden lg:table-cell text-end", cellClassName: "hidden lg:table-cell text-end" },
  },
  {
    accessorKey: "firstSeen",
    id: "firstSeen",
    header: ({ column }) => <DataGridColumnHeader title="Đăng lần đầu" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground text-sm tabular-nums">{fmtVnDateTime(row.original.firstSeen)}</span>,
    size: 190,
    enableSorting: true,
    meta: { headerClassName: "hidden xl:table-cell", cellClassName: "hidden xl:table-cell" },
  },
]

export function RecordsGrid({ records, roles }: { records: FlowRecord[]; roles: SourceRoles }) {
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery())
  const [open, setOpen] = useState<FlowRecord | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "firstSeen", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const fields = useMemo(() => recordFilterFields(records, roles), [records, roles])
  const data = useMemo(() => records.filter(compileRecordFilter(query)), [records, query])
  const columns = useMemo(() => columnsOf(setOpen), [])
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data.length}
        emptyMessage="Không có tin nào khớp bộ lọc."
        i18n={DATA_GRID_VI}
        onRowClick={setOpen}
        tableLayout={{ columnsResizable: true, headerSticky: false, dense: true }}
      >
        <Frame variant="default" spacing="sm" className="w-full">
          <FrameHeader className="flex flex-col items-start gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <FrameTitle>Tin mới nhất</FrameTitle>
              <FrameDescription className="text-xs text-pretty">
                {fmtInt(data.length)} / {fmtInt(records.length)} tin · tối đa 150 tin mới nhất mỗi nguồn · bấm một tin để xem hồ sơ
              </FrameDescription>
            </div>
            <Filters
              fields={fields}
              query={query}
              onQueryChange={(q) => {
                setQuery(q)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              labels={FILTER_LABELS_VI}
              operatorLabels={FILTER_OPERATORS_VI}
              showClear
            />
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
      <RecordSheet record={open} roles={roles} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  )
}
