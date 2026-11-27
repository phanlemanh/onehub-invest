"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTable, type ColumnDef, type ExpandedState, type PaginationState } from "@tanstack/react-table"
import { MapPinIcon, RadioTowerIcon, SearchIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { FILTER_LABELS_VI, FILTER_OPERATORS_VI } from "@/components/listing/listings-filter-bar"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable, DataGridTableRowExpand, getDataGridTreeIndentStyle } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery, flattenFilterConditions } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { fmtInt } from "@/lib/format"
import { biDanhKhacTen, CHO_THIEU_NHAN, khopTim, type ChoThieu, type HangCay } from "@/lib/ops/registry/cay"
import { LABELS_VI } from "@/lib/vocab.generated"

import { BacBadge, NguonBadges } from "./registry-badges"

/**
 * Bảng cây dự án → phân khu của /ops/registry (khuôn records-grid của /ops/deals: Frame + data-grid + @reui/filters).
 * Lọc và tìm chạy phía khách trên ~350 dự án máy chủ đã gửi; số đếm mọi ô là của SQL.
 */

const LOAI: Record<HangCay["loai"], string> = { project: "Dự án", subzone: "Phân khu", building: "Phân khu" }
const ICON = "size-4"
const CHUA_RO_TINH = "Chưa rõ tỉnh"
const KHONG_NGUON = "Chưa nối nguồn"

const so = (n: number) => <span className="text-sm tabular-nums">{fmtInt(n)}</span>

