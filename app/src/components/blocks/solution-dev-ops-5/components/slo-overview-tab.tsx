import { type ReactNode } from "react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"

import { Button } from "@/components/ui/button"

import { BudgetBurnChart } from "./budget-burn-chart"
import {
  ALERT_CHANNEL,
  formatAttainment,
  formatCount,
  formatDay,
  formatDaysLeft,
  formatObjective,
  formatRelative,
  formatShare,
  formatSpan,
  PERSON_BY_ID,
  SLI_KINDS,
  thresholdLabel,
  type Slo,
} from "./data"
import { UI_ICONS } from "./icons"
import { SectionFrame, SectionHead } from "./section-lead"
import { derive } from "./slo-math"
import { OwnerFace, ServiceFace, SliFace } from "./value-faces"

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
      {children}
    </section>
  )
}

type Fact = { label: string; value: ReactNode }

function FactGroup({ title, facts }: { title: string; facts: Fact[] }) {
  return (
    <Section title={title}>
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
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

/** The error budget policy in force: a freeze, a live alert, or a mute. */
function PolicyAlert({
  slo,
  onShowBurn,
}: {
  slo: Slo
  onShowBurn: () => void
}) {
  const { stats, breach, rates } = derive(slo)
  if (stats.remaining <= 0) {
    return (
      <Alert variant="destructive">
        {UI_ICONS.freeze}
        <AlertTitle>Deploy Freeze</AlertTitle>
        <AlertDescription>
          The budget is {formatShare(-stats.remaining)} over. Releases to{" "}
          {slo.service} need SRE approval until it recovers.
        </AlertDescription>
      </Alert>
    )
  }
  if (breach) {
    return (
      <Alert variant={breach === "page" ? "destructive" : "warning"}>
        {UI_ICONS.flame}
        <AlertTitle>{breach === "page" ? "Fast Burn" : "Slow Burn"}</AlertTitle>
        <AlertAction>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={onShowBurn}
          >
            View Burn
          </Button>
        </AlertAction>
        <AlertDescription>
          {slo.alerting
            ? `${breach === "page" ? "Paging" : "Ticketing"} ${ALERT_CHANNEL}: spending ${formatShare(rates[breach === "page" ? "1h" : "3d"] / (slo.windowDays * 24))} of budget an hour.`
            : "Over its burn lines while alerts are muted."}
        </AlertDescription>
      </Alert>
    )
  }
  if (!slo.alerting) {
    const by = PERSON_BY_ID.get(slo.mutedBy ?? slo.ownerId)?.name
    return (
      <Alert variant="info">
        {UI_ICONS.mute}
        <AlertTitle>Alerts Muted</AlertTitle>
        <AlertDescription>
          {slo.muteNote ? `${slo.muteNote}. ` : ""}Muted by {by}
          {slo.mutedAt === undefined ? "" : ` ${formatRelative(slo.mutedAt)}`}.
        </AlertDescription>
      </Alert>
    )
  }
  return null
}

export function SloOverviewTab({
  slo,
  onShowBurn,
  onShowEvents,
}: {
  slo: Slo
  onShowBurn: () => void
  onShowEvents: () => void
}) {
  const { stats } = derive(slo)
  const bar = thresholdLabel(slo)
  const noun = SLI_KINDS[slo.sli].noun

  return (
    <>
      <PolicyAlert slo={slo} onShowBurn={onShowBurn} />

      <SectionFrame>
        <SectionHead
          icon={UI_ICONS.budget}
          title="Burn-Down"
          description="Budget left, day by day"
        />
        <BudgetBurnChart
          variant="compact"
          slo={slo}
          onOpenEvents={onShowEvents}
        />
      </SectionFrame>

      <FactGroup
        title="Budget"
        facts={[
          {
            label: "Attainment",
            value: (
              <>
                <span className="font-medium">
                  {formatAttainment(stats.attainment)}
                </span>
                <Muted>target {formatObjective(slo.objective)}</Muted>
              </>
            ),
          },
          {
            label: "Allowance",
            value: (
              <>
                <span>{formatSpan(stats.downtimeMin)}</span>
                <Muted>
                  or {formatCount(stats.allowed)} {noun}
                </Muted>
              </>
            ),
          },
          {
            label: "Spent",
            value: (
              <>
                <span>{formatShare(stats.consumed)}</span>
                <Muted>
                  {formatCount(stats.bad)} bad {noun}
                </Muted>
              </>
            ),
          },
          {
            label: "Runs out",
            value:
              stats.remaining <= 0 ? (
                <span className="text-destructive">Already spent</span>
              ) : (
                <>
                  <span>{formatDaysLeft(stats.daysLeft)}</span>
                  <Muted>at the 7 day pace</Muted>
                </>
              ),
          },
        ]}
      />

      <FactGroup
        title="Definition"
        facts={[
          {
            label: "Indicator",
            value: (
              <>
                <SliFace sli={slo.sli} />
                {bar ? <Muted>{bar.toLowerCase()}</Muted> : null}
              </>
            ),
          },
          {
            label: "Good event",
            value: <span className="text-pretty">{slo.description}</span>,
          },
          { label: "Service", value: <ServiceFace service={slo.service} /> },
          { label: "Owner", value: <OwnerFace ownerId={slo.ownerId} /> },
          {
            label: "Created",
            value: formatDay(slo.createdAt),
          },
        ]}
      />
    </>
  )
}