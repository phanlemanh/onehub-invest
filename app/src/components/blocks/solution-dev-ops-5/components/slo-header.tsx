import { Badge } from "@/components/reui/badge"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TEAM_SCOPE_OPTIONS, type TeamScope } from "./data"
import { UI_ICONS } from "./icons"

export function SloHeader({
  exhaustedCount,
  subtitle,
  scope,
  onScopeChange,
  onNewSlo,
}: {
  exhaustedCount: number
  subtitle: string
  scope: TeamScope
  onScopeChange: (scope: TeamScope) => void
  onNewSlo: (origin: HTMLElement) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-foreground text-lg leading-tight font-semibold tracking-tight">
            Service Levels
          </h2>
          {exhaustedCount > 0 ? (
            <Badge variant="destructive-light" className="tabular-nums">
              {exhaustedCount} exhausted
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Select
          value={scope}
          items={TEAM_SCOPE_OPTIONS}
          onValueChange={(next) => {
            const match = TEAM_SCOPE_OPTIONS.find(
              (option) => option.value === next
            )
            if (match) onScopeChange(match.value)
          }}
        >
          <SelectTrigger className="w-36" aria-label="Team">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            <SelectGroup>
              {TEAM_SCOPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={(event) => onNewSlo(event.currentTarget)}
        >
          {UI_ICONS.plus}
          New SLO
        </Button>
      </div>
    </div>
  )
}