const COLUMNS: ColumnDef<DataGridFeatures, HangCay>[] = [
  {
    id: "ten",
    header: "Dự án · phân khu",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-start gap-1">
        {row.getCanExpand() ? (
          <DataGridTableRowExpand row={row} />
        ) : (
          // Hàng lá giữ chỗ bằng nút mở để tên thẳng hàng với hàng anh em mở được.
          <span aria-hidden="true" style={getDataGridTreeIndentStyle(row, 20)} className="inline-flex shrink-0 ps-(--data-grid-tree-padding)">
            <span className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          {row.depth === 0 ? (
            <Button variant="link" size="xs" className="max-w-full justify-start px-0" nativeButton={false} render={<Link href={`/ops/registry/${row.original.id}`} />}>
              <span className="truncate">{row.original.ten}</span>
            </Button>
          ) : (
            <span className="truncate text-sm">{row.original.ten}</span>
          )}
          <span className="text-muted-foreground max-w-full truncate text-xs">
            {[row.depth > 0 ? LOAI[row.original.loai] : null, biDanhKhacTen(row.original.ten, row.original.biDanh).join(" · ") || null].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>
    ),
    size: 260,
  },
  { id: "tinh", header: "Tỉnh/thành", cell: ({ row }) => <span className="text-sm">{row.depth === 0 ? (row.original.tinh ?? "—") : ""}</span>, size: 110, meta: { headerClassName: "hidden lg:table-cell", cellClassName: "hidden lg:table-cell" } },
  // DA67: dưới md ẩn Bậc để Toà, Căn, Tin đang rao nằm trong khung (như Tỉnh/thành, Nguồn).
  { id: "bac", header: "Bậc", cell: ({ row }) => <BacBadge bac={row.original.bac} />, size: 110, meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" } },
  { id: "nguon", header: "Nguồn", cell: ({ row }) => <NguonBadges nguon={row.original.nguon} />, size: 100, meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" } },
  { id: "phanKhu", header: "Phân khu", cell: ({ row }) => so(row.original.soPhanKhu), size: 80, meta: { headerClassName: "hidden xl:table-cell text-end", cellClassName: "hidden xl:table-cell text-end" } },
  {
    id: "toa",
    header: "Toà",
    cell: ({ row }) => (
      <div className="flex flex-col items-end gap-0.5">
        {so(row.original.soToa)}
        {row.original.toaChuaCan > 0 && <span className="text-muted-foreground text-xs tabular-nums">{fmtInt(row.original.toaChuaCan)} chưa có căn</span>}
      </div>
    ),
    size: 110,
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
  { id: "can", header: "Căn", cell: ({ row }) => so(row.original.soCan), size: 90, meta: { headerClassName: "text-end", cellClassName: "text-end" } },
  {
    id: "tin",
    header: "Tin đang rao",
    cell: ({ row }) => {
      const tin = Object.entries(row.original.tin).filter(([, n]) => n > 0)
      if (row.depth > 0) return null
      if (tin.length === 0) return <span className="text-muted-foreground text-xs">Chưa có</span>
      return (
        <div className="flex flex-col items-end gap-0.5" data-tin="">
          {tin.map(([s, n]) => (
            <span key={s} className="text-sm tabular-nums" translate="no">{s} {fmtInt(n)}</span>
          ))}
        </div>
      )
    },
    size: 100,
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
]

const GIA_TRI = {
  tinh: (h: HangCay) => [h.tinh ?? CHUA_RO_TINH],
  nguon: (h: HangCay) => (h.nguon.length > 0 ? h.nguon : [KHONG_NGUON]),
  bac: (h: HangCay) => [h.bac],
  thieu: (h: HangCay) => h.thieu,
} as const
type TruongLoc = keyof typeof GIA_TRI

function truongLoc(rows: HangCay[]): FilterField[] {
  const dem = (id: TruongLoc, nhan: (v: string) => string = (v) => v) => {
    const m = new Map<string, number>()
    for (const r of rows) for (const v of GIA_TRI[id](r)) m.set(v, (m.get(v) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, label: nhan(value), description: `${fmtInt(n)} dự án` }))
  }
  const many = (value: string) => ({ value, label: FILTER_OPERATORS_VI[value] ?? value, arity: "many" as const })
  const base = { type: "select" as const, operators: [many("is_any_of"), many("is_none_of")], defaultOperator: "is_any_of" }
  return [
    { ...base, id: "tinh", label: "Tỉnh/thành", icon: <MapPinIcon className={ICON} aria-hidden="true" />, options: dem("tinh") },
    { ...base, id: "nguon", label: "Nguồn", icon: <RadioTowerIcon className={ICON} aria-hidden="true" />, options: dem("nguon") },
    { ...base, id: "bac", label: "Bậc", icon: <ShieldCheckIcon className={ICON} aria-hidden="true" />, options: dem("bac", (v) => (LABELS_VI.catalog_tier as Record<string, string>)[v] ?? v) },
    { ...base, id: "thieu", label: "Chỗ thiếu", icon: <TriangleAlertIcon className={ICON} aria-hidden="true" />, options: dem("thieu", (v) => CHO_THIEU_NHAN[v as ChoThieu] ?? v) },
  ]
}

export function hopLoc(query: FilterQuery): (h: HangCay) => boolean {
  const dk = flattenFilterConditions(query).filter((c) => c.field in GIA_TRI && c.values.length > 0)
  return (h) =>
    dk.every((c) => {
      const co = GIA_TRI[c.field as TruongLoc](h)
      const trung = c.values.some((v) => co.includes(String(v)))
      // Phủ định: is_none_of là nghịch của is_any_of; cờ negated lật thêm một lần.
      const khop = c.operator === "is_none_of" ? !trung : trung
      return c.negated ? !khop : khop
    })
}

/** `locBanDau`: bộ lọc mở sẵn (khuôn /ops/deals) — test dựng bảng đã lọc mà không cần bấm. */
export function RegistryGrid({ rows, locBanDau }: { rows: HangCay[]; locBanDau?: FilterQuery }) {
  const [query, setQuery] = useState<FilterQuery>(() => locBanDau ?? createFilterQuery())
  const [chu, setChu] = useState("")
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const fields = useMemo(() => truongLoc(rows), [rows])
  const data = useMemo(() => rows.filter((h) => hopLoc(query)(h) && khopTim(h, chu)), [rows, query, chu])
  const xoaLoc = () => {
    setQuery(createFilterQuery())
    setChu("")
  }
  const table = useTable({
    features: dataGridFeatures,
    columns: COLUMNS,
    data,
    getRowId: (h) => String(h.id),
    getSubRows: (h) => h.subRows,
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
        <div className="flex flex-col items-center gap-2 py-4" data-registry-empty="loc">
          <span>Không có dự án nào khớp bộ lọc.</span>
          <Button variant="outline" size="sm" onClick={xoaLoc}>Xoá lọc</Button>
        </div>
      }
    >
      <Frame variant="default" spacing="sm" className="w-full min-w-0">
        <FrameHeader className="flex flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle role="heading" aria-level={2}>Dự án</FrameTitle>
            <FrameDescription>Mở một dự án để xem toà và căn. Dự án nhiều căn lên trước.</FrameDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InputGroup className="w-64 max-w-full">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={chu}
                onChange={(e) => {
                  setChu(e.target.value)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                }}
                placeholder="Tên hoặc bí danh"
                aria-label="Tìm dự án theo tên hoặc bí danh"
              />
            </InputGroup>
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
            <Badge variant="outline" className="tabular-nums" data-registry-khop="">{fmtInt(data.length)}/{fmtInt(rows.length)} dự án</Badge>
          </div>
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
