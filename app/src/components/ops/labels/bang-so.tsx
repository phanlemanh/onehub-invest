import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtInt } from "@/lib/format"
import type { DoiChieu } from "@/lib/labels-luot-hai"
import { BASIS_LABEL, LABEL_FIELDS_NHOM, type LabelField } from "@/lib/labels-normalize"

import { hienGiaTri, nhanTruong } from "./nhom-fields"

/** Bảng «Anh gắn · Bộ đọc · AI đọc» của lượt hai. Khổ hẹp xếp thành từng dòng trường, không tràn ngang trang. */

type DongSo = { f: LabelField; toi: string; bo: string; ai: string; khacBo: boolean; khacAi: boolean }

function dongSo(d: DoiChieu): DongSo[] {
  const cua = new Map(d.cuaToi.map((r) => [r.field, r]))
  // Mọi trường của lát theo nhóm; thẻ gắn trước truong-nhan-s03-081 không có bảy trường mới → «—» (chưa gắn).
  return LABEL_FIELDS_NHOM.map((f) => {
    const r = cua.get(f)
    const toi = !r || r.notStated ? null : r.value
    const bo = d.boDoc?.[f] ?? null
    const ai = d.aiDoc?.[f] ?? null
    const canCu = r && !r.notStated && r.basis === "danh_muc_cdt" ? ` · ${BASIS_LABEL.danh_muc_cdt}` : ""
    return {
      f,
      toi: !r ? "—" : r.notStated ? "Không suy ra được" : `${hienGiaTri(f, r.value)}${canCu}`,
      bo: hienGiaTri(f, bo),
      ai: hienGiaTri(f, ai),
      // Máy không đọc được thì không phải chỗ khác; máy đọc ra giá trị khác nhãn mới tô, kể cả khi người gắn không suy ra được.
      khacBo: bo !== null && bo !== toi,
      khacAi: ai !== null && ai !== toi,
    }
  })
}
const Gia = ({ v, khac }: { v: string; khac: boolean }) => (khac ? <Badge variant="warning-light">{v}</Badge> : <>{v}</>)

function camCot(d: DoiChieu): string | null {
  if (!d.boDoc && !d.aiDoc) return "Máy chưa đọc bài này"
  if (!d.boDoc) return "Bộ đọc chưa đọc bài này"
  if (!d.aiDoc) return "AI chưa đọc bài này"
  return null
}

export function BangSo({ d }: { d: DoiChieu }) {
  const dong = dongSo(d)
  const soKhac = dong.filter((r) => r.khacBo || r.khacAi).length
  const cam = camCot(d)
  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0" data-labels-so="">
      <FrameHeader>
        <FrameTitle>So với máy</FrameTitle>
        <FrameDescription className="text-xs text-pretty">
          Nhãn đã lưu, không sửa được. {fmtInt(soKhac)} trường khác máy.
          {d.soTin > 1 ? ` Bài có ${fmtInt(d.soTin)} tin; đang so với tin đầu.` : ""}
          {cam ? ` ${cam}.` : ""}
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-5">Trường</TableHead>
                <TableHead>Anh gắn</TableHead>
                <TableHead>Bộ đọc</TableHead>
                <TableHead className="pe-5">AI đọc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dong.map((r) => (
                <TableRow key={r.f} data-field={r.f}>
                  <TableCell className="ps-5 font-medium">{nhanTruong(r.f)}</TableCell>
                  <TableCell className="whitespace-normal wrap-anywhere">{r.toi}</TableCell>
                  <TableCell className="whitespace-normal wrap-anywhere"><Gia v={r.bo} khac={r.khacBo} /></TableCell>
                  <TableCell className="pe-5 whitespace-normal wrap-anywhere"><Gia v={r.ai} khac={r.khacAi} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-border flex flex-col divide-y sm:hidden">
          {dong.map((r) => (
            <div key={r.f} className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-1 px-5 py-2 text-sm" data-field-hep={r.f}>
              <span className="font-medium">{nhanTruong(r.f)}</span>
              <span className="wrap-anywhere">{r.toi}</span>
              <span className="text-muted-foreground text-xs">Bộ đọc</span>
              <span className="wrap-anywhere"><Gia v={r.bo} khac={r.khacBo} /></span>
              <span className="text-muted-foreground text-xs">AI đọc</span>
              <span className="wrap-anywhere"><Gia v={r.ai} khac={r.khacAi} /></span>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}
