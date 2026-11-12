"use client"

// Hộp thoại xác nhận lệnh tạm dừng/bật lại một nguồn (TV4b `tam-dung-nguon-tu-cloud`, ADR-0015 §6): xem trước → sau,
// ghi lý do bắt buộc, gửi `POST /api/v1/ops/change-requests` kèm `tu_duyet` (route tự xử đích S03 chờ người thứ hai).
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { coTheGui, LY_DO_TOI_DA, nhanTruocSau } from "@/lib/lenh-hien"

type Loai = "pause" | "resume"

/** Câu lỗi cho người từ phản hồi của route — chữ gõ trong ô giữ nguyên để sửa rồi gửi lại. */
function cauLoi(status: number, body: { ly_do?: unknown } | null): string {
  if (body?.ly_do === "thieu-reason") return "Cần ghi lý do trước khi gửi."
  if (body?.ly_do === "ly-do-qua-dai") return `Lý do dài quá ${LY_DO_TOI_DA} ký tự.`
  if (status === 403) return "Vai của bạn không gửi được lệnh này."
  if (status === 409) return "Lệnh này đã được gửi."
  return "Không gửi được lệnh. Thử lại sau."
}

export function LenhNguonDialog({
  code,
  loai,
  open,
  onOpenChange,
  onDaGui,
}: {
  code: string
  loai: Loai
  open: boolean
  onOpenChange: (open: boolean) => void
  onDaGui: () => void
}) {
  const [lyDo, setLyDo] = useState("")
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState<string | null>(null)
  const khoa = useRef("")
  const guiRef = useRef(false)

  // Mỗi lần mở là một ý định mới: khoá idempotency mới, ô trống (bấm Gửi hai lần trong cùng lần mở chỉ ra một lệnh).
  useEffect(() => {
    if (!open) return
    khoa.current = crypto.randomUUID()
    setLyDo("")
    setLoi(null)
  }, [open])

  const [truoc, sau] = loai === "pause" ? ["active", "paused"] : ["paused", "active"]
  const hopLe = coTheGui(lyDo)

  async function gui() {
    if (!hopLe || guiRef.current) return
    guiRef.current = true
    setDangGui(true)
    setLoi(null)
    const t = lyDo.trim()
    const body =
      loai === "pause"
        ? { type: "source.pause", target: code, payload: { reason: t }, ly_do: t, tu_duyet: true, idempotency_key: khoa.current }
        : { type: "source.resume", target: code, payload: {}, ly_do: t, tu_duyet: true, idempotency_key: khoa.current }
    try {
      const res = await fetch("/api/v1/ops/change-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        setLoi(cauLoi(res.status, (await res.json().catch(() => null)) as { ly_do?: unknown } | null))
        return
      }
      toast.success(`Đã gửi lệnh ${loai === "pause" ? "tạm dừng" : "bật lại"} ${code}`)
      onOpenChange(false)
      onDaGui()
    } catch {
      setLoi("Không gửi được lệnh. Thử lại sau.")
    } finally {
      guiRef.current = false
      setDangGui(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{loai === "pause" ? `Tạm dừng ${code}?` : `Bật lại ${code}?`}</DialogTitle>
          <DialogDescription>
            {loai === "pause"
              ? `Lượt thu kế tiếp của ${code} không chạy. Bật lại cần quản trị viên.`
              : `Lượt thu kế tiếp của ${code} chạy lại.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Trạng thái:</span>
            <span>
              {nhanTruocSau(truoc)} → {nhanTruocSau(sau)}
            </span>
            <Badge variant={sau === "paused" ? "warning-light" : "success-light"}>{nhanTruocSau(sau)}</Badge>
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`ly-do-${code}`}>Lý do</Label>
            <Textarea
              id={`ly-do-${code}`}
              value={lyDo}
              maxLength={LY_DO_TOI_DA + 50}
              onChange={(e) => setLyDo(e.target.value)}
              aria-describedby={`ly-do-${code}-phu`}
            />
            <p id={`ly-do-${code}-phu`} className="text-muted-foreground flex justify-between gap-2 text-xs">
              <span>{lyDo.trim() ? "" : "Ghi lý do để đội biết vì sao"}</span>
              <span className="tabular-nums">
                {lyDo.trim().length}/{LY_DO_TOI_DA}
              </span>
            </p>
          </div>
          {loi ? (
            <Alert variant="destructive">
              <AlertDescription>{loi}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={gui} disabled={!hopLe || dangGui}>
            {dangGui ? "Đang gửi…" : "Gửi lệnh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
