"use client"

import { useMemo } from "react"

import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderPanel,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader"
import { CascaderItems } from "@/components/reui/cascader/cascader-item"
import { CascaderBreadcrumb, CascaderInput, CascaderNav, CascaderValue } from "@/components/reui/cascader/cascader-nav"
import type { CascaderNode } from "@/components/reui/cascader/cascader-types"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { KindDeal, NutViTri, ThamSoDeal, TrangDeal } from "@/lib/deals-chi-tiet"
import { fmtInt } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

const TAT_CA = "all"
const LOAI = ["apartment", "house", "land", "room", "commercial"] as const
const O_LOAI = [
  { value: TAT_CA, label: "Mọi loại hình" },
  ...LOAI.map((v) => ({ value: v as string, label: (LABELS_VI.property_type as Record<string, string>)[v] ?? v })),
]
const CHU_CAY = {
  search: () => "Tìm tỉnh, phường, dự án",
  back: "Quay lại",
  empty: "Không có vị trí khớp.",
  loading: "Đang tải",
  rootLevel: "Tỉnh, thành",
  itemCount: () => "có mục con",
}

const sangNut = (n: NutViTri): CascaderNode => ({
  value: n.value,
  label: n.label,
  // Số căn đã ghi ở dòng mô tả; số 0 tắt con số trần cuối dòng của cây.
  count: 0,
  description: `${fmtInt(n.count)} căn`,
  keywords: [n.label.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D")],
  children: n.children?.map(sangNut),
})

/** Thanh lọc của danh sách đọc ở máy chủ: Bán hay Cho thuê, vị trí trên cây, loại hình. Mọi điều kiện nằm trên URL. */
export function DealsBoLoc({ trang, onDoi }: { trang: TrangDeal; onDoi: (p: Partial<ThamSoDeal>) => void }) {
  const { thamSo } = trang
  const items = useMemo(() => trang.cay.map(sangNut), [trang.cay])
  const viTri = thamSo.project ? `project:${thamSo.project}` : thamSo.location ? `area:${thamSo.location}` : ""
  const coLoc = Boolean(viTri || thamSo.type)
  const chonViTri = (v: string) => {
    const [loai, ma] = v.split(":")
    onDoi({ location: loai === "area" ? ma : null, project: loai === "project" ? ma : null, page: 1 })
  }
  return (
    <div className="flex flex-wrap items-center gap-2" data-deals-bo-loc="">
      <Tabs value={thamSo.kind} onValueChange={(v) => onDoi({ kind: v as KindDeal, location: null, project: null, page: 1 })}>
        <TabsList>
          <TabsTrigger value="sale">Bán</TabsTrigger>
          <TabsTrigger value="rent">Cho thuê</TabsTrigger>
        </TabsList>
      </Tabs>
      <Cascader
        items={items}
        value={viTri}
        onValueChange={chonViTri}
        selectable={(n) => !n.value.startsWith("nhom:")}
        searchScope="global"
        labels={CHU_CAY}
      >
        <CascaderTrigger aria-label="Chọn vị trí" render={<Button variant="outline" size="sm" />}>
          <CascaderValue placeholder="Mọi vị trí" display="leaf" />
        </CascaderTrigger>
        <CascaderContent className="w-80">
          <CascaderPanel>
            <CascaderNav>
              <CascaderInput />
            </CascaderNav>
            <CascaderBreadcrumb />
            <CascaderEmpty />
            <CascaderList>
              <CascaderItems />
            </CascaderList>
            <CascaderStatus />
          </CascaderPanel>
        </CascaderContent>
      </Cascader>
      <Select
        value={thamSo.type ?? TAT_CA}
        items={O_LOAI}
        onValueChange={(v) => onDoi({ type: v === TAT_CA ? null : String(v), page: 1 })}
      >
        <SelectTrigger size="sm" aria-label="Loại hình"><SelectValue /></SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {O_LOAI.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
      {coLoc && (
        <Button variant="ghost" size="sm" onClick={() => onDoi({ location: null, project: null, type: null, page: 1 })}>Xoá bộ lọc</Button>
      )}
    </div>
  )
}
