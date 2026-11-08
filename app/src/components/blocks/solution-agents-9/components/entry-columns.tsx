"use client"

// This file keeps "use no memo": its own cell/header templates read state
// through builder calls on a stable row/column, which React Compiler cannot
// see. The primitive wraps its own such reads in TanStack's Subscribe; a
// consumer template has to opt out or subscribe itself.
"use no memo"

import { memo } from "react"
import { Badge } from "@/components/reui/badge"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridTableRowPin } from "@/components/reui/data-grid/data-grid-table"
import { Row, type ColumnDef } from "@tanstack/react-table"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getMemoryOwner,
  type IMemoryEntry,
  type MemoryKind,
  type MemoryState,
} from "./data"
import { MoreHorizontalIcon, PinOffIcon, Pin, EyeIcon, Trash2Icon } from "lucide-react"

// Badge and progress grammar is adapted from data-grid-3's tags, priority,
// and score columns. Domain values are constrained by data.tsx unions.

const kindBadgeClass: Record<MemoryKind, string> = {
  Preference: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  Policy: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
  Procedure:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  Constraint:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
}

const stateVariant: Record<
  MemoryState,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  Trusted: "success-light",
  "Needs review": "warning-light",
  Stale: "destructive-light",
}

export function KindBadge({ kind }: { kind: MemoryKind }) {
  return (
    <Badge variant="secondary" className={cn("border-0", kindBadgeClass[kind])}>
      {kind}
    </Badge>
  )
}

export function StateBadge({ state }: { state: MemoryState }) {
  return <Badge variant={stateVariant[state]}>{state}</Badge>
}

function ConfidenceCell({ confidence }: { confidence: number }) {
  const indicatorClass =
    confidence >= 75
      ? "**:data-[slot=progress-indicator]:bg-emerald-500"
      : confidence >= 40
        ? "**:data-[slot=progress-indicator]:bg-amber-500"
        : "**:data-[slot=progress-indicator]:bg-red-500"

  return (
    <Progress
      value={confidence}
      className={cn(
        "min-w-0 flex-1 flex-row flex-nowrap items-center gap-2 **:data-[slot=progress-track]:order-1 **:data-[slot=progress-track]:min-w-12 **:data-[slot=progress-track]:flex-1 **:data-[slot=progress-value]:order-2",
        indicatorClass
      )}
    >
      <ProgressLabel className="sr-only">Confidence</ProgressLabel>
      <ProgressValue className="text-muted-foreground shrink-0 text-[10px] leading-none tabular-nums">
        {(_, value) => `${value ?? confidence}%`}
      </ProgressValue>
    </Progress>
  )
}

const EntryCell = memo(function EntryCell({
  row,
}: {
  row: Row<DataGridFeatures, IMemoryEntry>
}) {
  const o = row.original

  return (
    <div className="max-w-72 min-w-0 pr-3">
      <div
        className="text-foreground max-w-full truncate font-medium"
        title={o.fact}
      >
        {o.fact}
      </div>
      <div className="text-muted-foreground max-w-full truncate text-xs">
        {o.id} · {o.agent}
      </div>
    </div>
  )
})

function OwnerCell({ ownerId }: { ownerId: IMemoryEntry["ownerId"] }) {
  const owner = getMemoryOwner(ownerId)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="size-5 shrink-0">
        {owner.avatar ? <AvatarImage src={owner.avatar} alt="" /> : null}
        <AvatarFallback className="text-[9px]">{owner.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="text-foreground truncate text-sm font-medium">
          {owner.name}
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {owner.role}
        </div>
      </div>
    </div>
  )
}

function SourceRunCell({ entry }: { entry: IMemoryEntry }) {
  return (
    <div className="min-w-0">
      <div className="text-foreground truncate text-sm font-medium">
        {entry.sourceRun}
      </div>
      <div className="text-muted-foreground truncate text-xs">
        {entry.retrievals} reads · last {entry.lastUsed}
      </div>
    </div>
  )
}

