"use client"

import { useState } from "react"
import { type PaginationState, type RowData, useTable } from "@tanstack/react-table"

import { DATA_GRID_VI, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGrid, DataGridContainer, dataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { FramePanel } from "@/components/reui/frame"
import { IT_MAU, nhanO } from "@/lib/do-hang-ngay"
import { fmtInt, fmtPct } from "@/lib/format"
import {
  type ChieuLat, type DongKiem, type DongNgay, type DuongLamGiau, mauKiem, NHOM_KIEM, NHOM_THAY_DOI, TEN_DUONG, TEN_TAP_DO, tong7,
} from "@/lib/ops/quality-lam-giau"

/**
 * Bảng số của khối «Làm giàu» (DO3): data-grid ReUI trong FramePanel của khối (không lồng Frame), chỉ đọc, không lọc/sắp.
 * `dotBien` chỉ dùng trong test (thước chiều đỏ của E7): `chua-chay-hien-0` hiện 0 cho đường chưa chạy, `khong-loi-hien-0`
 * hiện 0 cho người rút khi đường không có lối người rút.
 */
export type DotBienLamGiau = "chua-chay-hien-0" | "khong-loi-hien-0"

const tenDuong = (d: string) => TEN_DUONG[d] ?? d
const chuaChay = (d: DuongLamGiau) => d.homNay?.ly_do === "chua-chay"
const lapMoc = (d: DuongLamGiau) => d.homNay?.ly_do === "lap-moc"
const coSo = (d: DongNgay | null) => !!d && d.status !== "skip"

function BangLuoi<T extends RowData>({ data, columns, getRowId, bang, pageSize = 10 }: {
  data: T[]; columns: InsightColumn<T>[]; getRowId: (r: T) => string; bang: string; pageSize?: number
}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })
  const table = useTable({ features: dataGridFeatures, columns, data, getRowId, state: { pagination }, onPaginationChange: setPagination })
  return (
    <div className="flex w-full min-w-0 flex-col gap-2" data-bang={bang}>
      <DataGrid table={table} recordCount={data.length} i18n={DATA_GRID_VI}>
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
        {data.length > pageSize ? <DataGridPagination sizes={[10, 25, 50]} /> : null}
      </DataGrid>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <FramePanel className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </FramePanel>
  )
}

/** Một ô đếm: số của ngày đo mới nhất + tổng 7 ngày. */
function ODem({ d, o, dotBien }: { d: DuongLamGiau; o: "them" | "doi" | "may_rut" | "nguoi_sua" | "nguoi_rut"; dotBien?: DotBienLamGiau }) {
  if (chuaChay(d)) {
    return <span className="text-muted-foreground tabular-nums">{dotBien === "chua-chay-hien-0" ? "0" : "—"}</span>
  }
  if (o === "nguoi_rut" && d.homNay?.duong_nguoi_rut === false && dotBien !== "khong-loi-hien-0") {
    return <span className="text-muted-foreground text-xs" data-khong-nguoi-rut="">không có đường người rút</span>
  }
  const nay = coSo(d.homNay) ? (d.homNay?.[o] ?? 0) : null
  return (
    <span className="flex flex-col gap-0.5 tabular-nums">
      <span>{fmtInt(nay)}</span>
      <span className="text-muted-foreground text-xs">7 ngày: {fmtInt(tong7(d.bayNgay, o))}</span>
    </span>
  )
}

function TrangThaiNgay({ d }: { d: DuongLamGiau }) {
  if (chuaChay(d)) return <Badge variant="secondary">Chưa chạy</Badge>
  if (lapMoc(d)) return <Badge variant="info-light">Lập mốc</Badge>
  if (d.homNay?.status === "fail") return <Badge variant="warning-light">Lệch tự soát</Badge>
  if (d.homNay) return <Badge variant="success-light">Đã đo</Badge>
  return <span className="text-muted-foreground">—</span>
}

function ODuong({ d }: { d: DuongLamGiau }) {
  const ghi = chuaChay(d)
    ? "Chưa chạy — đường này chưa ghi giá trị lên tin"
    : lapMoc(d)
      ? "Lần đầu — đã lập mốc, số thay đổi có từ ngày mai"
      : d.homNay?.soat_lech
        ? `Tự soát lệch: ${d.homNay.soat_lech}`
        : null
  return (
    <span className="flex flex-col gap-0.5" data-duong={d.duong}>
      <span className="text-sm">{tenDuong(d.duong)}</span>
      {ghi ? <span className="text-muted-foreground text-xs" data-ghi-duong={d.homNay?.ly_do ?? "soat"}>{ghi}</span> : null}
    </span>
  )
}

