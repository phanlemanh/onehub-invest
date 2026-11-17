"use client"

// Ô chọn một giá trị có tìm (combobox của ui/combobox, khuôn nút mở + ô tìm trong hộp như block form-5). Giá trị "" = trống.
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

type Muc = { id: string; name: string }

export function ChonMot({
  id,
  label,
  description,
  items,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  description: string
  items: Muc[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const chon = items.find((i) => i.id === value) ?? null
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={chon}
        disabled={disabled}
        onValueChange={(m: Muc | null) => onChange(m?.id ?? "")}
        itemToStringLabel={(m: Muc) => m.name}
        itemToStringValue={(m: Muc) => m.id}
      >
        <ComboboxTrigger
          render={<Button id={id} type="button" variant="outline" className="w-full justify-between font-normal" disabled={disabled} />}
        >
          <ComboboxValue>
            {(m: Muc | null) =>
              m ? <span className="truncate">{m.name}</span> : <span className="text-muted-foreground">{placeholder}</span>
            }
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent className="max-w-(--anchor-width) min-w-(--anchor-width)">
          <ComboboxInput showTrigger={false} placeholder="Tìm" />
          <ComboboxEmpty>Không có mục khớp.</ComboboxEmpty>
          <ComboboxList>
            {(m: Muc) => (
              <ComboboxItem key={m.id} value={m}>
                {m.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  )
}
