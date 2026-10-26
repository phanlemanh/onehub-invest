"use client"

import { useMemo, useState } from "react"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fmtInt, fmtPct, fmtVnDateTime } from "@/lib/format"

import type { Health, QualityRow } from "./quality-rows"

/**
 * «Chất lượng từng chặng» — chuyển thể stage-breakdown-grid của @reui/solution-analytics-3: mỗi hàng một nguồn (hoặc
 * một nhóm thu), mỗi cột một chặng với số và tỉ lệ, cột Risk thành «Nút thắt». Bỏ cột chủ sở hữu (avatar) và nút
 * xuất; chọn phân đoạn giữ Select của block.
 */

type Segment = "source" | "group"
const SEGMENTS = [
  { value: "source", label: "Theo nguồn" },
  { value: "group", label: "Theo nhóm thu" },
]

const TONE: Record<Health["tone"], "success-light" | "warning-light" | "destructive-light"> = {
  success: "success-light",
  warning: "warning-light",
  destructive: "destructive-light",
}

function StageCell({ value, of, suffix }: { value: number | null; of: number; suffix?: string }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-foreground text-sm font-medium tabular-nums">{fmtInt(value)}</span>
      <span className="text-muted-foreground text-xs tabular-nums">{suffix ?? (of > 0 ? fmtPct(value / of, 0) : "—")}</span>
    </div>
  )
}

const columns: ColumnDef<DataGridFeatures, QualityRow>[] = [
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => <DataGridColumnHeader title="Nguồn / nhóm" column={column} />,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground truncate text-sm font-medium">{row.original.name}</span>
        <span className="text-muted-foreground truncate text-xs">{row.original.meta}</span>
      </div>
    ),
    enableSorting: true,
    minSize: 240,
    meta: { autoSize: true, headerClassName: "ps-5", cellClassName: "ps-5" },
  },
  {
    accessorFn: (r) => r.health.label,
    id: "health",
    header: ({ column }) => <DataGridColumnHeader title="Nút thắt" column={column} />,
    cell: ({ row }) => <Badge variant={TONE[row.original.health.tone]}>{row.original.health.label}</Badge>,
    size: 140,
    enableSorting: true,
  },
  {
    accessorKey: "received",
    id: "received",
    header: ({ column }) => <DataGridColumnHeader title="Bài nhận" column={column} />,
    cell: ({ row }) => <StageCell value={row.original.received} of={0} suffix="100%" />,
    size: 110,
    enableSorting: true,
  },
  {
    accessorKey: "readable",
    id: "readable",
    header: ({ column }) => <DataGridColumnHeader title="Đọc được" column={column} />,
    cell: ({ row }) => <StageCell value={row.original.readable} of={row.original.received} />,
    size: 110,
    enableSorting: true,
  },
  {
    accessorKey: "offers",
    id: "offers",
    header: ({ column }) => <DataGridColumnHeader title="Tin rao" column={column} />,
    cell: ({ row }) => (
      <StageCell
        value={row.original.offers}
        of={0}
        suffix={row.original.offers > 0 ? `${(row.original.readable / row.original.offers).toFixed(1)} bài/tin` : "—"}
      />
    ),
    size: 110,
    enableSorting: true,
    meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" },
  },
  {
    accessorFn: (r) => r.complete ?? -1,
    id: "complete",
    header: ({ column }) => <DataGridColumnHeader title="Đủ trường lõi" column={column} />,
    cell: ({ row }) => <StageCell value={row.original.complete} of={row.original.offers} />,
    size: 130,
    enableSorting: true,
    meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" },
  },
  {
    accessorFn: (r) => r.withWard ?? -1,
    id: "withWard",
    header: ({ column }) => <DataGridColumnHeader title="Có phường" column={column} />,
    cell: ({ row }) => <StageCell value={row.original.withWard} of={row.original.offers} />,
    size: 110,
    enableSorting: true,
    meta: { headerClassName: "hidden lg:table-cell", cellClassName: "hidden lg:table-cell" },
  },
  {
    accessorFn: (r) => r.linked ?? -1,
    id: "linked",
    header: ({ column }) => <DataGridColumnHeader title="Gắn căn" column={column} />,
    cell: ({ row }) => <StageCell value={row.original.linked} of={row.original.offers} />,
    size: 110,
    enableSorting: true,
    meta: { headerClassName: "hidden lg:table-cell", cellClassName: "hidden lg:table-cell" },
  },
  {
    accessorFn: (r) => r.latestAt ?? "",
    id: "latestAt",
    header: ({ column }) => <DataGridColumnHeader title="Bài mới nhất" column={column} />,
    cell: ({ row }) => <span className="text-muted-foreground text-sm tabular-nums">{fmtVnDateTime(row.original.latestAt)}</span>,
    size: 190,
    enableSorting: true,
    meta: { headerClassName: "hidden xl:table-cell", cellClassName: "hidden xl:table-cell" },
  },
]

export function QualityGrid({ bySource, byGroup }: { bySource: QualityRow[]; byGroup: QualityRow[] }) {
  const [segment, setSegment] = useState<Segment>("source")
  const [sorting, setSorting] = useState<SortingState>([{ id: "received", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const data = useMemo(() => (segment === "source" ? bySource : byGroup), [segment, bySource, byGroup])
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <DataGrid
      table={table}
      recordCount={data.length}
      emptyMessage="Chưa có nguồn nào có bài trong khoảng này."
      i18n={DATA_GRID_VI}
      tableLayout={{ columnsResizable: true, headerSticky: false, dense: true }}
    >
      <Frame variant="default" spacing="sm" className="w-full">
        <FrameHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle>Chất lượng từng chặng</FrameTitle>
            <FrameDescription className="text-xs text-pretty">
              Nút thắt là chặng yếu nhất của hàng: đọc được, đủ trường lõi (bậc B1), có phường hoặc gắn căn
            </FrameDescription>
          </div>
          <Select
            value={segment}
            onValueChange={(value) => {
              if (value) {
                setSegment(value as Segment)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }
            }}
            items={SEGMENTS}
          >
            <SelectTrigger size="sm" className="min-w-0 flex-1 sm:min-w-40 sm:flex-none" aria-label="Phân đoạn">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="w-52" align="end">
              {SEGMENTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
