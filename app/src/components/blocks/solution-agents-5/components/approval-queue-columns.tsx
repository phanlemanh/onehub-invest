import { memo } from "react"
import { Badge } from "@/components/reui/badge"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table"
import { Column, Row, type ColumnDef } from "@tanstack/react-table"
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
import { Item, ItemMedia } from "@/components/ui/item"

import { BlockIcon } from "./block-icon"
import {
  AGENT_ICON,
  formatSla,
  RISK_BADGE_VARIANT,
  RISK_LABEL,
  STATUS_BADGE_VARIANT,
  STATUS_DOT,
  STATUS_LABEL,
  type IApprovalRequest,
  type RiskTier,
} from "./data"

const RISK_RANK: Record<RiskTier, number> = { high: 0, medium: 1, low: 2 }

const sortHeader = ({
  column,
}: {
  column: Column<DataGridFeatures, IApprovalRequest, unknown>
}) => <DataGridColumnHeader column={column} visibility={true} />

export const RiskBadge = memo(function RiskBadge({ risk }: { risk: RiskTier }) {
  return <Badge variant={RISK_BADGE_VARIANT[risk]}>{RISK_LABEL[risk]}</Badge>
})

export const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status: IApprovalRequest["status"]
}) {
  return (
    <Badge variant={STATUS_BADGE_VARIANT[status]}>
      <span
        className={cn("size-1.5 shrink-0 rounded-full!", STATUS_DOT[status])}
      />
      {STATUS_LABEL[status]}
    </Badge>
  )
})

const RequestCell = memo(function RequestCell({
  row,
  onReview,
}: {
  row: Row<DataGridFeatures, IApprovalRequest>
  onReview: (request: IApprovalRequest) => void
}) {
  return (
    <div className="group/request flex min-w-0 flex-col gap-0.5">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onReview(row.original)}
          className="text-foreground focus-visible:ring-ring min-w-0 cursor-pointer truncate rounded-sm text-start font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          {row.original.action}
        </button>
        <BlockIcon
          name="open"
          className="text-muted-foreground pointer-events-none size-3.5 shrink-0 opacity-0 transition-opacity duration-150 group-hover/request:opacity-100 motion-reduce:transition-none"
        />
      </div>
      <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        <span className="shrink-0 tabular-nums">{row.original.id}</span>
        <span
          className="bg-input size-1 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <span className="truncate">{row.original.age}</span>
      </div>
    </div>
  )
})

const AgentCell = memo(function AgentCell({
  row,
}: {
  row: Row<DataGridFeatures, IApprovalRequest>
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Item className="bg-muted border-background flex size-8 shrink-0 items-center justify-center border-2 p-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border [&_svg]:size-4">
        <ItemMedia variant="icon" className="size-auto">
          {AGENT_ICON[row.original.agent]}
        </ItemMedia>
      </Item>
      <div className="min-w-0">
        <div className="text-foreground truncate font-medium">
          {row.original.agent}
        </div>
        <div className="text-muted-foreground truncate font-mono text-xs">
          {row.original.tool}
        </div>
      </div>
    </div>
  )
})

const SlaCell = memo(function SlaCell({
  row,
}: {
  row: Row<DataGridFeatures, IApprovalRequest>
}) {
  const copy = formatSla(row.original.slaMinutesRemaining, row.original.status)

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className={copy.tone}>{copy.primary}</span>
      <span className="text-muted-foreground truncate text-xs">
        {copy.secondary}
      </span>
    </div>
  )
})

function RequestActionsCell({
  row,
  onReview,
  onApprove,
  onReject,
}: {
  row: Row<DataGridFeatures, IApprovalRequest>
  onReview: (request: IApprovalRequest) => void
  onApprove: (request: IApprovalRequest) => void
  onReject: (request: IApprovalRequest) => void
}) {
  const isPending = row.original.status === "pending"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Row actions"
          />
        }
      >
        <BlockIcon name="menu" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onReview(row.original)}>
            <BlockIcon name="eye" />
            Review request
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onReview(row.original)}>
            <BlockIcon name="policy" />
            View policy
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void navigator.clipboard?.writeText(row.original.id)}
          >
            <BlockIcon name="copy" />
            Copy request ID
          </DropdownMenuItem>
          {isPending ? (
            <>
              <DropdownMenuItem onClick={() => onApprove(row.original)}>
                <BlockIcon name="approve" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onReject(row.original)}
              >
                <BlockIcon name="reject" />
                Reject
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function createApprovalColumns({
  onReview,
  onApprove,
  onReject,
}: {
  onReview: (request: IApprovalRequest) => void
  onApprove: (request: IApprovalRequest) => void
  onReject: (request: IApprovalRequest) => void
}) {
  return [
    {
      accessorKey: "id",
      id: "select",
      header: () => <DataGridTableRowSelectAll />,
      cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 30,
      meta: { headerClassName: "ps-3!", cellClassName: "ps-3!" },
    },
    {
      accessorKey: "agent",
      id: "agent",
      header: sortHeader,
      cell: ({ row }) => <AgentCell row={row} />,
      size: 200,
      minSize: 180,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      meta: { headerTitle: "Agent" },
    },
    {
      accessorKey: "action",
      id: "request",
      header: sortHeader,
      cell: ({ row }) => <RequestCell row={row} onReview={onReview} />,
      size: 300,
      minSize: 240,
      enableSorting: true,
      enableResizing: true,
      enableHiding: false,
      meta: { headerTitle: "Request", autoSize: true },
    },
    {
      accessorFn: (request) => RISK_RANK[request.risk],
      id: "risk",
      header: sortHeader,
      cell: ({ row }) => <RiskBadge risk={row.original.risk} />,
      size: 110,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      meta: { headerTitle: "Risk" },
    },
    {
      accessorFn: (request) => request.slaMinutesRemaining,
      id: "sla",
      header: sortHeader,
      cell: ({ row }) => <SlaCell row={row} />,
      size: 150,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      meta: { headerTitle: "SLA" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: sortHeader,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 140,
      enableSorting: true,
      enableResizing: true,
      enableHiding: true,
      meta: { headerTitle: "Status" },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RequestActionsCell
          row={row}
          onReview={onReview}
          onApprove={onApprove}
          onReject={onReject}
        />
      ),
      size: 50,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
    },
  ] satisfies ColumnDef<DataGridFeatures, IApprovalRequest>[]
}