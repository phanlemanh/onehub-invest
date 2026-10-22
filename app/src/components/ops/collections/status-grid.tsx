"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (data-grid-view.tsx) — cùng khuôn với lưới job
// của solution-dev-ops-1: Frame, dải đầu, dải tab theo trạng thái có đếm, lưới, phân trang.
// Khác bản gốc: không chọn hàng, không sheet chi tiết, không bộ lọc nâng cao (chỉ đọc).
import { useMemo, useState, type ReactNode } from "react"
import { useTable, type PaginationState, type SortingState } from "@tanstack/react-table"

import { DATA_GRID_VI, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { SectionHeader } from "./section"

export type StatusTab<T> = { value: string; label: string; tone?: string; match: (row: T) => boolean }

export function StatusGrid<T extends object>({
  id,
  title,
  description,
  data,
  columns,
  tabs,
  getRowId,
  initialSort,
  footnote,
  actions,
  pageSize = 10,
}: {
  /** Neo để thẻ số ở đầu trang liên kết tới. */
  id: string
  title: string
  description: ReactNode
  data: T[]
  columns: InsightColumn<T>[]
  tabs: StatusTab<T>[]
  getRowId: (row: T) => string
  initialSort?: SortingState
  footnote?: ReactNode
  /** Nút bên phải dải đầu (vd Thêm nhóm). */
  actions?: ReactNode
  pageSize?: number
}) {
  const allTabs = useMemo<StatusTab<T>[]>(() => [{ value: "all", label: "Tất cả", match: () => true }, ...tabs], [tabs])
  const [tab, setTab] = useState("all")
  const [sorting, setSorting] = useState<SortingState>(initialSort ?? [])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const current = allTabs.find((t) => t.value === tab) ?? allTabs[0]
  const visible = useMemo(() => data.filter(current.match), [data, current])

  const table = useTable({
    features: dataGridFeatures,
    data: visible,
    columns,
    getRowId,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  return (
    <DataGrid table={table} recordCount={visible.length} i18n={DATA_GRID_VI}>
      <Frame id={id} spacing="default" className="w-full min-w-0 scroll-mt-4">
        <SectionHeader title={title} description={description}>
          {actions}
        </SectionHeader>
        <FramePanel className="p-0">
          <div className="flex border-b md:h-12 md:items-stretch">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(String(value))
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="flex h-11 min-w-0 items-stretch md:h-auto"
            >
              <TabsList
                variant="line"
                className="no-scrollbar scroll-fade-x h-full! max-w-full translate-y-px justify-start gap-5 overflow-x-auto bg-transparent px-(--frame-panel-header-px) py-0!"
              >
                {allTabs.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="h-full! flex-none gap-1.5 px-1 text-sm after:-bottom-px!">
                    {t.tone ? <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", t.tone)} /> : null}
                    {t.label}
                    <Badge variant="outline" radius="full" className="tabular-nums">
                      {data.filter(t.match).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
        {visible.length > pagination.pageSize || footnote ? (
          <FrameFooter className="flex flex-col items-stretch gap-2">
            {visible.length > pagination.pageSize ? <DataGridPagination sizes={[10, 25, 50]} /> : null}
            {footnote ? <p className="text-muted-foreground text-xs">{footnote}</p> : null}
          </FrameFooter>
        ) : null}
      </Frame>
    </DataGrid>
  )
}
