"use client"

// This file keeps "use no memo": its cell templates read state through builder
// calls on a stable row/column, which React Compiler cannot see.
"use no memo"

import { createContext, memo, useContext, type ReactNode } from "react"
import { Badge } from "@/components/reui/badge"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table"
import { type ColumnDef } from "@tanstack/react-table"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import {
  AUTH_KINDS,
  DATASET_KINDS,
  formatCompact,
  formatRelative,
  FREQUENCIES,
  INTEGRATIONS,
  lastGoodSync,
  linkedOf,
  PERSON_BY_ID,
  plural,
  rowsOf,
  STATUS_ORDER,
  statusOf,
  type Connection,
  type SheetTab,
} from "./data"
import { UI_ICONS } from "./icons"
import {
  DotSeparator,
  EnvironmentFace,
  OwnerFace,
  StatusFace,
  TextLink,
} from "./value-faces"

/** The columns Display can hide; the grid renders one table per group, so
 *  the list lives here rather than on any one table instance. */
export const OPTIONAL_COLUMNS = [
  { id: "status", label: "Status" },
  { id: "datasets", label: "Datasets" },
  { id: "linked", label: "Linked" },
  { id: "lastSync", label: "Last Sync" },
  { id: "rows", label: "Rows 24h" },
  { id: "environment", label: "Environment" },
  { id: "owner", label: "Owner" },
  { id: "sync", label: "Sync" },
]

export type ConnectionRowAction =
  | "view"
  | "edit"
  | "preview"
  | "sync"
  | "pause"
  | "resume"
  | "credential"
  | "duplicate"
  | "delete"

export type ConnectionColumnHandlers = {
  onOpen: (id: string, tab: SheetTab, datasetId?: string) => void
  onTogglePaused: (id: string, paused: boolean) => void
  onAction: (action: ConnectionRowAction, connection: Connection) => void
}

/** The open sheet's connection id: its name cell tints the row and sets aria-current. */
export const ActiveConnectionContext = createContext<string | null>(null)

/** Focus ring for hover-card triggers: hover reveals detail, a click opens. */
const HOVER_TARGET =
  "focus-visible:outline-ring/50 cursor-pointer outline-offset-2 focus-visible:outline-2"

// ── Hover card parts: head and rule ──

