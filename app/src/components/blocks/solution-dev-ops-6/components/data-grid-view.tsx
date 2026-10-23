"use client"

// One grid per category: every group repeats its own column header row, which
// one TanStack table cannot express, so the view renders a table per group and
// owns everything they share (columns, sort, selection, visibility, layout).
import { useCallback, useMemo, useRef, useState, type RefObject } from "react"
import { Badge } from "@/components/reui/badge"
import { type DataGridLayoutProps } from "@/components/reui/data-grid/data-grid"
import { type FilterQuery } from "@/components/reui/filters/filters-types"
import { Frame, FramePanel } from "@/components/reui/frame"
import {
  type ColumnVisibilityState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"

import {
  ActiveConnectionContext,
  createConnectionColumns,
  type ConnectionRowAction,
} from "./columns"
import {
  DeleteConnectionsDialog,
  deleteImpact,
  pendingIds,
  survivingNeighbour,
  UnlinkDatasetDialog,
  type PendingDelete,
  type PendingUnlink,
} from "./connection-dialogs"
import {
  EMPTY_FILTER_QUERY,
  matchesConnectionFilters,
} from "./connection-filters"
import { ConnectionGroup } from "./connection-group"
import { ConnectionSheet, type SheetState } from "./connection-sheet"
import { type ConnectionStore } from "./connection-store"
import { ConnectionToolbar } from "./connection-toolbar"
import {
  CATEGORY_ORDER,
  categoryOf,
  INTEGRATIONS,
  lastGoodSync,
  linkedOf,
  PERSON_BY_ID,
  rowsOf,
  STATUS_ORDER,
  statusOf,
  WORKSPACE_NAME,
  type Connection,
  type Dataset,
  type Density,
  type EnvironmentScope,
  type IntegrationCategory,
  type SheetTab,
} from "./data"
import { UI_ICONS } from "./icons"
import { SectionHeader } from "./section-header"

/** What each sortable column sorts by; the view sorts once for every group. */
const SORT_KEYS: Record<string, (connection: Connection) => number | string> = {
  name: (connection) => connection.name,
  status: (connection) => STATUS_ORDER.indexOf(statusOf(connection)),
  datasets: (connection) => linkedOf(connection).length,
  linked: (connection) =>
    connection.datasets.length === 0
      ? 0
      : linkedOf(connection).length / connection.datasets.length,
  lastSync: (connection) => lastGoodSync(connection.runs) ?? 0,
  rows: (connection) => rowsOf(connection),
  environment: (connection) => connection.environment,
  owner: (connection) => PERSON_BY_ID.get(connection.ownerId)?.name ?? "",
}

function sortConnections(connections: Connection[], sorting: SortingState) {
  const [rule] = sorting
  const key = rule ? SORT_KEYS[rule.id] : undefined
  if (!rule || !key) return connections
  const direction = rule.desc ? -1 : 1
  return [...connections].sort((a, b) => {
    const left = key(a)
    const right = key(b)
    const order =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right))
    return order * direction
  })
}

/** A label and its count, divided like a toolbar group. */
function GridMetric({
  label,
  value,
  variant = "outline",
}: {
  label: string
  value: number
  variant?: "outline" | "warning-light"
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:border-l sm:ps-3 sm:first:border-l-0 sm:first:ps-0">
      <span className="text-muted-foreground truncate text-xs font-medium">
        {label}
      </span>
      <Badge variant={variant} className="tabular-nums">
        {value}
      </Badge>
    </div>
  )
}

function NoConnectionsEmpty({
  onNewConnection,
}: {
  onNewConnection: (origin: HTMLElement) => void
}) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{UI_ICONS.plug}</EmptyMedia>
        <EmptyTitle>No Connections Yet</EmptyTitle>
        <EmptyDescription>
          Connect a database, warehouse or app to {WORKSPACE_NAME}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          type="button"
          onClick={(event) => onNewConnection(event.currentTarget)}
        >
          {UI_ICONS.plus}
          New Connection
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
        <EmptyTitle>No Connections Match</EmptyTitle>
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

