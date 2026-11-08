"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table"
import { HouseIcon, ImageIcon, MapPinIcon, PhoneIcon, RadioTowerIcon } from "lucide-react"

import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { FILTER_LABELS_VI, FILTER_OPERATORS_VI } from "@/components/listing/listings-filter-bar"
import { Badge } from "@/components/reui/badge"
import { DataGrid, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import { createFilterQuery, flattenFilterConditions } from "@/components/reui/filters/filters-query"
import type { FilterField, FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type DealHang, loaiHinh, tabCua, type TabDeal, soPct } from "@/lib/deals-chi-tiet"
import { fmtCompact, fmtInt, fmtVnDate } from "@/lib/format"

import { DiscountBar, DealThumb } from "./deals-cells"
import { DealChoGhep } from "./deal-cho-ghep"
import { DealSheet } from "./deal-sheet"

/**
 * /ops/deals — khuôn records-grid của kho (Frame + data-grid + @reui/filters, bấm hàng mở sheet), tab trạng thái có
 * đếm theo objectives-grid. Tab trả lời «việc gì tiếp»; chip lọc trả lời «trong đám nào».
 */

type Tab = "all" | TabDeal
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "du", label: "Đủ để gọi" },
  { value: "xac-minh", label: "Cần xác minh" },
  { value: "thieu", label: "Còn thiếu" },
]

/** Hàng của lưới: căn kèm thẻ Ghép căn còn chờ (OD1 · ĐC7). */
type DealHangGhep = DealHang & { choGhep?: number[] }

const COLUMNS: ColumnDef<DataGridFeatures, DealHangGhep>[] = [
  {
    id: "can",
    accessorFn: (d) => d.ten,
    header: ({ column }) => <DataGridColumnHeader title="Căn" column={column} />,
    cell: ({ row: { original: d } }) => (
      <div className="flex min-w-0 items-center gap-2">
        {d.xemAnh && <DealThumb d={d} />}
        <div className="flex min-w-0 flex-col items-start gap-0.5">
          {/* Không tự mở sheet: cú bấm đi lên onRowClick của hàng (xem ghi chú ở records-grid). */}
          <Button variant="link" size="xs" className="max-w-full justify-start">
            <span className="truncate">{[loaiHinh(d.propertyType) ?? "Chưa rõ loại hình", d.areaM2 ? `${Math.round(d.areaM2)} m²` : null, d.bedrooms ? `${d.bedrooms}PN` : null].filter(Boolean).join(" · ")}</span>
          </Button>
          <span className="text-muted-foreground max-w-full truncate ps-2 text-xs">{[d.block, d.phuong].filter(Boolean).join(" · ")}</span>
          <div className="ps-2"><DealChoGhep ids={d.choGhep} /></div>
        </div>
      </div>
    ),
    enableSorting: false,
    minSize: 240,
    meta: { autoSize: true, headerClassName: "ps-4", cellClassName: "ps-4" },
  },
  {
    id: "gia",
    accessorFn: (d) => d.priceVnd ?? 0,
    header: ({ column }) => <DataGridColumnHeader title="Giá" column={column} />,
    cell: ({ row: { original: d } }) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-medium tabular-nums">{d.priceVnd === null ? "—" : fmtCompact(d.priceVnd)}</span>
        <span className="text-muted-foreground hidden text-xs tabular-nums md:inline">{d.pricePerm2 ? `${fmtInt(d.pricePerm2 / 1e6)} tr/m²` : "—"}</span>
        {/* Màn hẹp bỏ cột Giảm: mức giảm vào thẳng dưới giá, không phải cuộn ngang mới thấy lý do căn có mặt. */}
        <span className="text-xs font-medium tabular-nums md:hidden">−{soPct(d.discountPct ?? 0)}%</span>
      </div>
    ),
    size: 96,
    meta: { headerClassName: "text-end", cellClassName: "text-end" },
  },
  {
    id: "giam",
    accessorFn: (d) => d.discountPct ?? 0,
    header: ({ column }) => <DataGridColumnHeader title="Giảm so thước" column={column} />,
    cell: ({ row: { original: d } }) => <DiscountBar d={d} gon />,
    size: 190,
    meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" },
  },
  {
    id: "tinhTrang",
    accessorFn: tabCua,
    header: ({ column }) => <DataGridColumnHeader title="Tình trạng" column={column} />,
    cell: ({ row: { original: d } }) => {
      const t = tabCua(d)
      return t === "xac-minh" ? <Badge variant="warning-light">Cần xác minh</Badge>
        : t === "thieu" ? <Badge variant="outline">Thiếu {d.thieu.length}</Badge>
        : <Badge variant="success-light">Đủ để gọi</Badge>
    },
    size: 120,
    meta: { headerClassName: "hidden md:table-cell", cellClassName: "hidden md:table-cell" },
  },
  {
    id: "goi",
    accessorFn: (d) => d.sellerName ?? "",
    header: "Gọi ai",
    cell: ({ row: { original: d } }) => (
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        {d.tel && d.sdt ? (
          <Button variant="outline" size="xs" className="tabular-nums" nativeButton={false} render={<a href={d.tel} onClick={(e) => e.stopPropagation()} />}>
            <PhoneIcon aria-hidden="true" />
            <span translate="no">{d.sdt}</span>
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">Chưa có SĐT</span>
        )}
        <span className="text-muted-foreground max-w-full truncate text-xs" translate="no">{d.sellerName ?? "Chưa có tên"}</span>
      </div>
    ),
    enableSorting: false,
    size: 150,
    meta: { headerClassName: "hidden lg:table-cell", cellClassName: "hidden lg:table-cell" },
  },
  {
    id: "thay",
    accessorFn: (d) => d.firstSeen,
    header: ({ column }) => <DataGridColumnHeader title="Thấy" column={column} />,
    cell: ({ row: { original: d } }) => (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm tabular-nums">{fmtVnDate(d.firstSeen)}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{d.source} · {fmtInt(d.nReposts)} lần</span>
      </div>
    ),
    size: 110,
    meta: { headerClassName: "hidden xl:table-cell", cellClassName: "hidden xl:table-cell" },
  },
]

