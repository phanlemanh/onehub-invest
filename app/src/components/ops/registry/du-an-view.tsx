"use client"

import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { StatTiles } from "@/components/page/stat-tiles"
import { fmtInt, fmtVnDate } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

import type { HangToa } from "@/lib/ops/registry/hang-toa"
import type { PhuThuocTinh } from "@/lib/ops/thuoc-tinh-can"

import { DuAnToaGrid } from "./du-an-toa-grid"

/** Đầu trang một dự án: tên, bậc, tỉnh, nguồn, mã đã nối; bốn ô số; bảng toà → căn. */
export type DuAnProps = {
  ten: string
  biDanh: string[]
  bac: string
  tinh: string | null
  nguon: string[]
  maNoi: string[]
  soPhanKhu: number
  soToa: number
  toaChuaCan: number
  soTruc: number
  soCan: number
  tin: Record<string, number>
  rows: HangToa[]
  /** Ô phủ thuộc tính căn S16 (DA40); null khi đọc lỗi. */
  phuThuocTinh: PhuThuocTinh | null
  loiThuocTinh: boolean
}

/** Ô phủ «căn có thuộc tính / căn trong danh bạ» — số đã đếm ở SQL, ở đây chỉ định dạng. */
function oPhu(p: PhuThuocTinh | null) {
  if (!p || p.trangThai === "khong-nguon") return []
  const thu = p.lanThu ? `S16 · thu ${fmtVnDate(p.lanThu)}` : "S16"
  return [
    { title: "Căn có thuộc tính", value: `${fmtInt(p.coThuocTinh)} / ${fmtInt(p.trongDanhBa)}`, footer: `Trên căn trong danh bạ · ${thu}` },
    { title: "Căn có giá chủ đầu tư", value: fmtInt(p.coGia), footer: "Giá niêm yết của chủ đầu tư, lần thu mới nhất" },
    { title: "Chưa vào danh bạ", value: fmtInt(p.chuaVaoDanhBa), footer: "Căn S16 có thuộc tính mà chưa có căn danh bạ" },
  ]
}

export function DuAnView(p: DuAnProps) {
  const crumbs = [{ label: "Vận hành", href: "/ops" }, { label: "Danh bạ", href: "/ops/registry" }, { label: p.ten }]
  const tin = Object.entries(p.tin).filter(([, n]) => n > 0)
  const stats = [
    (LABELS_VI.catalog_tier as Record<string, string>)[p.bac] ?? p.bac,
    p.tinh ?? "Chưa rõ tỉnh",
    p.nguon.length > 0 ? `Nguồn ${p.nguon.join(", ")}` : "Chưa nối nguồn danh mục",
  ]
  const moTa = [p.biDanh.length > 0 ? `Bí danh: ${p.biDanh.join(" · ")}` : null, p.maNoi.length > 0 ? `Mã đã nối: ${p.maNoi.join(" · ")}` : null]
    .filter(Boolean)
    .join(". ") || "Chưa có bí danh hay mã nguồn nối vào dự án."
  const oSo = [
    { title: "Phân khu", value: fmtInt(p.soPhanKhu), footer: "Phân khu và dự án con trong cây" },
    { title: "Toà", value: fmtInt(p.soToa), footer: p.soToa === 0 ? "Chưa có toà" : p.toaChuaCan > 0 ? `${fmtInt(p.toaChuaCan)} toà chưa có căn` : "Mọi toà đã có căn" },
    { title: "Căn", value: fmtInt(p.soCan), footer: `${fmtInt(p.soTruc)} trục` },
    { title: "Tin đang rao", value: fmtInt(tin.reduce((a, [, n]) => a + n, 0)), footer: tin.map(([s, n]) => `${s} ${fmtInt(n)}`).join(" · ") || "Chưa có tin định vị tới dự án" },
  ]
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={crumbs} title={p.ten} stats={stats} description={moTa} />
      <div data-registry-tong="">
        <StatTiles items={oSo} />
      </div>
      {p.phuThuocTinh?.trangThai === "co" && (
        <div data-thuoc-tinh-phu="co">
          <StatTiles items={oPhu(p.phuThuocTinh)} />
        </div>
      )}
      {p.phuThuocTinh?.trangThai === "khong-nguon" && (
        <p className="text-muted-foreground text-sm" data-thuoc-tinh-phu="khong-nguon">
          Chưa có nguồn thuộc tính căn cho dự án này.
        </p>
      )}
      {p.loiThuocTinh && (
        <Alert variant="destructive" data-thuoc-tinh-loi="">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Không tải được thuộc tính căn</AlertTitle>
          <AlertDescription>
            <p>Lưới toà và căn vẫn đúng; chỉ cột thuộc tính và ô phủ chưa đọc được.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
              Thử lại
            </Button>
          </AlertAction>
        </Alert>
      )}
      <DuAnToaGrid rows={p.rows} />
    </div>
  )
}
