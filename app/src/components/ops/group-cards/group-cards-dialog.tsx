"use client"

// Hộp «Duyệt thẻ» của /ops/group-cards (TG1): bốn ô kèm dòng căn cứ; Nhận giữ nháp, Lưu sửa ghi giá trị mới, Bác đòi lý do.
// Lưu lỗi giữ nguyên chữ đã nhập; 409 có nút «Tải lại thẻ» (làm mới dữ liệu trang, giữ chữ — form gắn theo mã thẻ).
// Viewer: mọi ô chỉ đọc, không nút ghi. Đóng khi đã sửa thì hỏi bỏ thay đổi.
import { useState } from "react"
import { CircleAlertIcon } from "lucide-react"

import { ChonNhieu } from "@/components/ops/sources/so-don-vi-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { DanhMucThe, TheDiaChi } from "@/lib/the-dia-chi-nhom"

import { ChonMot } from "./chon-mot"
import { dongCanCu, dongCanCuMucDich, NHAN_MUC_DICH, NHAN_TRANG_THAI, tenNhom } from "./group-cards-text"

export type QuyetDinh = {
  card: "nhan" | "sua" | "bac"
  values?: { projectNodeIds: number[]; areaId: string | null; subzoneNodeId: number | null; purpose: string | null }
  note: string
}
export type LoiLuu = { message: string; conflict: boolean }

type GiaTri = { duAn: string[]; phuong: string; phanKhu: string; mucDich: string }
const tuThe = (t: TheDiaChi): GiaTri => ({
  duAn: t.du_an.map((d) => String(d.id)),
  phuong: t.phuong?.id ?? "",
  phanKhu: t.phan_khu ? String(t.phan_khu.id) : "",
  mucDich: t.muc_dich ?? "",
})
const MUC_DICH_ITEMS = [{ id: "", name: "Để trống" }, ...Object.entries(NHAN_MUC_DICH).map(([id, name]) => ({ id, name }))]

