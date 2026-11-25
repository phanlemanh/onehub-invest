"use client"

import { useState } from "react"
import Link from "next/link"
import { CircleAlertIcon, RotateCwIcon } from "lucide-react"
import { useTable, type ColumnDef, type PaginationState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { CanQuyCan } from "@/lib/ops/registry/quy-can"

/** Khối «Quỹ căn đang bán» của trang một dự án (DA56): quỹ căn S09 có giá chủ đầu tư, chỉ đọc, sắp theo mã căn. */

const SO_1 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 })
const SO_2 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 })
const gach = <span className="text-muted-foreground text-sm">—</span>

/** Khoảng min–max; hai đầu bằng nhau thì một số; vắng cả hai thì gạch. */
function khoang([a, b]: [number | null, number | null], fmt: (v: number) => string, donVi: string) {
  if (a == null && b == null) return gach
  const lo = a ?? b!
  const hi = b ?? a!
  return <span className="text-sm tabular-nums">{lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`} {donVi}</span>
}

const COLUMNS: ColumnDef<DataGridFeatures, CanQuyCan>[] = [
  { id: "ma", header: "Mã căn", cell: ({ row }) => <span className="font-mono text-xs" translate="no">{row.original.ma ?? "—"}</span>, size: 140 },
  { id: "loai-hinh", header: "Loại hình", cell: ({ row }) => (row.original.loaiHinh ? <span className="text-sm">{row.original.loaiHinh}</span> : gach), size: 120 },
  {
    id: "pn-wc",
    header: "PN · WC",
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.pn ?? "—"} · {row.original.wc ?? "—"}</span>,
    size: 90,
  },
  { id: "dien-tich", header: "Diện tích", cell: ({ row }) => khoang(row.original.dienTich, (v) => SO_1.format(v), "m²"), size: 120 },
  { id: "gia-ban", header: "Giá bán", cell: ({ row }) => khoang(row.original.giaBan, (v) => SO_2.format(v / 1e9), "tỷ"), size: 140 },
  { id: "don-gia", header: "Đơn giá", cell: ({ row }) => khoang(row.original.donGia, (v) => SO_1.format(v / 1e6), "tr/m²"), size: 130 },
  {
    id: "trang-thai",
    header: "Trạng thái nguồn",
    cell: ({ row }) => (row.original.trangThai ? <span className="font-mono text-xs" translate="no">{row.original.trangThai}</span> : gach),
    size: 130,
  },
]

function KhungQuyCan({ mo, children, footer }: { mo: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0" data-quy-can="">
      <FrameHeader>
        <div className="flex min-w-0 flex-col gap-0.5">
          <FrameTitle role="heading" aria-level={2}>Quỹ căn đang bán</FrameTitle>
          <FrameDescription>{mo}</FrameDescription>
        </div>
      </FrameHeader>
      {children}
      {footer}
    </Frame>
  )
}

const MO = "Căn chủ đầu tư đang chào bán theo nguồn S09, giá niêm yết công khai. Mã căn là mã tại nguồn."

export function DuAnQuyCanGrid({ rows }: { rows: CanQuyCan[] }) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const table = useTable({
    features: dataGridFeatures,
    columns: COLUMNS,
    data: rows,
    getRowId: (r) => r.id,
    state: { pagination },
    onPaginationChange: setPagination,
  })
  return (
    <DataGrid
      table={table}
      recordCount={rows.length}
      i18n={DATA_GRID_VI}
      tableLayout={{ dense: true, headerSticky: true }}
      emptyMessage={
        <div className="flex flex-col items-center gap-2 py-4" data-quy-can-trong="">
          <span>Chưa có quỹ căn của nguồn S09 cho dự án này.</span>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/ops/registry" />}>Về danh bạ</Button>
        </div>
      }
    >
      <KhungQuyCan
        mo={`${MO} ${rows.length} căn.`}
        footer={
          <FrameFooter>
            <DataGridPagination />
          </FrameFooter>
        }
      >
        <FramePanel className="p-0! shadow-none!">
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </FramePanel>
      </KhungQuyCan>
    </DataGrid>
  )
}

export function DuAnQuyCanLoi() {
  return (
    <Alert variant="destructive" data-quy-can-loi="">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Không tải được quỹ căn</AlertTitle>
      <AlertDescription>
        <p>Toà và căn của danh bạ vẫn đúng; chỉ khối quỹ căn chưa đọc được.</p>
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
          Thử lại
        </Button>
      </AlertAction>
    </Alert>
  )
}

export function DuAnQuyCanSkeleton() {
  return (
    <KhungQuyCan mo={MO}>
      <FramePanel className="flex flex-col gap-2" data-quy-can-tai="">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </FramePanel>
    </KhungQuyCan>
  )
}
