"use client"

import { useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/reui/badge"
import {
  DataGrid,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Filters } from "@/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterConditions,
} from "@/components/reui/filters/filters-query"
import type { FilterCondition } from "@/components/reui/filters/filters-query"
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { IconStack } from "@/components/reui/icon-stack"
import {
  PaginationState,
  RowPinningState,
  SortingState,
  useTable,
} from "@tanstack/react-table"
import { cn } from "cn"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  getMemoryOwner,
  INITIAL_PINNED_IDS,
  MEMORY_ENTRIES,
  MEMORY_KINDS,
  MEMORY_OWNERS,
  MEMORY_SCOPES,
  type IMemoryEntry,
  type MemoryKind,
  type MemoryOwnerId,
  type MemoryScopeId,
  type MemoryState,
  type ScopeId,
} from "./data"
import { createMemoryColumns, KindBadge, StateBadge } from "./entry-columns"
import { DatabaseIcon, UserPlusIcon, LayersIcon, SearchIcon, TagIcon, ShieldCheckIcon, UserIcon, RefreshCwIcon, FilterIcon, PinOffIcon, FunnelXIcon } from "lucide-react"

// Composition root copied from data-grid-3 and re-skinned to the Memory
// Manager brief: one Frame shell, scope rail on the left, confidence grid on
// the right, and row actions wired locally.

function getActiveFilters(filters: FilterCondition[]) {
  return filters.filter((filter) => {
    const { operator, values } = filter
    // "is empty" / "is not empty" carry no value, so the blank checks below
    // would read them as an unfilled placeholder row and drop them.
    if (operator === "empty" || operator === "not_empty") return true
    if (!values || values.length === 0) return false
    if (
      values.every((value) => typeof value === "string" && value.trim() === "")
    )
      return false
    if (values.every((value) => value === null || value === undefined))
      return false
    if (values.every((value) => Array.isArray(value) && value.length === 0))
      return false
    return true
  })
}

function filterFieldValue(item: IMemoryEntry, field: string): unknown {
  return item[field as keyof IMemoryEntry]
}

/** `null` for an operator this demo does not implement, which keeps the row. */
function matchesCondition(
  fieldValue: unknown,
  operator: string,
  values: unknown[]
): boolean | null {
  switch (operator) {
    case "is":
      return values.includes(fieldValue)
    case "is_not":
      return !values.includes(fieldValue)
    case "is_any_of":
      return values.some((value) => fieldValue === value)
    case "is_none_of":
      return !values.some((value) => fieldValue === value)
    case "contains": {
      const tokens = values.map((value) => String(value).trim()).filter(Boolean)
      if (tokens.length === 0) return true
      return tokens.some((token) =>
        String(fieldValue).toLowerCase().includes(token.toLowerCase())
      )
    }
    case "not_contains":
      return !values.some((value) =>
        String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
      )
    case "starts_with":
      return values.some((value) =>
        String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
      )
    case "ends_with":
      return values.some((value) =>
        String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
      )
    case "eq":
      return fieldValue === values[0]
    case "neq":
      return fieldValue !== values[0]
    case "gt":
      return Number(fieldValue) > Number(values[0])
    case "lt":
      return Number(fieldValue) < Number(values[0])
    case "gte":
      return Number(fieldValue) >= Number(values[0])
    case "lte":
      return Number(fieldValue) <= Number(values[0])
    case "between":
      if (values.length >= 2) {
        const min = Number(values[0])
        const max = Number(values[1])
        return Number(fieldValue) >= min && Number(fieldValue) <= max
      }
      return true
    case "not_between":
      if (values.length >= 2) {
        const min = Number(values[0])
        const max = Number(values[1])
        return Number(fieldValue) < min || Number(fieldValue) > max
      }
      return true
    case "empty":
      return fieldValue === "" || fieldValue == null
    case "not_empty":
      return fieldValue !== "" && fieldValue != null
    default:
      return null
  }
}

function applyFiltersToData(
  data: IMemoryEntry[],
  scope: ScopeId,
  filters: FilterCondition[]
): IMemoryEntry[] {
  const scoped =
    scope === "all" ? data : data.filter((entry) => entry.scope === scope)
  const active = getActiveFilters(filters)
  let result = [...scoped]

  active.forEach((filter) => {
    const { field, operator, values, negated } = filter
    result = result.filter((item) => {
      const raw = filterFieldValue(item, field)
      const fieldValue = raw != null ? raw : ""
      const matches = matchesCondition(fieldValue, operator, values)
      if (matches === null) return true

      // "Starts with" and "ends with" declare no opposite operator, so Negate
      // keeps the operator and flips this flag instead. Ignoring it would keep
      // exactly the rows the chip says it excludes.
      return negated ? !matches : matches
    })
  })

  return result
}

