"use client"

import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type DongBoSot, type DongGiu, type DongTinHieu, IT_MAU, type Lat, nhanO, type SoCap, tenCachDoc, type TuanSo } from "@/lib/do-hang-ngay"
import { fmtInt, fmtPct } from "@/lib/format"
import { FIELD_LABEL, type LabelField } from "@/lib/labels-normalize"

/** Bảng số của khối «Đo hằng ngày»: chỉ đọc, ít dòng, không lọc/sắp (reuse-plan: reui/frame + ui/table). */

const tenO = (o: string) => (o === "__nguoi_sua__" ? "Ô người sửa (cách đọc hiện)" : FIELD_LABEL[o as LabelField] ?? o)

function TyLe({ t }: { t: TuanSo }) {
  if (t.n === 0) return <span className="text-muted-foreground">—</span>
  if (t.n < IT_MAU) return <Badge variant="secondary" data-it-mau="">ít mẫu · n={t.n}</Badge>
  return <span className="tabular-nums">{fmtPct(t.ty_le)} <span className="text-muted-foreground text-xs">n={fmtInt(t.n)}</span></span>
}

function Chenh({ chenh, coYNghia }: { chenh: number | null; coYNghia: boolean }) {
  if (chenh === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex items-center gap-1 tabular-nums">
      {chenh > 0 ? "+" : ""}{fmtPct(chenh)}
      {coYNghia ? <Badge variant="success-light" data-co-y-nghia="">có ý nghĩa</Badge> : null}
    </span>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <FramePanel className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </FramePanel>
  )
}

