"use client"

import { useId } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { fmtInt } from "@/lib/format"

/** Trần độ dài lý do — route decide trả 400 khi vượt (PL3). */
export const LY_DO_TOI_DA = 1000

/** Lý do sau khi cắt khoảng trắng hai đầu; rỗng → null (chưa quyết được). */
export function lyDoHopLe(v: string): string | null {
  const t = v.trim()
  return t.length === 0 || t.length > LY_DO_TOI_DA ? null : t
}

/**
 * Ô «Lý do» ở chân sheet hàng duyệt (PL3) — ghép `ui/field` + `ui/textarea` như reject-dialog của solution-agents-5.
 * Bắt buộc cho mọi quyết định: trống thì nút quyết tắt và mô tả nói vì sao.
 */
export function ReviewReason({ value, onChange, disabled }: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const id = useId()
  const trong = value.trim().length === 0
  return (
    <Field data-invalid={!trong && lyDoHopLe(value) === null ? true : undefined}>
      <FieldLabel htmlFor={id}>Lý do</FieldLabel>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={LY_DO_TOI_DA}
        disabled={disabled}
        placeholder="Vì sao bạn quyết như vậy — ghi vào nhật ký cùng quyết định"
        className="min-h-20 resize-none"
        data-review-reason
      />
      <FieldDescription className="tabular-nums">
        {trong ? "Ghi lý do trước khi quyết" : `${fmtInt(value.trim().length)}/${fmtInt(LY_DO_TOI_DA)} ký tự`}
      </FieldDescription>
    </Field>
  )
}