const KIND_OPTIONS: { value: MemoryKind; label: string }[] = MEMORY_KINDS.map(
  (kind) => ({
    value: kind,
    label: kind,
  })
)

const SCOPE_OPTIONS: { value: MemoryScopeId; label: string }[] = [
  { value: "customer-facts", label: "customer-facts" },
  { value: "billing-policies", label: "billing-policies" },
  { value: "product-catalog", label: "product-catalog" },
  { value: "support-runbooks", label: "support-runbooks" },
]

const STATE_OPTIONS: { value: MemoryState; label: string }[] = [
  { value: "Trusted", label: "Trusted" },
  { value: "Needs review", label: "Needs review" },
  { value: "Stale", label: "Stale" },
]

function renderSelectedCount(values: unknown[]) {
  if (values.length === 0) return "Select..."
  if (values.length > 1) return `${values.length} selected`
  return null
}

function createDefaultMemoryFilters(): FilterQuery {
  return createFilterQuery([
    createFilterRule({
      id: "fact-1",
      path: ["fact"],
      operator: "contains",
      value: "",
    }),
  ])
}

function OwnerAvatar({ ownerId }: { ownerId: MemoryOwnerId }) {
  const owner = getMemoryOwner(ownerId)

  return (
    <Avatar className="size-5 shrink-0">
      {owner.avatar ? <AvatarImage src={owner.avatar} alt="" /> : null}
      <AvatarFallback className="text-[9px]">{owner.initials}</AvatarFallback>
    </Avatar>
  )
}

function ScopeRail({
  scopes,
  counts,
  activeScope,
  onSelect,
}: {
  scopes: typeof MEMORY_SCOPES
  counts: Record<ScopeId, number>
  activeScope: ScopeId
  onSelect: (scope: ScopeId) => void
}) {
  const allScope = scopes.find((scope) => scope.id === "all") ?? scopes[0]
  const memoryScopes = scopes.filter((scope) => scope.id !== "all")

  function renderScopeItem(scope: (typeof scopes)[number]) {
    const selected = activeScope === scope.id

    return (
      <Item
        key={scope.id}
        render={<button type="button" />}
        size="sm"
        aria-pressed={selected}
        className={cn(
          "hover:bg-muted w-full min-w-0 cursor-pointer items-start border-0 text-left",
          selected && "bg-primary/5 hover:bg-primary/5"
        )}
        onClick={() => onSelect(scope.id)}
      >
        <ItemMedia variant="icon" className={cn(selected && "text-primary")}>
          {scope.icon}
        </ItemMedia>
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-foreground flex w-full min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate">{scope.name}</span>
            <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 text-xs font-normal">
              <OwnerAvatar ownerId={scope.ownerId} />
              <Badge variant={selected ? "primary-outline" : "outline"}>
                {counts[scope.id]}
              </Badge>
            </span>
          </ItemTitle>
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
            <span className="min-w-0 truncate">{scope.description}</span>
            <Separator orientation="vertical" className="my-auto h-3" />
            <span className="shrink-0">{scope.retention}</span>
          </div>
        </ItemContent>
      </Item>
    )
  }

  return (
    <aside className="border-border flex min-w-0 flex-col border-b @4xl:border-r @4xl:border-b-0">
      <div className="flex items-start justify-between gap-3 px-(--frame-panel-header-px) py-2.5">
        <div className="min-w-0">
          <div className="text-foreground text-sm font-semibold">Scopes</div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span>{counts.all} entries</span>
            <Separator orientation="vertical" className="my-auto h-3" />
            <span>{scopes.length - 1} scopes</span>
          </div>
        </div>
        <Badge variant="outline">{memoryScopes.length} scopes</Badge>
      </div>
      <div className="flex flex-col gap-1 p-1">
        {renderScopeItem(allScope)}
        <div className="text-muted-foreground px-2 pt-2 pb-0.5 text-xs font-medium">
          Memory scopes
        </div>
        {memoryScopes.map((scope) => renderScopeItem(scope))}
      </div>
    </aside>
  )
}

