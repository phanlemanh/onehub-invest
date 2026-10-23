import { type ReactNode } from "react"
import { type BadgeProps } from "@/components/reui/badge"
import {
  DAY_MS,
  generateSeries,
  HISTORY_DAYS,
  MINUTE_MS,
  REFERENCE_MS,
} from "./slo-math"
import { BanknoteIcon, DatabaseIcon, WebhookIcon, ShieldCheckIcon, WalletIcon, ListChecksIcon, SearchIcon, BellIcon, ActivityIcon, ZapIcon, ClockIcon, BadgeCheckIcon } from "lucide-react"

// customize: the workspace and the channel alerts land in.
export const WORKSPACE_NAME = "Harbor Ops"
export const ALERT_CHANNEL = "#sre-oncall"

// ── Types ──

export type ServiceId =
  | "payments-api"
  | "ledger-worker"
  | "webhook-dispatcher"
  | "fraud-scorer"
  | "payouts-scheduler"
  | "reconciliation"
  | "search-indexer"
  | "notifications"
export type Team = "Platform" | "Payments" | "Risk" | "Data" | "SRE"
export type PersonId =
  | "nina"
  | "omar"
  | "sarah"
  | "david"
  | "sofia"
  | "kenji"
  | "emma"
  | "michael"
  | "priya"
  | "alex"
export type SliKind = "availability" | "latency" | "freshness" | "correctness"
export type WindowDays = 7 | 28 | 30
export type SloStatus = "healthy" | "atRisk" | "exhausted"
export type SloTab = "all" | SloStatus
export type SheetTab = "overview" | "burn" | "events" | "settings"
export type EventKind = "incident" | "deploy" | "dependency" | "maintenance"
export type AlertLevel = "page" | "ticket"
export type TeamScope = "all" | Team
export type Density = "compact" | "comfortable"

export type Person = {
  id: PersonId
  name: string
  avatar: string
  role: string
  team: Team
  initials: string
}

/** Something that spent budget. Excluded events stay listed but never count. */
export type BudgetEvent = {
  id: string
  title: string
  summary: string
  kind: EventKind
  startedAt: number
  /** null while the event is still open. */
  durationMin: number | null
  /** Bad events it caused, in the SLI's unit. */
  bad: number
  excluded: boolean
  excludedBy?: PersonId
}

export type SloDay = { start: number; total: number; bad: number }

export type Slo = {
  id: string
  name: string
  description: string
  service: ServiceId
  sli: SliKind
  /** Latency in ms or freshness in seconds; null for the other SLIs. */
  threshold: number | null
  objective: number
  windowDays: WindowDays
  ownerId: PersonId
  alerting: boolean
  pageOnFastBurn: boolean
  ticketOnSlowBurn: boolean
  mutedAt?: number
  mutedBy?: PersonId
  muteNote?: string
  createdAt: number
  /** Mean events per day, in the SLI's unit. */
  volume: number
  /** 90 days, oldest first: totals and background failures. */
  days: SloDay[]
  /** Background bad ratios: the last 72 hours, then the last hour by 5m. */
  hourly: number[]
  minutes: number[]
  /** Newest first. */
  events: BudgetEvent[]
}

export type SloDraft = Pick<
  Slo,
  | "name"
  | "description"
  | "service"
  | "sli"
  | "threshold"
  | "objective"
  | "windowDays"
  | "ownerId"
  | "alerting"
  | "pageOnFastBurn"
  | "ticketOnSlowBurn"
>

// ── World ──

export const CURRENT_USER_ID: PersonId = "nina"