export function BangThayDoi({ duong, ngay, dotBien }: { duong: DuongLamGiau[]; ngay: string | null; dotBien?: DotBienLamGiau }) {
  const dem = (id: "them" | "doi" | "may_rut" | "nguoi_sua" | "nguoi_rut", header: string, size = 110): InsightColumn<DuongLamGiau> =>
    ({ id, header, cell: ({ row }) => <ODem d={row.original} o={id} dotBien={dotBien} />, size })
  const columns: InsightColumn<DuongLamGiau>[] = [
    { id: "duong", header: "Đường", cell: ({ row }) => <ODuong d={row.original} />, size: 220 },
    { id: "trang_thai", header: "Trạng thái", cell: ({ row }) => <TrangThaiNgay d={row.original} />, size: 120 },
    {
      id: "song",
      header: "Đang mang",
      cell: ({ row }) => {
        const d = row.original
        if (chuaChay(d)) return <span className="text-muted-foreground tabular-nums">{dotBien === "chua-chay-hien-0" ? "0" : "—"}</span>
        return <span className="tabular-nums">{fmtInt(d.homNay?.song ?? null)}</span>
      },
      size: 100,
    },
    dem("them", "Thêm"),
    dem("doi", "Đổi"),
    dem("may_rut", "Máy rút"),
    dem("nguoi_sua", "Người sửa"),
    dem("nguoi_rut", "Người rút", 160),
  ]
  return (
    <Panel title={`Thay đổi theo ngày${ngay ? ` · ${ngay}` : ""}`}>
      <BangLuoi data={duong} columns={columns} getRowId={(d) => d.duong} bang="lam-giau-ngay" />
    </Panel>
  )
}

/** Tỉ lệ đúng của một tuần: n < IT_MAU → «ít mẫu», không in phần trăm. */
function TyLeKiem({ k }: { k: DongKiem }) {
  const mau = mauKiem(k)
  if (mau < IT_MAU) return <Badge variant="secondary" data-it-mau="">ít mẫu · n={mau}</Badge>
  return (
    <span className="flex flex-col gap-0.5 tabular-nums">
      <span>{fmtPct(k.ty_le_dung ?? null)} <span className="text-muted-foreground text-xs">n={fmtInt(mau)}</span></span>
      <span className="text-muted-foreground text-xs">không ra {fmtInt(k.khong_ra ?? 0)}</span>
    </span>
  )
}

const coKiem = (k: DongKiem | null): k is DongKiem => !!k && k.status !== "skip" && typeof k.n === "number"

function OTuan({ d, k, tuan, nay }: { d: DuongLamGiau; k: DongKiem | null; tuan: string | null; nay: boolean }) {
  if (chuaChay(d)) return nay ? <Badge variant="secondary">Chưa chạy</Badge> : <span className="text-muted-foreground">—</span>
  if (coKiem(k)) return <TyLeKiem k={k} />
  if (!nay) return <span className="text-muted-foreground">—</span>
  return <span className="text-muted-foreground text-xs" data-chua-kiem="">Chưa có kiểm ngược tuần {tuan ?? ""}</span>
}

function OWilson({ k }: { k: DongKiem | null }) {
  if (!coKiem(k) || mauKiem(k) < IT_MAU || !k.wilson) return <span className="text-muted-foreground">—</span>
  return <span className="tabular-nums">{fmtPct(k.wilson.thap)}</span>
}

function OChenh({ k, truoc }: { k: DongKiem | null; truoc: DongKiem | null }) {
  // Một trong hai tuần dưới IT_MAU mẫu: chênh chỉ là nhiễu, không in.
  if (!coKiem(k) || !coKiem(truoc) || k.chenh === null || k.chenh === undefined || mauKiem(k) < IT_MAU || mauKiem(truoc) < IT_MAU) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <span className="flex flex-wrap items-center gap-1 tabular-nums">
      {k.chenh > 0 ? "+" : ""}{fmtPct(k.chenh)}
      {k.co_y_nghia ? <Badge variant="info-light" data-co-y-nghia="">chênh có ý nghĩa</Badge> : null}
    </span>
  )
}

export function BangKiemNguoc({ duong, tuan }: { duong: DuongLamGiau[]; tuan: string | null }) {
  const columns: InsightColumn<DuongLamGiau>[] = [
    {
      id: "duong",
      header: "Đường",
      cell: ({ row }) => {
        const tap = row.original.kiemNay?.tap_do ?? row.original.kiemTruoc?.tap_do
        return (
          <span className="flex flex-col gap-0.5" data-duong={row.original.duong}>
            <span className="text-sm">{tenDuong(row.original.duong)}</span>
            {tap ? <span className="text-muted-foreground text-xs">{TEN_TAP_DO[tap] ?? tap}</span> : null}
          </span>
        )
      },
      size: 220,
    },
    { id: "nay", header: `Tuần này${tuan ? ` · ${tuan}` : ""}`, cell: ({ row }) => <OTuan d={row.original} k={row.original.kiemNay} tuan={tuan} nay />, size: 170 },
    { id: "nay_wilson", header: "Cận dưới Wilson", cell: ({ row }) => <OWilson k={row.original.kiemNay} />, size: 130 },
    { id: "truoc", header: "Tuần trước", cell: ({ row }) => <OTuan d={row.original} k={row.original.kiemTruoc} tuan={tuan} nay={false} />, size: 150 },
    { id: "truoc_wilson", header: "Cận dưới Wilson", cell: ({ row }) => <OWilson k={row.original.kiemTruoc} />, size: 130 },
    { id: "chenh", header: "Chênh", cell: ({ row }) => <OChenh k={row.original.kiemNay} truoc={row.original.kiemTruoc} />, size: 180 },
  ]
  return (
    <Panel title="Kiểm ngược theo tuần">
      <BangLuoi data={duong} columns={columns} getRowId={(d) => d.duong} bang="lam-giau-kiem" />
    </Panel>
  )
}

