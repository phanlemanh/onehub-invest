"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { InboxIcon } from "lucide-react"
import { useTable, type ColumnDef, type PaginationState } from "@tanstack/react-table"

import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import type { ReviewContext } from "@/lib/ops/review-context"
import type { ReviewMedia } from "@/lib/ops/review-media"
import {
  DEFAULT_STATUS_FILTER,
  DEFAULT_TYPE_FILTER,
  filterReviewItems,
  STATUS_FILTERS,
  TYPE_FILTERS,
  type ReviewItem,
  type StatusFilter,
  type TypeFilter,
} from "@/lib/ops/review-queue"

import { ReviewStatusBadge, ReviewTypeBadge } from "./review-badges"
import { ReviewDetailSheet } from "./review-detail-sheet"

const PAGE_SIZE = 20

/**
 * Hàng chờ /ops/review (UI1) — chuyển thể @reui/solution-agents-5 (approval-queue + request-detail-sheet):
 * Card → Frame theo họ khung của trang (routes.md); bỏ chọn hàng loạt, SLA, xuất (GD10 riêng, không duyệt hàng loạt).
 * Lọc theo loại thẻ + trạng thái phía client (hàng duyệt nhỏ); bấm hàng hoặc tên thẻ mở sheet chi tiết.
 * Không cột độ tự tin (Q9) — `ReviewItem` không mang số đó.
 */
export function ReviewQueue({ items, media, context = {} }: {
  items: ReviewItem[]
  media: Record<number, ReviewMedia>
  context?: Record<number, ReviewContext>
}) {
  const [type, setType] = useState<TypeFilter>(DEFAULT_TYPE_FILTER)
  const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS_FILTER)
  const [openId, setOpenId] = useState<number | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const rows = useMemo(() => filterReviewItems(items, type, status), [items, type, status])
  // Thẻ đang mở đọc từ `items` (không từ `rows`): quyết xong, router.refresh() đổi trạng thái → thẻ rời bộ lọc
  // «Chờ duyệt» nhưng sheet vẫn hiện kết quả cho tới khi người đóng.
  const open = openId === null ? null : (items.find((i) => i.id === openId) ?? null)

  const columns = useMemo<ColumnDef<DataGridFeatures, ReviewItem>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: "Thẻ",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <Button
              variant="link"
              size="xs"
              className="max-w-full justify-start"
              onClick={(e) => {
                e.stopPropagation()
                setOpenId(row.original.id)
              }}
            >
              <span className="truncate" translate="no">{row.original.title}</span>
            </Button>
            <div className="flex flex-wrap items-center gap-1.5 ps-2">
              <span className="text-muted-foreground text-xs tabular-nums">#{row.original.id}</span>
              {/* Màn hẹp: cột Loại/Trạng thái nằm ngoài khung nhìn (bảng cuộn ngang) — nhắc lại ngay dưới tên thẻ. */}
              <span className="flex items-center gap-1.5 sm:hidden">
                <ReviewTypeBadge type={row.original.item_type} />
                <ReviewStatusBadge status={row.original.status} />
              </span>
            </div>
          </div>
        ),
        size: 360,
        meta: { autoSize: true },
      },
      {
        id: "type",
        accessorKey: "item_type",
        header: "Loại",
        cell: ({ row }) => <ReviewTypeBadge type={row.original.item_type} />,
        size: 130,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <ReviewStatusBadge status={row.original.status} />,
        size: 120,
      },
      {
        id: "created",
        accessorKey: "created_at",
        header: "Tạo lúc",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs tabular-nums">{fmtVnDateTime(row.original.created_at)}</span>
        ),
        size: 170,
      },
    ],
    [],
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (r) => String(r.id),
    state: { pagination },
    onPaginationChange: setPagination,
  })

  const isDefault = type === DEFAULT_TYPE_FILTER && status === DEFAULT_STATUS_FILTER
  const reset = () => {
    setType(DEFAULT_TYPE_FILTER)
    setStatus(DEFAULT_STATUS_FILTER)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  if (items.length === 0) return <ReviewQueueEmpty />

  return (
    <Frame spacing="default" className="w-full min-w-0">
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <FrameTitle role="heading" aria-level={2}>Danh sách thẻ</FrameTitle>
          <FrameDescription data-queue-count={rows.length}>
            <span className="tabular-nums">{fmtInt(rows.length)}</span> thẻ
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Loại thẻ"
            value={type}
            options={TYPE_FILTERS}
            onChange={(v) => {
              setType(v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
          <FilterSelect
            label="Trạng thái"
            value={status}
            options={STATUS_FILTERS}
            onChange={(v) => {
              setStatus(v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        <DataGrid
          table={table}
          recordCount={rows.length}
          i18n={DATA_GRID_VI}
          onRowClick={(r) => setOpenId(r.id)}
          tableLayout={{ dense: true, width: "auto" }}
          emptyMessage={
            // Bộ lọc mặc định ra 0 trong khi hàng duyệt còn thẻ = mọi thẻ đã quyết: lối thoát phải tới chỗ có dòng,
            // không phải «Xoá lọc» về đúng mặc định đó (ngõ cụt — gap-probe F1).
            <div className="flex flex-col items-center gap-2 py-6">
              <span className="text-muted-foreground text-sm">
                {isDefault ? "Không còn thẻ chờ duyệt" : "Không có thẻ khớp bộ lọc"}
              </span>
              {isDefault ? (
                <Button variant="outline" size="sm" onClick={() => setStatus("decided")}>
                  Xem thẻ đã quyết
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={reset}>
                  Xoá lọc
                </Button>
              )}
            </div>
          }
        >
          <div className="flex w-full flex-col gap-2.5">
            <DataGridContainer>
              <DataGridScrollArea>
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
            {rows.length > PAGE_SIZE && <DataGridPagination sizes={[20, 50]} />}
          </div>
        </DataGrid>
      </FramePanel>
      <ReviewDetailSheet
        item={open}
        media={open ? media[open.id] : undefined}
        context={open ? context[open.id] : undefined}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </Frame>
  )
}

function FilterSelect<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)} items={options}>
      <SelectTrigger size="sm" aria-label={label} className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/** Hàng duyệt chưa có thẻ nào (cả đã quyết): một hành động — sang trang thu thập. */
function ReviewQueueEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>Hàng duyệt trống</EmptyTitle>
        <EmptyDescription>Không có thẻ nào chờ phán quyết.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/ops/collections" />}>
          Xem thu thập
        </Button>
      </EmptyContent>
    </Empty>
  )
}

