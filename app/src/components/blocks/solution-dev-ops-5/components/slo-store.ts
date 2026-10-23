import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  buildSlo,
  CURRENT_USER_ID,
  formatShare,
  LAST_SEED_SLO,
  plural,
  SLOS,
  type Slo,
  type SloDraft,
} from "./data"
import { TOAST_SUCCESS_ICON } from "./icons"
import { derive, REFERENCE_MS } from "./slo-math"

const UNDO_TOAST_MS = 8000

type AlertFields = Pick<Slo, "alerting" | "mutedAt" | "mutedBy" | "muteNote">

const alertFieldsOf = (slo: Slo): AlertFields => ({
  alerting: slo.alerting,
  mutedAt: slo.mutedAt,
  mutedBy: slo.mutedBy,
  muteNote: slo.muteNote,
})

/** "A, B and 3 more": a bulk toast names what it touched. */
function nameList(slos: Slo[]) {
  const names = slos.map((slo) => slo.name)
  if (names.length <= 2) return names.join(" and ")
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
}

function notify(title: string, description: string, undo?: () => void) {
  toast.success(title, {
    description,
    icon: TOAST_SUCCESS_ICON,
    ...(undo && {
      duration: UNDO_TOAST_MS,
      action: { label: "Undo", onClick: undo },
    }),
  })
}

export function useSloStore() {
  const [slos, setSlos] = useState<Slo[]>(SLOS)
  // Handlers stay stable (the grid's columns depend on them) and read the latest list here.
  const slosRef = useRef(slos)
  useEffect(() => {
    slosRef.current = slos
  }, [slos])
  const sloSeq = useRef(LAST_SEED_SLO)

  const patchSlos = useCallback(
    (ids: string[], patch: (slo: Slo) => Slo) =>
      setSlos((current) =>
        current.map((slo) => (ids.includes(slo.id) ? patch(slo) : slo))
      ),
    []
  )

  /** Mute or unmute burn alerts; one toast for one SLO or a selection. */
  const setAlerting = useCallback(
    (ids: string[], alerting: boolean) => {
      const targets = slosRef.current.filter(
        (slo) => ids.includes(slo.id) && slo.alerting !== alerting
      )
      if (targets.length === 0) return
      const snapshot = new Map(
        targets.map((slo) => [slo.id, alertFieldsOf(slo)])
      )
      patchSlos([...snapshot.keys()], (slo) =>
        alerting
          ? {
              ...slo,
              alerting: true,
              mutedAt: undefined,
              mutedBy: undefined,
              muteNote: undefined,
            }
          : {
              ...slo,
              alerting: false,
              mutedAt: REFERENCE_MS,
              mutedBy: CURRENT_USER_ID,
              muteNote: undefined,
            }
      )
      const verb = alerting ? "unmuted" : "muted"
      notify(
        targets.length === 1
          ? `Alerts ${verb}`
          : `Alerts ${verb} on ${plural(targets.length, "SLO")}`,
        nameList(targets),
        () =>
          setSlos((current) =>
            current.map((slo) => {
              const fields = snapshot.get(slo.id)
              return fields ? { ...slo, ...fields } : slo
            })
          )
      )
    },
    [patchSlos]
  )

  /** Counts an event toward the budget again, or sets it aside. */
  const setEventExcluded = useCallback(
    (sloId: string, eventId: string, excluded: boolean) => {
      const slo = slosRef.current.find((item) => item.id === sloId)
      const event = slo?.events.find((item) => item.id === eventId)
      if (!slo || !event || event.excluded === excluded) return
      const apply =
        (value: boolean, by: Slo["ownerId"] | undefined) =>
        (item: Slo): Slo => ({
          ...item,
          events: item.events.map((entry) =>
            entry.id === eventId
              ? { ...entry, excluded: value, excludedBy: by }
              : entry
          ),
        })
      const patch = apply(excluded, excluded ? CURRENT_USER_ID : undefined)
      patchSlos([sloId], patch)
      notify(
        excluded ? "Event excluded" : "Event counted",
        `${event.title}, ${formatShare(derive(patch(slo)).stats.remaining)} of budget left`,
        () => patchSlos([sloId], apply(event.excluded, event.excludedBy))
      )
    },
    [patchSlos]
  )

  /** Inserts a muted copy after the source; returns its id. */
  const duplicate = useCallback((id: string) => {
    const source = slosRef.current.find((slo) => slo.id === id)
    if (!source) return null
    const copy: Slo = {
      ...source,
      id: `SLO-${++sloSeq.current}`,
      name: `${source.name} (copy)`,
      alerting: false,
      mutedAt: REFERENCE_MS,
      mutedBy: CURRENT_USER_ID,
      muteNote: `Duplicated from ${source.id}`,
      createdAt: REFERENCE_MS,
    }
    setSlos((current) => {
      const index = current.findIndex((slo) => slo.id === id)
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
    })
    notify("SLO duplicated", `${copy.name}, alerts muted`)
    return copy.id
  }, [])

  const create = useCallback((draft: SloDraft) => {
    const slo = buildSlo(`SLO-${++sloSeq.current}`, draft)
    setSlos((current) => [slo, ...current])
    notify("SLO created", `${slo.name}, backfilled 90 days`)
    return slo
  }, [])

  /** Saves the definition; history and events stay as they are. */
  const update = useCallback(
    (id: string, draft: SloDraft) => {
      const previous = slosRef.current.find((slo) => slo.id === id)
      if (!previous) return
      patchSlos([id], (slo) => ({
        ...slo,
        ...draft,
        ...(draft.alerting === slo.alerting
          ? {}
          : draft.alerting
            ? { mutedAt: undefined, mutedBy: undefined, muteNote: undefined }
            : { mutedAt: REFERENCE_MS, mutedBy: CURRENT_USER_ID }),
      }))
      notify("SLO updated", draft.name, () =>
        patchSlos([id], (slo) => ({ ...slo, ...previous, events: slo.events }))
      )
    },
    [patchSlos]
  )

  /** Removes SLOs; Undo re-anchors each to its original neighbour by id. */
  const remove = useCallback((ids: string[]) => {
    const current = slosRef.current
    const removed = current
      .map((slo, index) => ({
        slo,
        index,
        previousId: current[index - 1]?.id,
        followingId: current[index + 1]?.id,
      }))
      .filter((entry) => ids.includes(entry.slo.id))
    if (removed.length === 0) return
    setSlos((list) => list.filter((slo) => !ids.includes(slo.id)))
    notify(
      removed.length === 1
        ? "SLO deleted"
        : `${plural(removed.length, "SLO")} deleted`,
      nameList(removed.map((entry) => entry.slo)),
      () =>
        setSlos((list) => {
          const next = [...list]
          for (const entry of removed) {
            if (next.some((slo) => slo.id === entry.slo.id)) continue
            const after = next.findIndex((slo) => slo.id === entry.previousId)
            const before = next.findIndex((slo) => slo.id === entry.followingId)
            const at =
              after >= 0
                ? after + 1
                : before >= 0
                  ? before
                  : Math.min(entry.index, next.length)
            next.splice(at, 0, entry.slo)
          }
          return next
        })
    )
  }, [])

  return {
    slos,
    setAlerting,
    setEventExcluded,
    duplicate,
    create,
    update,
    remove,
  }
}

export type SloStore = ReturnType<typeof useSloStore>