export function GroupCardDialog(props: {
  target: TheDiaChi | null
  danhMuc: DanhMucThe
  coQuyet: boolean
  pending: boolean
  error: LoiLuu | null
  onClose: () => void
  onReload: () => void
  onSubmit: (q: QuyetDinh) => void
}) {
  const [dirty, setDirty] = useState(false)
  const [hoiDong, setHoiDong] = useState(false)
  const t = props.target
  const dong = () => {
    setDirty(false)
    setHoiDong(false)
    props.onClose()
  }
  return (
    <Dialog open={t !== null} onOpenChange={(open) => (open ? null : dirty ? setHoiDong(true) : dong())}>
      <DialogContent className="sm:max-w-lg" data-group-card-dialog="">
        {t ? (
          <TheForm key={t.card_code} {...props} t={t} onDirty={setDirty} hoiDong={hoiDong} onBoDong={dong} onTiepTuc={() => setHoiDong(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function TheForm({
  t, danhMuc, coQuyet, pending, error, onReload, onSubmit, onDirty, hoiDong, onBoDong, onTiepTuc,
}: {
  t: TheDiaChi
  danhMuc: DanhMucThe
  coQuyet: boolean
  pending: boolean
  error: LoiLuu | null
  onReload: () => void
  onSubmit: (q: QuyetDinh) => void
  onDirty: (d: boolean) => void
  hoiDong: boolean
  onBoDong: () => void
  onTiepTuc: () => void
}) {
  const [g, setG] = useState<GiaTri>(() => tuThe(t))
  const [note, setNote] = useState("")
  const goc = tuThe(t)
  const daSua = JSON.stringify(g) !== JSON.stringify(goc)
  const doi = (p: Partial<GiaTri>) => {
    const moi = { ...g, ...p }
    setG(moi)
    onDirty(JSON.stringify(moi) !== JSON.stringify(goc) || note.trim() !== "")
  }
  const ev = t.evidence
  const doc = ev.so_bai_doc ?? 0
  const chonDuAn = new Set(g.duAn.map(Number))
  const phanKhuItems = danhMuc.subzones.filter((s) => chonDuAn.has(s.parent_id)).map((s) => ({ id: String(s.id), name: s.name }))
  const phuongItems = danhMuc.wards.map((w) => ({ id: w.id, name: `${w.name} · ${w.province}` }))
  const nhan = NHAN_TRANG_THAI[t.status]
  const values = {
    projectNodeIds: g.duAn.map(Number),
    areaId: g.phuong || null,
    subzoneNodeId: g.phanKhu ? Number(g.phanKhu) : null,
    purpose: g.mucDich || null,
  }
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(daSua ? { card: "sua", values, note } : { card: "nhan", note })
      }}
    >
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {coQuyet ? "Duyệt thẻ" : "Xem thẻ"} {t.card_code}
          <Badge variant={nhan.variant}>{nhan.label}</Badge>
        </DialogTitle>
        <DialogDescription>
          {tenNhom(t)}
          {t.unit_code ? ` · ${t.unit_code}` : ""} — máy dựng từ {doc} bài đã đọc. Thẻ là mặc định cho tin của nhóm; bài nêu rõ
          dự án khác thì bài thắng.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <ChonNhieu
          id="the-du-an"
          label="Dự án (tối đa 3)"
          description={dongCanCu(ev.du_an, doc, t.du_an.length > 0)}
          items={danhMuc.projects.map((p) => ({ id: String(p.id), name: p.name }))}
          value={g.duAn}
          onChange={(v) => coQuyet && v.length <= 3 && doi({ duAn: v, phanKhu: "" })}
          placeholder={coQuyet ? "Chọn dự án" : "Trống"}
        />
        <ChonMot id="the-phuong" label="Phường · tỉnh" items={phuongItems} value={g.phuong} disabled={!coQuyet}
          onChange={(v) => doi({ phuong: v })} description={dongCanCu(ev.phuong, doc, t.phuong !== null)} placeholder="Chọn phường" />
        <ChonMot id="the-phan-khu" label="Phân khu mặc định" items={phanKhuItems} value={g.phanKhu} disabled={!coQuyet || phanKhuItems.length === 0}
          onChange={(v) => doi({ phanKhu: v })} description={dongCanCu(ev.phan_khu, doc, t.phan_khu !== null)}
          placeholder={phanKhuItems.length ? "Chọn phân khu" : "Dự án đã chọn chưa có phân khu"} />
        <ChonMot id="the-muc-dich" label="Bán hay thuê" items={MUC_DICH_ITEMS} value={g.mucDich} disabled={!coQuyet}
          onChange={(v) => doi({ mucDich: v })} description={dongCanCuMucDich(t)} placeholder="Để trống" />
        {coQuyet && (
          <Field>
            <FieldLabel htmlFor="the-ghi-chu">Lý do</FieldLabel>
            <Textarea id="the-ghi-chu" value={note} rows={2} onChange={(e) => { setNote(e.target.value); onDirty(daSua || e.target.value.trim() !== "") }} />
            <FieldDescription>Không bắt buộc khi nhận hay sửa; bác thẻ cần lý do từ 3 ký tự.</FieldDescription>
          </Field>
        )}
      </FieldGroup>
      {error && (
        <Alert variant="destructive" data-group-card-error={error.conflict ? "409" : "loi"}>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{error.conflict ? "Thẻ đã đổi từ lúc anh mở" : "Chưa lưu được thẻ"}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>{error.message}</span>
            {error.conflict && <Button type="button" size="sm" variant="outline" onClick={onReload}>Tải lại thẻ</Button>}
          </AlertDescription>
        </Alert>
      )}
      {hoiDong && (
        <Alert variant="warning">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Bỏ thay đổi chưa lưu?</AlertTitle>
          <AlertDescription className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onTiepTuc}>Tiếp tục sửa</Button>
            <Button type="button" size="sm" variant="destructive" onClick={onBoDong}>Bỏ thay đổi</Button>
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        {coQuyet ? (
          <>
            <Button type="button" variant="outline" disabled={pending || note.trim().length < 3} onClick={() => onSubmit({ card: "bac", note })}>
              Bác
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {daSua ? "Lưu sửa" : "Nhận"}
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onBoDong}>Đóng</Button>
        )}
      </DialogFooter>
    </form>
  )
}
