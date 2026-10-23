import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import {
  CONNECTIONS,
  CURRENT_USER_ID,
  datasetOf,
  DAY_MS,
  emptyHours,
  formatCompact,
  INTEGRATIONS,
  LAST_SEED_CONNECTION,
  plural,
  REFERENCE_MS,
  RENEW_DAYS,
  type Connection,
  type ConnectionDraft,
  type Dataset,
  type HourCell,
  type NewConnectionInput,
  type SyncRun,
} from "./data"
import { TOAST_ERROR_ICON, TOAST_SUCCESS_ICON } from "./icons"

const UNDO_TOAST_MS = 8000
/** How long a manual sync takes in the demo. */
const SYNC_MS = 2400
const RENEW_MS = RENEW_DAYS * DAY_MS
const RUN_HISTORY = 8

const SEVERITY = { none: 0, skipped: 0, succeeded: 1, partial: 2, failed: 3 }

/** "A, B and 3 more": a bulk toast names what it touched. */
function nameList(connections: Connection[]) {
  const names = connections.map((connection) => connection.name)
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

/** Folds a finished run into the current hour, keeping the worst outcome. */
function withRun(connection: Connection, run: SyncRun): Connection {
  const hours = [...connection.hours]
  const last = hours[hours.length - 1]
  const outcome =
    SEVERITY[run.outcome] >= SEVERITY[last.outcome] ? run.outcome : last.outcome
  const next: HourCell = {
    ...last,
    outcome,
    runs: last.runs + 1,
    failed: last.failed + (run.outcome === "failed" ? 1 : 0),
    rows: last.rows + run.rows,
  }
  hours[hours.length - 1] = next
  return {
    ...connection,
    hours,
    runs: [run, ...connection.runs].slice(0, RUN_HISTORY),
  }
}

/** A secret's redacted tail, the only part the page ever keeps. */
const hintOf = (secret: string) => `••••${secret.trim().slice(-4)}`

export function useConnectionStore() {
  const [connections, setConnections] = useState<Connection[]>(CONNECTIONS)
  // Handlers stay stable (the grid's columns depend on them) and read the latest list here.
  const connectionsRef = useRef(connections)
  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])
  const connectionSeq = useRef(LAST_SEED_CONNECTION)
  const runSeq = useRef(64_000)
  const timers = useRef(new Map<string, number>())

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const patchConnections = useCallback(
    (ids: string[], patch: (connection: Connection) => Connection) =>
      setConnections((current) =>
        current.map((connection) =>
          ids.includes(connection.id) ? patch(connection) : connection
        )
      ),
    []
  )

  /** Lands a sync: a failing connection fails again, the rest succeed.
   *  `known` is the record as written in the tick that started the sync. */
  const finishSync = useCallback(
    (id: string, known?: Connection) => {
      timers.current.delete(id)
      const connection =
        known ?? connectionsRef.current.find((item) => item.id === id)
      if (!connection) return
      const failed = connection.health === "failing"
      const run: SyncRun = {
        id: `RUN-${++runSeq.current}`,
        startedAt: REFERENCE_MS,
        durationSec: Math.round(SYNC_MS / 1000),
        rows: failed ? 0 : connection.rowsPerRun,
        outcome: failed ? "failed" : "succeeded",
        message: failed ? connection.issue : undefined,
        by: CURRENT_USER_ID,
      }
      patchConnections([id], (item) => ({
        ...withRun(item, run),
        syncing: false,
        health: failed
          ? "failing"
          : item.health === "pending"
            ? "healthy"
            : item.health,
        datasets: failed
          ? item.datasets
          : item.datasets.map((dataset) =>
              dataset.linked ? { ...dataset, syncedAt: REFERENCE_MS } : dataset
            ),
      }))
      if (failed) {
        toast.error(`${connection.name} sync failed`, {
          icon: TOAST_ERROR_ICON,
          description: connection.issue,
        })
      } else {
        notify(
          `${connection.name} synced`,
          `${formatCompact(run.rows)} rows across ${plural(connection.datasets.filter((dataset) => dataset.linked).length, "dataset")}`
        )
      }
    },
    [patchConnections]
  )

  const startSync = useCallback(
    (ids: string[], known?: Connection) => {
      patchConnections(ids, (connection) => ({ ...connection, syncing: true }))
      for (const id of ids) {
        // Frozen demo guard: ?demo=frozen pins the demo, so no timer starts.
        if (document.documentElement.dataset.demo === "frozen") {
          finishSync(id, known)
          continue
        }
        const existing = timers.current.get(id)
        if (existing) window.clearTimeout(existing)
        timers.current.set(
          id,
          window.setTimeout(() => finishSync(id, known), SYNC_MS)
        )
      }
    },
    [patchConnections, finishSync]
  )

  /** Starts a manual sync; paused or already syncing connections sit out. */
  const syncNow = useCallback(
    (ids: string[]) => {
      const targets = connectionsRef.current.filter(
        (connection) =>
          ids.includes(connection.id) &&
          !connection.paused &&
          !connection.syncing
      )
      if (targets.length === 0) return
      startSync(targets.map((connection) => connection.id))
    },
    [startSync]
  )

  /** Pause or resume syncs; one toast for one connection or a selection. */
  const setPaused = useCallback(
    (ids: string[], paused: boolean) => {
      const targets = connectionsRef.current.filter(
        (connection) =>
          ids.includes(connection.id) && connection.paused !== paused
      )
      if (targets.length === 0) return
      const snapshot = new Map(
        targets.map((connection) => [
          connection.id,
          {
            paused: connection.paused,
            pausedAt: connection.pausedAt,
            pausedBy: connection.pausedBy,
            pauseNote: connection.pauseNote,
          },
        ])
      )
      for (const target of targets) {
        const timer = timers.current.get(target.id)
        if (timer) window.clearTimeout(timer)
        timers.current.delete(target.id)
      }
      patchConnections([...snapshot.keys()], (connection) =>
        paused
          ? {
              ...connection,
              paused: true,
              syncing: false,
              pausedAt: REFERENCE_MS,
              pausedBy: CURRENT_USER_ID,
              pauseNote: undefined,
            }
          : {
              ...connection,
              paused: false,
              pausedAt: undefined,
              pausedBy: undefined,
              pauseNote: undefined,
            }
      )
      const verb = paused ? "paused" : "resumed"
      notify(
        targets.length === 1
          ? `Syncs ${verb}`
          : `Syncs ${verb} on ${plural(targets.length, "connection")}`,
        nameList(targets),
        () =>
          setConnections((current) =>
            current.map((connection) => {
              const fields = snapshot.get(connection.id)
              return fields ? { ...connection, ...fields } : connection
            })
          )
      )
    },
    [patchConnections]
  )

  /** Links or unlinks datasets of one connection. */
  const setLinked = useCallback(
    (connectionId: string, datasetIds: string[], linked: boolean) => {
      const connection = connectionsRef.current.find(
        (item) => item.id === connectionId
      )
      if (!connection) return
      const targets = connection.datasets.filter(
        (dataset) =>
          datasetIds.includes(dataset.id) && dataset.linked !== linked
      )
      if (targets.length === 0) return
      const before = new Map(targets.map((dataset) => [dataset.id, dataset]))
      patchConnections([connectionId], (item) => ({
        ...item,
        datasets: item.datasets.map((dataset) =>
          before.has(dataset.id)
            ? {
                ...dataset,
                linked,
                discovered: false,
                syncedAt: linked ? null : dataset.syncedAt,
              }
            : dataset
        ),
      }))
      const what =
        targets.length === 1
          ? targets[0].name
          : plural(targets.length, "dataset")
      notify(
        linked ? `${what} linked` : `${what} unlinked`,
        linked
          ? `Syncs from ${connection.name} on its next run`
          : `No longer synced from ${connection.name}`,
        () =>
          patchConnections([connectionId], (item) => ({
            ...item,
            datasets: item.datasets.map(
              (dataset) => before.get(dataset.id) ?? dataset
            ),
          }))
      )
    },
    [patchConnections]
  )

  /** Takes the upstream columns into the dataset's schema. */
  const acceptDrift = useCallback(
    (connectionId: string, datasetId: string) => {
      const connection = connectionsRef.current.find(
        (item) => item.id === connectionId
      )
      const dataset = connection?.datasets.find((item) => item.id === datasetId)
      if (!connection || !dataset || dataset.drift.length === 0) return
      const apply = (next: Dataset) => (item: Connection) => ({
        ...item,
        datasets: item.datasets.map((entry) =>
          entry.id === datasetId ? next : entry
        ),
      })
      patchConnections(
        [connectionId],
        apply({
          ...dataset,
          columns: [...dataset.columns, ...dataset.drift],
          drift: [],
        })
      )
      notify(
        `${plural(dataset.drift.length, "column")} accepted`,
        `${dataset.name} now syncs ${dataset.drift.map((column) => column.name).join(" and ")}`,
        () => patchConnections([connectionId], apply(dataset))
      )
    },
    [patchConnections]
  )

  /** Looks upstream for new datasets; returns what it found. */
  const refreshSchema = useCallback(
    (connectionId: string) => {
      const connection = connectionsRef.current.find(
        (item) => item.id === connectionId
      )
      if (!connection) return null
      const [found, ...rest] = connection.discoverable
      if (!found) {
        notify(
          "Schema up to date",
          `${connection.name} has no new datasets upstream`
        )
        return null
      }
      const dataset: Dataset = {
        ...datasetOf(connectionId, found, false, null),
        discovered: true,
      }
      patchConnections([connectionId], (item) => ({
        ...item,
        datasets: [...item.datasets, dataset],
        discoverable: rest,
      }))
      notify("1 dataset discovered", `${found.name} on ${connection.name}`)
      return dataset.id
    },
    [patchConnections]
  )

  /** Stores the new secret's tail and reconnects a failing connection. */
  const rotateCredential = useCallback(
    (connectionId: string, secret: string) => {
      const connection = connectionsRef.current.find(
        (item) => item.id === connectionId
      )
      if (!connection) return
      const wasFailing = connection.health === "failing"
      const auth = INTEGRATIONS[connection.integration].auth
      const rotate = (item: Connection): Connection => ({
        ...item,
        health: wasFailing ? "healthy" : item.health,
        issue: wasFailing ? undefined : item.issue,
        failingSince: wasFailing ? undefined : item.failingSince,
        credential: {
          ...item.credential,
          hint:
            auth === "oauth" || auth === "githubApp"
              ? item.credential.hint
              : hintOf(secret),
          rotatedAt: REFERENCE_MS,
          rotatedBy: CURRENT_USER_ID,
          expiresAt:
            item.credential.expiresAt === null ? null : REFERENCE_MS + RENEW_MS,
        },
      })
      patchConnections([connectionId], rotate)
      notify(
        wasFailing ? `${connection.name} reconnected` : "Credential rotated",
        wasFailing && !connection.paused
          ? "Authenticated with the new secret, sync started"
          : `${connection.name} uses the new secret from its next run`
      )
      if (wasFailing && !connection.paused)
        startSync([connectionId], rotate(connection))
    },
    [patchConnections, startSync]
  )

  /** Re-runs the OAuth grant: the token lives another RENEW_DAYS. */
  const renewAuthorization = useCallback(
    (connectionId: string) => {
      const connection = connectionsRef.current.find(
        (item) => item.id === connectionId
      )
      if (!connection) return
      patchConnections([connectionId], (item) => ({
        ...item,
        credential: {
          ...item.credential,
          rotatedAt: REFERENCE_MS,
          rotatedBy: CURRENT_USER_ID,
          expiresAt:
            item.credential.expiresAt === null ? null : REFERENCE_MS + RENEW_MS,
        },
      }))
      notify(
        "Authorization renewed",
        `${connection.name} token valid for ${RENEW_DAYS} days`
      )
    },
    [patchConnections]
  )

  const create = useCallback(
    (input: NewConnectionInput) => {
      const integration = INTEGRATIONS[input.integration]
      const id = `CON-${++connectionSeq.current}`
      const connection: Connection = {
        id,
        name: input.name,
        integration: input.integration,
        environment: input.environment,
        endpoint: input.endpoint,
        frequency: input.frequency,
        ownerId: input.ownerId,
        alertOnFailure: input.alertOnFailure,
        health: "pending",
        paused: false,
        syncing: false,
        credential: {
          kind: integration.auth,
          hint:
            integration.auth === "oauth" || integration.auth === "githubApp"
              ? "Granted just now"
              : hintOf(input.secret),
          principal: integration.principal,
          rotatedAt: REFERENCE_MS,
          rotatedBy: CURRENT_USER_ID,
          expiresAt:
            integration.auth === "oauth" ? REFERENCE_MS + RENEW_MS : null,
        },
        createdAt: REFERENCE_MS,
        hours: emptyHours(),
        runs: [],
        rowsPerRun: 4_800,
        durationSec: 30,
        datasets: integration.starter.map((seed) =>
          datasetOf(id, seed, input.linked.includes(seed.name), null)
        ),
        discoverable: [],
      }
      setConnections((current) => [connection, ...current])
      notify(
        "Connection created",
        `${connection.name}, ${plural(input.linked.length, "dataset")} linked, first sync started`
      )
      startSync([id], connection)
      return connection
    },
    [startSync]
  )

  /** Saves the settings; history, datasets and the credential stay as they are. */
  const update = useCallback(
    (id: string, draft: ConnectionDraft) => {
      const previous = connectionsRef.current.find(
        (connection) => connection.id === id
      )
      if (!previous) return
      patchConnections([id], (connection) => ({ ...connection, ...draft }))
      notify("Connection updated", draft.name, () =>
        patchConnections([id], (connection) => ({
          ...connection,
          name: previous.name,
          environment: previous.environment,
          endpoint: previous.endpoint,
          frequency: previous.frequency,
          ownerId: previous.ownerId,
          alertOnFailure: previous.alertOnFailure,
        }))
      )
    },
    [patchConnections]
  )

  /** Inserts a paused copy after the source, under a free name; returns its id. */
  const duplicate = useCallback((id: string) => {
    const source = connectionsRef.current.find(
      (connection) => connection.id === id
    )
    if (!source) return null
    const taken = new Set(connectionsRef.current.map((item) => item.name))
    let name = `${source.name}-copy`
    for (let n = 2; taken.has(name); n++) name = `${source.name}-copy-${n}`
    const copyId = `CON-${++connectionSeq.current}`
    const copy: Connection = {
      ...source,
      id: copyId,
      name,
      health: "pending",
      issue: undefined,
      failingSince: undefined,
      paused: true,
      pausedAt: REFERENCE_MS,
      pausedBy: CURRENT_USER_ID,
      pauseNote: `Duplicated from ${source.id}`,
      syncing: false,
      createdAt: REFERENCE_MS,
      hours: emptyHours(),
      runs: [],
      datasets: source.datasets.map((dataset) =>
        datasetOf(copyId, dataset, dataset.linked, null)
      ),
    }
    setConnections((current) => {
      const index = current.findIndex((connection) => connection.id === id)
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
    })
    notify("Connection duplicated", `${copy.name}, paused until you resume it`)
    return copyId
  }, [])

  /** Removes connections; Undo re-anchors each to its original neighbour. */
  const remove = useCallback((ids: string[]) => {
    const current = connectionsRef.current
    const removed = current
      .map((connection, index) => ({
        connection,
        index,
        previousId: current[index - 1]?.id,
        followingId: current[index + 1]?.id,
      }))
      .filter((entry) => ids.includes(entry.connection.id))
    if (removed.length === 0) return
    for (const { connection } of removed) {
      const timer = timers.current.get(connection.id)
      if (timer) window.clearTimeout(timer)
      timers.current.delete(connection.id)
    }
    setConnections((list) =>
      list.filter((connection) => !ids.includes(connection.id))
    )
    notify(
      removed.length === 1
        ? "Connection deleted"
        : `${plural(removed.length, "connection")} deleted`,
      nameList(removed.map((entry) => entry.connection)),
      () =>
        setConnections((list) => {
          const next = [...list]
          for (const entry of removed) {
            if (next.some((item) => item.id === entry.connection.id)) continue
            const after = next.findIndex((item) => item.id === entry.previousId)
            const before = next.findIndex(
              (item) => item.id === entry.followingId
            )
            const at =
              after >= 0
                ? after + 1
                : before >= 0
                  ? before
                  : Math.min(entry.index, next.length)
            // A restored connection comes back idle: its sync was cancelled.
            next.splice(at, 0, { ...entry.connection, syncing: false })
          }
          return next
        })
    )
  }, [])

  return {
    connections,
    syncNow,
    setPaused,
    setLinked,
    acceptDrift,
    refreshSchema,
    rotateCredential,
    renewAuthorization,
    create,
    update,
    duplicate,
    remove,
  }
}

export type ConnectionStore = ReturnType<typeof useConnectionStore>