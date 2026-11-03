"use client"

import { useState } from "react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { canCungTieuChi } from "@/lib/deals-chi-tiet"
import { fmtCompact, fmtInt } from "@/lib/format"

import { DealThumb, type DealHang } from "./deals-cells"

const HIEN_TOI_DA = 20
const trM2 = (v: number | null) => (v ? fmtInt(v / 1e6) : "—")

/** Một hàng so sánh: tr/m² kèm chênh với căn đang xem, vì đó là con số quyết nên gọi căn nào trước. */
function Hang({ d, goc, onMo }: { d: DealHang; goc: DealHang | null; onMo?: () => void }) {
  const chenh = goc && d.pricePerm2 && goc.pricePerm2 ? Math.round((d.pricePerm2 - goc.pricePerm2) / 1e6) : null
  return (
    <TableRow data-state={goc ? undefined : "selected"} className={onMo ? "cursor-pointer" : undefined} onClick={onMo}>
      <TableCell className="min-w-0 whitespace-normal">
        <div className="flex min-w-0 items-center gap-2">
          {d.xemAnh && <DealThumb d={d} />}
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            {/* Không gắn xử lý ở nút: cú bấm, hoặc Enter trên nút, đi lên onClick của hàng. */}
            {goc ? (
              <Button variant="link" size="xs" className="max-w-full justify-start"><span className="truncate">{d.block ?? "Chưa rõ toà"}</span></Button>
            ) : (
              <span className="ps-2 text-xs font-medium">Căn này</span>
            )}
            <span className="text-muted-foreground ps-2 text-xs tabular-nums">
              {[d.areaM2 ? `${Math.round(d.areaM2)} m²` : null, d.bedrooms ? `${d.bedrooms}PN` : null, d.source].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-end text-sm font-medium tabular-nums">{d.priceVnd === null ? "—" : fmtCompact(d.priceVnd)}</TableCell>
      <TableCell className="text-end">
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm tabular-nums">{trM2(d.pricePerm2)}</span>
          {chenh !== null && (
            <span className="text-muted-foreground text-xs tabular-nums">{chenh === 0 ? "bằng" : chenh > 0 ? `+${chenh}` : `−${-chenh}`}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-end">
        {d.suspect ? (
          <Badge variant="warning-light" className="tabular-nums">−{(d.discountPct ?? 0).toFixed(0)}%</Badge>
        ) : (
          <span className="text-sm tabular-nums">−{(d.discountPct ?? 0).toFixed(0)}%</span>
        )}
      </TableCell>
    </TableRow>
  )
}

/** Tab «Căn cùng tiêu chí» trong sheet: bù chỗ sheet che bảng, vẫn so được căn đang xem với các căn tương tự. */
export function DealSimilar({ d, rows, onMo }: { d: DealHang; rows: DealHang[]; onMo: (id: string) => void }) {
  const [chiPhuong, setChiPhuong] = useState(false)
  const { moTa, can } = canCungTieuChi(d, rows, chiPhuong)
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {moTa.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
        <span className="text-muted-foreground text-xs tabular-nums">{fmtInt(can.length)} căn trong danh sách</span>
      </div>
      {can.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Chưa có căn nào cùng tiêu chí</EmptyTitle>
            <EmptyDescription>{chiPhuong || !d.phuong ? "Phường này chưa có căn giá tốt nào khác." : "Nới về cùng phường có thể thấy thêm căn."}</EmptyDescription>
          </EmptyHeader>
          {!chiPhuong && d.phuong && (
            <EmptyContent>
              <Button variant="outline" onClick={() => setChiPhuong(true)}>Xem mọi căn trong phường</Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Căn</TableHead>
              <TableHead className="text-end">Giá</TableHead>
              <TableHead className="text-end">tr/m²</TableHead>
              <TableHead className="text-end">Giảm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Hang d={d} goc={null} />
            {can.slice(0, HIEN_TOI_DA).map((r) => <Hang key={r.offerId} d={r} goc={d} onMo={() => onMo(r.offerId)} />)}
          </TableBody>
        </Table>
      )}
      {can.length > HIEN_TOI_DA && <p className="text-muted-foreground text-xs">Hiện {HIEN_TOI_DA} căn giảm nhiều nhất.</p>}
      {can.length > 0 && !chiPhuong && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setChiPhuong(true)}>Xem mọi căn trong phường</Button>
      )}
    </div>
  )
}
