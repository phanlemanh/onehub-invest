import { useDeferredValue, useMemo, useState } from "react"
import {
  DataGrid,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  useTable,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { createApprovalColumns } from "./approval-queue-columns"
import { BlockIcon } from "./block-icon"
import {
  getRequestSearchBlob,
  RISK_FILTER_OPTIONS,
  STATUS_LABEL,
  STATUS_ORDER,
  type ApprovalStatus,
  type IApprovalRequest,
  type RiskFilter,
} from "./data"
import { DecisionBar } from "./decision-bar"
import { QueueCard } from "./queue-card"

interface ToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  riskValue: RiskFilter
  onRiskChange: (value: RiskFilter) => void
  selectedStatuses: ApprovalStatus[]
  onStatusChange: (checked: boolean, status: ApprovalStatus) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

function Toolbar({
  searchQuery,
  onSearchChange,
  riskValue,
  onRiskChange,
  selectedStatuses,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3">
      <InputGroup className="w-full min-w-56 sm:w-64">
        <InputGroupAddon align="inline-start">
          <BlockIcon name="search" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search requests..."
          aria-label="Search requests"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchQuery ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              size="icon-xs"
              onClick={() => onSearchChange("")}
            >
              <BlockIcon name="clear" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <Select
        value={riskValue}
        onValueChange={(value) => onRiskChange(value as RiskFilter)}
        items={RISK_FILTER_OPTIONS}
      >
        <SelectTrigger className="w-[172px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            {RISK_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              aria-label="Filter by status"
            >
              <BlockIcon name="filter" />
              Status
              {selectedStatuses.length > 0 ? (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {selectedStatuses.length}
                </span>
              ) : null}
            </Button>
          }
        />
        <PopoverContent
          align="start"
          className="flex w-44 flex-col gap-2.5 p-3"
        >
          <span className="text-muted-foreground text-xs font-medium">
            Filter by status
          </span>
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-2.5">
              <Checkbox
                id={`status-${status}`}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={(checked) =>
                  onStatusChange(checked === true, status)
                }
              />
              <Label
                htmlFor={`status-${status}`}
                className="min-w-0 flex-1 cursor-pointer truncate font-normal"
              >
                {STATUS_LABEL[status]}
              </Label>
            </div>
          ))}
        </PopoverContent>
      </Popover>

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}

interface ApprovalQueueProps {
  requests: IApprovalRequest[]
  onReview: (request: IApprovalRequest) => void
  onApprove: (request: IApprovalRequest) => void
  onRejectSingle: (request: IApprovalRequest) => void
  onBulkApprove: (ids: string[]) => void
  onBulkReject: (ids: string[]) => void
  onExport: () => void
  className?: string
}

export function ApprovalQueue({
  requests,
  onReview,
  onApprove,
  onRejectSingle,
  onBulkApprove,
  onBulkReject,
  onExport,
  className,
}: ApprovalQueueProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 6,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [riskValue, setRiskValue] = useState<RiskFilter>("all")
  const [selectedStatuses, setSelectedStatuses] = useState<ApprovalStatus[]>([])
  const [showOverSlaOnly, setShowOverSlaOnly] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const search = deferredSearchQuery.trim().toLowerCase()

  const filteredData = useMemo(
    () =>
      requests.filter((request) => {
        const matchesRisk = riskValue === "all" || request.risk === riskValue
        const matchesStatus =
          selectedStatuses.length === 0 ||
          selectedStatuses.includes(request.status)
        const matchesSearch =
          search.length === 0 || getRequestSearchBlob(request).includes(search)

        return (
          matchesRisk &&
          matchesStatus &&
          (!showOverSlaOnly ||
            (request.status === "pending" &&
              request.slaMinutesRemaining < 0)) &&
          matchesSearch
        )
      }),
    [requests, riskValue, selectedStatuses, showOverSlaOnly, search]
  )

  const hasActiveFilters =
    search.length > 0 ||
    riskValue !== "all" ||
    selectedStatuses.length > 0 ||
    showOverSlaOnly

  function clearFilters() {
    setSearchQuery("")
    setRiskValue("all")
    setSelectedStatuses([])
    setShowOverSlaOnly(false)
  }

  const columns = useMemo(
    () =>
      createApprovalColumns({
        onReview,
        onApprove,
        onReject: onRejectSingle,
      }),
    [onReview, onApprove, onRejectSingle]
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredData,
    state: { pagination, sorting, rowSelection },
    getRowId: (row) => row.id,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
    enableRowSelection: (row) => row.original.status === "pending",
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  })

  const selectedPendingIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)
    .filter((request) => request.status === "pending")
    .map((request) => request.id)
  const selectedCount = selectedPendingIds.length

  function handleBulkApprove() {
    if (selectedPendingIds.length === 0) return
    onBulkApprove(selectedPendingIds)
    setRowSelection({})
  }

  function handleBulkReject() {
    if (selectedPendingIds.length === 0) return
    onBulkReject(selectedPendingIds)
  }

  return (
    <DataGrid
      table={table}
      recordCount={filteredData.length}
      emptyMessage="No requests match this view. Clear filters or widen your search."
      tableLayout={{ headerSticky: true, dense: true, width: "auto" }}
    >
      <QueueCard
        className={cn("h-full", className)}
        title="Approval Queue"
        description={`${filteredData.length} requests in this view`}
        headerAction={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              aria-pressed={showOverSlaOnly}
              onClick={() => setShowOverSlaOnly((current) => !current)}
            >
              <BlockIcon name="timer" className="size-4" />
              Over SLA
            </Button>
            <Button type="button" variant="outline" onClick={onExport}>
              <BlockIcon name="download" className="size-4" />
              Export
            </Button>
          </div>
        }
        footer={
          <div className="flex w-full justify-end">
            <DataGridPagination />
          </div>
        }
      >
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          riskValue={riskValue}
          onRiskChange={setRiskValue}
          selectedStatuses={selectedStatuses}
          onStatusChange={(checked, status) =>
            setSelectedStatuses((current) =>
              checked
                ? [...current, status]
                : current.filter((item) => item !== status)
            )
          }
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <Separator />

        {selectedCount > 0 ? (
          <>
            <DecisionBar
              selectedCount={selectedCount}
              onApprove={handleBulkApprove}
              onReject={handleBulkReject}
              onClear={() => setRowSelection({})}
            />
            <Separator />
          </>
        ) : null}

        <DataGridScrollArea>
          <DataGridTable />
        </DataGridScrollArea>
      </QueueCard>
    </DataGrid>
  )
}