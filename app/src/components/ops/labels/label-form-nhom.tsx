"use client"

import { useState } from "react"
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fmtVnDateTime } from "@/lib/format"
import type { LabelField, LoiLuot, PriceUnit, RawLabels } from "@/lib/labels-normalize"
import type { TinGan } from "@/lib/labels-queries"

import { COT_KHOI, KHOI, O_TRONG, TAT_CA_O, type O } from "./nhom-fields"
import { NhomRow } from "./nhom-row"
import { cauTinKe, diTrang, guiNhan, LuuLoiAlert } from "./luu-nhan"

/**
 * Biểu mẫu 17 trường của lát theo nhóm (bản D): bài gốc dính ở đầu, năm khối hai cột, mỗi ô một căn cứ, chân dính giữ nút
 * Lưu. Enter không tự lưu vì biểu mẫu dài. Lưu xong sang lượt hai (`?xem=<itemId>`), nên tải lại trang vẫn đúng chỗ.
 */

const DON_VI: { value: PriceUnit; label: string }[] = [
  { value: "ty", label: "tỷ" },
  { value: "trieu", label: "triệu" },
]
/** Bài dài hơn ba dòng ở khổ hẹp thì gấp; dưới ngưỡng này không có gì để mở. */
const baiDai = (t: string) => t.length > 120 || t.split("\n").length > 3