export const PEOPLE: Person[] = [
  {
    id: "nina",
    name: "Nina Santos",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&dpr=2&q=80",
    role: "Staff SRE",
    team: "SRE",
    initials: "NS",
  },
  {
    id: "omar",
    name: "Omar Haddad",
    avatar:
      "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=96&h=96&dpr=2&q=80",
    role: "Platform lead",
    team: "Platform",
    initials: "OH",
  },
  {
    id: "sarah",
    name: "Sarah Chen",
    avatar:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=96&h=96&dpr=2&q=80",
    role: "Security and compliance lead",
    team: "Platform",
    initials: "SC",
  },
  {
    id: "david",
    name: "David Kim",
    avatar:
      "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=96&h=96&dpr=2&q=80",
    role: "Payments engineer",
    team: "Payments",
    initials: "DK",
  },
  {
    id: "sofia",
    name: "Sofia Romero",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&dpr=2&q=80",
    role: "Data engineer",
    team: "Data",
    initials: "SR",
  },
  {
    id: "kenji",
    name: "Kenji Tan",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&dpr=2&q=80",
    role: "Risk engineer",
    team: "Risk",
    initials: "KT",
  },
  {
    id: "emma",
    name: "Emma Wilson",
    avatar:
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80",
    role: "Release manager",
    team: "Platform",
    initials: "EW",
  },
  {
    id: "michael",
    name: "Michael Rodriguez",
    avatar:
      "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=96&h=96&dpr=2&q=80",
    role: "Infrastructure engineer",
    team: "SRE",
    initials: "MR",
  },
  {
    id: "priya",
    name: "Priya Patel",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=96&h=96&dpr=2&q=80",
    role: "Payments engineering manager",
    team: "Payments",
    initials: "PP",
  },
  {
    id: "alex",
    name: "Alex Johnson",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&dpr=2&q=80",
    role: "Database reliability engineer",
    team: "SRE",
    initials: "AJ",
  },
]

export const PERSON_BY_ID = new Map<PersonId, Person>(
  PEOPLE.map((person) => [person.id, person])
)

export const PERSON_OPTIONS = PEOPLE.map((person) => ({
  value: person.id,
  label: person.name,
}))

export const TEAM_OPTIONS: { value: Team; label: string }[] = [
  { value: "Platform", label: "Platform" },
  { value: "Payments", label: "Payments" },
  { value: "Risk", label: "Risk" },
  { value: "Data", label: "Data" },
  { value: "SRE", label: "SRE" },
]

export const TEAM_SCOPE_OPTIONS: { value: TeamScope; label: string }[] = [
  { value: "all", label: "All Teams" },
  ...TEAM_OPTIONS,
]

// prettier-ignore
export const SERVICES: Record<ServiceId, { label: ServiceId; icon: ReactNode }> = {
  "payments-api":       { label: "payments-api",       icon: <BanknoteIcon aria-hidden="true" /> },
  "ledger-worker":      { label: "ledger-worker",      icon: <DatabaseIcon aria-hidden="true" /> },
  "webhook-dispatcher": { label: "webhook-dispatcher", icon: <WebhookIcon aria-hidden="true" /> },
  "fraud-scorer":       { label: "fraud-scorer",       icon: <ShieldCheckIcon aria-hidden="true" /> },
  "payouts-scheduler":  { label: "payouts-scheduler",  icon: <WalletIcon aria-hidden="true" /> },
  reconciliation:       { label: "reconciliation",     icon: <ListChecksIcon aria-hidden="true" /> },
  "search-indexer":     { label: "search-indexer",     icon: <SearchIcon aria-hidden="true" /> },
  notifications:        { label: "notifications",      icon: <BellIcon aria-hidden="true" /> },
}

export const SERVICE_IDS = Object.keys(SERVICES) as ServiceId[]

export const SERVICE_OPTIONS = SERVICE_IDS.map((id) => ({
  value: id,
  label: id,
}))

/** Requests a day a new SLO backfills against. */
const SERVICE_VOLUME: Record<ServiceId, number> = {
  "payments-api": 4_200_000,
  "ledger-worker": 9_500_000,
  "webhook-dispatcher": 2_800_000,
  "fraud-scorer": 3_600_000,
  "payouts-scheduler": 450_000,
  reconciliation: 1_200_000,
  "search-indexer": 6_100_000,
  notifications: 1_900_000,
}

// prettier-ignore
export const SLI_KINDS: Record<
  SliKind,
  { label: string; unit: "ms" | "s" | null; noun: string; template: string; icon: ReactNode }
