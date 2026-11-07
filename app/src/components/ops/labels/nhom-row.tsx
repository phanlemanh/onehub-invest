"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { BASIS_LABEL, FIELD_LABEL, type Basis } from "@/lib/labels-normalize"

import { BASIS_NGAN, type FieldDef, type O } from "./nhom-fields"

/** Đã chọn dùng nền primary ở chỗ gọi, không sửa tệp vendor (bản D). */
const DA_CHON = "text-xs data-pressed:bg-primary data-pressed:text-primary-foreground"

/** Một hàng biểu mẫu: nhãn · giá trị · căn cứ · ô «Không suy ra được». Lỗi hiện ngay dưới hàng, giữ chữ đã gõ. */
export function NhomRow({ d, o, loi, onChange }: { d: FieldDef; o: O; loi?: string; onChange: (patch: Partial<O>) => void }) {
  const ten = FIELD_LABEL[d.id]
  return (
    <div className="flex min-w-0 flex-col gap-1" data-o={d.id} data-loi={loi ? "" : undefined}>
      <div className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-2">
        <FieldLabel htmlFor={`nhan-${d.id}`} className="text-xs">
          {ten}
        </FieldLabel>
        {d.options ? (
          <ToggleGroup
            id={`nhan-${d.id}`}
            multiple={d.kind === "chon-nhieu"}
            value={o.value ? o.value.split(",") : []}
            // Chọn nhiều lưu mã nối dấu phẩy; chuẩn hoá sắp xếp, bỏ trùng ở labels-normalize.
            onValueChange={(v: string[]) => onChange({ value: d.kind === "chon-nhieu" ? v.join(",") : (v[0] ?? "") })}
            variant="outline"
            size="sm"
            spacing={1}
            disabled={o.unknown}
            className="flex-wrap justify-start"
            aria-label={ten}
          >
            {d.options.map((op) => (
              <ToggleGroupItem key={op.value} value={op.value} className={DA_CHON}>
                {op.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : (
          <Input
            id={`nhan-${d.id}`}
            inputMode={d.kind === "chu" ? undefined : "decimal"}
            placeholder={o.unknown ? "Không suy ra được" : d.placeholder}
            value={o.unknown ? "" : o.value}
            disabled={o.unknown}
            aria-invalid={loi ? true : undefined}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        )}
        {d.noBasis ? (
          <span />
        ) : (
          <div className="flex items-center gap-2">
            <ToggleGroup
              value={o.unknown ? [] : [o.basis]}
              onValueChange={(v: string[]) => {
                if (v[0]) onChange({ basis: v[0] as Basis })
              }}
              variant="outline"
              size="sm"
              spacing={0}
              disabled={o.unknown}
              aria-label={`${ten}: căn cứ`}
            >
              {BASIS_NGAN.map((b) => (
                <Tooltip key={b.value}>
                  <TooltipTrigger render={<ToggleGroupItem value={b.value} aria-label={BASIS_LABEL[b.value]} className={DA_CHON} />}>
                    {b.short}
                  </TooltipTrigger>
                  <TooltipContent>{BASIS_LABEL[b.value]}</TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex items-center" />}>
                <Checkbox checked={o.unknown} onCheckedChange={(v) => onChange({ unknown: v === true })} aria-label={`${ten}: không suy ra được`} />
              </TooltipTrigger>
              <TooltipContent>Không suy ra được</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {loi ? <FieldError>{loi}</FieldError> : null}
    </div>
  )
}
