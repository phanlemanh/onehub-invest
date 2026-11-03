"use client"

import { useState } from "react"
import { PhoneIcon, RotateCwIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"

/** «+84912345678» → «0912 345 678»; số dạng khác giữ nguyên. */
export function phoneText(e164: string): string {
  const m = /^\+84(\d{3})(\d{3})(\d{3,4})$/.exec(e164)
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164
}

/**
 * Ô liên hệ của một tin: chưa có số thì nói thẳng; có số thì bấm một lần mới lấy về (không cần đăng nhập), rồi thành
 * link gọi. Số không nằm trong HTML trang hay danh sách API. Số chưa xác minh luôn kèm nhãn, trước và sau khi bấm; câu trả
 * lời của route mới hơn danh sách nên thắng khi hai bên khác nhau.
 */
export function OfferContact({ offerId, hasPhone, inferred }: { offerId: string; hasPhone: boolean; inferred: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "none" | "error">("idle")
  const [phone, setPhone] = useState<string | null>(null)
  const [freshInferred, setFreshInferred] = useState<boolean | null>(null)

  async function reveal() {
    setState("loading")
    try {
      const res = await fetch(`/api/v1/listings/${encodeURIComponent(offerId)}/contact`)
      if (res.status === 404) return setState("none")
      if (!res.ok) return setState("error")
      const body = (await res.json()) as { phone: string; inferred: boolean }
      setPhone(body.phone)
      setFreshInferred(body.inferred)
      setState("idle")
    } catch {
      setState("error")
    }
  }

  if (!hasPhone || state === "none") return <Badge variant="secondary">Chưa có số</Badge>
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {(freshInferred ?? inferred) ? <Badge variant="warning-light">Chưa xác minh</Badge> : null}
      {phone ? (
        <Button variant="outline" size="sm" nativeButton={false} render={<a href={`tel:${phone}`} />}>
          <PhoneIcon data-icon="inline-start" aria-hidden="true" />
          <span className="tabular-nums">{phoneText(phone)}</span>
        </Button>
      ) : state === "error" ? (
        <Button variant="outline" size="sm" onClick={reveal} aria-label="Không lấy được số, thử lại">
          <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
          Thử lại
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={reveal} disabled={state === "loading"}>
          <PhoneIcon data-icon="inline-start" aria-hidden="true" />
          {state === "loading" ? "Đang lấy…" : "Xem số"}
        </Button>
      )}
    </div>
  )
}