const O_LOC = {
  source: (d: DealHang) => d.source,
  type: (d: DealHang) => loaiHinh(d.propertyType) ?? "Chưa rõ",
  phuong: (d: DealHang) => d.phuong ?? "Chưa gắn",
  anh: (d: DealHang) => (d.images.length > 0 ? "Có ảnh" : "Chưa có ảnh"),
} as const
type OLoc = keyof typeof O_LOC
const ICON = "size-4"

export function truongLoc(rows: DealHang[], xemNoiDung: boolean): FilterField[] {
  const dem = (id: OLoc) => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(O_LOC[id](r), (m.get(O_LOC[id](r)) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, label: value, description: `${fmtInt(n)} căn` }))
  }
  const many = (value: string) => ({ value, label: FILTER_OPERATORS_VI[value] ?? value, arity: "many" as const })
  const base = { type: "select" as const, operators: [many("is_any_of"), many("is_none_of")], defaultOperator: "is_any_of" }
  return [
    { ...base, id: "phuong", label: "Phường", icon: <MapPinIcon className={ICON} aria-hidden="true" />, searchable: true, options: dem("phuong") },
    { ...base, id: "type", label: "Loại hình", icon: <HouseIcon className={ICON} aria-hidden="true" />, options: dem("type") },
    { ...base, id: "source", label: "Nguồn", icon: <RadioTowerIcon className={ICON} aria-hidden="true" />, options: dem("source") },
    ...(xemNoiDung ? [{ ...base, id: "anh", label: "Ảnh", icon: <ImageIcon className={ICON} aria-hidden="true" />, options: dem("anh") }] : []),
  ]
}

function hopBoLoc(query: FilterQuery): (d: DealHang) => boolean {
  const dk = flattenFilterConditions(query).filter((c) => c.field in O_LOC && c.values.length > 0)
  return (d) => dk.every((c) => {
    const trung = c.values.includes(O_LOC[c.field as OLoc](d))
    return c.operator === "is_none_of" ? !trung : trung
  })
}

/** `rows` đến theo thứ tự của dealsSql (căn cần xác minh đứng cuối, ON11); người bấm tiêu đề cột mới đổi thứ tự. */
/** Hằng ngoài component: mặc định `{}` mới mỗi lần vẽ làm `rows` đổi danh tính → bảng tự về trang 1. */
const KHONG_CHO_GHEP: Record<string, number[]> = {}

