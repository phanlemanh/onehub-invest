import { useState, type FormEvent, type RefObject } from "react"
import { cn } from "cn"

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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  AUTH_KINDS,
  consumerSentence,
  formatDay,
  MIN_SECRET,
  plural,
  RENEW_DAYS,
  VAULT_NAME,
  type Connection,
  type ConsumerId,
} from "./data"
import { UI_ICONS } from "./icons"

/** Centred by layout, not the stock -50% translate: an odd height lands that on
 *  a half pixel and smears every 1px separator across two rows. */
const CRISP_CENTER = "inset-0 m-auto h-fit translate-x-0 translate-y-0"

// ── Delete connections ──

/** One confirm serves the row menu, the bulk bar and the sheet menu;
 *  `origin` takes focus back on Cancel. */
export type PendingDelete = (
  | {
      kind: "row"
      id: string
      name: string
      linked: number
      consumers: ConsumerId[]
    }
  | { kind: "bulk"; ids: string[]; linked: number }
) & { origin: HTMLElement | null }

export const pendingIds = (pending: PendingDelete) =>
  pending.kind === "row" ? [pending.id] : pending.ids

/** Who stops getting data when these connections go. */
export function deleteImpact(connections: Connection[]) {
  const linked = connections.flatMap((connection) =>
    connection.datasets.filter((dataset) => dataset.linked)
  )
  const consumers = [
    ...new Set(linked.flatMap((dataset) => dataset.consumers ?? [])),
  ]
  return { linked: linked.length, consumers }
}

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

export function DeleteConnectionsDialog({
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
              ? `Delete ${pending.ids.length} Connections?`
              : "Delete Connection?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.kind === "bulk" ? (
              <>
                <span className="text-foreground font-medium">
                  {pending.ids.length} connections
                </span>{" "}
                go with their credentials, and{" "}
                {plural(pending.linked, "linked dataset")} stop syncing.
              </>
            ) : pending ? (
              <>
                <span className="text-foreground font-medium">
                  {pending.name}
                </span>{" "}
                goes with its credential, and{" "}
                {plural(pending.linked, "linked dataset")} stop syncing
                {pending.consumers.length > 0
                  ? `. Still read by ${consumerSentence(pending.consumers)}.`
                  : "."}
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {pending?.kind === "bulk" ? "Delete All" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Unlink a dataset something still reads ──

export type PendingUnlink = {
  connectionId: string
  datasetId: string
  name: string
  consumers: ConsumerId[]
  origin: HTMLElement | null
}

export function UnlinkDatasetDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: PendingUnlink | null
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        className={CRISP_CENTER}
        finalFocus={() =>
          pending?.origin?.isConnected ? pending.origin : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink Dataset?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-mono font-medium">
              {pending?.name}
            </span>{" "}
            stops syncing, so{" "}
            {pending ? consumerSentence(pending.consumers) : ""}{" "}
            {pending?.consumers.length === 1 ? "reads" : "read"} stale data from
            the next run.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Unlink
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Rotate a secret or renew an authorization ──

function CredentialForm({
  connection,
  onRotate,
  onRenew,
}: {
  connection: Connection
  onRotate: (id: string, secret: string) => void
  onRenew: (id: string) => void
}) {
  const auth = AUTH_KINDS[connection.credential.kind]
  const [secret, setSecret] = useState("")
  const [touched, setTouched] = useState(false)
  const error =
    secret.trim().length < MIN_SECRET
      ? `Paste the full ${auth.secret.toLowerCase()}, at least ${MIN_SECRET} characters.`
      : null
  const failing = connection.health === "failing"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (auth.renewable) {
      onRenew(connection.id)
      return
    }
    setTouched(true)
    if (error) return
    onRotate(connection.id, secret)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>
          {auth.renewable ? "Renew Authorization" : "Rotate Credential"}
        </DialogTitle>
        <DialogDescription>
          {auth.renewable
            ? `Re-runs the ${auth.label} grant for ${connection.name}.`
            : `Replaces the ${auth.secret.toLowerCase()} ${connection.name} signs in with.`}
        </DialogDescription>
      </DialogHeader>

      {auth.renewable ? (
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Granted to</dt>
          <dd className="min-w-0 truncate">
            {connection.credential.principal}
          </dd>
          <dt className="text-muted-foreground">Last grant</dt>
          <dd className="tabular-nums">
            {formatDay(connection.credential.rotatedAt)}
          </dd>
          <dt className="text-muted-foreground">Valid for</dt>
          <dd>{RENEW_DAYS} days after renewal</dd>
        </dl>
      ) : (
        <FieldGroup>
          <Field data-invalid={touched && error ? true : undefined}>
            <FieldLabel htmlFor="devops-6-secret">
              New {auth.secret.toLowerCase()}
            </FieldLabel>
            <Input
              id="devops-6-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && error ? true : undefined}
              autoComplete="new-password"
              spellCheck={false}
              className="font-mono"
            />
            {touched && error ? (
              <FieldError>{error}</FieldError>
            ) : (
              <FieldDescription>
                Stored in the {VAULT_NAME}; only its last four characters show
                here.
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit">
          {auth.renewable ? UI_ICONS.sync : UI_ICONS.key}
          {auth.renewable ? "Renew" : failing ? "Reconnect" : "Rotate"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CredentialDialog({
  connection,
  open,
  onOpenChange,
  resolveReturnFocus,
  onRotate,
  onRenew,
}: {
  /** Kept while the dialog closes, so the exit keeps its copy. */
  connection: Connection | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The opener, or a surviving neighbour when a fix removed the opener's row. */
  resolveReturnFocus: () => HTMLElement | null
  onRotate: (id: string, secret: string) => void
  onRenew: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(CRISP_CENTER, "sm:max-w-md")}
        finalFocus={() => resolveReturnFocus() ?? true}
      >
        {connection ? (
          <CredentialForm
            // The popup unmounts once closed, so no secret survives a close.
            key={connection.id}
            connection={connection}
            onRotate={(id, secret) => {
              onRotate(id, secret)
              onOpenChange(false)
            }}
            onRenew={(id) => {
              onRenew(id)
              onOpenChange(false)
            }}
          />
        ) : (
          <DialogTitle className="sr-only">Credential</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  )
}