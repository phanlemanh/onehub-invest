import { useRef, useState, type FormEvent, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

import { NEW_SLO_DRAFT, WORKSPACE_NAME, type SloDraft } from "./data"
import { UI_ICONS } from "./icons"
import { budgetLine, SloFormFields, validateDraft } from "./slo-form-fields"
import { SHEET_FOOTER, SHEET_SHELL } from "./slo-sheet"

const FORM_ID = "devops-5-new-slo-form"
const ID_PREFIX = "devops-5-new"
/** SloFormFields ids its Name input `${idPrefix}-name`; the sheet opens on it. */
const NAME_FIELD = `#${ID_PREFIX}-name`

/** Mounted by SheetContent on every open, so each open seeds a fresh form. */
function NewSloForm({
  onCreate,
  onDone,
}: {
  onCreate: (draft: SloDraft) => void
  onDone: () => void
}) {
  const [values, setValues] = useState<SloDraft>(NEW_SLO_DRAFT)
  const valid = Object.keys(validateDraft(values)).length === 0
  const { downtime } = budgetLine(values)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    onCreate({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
    })
    onDone()
  }

  return (
    <>
      {/* Header band */}
      <div className="flex shrink-0 flex-col border-b px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <SheetTitle className="min-w-0 text-lg">New SLO</SheetTitle>
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
              />
            }
          >
            {UI_ICONS.close}
          </SheetClose>
        </div>
        <SheetDescription className="mt-1">
          Set an objective for a {WORKSPACE_NAME} service.
        </SheetDescription>
      </div>

      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Only the body scrolls; the header band and footer stay put. */}
        <div className="scroll-fade-y no-scrollbar min-h-0 flex-1 scroll-py-10 overflow-y-auto">
          <div className="flex flex-col gap-6 px-5 py-5">
            <SloFormFields
              idPrefix={ID_PREFIX}
              values={values}
              onChange={(patch) =>
                setValues((current) => ({ ...current, ...patch }))
              }
              variant="create"
            />
          </div>
        </div>

        <div className={SHEET_FOOTER}>
          {/* The budget stays in view while the body scrolls. */}
          <p
            aria-live="polite"
            className="text-muted-foreground me-auto min-w-0 truncate text-xs tabular-nums"
          >
            {downtime} per {values.windowDays} days
          </p>
          <SheetClose render={<Button type="button" variant="outline" />}>
            Cancel
          </SheetClose>
          <Button type="submit" disabled={!valid}>
            {UI_ICONS.plus}
            Create SLO
          </Button>
        </div>
      </form>
    </>
  )
}

/** Create shares the SLO sheet's shell: header band, scroll body, pinned footer. */
export function NewSloSheet({
  open,
  onOpenChange,
  onCreate,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (draft: SloDraft) => void
  returnFocusRef: RefObject<HTMLElement | null>
}) {
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    // Mounted closed and driven by a boolean, so the first open animates.
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={popupRef}
        side="right"
        showCloseButton={false}
        initialFocus={() =>
          popupRef.current?.querySelector<HTMLElement>(NAME_FIELD) ?? true
        }
        finalFocus={() => {
          const node = returnFocusRef.current
          return node?.isConnected ? node : true
        }}
        className={SHEET_SHELL}
      >
        <NewSloForm onCreate={onCreate} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}