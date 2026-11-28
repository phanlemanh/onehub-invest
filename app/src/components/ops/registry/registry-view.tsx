"use client"

import { BookUserIcon, CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { StatTiles } from "@/components/page/stat-tiles"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { fmtInt } from "@/lib/format"
import type { HangCay } from "@/lib/ops/registry/cay"
import type { MaChuaNoi, TongDanhBa } from "@/lib/ops/registry/doc"
import type { QuyCanTong } from "@/lib/ops/registry/quy-can"

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
  | { mode: "local"; tong: TongDanhBa; rows: HangCay[]; chuaNoi: MaChuaNoi[]; quyCan?: QuyCanTong | null | "loi" }

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
  // Nguồn không có vị trí (S10) không cộng vào ô: không nối được theo luật chặn cùng tỉnh (DA3 AC-8); hiện riêng kèm lý do.
  const vaoO = tong.danhMuc.filter((d) => d.tinhVaoO)
  const rieng = tong.danhMuc.filter((d) => !d.tinhVaoO)
  const chuaNoi = vaoO.reduce((a, d) => a + d.chuaNoi, 0)
  return [
    { title: "Dự án", value: fmtInt(tong.duAn), footer: `${fmtInt(tong.duAnXacMinh)} đã xác minh · ${fmtInt(tong.phanKhu)} phân khu` },
    { title: "Toà", value: fmtInt(tong.toa), footer: `${fmtInt(tong.toaCoCan)} toà có căn · ${fmtInt(tong.truc)} trục` },
    { title: "Căn", value: fmtInt(tong.can), footer: `Ở ${fmtInt(tong.toaCoCan)} toà` },
    {
      title: "Mã nguồn chưa nối",
      value: fmtInt(chuaNoi),
      footer:
        [
          ...vaoO.map((d) =>
            d.noiUngVien > 0
              ? `${d.source} ${fmtInt(d.chuaNoi)}/${fmtInt(d.daNap)} (${fmtInt(d.noiUngVien)} vào nút ứng viên)`
              : `${d.source} ${fmtInt(d.chuaNoi)}/${fmtInt(d.daNap)}`,
          ),
          ...rieng.map((d) => `${d.source} ${fmtInt(d.chuaNoi)}/${fmtInt(d.daNap)} ${d.lyDoRieng ?? "không cộng vào ô"}`),
          tong.toaBiDanhS09 > 0 ? `S09 đã cấp tên ${fmtInt(tong.toaBiDanhS09)} toà` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "Chưa nạp danh mục nào",
    },
  ]
}

/** Ô «Quỹ căn S09» (DA56): số căn quỹ căn bản đủ mới nhất; dòng phụ chia dự án theo trạng thái nối, ba số cộng bằng số dự án. */
export function oQuyCan(qc: QuyCanTong) {
  return {
    title: "Căn CĐT đang bán S09",
    value: fmtInt(qc.can),
    footer: `${fmtInt(qc.coGia)} có giá · ${fmtInt(qc.duAn)} dự án: ${fmtInt(qc.noi)} nối nút · ${fmtInt(qc.theChua)} còn thẻ · ${fmtInt(qc.ngoaiDanhMuc)} chưa có trong danh mục`,
  }
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
  const { tong, rows, chuaNoi, quyCan } = props
  const oTong = quyCan && quyCan !== "loi" ? [...oSo(tong), oQuyCan(quyCan)] : oSo(tong)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={CRUMBS} title="Danh bạ" stats={[]} description={DESCRIPTION} />
      <div data-registry-tong="">
        <StatTiles items={oTong} />
      </div>
      {quyCan === "loi" && (
        <Alert variant="destructive" data-quy-can-loi="">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Không tải được căn CĐT đang bán S09</AlertTitle>
          <AlertDescription>
            <p>Danh bạ vẫn đúng; chỉ ô căn CĐT đang bán chưa đọc được.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
              Thử lại
            </Button>
          </AlertAction>
        </Alert>
      )}
      {rows.length === 0 ? <DanhBaRong /> : <RegistryGrid rows={rows} />}
      <RegistryChuaNoi rows={chuaNoi} />
    </div>
  )
}
