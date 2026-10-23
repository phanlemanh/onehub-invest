import { useEffect, useRef, useState } from "react"
import { Frame, FramePanel } from "@/components/reui/frame"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import {
  INTEGRATIONS,
  plural,
  type Connection,
  type IntegrationId,
} from "./data"
import { UI_ICONS } from "./icons"
import { HintHeader } from "./section-header"

export type TestCheck = {
  label: string
  passed: string
  /** Set when this check fails in the demo. */
  failure?: string
}

const STEP_MS = 700

/** The three checks a connection test runs, worded for its integration. */
export function checksFor({
  integration,
  endpoint,
  principal,
  datasets,
  failure,
}: {
  integration: IntegrationId
  endpoint: string
  principal: string
  datasets: number
  /** An auth error the test reproduces, from a failing connection. */
  failure?: string
}): TestCheck[] {
  const config = INTEGRATIONS[integration]
  const host = endpoint.trim() || config.endpointHint
  const network =
    config.category === "database"
      ? `${host} resolved to 203.0.113.24, TLS 1.3`
      : `${config.label} answered in 182 ms`
  return [
    { label: `Reach ${config.label}`, passed: network },
    {
      label: "Authenticate",
      passed: `Signed in as ${principal}`,
      failure,
    },
    {
      label: "Read datasets",
      passed: `${plural(datasets, "dataset")} visible with read access`,
    },
  ]
}

export const checksForConnection = (connection: Connection) =>
  checksFor({
    integration: connection.integration,
    endpoint: connection.endpoint,
    principal: connection.credential.principal,
    datasets: connection.datasets.length,
    failure: connection.health === "failing" ? connection.issue : undefined,
  })

type Run = { seq: number; done: number }

/** A Test Connection button over the checks it runs, one after another;
 *  the first failure stops the run. */
export function ConnectionTest({
  checks,
  onResult,
  disabled = false,
  description = "Network, sign in and read access",
}: {
  checks: TestCheck[]
  onResult?: (passed: boolean) => void
  disabled?: boolean
  description?: string
}) {
  const [run, setRun] = useState<Run | null>(null)
  // Read by the step timer, so a parent re-render never restarts a step.
  const latest = useRef({ checks, onResult })
  useEffect(() => {
    latest.current = { checks, onResult }
  })
  const failedAt =
    run === null
      ? -1
      : checks.findIndex(
          (check, index) => index < run.done && check.failure !== undefined
        )
  const finished = run !== null && (failedAt >= 0 || run.done >= checks.length)
  const running = run !== null && !finished

  useEffect(() => {
    // Frozen demo guard: ?demo=frozen pins the demo, so no timer starts.
    if (document.documentElement.dataset.demo === "frozen") return
    if (!running || !run) return
    const timer = window.setTimeout(() => {
      const { checks: current, onResult: report } = latest.current
      const done = run.done + 1
      setRun({ seq: run.seq, done })
      const failed = current
        .slice(0, done)
        .some((check) => check.failure !== undefined)
      if (failed || done >= current.length) report?.(!failed)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [running, run])

  function start() {
    const seq = (run?.seq ?? 0) + 1
    if (document.documentElement.dataset.demo === "frozen") {
      // Frozen: land the outcome at once, no timer.
      const stop = checks.findIndex((check) => check.failure !== undefined)
      setRun({ seq, done: stop >= 0 ? stop + 1 : checks.length })
      onResult?.(stop < 0)
      return
    }
    setRun({ seq, done: 0 })
  }

  const passed = finished && failedAt < 0

  return (
    <Frame spacing="default" className="min-w-0">
      <HintHeader title="Connection Test" hint={description}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || running}
          onClick={start}
        >
          {running ? (
            <Spinner
              role="presentation"
              aria-label={undefined}
              aria-hidden="true"
            />
          ) : (
            UI_ICONS.plug
          )}
          {running ? "Testing" : run ? "Test Again" : "Test Connection"}
        </Button>
      </HintHeader>
      <FramePanel>
        <ol className="flex flex-col gap-2">
          {checks.map((check, index) => {
            const state =
              run === null
                ? "idle"
                : failedAt >= 0 && index > failedAt
                  ? "skipped"
                  : index < run.done
                    ? check.failure
                      ? "failed"
                      : "passed"
                    : index === run.done && running
                      ? "running"
                      : "idle"
            return (
              <li
                key={check.label}
                className="flex min-w-0 items-start gap-2.5"
              >
                <span
                  className={cn(
                    "flex h-5 w-4 shrink-0 items-center justify-center [&_svg:not([class*=size-])]:size-4",
                    state === "passed" && "text-success",
                    state === "failed" && "text-destructive",
                    (state === "idle" || state === "skipped") &&
                      "text-muted-foreground/60"
                  )}
                >
                  {state === "running" ? (
                    <Spinner
                      role="presentation"
                      aria-label={undefined}
                      aria-hidden="true"
                    />
                  ) : state === "passed" ? (
                    UI_ICONS.passed
                  ) : state === "failed" ? (
                    UI_ICONS.failed
                  ) : (
                    UI_ICONS.pending
                  )}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      state === "skipped" && "text-muted-foreground"
                    )}
                  >
                    {check.label}
                  </span>
                  <span
                    className={cn(
                      "text-xs text-pretty",
                      state === "failed"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {state === "passed"
                      ? check.passed
                      : state === "failed"
                        ? check.failure
                        : state === "skipped"
                          ? "Skipped after the failure above"
                          : state === "running"
                            ? "Checking..."
                            : "Not run yet"}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
        <p role="status" className="sr-only">
          {running
            ? "Testing connection"
            : finished
              ? passed
                ? "Connection test passed"
                : "Connection test failed"
              : ""}
        </p>
      </FramePanel>
    </Frame>
  )
}