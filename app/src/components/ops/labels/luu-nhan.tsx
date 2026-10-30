"use client"

import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { DA_GAN_CUA_TOI, type LabelField, type RawLabels } from "@/lib/labels-normalize"

/**
 * Một lượt lưu nhãn của biểu mẫu /ops/labels (hàng nhan-gia-va-luu-loi-mang): năm kết cục tách khỏi component để đo
 * được bằng phản hồi thật của route, và Alert tại chỗ khi mất kết nối.
 */

type LoiTheoO = Partial<Record<LabelField, string>>
/** Năm kết cục của một lượt lưu — tách khỏi component để đo được bằng phản hồi thật của route. */
export type KetCuc =
  | { kind: "da-luu" }
  | { kind: "loi-truong"; loi: LoiTheoO }
  | { kind: "da-co-nguoi"; error: string }
  | { kind: "loi-may-chu"; error: string }
  | { kind: "mat-ket-noi" }

export async function guiNhan(
  fetchFn: typeof fetch,
  body: { lat: string; item_id: number; values: RawLabels },
): Promise<KetCuc> {
  let res: Response
  try {
    res = await fetchFn("/api/v1/ops/labels", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    // Lỗi mạng có thể xảy ra SAU khi máy thu đã ghi — bên gọi không được khẳng định «chưa lưu».
    return { kind: "mat-ket-noi" }
  }
  const b = (await res.json().catch(() => ({}))) as { error?: string; loi?: LoiTheoO }
  if (res.ok) return { kind: "da-luu" }
  if (res.status === 400 && b.loi) return { kind: "loi-truong", loi: b.loi }
  // 409 của chính người gắn: lượt trước (mất phản hồi) đã vào → coi là đã lưu.
  if (res.status === 409) return b.error === DA_GAN_CUA_TOI ? { kind: "da-luu" } : { kind: "da-co-nguoi", error: b.error ?? "Tin này vừa có người gắn" }
  return { kind: "loi-may-chu", error: b.error ?? "Không lưu được nhãn — thử lại" }
}

/** Lỗi mạng khi Lưu: tại chỗ, có «Lưu lại» (luật ReUI: lỗi vùng dữ liệu kèm Thử lại). */
export function LuuLoiAlert({ onRetry, dangLuu }: { onRetry: () => void; dangLuu: boolean }) {
  return (
    <Alert variant="destructive" data-labels-mat-ket-noi="">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Không chắc đã lưu — mất kết nối tới máy thu</AlertTitle>
      <AlertDescription>Chữ đã gõ còn nguyên. Khi có mạng, bấm «Lưu lại».</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={dangLuu}>
          <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
          Lưu lại
        </Button>
      </AlertAction>
    </Alert>
  )
}

