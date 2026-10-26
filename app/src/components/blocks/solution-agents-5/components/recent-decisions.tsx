import { Badge } from "@/components/reui/badge"
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RECENT_DECISIONS, type IDecisionEvent } from "./data"
import { CheckIcon, XIcon } from "lucide-react"

function OutcomeIcon({ outcome }: { outcome: IDecisionEvent["outcome"] }) {
  return outcome === "approved" ? (
    <CheckIcon className="size-3" aria-hidden="true" />
  ) : (
    <XIcon className="size-3" aria-hidden="true" />
  )
}

export function RecentDecisions({ className }: { className?: string }) {
  return (
    <Card className={cn("gap-0 p-0", className)}>
      <CardHeader className="gap-1 border-b px-5 py-4">
        <CardTitle>Recent Decisions</CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-5">
        <Timeline>
          {RECENT_DECISIONS.map((event, index) => (
            <TimelineItem
              key={event.id}
              step={index + 1}
              className={cn(
                "ms-8",
                index === RECENT_DECISIONS.length - 1 ? "pb-0" : "pb-8"
              )}
            >
              <TimelineHeader>
                <TimelineSeparator className="bg-border group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.25rem-0.5rem)] group-data-[orientation=vertical]/timeline:translate-y-5" />
                <div className="flex flex-wrap items-center gap-2">
                  <TimelineTitle className="text-sm font-semibold">
                    <a
                      href="#"
                      aria-label={`Open decision ${event.id}`}
                      className="text-muted-foreground hover:text-primary me-1.5 font-medium tabular-nums underline-offset-2 transition-colors hover:underline"
                    >
                      {event.id}
                    </a>
                    <span>{event.title}</span>
                  </TimelineTitle>
                  <Badge
                    variant={
                      event.outcome === "approved"
                        ? "success-light"
                        : "destructive-light"
                    }
                  >
                    {event.outcome === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                </div>
                <TimelineIndicator
                  className={cn(
                    "flex size-5 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-6",
                    event.outcome === "approved"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <OutcomeIcon outcome={event.outcome} />
                </TimelineIndicator>
              </TimelineHeader>
              <TimelineContent className="mt-1.5">
                <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                  <Avatar className="size-5 shrink-0">
                    {event.reviewer.avatarUrl ? (
                      <AvatarImage src={event.reviewer.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="text-[9px]">
                      {event.reviewer.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground font-medium">
                    {event.reviewer.name}
                  </span>
                  <span
                    className="bg-input size-1 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="truncate">{event.elapsed}</span>
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}