"use client"

import { useState } from "react"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"
import { BotIcon, CircleAlertIcon } from "lucide-react"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status"
import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { AiCallGroup, AiCalls } from "@/lib/ai-calls-queries"
import { fmtInt, fmtVnDate } from "@/lib/format"

/**
 * /ops/ai-calls «Cuộc gọi AI» (PL29 `so-cuoc-goi-ai`) — Table-backed management: PageHeader mang ba số tóm tắt 30 ngày,
 * một Frame + data-grid ngày × việc × model (cùng khuôn lưới «Tin mới nhất» của /ops/data-flow). Chỉ đọc.
 */

const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Cuộc gọi AI" }]
const DESCRIPTION = "Token, độ trễ và chi phí của mọi cuộc gọi qua agent runtime, 30 ngày gần nhất."

/** Đồng: null = model chưa có giá (không phải 0). */
export function fmtChiPhi(v: number | null): string {
  if (v == null) return "chưa có giá"
  return `${v.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} đ`
}
const fmtMs = (v: number | null) => (v == null ? "—" : `${fmtInt(v)} ms`)

const so = (title: string, key: keyof AiCallGroup, fmt: (v: number) => string = fmtInt): ColumnDef<DataGridFeatures, AiCallGroup> => ({
  accessorKey: key,
  id: key,
  header: ({ column }) => <DataGridColumnHeader title={title} column={column} />,
  cell: ({ row }) => <span className="tabular-nums">{fmt(row.original[key] as number)}</span>,
  meta: { headerClassName: "text-end", cellClassName: "text-end" },
})

const COLUMNS: ColumnDef<DataGridFeatures, AiCallGroup>[] = [
  {
    accessorKey: "ngay",
    id: "ngay",
    header: ({ column }) => <DataGridColumnHeader title="Ngày" column={column} />,
    cell: ({ row }) => <span className="tabular-nums">{fmtVnDate(`${row.original.ngay}T00:00:00+07:00`)}</span>,
    meta: { headerClassName: "ps-5", cellClassName: "ps-5" },
  },
  { accessorKey: "viec", id: "viec", header: ({ column }) => <DataGridColumnHeader title="Việc" column={column} /> },
  { accessorKey: "model", id: "model", header: ({ column }) => <DataGridColumnHeader title="Model" column={column} /> },
  so("Cuộc", "cuoc"),
  so("Lỗi", "loi"),
  so("Token vào", "tokenVao"),
  so("Token ra", "tokenRa"),
  {
    accessorKey: "chiPhi",
    id: "chiPhi",
    header: ({ column }) => <DataGridColumnHeader title="Chi phí" column={column} />,
    cell: ({ row }) => (
      <span className={row.original.chiPhi == null ? "text-muted-foreground" : "tabular-nums"}>{fmtChiPhi(row.original.chiPhi)}</span>
    ),
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
  so("Trễ p50", "p50Ms", (v) => fmtMs(v)),
  so("Trễ p95", "p95Ms", (v) => fmtMs(v)),
]

/** Dòng trạng thái số dưới đầu trang: máy thu đọc bảng trực tiếp; máy chủ theo khối bản tin (ADR-0014, facts-status). */
function AiCallsStatus({ data }: { data: AiCalls }) {
  if (data.state === "error")
    return (
      <Alert variant="destructive" data-ai-calls-error="">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Số cuộc gọi AI không đo được</AlertTitle>
        <AlertDescription>{data.error ?? "không đo được"}</AlertDescription>
      </Alert>
    )
  if (data.mode === "local") return null
  if (data.state === "none")
    return (
      <LocalOnlyAlert title="Chỉ đo ở máy thu">
        Máy thu chưa đẩy số cuộc gọi AI lên máy chủ. Kiểm tác vụ đồng bộ ở máy thu, hoặc xem cổng Ops trên máy thu.
      </LocalOnlyAlert>
    )
  return (
    <>
      <FactsStamp state={data.state} measuredAt={data.measuredAt} />
      <FactsStaleAlert state={data.state} measuredAt={data.measuredAt} />
    </>
  )
}

function AiCallsEmpty() {
  return (
    <Empty data-ai-calls-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BotIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa có cuộc gọi AI nào trong 30 ngày</EmptyTitle>
        <EmptyDescription>
          Chạy thử agent để có dòng đầu tiên: <code className="font-mono text-xs">cd agent && npm run smoke</code>. Mỗi lượt judge
          hay enrich cũng ghi một dòng vào sổ.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function AiCallsView({ data }: { data: AiCalls }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "ngay", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const table = useTable({
    features: dataGridFeatures,
    columns: COLUMNS,
    data: data.nhom,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })
  const hasNumbers = data.state === "fresh" || data.state === "stale"
  const t = data.tong
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={CRUMBS}
        title="Cuộc gọi AI"
        stats={
          hasNumbers
            ? [
                `${fmtInt(t.cuoc)} cuộc`,
                `${fmtInt(t.tokenVao + t.tokenRa)} token`,
                t.chiPhi == null ? "chưa có giá" : t.chiPhi === 0 ? "0 đ — model local" : fmtChiPhi(t.chiPhi),
              ]
            : []
        }
        description={DESCRIPTION}
      />
      <AiCallsStatus data={data} />
      {hasNumbers && data.nhom.length === 0 ? <AiCallsEmpty /> : null}
      {hasNumbers && data.nhom.length > 0 ? (
        <DataGrid
          table={table}
          recordCount={data.nhom.length}
          emptyMessage="Chưa có cuộc gọi AI nào."
          i18n={DATA_GRID_VI}
          tableLayout={{ columnsResizable: true, headerSticky: false, dense: true }}
        >
          <Frame variant="default" spacing="sm" className="w-full">
            <FrameHeader className="flex flex-col items-start gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <FrameTitle>Theo ngày, việc và model</FrameTitle>
                <FrameDescription className="text-xs text-pretty">
                  {fmtInt(data.nhom.length)} nhóm · {fmtInt(t.loi)} lượt lỗi · ngày theo giờ Việt Nam
                  {t.nhomChuaCoGia ? ` · ${fmtInt(t.nhomChuaCoGia)} nhóm chưa có giá model` : ""}
                </FrameDescription>
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
      ) : null}
    </div>
  )
}
