import { useEffect, useRef, type ReactNode } from "react"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  AUTH_KINDS,
  consumerLabel,
  expiringIn,
  formatClock,
  formatRelative,
  formatSpanDays,
  lastGoodSync,
  linkedOf,
  plural,
  type Connection,
  type SheetTab,
} from "./data"
import { TOAST_ERROR_ICON, TOAST_SUCCESS_ICON, UI_ICONS } from "./icons"
import { SectionHeader } from "./section-header"
import { IntegrationFace, IntegrationLogo, OwnerFace } from "./value-faces"

type Kind = "failing" | "degraded" | "expiring" | "drift" | "paused"

type Act = (origin: HTMLElement, fallback: () => HTMLElement | null) => void

type Issue = {
  key: string
  kind: Kind
  connection: Connection
  label: string
  variant: BadgeProps["variant"]
  /** The full story, revealed in the row's hover card. */
  detail: string
  since: string | null
  action: { label: string; icon: ReactNode; run: Act }
}

export type AttentionHandlers = {
  onOpenConnection: (id: string, tab: SheetTab, origin: HTMLElement) => void
  /** `fallback` names where focus goes if the fix removes the opener's row. */
  onRotate: (
    connection: Connection,
    origin: HTMLElement,
    fallback: () => HTMLElement | null
  ) => void
  onRenew: (id: string) => void
  onResume: (ids: string[]) => void
  onSync: (ids: string[]) => void
}

/** Everything a person has to act on, worst first: one row per problem. */
function issuesOf(connections: Connection[], handlers: AttentionHandlers) {
  const issues: Issue[] = []
  const live = connections.filter((connection) => !connection.paused)
  for (const connection of live) {
    if (connection.health !== "failing") continue
    issues.push({
      key: `${connection.id}-failing`,
      kind: "failing",
      connection,
      label: "Failing",
      variant: "destructive-light",
      detail: connection.issue ?? "The last runs failed.",
      since: connection.failingSince
        ? `Since ${formatClock(connection.failingSince)} UTC`
        : null,
      action: {
        label: "Rotate",
        icon: UI_ICONS.key,
        run: (origin, fallback) =>
          handlers.onRotate(connection, origin, fallback),
      },
    })
  }
  for (const connection of live) {
    if (connection.health !== "degraded") continue
    issues.push({
      key: `${connection.id}-degraded`,
      kind: "degraded",
      connection,
      label: "Degraded",
      variant: "warning-light",
      detail: connection.issue ?? "Runs land late.",
      since: null,
      action: {
        label: "Review",
        icon: UI_ICONS.view,
        run: (origin) =>
          handlers.onOpenConnection(connection.id, "overview", origin),
      },
    })
  }
  for (const connection of connections) {
    const left = expiringIn(connection)
    if (left === null) continue
    issues.push({
      key: `${connection.id}-expiring`,
      kind: "expiring",
      connection,
      label: "Token Expiring",
      variant: "warning-light",
      detail: `The ${AUTH_KINDS[connection.credential.kind].label} grant lapses in ${formatSpanDays(left)}, and syncs stop with it.`,
      since: null,
      action: {
        label: "Renew",
        icon: UI_ICONS.sync,
        run: () => handlers.onRenew(connection.id),
      },
    })
  }
  for (const connection of connections) {
    for (const dataset of connection.datasets) {
      if (!dataset.linked || dataset.drift.length === 0) continue
      issues.push({
        key: `${dataset.id}-drift`,
        kind: "drift",
        connection,
        label: "Schema Drift",
        variant: "warning-light",
        detail: `${dataset.name} gained ${dataset.drift.map((column) => column.name).join(" and ")} upstream.`,
        since: null,
        action: {
          label: "Review",
          icon: UI_ICONS.columns,
          run: (origin) =>
            handlers.onOpenConnection(connection.id, "datasets", origin),
        },
      })
    }
  }
  for (const connection of connections) {
    if (!connection.paused) continue
    issues.push({
      key: `${connection.id}-paused`,
      kind: "paused",
      connection,
      label: "Paused",
      variant: "outline",
      detail: connection.pauseNote
        ? `${connection.pauseNote}.`
        : "Syncs are on hold.",
      since:
        connection.pausedAt === undefined
          ? null
          : `Paused ${formatRelative(connection.pausedAt)}`,
      action: {
        label: "Resume",
        icon: UI_ICONS.resume,
        run: () => handlers.onResume([connection.id]),
      },
    })
  }
  return issues
}

function summaryOf(issues: Issue[]) {
  return issues
    .map((issue) => `${issue.label}: ${issue.connection.name}. ${issue.detail}`)
    .join("\n")
}

