"use client"

import { useId } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { fmtInt } from "@/lib/format"
import { LY_DO_TOI_DA, lyDoHopLe } from "@/lib/ops/review-can-cu"

/**
 * Ô «Lý do» ở chân sheet hàng duyệt (PL3) — ghép `ui/field` + `ui/textarea` như reject-dialog của solution-agents-5.
 * OD2 (Q4): để trống thì nhãn đáp án đã bấm là lý do; chữ gõ thắng nhãn. Thẻ Bổ sung tin còn bắt gõ khi «Bỏ».
 */
export function ReviewReason({ value, onChange, disabled, batBo = false }: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  batBo?: boolean
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
        placeholder="Vì sao quyết như vậy — ghi vào nhật ký cùng quyết định"
        className="min-h-20 resize-none"
        data-review-reason
      />
      <FieldDescription className="tabular-nums">
        {trong
          ? batBo
            ? "Để trống thì ghi nhãn đáp án làm lý do; «Bỏ» cần lý do gõ tay"
            : "Để trống thì ghi nhãn đáp án làm lý do"
          : `${fmtInt(value.trim().length)}/${fmtInt(LY_DO_TOI_DA)} ký tự`}
      </FieldDescription>
    </Field>
  )
}
