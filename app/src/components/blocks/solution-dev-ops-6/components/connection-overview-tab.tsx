import { type ReactNode } from "react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Frame, FramePanel } from "@/components/reui/frame"
import { cn } from "cn"
import { Bar, BarChart, XAxis, YAxis, type TooltipContentProps } from "recharts"

import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  ALERT_CHANNEL,
  AUTH_KINDS,
  expiringIn,
  formatClock,
  formatCompact,
  formatDateTime,
  formatDay,
  formatDuration,
  formatRelative,
  formatSpanDays,
  FREQUENCIES,
  HOUR_MS,
  lastGoodSync,
  linkedOf,
  nextSyncAt,
  OUTCOME_LABEL,
  PERSON_BY_ID,
  plural,
  REFERENCE_MS,
  rowsOf,
  type Connection,
  type HourCell,
  type RunOutcome,
  type SyncRun,
} from "./data"
import {
  CARD_ORIGIN,
  DockedCard,
  HOUR_CHART,
  HOUR_SHAPES,
  HOUR_TRACK,
  HourColumns,
  HourHatches,
  HourLegend,
} from "./hour-columns"
import { UI_ICONS } from "./icons"
import { HintHeader } from "./section-header"
import {
  EnvironmentFace,
  IntegrationFace,
  OwnerAvatar,
  OwnerFace,
} from "./value-faces"

/** Stack order, bottom to top. */
const ROW_SERIES = ["succeeded", "partial", "failed"] as const
type RowSeries = (typeof ROW_SERIES)[number]

// State tokens, never --chart-N: those flip hue between themes.
const ROWS_CHART_CONFIG = {
  succeeded: { label: "Succeeded", color: "var(--success)" },
  partial: { label: "Slow", color: "var(--warning)" },
  failed: { label: "Failed", color: "var(--destructive)" },
} satisfies ChartConfig

const ROWS_TONE: Record<RowSeries, string> = {
  succeeded: "bg-success",
  partial: "bg-warning",
  failed: "bg-destructive",
}

const ROWS_LEGEND = ROW_SERIES.map((key) => ({
  key,
  label: ROWS_CHART_CONFIG[key].label,
  tone: ROWS_TONE[key],
}))

type HourPoint = HourCell & {
  label: string
  succeeded: number
  partial: number
  failed: number
  /** The hour's failed runs; `failed` holds the stub's plotted height. */
  failedRuns: number
}

const isPoint = (value: unknown): value is HourPoint =>
  typeof value === "object" && value !== null && "failedRuns" in value

