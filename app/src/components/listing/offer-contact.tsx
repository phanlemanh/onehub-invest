"use client"

import { useState } from "react"
import { PhoneIcon, RotateCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** «+84912345678» → «0912 345 678»; số dạng khác giữ nguyên. */
export function phoneText(e164: string): string {
  const m = /^\+84(\d{3})(\d{3})(\d{3,4})$/.exec(e164)
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164
}

/**
 * Ô liên hệ của một tin: chưa có số thì nói thẳng; có số thì bấm một lần mới lấy về (không cần đăng nhập), rồi thành
 * link gọi. Số không nằm trong HTML trang hay danh sách API.
 */
export function OfferContact({ offerId, hasPhone }: { offerId: string; hasPhone: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "none" | "error">("idle")
  const [phone, setPhone] = useState<string | null>(null)

  async function reveal() {
    setState("loading")
    try {
      const res = await fetch(`/api/v1/listings/${encodeURIComponent(offerId)}/contact`)
      if (res.status === 404) return setState("none")
      if (!res.ok) return setState("error")
      const body = (await res.json()) as { phone: string }
      setPhone(body.phone)
      setState("idle")
    } catch {
      setState("error")
    }
  }

  if (!hasPhone || state === "none") return <span className="text-muted-foreground text-xs">Chưa có số</span>
  if (phone)
    return (
      <Button variant="outline" size="sm" nativeButton={false} render={<a href={`tel:${phone}`} />}>
        <PhoneIcon data-icon="inline-start" aria-hidden="true" />
        <span className="tabular-nums">{phoneText(phone)}</span>
      </Button>
    )
  if (state === "error")
    return (
      <Button variant="outline" size="sm" onClick={reveal} aria-label="Không lấy được số, thử lại">
        <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
        Thử lại
      </Button>
    )
  return (
    <Button variant="outline" size="sm" onClick={reveal} disabled={state === "loading"}>
      <PhoneIcon data-icon="inline-start" aria-hidden="true" />
      {state === "loading" ? "Đang lấy…" : "Xem số"}
    </Button>
  )
}