> = {
  availability: { label: "Availability", unit: null, noun: "requests", template: "Share of requests answered without a 5xx",       icon: <ActivityIcon aria-hidden="true" /> },
  latency:      { label: "Latency",      unit: "ms", noun: "requests", template: "Share of requests served under the threshold",  icon: <ZapIcon aria-hidden="true" /> },
  freshness:    { label: "Freshness",    unit: "s",  noun: "minutes",  template: "Share of minutes with data newer than the threshold", icon: <ClockIcon aria-hidden="true" /> },
  correctness:  { label: "Correctness",  unit: null, noun: "records",  template: "Share of records that reconcile on first pass",  icon: <BadgeCheckIcon aria-hidden="true" /> },
}

export const SLI_IDS = Object.keys(SLI_KINDS) as SliKind[]

export const SLI_OPTIONS = SLI_IDS.map((id) => ({
  value: id,
  label: SLI_KINDS[id].label,
}))

export const DEFAULT_THRESHOLD: Record<SliKind, number | null> = {
  availability: null,
  latency: 300,
  freshness: 300,
  correctness: null,
}

export const OBJECTIVE_OPTIONS = [0.99, 0.995, 0.999, 0.9995, 0.9999]

export const WINDOW_OPTIONS: { value: WindowDays; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 28, label: "28 days" },
  { value: 30, label: "30 days" },
]

export const SLO_STATUS: Record<
  SloStatus,
  {
    label: string
    variant: BadgeProps["variant"]
    tick: string
    text: string
    indicator: string
  }
> = {
  healthy: {
    label: "Healthy",
    variant: "success-light",
    tick: "bg-success",
    text: "text-success",
    indicator: "**:data-[slot=progress-indicator]:bg-success",
  },
  atRisk: {
    label: "At Risk",
    variant: "warning-light",
    tick: "bg-warning",
    text: "text-warning",
    indicator: "**:data-[slot=progress-indicator]:bg-warning",
  },
  exhausted: {
    label: "Exhausted",
    variant: "destructive-light",
    tick: "bg-destructive",
    text: "text-destructive",
    indicator: "**:data-[slot=progress-indicator]:bg-destructive",
  },
}

export const STATUS_ORDER: SloStatus[] = ["healthy", "atRisk", "exhausted"]

export const SLO_TABS: { value: SloTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "atRisk", label: "At Risk" },
  { value: "exhausted", label: "Exhausted" },
  { value: "healthy", label: "Healthy" },
]

export const EVENT_KINDS: Record<
  EventKind,
  { label: string; many: string; dot: string; color: string }
> = {
  incident: {
    label: "Incident",
    many: "Incidents",
    dot: "bg-destructive",
    color: "var(--destructive)",
  },
  deploy: {
    label: "Deploy",
    many: "Deploys",
    dot: "bg-info",
    color: "var(--info)",
  },
  dependency: {
    label: "Dependency",
    many: "Dependencies",
    dot: "bg-warning",
    color: "var(--warning)",
  },
  maintenance: {
    label: "Maintenance",
    many: "Maintenance",
    dot: "bg-muted-foreground",
    color: "var(--muted-foreground)",
  },
}

export const ALERT_LEVELS: Record<
  AlertLevel,
  { label: string; variant: BadgeProps["variant"] }
> = {
  page: { label: "Paging", variant: "destructive-light" },
  ticket: { label: "Ticket", variant: "warning-light" },
}

export const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
]

// ── Seed ──

const at = (monthDay: string) =>
  Date.parse(`2026-${monthDay.replace(" ", "T")}:00Z`)

/** id, title, summary, kind, start (UTC), minutes (null while open),
 *  share of the window's budget it spent, and who excluded it. */
type RawEvent = [
  string,
  string,
  string,
  EventKind,
  string,
  number | null,
  number,
  PersonId?,
]

type RawSlo = {
  id: string
  name: string
  description: string
  service: ServiceId
  sli: SliKind
  threshold: number | null
  objective: number
  windowDays: WindowDays
  ownerId: PersonId
  volume: number
  baseBurn: number
  mute?: { by: PersonId; at: string; note: string }
  ticket?: false
  events: RawEvent[]
}

