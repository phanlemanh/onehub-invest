import { type RefObject } from "react"

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

import { ALERT_CHANNEL } from "./data"

/** Centred by layout, not the stock -50% translate: an odd height lands that on
 *  a half pixel and smears every 1px separator across two rows. */
const CRISP_CENTER = "inset-0 m-auto h-fit translate-x-0 translate-y-0"

/** One confirm dialog serves the row menu, the bulk bar and the sheet menu;
 *  `origin` takes focus back on Cancel. */
export type PendingDelete = (
  { kind: "row"; id: string; name: string } | { kind: "bulk"; ids: string[] }
) & { origin: HTMLElement | null }

export const pendingIds = (pending: PendingDelete) =>
  pending.kind === "row" ? [pending.id] : pending.ids

/** The page row focus lands on after a delete: the next survivor, else the
 *  previous one, else null when the page empties. */
export function survivingNeighbour(pageIds: string[], deleted: string[]) {
  const first = pageIds.findIndex((id) => deleted.includes(id))
  const survives = (id: string) => !deleted.includes(id)
  return (
    pageIds.slice(first + 1).find(survives) ??
    pageIds.slice(0, Math.max(first, 0)).reverse().find(survives) ??
    null
  )
}

export function DeleteSlosDialog({
  open,
  onOpenChange,
  pending,
  focusTargetRef,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Kept while the dialog closes, so the exit animation keeps its copy. */
  pending: PendingDelete | null
  /** Set by a confirm to the neighbour's trigger; read once on close. */
  focusTargetRef: RefObject<HTMLElement | null>
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        className={CRISP_CENTER}
        finalFocus={() => {
          // A confirm sets a neighbour's trigger; Cancel falls back to the opener.
          const node = focusTargetRef.current ?? pending?.origin
          focusTargetRef.current = null
          return node?.isConnected ? node : true
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pending?.kind === "bulk"
              ? `Delete ${pending.ids.length} SLOs?`
              : "Delete SLO?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.kind === "bulk" ? (
              <>
                <span className="text-foreground font-medium">
                  {pending.ids.length} SLOs
                </span>{" "}
                and their budget history go, and their burn alerts stop reaching{" "}
                {ALERT_CHANNEL}.
              </>
            ) : (
              <>
                <span className="text-foreground font-medium">
                  {pending?.name}
                </span>{" "}
                and its budget history go, and its burn alerts stop reaching{" "}
                {ALERT_CHANNEL}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {pending?.kind === "bulk" ? "Delete SLOs" : "Delete SLO"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}