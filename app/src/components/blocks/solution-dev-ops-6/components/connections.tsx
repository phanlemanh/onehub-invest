"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"

import { AttentionList } from "./attention-list"
import { CredentialDialog } from "./connection-dialogs"
import { type SheetState } from "./connection-sheet"
import { useConnectionStore } from "./connection-store"
import { ConnectionsHeader } from "./connections-header"
import {
  CONNECTIONS,
  linkedOf,
  plural,
  triageOrder,
  type Connection,
  type EnvironmentScope,
  type IntegrationId,
  type NewConnectionInput,
  type SheetTab,
} from "./data"
import { ConnectionsGridView } from "./data-grid-view"
import { NewConnectionSheet } from "./new-connection-sheet"
import { StatCards } from "./stat-cards"
import { SyncActivity } from "./sync-activity"

export function Connections() {
  const store = useConnectionStore()
  const { create, renewAuthorization, rotateCredential, setPaused, syncNow } =
    store
  const [scope, setScope] = useState<EnvironmentScope>("all")
  // Seeded id + closed: the sheet mounts closed, so its first open animates.
  const [sheet, setSheet] = useState<SheetState>({
    connectionId: CONNECTIONS[0].id,
    open: false,
    tab: "overview",
    datasetId: null,
  })
  const [newOpen, setNewOpen] = useState(false)
  const [credential, setCredential] = useState<{
    id: string | null
    open: boolean
  }>({ id: null, open: false })
  const [reveal, setReveal] = useState<{ seq: number; id: string | null }>({
    seq: 0,
    id: null,
  })
  // Where focus returns when each overlay closes.
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const newReturnRef = useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const credentialReturn = useRef<{
    origin: HTMLElement | null
    fallback?: () => HTMLElement | null
  }>({ origin: null })

  const scoped = useMemo(
    () =>
      scope === "all"
        ? store.connections
        : store.connections.filter(
            (connection) => connection.environment === scope
          ),
    [scope, store.connections]
  )
  const triaged = useMemo(() => triageOrder(scoped), [scoped])
  // By health, not status: a failing connection mid-sync is still failing.
  const failing = scoped.filter(
    (connection) => connection.health === "failing"
  ).length
  const linked = scoped.reduce(
    (sum, connection) => sum + linkedOf(connection).length,
    0
  )
  const counts = useMemo(() => {
    const map = new Map<IntegrationId, number>()
    for (const connection of store.connections)
      map.set(
        connection.integration,
        (map.get(connection.integration) ?? 0) + 1
      )
    return map
  }, [store.connections])
  const allNames = useMemo(
    () => store.connections.map((connection) => connection.name),
    [store.connections]
  )

  const handleSheetChange = useCallback(
    (patch: Partial<SheetState>) =>
      setSheet((current) => ({ ...current, ...patch })),
    []
  )
  const closeSheet = useCallback(
    () => setSheet((current) => ({ ...current, open: false })),
    []
  )
  /** Openers outside the grid take focus back to the element that opened. */
  const openConnection = useCallback(
    (id: string, tab: SheetTab, origin: HTMLElement) => {
      returnFocusRef.current = origin
      setSheet({ connectionId: id, tab, open: true, datasetId: null })
    },
    []
  )
  const setReturnFocus = useCallback((node: HTMLElement | null) => {
    returnFocusRef.current = node
  }, [])
  const openNew = useCallback((origin: HTMLElement) => {
    newReturnRef.current = origin
    setNewOpen(true)
  }, [])
  const openCredential = useCallback(
    (
      connection: Connection,
      origin: HTMLElement,
      fallback?: () => HTMLElement | null
    ) => {
      credentialReturn.current = { origin, fallback }
      setCredential({ id: connection.id, open: true })
    },
    []
  )
  const resolveCredentialReturn = useCallback(() => {
    const { origin, fallback } = credentialReturn.current
    if (origin?.isConnected) return origin
    const next = fallback?.() ?? null
    return next?.isConnected ? next : null
  }, [])

  /** Brings the grid into view, minding reduced motion. */
  const showGrid = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    gridRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    })
  }, [])

  function handleCreate(input: NewConnectionInput) {
    const connection = create(input)
    // A new connection hidden by the environment scope reads as a failed save.
    if (scope !== "all" && scope !== connection.environment) setScope("all")
    setReveal((current) => ({ seq: current.seq + 1, id: connection.id }))
  }

  const credentialConnection =
    store.connections.find((connection) => connection.id === credential.id) ??
    null

  return (
    <TooltipProvider>
      <div className="bg-background flex min-h-svh w-full flex-col">
        <div className="mx-auto w-full max-w-[1320px] p-3 md:p-4">
          {/* Content-level header */}
          <ConnectionsHeader
            failingCount={failing}
            subtitle={`${plural(scoped.length, "connection")}, ${plural(linked, "linked dataset")}`}
            scope={scope}
            onScopeChange={setScope}
            onNewConnection={openNew}
          />

          <div className="mt-4 flex flex-col gap-4">
            <StatCards
              connections={scoped}
              onOpenConnection={openConnection}
              onShowAll={showGrid}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <SyncActivity connections={scoped} className="lg:col-span-2" />
              <AttentionList
                connections={triaged}
                onOpenConnection={openConnection}
                onRotate={openCredential}
                onRenew={renewAuthorization}
                onResume={(ids) => setPaused(ids, false)}
                onSync={syncNow}
                className="min-w-0"
              />
            </div>
            <div ref={gridRef} className="scroll-mt-4">
              <ConnectionsGridView
                connections={triaged}
                allConnections={store.connections}
                store={store}
                scope={scope}
                reveal={reveal}
                sheet={sheet}
                onSheetChange={handleSheetChange}
                onCloseSheet={closeSheet}
                onNewConnection={openNew}
                onCredential={openCredential}
                returnFocusRef={returnFocusRef}
                onReturnFocusChange={setReturnFocus}
              />
            </div>
          </div>
        </div>
      </div>

      <NewConnectionSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        takenNames={allNames}
        counts={counts}
        onCreate={handleCreate}
        returnFocusRef={newReturnRef}
      />

      <CredentialDialog
        connection={credentialConnection}
        open={credential.open}
        onOpenChange={(open) =>
          setCredential((current) => ({ ...current, open }))
        }
        resolveReturnFocus={resolveCredentialReturn}
        onRotate={rotateCredential}
        onRenew={renewAuthorization}
      />
    </TooltipProvider>
  )
}