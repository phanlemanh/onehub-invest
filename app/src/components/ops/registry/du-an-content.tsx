import { notFound } from "next/navigation"

import { localOnlyTable } from "@/lib/ops-queries"
import { maskSourceNames } from "@/lib/mask-source-names"
import { dungCay } from "@/lib/ops/registry/cay"
import { docDuAn } from "@/lib/ops/registry/du-an"
import { dungHangToa } from "@/lib/ops/registry/hang-toa"
import { getSourceNameEntries } from "@/lib/source-roles"

import { RegistryView } from "./registry-view"
import { DuAnView } from "./du-an-view"

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
  const rows = dungHangToa(duAn, id, entries)
  const tinh = nutGoc.tinhId
  return (
    <DuAnView
      ten={goc.ten}
      biDanh={goc.biDanh}
      bac={goc.bac}
      tinh={tinh ? (duAn.tinh[tinh] ?? null) : null}
      nguon={goc.nguon}
      maNoi={duAn.maNoi.map((m) => `${m.source} ${che(m.ma)}`)}
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
