"use client"

// chuyển thể từ @reui/solution-dev-ops-5 (data-grid-view.tsx, columns.tsx): lưới "mục
// tiêu" có dải tab theo trạng thái + ô tìm, Frame dày, phân trang ở chân. Mỗi hàng là
// một cặp nguồn × thị trường với SLO độ tươi. Khác bản gốc: bỏ chọn hàng / thao tác
// hàng loạt, sheet chi tiết, tắt cảnh báo, bộ lọc nâng cao (không có thao tác ghi).
import { useMemo, useState, type ReactNode } from "react"
import { useTable, type PaginationState, type SortingState } from "@tanstack/react-table"
import { ListChecksIcon, SearchIcon } from "lucide-react"

import { DATA_GRID_VI, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { FrameFooter, FramePanel } from "@/components/reui/frame"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmtInt, fmtVnDate } from "@/lib/format"
import { fmtAge, fmtOverdue } from "@/lib/freshness"
import type { CoverageRow } from "@/lib/ops-queries"
import { sourceTierLabel } from "@/lib/source-labels"
import { cn } from "@/lib/utils"

import { DotSeparator, SectionFrame, SectionHead } from "./section-lead"
import { FRESHNESS, type Freshness } from "./status"

type Tab = "all" | Freshness
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "stale", label: FRESHNESS.stale.label },
  { value: "none", label: FRESHNESS.none.label },
  { value: "fresh", label: FRESHNESS.fresh.label },
]
const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }

function GridStrip({ tab, counts, onTabChange, children }: { tab: Tab; counts: Record<Tab, number>; onTabChange: (t: Tab) => void; children: ReactNode }) {
  return (
    <div className="flex flex-col border-b md:h-12 md:flex-row md:items-stretch md:justify-between md:gap-4">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = TABS.find((t) => t.value === value)
          if (next) onTabChange(next.value)
        }}
        className="flex h-11 min-w-0 items-stretch max-md:border-b md:h-auto"
      >
        <TabsList
          variant="line"
          className="no-scrollbar scroll-fade-x h-full! max-w-full translate-y-px justify-start gap-5 overflow-x-auto bg-transparent px-(--frame-panel-header-px) py-0!"
        >
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="h-full! flex-none gap-1.5 px-1 text-sm after:-bottom-px!">
              {t.value !== "all" ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", FRESHNESS[t.value].tick)} /> : null}
              {t.label}
              <Badge variant="outline" radius="full" className="tabular-nums">
                {counts[t.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  )
}

/** `stale`: hàng là lần đo cuối của bản tin máy local cũ quá 45′ (ON3) — không badge trạng thái xanh. */
export function ObjectivesGrid({ rows, stale = false }: { rows: CoverageRow[]; stale?: boolean }) {
  const [tab, setTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([{ id: "age", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const counts = useMemo(
    () => ({ all: rows.length, stale: 0, none: 0, fresh: 0, ...Object.fromEntries((["stale", "none", "fresh"] as const).map((s) => [s, rows.filter((r) => r.status === s).length])) }) as Record<Tab, number>,
    [rows]
  )
  const needle = search.trim().toLowerCase()
  const visible = useMemo(
    () => rows.filter((r) => (tab === "all" || r.status === tab) && (!needle || `${r.code} ${r.city ?? ""} ${sourceTierLabel(r.code).vi}`.toLowerCase().includes(needle))),
    [rows, tab, needle]
  )

  const columns = useMemo<InsightColumn<CoverageRow>[]>(
    () => [
      { id: "code", accessorKey: "code", header: ({ column }) => <DataGridColumnHeader title="Mã" column={column} />, cell: ({ row }) => <span className="font-mono">{row.original.code}</span>, size: 80, enableSorting: true },
      { id: "role", accessorFn: (r) => sourceTierLabel(r.code).vi, header: "Vai trò", size: 130 },
      { id: "city", accessorKey: "city", header: ({ column }) => <DataGridColumnHeader title="Thị trường" column={column} />, cell: ({ row }) => row.original.city ?? "—", size: 160, enableSorting: true },
      { id: "last", accessorFn: (r) => r.lastSnapshotAt ?? "", header: ({ column }) => <DataGridColumnHeader title="Snapshot cuối" column={column} />, cell: ({ row }) => fmtVnDate(row.original.lastSnapshotAt), size: 130, enableSorting: true },
      { id: "age", accessorFn: (r) => r.ageHours ?? Number.POSITIVE_INFINITY, header: ({ column }) => <DataGridColumnHeader title="Tuổi" column={column} />, cell: ({ row }) => [fmtAge(row.original.ageHours), fmtOverdue(row.original.ageHours, row.original.sloHours)].filter(Boolean).join(" · "), size: 120, meta: NUM, enableSorting: true },
      { id: "slo", accessorKey: "sloHours", header: "SLO", cell: ({ row }) => fmtAge(row.original.sloHours), size: 110, meta: NUM },
      { id: "status", accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <Badge variant={stale && row.original.status === "fresh" ? "outline" : FRESHNESS[row.original.status].variant}>{FRESHNESS[row.original.status].label}</Badge>, size: 120 },
    ],
    [stale]
  )

  const table = useTable({
    features: dataGridFeatures,
    data: visible,
    columns,
    getRowId: (r) => `${r.code}-${r.city}`,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  return (
    <DataGrid table={table} recordCount={visible.length} i18n={DATA_GRID_VI}>
      <SectionFrame className="w-full">
        <SectionHead
          icon={<ListChecksIcon aria-hidden="true" />}
          title="Độ tươi theo nguồn"
          description={
            <span role="status" className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
              <span>{visible.length === rows.length ? `${fmtInt(rows.length)} cặp nguồn × thị trường` : `${fmtInt(visible.length)} / ${fmtInt(rows.length)} cặp`}</span>
              <DotSeparator />
              <span>{fmtInt(counts.stale)} quá hạn</span>
            </span>
          }
        />
        <FramePanel className="p-0">
          <GridStrip
            tab={tab}
            counts={counts}
            onTabChange={(t) => {
              setTab(t)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          >
            <div className="flex items-center px-(--frame-panel-header-px) py-2 md:py-0">
              <InputGroup className="w-full md:w-56">
                <InputGroupAddon>
                  <SearchIcon aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPagination((p) => ({ ...p, pageIndex: 0 }))
                  }}
                  placeholder="Tìm mã hoặc thị trường"
                  aria-label="Tìm mã nguồn hoặc thị trường"
                />
              </InputGroup>
            </div>
          </GridStrip>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        {visible.length > pagination.pageSize ? (
          <FrameFooter>
            <DataGridPagination sizes={[25, 50, 100]} />
          </FrameFooter>
        ) : null}
      </SectionFrame>
    </DataGrid>
  )
}
