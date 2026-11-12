"use client"

// Lưới "All connections" của solution-dev-ops-6 cho sức khoẻ từng nguồn S0x.
import { useMemo, useState } from "react"
import Link from "next/link"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import { fmtAge, fmtOverdue } from "@/lib/freshness"
import type { SourceFeedHealth } from "@/lib/ops-queries"
import { sourceStatusLabel } from "@/lib/ops-labels"
import { RawLabel } from "@/components/ops/raw-label"
import { Button } from "@/components/ui/button"
import type { Vai } from "@/lib/auth"
import { BAC_VAI, DANG_CHO, nutNguon, trangThaiHieuLuc, type LenhHien } from "@/lib/lenh-hien"

import { LenhNguonDialog } from "./lenh-nguon-dialog"

import { FEED_STATE, feedState } from "./feed-status"
import { StatusGrid, type StatusTab } from "./status-grid"

const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }
const TABS: StatusTab<SourceFeedHealth>[] = (["late", "stopped", "ok"] as const).map((s) => ({
  value: s,
  label: FEED_STATE[s].label,
  tone: FEED_STATE[s].tone,
  match: (f) => feedState(f) === s,
}))

/** `stale`: số là lần đo cuối của bản tin máy local cũ quá 45′ (ON3) — không badge trạng thái xanh. */
/** ON6 (luật 5, Hỏi-1): số bản ghi S02 chỉ ở /ops/quality — ô số của hàng S02 trỏ sang đó, không hiện số. */
const isS02 = (f: SourceFeedHealth) => f.code === "S02"
function XemChatLuong() {
  return (
    <Link href="/ops/quality" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
      Xem Chất lượng
    </Link>
  )
}

/**
 * Cột Thao tác (TV4b): có khi vai ≥ ops. Nút theo trạng thái HIỆU LỰC (bản tin + lệnh đã áp sau mốc bản tin), không theo
 * badge cột Trạng thái (badge vẫn đọc bản tin 15′ — OOS-3).
 */
export type ThaoTacNguon = { vai: Vai; lenh: LenhHien[]; factsPushedAt: string | null; onDaGui: () => void }

function OThaoTac({ f, thaoTac, onMo }: { f: SourceFeedHealth; thaoTac: ThaoTacNguon; onMo: (loai: "pause" | "resume") => void }) {
  const cua = thaoTac.lenh.filter((l) => l.target === f.code)
  const q = nutNguon(thaoTac.vai, trangThaiHieuLuc(f.status, thaoTac.factsPushedAt, cua), cua.some((l) => DANG_CHO.includes(l.status)))
  if (q.ghi_chu) return <Badge variant="warning-light">{q.ghi_chu}</Badge>
  if (!q.nut) return null
  const loai = q.nut
  return (
    <Button size="sm" variant="outline" onClick={() => onMo(loai)}>
      {loai === "pause" ? "Tạm dừng" : "Bật lại"}
    </Button>
  )
}

export function FeedsGrid({ feeds, stale = false, thaoTac }: { feeds: SourceFeedHealth[]; stale?: boolean; thaoTac?: ThaoTacNguon }) {
  const [mo, setMo] = useState<{ code: string; loai: "pause" | "resume" } | null>(null)
  const coCot = thaoTac !== undefined && BAC_VAI[thaoTac.vai] >= BAC_VAI.ops
  const columns = useMemo<InsightColumn<SourceFeedHealth>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        header: ({ column }) => <DataGridColumnHeader title="Nguồn" column={column} />,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="font-mono">{row.original.code}</span>
            <span className="text-muted-foreground truncate">{row.original.labelVi}</span>
          </span>
        ),
        size: 200,
        enableSorting: true,
      },
      {
        id: "state",
        accessorFn: (f) => feedState(f),
        header: "Trạng thái",
        cell: ({ row }) => {
          const s = FEED_STATE[feedState(row.original)]
          return <Badge variant={stale && s.variant === "success-light" ? "outline" : s.variant}>{row.original.status !== "active" ? <RawLabel n={sourceStatusLabel(row.original.status)} raw={row.original.status} /> : s.label}</Badge>
        },
        size: 120,
      },
      {
        id: "last",
        accessorFn: (f) => f.lastRunAt ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Chạy cuối" column={column} />,
        cell: ({ row }) => fmtVnDateTime(row.original.lastRunAt),
        size: 150,
        enableSorting: true,
      },
      {
        id: "fresh",
        accessorFn: (f) => f.freshnessHrs ?? Number.POSITIVE_INFINITY,
        header: ({ column }) => <DataGridColumnHeader title="Độ tươi" column={column} />,
        cell: ({ row }) => (
          <>
            {fmtAge(row.original.freshnessHrs)}
            {row.original.sloHours ? <span className="text-muted-foreground"> / {fmtAge(row.original.sloHours)}</span> : null}
            {fmtOverdue(row.original.freshnessHrs, row.original.sloHours) ? <span> · {fmtOverdue(row.original.freshnessHrs, row.original.sloHours)}</span> : null}
          </>
        ),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      { id: "n24", accessorKey: "items24h", header: "24h", cell: ({ row }) => (isS02(row.original) ? <XemChatLuong /> : row.original.items24h ? fmtInt(row.original.items24h) : "—"), size: 90, meta: NUM },
      { id: "stg", accessorKey: "stgRows", header: "Staging", cell: ({ row }) => (isS02(row.original) ? <XemChatLuong /> : row.original.stgRows ? fmtInt(row.original.stgRows) : "—"), size: 100, meta: NUM },
      { id: "offers", accessorFn: (f) => f.offers ?? -1, header: "Tin rao", cell: ({ row }) => (isS02(row.original) ? <XemChatLuong /> : fmtInt(row.original.offers)), size: 100, meta: NUM },
      ...(coCot && thaoTac
        ? [
            {
              id: "thao-tac",
              header: "Thao tác",
              cell: ({ row }) => <OThaoTac f={row.original} thaoTac={thaoTac} onMo={(loai) => setMo({ code: row.original.code, loai })} />,
              size: 150,
            } satisfies InsightColumn<SourceFeedHealth>,
          ]
        : []),
    ],
    [stale, coCot, thaoTac]
  )
  return (
    <>
    <StatusGrid
      id="nguon"
      title="Sức khoẻ nguồn"
      description="Kênh nào sống, chết hay trễ SLO — theo mã nguồn"
      data={feeds}
      columns={columns}
      tabs={TABS}
      getRowId={(f) => f.code}
    />
    {mo && thaoTac ? (
      <LenhNguonDialog
        code={mo.code}
        loai={mo.loai}
        open
        onOpenChange={(o) => {
          if (!o) setMo(null)
        }}
        onDaGui={thaoTac.onDaGui}
      />
    ) : null}
    </>
  )
}