export function ActionsCell({
  row,
  onForget,
  onOpenSourceRun,
}: {
  row: Row<DataGridFeatures, IMemoryEntry>
  onForget: (entry: IMemoryEntry) => void
  onOpenSourceRun: (entry: IMemoryEntry) => void
}) {
  const isPinned = row.getIsPinned()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Row actions"
          />
        }
      >
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => row.pin(isPinned ? false : "top")}>
            {isPinned ? (
              <PinOffIcon className="size-4" aria-hidden="true" />
            ) : (
              <Pin className="size-4" aria-hidden="true" />
            )}
            {isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenSourceRun(row.original)}>
            <EyeIcon className="size-4" aria-hidden="true" />
            Open Source
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onForget(row.original)}
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
            Forget
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function createMemoryColumns({
  onForget,
  onOpenSourceRun,
}: {
  onForget: (entry: IMemoryEntry) => void
  onOpenSourceRun: (entry: IMemoryEntry) => void
}): ColumnDef<DataGridFeatures, IMemoryEntry>[] {
  return [
    {
      id: "pin",
      header: "",
      cell: ({ row }) => <DataGridTableRowPin row={row} />,
      enableSorting: false,
      size: 40,
      enableResizing: false,
      enableHiding: false,
      meta: {
        skeleton: <Skeleton className="mx-auto size-7 rounded-md" />,
      },
    },
    {
      accessorKey: "fact",
      id: "fact",
      header: ({ column }) => (
        <DataGridColumnHeader title="Entry" visibility={true} column={column} />
      ),
      cell: ({ row }) => <EntryCell row={row} />,
      enableSorting: true,
      enableHiding: false,
      enableResizing: true,
      size: 300,
      minSize: 260,
      maxSize: 340,
      meta: {
        autoSize: true,
        cellClassName: "pe-6",
        skeleton: (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
        ),
      },
    },
    {
      accessorKey: "kind",
      id: "kind",
      header: ({ column }) => (
        <DataGridColumnHeader title="Kind" visibility={true} column={column} />
      ),
      cell: ({ row }) => <KindBadge kind={row.original.kind} />,
      size: 120,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: <Skeleton className="h-5 w-20 rounded-full" />,
      },
    },
    {
      accessorKey: "scope",
      id: "scope",
      header: ({ column }) => (
        <DataGridColumnHeader title="Scope" visibility={true} column={column} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.scope}
        </span>
      ),
      size: 155,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: <Skeleton className="h-4 w-28" />,
      },
    },
    {
      accessorKey: "confidence",
      id: "confidence",
      header: ({ column }) => (
        <DataGridColumnHeader
          title="Confidence"
          visibility={true}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <ConfidenceCell confidence={row.original.confidence} />
      ),
      size: 150,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: (
          <div className="flex min-w-0 items-center gap-2">
            <Skeleton className="h-2 min-w-12 flex-1 rounded-full" />
            <Skeleton className="h-3 w-10 shrink-0" />
          </div>
        ),
      },
    },
    {
      accessorKey: "state",
      id: "state",
      header: ({ column }) => (
        <DataGridColumnHeader
          title="Review"
          visibility={true}
          column={column}
        />
      ),
      cell: ({ row }) => <StateBadge state={row.original.state} />,
      size: 120,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: <Skeleton className="h-5 w-24 rounded-full" />,
      },
    },
    {
      accessorKey: "ownerId",
      id: "owner",
      header: ({ column }) => (
        <DataGridColumnHeader title="Owner" visibility={true} column={column} />
      ),
      cell: ({ row }) => <OwnerCell ownerId={row.original.ownerId} />,
      size: 178,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: (
          <div className="flex min-w-0 items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ),
      },
    },
    {
      accessorKey: "sourceRun",
      id: "sourceRun",
      header: ({ column }) => (
        <DataGridColumnHeader
          title="Source"
          visibility={true}
          column={column}
        />
      ),
      cell: ({ row }) => <SourceRunCell entry={row.original} />,
      size: 170,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ),
      },
    },
    {
      accessorKey: "updated",
      id: "updated",
      header: ({ column }) => (
        <DataGridColumnHeader
          title="Updated"
          visibility={true}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.updated}
        </span>
      ),
      size: 110,
      enableSorting: true,
      enableHiding: true,
      enableResizing: true,
      meta: {
        skeleton: <Skeleton className="h-4 w-24" />,
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell
          row={row}
          onForget={onForget}
          onOpenSourceRun={onOpenSourceRun}
        />
      ),
      size: 60,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      meta: {
        skeleton: <Skeleton className="mx-auto size-7 rounded-md" />,
      },
    },
  ]
}