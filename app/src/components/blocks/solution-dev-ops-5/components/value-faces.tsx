import { type ComponentProps, type ReactNode } from "react"
import { Badge } from "@/components/reui/badge"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  ALERT_LEVELS,
  EVENT_KINDS,
  formatShare,
  PERSON_BY_ID,
  SERVICES,
  SLI_KINDS,
  SLO_STATUS,
  type AlertLevel,
  type EventKind,
  type PersonId,
  type ServiceId,
  type SliKind,
  type SloStatus,
} from "./data"
import { UI_ICONS } from "./icons"
import { WARN_REMAINING } from "./slo-math"

/** Warning text: the --warning token is too light to read as text on white. */
export const WARNING_TEXT = "text-warning-foreground dark:text-warning"

/** Budget numbers are never green; red from 0, where the status turns exhausted. */
export const budgetText = (remaining: number) =>
  remaining <= 0
    ? "text-destructive"
    : remaining < WARN_REMAINING
      ? WARNING_TEXT
      : "text-foreground"

/** Budget left as words: "59% left", "42% over budget". */
export const budgetPhrase = (remaining: number) =>
  remaining > 0
    ? `${formatShare(remaining)} left`
    : `${formatShare(-remaining)} over budget`

export function DotSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-muted-foreground/40 size-1 shrink-0 rounded-full",
        className
      )}
    />
  )
}

/** A name that opens something: the block's one text-link face. */
export function TextLink({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        "text-foreground hover:text-primary min-w-0 cursor-pointer truncate text-left font-medium underline-offset-2 transition-colors hover:underline",
        className
      )}
    />
  )
}

export function StatusFace({ status }: { status: SloStatus }) {
  return (
    <Badge variant={SLO_STATUS[status].variant}>
      {SLO_STATUS[status].label}
    </Badge>
  )
}

/** Who gets told: a page, a ticket, or nobody while alerts are muted. */
export function AlertFace({
  level,
  muted = false,
}: {
  level: AlertLevel
  muted?: boolean
}) {
  if (muted) {
    return (
      <Badge variant="outline">
        {UI_ICONS.mute}
        Muted
      </Badge>
    )
  }
  return (
    <Badge variant={ALERT_LEVELS[level].variant}>
      {ALERT_LEVELS[level].label}
    </Badge>
  )
}

/** Icon scales with its host text: size-4 beside text-sm, size-3.5 in xs rows. */
export function SliFace({
  sli,
  compact = false,
}: {
  sli: SliKind
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center",
        compact
          ? "gap-1.5 [&_svg:not([class*=size-])]:size-3.5"
          : "gap-2 [&_svg:not([class*=size-])]:size-4"
      )}
    >
      <span className="text-muted-foreground flex shrink-0">
        {SLI_KINDS[sli].icon}
      </span>
      <span className="truncate">{SLI_KINDS[sli].label}</span>
    </span>
  )
}

export function ServiceFace({
  service,
  compact = false,
}: {
  service: ServiceId
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center",
        compact
          ? "gap-1.5 [&_svg:not([class*=size-])]:size-3.5"
          : "gap-2 [&_svg:not([class*=size-])]:size-4"
      )}
    >
      <span className="text-muted-foreground flex shrink-0">
        {SERVICES[service].icon}
      </span>
      <span className="truncate">{SERVICES[service].label}</span>
    </span>
  )
}

/** A dot in the kind's tone, then its name: the same on the chart legend. */
export function EventKindFace({ kind }: { kind: EventKind }) {
  return (
    <Badge variant="outline">
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", EVENT_KINDS[kind].dot)}
      />
      {EVENT_KINDS[kind].label}
    </Badge>
  )
}

/** The face sits at text height: size-5 beside text-sm, size-4 in xs rows. */
export function OwnerAvatar({
  ownerId,
  compact = false,
}: {
  ownerId: PersonId
  compact?: boolean
}) {
  const owner = PERSON_BY_ID.get(ownerId)
  if (!owner) return null
  return (
    <Avatar size="sm" className={compact ? "size-4" : "size-5"}>
      <AvatarImage src={owner.avatar} alt="" />
      <AvatarFallback className={compact ? "text-[8px]" : "text-[9px]"}>
        {owner.initials}
      </AvatarFallback>
    </Avatar>
  )
}

export function OwnerFace({
  ownerId,
  compact = false,
}: {
  ownerId: PersonId
  compact?: boolean
}) {
  const owner = PERSON_BY_ID.get(ownerId)
  if (!owner) return <span className="text-muted-foreground">Unassigned</span>
  return (
    <span
      className={cn("flex min-w-0 items-center", compact ? "gap-1.5" : "gap-2")}
    >
      <OwnerAvatar ownerId={ownerId} compact={compact} />
      <span className="truncate">{owner.name}</span>
    </span>
  )
}

/** A filter value: the first pick's face, then an outline count for the rest. */
export function FirstFacePlus({
  values,
  face,
  empty,
}: {
  values: string[]
  face: (value: string) => ReactNode
  empty: string
}) {
  if (values.length === 0) return <>{empty}</>
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="flex min-w-0">{face(values[0])}</span>
      {values.length > 1 ? (
        <Badge variant="outline" className="shrink-0 tabular-nums">
          +{values.length - 1}
        </Badge>
      ) : null}
    </span>
  )
}