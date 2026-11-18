"use client"

import { useMemo } from "react"
import { useTable, type ColumnDef } from "@tanstack/react-table"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { DataGrid, DataGridContainer, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { fmtInt } from "@/lib/format"
import type { TheDiaChi } from "@/lib/the-dia-chi-nhom"

import { NHAN_MUC_DICH, NHAN_TRANG_THAI, tenNhom } from "./group-cards-text"

const Trong = () => <span className="text-muted-foreground text-sm">—</span>

/** Bảng thẻ (khuôn data-grid của /ops/people): mỗi nhóm một hàng, nhóm chưa có trong sổ đứng cuối (máy chủ đã xếp). */
export function GroupCardsTable({ rows, coQuyet, onOpen }: { rows: TheDiaChi[]; coQuyet: boolean; onOpen: (code: string) => void }) {
  const columns = useMemo<ColumnDef<DataGridFeatures, TheDiaChi>[]>(
    () => [
      {
        id: "nhom",
        header: "Nhóm",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5" data-card-code={row.original.card_code}>
            <span className={row.original.ten_nhom ? "text-sm wrap-anywhere" : "text-muted-foreground text-sm"}>{tenNhom(row.original)}</span>
            <span className="text-muted-foreground font-mono text-xs" translate="no">
              {row.original.card_code}
              {row.original.unit_code ? ` · ${row.original.unit_code}` : ""}
            </span>
          </div>
        ),
        size: 260,
        meta: { autoSize: true },
      },
      {
        id: "status",
        header: "Thẻ",
        cell: ({ row }) => {
          const n = NHAN_TRANG_THAI[row.original.status]
          return <Badge variant={n.variant}>{n.label}</Badge>
        },
        size: 100,
      },
      {
        id: "duAn",
        header: "Dự án",
        cell: ({ row }) =>
          row.original.du_an.length ? <span className="text-sm">{row.original.du_an.map((d) => d.name).join(", ")}</span> : <Trong />,
        size: 220,
      },
      {
        id: "phuong",
        header: "Phường · tỉnh",
        cell: ({ row }) =>
          row.original.phuong ? (
            <span className="text-sm">
              {row.original.phuong.name}
              {row.original.tinh ? ` · ${row.original.tinh.name}` : ""}
            </span>
          ) : (
            <Trong />
          ),
        size: 200,
      },
      {
        id: "phanKhu",
        header: "Phân khu",
        cell: ({ row }) => (row.original.phan_khu ? <span className="text-sm">{row.original.phan_khu.name}</span> : <Trong />),
        size: 140,
      },
      {
        id: "mucDich",
        header: "Bán/thuê",
        cell: ({ row }) => (row.original.muc_dich ? <span className="text-sm">{NHAN_MUC_DICH[row.original.muc_dich]}</span> : <Trong />),
        size: 110,
      },
      {
        id: "doc",
        header: "Bài đã đọc",
        cell: ({ row }) => <span className="text-sm tabular-nums">{fmtInt(row.original.evidence.so_bai_doc ?? 0)}</span>,
        size: 100,
      },
      {
        id: "mo",
        header: "",
        cell: ({ row }) => (
          <Button size="sm" variant={coQuyet && row.original.status === "nhap" ? "default" : "outline"} onClick={() => onOpen(row.original.card_code)}>
            {coQuyet ? "Duyệt thẻ" : "Xem thẻ"}
          </Button>
        ),
        size: 110,
      },
    ],
    [coQuyet, onOpen],
  )
  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (r) => r.card_code,
    state: { pagination: { pageIndex: 0, pageSize: Math.max(rows.length, 1) } },
  })
  return (
    <DataGrid table={table} recordCount={rows.length} i18n={DATA_GRID_VI} tableLayout={{ dense: true, width: "auto" }}>
      <DataGridContainer>
        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </DataGridContainer>
    </DataGrid>
  )
}
