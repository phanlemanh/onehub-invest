"use client"

import { PageHeader } from "@/components/page/page-header"
import { StatTiles } from "@/components/page/stat-tiles"
import { fmtInt } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

import type { HangToa } from "@/lib/ops/registry/hang-toa"

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
    { title: "Toà", value: fmtInt(p.soToa), footer: p.toaChuaCan > 0 ? `${fmtInt(p.toaChuaCan)} toà chưa có căn` : "Mọi toà đã có căn" },
    { title: "Căn", value: fmtInt(p.soCan), footer: `${fmtInt(p.soTruc)} trục` },
    { title: "Tin đang rao", value: fmtInt(tin.reduce((a, [, n]) => a + n, 0)), footer: tin.map(([s, n]) => `${s} ${fmtInt(n)}`).join(" · ") || "Chưa có tin định vị tới dự án" },
  ]
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={crumbs} title={p.ten} stats={stats} description={moTa} />
      <div data-registry-tong="">
        <StatTiles items={oSo} />
      </div>
      <DuAnToaGrid rows={p.rows} />
    </div>
  )
}
