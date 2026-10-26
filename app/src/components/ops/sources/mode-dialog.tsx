"use client"

// Hộp «Chế độ thu» của một điểm thu (hồ sơ che-do-thu-tren-ops): ToggleGroup ba chế độ theo khuôn slo-form-fields
// (@reui/solution-dev-ops-5), trường theo new-group-sheet. Chọn Bùng mới hiện ô «Hạn bùng» (min hôm nay, max hôm nay + 13,
// hôm nay do máy chủ tính theo giờ VN); «Lưu» khoá khi Bùng chưa có hạn. Tiêu đề chỉ ghi mã nguồn + id — tên nhóm là
// tầng A. Máy chủ kiểm lại mọi luật (lib/che-do-thu.ts); lỗi của nó hiện ngay trong hộp.
import { useId, useState } from "react"
import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CHE_DO, NHAN_CHE_DO, TRAN_DEM_BUNG, hanToiDa, isCheDo, type CheDo } from "@/lib/che-do-thu-luat"

export type ModeTarget = { id: number; source_code: string; mode: string | null; burst_until: string | null }
export type ModeChoice = { mode: CheDo; burstUntil: string | null }

export function ModeDialog({
  target,
  homNay,
  pending,
  error,
  onOpenChange,
  onSubmit,
}: {
  target: ModeTarget | null
  homNay: string
  pending: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (choice: ModeChoice) => void
}) {
  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {target ? (
          <ModeForm key={target.id} target={target} homNay={homNay} pending={pending} error={error} onSubmit={onSubmit} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ModeForm({
  target,
  homNay,
  pending,
  error,
  onSubmit,
}: {
  target: ModeTarget
  homNay: string
  pending: boolean
  error: string | null
  onSubmit: (choice: ModeChoice) => void
}) {
  const id = useId()
  const [mode, setMode] = useState<CheDo | null>(isCheDo(target.mode) ? target.mode : null)
  const [han, setHan] = useState(target.mode === "bung" ? (target.burst_until ?? "") : "")
  const canSave = mode !== null && (mode !== "bung" || han !== "") && !pending

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave && mode) onSubmit({ mode, burstUntil: mode === "bung" ? han : null })
      }}
    >
      <DialogHeader>
        <DialogTitle>Chế độ thu</DialogTitle>
        <DialogDescription>
          {target.source_code} · điểm #{target.id}. Bật Bùng cần hạn; máy tự về Duy trì khi hết hạn.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel id={`${id}-mode-label`}>Chế độ</FieldLabel>
          <ToggleGroup
            multiple={false}
            value={mode ? [mode] : []}
            onValueChange={(value: string[]) => {
              const next = value[0]
              if (isCheDo(next)) setMode(next)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-labelledby={`${id}-mode-label`}
            className="w-full"
          >
            {CHE_DO.map((m) => (
              <ToggleGroupItem key={m} value={m} className="text-muted-foreground data-pressed:text-foreground flex-1">
                {NHAN_CHE_DO[m]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        {mode === "bung" ? (
          <Field>
            <FieldLabel htmlFor={`${id}-han`}>Hạn bùng</FieldLabel>
            <Input
              id={`${id}-han`}
              type="date"
              value={han}
              min={homNay}
              max={hanToiDa(homNay)}
              onChange={(e) => setHan(e.target.value)}
              required
            />
            <FieldDescription>Tối đa {TRAN_DEM_BUNG} đêm; hết hạn máy tự về Duy trì.</FieldDescription>
          </Field>
        ) : null}
        {error ? (
          <Alert variant="destructive" role="status">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Huỷ</DialogClose>
        <Button type="submit" disabled={!canSave}>
          {pending ? <Spinner data-icon="inline-start" aria-hidden="true" /> : null}
          Lưu
        </Button>
      </DialogFooter>
    </form>
  )
}