// ---------------- Lát (Thị trường · Phường/xã · Khu đô thị · Toà) ----------------
type DongLat = { duong: string; o: string; so: Record<string, number> }
/** Hai ô chưa gắn luôn hiện (kể cả 0), như BangLat của DO1; ô khác chỉ hiện khi có số. */
const hienO = (k: string, so: Record<string, number>) => k === "khong-tin-hieu" || k === "chua-co-danh-ba" || Object.values(so).some((n) => n > 0)

function dongLat<N extends string>(duong: string, lat: Partial<Record<N, Partial<Record<ChieuLat, { o: Record<string, number>; tong: number }>>>> | undefined,
  nhom: readonly N[], chieu: ChieuLat): DongLat[] {
  if (!lat || !nhom.some((n) => lat[n]?.[chieu])) return []
  const khoa = [...new Set(nhom.flatMap((n) => Object.keys(lat[n]?.[chieu]?.o ?? {})))]
  const ra = khoa.map((o) => ({ duong, o, so: Object.fromEntries(nhom.map((n) => [n, lat[n]?.[chieu]?.o[o] ?? 0])) }))
    .filter((r) => hienO(r.o, r.so))
  ra.push({ duong, o: "__tong__", so: Object.fromEntries(nhom.map((n) => [n, lat[n]?.[chieu]?.tong ?? 0])) })
  return ra
}

export function latThayDoi(duong: DuongLamGiau[], chieu: ChieuLat): DongLat[] {
  return duong.flatMap((d) => (coSo(d.homNay) ? dongLat(d.duong, d.homNay?.lat, NHOM_THAY_DOI, chieu) : []))
}
export function latKiem(duong: DuongLamGiau[], chieu: ChieuLat): DongLat[] {
  return duong.flatMap((d) => (coKiem(d.kiemNay) ? dongLat(d.duong, d.kiemNay.lat, NHOM_KIEM, chieu) : []))
}

const cotDuongO = (areaNames: Record<string, string>): InsightColumn<DongLat>[] => [
  { id: "duong", header: "Đường", cell: ({ row }) => <span className="text-sm" data-duong={row.original.duong}>{tenDuong(row.original.duong)}</span>, size: 180 },
  {
    id: "o",
    header: "Ô",
    cell: ({ row }) => (row.original.o === "__tong__"
      ? <span className="font-medium">Tổng</span>
      : <span data-o-lat={row.original.o}>{nhanO(row.original.o, areaNames)}</span>),
    size: 200,
  },
]
const cotSo = (id: string, header: string): InsightColumn<DongLat> =>
  ({ id, header, cell: ({ row }) => <span className="tabular-nums">{fmtInt(row.original.so[id] ?? 0)}</span>, size: 100 })

export function BangLatThayDoi({ rows, nhan, areaNames }: { rows: DongLat[]; nhan: string; areaNames: Record<string, string> }) {
  const columns = [...cotDuongO(areaNames), cotSo("song", "Đang mang"), cotSo("them", "Thêm"), cotSo("doi", "Đổi"), cotSo("may_rut", "Máy rút")]
  return (
    <Panel title={`Thay đổi theo ${nhan.toLowerCase()}`}>
      <BangLuoi data={rows} columns={columns} getRowId={(r) => `${r.duong}|${r.o}`} bang="lam-giau-lat-ngay" />
    </Panel>
  )
}

export function BangLatKiem({ rows, nhan, areaNames }: { rows: DongLat[]; nhan: string; areaNames: Record<string, string> }) {
  const columns: InsightColumn<DongLat>[] = [
    ...cotDuongO(areaNames), cotSo("dung", "Đúng"), cotSo("sai", "Sai"), cotSo("khong_ra", "Không ra"),
    {
      id: "ty_le",
      header: "Tỉ lệ đúng",
      cell: ({ row }) => {
        const mau = (row.original.so.dung ?? 0) + (row.original.so.sai ?? 0)
        if (mau < IT_MAU) return <Badge variant="secondary" data-it-mau="">ít mẫu · n={mau}</Badge>
        return <span className="tabular-nums">{fmtPct(row.original.so.dung / mau)} <span className="text-muted-foreground text-xs">n={fmtInt(mau)}</span></span>
      },
      size: 140,
    },
  ]
  return (
    <Panel title={`Kiểm ngược theo ${nhan.toLowerCase()}`}>
      <BangLuoi data={rows} columns={columns} getRowId={(r) => `${r.duong}|${r.o}`} bang="lam-giau-lat-kiem" />
    </Panel>
  )
}