// customize: the catalog. One incident can spend several SLOs' budgets, so an
// id (INC-2196, DEP-4107) repeats across records.
const RAW_SLOS: RawSlo[] = [
  // prettier-ignore
  { id: "SLO-101", name: "Charge API availability", description: "Share of POST /v1/charges answered without a 5xx", service: "payments-api", sli: "availability", threshold: null, objective: 0.9995, windowDays: 28, ownerId: "david", volume: 4_200_000, baseBurn: 0.2, events: [
    ["INC-2204", "Card network timeouts", "Acquirer timeouts on 1 in 40 charges", "dependency", "09-24 18:10", 42, 0.31],
  ] },
  // prettier-ignore
  { id: "SLO-102", name: "Charge API latency", description: "Share of charges answered under 300 ms", service: "payments-api", sli: "latency", threshold: 300, objective: 0.99, windowDays: 28, ownerId: "david", volume: 4_200_000, baseBurn: 0.25, events: [
    ["DEP-4052", "payments-api v2.39.0 regression", "An N+1 query on the charge path", "deploy", "09-12 15:40", 95, 0.22],
  ] },
  // prettier-ignore
  { id: "SLO-103", name: "Refund API availability", description: "Share of POST /v1/refunds answered without a 5xx", service: "payments-api", sli: "availability", threshold: null, objective: 0.999, windowDays: 28, ownerId: "priya", volume: 600_000, baseBurn: 0.12, events: [] },
  // prettier-ignore
  { id: "SLO-104", name: "Ledger write success", description: "Share of ledger writes committed on the first attempt", service: "ledger-worker", sli: "correctness", threshold: null, objective: 0.9999, windowDays: 30, ownerId: "alex", volume: 9_500_000, baseBurn: 0.3, events: [
    ["INC-2201", "Ledger worker OOM loop", "Pods restarted against a 2 GiB limit", "incident", "09-26 11:40", 26, 0.38],
    ["INC-2196", "Postgres primary failover", "Writes failed during a 3 minute promotion", "incident", "09-21 03:12", 18, 0.74],
  ] },
  // prettier-ignore
  { id: "SLO-105", name: "Ledger posting freshness", description: "Share of minutes with postings under 60 seconds old", service: "ledger-worker", sli: "freshness", threshold: 60, objective: 0.995, windowDays: 28, ownerId: "alex", volume: 1440, baseBurn: 0.18, events: [
    ["INC-2196", "Postgres primary failover", "Posting lag peaked at 9 minutes", "incident", "09-21 03:12", 52, 0.2],
  ] },
  // prettier-ignore
  { id: "SLO-106", name: "Webhook delivery success", description: "Share of webhook attempts acknowledged with a 2xx", service: "webhook-dispatcher", sli: "availability", threshold: null, objective: 0.999, windowDays: 28, ownerId: "omar", volume: 2_800_000, baseBurn: 0.2, events: [
    ["INC-2209", "Webhook retry storm", "Merchant retries saturated the dispatch pool", "incident", "09-29 13:05", null, 0.037],
    ["INC-2187", "Receiver TLS failures", "An expired intermediate at 3 receivers", "dependency", "09-08 09:30", 70, 0.17],
  ] },
  // prettier-ignore
  { id: "SLO-107", name: "Webhook delivery latency", description: "Share of webhooks delivered within 2 seconds", service: "webhook-dispatcher", sli: "latency", threshold: 2000, objective: 0.99, windowDays: 7, ownerId: "omar", volume: 2_800_000, baseBurn: 0.3, events: [
    ["INC-2209", "Webhook retry storm", "Delivery p95 rose to 4.8 seconds", "incident", "09-29 13:05", null, 0.05],
  ] },
  // prettier-ignore
  { id: "SLO-108", name: "Fraud score latency", description: "Share of scores returned under 120 ms", service: "fraud-scorer", sli: "latency", threshold: 120, objective: 0.999, windowDays: 28, ownerId: "kenji", volume: 3_600_000, baseBurn: 0.35, events: [
    ["INC-2192", "Model cold starts", "Scale to zero left two pods cold", "incident", "09-17 06:20", 55, 0.29],
  ] },
  // prettier-ignore
  { id: "SLO-109", name: "Fraud model availability", description: "Share of score requests answered without a 5xx", service: "fraud-scorer", sli: "availability", threshold: null, objective: 0.9995, windowDays: 28, ownerId: "kenji", volume: 3_600_000, baseBurn: 0.1, events: [] },
  // prettier-ignore
  { id: "SLO-110", name: "Payout batch on time", description: "Share of minutes with the payout batch under 15 minutes late", service: "payouts-scheduler", sli: "freshness", threshold: 900, objective: 0.995, windowDays: 30, ownerId: "priya", volume: 1440, baseBurn: 0.45, events: [
    ["DEP-4107", "payouts-scheduler v4.12.1 rollback", "Batch writer errors after the deploy", "deploy", "09-28 14:56", 34, 0.18],
    ["INC-2189", "EU bank cutoff missed", "Settlement file landed 40 minutes late", "dependency", "09-10 16:00", 120, 0.22],
  ] },
  // prettier-ignore
  { id: "SLO-111", name: "Payout API availability", description: "Share of payout API calls answered without a 5xx", service: "payouts-scheduler", sli: "availability", threshold: null, objective: 0.999, windowDays: 28, ownerId: "david", volume: 450_000, baseBurn: 0.15, events: [
    ["DEP-4107", "payouts-scheduler v4.12.1 rollback", "Error rate reached 1.6%", "deploy", "09-28 14:56", 34, 0.09],
  ] },
  // prettier-ignore
  { id: "SLO-112", name: "Reconciliation completeness", description: "Share of settlement records matched on the first pass", service: "reconciliation", sli: "correctness", threshold: null, objective: 0.999, windowDays: 30, ownerId: "sofia", volume: 1_200_000, baseBurn: 0.2, events: [
    ["DEP-4125", "reconciliation v2.7.1 rollback", "Canary errors in prod-eu-west-1", "deploy", "09-29 10:38", 14, 0.11],
  ] },
  // prettier-ignore
  { id: "SLO-113", name: "Recon report freshness", description: "Share of minutes with reports under 1 hour old", service: "reconciliation", sli: "freshness", threshold: 3600, objective: 0.99, windowDays: 7, ownerId: "sofia", volume: 1440, baseBurn: 0.2, mute: { by: "sofia", at: "09-27 00:40", note: "Warehouse migration window" }, events: [
    ["INC-2206", "Warehouse migration", "Planned 3 hour freeze on report jobs", "maintenance", "09-27 01:00", 180, 0.4, "sofia"],
  ] },
  // prettier-ignore
  { id: "SLO-114", name: "Search query latency", description: "Share of queries answered under 250 ms", service: "search-indexer", sli: "latency", threshold: 250, objective: 0.995, windowDays: 28, ownerId: "michael", volume: 6_100_000, baseBurn: 0.25, events: [
    ["DEP-4116", "search-indexer v2.3.2 rollback", "Canary p95 latency over its gate", "deploy", "09-29 01:35", 22, 0.07],
  ] },
  // prettier-ignore
  { id: "SLO-115", name: "Index freshness", description: "Share of minutes with the index under 5 minutes behind", service: "search-indexer", sli: "freshness", threshold: 300, objective: 0.99, windowDays: 7, ownerId: "michael", volume: 1440, baseBurn: 0.4, events: [
    ["INC-2207", "Indexer backlog after reindex", "Freshness lag held at 22 minutes", "incident", "09-27 20:00", 240, 0.42],
  ] },
  // prettier-ignore
  { id: "SLO-116", name: "Email send success", description: "Share of transactional emails accepted by the provider", service: "notifications", sli: "availability", threshold: null, objective: 0.995, windowDays: 28, ownerId: "emma", volume: 1_900_000, baseBurn: 0.15, events: [] },
  // prettier-ignore
  { id: "SLO-117", name: "Push delivery latency", description: "Share of pushes delivered within 5 seconds", service: "notifications", sli: "latency", threshold: 5000, objective: 0.99, windowDays: 7, ownerId: "emma", volume: 5_400_000, baseBurn: 0.3, mute: { by: "emma", at: "09-28 09:15", note: "Provider migration in progress" }, events: [] },
  // prettier-ignore
  { id: "SLO-118", name: "SMS provider availability", description: "Share of SMS sends accepted by the carrier gateway", service: "notifications", sli: "availability", threshold: null, objective: 0.995, windowDays: 28, ownerId: "nina", volume: 320_000, baseBurn: 0.25, events: [
    ["INC-2199", "SMS provider regional outage", "Carrier gateway down in two regions", "dependency", "09-23 07:15", 310, 0.96],
  ] },
]

