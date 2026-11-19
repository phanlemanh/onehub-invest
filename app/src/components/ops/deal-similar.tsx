"use client"

import { useEffect, useState } from "react"
import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { canCungTieuChi, type CungTieuChi, type DealHang, loaiHinh, moTaCungTieuChi, SO_CUNG_TOI_DA, soPct } from "@/lib/deals-chi-tiet"
import { fmtCompact, fmtInt } from "@/lib/format"

import { DealThumb } from "./deals-cells"

const HIEN_TOI_DA = SO_CUNG_TOI_DA

/** Kết quả tab «Căn cùng tiêu chí» đọc ở máy chủ (CG17); cùng khuôn với server action của trang. */
export type KetQuaCung = { moTa: string[]; bo: string[]; tong: number; can: DealHang[] }
/** Gọi máy chủ lấy danh sách cùng tiêu chí trên toàn tập; `null` khi chưa có bảng hạng. */
export type TaiCung = (offerId: string, chiPhuong: boolean) => Promise<KetQuaCung | null>
const trM2 = (v: number | null) => (v ? fmtInt(v / 1e6) : "—")

/** Một hàng so sánh: tr/m² kèm chênh với căn đang xem, vì đó là con số quyết nên gọi căn nào trước. */
function Hang({ d, goc, onMo }: { d: DealHang; goc: DealHang | null; onMo?: () => void }) {
  const chenh = goc && d.pricePerm2 && goc.pricePerm2 ? Math.round((d.pricePerm2 - goc.pricePerm2) / 1e6) : null
  return (
    <TableRow data-state={goc ? undefined : "selected"} data-can-id={d.offerId} className={onMo ? "cursor-pointer" : undefined} onClick={onMo}>
      <TableCell className="min-w-0 whitespace-normal">
        <div className="flex min-w-0 items-center gap-2">
          {d.xemAnh && <DealThumb d={d} />}
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            {/* Không gắn xử lý ở nút: cú bấm, hoặc Enter trên nút, đi lên onClick của hàng. */}
            {goc ? (
              <Button variant="link" size="xs" className="max-w-full justify-start"><span className="truncate">{d.block ?? loaiHinh(d.propertyType) ?? "Chưa rõ loại hình"}</span></Button>
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
          <Badge variant="warning-light" className="tabular-nums">−{soPct(d.discountPct ?? 0)}%</Badge>
        ) : (
          <span className="text-sm tabular-nums">−{soPct(d.discountPct ?? 0)}%</span>
        )}
      </TableCell>
    </TableRow>
  )
}

/** Bảng so sánh: hàng «Căn này» rồi các căn cùng tiêu chí. */
function BangSo({ d, can, onMo }: { d: DealHang; can: DealHang[]; onMo: (id: string) => void }) {
  return (
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
  )
}

/** Tab «Căn cùng tiêu chí» trong sheet: bù chỗ sheet che bảng, vẫn so được căn đang xem với các căn tương tự. */
export function DealSimilar({ d, rows, onMo, cung, tai }: {
  d: DealHang
  rows: DealHang[]
  onMo: (id: string) => void
  /** Hai số đếm trên toàn tập đã lọc (CG17); vắng → danh sách lùi, so trong `rows`. */
  cung?: CungTieuChi
  tai?: TaiCung
}) {
  if (cung && tai) return <DealSimilarToanTap d={d} onMo={onMo} cung={cung} tai={tai} />
  return <DealSimilarTrongDanhSach d={d} rows={rows} onMo={onMo} />
}

type TrangThaiTai = { lan: string; kq: KetQuaCung | null } | { lan: string; loi: true }

