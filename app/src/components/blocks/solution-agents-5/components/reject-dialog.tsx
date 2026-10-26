import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export interface RejectTarget {
  kind: "single" | "bulk"
  label: string
  count: number
}

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: RejectTarget | null
  reason: string
  onReasonChange: (value: string) => void
  onConfirm: () => void
}

export function RejectDialog({
  open,
  onOpenChange,
  target,
  reason,
  onReasonChange,
  onConfirm,
}: RejectDialogProps) {
  const isBulk = target?.kind === "bulk"
  const title = target ? `Reject ${target.label}?` : "Reject request?"
  const description = isBulk
    ? `The ${target?.count} selected requests return to their agents with your reason. The agents stop and will not run the actions.`
    : "This request returns to its agent with your reason. The agent stops and will not run the action."

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <Field>
          <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder='e.g. "No return scan on file"'
            className="min-h-24 resize-none"
          />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={reason.trim().length === 0}
            onClick={onConfirm}
          >
            Reject
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}