"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useTable, type ColumnDef, type ExpandedState, type PaginationState } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable, DataGridTableRowExpand, getDataGridTreeIndentStyle } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmtInt, fmtVnDate } from "@/lib/format"
import type { HangToa } from "@/lib/ops/registry/hang-toa"
import type { ThuocTinhCan } from "@/lib/ops/thuoc-tinh-can"
import { LABELS_VI } from "@/lib/vocab.generated"

import { BacBadge, NguonBadges } from "./registry-badges"

type Tab = "all" | "chua-can"

const so1 = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })
const NHAN_HUONG = LABELS_VI.direction_faces as Record<string, string>
const NHAN_LOAI = LABELS_VI.property_type as Record<string, string>
const AN_HEP = { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" }

/** Ô thuộc tính của một hàng căn: toà và hàng không đọc (lỗi) thì trống; căn chưa có thuộc tính thì nhãn ở ô đầu. */
function oThuocTinh(r: HangToa, ve: (t: ThuocTinhCan) => ReactNode, dau = false) {
  if (!r.laCan || r.thuocTinh === undefined) return null
  if (r.thuocTinh === null) return dau ? <Badge variant="outline">Chưa có thuộc tính</Badge> : null
  return ve(r.thuocTinh)
}
const gach = <span className="text-muted-foreground text-sm">—</span>

const COLUMNS: ColumnDef<DataGridFeatures, HangToa>[] = [
  {
    id: "ten",
    header: "Toà · căn",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-start gap-1">
        {row.getCanExpand() ? (
          <DataGridTableRowExpand row={row} />
        ) : (
          <span aria-hidden="true" style={getDataGridTreeIndentStyle(row, 20)} className="inline-flex shrink-0 ps-(--data-grid-tree-padding)">
            <span className="size-6" />
          </span>
        )}
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
  {
    id: "dien-tich",
    header: "Diện tích",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (
      <div className="flex flex-col gap-0.5" data-thuoc-tinh="dien-tich">
        {t.datDat != null ? (
          <>
            <span className="text-sm tabular-nums">{t.thongThuy != null ? `${so1(t.thongThuy)} m² sàn` : "—"}</span>
            <span className="text-muted-foreground text-xs tabular-nums">Đất {so1(t.datDat)} m²</span>
          </>
        ) : (
          <>
            <span className="text-sm tabular-nums">{t.thongThuy != null ? `${so1(t.thongThuy)} m²` : "—"}</span>
            {t.timTuong != null && <span className="text-muted-foreground text-xs tabular-nums">Tim tường {so1(t.timTuong)} m²</span>}
          </>
        )}
      </div>
    ), true),
    size: 150,
  },
  {
    id: "pn-wc",
    header: "PN · WC",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (
      <span className="text-sm tabular-nums" data-thuoc-tinh="pn-wc">{t.phongNgu ?? "—"} · {t.wc ?? "—"}</span>
    )),
    size: 90,
  },
  {
    id: "huong",
    header: "Hướng",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (t.huong.length ? (
      <span className="text-sm" data-thuoc-tinh="huong">{t.huong.map((h) => NHAN_HUONG[h] ?? h).join(" · ")}</span>
    ) : gach)),
    size: 140,
    meta: AN_HEP,
  },
  {
    id: "loai-hinh",
    header: "Loại hình",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (t.loaiHinh ? (
      <span className="text-sm" data-thuoc-tinh="loai-hinh">{NHAN_LOAI[t.loaiHinh] ?? t.loaiHinh}</span>
    ) : gach)),
    size: 110,
    meta: AN_HEP,
  },
  {
    id: "gia-cdt",
    header: "Giá chủ đầu tư",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (t.giaCdt != null ? (
      <div className="flex flex-col gap-0.5" data-thuoc-tinh="gia-cdt">
        <span className="text-sm tabular-nums">{(t.giaCdt / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ</span>
        {t.giaM2ThongThuy != null && <span className="text-muted-foreground text-xs tabular-nums">{so1(t.giaM2ThongThuy / 1e6)} tr/m² thông thuỷ</span>}
      </div>
    ) : gach)),
    size: 150,
  },
  {
    id: "nguon-thuoc-tinh",
    header: "Thuộc tính từ",
    cell: ({ row }) => oThuocTinh(row.original, (t) => (
      <div className="flex flex-col items-start gap-0.5" data-thuoc-tinh="nguon">
        <div className="flex flex-wrap gap-1">
          {t.nguon.map((n) => <Badge key={n} variant="info-light" translate="no">{n}</Badge>)}
        </div>
        {t.lanThu && <span className="text-muted-foreground text-xs">Thu {fmtVnDate(t.lanThu)}</span>}
      </div>
    )),
    size: 120,
    meta: AN_HEP,
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
            <FrameDescription>Mở một toà để xem căn theo tầng và trục, kèm thuộc tính căn của chủ đầu tư. Mã căn là mã tại nguồn.</FrameDescription>
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