const RUN_GLYPH: Record<RunOutcome, { icon: ReactNode; tone: string }> = {
  succeeded: { icon: UI_ICONS.passed, tone: "text-success" },
  partial: { icon: UI_ICONS.alert, tone: "text-warning" },
  failed: { icon: UI_ICONS.failed, tone: "text-destructive" },
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

type Fact = { label: string; value: ReactNode }

function FactGroup({
  title,
  facts,
  action,
}: {
  title: string
  facts: Fact[]
  action?: ReactNode
}) {
  return (
    <Section title={title} action={action}>
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
        {facts.map((fact) => (
          <div key={fact.label} className="contents">
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 leading-5 tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground truncate">{children}</span>
}

/** The one thing to know first: an outage, a pause, a slow load or a token. */
function StateAlert({
  connection,
  onCredential,
  onResume,
}: {
  connection: Connection
  onCredential: (origin: HTMLElement) => void
  onResume: () => void
}) {
  const left = expiringIn(connection)
  if (connection.health === "failing") {
    return (
      <Alert variant="destructive">
        {UI_ICONS.failed}
        <AlertTitle>Authentication Failing</AlertTitle>
        <AlertAction>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={(event) => onCredential(event.currentTarget)}
          >
            Rotate Key
          </Button>
        </AlertAction>
        <AlertDescription>
          {connection.issue}
          {connection.failingSince
            ? `, since ${formatClock(connection.failingSince)} UTC.`
            : "."}{" "}
          Linked datasets hold their last good sync.
        </AlertDescription>
      </Alert>
    )
  }
  if (connection.paused) {
    const by = connection.pausedBy
      ? PERSON_BY_ID.get(connection.pausedBy)?.name
      : null
    return (
      <Alert variant="info">
        {UI_ICONS.pause}
        <AlertTitle>Syncs Paused</AlertTitle>
        <AlertAction>
          <Button type="button" size="xs" variant="outline" onClick={onResume}>
            Resume
          </Button>
        </AlertAction>
        <AlertDescription>
          {connection.pauseNote ? `${connection.pauseNote}. ` : ""}
          {by ? `Paused by ${by}` : "Paused"}
          {connection.pausedAt === undefined
            ? "."
            : ` ${formatRelative(connection.pausedAt)}.`}
        </AlertDescription>
      </Alert>
    )
  }
  if (connection.health === "degraded") {
    return (
      <Alert variant="warning">
        {UI_ICONS.clock}
        <AlertTitle>Running Slow</AlertTitle>
        <AlertDescription>
          {connection.issue}. Datasets stay current but land late.
        </AlertDescription>
      </Alert>
    )
  }
  if (left !== null) {
    return (
      <Alert variant="warning">
        {UI_ICONS.key}
        <AlertTitle>Token Expiring</AlertTitle>
        <AlertAction>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={(event) => onCredential(event.currentTarget)}
          >
            Renew
          </Button>
        </AlertAction>
        <AlertDescription>
          The {AUTH_KINDS[connection.credential.kind].label} grant lapses in{" "}
          {formatSpanDays(left)}, and syncs stop with it.
        </AlertDescription>
      </Alert>
    )
  }
  if (connection.health === "pending") {
    return (
      <Alert variant="info">
        {UI_ICONS.sync}
        <AlertTitle>First Sync</AlertTitle>
        <AlertDescription>
          Backfilling {plural(linkedOf(connection).length, "linked dataset")};
          history fills in as runs land.
        </AlertDescription>
      </Alert>
    )
  }
  return null
}

/** The read hour's outcome, rows and runs, docked beside its column. */
function RowsCard({
  points,
  active,
  payload,
}: { points: HourPoint[] } & Partial<
  Pick<TooltipContentProps, "active" | "payload">
>) {
  const point: unknown = payload?.[0]?.payload
  if (!active || !payload || !isPoint(point)) return null
  const end = point.start + HOUR_MS
  return (
    <DockedCard
      index={points.findIndex((item) => item.label === point.label)}
      count={points.length}
    >
      <ChartTooltipContent
        active
        // One readout per hour, not one row per stacked series.
        payload={payload.slice(0, 1)}
        hideLabel
        className="w-52"
        formatter={() => (
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-medium tabular-nums">
              {formatClock(point.start)} to{" "}
              {end > REFERENCE_MS ? "now" : formatClock(end)}
            </span>
            <span className="text-muted-foreground flex items-center justify-between gap-3">
              {OUTCOME_LABEL[point.outcome]}
              <span className="text-foreground font-mono tabular-nums">
                {point.outcome === "none" || point.outcome === "skipped"
                  ? "None"
                  : `${formatCompact(point.rows)} rows`}
              </span>
            </span>
            {point.runs > 0 ? (
              <span className="text-muted-foreground tabular-nums">
                {plural(point.runs, "run")}
                {point.failedRuns > 0 ? `, ${point.failedRuns} failed` : ""}
              </span>
            ) : null}
          </div>
        )}
      />
    </DockedCard>
  )
}

/** Rows per hour on the Sync Activity grammar: every hour keeps its track,
 *  so a quiet day still reads as 24 slots rather than an empty panel. */
function RowsChart({ hours }: { hours: HourCell[] }) {
  const peak = Math.max(1, ...hours.map((hour) => hour.rows))
  const points: HourPoint[] = hours.map((hour) => ({
    ...hour,
    label: formatClock(hour.start),
    succeeded: hour.outcome === "succeeded" ? hour.rows : 0,
    partial: hour.outcome === "partial" ? hour.rows : 0,
    // A failed hour moved nothing: a short stub keeps it visible.
    failed: hour.outcome === "failed" ? peak * 0.08 : 0,
    failedRuns: hour.failed,
  }))
  const ticks = points
    .filter((_, index) => index % 4 === 3)
    .map((point) => point.label)
  const now = points[points.length - 1]?.label
  return (
    <ChartContainer
      config={ROWS_CHART_CONFIG}
      className={cn(HOUR_CHART, "aspect-auto h-36 w-full min-w-0")}
      initialDimension={{ width: 560, height: 144 }}
    >
      <HourColumns stack={ROW_SERIES}>
        <BarChart
          data={points}
          accessibilityLayer
          barCategoryGap="20%"
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <HourHatches />
          <XAxis
            dataKey="label"
            ticks={ticks}
            tickFormatter={(label: string) => (label === now ? "Now" : label)}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            // The label band ends at the svg edge, so bottom ink matches the top.
            height={26}
          />
          <YAxis
            allowDecimals={false}
            tickCount={4}
            tickFormatter={(value: number) => formatCompact(value)}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            width="auto"
          />
          <ChartTooltip
            cursor={false}
            position={CARD_ORIGIN}
            isAnimationActive={false}
            content={<RowsCard points={points} />}
          />
          {ROW_SERIES.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="rows"
              fill={`var(--color-${key})`}
              maxBarSize={28}
              isAnimationActive={false}
              background={index === 0 ? HOUR_TRACK : undefined}
              shape={HOUR_SHAPES[key]}
            />
          ))}
        </BarChart>
      </HourColumns>
    </ChartContainer>
  )
}

function RunRow({ run }: { run: SyncRun }) {
  const glyph = RUN_GLYPH[run.outcome]
  const by = run.by ? PERSON_BY_ID.get(run.by) : null
  return (
    <li className="flex min-w-0 items-start gap-2.5 py-2">
      <span
        className={cn(
          "flex h-5 w-4 shrink-0 items-center justify-center [&_svg:not([class*=size-])]:size-4",
          glyph.tone
        )}
      >
        {glyph.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-medium tabular-nums">
            {formatClock(run.startedAt)}
          </span>
          <span className="text-muted-foreground truncate font-mono text-xs">
            {run.id}
          </span>
          {by ? (
            <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
              <OwnerAvatar ownerId={by.id} compact />
              <span className="truncate">Manual</span>
            </span>
          ) : null}
        </span>
        {run.message ? (
          <span
            className={cn(
              "text-xs text-pretty",
              run.outcome === "failed"
                ? "text-destructive"
                : "text-muted-foreground"
            )}
          >
            {run.message}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs tabular-nums">
        <span className="text-foreground font-medium">
          {run.outcome === "failed" ? "0" : formatCompact(run.rows)} rows
        </span>
        <span className="text-muted-foreground">
          {formatDuration(run.durationSec)}
        </span>
      </div>
    </li>
  )
}

export function ConnectionOverviewTab({
  connection,
  onCredential,
  onResume,
  onShowDatasets,
}: {
  connection: Connection
  onCredential: (origin: HTMLElement) => void
  onResume: () => void
  onShowDatasets: () => void
}) {
  const runs = connection.hours.reduce((sum, hour) => sum + hour.runs, 0)
  const synced = lastGoodSync(connection.runs)
  const next = nextSyncAt(connection)
  const linked = linkedOf(connection)
  const auth = AUTH_KINDS[connection.credential.kind]
  const rotatedBy =
    connection.credential.rotatedBy === "JOB-290"
      ? "JOB-290"
      : (PERSON_BY_ID.get(connection.credential.rotatedBy)?.name ?? "")

  return (
    <>
      <StateAlert
        connection={connection}
        onCredential={onCredential}
        onResume={onResume}
      />

      <Frame spacing="default" className="min-w-0">
        <HintHeader
          title="Last 24 Hours"
          hint={`${plural(runs, "run")}, ${formatCompact(rowsOf(connection))} rows synced`}
        >
          <HourLegend items={ROWS_LEGEND} />
        </HintHeader>
        <FramePanel>
          <RowsChart hours={connection.hours} />
        </FramePanel>
      </Frame>

      <FactGroup
        title="Sync"
        facts={[
          {
            label: "Frequency",
            value: FREQUENCIES[connection.frequency].label,
          },
          {
            label: "Last sync",
            value:
              synced === null ? (
                <Muted>Not yet</Muted>
              ) : (
                <>
                  <span className="shrink-0 whitespace-nowrap">
                    {formatRelative(synced)}
                  </span>
                  <Muted>{formatDateTime(synced)}</Muted>
                </>
              ),
          },
          {
            label: "Next sync",
            value: connection.paused ? (
              <Muted>Paused</Muted>
            ) : next === null ? (
              <Muted>Continuous stream</Muted>
            ) : (
              <>
                <span className="shrink-0 whitespace-nowrap">
                  {formatRelative(next)}
                </span>
                <Muted>{formatClock(next)} UTC</Muted>
              </>
            ),
          },
          {
            label: "Datasets",
            value: (
              <button
                type="button"
                onClick={onShowDatasets}
                className="hover:text-primary cursor-pointer underline-offset-2 hover:underline"
              >
                {linked.length} of {connection.datasets.length} linked
              </button>
            ),
          },
        ]}
      />

      <FactGroup
        title="Connection"
        facts={[
          {
            label: "Integration",
            value: (
              <IntegrationFace integration={connection.integration} detail />
            ),
          },
          {
            label: "Endpoint",
            value: (
              <span className="truncate font-mono text-xs">
                {connection.endpoint}
              </span>
            ),
          },
          {
            label: "Environment",
            value: <EnvironmentFace environment={connection.environment} />,
          },
          {
            label: "Signs in as",
            value: (
              <span className="truncate">
                {connection.credential.principal}
              </span>
            ),
          },
          {
            label: auth.label,
            value: (
              <>
                <span className="font-mono text-xs">
                  {connection.credential.hint}
                </span>
                <Muted>
                  {formatDay(connection.credential.rotatedAt)}
                  {rotatedBy ? ` by ${rotatedBy}` : ""}
                </Muted>
              </>
            ),
          },
        ]}
        action={
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={(event) => onCredential(event.currentTarget)}
          >
            {UI_ICONS.key}
            {auth.renewable ? "Renew" : "Rotate"}
          </Button>
        }
      />

      <Section title="Recent Runs">
        {connection.runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No runs yet; the first one starts on save.
          </p>
        ) : (
          <ul className="divide-border -my-2 flex flex-col divide-y">
            {connection.runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ul>
        )}
      </Section>

      <FactGroup
        title="Ownership"
        facts={[
          { label: "Owner", value: <OwnerFace ownerId={connection.ownerId} /> },
          {
            label: "Failure alerts",
            value: connection.alertOnFailure ? (
              <span>{ALERT_CHANNEL}</span>
            ) : (
              <Muted>Off</Muted>
            ),
          },
          { label: "Created", value: formatDay(connection.createdAt) },
        ]}
      />
    </>
  )
}