"use client"

// Reads the TanStack table instance directly, which React Compiler cannot see.
"use no memo"

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react"
import { Badge } from "@/components/reui/badge"
import {
  DataGrid,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { type FilterQuery } from "@/components/reui/filters/filters-types"
import { FrameFooter, FramePanel } from "@/components/reui/frame"
import {
  useTable,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  ActiveSloContext,
  createSloColumns,
  type SloRowAction,
} from "./columns"
import {
  plural,
  SLO_STATUS,
  SLO_TABS,
  WORKSPACE_NAME,
  type Density,
  type SheetTab,
  type Slo,
  type SloTab,
  type TeamScope,
} from "./data"
import {
  DeleteSlosDialog,
  pendingIds,
  survivingNeighbour,
  type PendingDelete,
} from "./delete-slos-dialog"
import { UI_ICONS } from "./icons"
import { SectionFrame, SectionHead } from "./section-lead"
import { EMPTY_FILTER_QUERY, matchesSloFilters } from "./slo-filters"
import { derive, triageOrder } from "./slo-math"
import { SloSheet, type SheetState } from "./slo-sheet"
import { type SloStore } from "./slo-store"
import { SloDisplayPopover, SloToolbar } from "./slo-toolbar"
import { DotSeparator } from "./value-faces"

const WIDE_QUERY = "(min-width: 1280px)"

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** A live media query, so a mount at a narrow width does not stick. */
function useWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true
  )
}

function NoSlosEmpty({
  onNewSlo,
}: {
  onNewSlo: (origin: HTMLElement) => void
}) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{UI_ICONS.target}</EmptyMedia>
        <EmptyTitle>No SLOs Yet</EmptyTitle>
        <EmptyDescription>
          Set the first objective for {WORKSPACE_NAME}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          onClick={(event) => onNewSlo(event.currentTarget)}
        >
          {UI_ICONS.plus}
          New SLO
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function NoMatchEmpty({ onClear }: { onClear: () => void }) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{UI_ICONS.search}</EmptyMedia>
        <EmptyTitle>No SLOs Match</EmptyTitle>
        <EmptyDescription>Try another tab, search or filter.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" variant="outline" onClick={onClear}>
          Clear Filters
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/** The panel's first row: status tabs, then search and filters, one rule below. */
function GridStrip({
  tab,
  counts,
  onTabChange,
  children,
}: {
  tab: SloTab
  counts: Record<SloTab, number>
  onTabChange: (next: SloTab) => void
  children: ReactNode
}) {
  return (
    <div className="flex flex-col border-b md:h-12 md:flex-row md:items-stretch md:justify-between md:gap-4">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = SLO_TABS.find((item) => item.value === value)
          if (next) onTabChange(next.value)
        }}
        className="flex h-11 min-w-0 items-stretch max-md:border-b md:h-auto"
      >
        {/* The inset lives inside the scroller, so tabs scroll to the panel
            edge; translate-y-px seats the underline on the border row. */}
        <TabsList
          variant="line"
          className="no-scrollbar scroll-fade-x h-full! max-w-full translate-y-px justify-start gap-5 overflow-x-auto bg-transparent px-(--frame-panel-header-px) py-0!"
        >
          {SLO_TABS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="h-full! flex-none gap-1.5 px-1 text-sm after:-bottom-px!"
            >
              {/* The same status dots the Meeting Objective legend uses. */}
              {item.value !== "all" ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    SLO_STATUS[item.value].tick
                  )}
                />
              ) : null}
              {item.label}
              <Badge variant="outline" radius="full" className="tabular-nums">
                {counts[item.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  )
}

