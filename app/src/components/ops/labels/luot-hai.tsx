"use client"

import { useState } from "react"
import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fmtInt, fmtVnDateTime } from "@/lib/format"
import type { DoiChieu } from "@/lib/labels-luot-hai"
import { CASE_KINDS } from "@/lib/labels-normalize"

import { AnhBai } from "./anh-bai"
import { BangSo } from "./bang-so"
import { diTrang } from "./luu-nhan"
import { MaThe } from "./ma-the"

/** Lượt hai: bảng «Anh gắn · Bộ đọc · AI đọc», thẻ nhóm, ô trường hợp. Không có đường đổi nhãn đã lưu. Bỏ qua được. */

const THE_OPTIONS = [
  { value: "correct", label: "Đúng" },
  { value: "wrong", label: "Sai" },
  { value: "unsure", label: "Chưa xét được" },
]

/** Khoá của một lần bấm Ghi; đổi nội dung thì đổi khoá, «Thử lại» giữ nguyên khoá. */
const moiKhoa = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("")

/** Lỗi khi ghi trường hợp: nhãn đã an toàn, có «Thử lại». */
export function LoiTruongHop({ loi, onRetry, dangGhi }: { loi: string; onRetry: () => void; dangGhi: boolean }) {
  return (
    <Alert variant="destructive" data-labels-loi-truong-hop="">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{loi}</AlertTitle>
      <AlertDescription>Nhãn đã lưu an toàn. Thử lại, hoặc sang tin kế.</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={dangGhi}>
          <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
          Thử lại
        </Button>
      </AlertAction>
    </Alert>
  )
}

function GhiTruongHop({ d, hrefTinKe, diToi }: { d: DoiChieu; hrefTinKe: string; diToi: (href: string) => void }) {
  const [the, setThe] = useState<string | null>(null)
  const [kind, setKind] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [dangGhi, setDangGhi] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const [khoa, setKhoa] = useState(moiKhoa)
  const doi = <T,>(dat: (v: T) => void) => (v: T) => {
    dat(v)
    setKhoa(moiKhoa())
  }
  const sangTinKe = () => diToi(hrefTinKe)

  async function ghi() {
    if (!the && !kind && !note.trim()) return sangTinKe()
    setDangGhi(true)
    setLoi(null)
    try {
      const res = await fetch(`/api/v1/ops/labels/${d.itemId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ case_kind: kind, note, group_card_verdict: the, request_id: khoa }),
      })
      // Ghi xong giữ nút khoá tới khi trang chuyển, để không bấm được lần nữa.
      if (res.ok) return sangTinKe()
      const b = (await res.json().catch(() => ({}))) as { error?: string }
      setLoi(b.error ?? "Không ghi được trường hợp")
      setDangGhi(false)
    } catch {
      setLoi("Mất kết nối tới máy thu")
      setDangGhi(false)
    }
  }

  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0" data-labels-truong-hop="">
      <FrameHeader>
        <FrameTitle>Ghi trường hợp</FrameTitle>
        <FrameDescription className="text-xs text-pretty">
          Không bắt buộc. Không làm đổi nhãn đã lưu.
          {d.truongHop.length ? ` Anh đã ghi ${fmtInt(d.truongHop.length)} trường hợp cho bài này.` : ""}
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <FieldGroup className="gap-4">
          <div className="flex flex-col gap-1" data-labels-the="">
            <p className="text-sm font-medium">Thẻ nhóm</p>
            <p className="text-muted-foreground text-sm text-pretty wrap-anywhere">{d.the ?? "Nhóm chưa có thẻ"}</p>
          </div>
          {d.the ? (
            <Field>
              <FieldLabel htmlFor="th-the">Thẻ đúng với bài này không?</FieldLabel>
              <Select value={the} items={THE_OPTIONS} onValueChange={(v) => doi(setThe)(String(v))}>
                <SelectTrigger id="th-the" className="w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {THE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor="th-kind">Loại trường hợp</FieldLabel>
            <Select value={kind} items={[...CASE_KINDS]} onValueChange={(v) => doi(setKind)(String(v))}>
              <SelectTrigger id="th-kind" className="w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                <SelectGroup>
                  {CASE_KINDS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="th-note">Diễn giải</FieldLabel>
            <Textarea id="th-note" value={note} onChange={(e) => doi(setNote)(e.target.value)} placeholder="Bí danh này chưa có trong từ điển" />
          </Field>
          {loi ? <LoiTruongHop loi={loi} onRetry={ghi} dangGhi={dangGhi} /> : null}
        </FieldGroup>
      </FramePanel>
      <FrameFooter className="flex flex-row items-center justify-end gap-2">
        <Button variant="outline" onClick={sangTinKe} disabled={dangGhi}>Bỏ qua</Button>
        <Button onClick={ghi} disabled={dangGhi}>{dangGhi ? "Đang ghi…" : "Ghi và sang tin kế"}</Button>
      </FrameFooter>
    </Frame>
  )
}

export function LuotHai({ d, hrefTinKe, diToi = diTrang }: { d: DoiChieu; hrefTinKe: string; diToi?: (href: string) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-6" data-labels-luot-hai={d.itemId}>
      <Frame variant="default" spacing="sm" className="w-full min-w-0">
        <FrameHeader>
          <FrameTitle>Bài gốc</FrameTitle>
          <FrameDescription className="text-xs text-pretty">
            <MaThe itemId={d.itemId} /> · S03 · {d.groupName ?? "nhóm không rõ"}
            {d.postedAt ? ` · đăng ${fmtVnDateTime(d.postedAt)}` : ""}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <div className="flex min-w-0 flex-col gap-2">
            <AnhBai anh={d.anh} soLinkKhac={d.soLinkKhac} coChu={Boolean(d.text)} ghep={d.ghep} />
            {d.text ? <p className="text-sm whitespace-pre-line wrap-anywhere">{d.text}</p> : null}
          </div>
        </FramePanel>
      </Frame>
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <BangSo d={d} />
        <GhiTruongHop d={d} hrefTinKe={hrefTinKe} diToi={diToi} />
      </div>
    </div>
  )
}
