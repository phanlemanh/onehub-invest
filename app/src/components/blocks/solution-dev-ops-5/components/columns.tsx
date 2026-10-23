"use client"

// This file keeps "use no memo": its cell templates read state through builder
// calls on a stable row/column, which React Compiler cannot see.
"use no memo"

import { createContext, memo, useContext, type ReactNode } from "react"
import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import {
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table"
import { type ColumnDef } from "@tanstack/react-table"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { burnTone } from "./burn-gauge"
import {
  formatAttainment,
  formatBurn,
  formatDay,
  formatObjective,
  formatShare,
  PERSON_BY_ID,
  SLI_KINDS,
  type SheetTab,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import { BeadSpark, budgetColor, HLollipop } from "./lollipop"
import {
  derive,
  HISTORY_DAYS,
  rollingRemainingAt,
  WARN_REMAINING,
} from "./slo-math"
import {
  budgetPhrase,
  budgetText,
  DotSeparator,
  OwnerFace,
  StatusFace,
  TextLink,
} from "./value-faces"

export type SloRowAction =
  | "view"
  | "edit"
  | "focus"
  | "mute"
  | "unmute"
  | "duplicate"
  | "yaml"
  | "delete"

export type SloColumnHandlers = {
  onOpen: (id: string, tab: SheetTab) => void
  onToggleAlerts: (id: string, alerting: boolean) => void
  onAction: (action: SloRowAction, slo: Slo) => void
}

/** The open sheet's SLO id: its name cell tints the row and sets aria-current. */
export const ActiveSloContext = createContext<string | null>(null)

/** Focus ring for hover-card triggers: hover reveals detail, a click opens. */
const HOVER_TARGET =
  "focus-visible:outline-ring/50 cursor-pointer outline-offset-2 focus-visible:outline-2"

/** A change in budget left as signed whole points: "+3", "-12". */
function formatPoints(delta: number) {
  const points = Math.round(delta * 100)
  return points > 0 ? `+${points}` : `${points}`
}

const TREND_DAYS = 28

type Trend = {
  values: number[]
  low: number
  lowDay: number
  weekAgo: number
  now: number
  delta: number
}

// Records are immutable, so the sort accessor and the cell share one pass.
const trendCache = new WeakMap<Slo, Trend>()

/** Budget left on each of the last 28 days, oldest first. */
function trendOf(slo: Slo): Trend {
  const cached = trendCache.get(slo)
  if (cached) return cached
  const from = HISTORY_DAYS - TREND_DAYS
  const values = Array.from({ length: TREND_DAYS }, (_, step) =>
    rollingRemainingAt(slo, from + step)
  )
  const lowStep = values.reduce(
    (best, value, step) => (value < values[best] ? step : best),
    0
  )
  const now = values[TREND_DAYS - 1]
  const weekAgo = values[TREND_DAYS - 8]
  const trend = {
    values,
    low: values[lowStep],
    lowDay: slo.days[from + lowStep].start,
    weekAgo,
    now,
    delta: now - weekAgo,
  }
  trendCache.set(slo, trend)
  return trend
}

// ── Hover card parts: head, rule, quiet rows ──

function PeekHead({
  title,
  value,
  className,
}: {
  title: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate font-medium">{title}</span>
      <span
        className={cn(
          "shrink-0 font-semibold whitespace-nowrap tabular-nums",
          className
        )}
      >
        {value}
      </span>
    </div>
  )
}

function PeekRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col gap-1.5 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground shrink-0">{label}</dt>
          <dd className="flex min-w-0 justify-end text-right tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

// ── Cells ──

function NameCell({
  slo,
  onOpen,
}: {
  slo: Slo
  onOpen: SloColumnHandlers["onOpen"]
}) {
  const active = useContext(ActiveSloContext) === slo.id
  return (
    <div
      data-active-row={active ? "" : undefined}
      className="flex min-w-0 flex-col gap-0.5"
    >
      <TextLink
        aria-label={`Open ${slo.name}`}
        aria-current={active ? "true" : undefined}
        onClick={(event) => {
          event.stopPropagation()
          onOpen(slo.id, "overview")
        }}
        className="max-w-full self-start"
      >
        {slo.name}
      </TextLink>
      <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
        <span className="truncate">{slo.service}</span>
        <DotSeparator />
        <span className="shrink-0">{SLI_KINDS[slo.sli].label}</span>
      </span>
    </div>
  )
}

function ObjectiveCell({ slo }: { slo: Slo }) {
  return (
    <span className="flex items-baseline gap-1.5">
      {/* Fits "99.99%", so the window labels line up down the column. */}
      <span className="min-w-13 text-sm font-medium tabular-nums">
        {formatObjective(slo.objective)}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {slo.windowDays}d
      </span>
    </span>
  )
}

function AttainmentCell({ slo }: { slo: Slo }) {
  const { stats } = derive(slo)
  const margin = (stats.attainment - slo.objective) * 100
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm tabular-nums">
        {formatAttainment(stats.attainment)}
      </span>
      <span
        className={cn(
          "truncate text-xs tabular-nums",
          margin < 0 ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {margin >= 0 ? "+" : ""}
        {margin.toFixed(3)} pts
      </span>
    </div>
  )
}

/** Budget left mapped onto a -50% to 100% track, so zero sits a third in. */
const budgetPin = (value: number) =>
  (Math.min(Math.max(value, -0.5), 1) + 0.5) / 1.5

/** A pin from zero: budget left runs right, overspend runs left of the tick. */
function BudgetCell({ slo }: { slo: Slo }) {
  const { stats } = derive(slo)
  const over = stats.remaining <= 0
  // A head on the warn tick hides it, so the tick drops out (80px track).
  const warnClear =
    Math.abs(budgetPin(stats.remaining) - budgetPin(WARN_REMAINING)) * 80 >= 7
  return (
    <div className="flex items-center gap-3">
      <HLollipop
        position={budgetPin(stats.remaining)}
        base={budgetPin(0)}
        color={budgetColor(stats.remaining)}
        head={4}
        rail
        guides={[
          {
            at: budgetPin(0),
            color: "var(--foreground)",
            opacity: 0.3,
            height: 10,
          },
          ...(warnClear
            ? [
                {
                  at: budgetPin(WARN_REMAINING),
                  color: "var(--warning)",
                  height: 6,
                },
              ]
            : []),
        ]}
        className="h-4 w-20 shrink-0"
      />
      <span className="flex items-baseline gap-1 tabular-nums">
        <span
          className={cn("text-sm font-medium", budgetText(stats.remaining))}
        >
          {formatShare(Math.abs(stats.remaining))}
        </span>
        <span className="text-muted-foreground text-xs">
          {over ? "over" : "left"}
        </span>
      </span>
    </div>
  )
}

/** Budget left over 28 days as beads fading with age; today is the lollipop. */
function TrendCell({
  slo,
  onOpen,
}: {
  slo: Slo
  onOpen: SloColumnHandlers["onOpen"]
}) {
  const { values, low, lowDay, weekAgo, now, delta } = trendOf(slo)
  const from = HISTORY_DAYS - TREND_DAYS
  const events = slo.events.filter(
    (event) => event.startedAt >= slo.days[from].start && !event.excluded
  ).length

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={`Rolling budget ${budgetPhrase(now)}, ${formatPoints(delta)} pts over 7 days`}
            className={cn("flex", HOVER_TARGET)}
            onClick={(event) => {
              event.stopPropagation()
              onOpen(slo.id, "overview")
            }}
          />
        }
      >
        <span aria-hidden="true" className="flex h-7 w-24">
          <BeadSpark
            values={values}
            domain={[-0.5, 1]}
            color={budgetColor(now)}
          />
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="flex flex-col gap-2.5">
        <PeekHead
          title="Rolling Budget"
          value={formatShare(now)}
          className={budgetText(now)}
        />
        <Separator />
        <PeekRows
          rows={[
            ["7 days ago", formatShare(weekAgo)],
            ["Lowest", `${formatShare(low)} on ${formatDay(lowDay)}`],
            ["Counted events", events],
          ]}
        />
      </HoverCardContent>
    </HoverCard>
  )
}

function BurnCell({
  slo,
  onOpen,
}: {
  slo: Slo
  onOpen: SloColumnHandlers["onOpen"]
}) {
  const { rates, rules } = derive(slo)
  const burn = rates["1h"]
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={`${slo.name} burn rate ${formatBurn(burn)}, open burn rate`}
            className={cn("flex min-w-0 text-left", HOVER_TARGET)}
            onClick={(event) => {
              event.stopPropagation()
              onOpen(slo.id, "burn")
            }}
          />
        }
      >
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            burnTone(burn, "1h").text
          )}
        >
          {formatBurn(burn)}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="flex w-64 flex-col gap-2.5">
        <PeekHead
          title="Burn Alerts"
          value={formatBurn(burn)}
          className={burnTone(burn, "1h").text}
        />
        <Separator />
        <PeekRows
          rows={rules.map((state) => [
            state.rule.label,
            <span key={state.rule.id} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                {state.rule.long} {formatBurn(state.long)}
              </span>
              <span
                className={cn(
                  "font-medium",
                  state.breached ? "text-destructive" : "text-foreground"
                )}
              >
                {state.breached ? "Over" : "Under"} {state.rule.factor}×
              </span>
            </span>,
          ])}
        />
      </HoverCardContent>
    </HoverCard>
  )
}