/** The selection's actions: the row checkboxes exist to drive this bar. */
function BulkBar({
  count,
  selected,
  onClear,
  onSetAlerting,
  onDelete,
}: {
  count: number
  selected: Slo[]
  onClear: () => void
  onSetAlerting: (alerting: boolean) => void
  onDelete: (origin: HTMLElement) => void
}) {
  return (
    <div className="bg-muted/50 flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-(--frame-panel-header-px) py-2">
      <span className="text-foreground text-sm font-medium tabular-nums">
        {count} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selected.some((slo) => slo.alerting)}
          onClick={() => onSetAlerting(false)}
        >
          {UI_ICONS.mute}
          Mute
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selected.some((slo) => !slo.alerting)}
          onClick={() => onSetAlerting(true)}
        >
          {UI_ICONS.bell}
          Unmute
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={(event) => onDelete(event.currentTarget)}
        >
          {UI_ICONS.trash}
          Delete
        </Button>
      </div>
    </div>
  )
}

function matchesSearch(slo: Slo, query: string) {
  if (!query) return true
  return [slo.name, slo.id, slo.service, slo.description].some((value) =>
    value.toLowerCase().includes(query)
  )
}

export function SlosGridView({
  slos,
  allSlos,
  store,
  scope,
  reveal,
  sheet,
  onSheetChange,
  onCloseSheet,
  onNewSlo,
  onFocusSlo,
  onCopyYaml,
  returnFocusRef,
  onReturnFocusChange,
}: {
  /** The scoped catalog the grid lists. */
  slos: Slo[]
  /** Every SLO, so the sheet keeps its record outside the current scope. */
  allSlos: Slo[]
  store: SloStore
  scope: TeamScope
  /** Bumps after a create: the view clears its query and pages to the new SLO. */
  reveal: { seq: number; id: string | null }
  sheet: SheetState
  onSheetChange: (patch: Partial<SheetState>) => void
  onCloseSheet: () => void
  onNewSlo: (origin: HTMLElement) => void
  /** Points the Error Budget chart at an SLO. */
  onFocusSlo: (id: string) => void
  onCopyYaml: (slo: Slo) => void
  /** Read by the sheet's finalFocus; openers set it through onReturnFocusChange. */
  returnFocusRef: RefObject<HTMLElement | null>
  onReturnFocusChange: (node: HTMLElement | null) => void
}) {
  const { setAlerting, setEventExcluded, duplicate, remove, update } = store
  const [search, setSearch] = useState("")
  const [filterQuery, setFilterQuery] =
    useState<FilterQuery>(EMPTY_FILTER_QUERY)
  const [tab, setTab] = useState<SloTab>("all")
  // No header sort by default: rows keep the triage order, worst first.
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  // Attainment starts hidden: the budget column already reads the margin.
  // Alerts too: every row repeats it, and the row menu mutes and unmutes.
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ attainment: false, alerts: false })
  // Owner hides under 1280px until someone toggles it, so the row menu stays
  // on screen at laptop widths.
  const wide = useWide()
  const shownColumns: ColumnVisibilityState =
    wide || "owner" in columnVisibility
      ? columnVisibility
      : { ...columnVisibility, owner: false }
  const handleColumnVisibilityChange = (
    updater: Updater<ColumnVisibilityState>
  ) => {
    const next = typeof updater === "function" ? updater(shownColumns) : updater
    // Another column's toggle must not pin Owner's responsive default.
    if (!("owner" in columnVisibility) && next.owner === shownColumns.owner) {
      const rest = { ...next }
      delete rest.owner
      setColumnVisibility(rest)
    } else {
      setColumnVisibility(next)
    }
  }
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [density, setDensity] = useState<Density>("compact")
  const [striped, setStriped] = useState(false)

  // The dialog keeps its last record while it closes, so the exit stays intact.
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  const resetPage = useCallback(
    () =>
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
      ),
    []
  )

  // A scope change or a fresh create resets the view in the same render.
  const [seenScope, setSeenScope] = useState(scope)
  if (seenScope !== scope) {
    setSeenScope(scope)
    resetPage()
    setRowSelection({})
  }
  const [seenReveal, setSeenReveal] = useState(reveal.seq)
  const [revealId, setRevealId] = useState<string | null>(null)
  if (seenReveal !== reveal.seq) {
    setSeenReveal(reveal.seq)
    setSearch("")
    setFilterQuery(EMPTY_FILTER_QUERY)
    setTab("all")
    resetPage()
    setRowSelection({})
    setRevealId(reveal.id)
  }

  // Row menu triggers by SLO id: focus returns here, and a deleted row's falls
  // to a neighbour. A state-held Map, since the column handlers capture it.
  const [triggerNodes] = useState(() => new Map<string, HTMLButtonElement>())
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  // Search unmounts while the BulkBar shows, so a bulk delete resolves it late.
  const focusSearchRef = useRef(false)
  useLayoutEffect(() => {
    if (!focusSearchRef.current || !searchRef.current) return
    focusSearchRef.current = false
    focusTargetRef.current = searchRef.current
  })
  const registerTrigger = useCallback(
    (id: string) => (node: HTMLButtonElement | null) => {
      if (node) triggerNodes.set(id, node)
      else triggerNodes.delete(id)
    },
    [triggerNodes]
  )

  const triaged = useMemo(() => triageOrder(slos), [slos])
  const preTab = useMemo(() => {
    const query = search.trim().toLowerCase()
    return triaged.filter(
      (slo) => matchesSearch(slo, query) && matchesSloFilters(slo, filterQuery)
    )
  }, [triaged, search, filterQuery])
  const tabCounts = useMemo(() => {
    const counts: Record<SloTab, number> = {
      all: preTab.length,
      healthy: 0,
      atRisk: 0,
      exhausted: 0,
    }
    for (const slo of preTab) counts[derive(slo).status] += 1
    return counts
  }, [preTab])
  const visible = useMemo(
    () =>
      tab === "all"
        ? preTab
        : preTab.filter((slo) => derive(slo).status === tab),
    [preTab, tab]
  )

  /** Grid opens return focus to the row's menu, never a hover-card trigger. */
  const openFromGrid = useCallback(
    (id: string, sheetTab: SheetTab) => {
      onReturnFocusChange(triggerNodes.get(id) ?? null)
      onSheetChange({ sloId: id, tab: sheetTab, open: true })
    },
    [onSheetChange, onReturnFocusChange, triggerNodes]
  )

  const requestDelete = useCallback((pending: PendingDelete) => {
    setPendingDelete(pending)
    setDeleteOpen(true)
  }, [])

  const handleAction = useCallback(
    (action: SloRowAction, slo: Slo) => {
      switch (action) {
        case "view":
          openFromGrid(slo.id, "overview")
          break
        case "edit":
          openFromGrid(slo.id, "settings")
          break
        case "focus":
          onFocusSlo(slo.id)
          break
        case "mute":
          setAlerting([slo.id], false)
          break
        case "unmute":
          setAlerting([slo.id], true)
          break
        case "duplicate": {
          const copyId = duplicate(slo.id)
          if (!copyId) break
          // The copy opens on Settings; focus returns to its source's menu.
          setRevealId(copyId)
          onReturnFocusChange(triggerNodes.get(slo.id) ?? null)
          onSheetChange({ sloId: copyId, tab: "settings", open: true })
          break
        }
        case "yaml":
          onCopyYaml(slo)
          break
        case "delete":
          requestDelete({
            kind: "row",
            id: slo.id,
            name: slo.name,
            origin: triggerNodes.get(slo.id) ?? null,
          })
          break
      }
    },
    [
      openFromGrid,
      onFocusSlo,
      setAlerting,
      duplicate,
      onCopyYaml,
      requestDelete,
      triggerNodes,
      onReturnFocusChange,
      onSheetChange,
    ]
  )

  const handleToggleAlerts = useCallback(
    (id: string, alerting: boolean) => setAlerting([id], alerting),
    [setAlerting]
  )

  const columns = useMemo(
    () =>
      createSloColumns(
        {
          onOpen: openFromGrid,
          onToggleAlerts: handleToggleAlerts,
          onAction: handleAction,
        },
        registerTrigger
      ),
    [openFromGrid, handleToggleAlerts, handleAction, registerTrigger]
  )

  const table = useTable({
    features: dataGridFeatures,
    data: visible,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      pagination,
      columnVisibility: shownColumns,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    // Edits must not bounce the reader back to page one.
    autoResetPageIndex: false,
    // Pinning as an ordering lock only: tableLayout.columnsPinnable stays off.
    initialState: {
      columnPinning: { start: ["select", "name"], end: ["actions"] },
    },
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const selected = allSlos.filter((slo) => selectedIds.includes(slo.id))

  // The sheet steps through the visible order, across pages.
  const orderedIds = table
    .getPrePaginatedRowModel()
    .rows.map((row) => row.original.id)

  // A delete can empty the last page: fall back to the new last page.
  const pageCount = Math.max(
    1,
    Math.ceil(orderedIds.length / pagination.pageSize)
  )
  if (pagination.pageIndex >= pageCount) {
    setPagination((current) => ({ ...current, pageIndex: pageCount - 1 }))
  }
  // A created or duplicated SLO lands by its triage rank, often past page one.
  if (revealId !== null) {
    setRevealId(null)
    const index = orderedIds.indexOf(revealId)
    const page = Math.floor(index / pagination.pageSize)
    if (index >= 0 && page !== pagination.pageIndex) {
      setPagination((current) => ({ ...current, pageIndex: page }))
    }
  }

  function stepTo(index: number) {
    const id = orderedIds[index]
    if (!id) return
    onSheetChange({ sloId: id })
    const page = Math.floor(index / pagination.pageSize)
    if (page !== pagination.pageIndex) table.setPageIndex(page)
    const trigger = triggerNodes.get(id)
    if (trigger) onReturnFocusChange(trigger)
  }

  function clearView() {
    setSearch("")
    setFilterQuery(EMPTY_FILTER_QUERY)
    setTab("all")
    resetPage()
    setRowSelection({})
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const ids = pendingIds(pendingDelete)
    const neighbourId = survivingNeighbour(
      table.getRowModel().rows.map((row) => row.id),
      ids
    )
    // An emptied last page steps back through the page clamp above.
    const neighbour = neighbourId
      ? (triggerNodes.get(neighbourId) ?? null)
      : null
    focusTargetRef.current = neighbour ?? searchRef.current
    focusSearchRef.current = focusTargetRef.current === null
    if (sheet.open && ids.includes(sheet.sloId)) {
      // The confirm's finalFocus places focus; the closing sheet stays out of it.
      onReturnFocusChange(null)
      onCloseSheet()
    }
    remove(ids)
    setRowSelection({})
    setDeleteOpen(false)
  }

  const sheetSlo = allSlos.find((slo) => slo.id === sheet.sloId) ?? null
  const sheetIndex = sheetSlo ? orderedIds.indexOf(sheetSlo.id) : -1
  const attention = visible.filter(
    (slo) => derive(slo).status !== "healthy"
  ).length
  const muted = slos.filter((slo) => !slo.alerting).length

  return (
    <ActiveSloContext.Provider value={sheet.open ? sheet.sloId : null}>
      <DataGrid
        table={table}
        recordCount={visible.length}
        onRowClick={(slo) => openFromGrid(slo.id, "overview")}
        emptyMessage={
          slos.length === 0 ? (
            <NoSlosEmpty onNewSlo={onNewSlo} />
          ) : (
            <NoMatchEmpty onClear={clearView} />
          )
        }
        tableLayout={{
          dense: density === "compact",
          stripped: striped,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{
          bodyRow: "group/slo-row [&:has([data-active-row])]:bg-muted/50",
          edgeCell:
            "first:ps-(--frame-panel-header-px) first:pe-0 last:pe-(--frame-panel-header-px)",
        }}
      >
        <SectionFrame className="w-full">
          <SectionHead
            icon={UI_ICONS.objectives}
            title="Objectives"
            badges={
              muted > 0 ? (
                <Badge variant="outline" className="tabular-nums">
                  {UI_ICONS.mute}
                  {muted} muted
                </Badge>
              ) : null
            }
            description={
              <span
                role="status"
                className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums"
              >
                <span>
                  {visible.length === slos.length
                    ? plural(slos.length, "SLO")
                    : `${visible.length} of ${plural(slos.length, "SLO")}`}
                </span>
                <DotSeparator />
                <span>{attention} need attention</span>
              </span>
            }
          >
            <SloDisplayPopover
              table={table}
              density={density}
              onDensityChange={setDensity}
              striped={striped}
              onStripedChange={setStriped}
            />
          </SectionHead>

          {/* Full bleed: every row inside carries the header band's inset. */}
          <FramePanel className="p-0">
            {selectedIds.length > 0 ? (
              <BulkBar
                count={selectedIds.length}
                selected={selected}
                onClear={() => setRowSelection({})}
                onSetAlerting={(alerting) => {
                  setAlerting(selectedIds, alerting)
                  setRowSelection({})
                }}
                onDelete={(origin) => {
                  // One pick confirms by name, like the row menu.
                  const only =
                    selectedIds.length === 1 ? selected[0] : undefined
                  requestDelete(
                    only
                      ? { kind: "row", id: only.id, name: only.name, origin }
                      : { kind: "bulk", ids: selectedIds, origin }
                  )
                }}
              />
            ) : (
              <GridStrip
                tab={tab}
                counts={tabCounts}
                onTabChange={(next) => {
                  setTab(next)
                  resetPage()
                  setRowSelection({})
                }}
              >
                <SloToolbar
                  search={search}
                  onSearchChange={(value) => {
                    setSearch(value)
                    resetPage()
                    setRowSelection({})
                  }}
                  searchRef={searchRef}
                  filterQuery={filterQuery}
                  onFilterQueryChange={(next) => {
                    setFilterQuery(next)
                    resetPage()
                    setRowSelection({})
                  }}
                />
              </GridStrip>
            )}

            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </FramePanel>

          <FrameFooter>
            <DataGridPagination
              sizes={[10, 25, 50]}
              info="{from} - {to} of {count} SLOs"
            />
          </FrameFooter>
        </SectionFrame>
      </DataGrid>

      {/* Overlays */}
      <SloSheet
        slo={sheetSlo}
        open={sheet.open}
        tab={sheet.tab}
        position={
          sheetIndex >= 0
            ? { index: sheetIndex, total: orderedIds.length }
            : null
        }
        returnFocusRef={returnFocusRef}
        onTabChange={(next) => onSheetChange({ tab: next })}
        onStep={(direction) => stepTo(sheetIndex + direction)}
        onClose={onCloseSheet}
        onAlertingToggle={(slo) => setAlerting([slo.id], !slo.alerting)}
        onExcludeToggle={setEventExcluded}
        onDuplicate={(id) => {
          const copyId = duplicate(id)
          if (!copyId) return
          setRevealId(copyId)
          onSheetChange({ sloId: copyId, tab: "settings" })
        }}
        onCopyYaml={onCopyYaml}
        onFocus={(id) => {
          onCloseSheet()
          onFocusSlo(id)
        }}
        onDelete={(slo) => {
          // The sheet closes first, then the shared confirm opens and owns focus.
          onReturnFocusChange(null)
          onCloseSheet()
          requestDelete({
            kind: "row",
            id: slo.id,
            name: slo.name,
            origin: triggerNodes.get(slo.id) ?? null,
          })
        }}
        onSave={update}
      />

      <DeleteSlosDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={pendingDelete}
        focusTargetRef={focusTargetRef}
        onConfirm={handleConfirmDelete}
      />
    </ActiveSloContext.Provider>
  )
}