/** Events a day a draft's budget counts against: minutes for freshness. */
export const volumeOf = (draft: Pick<SloDraft, "sli" | "service">) =>
  draft.sli === "freshness" ? 1440 : SERVICE_VOLUME[draft.service]

/** One record from a draft: a seeded 90 day backfill, no events yet. */
export function buildSlo(
  id: string,
  draft: SloDraft,
  extra: { volume?: number; baseBurn?: number; createdAt?: number } = {}
): Slo {
  const volume = extra.volume ?? volumeOf(draft)
  return {
    ...draft,
    id,
    volume,
    createdAt: extra.createdAt ?? REFERENCE_MS,
    events: [],
    ...generateSeries({
      id,
      volume,
      objective: draft.objective,
      baseBurn: extra.baseBurn ?? 0.2,
      minutes: draft.sli === "freshness",
    }),
  }
}

function seedSlos(): Slo[] {
  return RAW_SLOS.map((raw, index) => {
    const slo = buildSlo(
      raw.id,
      {
        name: raw.name,
        description: raw.description,
        service: raw.service,
        sli: raw.sli,
        threshold: raw.threshold,
        objective: raw.objective,
        windowDays: raw.windowDays,
        ownerId: raw.ownerId,
        alerting: !raw.mute,
        pageOnFastBurn: true,
        ticketOnSlowBurn: raw.ticket ?? true,
      },
      {
        volume: raw.volume,
        baseBurn: raw.baseBurn,
        createdAt: Date.parse("2026-02-02T09:00:00Z") + index * 6 * DAY_MS,
      }
    )
    const windowTotal = slo.days
      .slice(HISTORY_DAYS - slo.windowDays)
      .reduce((sum, day) => sum + day.total, 0)
    // An event's share is of the seed window's allowance; it stores raw counts.
    const allowance = (1 - slo.objective) * windowTotal
    return {
      ...slo,
      ...(raw.mute && {
        mutedAt: at(raw.mute.at),
        mutedBy: raw.mute.by,
        muteNote: raw.mute.note,
      }),
      events: raw.events.map(
        ([
          id,
          title,
          summary,
          kind,
          start,
          durationMin,
          share,
          excludedBy,
        ]) => ({
          id,
          title,
          summary,
          kind,
          startedAt: at(start),
          durationMin,
          bad: Math.max(1, Math.round(share * allowance)),
          excluded: excludedBy !== undefined,
          excludedBy,
        })
      ),
    }
  })
}