/** The row's detail on hover: the issue, then who owns it and what it feeds. */
function IssueCard({ issue }: { issue: Issue }) {
  const { connection } = issue
  const synced = lastGoodSync(connection.runs)
  const linked = linkedOf(connection)
  const consumers = [
    ...new Set(linked.flatMap((dataset) => dataset.consumers ?? [])),
  ]
  const rows: [string, ReactNode][] = [
    [
      "Integration",
      <IntegrationFace
        key="integration"
        integration={connection.integration}
      />,
    ],
    ["Owner", <OwnerFace key="owner" ownerId={connection.ownerId} compact />],
    ["Last good sync", synced === null ? "None yet" : formatRelative(synced)],
    ["Datasets", `${linked.length} of ${connection.datasets.length} linked`],
  ]
  if (consumers.length > 0)
    rows.push(["Read by", consumers.map(consumerLabel).join(", ")])
  return (
    <>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="min-w-0 truncate font-medium">{connection.name}</span>
        <Badge variant={issue.variant} className="shrink-0">
          {issue.label}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs text-pretty">
        {issue.since ? `${issue.since}: ` : ""}
        {issue.detail}
      </p>
      <Separator />
      <dl className="flex flex-col gap-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex min-w-0 items-center justify-between gap-3"
          >
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd className="flex min-w-0 justify-end truncate text-right tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}

export function AttentionList({
  connections,
  className,
  ...handlers
}: AttentionHandlers & { connections: Connection[]; className?: string }) {
  const issues = issuesOf(connections, handlers)
  // Action buttons by issue key: a fix removes its own row, so focus moves on.
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const menuRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<string | null>(null)

  /** The next surviving action, else the first, else the header menu. */
  const focusTarget = (key: string | null) =>
    (key ? buttons.current.get(key) : undefined) ??
    buttons.current.values().next().value ??
    menuRef.current

  useEffect(() => {
    const key = pendingFocus.current
    if (key === null) return
    pendingFocus.current = null
    focusTarget(key)?.focus({ preventScroll: true })
  })

  function neighbourOf(key: string) {
    const index = issues.findIndex((issue) => issue.key === key)
    return issues[index + 1]?.key ?? issues[index - 1]?.key ?? null
  }

  const idsOf = (kind: Kind) =>
    issues
      .filter((issue) => issue.kind === kind)
      .map((issue) => issue.connection.id)
  const pausedIds = idsOf("paused")
  const expiringIds = idsOf("expiring")
  const slowIds = idsOf("degraded")

  function copySummary() {
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
    navigator.clipboard.writeText(summaryOf(issues)).then(
      () =>
        toast.success("Summary copied", {
          icon: TOAST_SUCCESS_ICON,
          description: plural(issues.length, "item"),
        }),
      failed
    )
  }

  return (
    <Frame spacing="default" className={className}>
      <SectionHeader
        title="Needs Attention"
        description={
          issues.length > 0
            ? `${plural(issues.length, "item")}, worst first`
            : "Nothing waiting on you"
        }
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                ref={menuRef}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Attention actions"
              />
            }
          >
            {UI_ICONS.more}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Fix in bulk</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={pausedIds.length === 0}
                onClick={() => handlers.onResume(pausedIds)}
              >
                {UI_ICONS.resume}
                Resume Paused
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={expiringIds.length === 0}
                onClick={() => expiringIds.forEach(handlers.onRenew)}
              >
                {UI_ICONS.key}
                Renew Expiring Tokens
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={slowIds.length === 0}
                onClick={() => handlers.onSync(slowIds)}
              >
                {UI_ICONS.sync}
                Sync Degraded Now
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={issues.length === 0}
                onClick={copySummary}
              >
                {UI_ICONS.copy}
                Copy Summary
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SectionHeader>
      <FramePanel>
        {issues.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">{UI_ICONS.shield}</EmptyMedia>
              <EmptyTitle>All Clear</EmptyTitle>
              <EmptyDescription>
                Every connection is healthy and current.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-0">
            {issues.map((issue) => (
              // Rows sit on the panel's own inset: no second side padding.
              <Item key={issue.key} size="xs" className="px-0">
                <ItemMedia>
                  <IntegrationLogo
                    integration={issue.connection.integration}
                    size="xs"
                  />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="max-w-full min-w-0">
                    {/* Hover or focus reveals the detail; a click opens the connection. */}
                    <HoverCard>
                      <HoverCardTrigger
                        render={
                          <button
                            type="button"
                            onClick={(event) =>
                              handlers.onOpenConnection(
                                issue.connection.id,
                                "overview",
                                event.currentTarget
                              )
                            }
                            className="hover:text-primary focus-visible:outline-ring/50 min-w-0 cursor-pointer truncate text-left underline-offset-2 outline-offset-2 hover:underline focus-visible:outline-2"
                          />
                        }
                      >
                        {issue.connection.name}
                      </HoverCardTrigger>
                      <HoverCardContent
                        align="start"
                        className="flex w-80 flex-col gap-2.5"
                      >
                        <IssueCard issue={issue} />
                      </HoverCardContent>
                    </HoverCard>
                    <Badge variant={issue.variant} className="shrink-0">
                      {issue.label}
                    </Badge>
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          ref={(node) => {
                            if (node) buttons.current.set(issue.key, node)
                            else buttons.current.delete(issue.key)
                          }}
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label={`${issue.action.label} ${issue.connection.name}`}
                          onClick={(event) => {
                            const neighbour = neighbourOf(issue.key)
                            // Resume and Renew remove the row at once; Rotate waits on its dialog.
                            if (
                              issue.kind === "paused" ||
                              issue.kind === "expiring"
                            )
                              pendingFocus.current = neighbour
                            issue.action.run(event.currentTarget, () =>
                              focusTarget(neighbour)
                            )
                          }}
                        />
                      }
                    >
                      {issue.action.icon}
                    </TooltipTrigger>
                    <TooltipContent>{issue.action.label}</TooltipContent>
                  </Tooltip>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </FramePanel>
    </Frame>
  )
}