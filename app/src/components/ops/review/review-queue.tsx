"use client"

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { InboxIcon, PlayIcon, TriangleAlertIcon } from "lucide-react"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { toast } from "sonner"
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
import { Alert, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DATA_GRID_VI } from "@/components/insight/insight-grid"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import type { ReviewContext } from "@/lib/ops/review-context"
import type { QuyetGanDay } from "@/lib/ops/review-gan-day"
import { REVIEW_CATEGORY_LABEL } from "@/lib/ops/review-hang-muc"
import { hangDuyet, hopHangMuc, locTheoHop, mucKe, TAT_CA, type HopChon } from "@/lib/ops/review-hop-hang-muc"
import type { ReviewMedia } from "@/lib/ops/review-media"
import type { NhipHangMuc } from "@/lib/ops/review-nhip"
import {
  DEFAULT_STATUS_FILTER,
  filterReviewItems,
  STATUS_FILTERS,
  type ReviewItem,
  type StatusFilter,
} from "@/lib/ops/review-queue"

import { HangGuiProvider, HOAN_TAC_MS, type LenhQuyet, type TinhTrangGui } from "./hang-gui"
import { ReviewStatusBadge, ReviewTypeBadge } from "./review-badges"
import { ReviewDetailSheet, type DieuHuong, type HetThe } from "./review-detail-sheet"
import { ReviewGanDay } from "./review-gan-day"
import { ReviewHopHangMuc } from "./review-hop-hang-muc"
import { ReviewPhimTat } from "./review-phim-tat"
import { bamDapAn, usePhimDuyet } from "./use-phim-duyet"

const PAGE_SIZE = 20

/** Báo tin của chế độ duyệt: «ghi» (đã xếp lệnh, có Hoàn tác), «loi» (route lỗi, có Mở thẻ), «tin» (chỉ chữ). */
export type BaoTin = (loai: "ghi" | "loi" | "tin", chu: string, hanh?: { label: string; onClick: () => void }) => void
const baoSonner: BaoTin = (loai, chu, hanh) => {
  if (loai === "loi") return void toast.error(chu, hanh ? { action: hanh } : undefined)
  toast(chu, { ...(loai === "ghi" ? { duration: HOAN_TAC_MS } : {}), ...(hanh ? { action: hanh } : {}) })
}

/** Tin trả lời «Hoàn tác» bấm khi lệnh đã rời hàng chờ (od2-phim-va-loi-ghi AC-2): chỉ nói «đã ghi» khi route đã trả 200. */
function tinHoanTacMuon(id: number, tt: TinhTrangGui, moLai: (id: number) => void): Parameters<BaoTin> {
  if (tt === "da-ghi") return ["tin", `#${id} đã ghi — quá 5 giây, không hoàn tác được`]
  if (tt === "loi") return ["loi", `#${id} chưa ghi được — thẻ vẫn chờ duyệt`, { label: "Mở thẻ", onClick: () => moLai(id) }]
  return ["tin", `#${id} đang gửi — không hoàn tác được`]
}

/** Ghi `?category=` vào URL không tải lại trang (App Router đồng bộ với history API); «Tất cả» → bỏ tham số. */
function ghiCategory(chon: HopChon) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (chon === TAT_CA) url.searchParams.delete("category")
  else url.searchParams.set("category", chon)
  window.history.replaceState(window.history.state, "", url)
}

/**
 * Hàng chờ /ops/review (UI1 → OD2) — chuyển thể @reui/solution-agents-5 (approval-queue + request-detail-sheet), thêm hộp
 * hạng mục bên trái theo cột trái của @reui/solution-agents-9 (OD2 · ĐC3): chọn hạng mục thay ô lọc «Loại thẻ».
 * Chế độ duyệt (ĐC4): «Duyệt liền» hay bấm một thẻ chờ mở sheet; quyết xong, thẻ kế cùng hạng mục hiện trong CÙNG sheet
 * (cũ nhất trước — Hỏi-1); phím J/K/1–4/R/?. Hoàn tác 5 giây (ĐC5): lệnh giữ ở trình duyệt (`HangGuiProvider`).
 * Không cột độ tự tin (Q9) — `ReviewItem` không mang số đó.
 */