/** The selection's actions: the row checkboxes exist to drive this bar. */
function BulkBar({
  count,
  selected,
  onClear,
  onSync,
  onSetPaused,
  onDelete,
}: {
  count: number
  selected: Connection[]
  onClear: () => void
  onSync: () => void
  onSetPaused: (paused: boolean) => void
  onDelete: (origin: HTMLElement) => void
}) {
  return (
    <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 px-(--frame-panel-header-px) py-2">
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
          disabled={
            !selected.some(
              (connection) => !connection.paused && !connection.syncing
            )
          }
          onClick={onSync}
        >
          {UI_ICONS.sync}
          Sync Now
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selected.some((connection) => !connection.paused)}
          onClick={() => onSetPaused(true)}
        >
          {UI_ICONS.pause}
          Pause
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selected.some((connection) => connection.paused)}
          onClick={() => onSetPaused(false)}
        >
          {UI_ICONS.resume}
          Resume
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

/** Name, endpoint, integration and every dataset name are searchable. */
function matchesSearch(connection: Connection, query: string) {
  if (!query) return true
  return [
    connection.name,
    connection.id,
    connection.endpoint,
    INTEGRATIONS[connection.integration].label,
    ...connection.datasets.map((dataset) => dataset.name),
  ].some((value) => value.toLowerCase().includes(query))
}

