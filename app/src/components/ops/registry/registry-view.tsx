"use client"

import { BookUserIcon } from "lucide-react"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { StatTiles } from "@/components/page/stat-tiles"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { fmtInt } from "@/lib/format"
import type { HangCay } from "@/lib/ops/registry/cay"
import type { MaChuaNoi, TongDanhBa } from "@/lib/ops/registry/doc"

import { RegistryChuaNoi } from "./registry-chua-noi"
import { RegistryGrid } from "./registry-grid"

/**
 * /ops/registry «Danh bạ» (`trang-danh-ba-chi-doc`) — cây dự án → phân khu → toà → căn, chỉ đọc, chỉ ở máy thu.
 * Dải số đầu trang, bảng cây có lọc, rồi mã dự án nguồn chưa nối.
 */

export const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Danh bạ" }]
const DESCRIPTION = "Dự án, phân khu, toà và căn mà danh bạ đang giữ, kèm nguồn, bậc và tin đang rao. Chỉ đọc."
export const LENH_DUNG = "node pipeline/noi-du-an-s06.mjs"

export type RegistryProps =
  | { mode: "cloud" }
  | { mode: "local"; tong: TongDanhBa; rows: HangCay[]; chuaNoi: MaChuaNoi[] }

function DanhBaRong() {
  return (
    <Empty className="border" data-registry-empty="danh-ba">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookUserIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Danh bạ chưa có dự án</EmptyTitle>
        <EmptyDescription>
          Nạp cây dự án bằng lệnh <code className="font-mono text-xs">{LENH_DUNG}</code> trên máy thu.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** Bốn ô số đầu trang — mỗi ô một câu hỏi quản lý: có bao nhiêu, bao nhiêu chắc chắn, bao nhiêu còn thiếu. */
export function oSo(tong: TongDanhBa) {
  const chuaNoi = tong.danhMuc.reduce((a, d) => a + d.chuaNoi, 0)
  return [
    { title: "Dự án", value: fmtInt(tong.duAn), footer: `${fmtInt(tong.duAnXacMinh)} đã xác minh · ${fmtInt(tong.phanKhu)} phân khu` },
    { title: "Toà", value: fmtInt(tong.toa), footer: `${fmtInt(tong.toaCoCan)} toà có căn · ${fmtInt(tong.truc)} trục` },
    { title: "Căn", value: fmtInt(tong.can), footer: `Ở ${fmtInt(tong.toaCoCan)} toà` },
    {
      title: "Mã nguồn chưa nối",
      value: fmtInt(chuaNoi),
      footer:
        [
          ...tong.danhMuc.map((d) => `${d.source} ${fmtInt(d.chuaNoi)}/${fmtInt(d.daNap)}`),
          tong.toaBiDanhS09 > 0 ? `S09 đã cấp tên ${fmtInt(tong.toaBiDanhS09)} toà` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Chưa nạp danh mục nào",
    },
  ]
}

export function RegistryView(props: RegistryProps) {
  if (props.mode === "cloud") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={CRUMBS} title="Danh bạ" stats={[]} description={DESCRIPTION} />
        <LocalOnlyAlert title="Chỉ ở máy thu">
          Danh bạ dự án, toà, căn chưa lên máy chủ. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      </div>
    )
  }
  const { tong, rows, chuaNoi } = props
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={CRUMBS} title="Danh bạ" stats={[]} description={DESCRIPTION} />
      <div data-registry-tong="">
        <StatTiles items={oSo(tong)} />
      </div>
      {rows.length === 0 ? <DanhBaRong /> : <RegistryGrid rows={rows} />}
      <RegistryChuaNoi rows={chuaNoi} />
    </div>
  )
}