export const SLOS: Slo[] = seedSlos()

const idNumber = (id: string) => Number(id.replace(/\D/g, "")) || 0

export const LAST_SEED_SLO = Math.max(...SLOS.map((slo) => idNumber(slo.id)))

export const NEW_SLO_DRAFT: SloDraft = {
  name: "",
  description: "",
  service: "payments-api",
  sli: "availability",
  threshold: null,
  objective: 0.999,
  windowDays: 28,
  ownerId: CURRENT_USER_ID,
  alerting: true,
  pageOnFastBurn: true,
  ticketOnSlowBurn: true,
}

export const draftOf = (slo: Slo): SloDraft => ({
  name: slo.name,
  description: slo.description,
  service: slo.service,
  sli: slo.sli,
  threshold: slo.threshold,
  objective: slo.objective,
  windowDays: slo.windowDays,
  ownerId: slo.ownerId,
  alerting: slo.alerting,
  pageOnFastBurn: slo.pageOnFastBurn,
  ticketOnSlowBurn: slo.ticketOnSlowBurn,
})

export const teamOf = (slo: Slo) => PERSON_BY_ID.get(slo.ownerId)?.team

/** "Under 300 ms", "Under 15m": the SLI's bar, or null when it has none. */
export function thresholdLabel(slo: Pick<Slo, "sli" | "threshold">) {
  if (slo.threshold === null) return null
  if (SLI_KINDS[slo.sli].unit === "ms") return `Under ${slo.threshold} ms`
  const seconds = slo.threshold
  return seconds < 120
    ? `Under ${seconds}s`
    : seconds < 7200
      ? `Under ${Math.round(seconds / 60)}m`
      : `Under ${Math.round(seconds / 3600)}h`
}

