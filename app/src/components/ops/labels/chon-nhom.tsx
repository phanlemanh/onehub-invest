"use client"

import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fmtInt } from "@/lib/format"
import type { NhomCuaLat } from "@/lib/labels-queries"

/** Bộ chọn nhóm kèm tiến độ của người gọi, ở đầu trang để biểu mẫu vừa một màn. Đổi nhóm là đổi URL, nên tải lại vẫn đúng nhóm. */
export function ChonNhom({ nhom, chon, hrefNhom }: { nhom: NhomCuaLat[]; chon: string; hrefNhom: (unitCode: string) => string }) {
  const g = nhom.find((x) => x.unitCode === chon) ?? nhom[0]
  const items = nhom.map((x) => ({ value: x.unitCode, label: x.ten }))
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-96" data-labels-nhom={g.unitCode}>
      <Select value={g.unitCode} items={items} onValueChange={(v) => window.location.assign(hrefNhom(String(v)))}>
        <SelectTrigger className="w-full" aria-label="Chọn nhóm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          <SelectGroup>
            {nhom.map((x) => (
              <SelectItem key={x.unitCode} value={x.unitCode}>
                {x.ten} · {fmtInt(x.cuaToi)}/{fmtInt(x.tong)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex min-w-0 items-center gap-2">
        <Progress value={g.tong ? (g.cuaToi / g.tong) * 100 : 0} aria-label="Tiến độ của nhóm" className="flex-1" />
        <span className="text-muted-foreground text-xs tabular-nums">
          {fmtInt(g.cuaToi)}/{fmtInt(g.tong)}
        </span>
      </div>
    </div>
  )
}
