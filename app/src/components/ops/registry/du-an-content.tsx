import { notFound } from "next/navigation"

import { localOnlyTable } from "@/lib/ops-queries"
import { maskSourceNames } from "@/lib/mask-source-names"
import { dungCay } from "@/lib/ops/registry/cay"
import { docDuAn } from "@/lib/ops/registry/du-an"
import { getSourceNameEntries } from "@/lib/source-roles"

import { RegistryView } from "./registry-view"
import { DuAnView } from "./du-an-view"
import type { HangToa } from "./du-an-toa-grid"

/**
 * Nội dung /ops/registry/[nodeId]. Cloud hay DB thiếu bảng vật thể → cảnh báo «Chỉ ở máy thu» như trang danh sách.
 * Nút không phải dự án gốc → 404. Tên toà, tên phân khu qua bộ che tên nguồn ở máy chủ.
 */
export async function DuAnContent({ id }: { id: number }) {
  if (process.env.VERCEL === "1" || (await localOnlyTable("buildings"))) return <RegistryView mode="cloud" />
  const [duAn, entries] = await Promise.all([docDuAn(id), getSourceNameEntries()])
  if (!duAn) notFound()
  const che = (s: string) => maskSourceNames(s, entries) ?? "—"
  const goc = dungCay(duAn.nut, {}, entries)[0]
  const nutGoc = duAn.nut.find((n) => n.id === id)
  if (!goc || !nutGoc) notFound()
  const tenNut = new Map(duAn.nut.map((n) => [n.id, che(n.ten)]))
  const canTheoToa = new Map<string, HangToa[]>()
  for (const c of duAn.can) {
    const phu = [c.tang ? `Tầng ${c.tang}` : null, c.truc ? `Trục ${c.truc}` : null].filter(Boolean).join(" · ")
    const hang: HangToa = { key: c.key, laCan: true, ten: c.ma ?? c.key, phu, bac: c.bac, nguon: c.nguon, soTruc: null, soCan: null }
    canTheoToa.set(c.toaKey, [...(canTheoToa.get(c.toaKey) ?? []), hang])
  }
  const rows: HangToa[] = duAn.toa.map((t) => {
    const can = canTheoToa.get(t.key)
    return {
      key: t.key,
      laCan: false,
      ten: t.ten.map(che).join(" · ") || t.maNguon[0] || t.key,
      phu: [t.nutId === id ? null : tenNut.get(t.nutId), t.maNguon.length > 0 ? `Mã ${t.maNguon.join(", ")}` : null].filter(Boolean).join(" · "),
      bac: t.bac,
      nguon: t.nguon,
      soTruc: t.soTruc,
      soCan: t.soCan,
      ...(can ? { subRows: can } : {}),
    }
  })
  const tinh = nutGoc.tinhId
  return (
    <DuAnView
      ten={goc.ten}
      biDanh={goc.biDanh}
      bac={goc.bac}
      tinh={tinh ? (duAn.tinh[tinh] ?? null) : null}
      nguon={goc.nguon}
      maNoi={duAn.maNoi.map((m) => `${m.source} ${m.ma}`)}
      soPhanKhu={goc.soPhanKhu}
      soToa={goc.soToa}
      toaChuaCan={goc.toaChuaCan}
      soTruc={duAn.toa.reduce((a, t) => a + t.soTruc, 0)}
      soCan={goc.soCan}
      tin={goc.tin}
      rows={rows}
    />
  )
}