const AlertsCell = memo(function AlertsCell({
  slo,
  onToggle,
}: {
  slo: Slo
  onToggle: SloColumnHandlers["onToggleAlerts"]
}) {
  return (
    // The wrapper, not the Switch, stops the click: Base UI re-dispatches it
    // on a hidden input that would otherwise reach the row and open the sheet.
    <div
      className="flex items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <Switch
        size="sm"
        checked={slo.alerting}
        onCheckedChange={(checked) => onToggle(slo.id, checked)}
        aria-label={`Burn alerts for ${slo.name}`}
      />
    </div>
  )
})

function ActionsCell({
  slo,
  onAction,
  triggerRef,
}: {
  slo: Slo
  onAction: SloColumnHandlers["onAction"]
  triggerRef: (node: HTMLButtonElement | null) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={triggerRef}
            size="icon-xs"
            variant="ghost"
            aria-label={`Actions for ${slo.name}`}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        {UI_ICONS.more}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAction("view", slo)}>
            {UI_ICONS.view}
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("edit", slo)}>
            {UI_ICONS.edit}
            Edit SLO
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("focus", slo)}>
            {UI_ICONS.budget}
            Show in Chart
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {slo.alerting ? (
            <DropdownMenuItem onClick={() => onAction("mute", slo)}>
              {UI_ICONS.mute}
              Mute Alerts
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onAction("unmute", slo)}>
              {UI_ICONS.bell}
              Unmute Alerts
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onAction("duplicate", slo)}>
            {UI_ICONS.copy}
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("yaml", slo)}>
            {UI_ICONS.yaml}
            Copy as OpenSLO
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onAction("delete", slo)}
          >
            {UI_ICONS.trash}
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The frame band's inset plus the checkbox and a gap, in every style. */
const SELECT_WIDTH = "w-[calc(var(--frame-panel-header-px)+--spacing(6))]!"

