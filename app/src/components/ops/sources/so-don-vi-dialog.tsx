"use client"

// Hộp «Khai thị trường, khu đô thị» của một đơn vị thu (PL12 so-nhom-mot-noi): cùng khuôn hộp «Chế độ thu» (mode-dialog);
// hai ô chọn nhiều theo @reui/c-combobox-12 (chip + ô gõ lọc). Thị trường là vùng cấp market; dự án là khu đô thị
// (Hỏi-3). Máy chủ kiểm lại tham chiếu (trigger 048); lỗi của nó hiện ngay trong hộp, hộp không đóng.
import { Fragment, useId, useState } from "react"
import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { DanhMuc, DonViRow } from "@/lib/so-don-vi"

export type KhaiChoice = { marketCodes: string[]; projectNodeIds: number[] }

export function SoDonViDialog({
  target,
  danhMuc,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  target: DonViRow | null
  danhMuc: DanhMuc
  pending: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (choice: KhaiChoice) => void
}) {
  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {target ? (
          <KhaiForm key={target.unit_code} target={target} danhMuc={danhMuc} pending={pending} error={error} onSubmit={onSubmit} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ChonNhieu({
  id,
  label,
  description,
  items,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  description: string
  items: { id: string; name: string }[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}) {
  const anchor = useComboboxAnchor()
  const ten = new Map(items.map((i) => [i.id, i.name]))
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        multiple
        autoHighlight
        items={items.map((i) => i.id)}
        value={value}
        onValueChange={(v: string[]) => onChange(v)}
        itemToStringLabel={(v: string) => ten.get(v) ?? v}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(values: string[]) => (
              <Fragment>
                {values.map((v) => (
                  <ComboboxChip key={v}>{ten.get(v) ?? v}</ComboboxChip>
                ))}
                <ComboboxChipsInput id={id} placeholder={values.length ? "" : placeholder} />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>Không có mục khớp.</ComboboxEmpty>
          <ComboboxList>
            {(v: string) => (
              <ComboboxItem key={v} value={v}>
                {ten.get(v) ?? v}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}

function KhaiForm({
  target,
  danhMuc,
  pending,
  error,
  onSubmit,
}: {
  target: DonViRow
  danhMuc: DanhMuc
  pending: boolean
  error: string | null
  onSubmit: (choice: KhaiChoice) => void
}) {
  const id = useId()
  const [markets, setMarkets] = useState<string[]>(target.market_codes)
  const [projects, setProjects] = useState<string[]>(target.project_node_ids.map(String))

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        if (!pending) onSubmit({ marketCodes: markets, projectNodeIds: projects.map(Number) })
      }}
    >
      <DialogHeader>
        <DialogTitle>Khai thị trường, khu đô thị</DialogTitle>
        <DialogDescription>
          {target.unit_code} · {target.original_name}. Để trống một ô là xoá khai báo của ô đó.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="gap-4">
        <ChonNhieu
          id={`${id}-thi-truong`}
          label="Thị trường"
          description="Thị trường mà đơn vị này thu tin."
          items={danhMuc.markets}
          value={markets}
          onChange={setMarkets}
          placeholder="Chọn thị trường…"
        />
        <ChonNhieu
          id={`${id}-du-an`}
          label="Khu đô thị"
          description="Khu đô thị mà nhóm chuyên về — bỏ trống nếu nhóm không chuyên một khu đô thị."
          items={danhMuc.projects.map((p) => ({ id: String(p.id), name: p.name }))}
          value={projects}
          onChange={setProjects}
          placeholder="Chọn khu đô thị…"
        />
        {error ? (
          <Alert variant="destructive" role="status">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Huỷ</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" aria-hidden="true" /> : null}
          Lưu
        </Button>
      </DialogFooter>
    </form>
  )
}
