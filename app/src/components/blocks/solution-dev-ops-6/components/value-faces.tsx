import { type ComponentProps, type ReactNode } from "react"
import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"

import {
  COLUMN_TYPES,
  CONNECTION_STATUS,
  ENVIRONMENTS,
  INTEGRATIONS,
  PERSON_BY_ID,
  type ColumnType,
  type ConnectionStatus,
  type Environment,
  type IntegrationId,
  type PersonId,
} from "./data"

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

export function StatusFace({ status }: { status: ConnectionStatus }) {
  const config = CONNECTION_STATUS[status]
  return (
    <Badge variant={config.variant}>
      {/* Decorative: the badge text already says Syncing. */}
      {status === "syncing" ? (
        <Spinner
          role="presentation"
          aria-label={undefined}
          aria-hidden="true"
        />
      ) : null}
      {config.label}
    </Badge>
  )
}

export function EnvironmentFace({ environment }: { environment: Environment }) {
  return <Badge variant="outline">{ENVIRONMENTS[environment].label}</Badge>
}

/** The integration's mark in an outline tile; the tile sizes the logo. */
export function IntegrationLogo({
  integration,
  size = "default",
  className,
}: {
  integration: IntegrationId
  size?: "xs" | "sm" | "default"
  className?: string
}) {
  return (
    <IconTile
      variant="outline"
      size={size}
      aria-hidden="true"
      className={className}
    >
      {INTEGRATIONS[integration].logo}
    </IconTile>
  )
}

export function IntegrationFace({
  integration,
  detail = false,
}: {
  integration: IntegrationId
  /** Adds the engine: "Neon Postgres". */
  detail?: boolean
}) {
  const config = INTEGRATIONS[integration]
  return (
    <span className="flex min-w-0 items-center gap-2">
      <IntegrationLogo integration={integration} size="xs" />
      <span className="truncate">{config.label}</span>
      {detail ? (
        <span className="text-muted-foreground truncate">{config.engine}</span>
      ) : null}
    </span>
  )
}

/** A column's type glyph; the label rides along in the schema view only. */
export function ColumnTypeGlyph({
  type,
  className,
}: {
  type: ColumnType
  className?: string
}) {
  return (
    <span
      title={COLUMN_TYPES[type].label}
      className={cn(
        "text-muted-foreground flex shrink-0 [&_svg:not([class*=size-])]:size-3.5",
        className
      )}
    >
      {COLUMN_TYPES[type].icon}
    </span>
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