/** Đọc ở máy chủ trên toàn tập đã lọc (CG17): khung tải, lỗi có «Thử lại», kết quả về muộn của căn khác bị bỏ. */
function DealSimilarToanTap({ d, onMo, cung, tai }: { d: DealHang; onMo: (id: string) => void; cung: CungTieuChi; tai: TaiCung }) {
  const [chiPhuong, setChiPhuong] = useState(false)
  const [thu, setThu] = useState(0)
  const [kq, setKq] = useState<TrangThaiTai | null>(null)
  const lan = `${d.offerId}|${chiPhuong}|${thu}`
  useEffect(() => {
    let bo = false
    tai(d.offerId, chiPhuong).then(
      (x) => { if (!bo) setKq({ lan, kq: x }) },
      () => { if (!bo) setKq({ lan, loi: true }) },
    )
    return () => { bo = true }
  }, [tai, d.offerId, chiPhuong, lan])
  const hienTai = kq && kq.lan === lan ? kq : null
  const doc = hienTai && "kq" in hienTai ? hienTai.kq : null
  const { moTa, bo } = doc ?? moTaCungTieuChi(d, chiPhuong)
  const tong = doc ? doc.tong : chiPhuong ? cung.phuong : cung.tieuChi
  const chu = chiPhuong ? "trong phường" : "cùng tiêu chí"
  const nutPhuong = !chiPhuong && d.phuong && cung.phuong > 0 && (
    <Button variant="outline" onClick={() => setChiPhuong(true)}>Xem mọi căn trong phường ({fmtInt(cung.phuong)})</Button>
  )
  return (
    <div className="flex flex-col gap-3 p-4" data-cung-tieu-chi={!hienTai ? "tai" : "loi" in hienTai ? "loi" : "co"}>
      <div className="flex flex-wrap items-center gap-1.5">
        {moTa.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
        <span className="text-muted-foreground text-xs tabular-nums">{fmtInt(tong)} căn {chu}</span>
      </div>
      {bo.length > 0 && <p className="text-muted-foreground text-xs">{bo.join(" · ")}</p>}
      {!hienTai ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Đang tải căn cùng tiêu chí">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : "loi" in hienTai ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Chưa tải được căn cùng tiêu chí</AlertTitle>
          <AlertDescription>Thử lại sau giây lát; phần «Chi tiết» vẫn xem được.</AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => setThu((x) => x + 1)}>
              <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
              Thử lại
            </Button>
          </AlertAction>
        </Alert>
      ) : !doc || doc.tong === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Chưa có căn nào cùng tiêu chí</EmptyTitle>
            <EmptyDescription>{chiPhuong || !d.phuong || cung.phuong === 0 ? "Phường này chưa có căn giá tốt nào khác." : "Nới về cùng phường có thể thấy thêm căn."}</EmptyDescription>
          </EmptyHeader>
          {nutPhuong && <EmptyContent>{nutPhuong}</EmptyContent>}
        </Empty>
      ) : (
        <>
          <BangSo d={d} can={doc.can} onMo={onMo} />
          {doc.tong > HIEN_TOI_DA && (
            <p className="text-muted-foreground text-xs tabular-nums">Hiện {HIEN_TOI_DA} / {fmtInt(doc.tong)} căn {chu}, giảm nhiều nhất trước.</p>
          )}
          {nutPhuong && <div className="self-start">{nutPhuong}</div>}
        </>
      )}
    </div>
  )
}

/** Đường lùi khi chưa có bảng hạng: so trong danh sách đang tải. */
function DealSimilarTrongDanhSach({ d, rows, onMo }: { d: DealHang; rows: DealHang[]; onMo: (id: string) => void }) {
  const [chiPhuong, setChiPhuong] = useState(false)
  const { moTa, bo, can } = canCungTieuChi(d, rows, chiPhuong)
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {moTa.map((m) => <Badge key={m} variant="outline">{m}</Badge>)}
        <span className="text-muted-foreground text-xs tabular-nums">{fmtInt(can.length)} căn trong danh sách đang tải</span>
      </div>
      {bo.length > 0 && <p className="text-muted-foreground text-xs">{bo.join(" · ")}</p>}
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
        <BangSo d={d} can={can} onMo={onMo} />
      )}
      {can.length > HIEN_TOI_DA && <p className="text-muted-foreground text-xs">Hiện {HIEN_TOI_DA} căn giảm nhiều nhất.</p>}
      {can.length > 0 && !chiPhuong && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setChiPhuong(true)}>Xem mọi căn trong phường</Button>
      )}
    </div>
  )
}