export function BangGiu({ dong }: { dong: DongGiu[] }) {
  return (
    <Panel title="Giữ nháp theo cách đọc × ô">
      <Table data-bang="giu-nhap">
        <TableHeader>
          <TableRow>
            <TableHead>Cách đọc</TableHead><TableHead>Ô</TableHead><TableHead>Nhóm</TableHead>
            <TableHead>Tuần này</TableHead><TableHead>Tuần trước</TableHead><TableHead>Chênh</TableHead><TableHead>Ngưỡng phát hiện</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dong.map((d) => (
            <TableRow key={`${d.cach_doc}|${d.o}`}>
              <TableCell className="text-xs">{tenCachDoc(d.cach_doc)}</TableCell>
              <TableCell>{tenO(d.o)}</TableCell>
              <TableCell>{d.nhom}</TableCell>
              <TableCell><TyLe t={d.tuan_nay} /></TableCell>
              <TableCell><TyLe t={d.tuan_truoc} /></TableCell>
              <TableCell><Chenh chenh={d.chenh} coYNghia={d.co_y_nghia} /></TableCell>
              <TableCell className="tabular-nums">{d.nguong_phat_hien === null ? "—" : `±${fmtPct(d.nguong_phat_hien)}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

export function BangBoSot({ dong }: { dong: DongBoSot[] }) {
  return (
    <Panel title="Ước tin rao bị bỏ sót">
      <Table data-bang="bo-sot">
        <TableHeader>
          <TableRow><TableHead>Cách đọc</TableHead><TableHead>Tuần này</TableHead><TableHead>Tuần trước</TableHead><TableHead>Chênh</TableHead><TableHead>Thẻ thiếu nháp</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {dong.map((d) => (
            <TableRow key={d.cach_doc}>
              <TableCell className="text-xs">{tenCachDoc(d.cach_doc)}</TableCell>
              <TableCell><TyLe t={d.tuan_nay} /></TableCell>
              <TableCell><TyLe t={d.tuan_truoc} /></TableCell>
              <TableCell><Chenh chenh={d.chenh} coYNghia={d.co_y_nghia} /></TableCell>
              <TableCell className="tabular-nums">{fmtInt(d.tuan_nay.thieu_nhap ?? 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

export function BangTinHieu({ dong, ngay }: { dong: DongTinHieu[]; ngay?: string }) {
  return (
    <Panel title={`Tín hiệu không cần nhãn${ngay ? ` · ${ngay}` : ""}`}>
      <Table data-bang="tin-hieu">
        <TableHeader>
          <TableRow><TableHead>Cách đọc</TableHead><TableHead>Lời gọi</TableHead><TableHead>JSON hỏng</TableHead><TableHead>Trích không có trong bài</TableHead><TableHead>Ô sai khuôn</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {dong.map((d) => (
            <TableRow key={d.cach_doc}>
              <TableCell className="text-xs">{tenCachDoc(d.cach_doc)}</TableCell>
              {d.status === "skip" ? (
                <TableCell colSpan={4} className="text-muted-foreground">Không có lượt đọc trong ngày</TableCell>
              ) : (
                <>
                  <TableCell className="tabular-nums">{fmtInt(d.n_goi ?? 0)}</TableCell>
                  <TableCell className="tabular-nums">{fmtPct(d.json_hong ?? null)}</TableCell>
                  <TableCell className="tabular-nums">{fmtPct(d.trich_lac ?? null)}</TableCell>
                  <TableCell className="tabular-nums">{fmtInt(Object.values(d.phu ?? {}).reduce((s, p) => s + p.sai_khuon, 0))}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

const HUONG: Record<string, string> = { len: "Lên", tut: "Tụt", moi: "Mới", mat: "Mất", doi_khoa: "Đổi khoá" }
export function BangChuyenBac({ theoNguon }: { theoNguon: Record<string, Record<string, number>> }) {
  return (
    <Panel title="Dòng chuyển bậc hôm nay">
      <Table data-bang="chuyen-bac">
        <TableHeader>
          <TableRow><TableHead>Nguồn</TableHead>{Object.values(HUONG).map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(theoNguon).map(([nguon, so]) => (
            <TableRow key={nguon}>
              <TableCell>{nguon}</TableCell>
              {Object.keys(HUONG).map((h) => <TableCell key={h} className="tabular-nums">{fmtInt(so[h] ?? 0)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

export function BangSoCap({ entity, cu, o }: { entity: string; cu?: string; o: Record<string, SoCap> }) {
  return (
    <Panel title={`So cặp trên cùng bài · ${tenCachDoc(entity)}${cu ? ` so với ${tenCachDoc(cu)}` : ""}`}>
      <Table data-bang="so-cap">
        <TableHeader>
          <TableRow><TableHead>Ô</TableHead><TableHead>Cặp</TableHead><TableHead>Giữ (cũ)</TableHead><TableHead>Giữ (mới)</TableHead><TableHead>Chênh cặp</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(o).map(([f, r]) => (
            <TableRow key={f}>
              <TableCell>{tenO(f)}</TableCell>
              <TableCell className="tabular-nums">{fmtInt(r.n_cap)}</TableCell>
              <TableCell className="tabular-nums">{fmtInt(r.giu_cu)}</TableCell>
              <TableCell className="tabular-nums">{fmtInt(r.giu_moi)}</TableCell>
              <TableCell><Chenh chenh={r.chenh_cap} coYNghia={r.co_y_nghia} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

export function BangLat({ title, lat, areaNames }: { title: string; lat: Lat; areaNames: Record<string, string> }) {
  const dong = Object.entries(lat.o).filter(([, n]) => n > 0)
  return (
    <Panel title={title}>
      <Table data-bang="lat">
        <TableHeader><TableRow><TableHead>Ô</TableHead><TableHead>Số</TableHead></TableRow></TableHeader>
        <TableBody>
          {dong.map(([k, n]) => (
            <TableRow key={k} data-o-lat={k}>
              <TableCell>{nhanO(k, areaNames)}</TableCell>
              <TableCell className="tabular-nums">{fmtInt(n)}</TableCell>
            </TableRow>
          ))}
          <TableRow><TableCell className="font-medium">Tổng</TableCell><TableCell className="tabular-nums font-medium">{fmtInt(lat.tong)}</TableCell></TableRow>
        </TableBody>
      </Table>
    </Panel>
  )
}