export function LabelFormNhom({
  lat,
  tin,
  hrefXem,
  hrefTinKe,
  diToi = diTrang,
}: {
  lat: string
  tin: TinGan
  hrefXem: string
  hrefTinKe: string
  diToi?: (href: string) => void
}) {
  const [cells, setCells] = useState<Partial<Record<LabelField, O>>>({})
  const [donVi, setDonVi] = useState<PriceUnit>("ty")
  const [lyDo, setLyDo] = useState("")
  const [loi, setLoi] = useState<LoiLuot>({})
  const [moRong, setMoRong] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [matKetNoi, setMatKetNoi] = useState(false)
  const cell = (f: LabelField) => cells[f] ?? O_TRONG
  const dat = (f: LabelField, patch: Partial<O>) => setCells((c) => ({ ...c, [f]: { ...(c[f] ?? O_TRONG), ...patch } }))
  const daDien = TAT_CA_O.filter((d) => cell(d.id).unknown || cell(d.id).value.trim()).length
  const canLyDo = TAT_CA_O.some((d) => !d.noBasis && !cell(d.id).unknown && cell(d.id).value.trim() && cell(d.id).basis !== "chu_bai")
  const xong = daDien === TAT_CA_O.length

  async function luu() {
    const values: RawLabels = {}
    for (const d of TAT_CA_O) {
      const c = cell(d.id)
      if (c.unknown) values[d.id] = { not_stated: true }
      else values[d.id] = { value: c.value, ...(d.noBasis ? {} : { basis: c.basis }), ...(d.kind === "gia" ? { unit: donVi } : {}) }
    }
    setDangLuu(true)
    try {
      const kq = await guiNhan(fetch, { lat, item_id: tin.itemId, values, reason: lyDo })
      setMatKetNoi(kq.kind === "mat-ket-noi")
      if (kq.kind === "loi-truong") {
        setLoi(kq.loi)
        requestAnimationFrame(() => document.querySelector("[data-loi]")?.scrollIntoView({ block: "center" }))
      } else if (kq.kind === "da-co-nguoi") {
        toast.info(cauTinKe(kq.error))
        diToi(hrefTinKe)
      } else if (kq.kind === "loi-may-chu") toast.error(kq.error)
      else if (kq.kind === "da-luu") diToi(hrefXem)
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <TooltipProvider>
      <Frame stacked spacing="sm" className="w-full min-w-0" data-labels-form={tin.itemId}>
        <FrameHeader className="bg-muted sticky top-0 z-10 sm:flex-row sm:items-start sm:justify-between" data-labels-tin={tin.itemId}>
          <div className="flex min-w-0 flex-col gap-1">
            <FrameDescription className="text-xs text-pretty">
              S03 · {tin.groupName ?? "nhóm không rõ"}
              {tin.postedAt ? ` · đăng ${fmtVnDateTime(tin.postedAt)}` : ""}
              {tin.doubleLabel ? " · tin gắn trùng (hai người)" : ""}
            </FrameDescription>
            <p className={`text-sm whitespace-pre-line wrap-anywhere ${moRong ? "" : "line-clamp-3"}`} data-labels-chu-goc="">
              {tin.text || "Bài không có chữ."}
            </p>
            <FrameDescription className="text-xs text-pretty">
              Ghi điều người trong nhóm hiểu. Căn cứ: Chữ là chữ bài · Nhóm là ngữ cảnh nhóm · Nghề là kiến thức nghề. Ô vuông: không suy ra được.
            </FrameDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
            <Badge variant={xong ? "success-light" : "secondary"} className="tabular-nums">
              {xong ? <CheckCircle2Icon aria-hidden="true" /> : <CircleDashedIcon aria-hidden="true" />}
              {daDien}/{TAT_CA_O.length}
            </Badge>
            {baiDai(tin.text) ? (
              <Button variant="link" size="xs" onClick={() => setMoRong((v) => !v)}>
                {moRong ? "Thu gọn" : "Xem hết bài"}
              </Button>
            ) : null}
          </div>
        </FrameHeader>
        <FramePanel>
          <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 xl:grid-cols-2">
            {COT_KHOI.map((cot) => (
              <div key={cot[0]} className="flex min-w-0 flex-col gap-5">
                {cot.map((id) => {
                  const k = KHOI.find((x) => x.id === id)!
                  return (
                    <div key={id} className="flex min-w-0 flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{k.title}</p>
                        {k.hint ? <p className="text-muted-foreground text-xs text-pretty">{k.hint}</p> : null}
                        {id === "gia" ? (
                          <ToggleGroup
                            value={[donVi]}
                            onValueChange={(v: string[]) => {
                              if (v[0]) setDonVi(v[0] as PriceUnit)
                            }}
                            variant="outline"
                            size="sm"
                            spacing={0}
                            aria-label="Đơn vị giá"
                          >
                            {DON_VI.map((u) => (
                              <ToggleGroupItem key={u.value} value={u.value} className="text-xs data-pressed:bg-primary data-pressed:text-primary-foreground">
                                {u.label}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        ) : null}
                      </div>
                      {k.fields.map((d) => (
                        <NhomRow key={d.id} d={d} o={cell(d.id)} loi={loi[d.id]} onChange={(p) => dat(d.id, p)} />
                      ))}
                    </div>
                  )
                })}
                {cot[0] === "tin" ? (
                  <Field data-invalid={!!loi.reason || undefined} data-o="reason" data-loi={loi.reason ? "" : undefined}>
                    <FieldLabel htmlFor="nhan-reason">Lý do{canLyDo ? " (bắt buộc)" : ""}</FieldLabel>
                    <Textarea
                      id="nhan-reason"
                      value={lyDo}
                      aria-invalid={loi.reason ? true : undefined}
                      onChange={(e) => setLyDo(e.target.value)}
                      placeholder="Điều phải biết để hiểu bài này"
                    />
                    {loi.reason ? <FieldError>{loi.reason}</FieldError> : null}
                  </Field>
                ) : null}
              </div>
            ))}
          </div>
        </FramePanel>
        <FrameFooter className="bg-muted sticky bottom-0 z-10 flex flex-col gap-3">
          {matKetNoi ? <LuuLoiAlert onRetry={luu} dangLuu={dangLuu} /> : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <FrameDescription className="text-xs tabular-nums">
              Đã điền {daDien}/{TAT_CA_O.length}. Lưu xong mới thấy máy đọc gì.
            </FrameDescription>
            <Button onClick={luu} disabled={dangLuu}>
              {dangLuu ? "Đang lưu…" : "Lưu và xem máy đọc"}
            </Button>
          </div>
        </FrameFooter>
      </Frame>
    </TooltipProvider>
  )
}
