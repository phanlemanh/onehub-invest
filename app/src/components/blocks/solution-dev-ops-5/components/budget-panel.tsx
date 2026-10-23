import { Badge } from "@/components/reui/badge"
import { FramePanel } from "@/components/reui/frame"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { BudgetBurnChart } from "./budget-burn-chart"
import { formatObjective, SLO_STATUS, type SheetTab, type Slo } from "./data"
import { UI_ICONS } from "./icons"
import { SectionFrame, SectionHead } from "./section-lead"
import { derive } from "./slo-math"
import { StatusFace } from "./value-faces"

/** The hero: one SLO's burn-down, picked here or from anywhere on the page. */
export function BudgetPanel({
  slos,
  slo,
  onFocusChange,
  onOpenSlo,
  className,
}: {
  /** Triage order: the picker lists the worst first. */
  slos: Slo[]
  /** null when no SLO is in scope. */
  slo: Slo | null
  onFocusChange: (id: string) => void
  onOpenSlo: (id: string, tab: SheetTab, origin: HTMLElement) => void
  className?: string
}) {
  const items = slos.map((item) => ({ value: item.id, label: item.name }))

  if (!slo) {
    return (
      <SectionFrame className={className}>
        <SectionHead
          icon={UI_ICONS.budget}
          title="Error Budget"
          description="No SLOs in scope"
        />
        <FramePanel className="flex items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">{UI_ICONS.budget}</EmptyMedia>
              <EmptyTitle>No SLO Selected</EmptyTitle>
              <EmptyDescription>
                Pick another team or create an SLO.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </FramePanel>
      </SectionFrame>
    )
  }

  const { status, stats } = derive(slo)

  return (
    <SectionFrame className={className}>
      {/* State rides the band, so the panel holds only marks and numbers. */}
      <SectionHead
        icon={UI_ICONS.budget}
        title="Error Budget"
        badges={
          <>
            <StatusFace status={status} />
            {stats.remaining <= 0 ? (
              <Badge variant="outline">
                {UI_ICONS.freeze}
                Deploys Frozen
              </Badge>
            ) : null}
          </>
        }
        description={
          <span className="tabular-nums">
            {formatObjective(slo.objective)} over {slo.windowDays} days
          </span>
        }
      >
        <Select
          value={slo.id}
          items={items}
          onValueChange={(next) => {
            if (typeof next === "string") onFocusChange(next)
          }}
        >
          <SelectTrigger
            size="sm"
            className="min-w-0 max-sm:flex-1 sm:w-56"
            aria-label="SLO"
          >
            <SelectValue>
              {(value: string | null) => {
                const picked = slos.find((item) => item.id === value) ?? slo
                return (
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        SLO_STATUS[derive(picked).status].tick
                      )}
                    />
                    <span className="truncate">{picked.name}</span>
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            <SelectGroup>
              {slos.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      SLO_STATUS[derive(item).status].tick
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="sr-only">
                    , {SLO_STATUS[derive(item).status].label}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Open ${slo.name}`}
                onClick={(event) =>
                  onOpenSlo(slo.id, "overview", event.currentTarget)
                }
              />
            }
          >
            {UI_ICONS.open}
          </TooltipTrigger>
          <TooltipContent>Open SLO</TooltipContent>
        </Tooltip>
      </SectionHead>
      <BudgetBurnChart
        variant="hero"
        key={slo.id}
        slo={slo}
        onOpenEvents={(origin) => onOpenSlo(slo.id, "events", origin)}
      />
    </SectionFrame>
  )
}