function MemorySummary({
  entries,
  pinnedCount,
}: {
  entries: IMemoryEntry[]
  pinnedCount: number
}) {
  const trustedCount = entries.filter(
    (entry) => entry.state === "Trusted"
  ).length
  const reviewCount = entries.filter(
    (entry) => entry.state !== "Trusted"
  ).length
  const staleCount = entries.filter((entry) => entry.state === "Stale").length
  const averageConfidence = Math.round(
    entries.reduce((total, entry) => total + entry.confidence, 0) /
      entries.length
  )

  const metrics = [
    {
      label: "Indexed",
      value: entries.length,
      description: `${MEMORY_SCOPES.length - 1} scopes active`,
    },
    {
      label: "Trusted",
      value: trustedCount,
      description: `${pinnedCount} pinned entries`,
    },
    {
      label: "Review",
      value: reviewCount,
      description: `${staleCount} stale entries`,
    },
    {
      label: "Confidence",
      value: `${averageConfidence}%`,
      description: "Average retrieval score",
    },
  ]

  return (
    <div className="grid gap-2 px-(--frame-panel-px) py-(--frame-panel-py) sm:grid-cols-2 @4xl:grid-cols-4">
      {metrics.map((metric) => (
        <Item key={metric.label} variant="outline" size="sm">
          <ItemContent className="min-w-0 gap-1">
            <ItemDescription className="truncate text-xs">
              {metric.label}
            </ItemDescription>
            <ItemTitle className="text-foreground text-base leading-none font-semibold">
              {metric.value}
            </ItemTitle>
            <ItemDescription className="truncate">
              {metric.description}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </div>
  )
}

function MemoryEmptyState({
  activeScope,
  scopeCount,
  hasActiveFilters,
  onClear,
  onNewEntry,
}: {
  activeScope: ScopeId
  scopeCount: number
  hasActiveFilters: boolean
  onClear: () => void
  onNewEntry: () => void
}) {
  const scope = MEMORY_SCOPES.find((item) => item.id === activeScope)
  const isEmptyScope = activeScope !== "all" && scopeCount === 0
  const title = isEmptyScope
    ? `No ${scope?.name ?? "scope"} entries yet`
    : "No matching memory entries"
  const description = isEmptyScope
    ? `Agents will place approved ${scope?.name ?? "scope"} facts here after the next indexed run.`
    : "Adjust the filters or return to all scopes to review indexed memory."
  const clearLabel = hasActiveFilters ? "Clear filters" : "View all scopes"
  const showClear = activeScope !== "all" || hasActiveFilters

  return (
    <div className="flex min-h-[360px] items-center justify-center px-4 py-10 md:py-12">
      <Empty className="w-full max-w-md flex-none gap-7 rounded-none border-0 bg-transparent p-0 md:p-0">
        <EmptyHeader className="items-center gap-5 text-center">
          <EmptyMedia className="mb-0">
            <IconStack aria-hidden="true">
              <DatabaseIcon strokeWidth="1.9" aria-hidden="true" />
            </IconStack>
          </EmptyMedia>

          <div className="flex flex-col items-center gap-2">
            <EmptyTitle className="text-foreground text-base font-semibold tracking-tight">
              {title}
            </EmptyTitle>
            <EmptyDescription className="text-muted-foreground max-w-sm text-sm/relaxed">
              {description}
            </EmptyDescription>
          </div>
        </EmptyHeader>

        <EmptyContent className="max-w-none items-center gap-0">
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={onNewEntry}>
              <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
              New Entry
            </Button>

            {showClear && (
              <Button
                type="button"
                variant="outline"
                className="text-foreground"
                onClick={onClear}
              >
                <LayersIcon data-icon="inline-start" aria-hidden="true" />
                {clearLabel}
              </Button>
            )}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export function MemoryManager() {
  const [entries, setEntries] = useState<IMemoryEntry[]>(MEMORY_ENTRIES)
  const [activeScope, setActiveScope] = useState<ScopeId>("all")
  const [filterQuery, setFilterQuery] = useState<FilterQuery>(
    createDefaultMemoryFilters
  )
  const filters = useMemo(
    () => flattenFilterConditions(filterQuery),
    [filterQuery]
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: "confidence", desc: true },
  ])
  const [rowPinning, setRowPinning] = useState<RowPinningState>({
    top: INITIAL_PINNED_IDS,
    bottom: [],
  })

  const scopeCounts = useMemo(() => {
    const counts = { all: entries.length } as Record<ScopeId, number>
    for (const scope of MEMORY_SCOPES) {
      if (scope.id === "all") continue
      counts[scope.id] = entries.filter(
        (entry) => entry.scope === scope.id
      ).length
    }
    return counts
  }, [entries])

  const ownerOptions = useMemo(
    () =>
      MEMORY_OWNERS.map((owner) => ({
        value: owner.id,
        label: owner.name,
        icon: <OwnerAvatar ownerId={owner.id} />,
      })),
    []
  )

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: "fact",
        label: "Entry",
        icon: (
          <SearchIcon className="size-3.5" aria-hidden />
        ),
        type: "text",
        placeholder: "Search...",
      },
      {
        id: "kind",
        label: "Kind",
        icon: (
          <TagIcon className="size-3.5" aria-hidden />
        ),
        type: "select",
        searchable: false,
        options: KIND_OPTIONS,
        renderValue: ({ values }) => {
          const state = renderSelectedCount(values)
          if (state) return state
          return <KindBadge kind={values[0] as MemoryKind} />
        },
      },
      {
        id: "scope",
        label: "Scope",
        icon: (
          <LayersIcon className="size-3.5" aria-hidden />
        ),
        type: "select",
        searchable: true,
        options: SCOPE_OPTIONS,
      },
      {
        id: "state",
        label: "Review",
        icon: (
          <ShieldCheckIcon className="size-3.5" aria-hidden />
        ),
        type: "select",
        searchable: false,
        options: STATE_OPTIONS,
        renderValue: ({ values }) => {
          const state = renderSelectedCount(values)
          if (state) return state
          return <StateBadge state={values[0] as MemoryState} />
        },
      },
      {
        id: "ownerId",
        label: "Owner",
        icon: (
          <UserIcon className="size-3.5" aria-hidden />
        ),
        type: "select",
        searchable: true,
        options: ownerOptions,
        renderValue: ({ values, options }) => {
          const state = renderSelectedCount(values)
          if (state) return state

          const option = options.find((item) => item.value === values[0])
          if (!option) return String(values[0])

          return (
            <div className="flex min-w-0 items-center gap-2">
              {option.icon}
              <span className="truncate">{option.label}</span>
            </div>
          )
        },
      },
      {
        id: "sourceRun",
        label: "Source",
        icon: (
          <RefreshCwIcon className="size-3.5" aria-hidden />
        ),
        type: "text",
        placeholder: "RUN-48xx...",
      },
    ],
    [ownerOptions]
  )

  const visibleEntries = useMemo(
    () => applyFiltersToData(entries, activeScope, filters),
    [activeScope, entries, filters]
  )

  const resolvedRowPinning = useMemo(() => {
    const availableIds = new Set(visibleEntries.map((entry) => entry.id))

    return {
      top: (rowPinning.top ?? []).filter((id) => availableIds.has(id)),
      bottom: (rowPinning.bottom ?? []).filter((id) => availableIds.has(id)),
    }
  }, [rowPinning.bottom, rowPinning.top, visibleEntries])

  const handleSelectScope = useCallback((scope: ScopeId) => {
    setActiveScope(scope)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleFiltersChange = useCallback((nextQuery: FilterQuery) => {
    setFilterQuery(nextQuery)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleClear = useCallback(() => {
    setActiveScope("all")
    setFilterQuery(createDefaultMemoryFilters())
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleForget = useCallback((entry: IMemoryEntry) => {
    setEntries((prev) => prev.filter((item) => item.id !== entry.id))
    setRowPinning((prev) => ({
      top: (prev.top ?? []).filter((id) => id !== entry.id),
      bottom: (prev.bottom ?? []).filter((id) => id !== entry.id),
    }))
    toast.success("Entry forgotten", {
      description: `${entry.agent} stops citing ${entry.id} on its next run.`,
    })
  }, [])

  const handleOpenSourceRun = useCallback((entry: IMemoryEntry) => {
    toast.info("Source run", {
      description: `${entry.sourceRun} · ${entry.sourceRunLabel}`,
    })
  }, [])

  const handleNewEntry = useCallback(() => {
    toast.info("New entry", {
      description: "Draft facts land in customer-facts for review.",
    })
  }, [])

  const columns = useMemo(
    () =>
      createMemoryColumns({
        onForget: handleForget,
        onOpenSourceRun: handleOpenSourceRun,
      }),
    [handleForget, handleOpenSourceRun]
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: visibleEntries,
    pageCount: Math.ceil(visibleEntries.length / pagination.pageSize),
    getRowId: (row) => row.id,
    state: {
      pagination,
      sorting,
      rowPinning: resolvedRowPinning,
    },
    enableRowPinning: true,
    keepPinnedRows: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowPinningChange: setRowPinning,
  })

  const reviewCount = entries.filter(
    (entry) => entry.state !== "Trusted"
  ).length
  const pinnedCount = (rowPinning.top ?? []).filter((id) =>
    entries.some((entry) => entry.id === id)
  ).length
  const activeFilters = getActiveFilters(filters)
  const hasActiveFilters = activeFilters.length > 0
  const showClearButton = activeScope !== "all" || hasActiveFilters

  return (
    <TooltipProvider delay={200}>
      <DataGrid
        table={table}
        loadingMode="skeleton"
        recordCount={visibleEntries.length}
        tableLayout={{
          rowsPinnable: true,
          columnsPinnable: true,
          columnsResizable: true,
          columnsMovable: true,
          columnsVisibility: true,
          headerSticky: true,
          dense: true,
        }}
      >
        <Frame spacing="sm" className="@container w-full">
          <FrameHeader className="flex-row items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <FrameTitle className="text-foreground text-balance">
                Memory Manager
              </FrameTitle>
              <FrameDescription className="text-xs text-pretty">
                {entries.length} entries · {reviewCount} to review
              </FrameDescription>
            </div>
            <Button type="button" size="default" onClick={handleNewEntry}>
              <UserPlusIcon aria-hidden="true" />
              New Entry
            </Button>
          </FrameHeader>
          <FramePanel className="p-0 shadow-none">
            <MemorySummary entries={entries} pinnedCount={pinnedCount} />
            <Separator />
            <div className="grid min-w-0 grid-cols-1 @4xl:grid-cols-[18rem_minmax(0,1fr)]">
              <ScopeRail
                scopes={MEMORY_SCOPES}
                counts={scopeCounts}
                activeScope={activeScope}
                onSelect={handleSelectScope}
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 px-(--frame-panel-header-px) py-2.5">
                  <Filters
                    query={filterQuery}
                    fields={filterFields}
                    onQueryChange={handleFiltersChange}
                    size="default"
                    trigger={
                      <Button
                        type="button"
                        size="default"
                        variant="outline"
                        className="text-foreground"
                        aria-label="Filters"
                      >
                        <FilterIcon aria-hidden />
                        Filters
                      </Button>
                    }
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {(resolvedRowPinning.top?.length ?? 0) > 0 && (
                      <ButtonGroup>
                        <Button
                          type="button"
                          size="default"
                          variant="outline"
                          className="text-foreground"
                          onClick={() => setRowPinning({ top: [], bottom: [] })}
                        >
                          <PinOffIcon aria-hidden />
                          Unpin all
                        </Button>
                        <ButtonGroupText className="text-muted-foreground px-3 text-sm">
                          {resolvedRowPinning.top?.length}{" "}
                          {resolvedRowPinning.top?.length === 1
                            ? "entry"
                            : "entries"}{" "}
                          pinned
                        </ButtonGroupText>
                      </ButtonGroup>
                    )}
                    {showClearButton && (
                      <Button
                        type="button"
                        size="default"
                        variant="outline"
                        className="text-foreground shrink-0"
                        onClick={handleClear}
                      >
                        <FunnelXIcon aria-hidden />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
                {visibleEntries.length > 0 ? (
                  <>
                    <DataGridScrollArea>
                      <DataGridTable />
                    </DataGridScrollArea>
                    <Separator />
                    <FrameFooter>
                      <DataGridPagination />
                    </FrameFooter>
                  </>
                ) : (
                  <MemoryEmptyState
                    activeScope={activeScope}
                    scopeCount={scopeCounts[activeScope]}
                    hasActiveFilters={hasActiveFilters}
                    onClear={handleClear}
                    onNewEntry={handleNewEntry}
                  />
                )}
              </div>
            </div>
          </FramePanel>
        </Frame>
      </DataGrid>
    </TooltipProvider>
  )
}