function CardHead({
  title,
  value,
  className,
}: {
  title: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate font-medium">{title}</span>
      <span
        className={cn(
          "shrink-0 font-semibold whitespace-nowrap tabular-nums",
          className
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ── Cells ──

function NameCell({
  connection,
  onOpen,
}: {
  connection: Connection
  onOpen: ConnectionColumnHandlers["onOpen"]
}) {
  const active = useContext(ActiveConnectionContext) === connection.id
  return (
    <div
      data-active-row={active ? "" : undefined}
      className="flex min-w-0 items-center gap-2.5"
    >
      {/* The mark sits bare: a brand logo already reads as its own object. */}
      <span
        aria-hidden="true"
        className="flex size-5 shrink-0 items-center justify-center [&_svg]:size-5"
      >
        {INTEGRATIONS[connection.integration].logo}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <TextLink
          aria-label={`Open ${connection.name}`}
          aria-current={active ? "true" : undefined}
          onClick={(event) => {
            event.stopPropagation()
            onOpen(connection.id, "overview")
          }}
          className="max-w-full self-start"
        >
          {connection.name}
        </TextLink>
        <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
          <span className="shrink-0">
            {INTEGRATIONS[connection.integration].label}
          </span>
          <DotSeparator />
          <span className="truncate font-mono">{connection.endpoint}</span>
        </span>
      </div>
    </div>
  )
}

/** The datasets a connection feeds: the first by name (drift first), a +N
 *  chip, and a hover card that previews any of them. */
function DatasetsCell({
  connection,
  onOpen,
}: {
  connection: Connection
  onOpen: ConnectionColumnHandlers["onOpen"]
}) {
  const linked = [...linkedOf(connection)].sort(
    (a, b) => b.drift.length - a.drift.length
  )
  const first = linked[0]
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={`${connection.name}: ${linked.length} of ${plural(connection.datasets.length, "dataset")} linked, open datasets`}
            className={cn(
              "flex max-w-full min-w-0 flex-col gap-1 text-left",
              HOVER_TARGET
            )}
            onClick={(event) => {
              event.stopPropagation()
              onOpen(connection.id, "datasets")
            }}
          />
        }
      >
        <span className="flex max-w-full min-w-0 items-center gap-1">
          {first ? (
            <Badge
              variant={first.drift.length > 0 ? "warning-light" : "outline"}
              // Badge is shrink-0 by default; this one yields so the +N stays in view.
              className="min-w-0 shrink font-mono"
            >
              <span className="truncate">{first.name}</span>
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">None linked</span>
          )}
          {linked.length > 1 ? (
            <Badge variant="outline" className="shrink-0 tabular-nums">
              +{linked.length - 1}
            </Badge>
          ) : null}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="flex w-80 flex-col gap-2.5">
        <CardHead
          title="Linked Datasets"
          value={`${linked.length} of ${connection.datasets.length}`}
        />
        <Separator />
        {linked.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nothing linked yet: open Datasets to pick some.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {linked.map((dataset) => (
              <li
                key={dataset.id}
                className="flex min-w-0 items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="text-muted-foreground flex shrink-0 [&_svg:not([class*=size-])]:size-3.5">
                    {DATASET_KINDS[dataset.kind].icon}
                  </span>
                  <span className="truncate font-mono">{dataset.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "tabular-nums",
                      dataset.drift.length > 0
                        ? "text-warning font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {dataset.drift.length > 0
                      ? `+${plural(dataset.drift.length, "column")}`
                      : formatCompact(dataset.rows)}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    aria-label={`Preview ${dataset.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(connection.id, "preview", dataset.id)
                    }}
                  >
                    Preview
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

/** One segment per dataset: linked fills, drifted ones in amber, the count on
 *  one right-hand numeric spine. */
function LinkedCell({ connection }: { connection: Connection }) {
  const ordered = [...connection.datasets].sort(
    (a, b) =>
      Number(b.linked) - Number(a.linked) || b.drift.length - a.drift.length
  )
  const linked = linkedOf(connection).length
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`${linked} of ${plural(connection.datasets.length, "dataset")} linked`}
    >
      <span className="flex h-1.5 min-w-16 flex-1 gap-1" aria-hidden="true">
        {ordered.map((dataset) => (
          <span
            key={dataset.id}
            className={cn(
              "flex-1 rounded-full",
              !dataset.linked
                ? "bg-muted"
                : dataset.drift.length > 0
                  ? "bg-warning"
                  : "bg-info"
            )}
          />
        ))}
      </span>
      <span className="w-8 shrink-0 text-right text-sm tabular-nums">
        {linked}/{connection.datasets.length}
      </span>
    </div>
  )
}

function LastSyncCell({ connection }: { connection: Connection }) {
  const synced = lastGoodSync(connection.runs)
  const lastRun = connection.runs[0]
  const failedLast = lastRun?.outcome === "failed"
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span
        className={cn(
          "truncate text-sm tabular-nums",
          failedLast && "text-destructive"
        )}
      >
        {connection.syncing
          ? "Syncing now"
          : failedLast
            ? `Failed ${formatRelative(lastRun.startedAt)}`
            : synced === null
              ? "Never"
              : formatRelative(synced)}
      </span>
      <span className="text-muted-foreground truncate text-xs">
        {FREQUENCIES[connection.frequency].short}
      </span>
    </div>
  )
}

const SyncCell = memo(function SyncCell({
  connection,
  onToggle,
}: {
  connection: Connection
  onToggle: ConnectionColumnHandlers["onTogglePaused"]
}) {
  return (
    // The wrapper, not the Switch, stops the click: Base UI re-dispatches it
    // on a hidden input that would otherwise reach the row and open the sheet.
    <div
      className="flex items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <Switch
        size="sm"
        checked={!connection.paused}
        onCheckedChange={(checked) => onToggle(connection.id, !checked)}
        aria-label={`Syncs for ${connection.name}`}
      />
    </div>
  )
})

function ActionsCell({
  connection,
  onAction,
  triggerRef,
}: {
  connection: Connection
  onAction: ConnectionColumnHandlers["onAction"]
  triggerRef: (node: HTMLButtonElement | null) => void
}) {
  const renewable = AUTH_KINDS[connection.credential.kind].renewable
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            size="icon-sm"
            variant="ghost"
            aria-label={`Actions for ${connection.name}`}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        {UI_ICONS.more}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAction("view", connection)}>
            {UI_ICONS.view}
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("preview", connection)}>
            {UI_ICONS.rows}
            Preview Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("edit", connection)}>
            {UI_ICONS.edit}
            Edit Connection
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={connection.paused || connection.syncing}
            onClick={() => onAction("sync", connection)}
          >
            {UI_ICONS.sync}
            Sync Now
          </DropdownMenuItem>
          {connection.paused ? (
            <DropdownMenuItem onClick={() => onAction("resume", connection)}>
              {UI_ICONS.resume}
              Resume Syncs
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onAction("pause", connection)}>
              {UI_ICONS.pause}
              Pause Syncs
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onAction("credential", connection)}>
            {UI_ICONS.key}
            {renewable ? "Renew Authorization" : "Rotate Credential"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("duplicate", connection)}>
            {UI_ICONS.copy}
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onAction("delete", connection)}
          >
            {UI_ICONS.trash}
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Column factory ──

export function createConnectionColumns(
  handlers: ConnectionColumnHandlers,
  registerTrigger: (id: string) => (node: HTMLButtonElement | null) => void
): ColumnDef<DataGridFeatures, Connection>[] {
  const { onOpen, onTogglePaused, onAction } = handlers
  return [
    {
      id: "select",
      header: () => <DataGridTableRowSelectAll />,
      // Same hidden-input bubbling as the Switch: keep the click off the row.
      cell: ({ row }) => (
        <div className="flex" onClick={(event) => event.stopPropagation()}>
          <DataGridTableRowSelect row={row} />
        </div>
      ),
      size: 40,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => <NameCell connection={row.original} onOpen={onOpen} />,
      size: 264,
      enableHiding: false,
      meta: { headerTitle: "Connection" },
    },
    {
      id: "status",
      accessorFn: (connection) => STATUS_ORDER.indexOf(statusOf(connection)),
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <span className="flex">
          <StatusFace status={statusOf(row.original)} />
        </span>
      ),
      size: 112,
      meta: { headerTitle: "Status" },
    },
    {
      id: "datasets",
      accessorFn: (connection) => linkedOf(connection).length,
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <DatasetsCell connection={row.original} onOpen={onOpen} />
      ),
      size: 196,
      meta: { headerTitle: "Datasets" },
    },
    {
      id: "linked",
      accessorFn: (connection) =>
        connection.datasets.length === 0
          ? 0
          : linkedOf(connection).length / connection.datasets.length,
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => <LinkedCell connection={row.original} />,
      size: 148,
      meta: { headerTitle: "Linked" },
    },
    {
      id: "lastSync",
      accessorFn: (connection) => lastGoodSync(connection.runs) ?? 0,
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => <LastSyncCell connection={row.original} />,
      size: 124,
      meta: { headerTitle: "Last Sync" },
    },
    {
      id: "rows",
      accessorFn: (connection) => rowsOf(connection),
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCompact(rowsOf(row.original))}
        </span>
      ),
      size: 120,
      meta: { headerTitle: "Rows 24h" },
    },
    {
      id: "environment",
      accessorKey: "environment",
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <span className="flex">
          <EnvironmentFace environment={row.original.environment} />
        </span>
      ),
      size: 112,
      meta: { headerTitle: "Environment" },
    },
    {
      id: "owner",
      accessorFn: (connection) =>
        PERSON_BY_ID.get(connection.ownerId)?.name ?? "",
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <span className="flex min-w-0">
          <OwnerFace ownerId={row.original.ownerId} />
        </span>
      ),
      size: 152,
      meta: { headerTitle: "Owner" },
    },
    {
      id: "sync",
      accessorFn: (connection) => !connection.paused,
      header: ({ column }) => <DataGridColumnHeader column={column} />,
      cell: ({ row }) => (
        <SyncCell connection={row.original} onToggle={onTogglePaused} />
      ),
      size: 64,
      enableSorting: false,
      meta: { headerTitle: "Sync" },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell
          connection={row.original}
          onAction={onAction}
          triggerRef={registerTrigger(row.original.id)}
        />
      ),
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
    },
  ]
}