// ── Formatting ──

const percent = (digits: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: digits,
  })
const objectiveFormat = percent(2)
const shareFormat = percent(0)
const fineShareFormat = percent(1)
const countFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const dayFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
})
const pad = (value: number) => String(value).padStart(2, "0")

/** "99.95%", "99%" */
export const formatObjective = (value: number) => objectiveFormat.format(value)

/** Three decimals, so attainment columns line up: "99.942%" */
export const formatAttainment = (value: number) =>
  `${(value * 100).toFixed(3)}%`

/** "47%", "3.7%", "-42%": one decimal under a tenth. */
export const formatShare = (value: number) =>
  Math.abs(value) < 0.1 && value !== 0
    ? fineShareFormat.format(value)
    : shareFormat.format(value)

/** A policy line as written: "14.4×", "6×" */
export const formatFactor = (value: number) => `${value}×`

/** "18×", "6.2×", "0.41×" */
export function formatBurn(value: number) {
  if (value >= 10) return `${Math.round(value)}×`
  if (value >= 1) return `${value.toFixed(1)}×`
  return `${value.toFixed(2)}×`
}

export const formatCount = (value: number) =>
  countFormat.format(Math.round(value))

/** Minutes as a span: "40m 19s", "1h 41m", "3d 4h" */
export function formatSpan(minutes: number) {
  const seconds = Math.max(0, Math.round(minutes * 60))
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m ${pad(seconds % 60)}s`
  if (seconds < 86_400)
    return `${Math.floor(seconds / 3600)}h ${pad(Math.floor((seconds % 3600) / 60))}m`
  return `${Math.floor(seconds / 86_400)}d ${Math.floor((seconds % 86_400) / 3600)}h`
}

/** "14:20" */
export function formatClock(ms: number) {
  const date = new Date(ms)
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

/** "Sep 24" */
export const formatDay = (ms: number) => dayFormat.format(ms)

/** "Sep 24, 18:10 UTC" */
export const formatDateTime = (ms: number) =>
  `${formatDay(ms)}, ${formatClock(ms)} UTC`

/** "in 5m", "2h 10m ago", "3d ago", "just now" */
export function formatRelative(ms: number) {
  const diff = ms - REFERENCE_MS
  const minutes = Math.floor(Math.abs(diff) / MINUTE_MS)
  if (minutes < 1) return "just now"
  let span: string
  if (minutes < 60) span = `${minutes}m`
  else if (minutes < 1440) {
    const rest = minutes % 60
    span = rest ? `${Math.floor(minutes / 60)}h ${rest}m` : `${minutes / 60}h`
  } else span = `${Math.floor(minutes / 1440)}d`
  return diff > 0 ? `in ${span}` : `${span} ago`
}

/** "9 days", "Under a day"; null holds. */
export function formatDaysLeft(days: number | null) {
  if (days === null) return "Holds"
  if (days < 1) return "Under a day"
  const whole = Math.floor(days)
  return `${whole} ${whole === 1 ? "day" : "days"}`
}

export const plural = (count: number, noun: string, many = `${noun}s`) =>
  `${count} ${count === 1 ? noun : many}`

/** The SLO as an OpenSLO v1 document, for the copy action. */
export function openSloYaml(slo: Slo) {
  const name = slo.id.toLowerCase()
  return [
    "apiVersion: openslo/v1",
    "kind: SLO",
    "metadata:",
    `  name: ${name}`,
    `  displayName: ${slo.name}`,
    "spec:",
    `  description: ${slo.description}`,
    `  service: ${slo.service}`,
    `  indicatorRef: ${slo.service}-${slo.sli}`,
    "  budgetingMethod: Occurrences",
    "  timeWindow:",
    `    - duration: ${slo.windowDays}d`,
    "      isRolling: true",
    "  objectives:",
    `    - target: ${slo.objective}`,
    ...(slo.threshold === null ? [] : [`      value: ${slo.threshold}`]),
    "",
  ].join("\n")
}