export function ReviewQueue({ items, media, context = {}, moBanDau = null, pace = [], category = TAT_CA, ganDay = null, baoTin = baoSonner, moTheQuaUrl }: {
  items: ReviewItem[]
  media: Record<number, ReviewMedia>
  context?: Record<number, ReviewContext>
  /** `?card=<id>` (OD1 · ĐC7): thẻ có trong hàng duyệt → sheet mở sẵn, bất kể trang và bộ lọc; không có → Alert. */
  moBanDau?: { id: number | null; raw: string } | null
  /** Nhịp duyệt 7 ngày (OD1) — hộp hạng mục mượn trung vị giây ở thẻ. */
  pace?: NhipHangMuc[]
  /** `?category=` đã đọc (OD2 · ĐC3). */
  category?: HopChon
  /** Quyết định gần đây của chính người duyệt (ĐC5); null → không hiện Frame (thẻ dựng riêng, test cũ). */
  ganDay?: QuyetGanDay[] | null
  /** Báo tin (mặc định toast sonner); test truyền hàm ghi lại để bấm thẳng «Hoàn tác». */
  baoTin?: BaoTin
  /** «Mở thẻ» sau khi hàng duyệt đã gỡ — người đã sang trang Ops khác (mặc định router tới liên kết thẻ `/ops/review?card=<id>`). */
  moTheQuaUrl?: (id: number) => void
}) {
  const [chon, setChon] = useState<HopChon>(category)
  const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS_FILTER)
  // Tìm trong `items` (cả hàng duyệt), không trong hàng đang lọc — thẻ đã quyết vẫn mở được.
  const theCanMo = (m: typeof moBanDau) => (m?.id != null && items.some((i) => i.id === m.id) ? m.id : null)
  const [openId, setOpenId] = useState<number | null>(() => theCanMo(moBanDau))
  // Bấm liên kết `?card=` ngay trên trang (vd «Mở thẻ chờ cũ nhất»): App Router giữ cây client, chỉ đổi prop — mở theo prop
  // mới trong lúc vẽ (khuôn «giữ prop trước» của React), không dùng effect.
  const [cardTruoc, setCardTruoc] = useState(moBanDau?.raw ?? null)
  if ((moBanDau?.raw ?? null) !== cardTruoc) {
    setCardTruoc(moBanDau?.raw ?? null)
    setOpenId(theCanMo(moBanDau))
  }
  const thieuThe = moBanDau !== null && (moBanDau.id === null || !items.some((i) => i.id === moBanDau.id))
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  /** Thẻ đã bấm đáp án, đang trong 5 giây chờ gửi hay đã gửi mà trang chưa làm mới — rời hàng duyệt ngay. */
  const [dangGui, setDangGui] = useState<ReadonlySet<number>>(new Set())
  const [het, setHet] = useState(false)
  const [phimMo, setPhimMo] = useState(false)

  const hop = useMemo(() => hopHangMuc(items, pace), [items, pace])
  const tongCho = useMemo(() => items.filter((i) => i.status === "pending").length, [items])
  const rows = useMemo(() => filterReviewItems(locTheoHop(items, chon), "all", status), [items, chon, status])
  const hang = useMemo(() => hangDuyet(items, chon, dangGui), [items, chon, dangGui])
  // Thẻ đang mở đọc từ `items` (không từ `rows`): quyết xong, router.refresh() đổi trạng thái → thẻ rời bộ lọc
  // «Chờ duyệt» nhưng sheet vẫn hiện kết quả cho tới khi người đóng.
  const open = openId === null ? null : (items.find((i) => i.id === openId) ?? null)
  // Bản mới nhất của hàng và thẻ đang mở cho nhịp `onXep` (gọi từ hàng chờ gửi, ngoài lượt vẽ).
  const hangRef = useRef(hang)
  const openRef = useRef(openId)
  useEffect(() => {
    hangRef.current = hang
    openRef.current = openId
  })

  const moThe = useCallback((id: number) => {
    setHet(false)
    setOpenId(id)
  }, [])
  // Kết quả lệnh xả về SAU khi hàng duyệt bị gỡ (chuyển route trong app): «Mở thẻ» lúc ấy không còn sheet để mở.
  const ganRef = useRef(false)
  useEffect(() => {
    ganRef.current = true
    return () => {
      ganRef.current = false
    }
  }, [])
  // Đọc router không bắt buộc (useRouter ném khi không có App Router — trang dựng tĩnh trong bộ thử theo vai): chỉ cần nó
  // ở đường muộn «Mở thẻ» sau khi hàng duyệt đã gỡ, lúc ấy trang luôn chạy trong App Router.
  const router = useContext(AppRouterContext)
  const moQuaUrl = useCallback((id: number) => (moTheQuaUrl ? moTheQuaUrl(id) : router?.push(`/ops/review?card=${id}`)), [moTheQuaUrl, router])
  const moLai = useCallback((id: number) => (ganRef.current ? moThe(id) : moQuaUrl(id)), [moThe, moQuaUrl])
  const dong = () => {
    setOpenId(null)
    setHet(false)
  }
  const chonMuc = (c: HopChon) => {
    setChon(c)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    ghiCategory(c)
  }
  const duyetLien = () => {
    const dau = hang[0]
    if (dau) moThe(dau.id)
  }

  // Ba nhịp của hàng chờ gửi. Thẻ vừa bấm rời hàng duyệt ngay; thẻ kế = thẻ đứng sau nó trong hàng lúc bấm.
  const onXep = useCallback((lenh: LenhQuyet, hoanTac: () => boolean, tinhTrang: () => TinhTrangGui) => {
    const truoc = hangRef.current
    const i = truoc.findIndex((t) => t.id === lenh.id)
    const con = truoc.filter((t) => t.id !== lenh.id)
    const ke = con[Math.max(i, 0)] ?? con[0] ?? null
    setDangGui((s) => new Set(s).add(lenh.id))
    if (openRef.current === lenh.id) {
      setOpenId(ke?.id ?? null)
      setHet(ke === null)
    }
    baoTin("ghi", `Đã ghi #${lenh.id} · ${lenh.nhan}`, {
      label: "Hoàn tác",
      onClick: () => {
        // Lệnh đã gửi (toast còn hiện vì chuột đè lên quá 5 giây, hay hàng duyệt đã gỡ) → không đưa thẻ trở lại; báo đúng
        // tình trạng của lệnh — đang gửi, đã ghi, hay lỗi.
        if (!hoanTac()) return baoTin(...tinHoanTacMuon(lenh.id, tinhTrang(), moLai))
        setDangGui((s) => {
          const n = new Set(s)
          n.delete(lenh.id)
          return n
        })
        moThe(lenh.id)
      },
    })
  }, [moThe, moLai, baoTin])
  const onXong = useCallback((lenh: LenhQuyet) => lenh.lamMoi(), [])
  const onLoi = useCallback((lenh: LenhQuyet, loi: string) => {
    setDangGui((s) => {
      const n = new Set(s)
      n.delete(lenh.id)
      return n
    })
    baoTin("loi", `Không ghi được #${lenh.id}: ${loi}`, { label: "Mở thẻ", onClick: () => moLai(lenh.id) })
  }, [moLai, baoTin])

  // Thanh điều hướng: chỉ khi thẻ đang mở nằm trong hàng duyệt (thẻ đã quyết mở để xem lại thì không).
  const viTri = open ? hang.findIndex((t) => t.id === open.id) : -1
  const dieuHuong: DieuHuong | null = viTri < 0 ? null : {
    viTri: viTri + 1,
    tong: hang.length,
    nhan: chon === TAT_CA ? "Tất cả" : REVIEW_CATEGORY_LABEL[chon],
    onTruoc: viTri > 0 ? () => moThe(hang[viTri - 1].id) : null,
    onSau: viTri < hang.length - 1 ? () => moThe(hang[viTri + 1].id) : null,
    onPhim: () => setPhimMo(true),
  }
  const ke = het ? mucKe(hop, chon, (c) => hangDuyet(items, c, dangGui).length > 0) : null
  const hetThe: HetThe | null = !het ? null : {
    nhanKe: ke?.nhan ?? null,
    onKe: () => {
      if (!ke) return dong()
      chonMuc(ke.ma)
      const dau = hangDuyet(items, ke.ma, dangGui)[0]
      if (dau) moThe(dau.id)
    },
  }

  usePhimDuyet((open !== null || het) && !phimMo, {
    sau: () => dieuHuong?.onSau?.(),
    truoc: () => dieuHuong?.onTruoc?.(),
    dapAn: (n) => void bamDapAn(document.querySelector("[data-review-sheet]"), n),
    vaoLyDo: () => document.querySelector<HTMLTextAreaElement>("[data-review-sheet] [data-review-reason]")?.focus(),
    moBangPhim: () => setPhimMo(true),
  })

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
                moThe(row.original.id)
              }}
            >
              <span className="truncate" translate="no">{row.original.title}</span>
            </Button>
            <div className="flex flex-wrap items-center gap-1.5 ps-2">
              <span className="text-muted-foreground text-xs tabular-nums">#{row.original.id}</span>
              {/* Màn hẹp: cột Loại/Trạng thái nằm ngoài khung nhìn (bảng cuộn ngang) — nhắc lại ngay dưới tên thẻ. */}
              <span className="flex items-center gap-1.5 sm:hidden">
                <ReviewTypeBadge item={row.original} />
                <ReviewStatusBadge item={row.original} />
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
        cell: ({ row }) => <ReviewTypeBadge item={row.original} />,
        size: 130,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <ReviewStatusBadge item={row.original} />,
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
    [moThe],
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (r) => String(r.id),
    state: { pagination },
    onPaginationChange: setPagination,
  })

  const isDefault = chon === TAT_CA && status === DEFAULT_STATUS_FILTER
  const reset = () => {
    chonMuc(TAT_CA)
    setStatus(DEFAULT_STATUS_FILTER)
  }

  if (items.length === 0) return <ReviewQueueEmpty />

  return (
    <HangGuiProvider onXep={onXep} onXong={onXong} onLoi={onLoi}>
    {thieuThe && (
      <Alert variant="warning" data-review-card-thieu>
        <TriangleAlertIcon aria-hidden />
        <AlertTitle>Không tìm thấy thẻ #{moBanDau?.raw}</AlertTitle>
      </Alert>
    )}
    <Frame spacing="default" className="@container w-full min-w-0">
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <FrameTitle role="heading" aria-level={2}>Danh sách thẻ</FrameTitle>
          <FrameDescription data-queue-count={rows.length}>
            <span className="tabular-nums">{fmtInt(rows.length)}</span> thẻ
          </FrameDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Trạng thái"
            value={status}
            options={STATUS_FILTERS}
            onChange={(v) => {
              setStatus(v)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
          />
          <Button size="sm" onClick={duyetLien} disabled={hang.length === 0} data-review-duyet-lien>
            <PlayIcon data-icon="inline-start" aria-hidden />
            Duyệt liền
          </Button>
        </div>
      </FrameHeader>
      <FramePanel className="p-0">
        <div className="grid min-w-0 grid-cols-1 @4xl:grid-cols-[16rem_minmax(0,1fr)]">
          <ReviewHopHangMuc hop={hop} chon={chon} tongCho={tongCho} onChon={chonMuc} />
          <div className="min-w-0 p-3">
            <DataGrid
              table={table}
              recordCount={rows.length}
              i18n={DATA_GRID_VI}
              onRowClick={(r) => moThe(r.id)}
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
          </div>
        </div>
      </FramePanel>
      <ReviewDetailSheet
        item={open}
        media={open ? media[open.id] : undefined}
        context={open ? context[open.id] : undefined}
        onOpenChange={(o) => !o && dong()}
        dieuHuong={dieuHuong}
        het={hetThe}
      />
      <ReviewPhimTat open={phimMo} onOpenChange={setPhimMo} />
    </Frame>
    {ganDay && <ReviewGanDay rows={ganDay} onDuyetLien={hang.length > 0 ? duyetLien : undefined} />}
    </HangGuiProvider>
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