export function ConnectionsGridView({
  connections,
  allConnections,
  store,
  scope,
  reveal,
  sheet,
  onSheetChange,
  onCloseSheet,
  onNewConnection,
  onCredential,
  returnFocusRef,
  onReturnFocusChange,
}: {
  /** The scoped list the grid shows, already in triage order. */
  connections: Connection[]
  /** Every connection, so the sheet keeps its record outside the current scope. */
  allConnections: Connection[]
  store: ConnectionStore
  scope: EnvironmentScope
  /** Bumps after a create: the view clears its query so the new row shows. */
  reveal: { seq: number; id: string | null }
  sheet: SheetState
  onSheetChange: (patch: Partial<SheetState>) => void
  onCloseSheet: () => void
  onNewConnection: (origin: HTMLElement) => void
  onCredential: (connection: Connection, origin: HTMLElement) => void
  /** Read by the sheet's finalFocus; openers set it through onReturnFocusChange. */
  returnFocusRef: RefObject<HTMLElement | null>
  onReturnFocusChange: (node: HTMLElement | null) => void
}) {
  const {
    syncNow,
    setPaused,
    setLinked,
    acceptDrift,
    refreshSchema,
    duplicate,
    remove,
    update,
  } = store
  const [search, setSearch] = useState("")
  const [filterQuery, setFilterQuery] =
    useState<FilterQuery>(EMPTY_FILTER_QUERY)
  const [hidden, setHidden] = useState<IntegrationCategory[]>([])
  // No header sort by default: rows keep the triage order, worst first.
  const [sorting, setSorting] = useState<SortingState>([])
  // Environment repeats the header scope, Rows 24h the stat cards: both start
  // hidden and return from the Display menu.
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ environment: false, rows: false })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [density, setDensity] = useState<Density>("compact")
  const [striped, setStriped] = useState(false)

  // Dialogs keep their last record while they close, so the exit stays intact.
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [pendingUnlink, setPendingUnlink] = useState<PendingUnlink | null>(null)

  // A scope change or a fresh create resets the view in the same render.
  const [seenScope, setSeenScope] = useState(scope)
  if (seenScope !== scope) {
    setSeenScope(scope)
    setRowSelection({})
  }
  const [seenReveal, setSeenReveal] = useState(reveal.seq)
  if (seenReveal !== reveal.seq) {
    setSeenReveal(reveal.seq)
    setSearch("")
    setFilterQuery(EMPTY_FILTER_QUERY)
    setHidden([])
    setRowSelection({})
  }

  // Row menu triggers by id: focus returns here, and a deleted row's falls
  // to a neighbour. A state-held Map, since the column handlers capture it.
  const [triggerNodes] = useState(() => new Map<string, HTMLButtonElement>())
  const focusTargetRef = useRef<HTMLElement | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const registerTrigger = useCallback(
    (id: string) => (node: HTMLButtonElement | null) => {
      if (node) triggerNodes.set(id, node)
      else triggerNodes.delete(id)
    },
    [triggerNodes]
  )

  const matching = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sortConnections(
      connections.filter(
        (connection) =>
          matchesSearch(connection, query) &&
          matchesConnectionFilters(connection, filterQuery)
      ),
      sorting
    )
  }, [connections, search, filterQuery, sorting])
  const counts = useMemo(() => {
    const result: Record<IntegrationCategory, number> = {
      database: 0,
      warehouse: 0,
      app: 0,
      files: 0,
    }
    for (const connection of matching) result[categoryOf(connection)] += 1
    return result
  }, [matching])
  const groups = useMemo(
    () =>
      CATEGORY_ORDER.filter((category) => !hidden.includes(category))
        .map((category) => ({
          category,
          rows: matching.filter(
            (connection) => categoryOf(connection) === category
          ),
        }))
        .filter((group) => group.rows.length > 0),
    [matching, hidden]
  )
  const visible = groups.flatMap((group) => group.rows)
  // The sheet steps through the order on screen, group after group.
  const orderedIds = visible.map((connection) => connection.id)

  /** Grid opens return focus to the row's menu, never a hover-card trigger. */
  const openFromGrid = useCallback(
    (id: string, sheetTab: SheetTab, datasetId?: string) => {
      onReturnFocusChange(triggerNodes.get(id) ?? null)
      onSheetChange({
        connectionId: id,
        tab: sheetTab,
        open: true,
        datasetId: datasetId ?? null,
      })
    },
    [onSheetChange, onReturnFocusChange, triggerNodes]
  )

  const requestDelete = useCallback(
    (targets: Connection[], origin: HTMLElement | null) => {
      const impact = deleteImpact(targets)
      const only = targets.length === 1 ? targets[0] : undefined
      setPendingDelete(
        only
          ? {
              kind: "row",
              id: only.id,
              name: only.name,
              linked: impact.linked,
              consumers: impact.consumers,
              origin,
            }
          : {
              kind: "bulk",
              ids: targets.map((connection) => connection.id),
              linked: impact.linked,
              origin,
            }
      )
      setDeleteOpen(true)
    },
    []
  )

  const handleAction = useCallback(
    (action: ConnectionRowAction, connection: Connection) => {
      const trigger = triggerNodes.get(connection.id) ?? null
      switch (action) {
        case "view":
          openFromGrid(connection.id, "overview")
          break
        case "preview":
          openFromGrid(connection.id, "preview")
          break
        case "edit":
          openFromGrid(connection.id, "settings")
          break
        case "sync":
          syncNow([connection.id])
          break
        case "pause":
          setPaused([connection.id], true)
          break
        case "resume":
          setPaused([connection.id], false)
          break
        case "credential":
          if (trigger) onCredential(connection, trigger)
          break
        case "duplicate": {
          const copyId = duplicate(connection.id)
          if (!copyId) break
          // The copy opens on Settings; focus returns to its source's menu.
          onReturnFocusChange(trigger)
          onSheetChange({
            connectionId: copyId,
            tab: "settings",
            open: true,
            datasetId: null,
          })
          break
        }
        case "delete":
          requestDelete([connection], trigger)
          break
      }
    },
    [
      openFromGrid,
      syncNow,
      setPaused,
      onCredential,
      duplicate,
      requestDelete,
      triggerNodes,
      onReturnFocusChange,
      onSheetChange,
    ]
  )

  const handleTogglePaused = useCallback(
    (id: string, paused: boolean) => setPaused([id], paused),
    [setPaused]
  )

  // Built once and shared: every group receives this same array, and the
  // explicit size on each column is what aligns the separate tables.
  const columns = useMemo(
    () =>
      createConnectionColumns(
        {
          onOpen: openFromGrid,
          onTogglePaused: handleTogglePaused,
          onAction: handleAction,
        },
        registerTrigger
      ),
    [openFromGrid, handleTogglePaused, handleAction, registerTrigger]
  )

  const tableLayout = useMemo<DataGridLayoutProps<Connection>["tableLayout"]>(
    () => ({
      dense: density === "compact",
      stripped: striped,
      rowBorder: true,
      headerBorder: true,
      headerBackground: false,
      columnsVisibility: false,
      columnsResizable: false,
      // Fixed width plus an explicit size per column keeps the groups aligned.
      width: "fixed",
    }),
    [density, striped]
  )
  const tableClassNames = useMemo<
    DataGridLayoutProps<Connection>["tableClassNames"]
  >(
    () => ({
      bodyRow: "group/connection-row [&:has([data-active-row])]:bg-muted/50",
      edgeCell:
        "first:ps-(--frame-panel-header-px) last:pe-(--frame-panel-header-px)",
    }),
    []
  )

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const selected = allConnections.filter((connection) =>
    selectedIds.includes(connection.id)
  )

  function stepTo(index: number) {
    const id = orderedIds[index]
    if (!id) return
    onSheetChange({ connectionId: id, datasetId: null })
    const trigger = triggerNodes.get(id)
    if (trigger) onReturnFocusChange(trigger)
  }

  function clearView() {
    setSearch("")
    setFilterQuery(EMPTY_FILTER_QUERY)
    setHidden([])
    setRowSelection({})
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const ids = pendingIds(pendingDelete)
    const neighbourId = survivingNeighbour(orderedIds, ids)
    focusTargetRef.current = neighbourId
      ? (triggerNodes.get(neighbourId) ?? null)
      : searchRef.current
    if (sheet.open && ids.includes(sheet.connectionId)) {
      // The confirm's finalFocus places focus; the closing sheet stays out of it.
      onReturnFocusChange(null)
      onCloseSheet()
    }
    remove(ids)
    setRowSelection({})
    setDeleteOpen(false)
  }

  /** Linking is instant; unlinking something a job still reads confirms first. */
  function handleToggleDataset(
    connection: Connection,
    dataset: Dataset,
    linked: boolean,
    origin: HTMLElement | null
  ) {
    const consumers = dataset.consumers ?? []
    if (!linked && consumers.length > 0) {
      setPendingUnlink({
        connectionId: connection.id,
        datasetId: dataset.id,
        name: dataset.name,
        consumers,
        origin,
      })
      setUnlinkOpen(true)
      return
    }
    setLinked(connection.id, [dataset.id], linked)
  }

  const sheetConnection =
    allConnections.find((connection) => connection.id === sheet.connectionId) ??
    null
  const sheetIndex = sheetConnection
    ? orderedIds.indexOf(sheetConnection.id)
    : -1
  const unhealthy = connections.filter(
    (connection) =>
      !connection.paused &&
      (connection.health === "failing" || connection.health === "degraded")
  ).length
  const takenNames = allConnections
    .filter((connection) => connection.id !== sheet.connectionId)
    .map((connection) => connection.name)

  return (
    <ActiveConnectionContext.Provider
      value={sheet.open ? sheet.connectionId : null}
    >
      <Frame spacing="default" className="w-full min-w-0">
        <SectionHeader
          title="All Connections"
          description={
            <span role="status">
              {visible.length === connections.length
                ? "Grouped by category, worst first"
                : `${visible.length} of ${connections.length} shown`}
            </span>
          }
        >
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <GridMetric label="Connections" value={connections.length} />
            <GridMetric
              label="Unhealthy"
              value={unhealthy}
              variant={unhealthy > 0 ? "warning-light" : "outline"}
            />
          </div>
        </SectionHeader>

        <FramePanel className="p-0">
          <ConnectionToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              setRowSelection({})
            }}
            searchRef={searchRef}
            hidden={hidden}
            onHiddenChange={(next) => {
              setHidden(next)
              setRowSelection({})
            }}
            counts={counts}
            filterQuery={filterQuery}
            onFilterQueryChange={(next) => {
              setFilterQuery(next)
              setRowSelection({})
            }}
            display={{
              density,
              onDensityChange: setDensity,
              striped,
              onStripedChange: setStriped,
              columnVisibility,
              onColumnVisibilityChange: setColumnVisibility,
            }}
          />

          {selectedIds.length > 0 ? (
            <>
              <Separator />
              <BulkBar
                count={selectedIds.length}
                selected={selected}
                onClear={() => setRowSelection({})}
                onSync={() => {
                  syncNow(selectedIds)
                  setRowSelection({})
                }}
                onSetPaused={(paused) => {
                  setPaused(selectedIds, paused)
                  setRowSelection({})
                }}
                onDelete={(origin) => requestDelete(selected, origin)}
              />
            </>
          ) : null}

          {groups.length > 0 ? (
            // Every band rules itself top and bottom, so no divider sits between groups.
            groups.map((group) => (
              <ConnectionGroup
                key={group.category}
                category={group.category}
                rows={group.rows}
                columns={columns}
                sorting={sorting}
                onSortingChange={setSorting}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnVisibility={columnVisibility}
                tableLayout={tableLayout}
                tableClassNames={tableClassNames}
                onRowClick={(connection) =>
                  openFromGrid(connection.id, "overview")
                }
              />
            ))
          ) : (
            <div className="border-t">
              {connections.length === 0 ? (
                <NoConnectionsEmpty onNewConnection={onNewConnection} />
              ) : (
                <NoMatchEmpty onClear={clearView} />
              )}
            </div>
          )}
        </FramePanel>
      </Frame>

      {/* Overlays */}
      <ConnectionSheet
        connection={sheetConnection}
        takenNames={takenNames}
        open={sheet.open}
        tab={sheet.tab}
        datasetId={sheet.datasetId}
        position={
          sheetIndex >= 0
            ? { index: sheetIndex, total: orderedIds.length }
            : null
        }
        returnFocusRef={returnFocusRef}
        onTabChange={(next) => onSheetChange({ tab: next })}
        onDatasetChange={(datasetId) => onSheetChange({ datasetId })}
        onStep={(direction) => stepTo(sheetIndex + direction)}
        onClose={onCloseSheet}
        onSync={(connection) => syncNow([connection.id])}
        onPausedToggle={(connection) =>
          setPaused([connection.id], !connection.paused)
        }
        onCredential={onCredential}
        onToggleDataset={handleToggleDataset}
        onAcceptDrift={(connection, dataset) =>
          acceptDrift(connection.id, dataset.id)
        }
        onRefreshSchema={(connection) => {
          const found = refreshSchema(connection.id)
          if (found) onSheetChange({ tab: "datasets" })
        }}
        onDuplicate={(id) => {
          const copyId = duplicate(id)
          if (!copyId) return
          onSheetChange({
            connectionId: copyId,
            tab: "settings",
            datasetId: null,
          })
        }}
        onDelete={(connection) => {
          // The sheet closes first, then the shared confirm opens and owns focus.
          onReturnFocusChange(null)
          onCloseSheet()
          requestDelete([connection], triggerNodes.get(connection.id) ?? null)
        }}
        onSave={update}
      />

      <DeleteConnectionsDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={pendingDelete}
        focusTargetRef={focusTargetRef}
        onConfirm={handleConfirmDelete}
      />

      <UnlinkDatasetDialog
        open={unlinkOpen}
        onOpenChange={setUnlinkOpen}
        pending={pendingUnlink}
        onConfirm={() => {
          if (pendingUnlink) {
            setLinked(
              pendingUnlink.connectionId,
              [pendingUnlink.datasetId],
              false
            )
          }
          setUnlinkOpen(false)
        }}
      />
    </ActiveConnectionContext.Provider>
  )
}