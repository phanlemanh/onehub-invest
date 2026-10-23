"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { MotionConfig } from "motion/react"
import { toast } from "sonner"

import { TooltipProvider } from "@/components/ui/tooltip"

import { BudgetPanel } from "./budget-panel"
import {
  openSloYaml,
  plural,
  SLOS,
  teamOf,
  type SheetTab,
  type Slo,
  type SloDraft,
  type TeamScope,
} from "./data"
import { SlosGridView } from "./data-grid-view"
import { TOAST_ERROR_ICON, TOAST_SUCCESS_ICON } from "./icons"
import { NewSloSheet } from "./new-slo-sheet"
import { SloHeader } from "./slo-header"
import { SloHealthStrip } from "./slo-health-strip"
import { derive, triageOrder } from "./slo-math"
import { type SheetState } from "./slo-sheet"
import { useSloStore } from "./slo-store"

function copyYaml(slo: Slo) {
  const failed = () =>
    toast.error("Copy failed", {
      icon: TOAST_ERROR_ICON,
      description: "Clipboard access was blocked.",
    })
  // Clipboard access can be refused (an iframe, an insecure origin), so both paths answer.
  if (!navigator.clipboard) {
    failed()
    return
  }
  navigator.clipboard.writeText(openSloYaml(slo)).then(
    () =>
      toast.success("OpenSLO copied", {
        description: `${slo.name} as openslo/v1 YAML`,
        icon: TOAST_SUCCESS_ICON,
      }),
    failed
  )
}

export function ServiceLevels() {
  const store = useSloStore()
  const { create } = store
  const [scope, setScope] = useState<TeamScope>("all")
  const [focusId, setFocusId] = useState<string | null>(null)
  // Seeded id + closed: the sheet mounts closed, so its first open animates.
  const [sheet, setSheet] = useState<SheetState>({
    sloId: SLOS[0].id,
    open: false,
    tab: "overview",
  })
  const [newSloOpen, setNewSloOpen] = useState(false)
  const [reveal, setReveal] = useState<{ seq: number; id: string | null }>({
    seq: 0,
    id: null,
  })
  // Where focus returns when the SLO sheet or the New SLO sheet closes.
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const newSloReturnRef = useRef<HTMLElement | null>(null)
  const budgetRef = useRef<HTMLDivElement>(null)

  const scoped = useMemo(
    () =>
      scope === "all"
        ? store.slos
        : store.slos.filter((slo) => teamOf(slo) === scope),
    [scope, store.slos]
  )
  const triaged = useMemo(() => triageOrder(scoped), [scoped])
  // The chart follows a picked SLO while it stays in scope, else the worst one.
  const focusSlo =
    scoped.find((slo) => slo.id === focusId) ?? triaged[0] ?? null
  const exhausted = scoped.filter(
    (slo) => derive(slo).status === "exhausted"
  ).length
  const serviceCount = new Set(scoped.map((slo) => slo.service)).size

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
  const openSlo = useCallback(
    (id: string, tab: SheetTab, origin: HTMLElement) => {
      returnFocusRef.current = origin
      setSheet({ sloId: id, tab, open: true })
    },
    []
  )
  const setReturnFocus = useCallback((node: HTMLElement | null) => {
    returnFocusRef.current = node
  }, [])
  const openNewSlo = useCallback((origin: HTMLElement) => {
    newSloReturnRef.current = origin
    setNewSloOpen(true)
  }, [])

  /** Points the chart at an SLO and brings it into view. */
  const focusOnChart = useCallback((id: string) => {
    setFocusId(id)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    budgetRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    })
  }, [])

  function handleCreate(draft: SloDraft) {
    const slo = create(draft)
    // A new SLO hidden by the team scope or the grid's query reads as a failed save.
    if (scope !== "all" && scope !== teamOf(slo)) setScope("all")
    setFocusId(slo.id)
    setReveal((current) => ({ seq: current.seq + 1, id: slo.id }))
  }

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <div className="bg-background flex min-h-svh w-full flex-col">
          <div className="mx-auto w-full max-w-[1320px] p-4 md:p-6">
            {/* Content-level header */}
            <SloHeader
              exhaustedCount={exhausted}
              subtitle={`${plural(scoped.length, "SLO")} across ${plural(serviceCount, "service")}, UTC rolling windows`}
              scope={scope}
              onScopeChange={setScope}
              onNewSlo={openNewSlo}
            />

            <div className="mt-6 flex flex-col gap-4">
              <SloHealthStrip slos={scoped} onOpenSlo={openSlo} />
              <div ref={budgetRef} className="min-w-0">
                <BudgetPanel
                  slos={triaged}
                  slo={focusSlo}
                  onFocusChange={setFocusId}
                  onOpenSlo={openSlo}
                />
              </div>
              <SlosGridView
                slos={scoped}
                allSlos={store.slos}
                store={store}
                scope={scope}
                reveal={reveal}
                sheet={sheet}
                onSheetChange={handleSheetChange}
                onCloseSheet={closeSheet}
                onNewSlo={openNewSlo}
                onFocusSlo={focusOnChart}
                onCopyYaml={copyYaml}
                returnFocusRef={returnFocusRef}
                onReturnFocusChange={setReturnFocus}
              />
            </div>
          </div>
        </div>

        <NewSloSheet
          open={newSloOpen}
          onOpenChange={setNewSloOpen}
          onCreate={handleCreate}
          returnFocusRef={newSloReturnRef}
        />
      </TooltipProvider>
    </MotionConfig>
  )
}