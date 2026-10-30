"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FIELD_LABEL,
  SELECT_AXES,
  selectOptions,
  type LabelField,
  type PriceUnit,
  type RawLabels,
  type SelectAxis,
} from "@/lib/labels-normalize"

import { guiNhan, LuuLoiAlert } from "./luu-nhan"

/**
 * Biểu mẫu chín trường lõi (PL7). Mỗi ô có «Tin không nêu»; giá là một khoảng (thấp nhất, cao nhất) chung một đơn vị.
 * Lưu → POST /api/v1/ops/labels; 400 hiện lỗi dưới đúng ô và giữ chữ đã gõ; 409 (tin vừa có người gắn) → tải tin kế.
 * Mất kết nối → Alert «Không chắc đã lưu» + «Lưu lại», giữ chữ đã gõ (hàng nhan-gia-va-luu-loi-mang).
 */

type Cell = { value: string; not_stated: boolean }
const TRONG: Cell = { value: "", not_stated: false }
const CHU: LabelField[] = ["project", "building"]
const SO: { f: LabelField; goiY: string }[] = [
  { f: "area_m2", goiY: "vd 64,5" },
  { f: "bedrooms", goiY: "vd 2" },
]
const DON_VI: { value: PriceUnit; label: string }[] = [
  { value: "ty", label: "tỷ" },
  { value: "trieu", label: "triệu" },
]

function KhongNeu({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <FieldLabel htmlFor={id} className="text-xs font-normal">
        Tin không nêu
      </FieldLabel>
    </Field>
  )
}

function O({ f, loi, children }: { f: LabelField | "price"; loi?: string; children: ReactNode }) {
  return (
    <Field data-invalid={!!loi || undefined} data-o={f}>
      {children}
      {loi ? <FieldError>{loi}</FieldError> : null}
    </Field>
  )
}

/** Tải lại trang để server xếp tin kế (cùng cách «Thử lại» của các trang Ops). */
const sangTinKe = () => window.location.reload()

export function LabelForm({ lat, itemId }: { lat: string; itemId: number }) {
  const [cells, setCells] = useState<Partial<Record<LabelField, Cell>>>({})
  const [donVi, setDonVi] = useState<PriceUnit>("ty")
  const [loi, setLoi] = useState<Partial<Record<LabelField, string>>>({})
  const [dangLuu, setDangLuu] = useState(false)
  const [matKetNoi, setMatKetNoi] = useState(false)
  const cell = (f: LabelField) => cells[f] ?? TRONG
  const dat = (f: LabelField, patch: Partial<Cell>) => setCells((c) => ({ ...c, [f]: { ...(c[f] ?? TRONG), ...patch } }))
  const giaKhongNeu = cell("price_min_vnd").not_stated

  async function luu() {
    const values: RawLabels = {}
    for (const [f, c] of Object.entries(cells) as [LabelField, Cell][]) values[f] = { ...c }
    for (const f of ["price_min_vnd", "price_max_vnd"] as const) values[f] = { ...cell(f), not_stated: giaKhongNeu, unit: donVi }
    setDangLuu(true)
    try {
      const kq = await guiNhan(fetch, { lat, item_id: itemId, values })
      setMatKetNoi(kq.kind === "mat-ket-noi")
      if (kq.kind === "loi-truong") setLoi(kq.loi)
      else if (kq.kind === "da-co-nguoi") {
        toast.info(`${kq.error} — chuyển tin kế`)
        sangTinKe()
      } else if (kq.kind === "loi-may-chu") toast.error(kq.error)
      else if (kq.kind === "da-luu") {
        toast.success("Đã lưu nhãn")
        sangTinKe()
      }
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0" data-labels-form={itemId}>
      <FrameHeader>
        <FrameTitle>Chín trường lõi</FrameTitle>
        <FrameDescription className="text-xs text-pretty">Ghi theo đúng chữ của tin; tin không nói thì chọn «Tin không nêu».</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <FieldGroup className="gap-4">
          {SELECT_AXES.map((f: SelectAxis) => (
            <O key={f} f={f} loi={loi[f]}>
              <FieldLabel htmlFor={`nhan-${f}`}>{FIELD_LABEL[f]}</FieldLabel>
              <Select value={cell(f).value || null} items={selectOptions(f)} disabled={cell(f).not_stated} onValueChange={(v) => dat(f, { value: String(v ?? "") })}>
                <SelectTrigger id={`nhan-${f}`} className="w-full">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {selectOptions(f).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <KhongNeu id={`kn-${f}`} checked={cell(f).not_stated} onChange={(v) => dat(f, { not_stated: v })} />
            </O>
          ))}
          {CHU.map((f) => (
            <O key={f} f={f} loi={loi[f]}>
              <FieldLabel htmlFor={`nhan-${f}`}>{FIELD_LABEL[f]}</FieldLabel>
              <Input id={`nhan-${f}`} value={cell(f).value} disabled={cell(f).not_stated} onChange={(e) => dat(f, { value: e.target.value })} />
              <KhongNeu id={`kn-${f}`} checked={cell(f).not_stated} onChange={(v) => dat(f, { not_stated: v })} />
            </O>
          ))}
          <O f="price" loi={loi.price_min_vnd ?? loi.price_max_vnd}>
            <FieldLabel htmlFor="nhan-price_min_vnd">Giá (khoảng)</FieldLabel>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input id="nhan-price_min_vnd" aria-label="Giá thấp nhất" inputMode="decimal" placeholder="thấp nhất" value={cell("price_min_vnd").value} disabled={giaKhongNeu} onChange={(e) => dat("price_min_vnd", { value: e.target.value })} />
              <Input id="nhan-price_max_vnd" aria-label="Giá cao nhất" inputMode="decimal" placeholder="cao nhất" value={cell("price_max_vnd").value} disabled={giaKhongNeu} onChange={(e) => dat("price_max_vnd", { value: e.target.value })} />
              <Select value={donVi} items={DON_VI} disabled={giaKhongNeu} onValueChange={(v) => setDonVi(v === "trieu" ? "trieu" : "ty")}>
                <SelectTrigger aria-label="Đơn vị giá">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {DON_VI.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <KhongNeu id="kn-price" checked={giaKhongNeu} onChange={(v) => { dat("price_min_vnd", { not_stated: v }); dat("price_max_vnd", { not_stated: v }) }} />
          </O>
          {SO.map(({ f, goiY }) => (
            <O key={f} f={f} loi={loi[f]}>
              <FieldLabel htmlFor={`nhan-${f}`}>{FIELD_LABEL[f]}</FieldLabel>
              <Input id={`nhan-${f}`} inputMode={f === "bedrooms" ? "numeric" : "decimal"} placeholder={goiY} value={cell(f).value} disabled={cell(f).not_stated} onChange={(e) => dat(f, { value: e.target.value })} />
              <KhongNeu id={`kn-${f}`} checked={cell(f).not_stated} onChange={(v) => dat(f, { not_stated: v })} />
            </O>
          ))}
        </FieldGroup>
      </FramePanel>
      <FrameFooter className="flex flex-col items-stretch gap-3">
        {matKetNoi ? <LuuLoiAlert onRetry={luu} dangLuu={dangLuu} /> : null}
        <Button className="self-end" onClick={luu} disabled={dangLuu}>
          {dangLuu ? "Đang lưu…" : "Lưu và sang tin kế"}
        </Button>
      </FrameFooter>
    </Frame>
  )
}