export function DealsGrid({ rows: tho, moBanDau = null, locBanDau, xemNoiDung, mayThu, choGhep = KHONG_CHO_GHEP }: {
  rows: DealHang[]
  moBanDau?: string | null
  locBanDau?: FilterQuery
  xemNoiDung: boolean
  mayThu: boolean
  /** offerId → thẻ Ghép căn còn chờ (OD1 · ĐC7); vắng ở cloud. */
  choGhep?: Record<string, number[]>
}) {
  const rows = useMemo<DealHangGhep[]>(() => tho.map((d) => (choGhep[d.offerId] ? { ...d, choGhep: choGhep[d.offerId] } : d)), [tho, choGhep])
  const [tab, setTab] = useState<Tab>("all")
  const [query, setQuery] = useState<FilterQuery>(() => locBanDau ?? createFilterQuery())
  // Nút Back khôi phục trang từ bộ đệm router, prop là của lần tải đầu; `datMo` chỉ đổi URL, nên URL mới biết căn đang xem.
  const thamSo = useSearchParams()
  const canBanDau = thamSo ? thamSo.get("can") : moBanDau
  const [moId, setMoId] = useState<string | null>(canBanDau)
  // Hàng vừa xem giữ nền chọn sau khi đóng sheet, để mắt về đúng chỗ đang duyệt.
  const [vuaXem, setVuaXem] = useState<string | null>(canBanDau)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 })

  const fields = useMemo(() => truongLoc(rows, xemNoiDung && mayThu), [rows, xemNoiDung, mayThu])
  const quaLoc = useMemo(() => rows.filter(hopBoLoc(query)), [rows, query])
  const dem = useMemo(() => {
    const c: Record<Tab, number> = { all: quaLoc.length, du: 0, "xac-minh": 0, thieu: 0 }
    for (const d of quaLoc) c[tabCua(d)]++
    return c
  }, [quaLoc])
  const data = useMemo(() => (tab === "all" ? quaLoc : quaLoc.filter((d) => tabCua(d) === tab)), [quaLoc, tab])

  // Vai Người xem không có liên hệ: bỏ hẳn cột, không ghi «Chưa có SĐT» vì căn không thiếu số.
  const cot = useMemo(() => (xemNoiDung ? COLUMNS : COLUMNS.filter((c) => c.id !== "goi")), [xemNoiDung])
  const table = useTable({
    features: dataGridFeatures,
    columns: cot,
    data,
    getRowId: (d) => d.offerId,
    enableRowSelection: true,
    state: { pagination, sorting, rowSelection: vuaXem ? { [vuaXem]: true } : {} },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  // Thứ tự chuyển căn trong sheet: đúng thứ tự đang thấy (lọc + sắp), không chỉ trang hiện tại.
  const thuTu = table.getSortedRowModel().rows.map((r) => r.original)
  const viTri = thuTu.findIndex((d) => d.offerId === moId)
  const mo = rows.find((d) => d.offerId === moId) ?? null

  const datMo = (id: string | null) => {
    setMoId(id)
    if (id) setVuaXem(id)
    const u = new URL(window.location.href)
    if (id) u.searchParams.set("can", id)
    else u.searchParams.delete("can")
    window.history.replaceState(null, "", u)
  }
  // Mở một căn từ sheet: căn nằm ngoài lọc đang bật vẫn mở được, bảng chỉ dời trang khi căn có trong bảng.
  const moCan = (id: string) => {
    datMo(id)
    const i = thuTu.findIndex((d) => d.offerId === id)
    if (i >= 0) setPagination((p) => ({ ...p, pageIndex: Math.floor(i / p.pageSize) }))
  }
  const chuyen = (buoc: 1 | -1) => {
    const ke = viTri >= 0 ? thuTu[viTri + buoc] : undefined
    if (ke) moCan(ke.offerId)
  }

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data.length}
        emptyMessage={
          quaLoc.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <span>Không có căn nào khớp bộ lọc.</span>
              <Button variant="outline" size="sm" onClick={() => setQuery(createFilterQuery())}>Xoá bộ lọc</Button>
            </div>
          ) : "Mục này chưa có căn."
        }
        i18n={DATA_GRID_VI}
        onRowClick={(d) => datMo(d.offerId)}
        tableLayout={{ dense: true, headerSticky: true }}
      >
        <Frame variant="default" spacing="sm" className="w-full">
          <FrameHeader data-truong-loc={fields.map((f) => f.id).join(" ")} className="flex flex-row flex-wrap items-center justify-between gap-3">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as Tab)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
            >
              <TabsList variant="line" className="no-scrollbar max-w-full justify-start gap-5 overflow-x-auto">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="flex-none gap-1.5 px-1 text-sm">
                    {t.label}
                    <Badge variant="outline" radius="full" className="tabular-nums">{dem[t.value]}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
      <DealSheet d={mo} rows={rows} choGhep={mo?.choGhep} xemNoiDung={xemNoiDung} mayThu={mayThu} viTri={viTri} tong={thuTu.length} onChuyen={chuyen} onMoCan={moCan} onOpenChange={(o) => !o && datMo(null)} />
    </>
  )
}
