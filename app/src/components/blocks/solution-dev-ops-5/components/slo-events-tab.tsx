import { cn } from "cn"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"

import {
  formatDateTime,
  formatShare,
  formatSpan,
  PERSON_BY_ID,
  type BudgetEvent,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import { eventShareOf, inWindow, isOngoing, REFERENCE_MS } from "./slo-math"
import { DotSeparator, EventKindFace } from "./value-faces"

function durationOf(event: BudgetEvent) {
  return isOngoing(event)
    ? `Open ${formatSpan((REFERENCE_MS - event.startedAt) / 60_000)}`
    : formatSpan(event.durationMin ?? 0)
}

/** Every event that spent budget, newest first. The switch counts an event
 *  toward the budget or sets it aside, and the whole page recomputes. */
export function SloEventsTab({
  slo,
  onExcludeToggle,
}: {
  slo: Slo
  onExcludeToggle: (sloId: string, eventId: string, excluded: boolean) => void
}) {
  if (slo.events.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">{UI_ICONS.incident}</EmptyMedia>
          <EmptyTitle>No Budget Events</EmptyTitle>
          <EmptyDescription>
            Only the background error rate has spent this budget.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroup className="gap-2">
        {slo.events.map((event) => {
          const share = eventShareOf(slo, event)
          const current = inWindow(slo, event)
          const by = event.excludedBy
            ? PERSON_BY_ID.get(event.excludedBy)?.name
            : undefined
          const switchId = `devops-5-event-${slo.id}-${event.id}`
          return (
            <Item key={event.id} size="sm" variant="outline">
              <ItemContent
                className={cn("min-w-0 gap-1", event.excluded && "opacity-60")}
              >
                <ItemTitle className="max-w-full min-w-0">
                  <span className="min-w-0 truncate">{event.title}</span>
                  <EventKindFace kind={event.kind} />
                </ItemTitle>
                <ItemDescription className="line-clamp-1">
                  {event.summary}
                </ItemDescription>
                <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs tabular-nums">
                  <span className="shrink-0 font-mono">{event.id}</span>
                  <DotSeparator />
                  <span className="truncate">
                    {formatDateTime(event.startedAt)}
                  </span>
                  <DotSeparator className="max-sm:hidden" />
                  <span className="shrink-0 max-sm:hidden">
                    {durationOf(event)}
                  </span>
                </span>
              </ItemContent>
              <ItemActions className="flex-col items-end gap-1.5 self-start">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    event.excluded || !current
                      ? "text-muted-foreground line-through decoration-1"
                      : share >= 0.25
                        ? "text-destructive"
                        : "text-foreground"
                  )}
                >
                  {formatShare(share)}
                </span>
                <span className="flex items-center gap-1.5">
                  <label
                    htmlFor={switchId}
                    className="text-muted-foreground text-xs"
                  >
                    {event.excluded
                      ? by
                        ? `Excluded by ${by.split(" ")[0]}`
                        : "Excluded"
                      : "Counts"}
                  </label>
                  <Switch
                    id={switchId}
                    size="sm"
                    checked={!event.excluded}
                    disabled={!current}
                    onCheckedChange={(checked) =>
                      onExcludeToggle(slo.id, event.id, !checked)
                    }
                    aria-label={`Count ${event.title} toward the budget`}
                  />
                </span>
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
      <p className="text-muted-foreground text-xs text-pretty">
        Exclude planned work or upstream outages your budget policy allows.
        Events from before the window no longer count.
      </p>
    </div>
  )
}