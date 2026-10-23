"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (new-connection-sheet.tsx, connection-form-fields.tsx):
// sheet tạo kết nối rút gọn còn ba trường — nguồn, URL/key, tên hiển thị. Bỏ bước
// chọn tích hợp, kiểm thử kết nối và khoá xác thực (nhóm thu không có khoá).
import { useId } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export type GroupDraft = { sourceCode: "S05" | "S06"; groupKey: string; name: string }

const SOURCES = [
  { value: "S05", label: "S05 Facebook" },
  { value: "S06", label: "S06 Chợ Tốt" },
] as const

export function NewGroupSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  pending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: GroupDraft
  onDraftChange: (draft: GroupDraft) => void
  pending: boolean
  onSubmit: () => void
}) {
  const id = useId()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Thêm nhóm thu</SheetTitle>
          <SheetDescription>Hiệu lực từ chu kỳ thu kế tiếp, không cần sửa code.</SheetDescription>
        </SheetHeader>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <FieldGroup className="px-4">
            <Field>
              <FieldLabel htmlFor={`${id}-source`}>Nguồn</FieldLabel>
              <Select
                value={draft.sourceCode}
                items={SOURCES}
                onValueChange={(next) => {
                  const match = SOURCES.find((s) => s.value === next)
                  if (match) onDraftChange({ ...draft, sourceCode: match.value })
                }}
              >
                <SelectTrigger id={`${id}-source`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-key`}>{draft.sourceCode === "S05" ? "URL nhóm" : "Mã tỉnh/TP"}</FieldLabel>
              <Input
                id={`${id}-key`}
                value={draft.groupKey}
                onChange={(e) => onDraftChange({ ...draft, groupKey: e.target.value })}
                placeholder={draft.sourceCode === "S05" ? "https://www.facebook.com/groups/…" : "vd danang"}
              />
              {draft.sourceCode === "S06" ? (
                <FieldDescription>Chợ Tốt cần thêm tham số vùng (region_v2, cityCode) — tạm thêm bằng SQL; giao diện đầy đủ cho S06 ở vòng sau.</FieldDescription>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Tên hiển thị</FieldLabel>
              <Input id={`${id}-name`} value={draft.name} onChange={(e) => onDraftChange({ ...draft, name: e.target.value })} />
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={pending}>
              Lưu
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
