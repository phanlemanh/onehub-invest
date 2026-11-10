"use client"

import { useState } from "react"
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel } from "@/components/reui/frame"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider } from "@/components/ui/tooltip"
import { fmtVnDateTime } from "@/lib/format"
import type { LabelField, LoiLuot, PriceUnit, RawLabels } from "@/lib/labels-normalize"
import type { TinGan } from "@/lib/labels-queries"

import { AnhBai } from "./anh-bai"
import { cauGiaLa, donViTheoLoai } from "./gia-la"
import { COT_KHOI, KHOI, O_TRONG, TAT_CA_O, type O } from "./nhom-fields"
import { NhomRow } from "./nhom-row"
import { cauTinKe, diTrang, guiNhan, LuuLoiAlert } from "./luu-nhan"
import { MaThe } from "./ma-the"
import { nhapVeO } from "./nhap-may"
import { NguoiDang } from "./nguoi-dang"

const O_GIA: readonly LabelField[] = ["price_min_vnd", "price_max_vnd"]

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
  baoTin = toast.info,
}: {
  lat: string
  tin: TinGan
  hrefXem: string
  hrefTinKe: string
  diToi?: (href: string) => void
  baoTin?: (cau: string) => unknown
}) {
  // Lát mẫu soát (DO1): điền sẵn nháp máy của cách đọc hiện; người giữ hay sửa từng ô rồi lưu.
  const [nhapDau] = useState(() => (tin.nhap ? nhapVeO(tin.nhap) : null))
  const [cells, setCells] = useState<Partial<Record<LabelField, O>>>(nhapDau?.cells ?? {})
  const [donVi, setDonVi] = useState<PriceUnit>(nhapDau?.donVi ?? "ty")
  // Người tự bấm đơn vị thì Loại tin không ghi đè lựa chọn đó.
  const [donViTay, setDonViTay] = useState(false)
  // Giá lạ so với Loại tin: hỏi lại một lần cho đúng bộ giá trị đó, không chặn lưu.
  const [hoiGia, setHoiGia] = useState<{ cau: string; khoa: string } | null>(null)
  const [daXacNhan, setDaXacNhan] = useState<string | null>(null)
  const [lyDo, setLyDo] = useState("")
  const [loi, setLoi] = useState<LoiLuot>({})
  const [moRong, setMoRong] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [matKetNoi, setMatKetNoi] = useState(false)
  // Bài chỉ có ảnh thì căn cứ mặc định là Ảnh, khỏi ghi sai là Chữ.
  const oTrong: O = !tin.text && tin.anh.length ? { ...O_TRONG, basis: "anh" } : O_TRONG
  const cell = (f: LabelField) => cells[f] ?? oTrong
  // Lỗi của lần lưu trước chỉ đúng với giá trị lúc đó: sửa ô nào thì bỏ lỗi ô đó; hai đầu giá kiểm cùng nhau nên bỏ cả hai.
  const boLoi = (fs: readonly LabelField[]) =>
    setLoi((l) => (fs.some((f) => l[f]) ? Object.fromEntries(Object.entries(l).filter(([k]) => !fs.includes(k as LabelField))) : l))
  const dat = (f: LabelField, patch: Partial<O>) => {
    setCells((c) => ({ ...c, [f]: { ...(c[f] ?? oTrong), ...patch } }))
    boLoi(O_GIA.includes(f) ? O_GIA : [f])
    const theoLoai = f === "kind" && patch.value !== undefined && !donViTay ? donViTheoLoai(patch.value) : null
    if (theoLoai && theoLoai !== donVi) {
      setDonVi(theoLoai)
      boLoi(O_GIA)
    }
  }
  const daDien = TAT_CA_O.filter((d) => cell(d.id).unknown || cell(d.id).value.trim()).length
  const canLyDo = TAT_CA_O.some((d) => !d.noBasis && !cell(d.id).unknown && cell(d.id).value.trim() && cell(d.id).basis !== "chu_bai" && cell(d.id).basis !== "anh" && cell(d.id).basis !== "danh_muc_cdt")
  const xong = daDien === TAT_CA_O.length

  async function luu(xacNhan = false) {
    const kind = cell("kind").unknown ? undefined : cell("kind").value
    const gia = O_GIA.map((f) => (cell(f).unknown ? "" : cell(f).value))
    const cau = cauGiaLa(kind, gia, donVi)
    const khoa = JSON.stringify([tin.itemId, kind, gia, donVi])
    if (cau && !xacNhan && daXacNhan !== khoa) {
      setHoiGia({ cau, khoa })
      return
    }
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
        baoTin(cauTinKe(kq.error))
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
              <MaThe itemId={tin.itemId} /> · S03 · {tin.groupName ?? "nhóm không rõ"}
              <NguoiDang ten={tin.nguoiDang} id={tin.nguoiDangId} />
              {tin.postedAt ? ` · đăng ${fmtVnDateTime(tin.postedAt)}` : ""}
              {tin.doubleLabel ? " · tin gắn trùng (hai người)" : ""}
            </FrameDescription>
            {tin.nhap ? (
              <div className="flex">
                <Badge variant="info-light" data-labels-nhap={tin.nhap.cachDoc} className="wrap-anywhere whitespace-normal">
                  Nháp máy · {tin.nhap.cachDoc}
                </Badge>
              </div>
            ) : null}
            <AnhBai anh={tin.anh} soLinkKhac={tin.soLinkKhac} coChu={Boolean(tin.text)} ghep={tin.ghep} />
            {tin.text ? (
              <p className={`text-sm whitespace-pre-line wrap-anywhere ${moRong ? "" : "line-clamp-3"}`} data-labels-chu-goc="">
                {tin.text}
              </p>
            ) : null}
            <FrameDescription className="text-xs text-pretty">
              Ghi điều người trong nhóm hiểu. Căn cứ: Chữ là chữ bài · Ảnh là ảnh trong bài · Nhóm là ngữ cảnh nhóm · Nghề là kiến thức nghề. Ô vuông: không suy ra được.
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
                    <div key={id} className="flex min-w-0 flex-col gap-2" data-khoi={id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{k.title}</p>
                        {k.hint ? <p className="text-muted-foreground text-xs text-pretty">{k.hint}</p> : null}
                        {id === "gia" ? (
                          <ToggleGroup
                            value={[donVi]}
                            onValueChange={(v: string[]) => {
                              // Bấm lại nút đang sáng cũng là chọn tay: giữ đơn vị đó trước Loại tin.
                              setDonViTay(true)
                              if (v[0]) {
                                setDonVi(v[0] as PriceUnit)
                                boLoi(O_GIA)
                              }
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
          {matKetNoi ? <LuuLoiAlert onRetry={() => luu()} dangLuu={dangLuu} /> : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <FrameDescription className="text-xs tabular-nums">
              Đã điền {daDien}/{TAT_CA_O.length}. Lưu xong mới thấy máy đọc gì.
            </FrameDescription>
            <Button onClick={() => luu()} disabled={dangLuu}>
              {dangLuu ? "Đang lưu…" : "Lưu và xem máy đọc"}
            </Button>
          </div>
        </FrameFooter>
      </Frame>
      <AlertDialog open={!!hoiGia} onOpenChange={(mo) => (mo ? null : setHoiGia(null))}>
        <AlertDialogContent size="sm" data-labels-hoi-gia="">
          <AlertDialogHeader>
            <AlertDialogTitle>Giá này có đúng không?</AlertDialogTitle>
            <AlertDialogDescription>{hoiGia?.cau}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Sửa lại</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!hoiGia) return
                setDaXacNhan(hoiGia.khoa)
                setHoiGia(null)
                void luu(true)
              }}
            >
              Vẫn lưu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