// ── Column factory ──

export function createSloColumns(
  handlers: SloColumnHandlers,
  registerTrigger: (id: string) => (node: HTMLButtonElement | null) => void
): ColumnDef<DataGridFeatures, Slo>[] {
  const { onOpen, onToggleAlerts, onAction } = handlers
  return [
    {
      id: "select",
      header: () => <DataGridTableRowSelectAll />,
      // Same hidden-input bubbling as the Switch: keep the click off the row.
      cell: ({ row }) => (
        <div className="flex" onClick={(event) => event.stopPropagation()}>
          <DataGridTableRowSelect row={row} />
        </div>
      ),
      // The width tracks --frame-panel-header-px, the edge cell's inset; the
      // classes need ! to beat the grid's inline width. 40 is nova's.
      size: 40,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      meta: {
        headerClassName: SELECT_WIDTH,
        cellClassName: SELECT_WIDTH,
      },
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <NameCell slo={row.original} onOpen={onOpen} />,
      size: 260,
      enableHiding: false,
      meta: { headerTitle: "SLO" },
    },
    {
      id: "status",
      accessorFn: (slo) => derive(slo).status,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => (
        <span className="flex">
          <StatusFace status={derive(row.original).status} />
        </span>
      ),
      size: 112,
      meta: { headerTitle: "Status" },
    },
    {
      id: "objective",
      accessorKey: "objective",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <ObjectiveCell slo={row.original} />,
      size: 104,
      meta: { headerTitle: "Target" },
    },
    {
      id: "attainment",
      accessorFn: (slo) => derive(slo).stats.attainment - slo.objective,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <AttainmentCell slo={row.original} />,
      size: 120,
      meta: { headerTitle: "Attainment" },
    },
    {
      id: "budget",
      accessorFn: (slo) => derive(slo).stats.remaining,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <BudgetCell slo={row.original} />,
      size: 168,
      meta: { headerTitle: "Budget" },
    },
    {
      id: "trend",
      accessorFn: (slo) => trendOf(slo).delta,
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <TrendCell slo={row.original} onOpen={onOpen} />,
      size: 120,
      meta: { headerTitle: "Trend" },
    },
    {
      id: "burn",
      accessorFn: (slo) => derive(slo).rates["1h"],
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => <BurnCell slo={row.original} onOpen={onOpen} />,
      size: 96,
      meta: { headerTitle: "Burn 1h" },
    },
    {
      id: "owner",
      accessorFn: (slo) => PERSON_BY_ID.get(slo.ownerId)?.name ?? "",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => (
        <span className="flex min-w-0">
          <OwnerFace ownerId={row.original.ownerId} />
        </span>
      ),
      size: 168,
      meta: { headerTitle: "Owner" },
    },
    {
      id: "alerts",
      accessorKey: "alerting",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} visibility />
      ),
      cell: ({ row }) => (
        <AlertsCell slo={row.original} onToggle={onToggleAlerts} />
      ),
      size: 72,
      enableSorting: false,
      meta: { headerTitle: "Alerts" },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ActionsCell
          slo={row.original}
          onAction={onAction}
          triggerRef={registerTrigger(row.original.id)}
        />
      ),
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
    },
  ]
}