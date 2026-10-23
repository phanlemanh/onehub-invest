import { type ReactNode } from "react"
import { type BadgeProps } from "@/components/reui/badge"

import { Dropbox } from "@/components/ui/svgs/dropbox"
import { GithubDark } from "@/components/ui/svgs/githubDark"
import { GithubLight } from "@/components/ui/svgs/githubLight"
import { GoogleCloud } from "@/components/ui/svgs/googleCloud"
import { Drive as GoogleDrive } from "@/components/ui/svgs/drive"
import { Linear } from "@/components/ui/svgs/linear"
import { Neon } from "@/components/ui/svgs/neon"
import { Planetscale } from "@/components/ui/svgs/planetscale"
import { PlanetscaleDark } from "@/components/ui/svgs/planetscaleDark"
import { Redis } from "@/components/ui/svgs/redis"
import { Slack } from "@/components/ui/svgs/slack"
import { Stripe } from "@/components/ui/svgs/stripe"
import { Supabase } from "@/components/ui/svgs/supabase"
import { DatabaseIcon, LayersIcon, BlocksIcon, FolderIcon, TableIcon, EyeIcon, FileJson2Icon, KeyRoundIcon, FileSpreadsheetIcon, TypeIcon, ListIcon, HashIcon, BanknoteIcon, CalendarClockIcon, CalendarIcon, CircleCheckIcon } from "lucide-react"

// customize: the workspace, the channel failure alerts land in and the secret store.
export const WORKSPACE_NAME = "Harbor Ops"
export const ALERT_CHANNEL = "#data-platform"
export const VAULT_NAME = "Harbor vault"

export const MINUTE_MS = 60_000
export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000
/** The demo clock: every relative time reads against this instant. */
export const REFERENCE_MS = Date.parse("2026-09-29T14:20:00Z")
/** Start of the hour the reference falls in; the last matrix column. */
export const CURRENT_HOUR_MS = REFERENCE_MS - (REFERENCE_MS % HOUR_MS)
export const HOURS = 24
/** Totals before today, oldest first: the stat cards' trend lines. */
export const ROWS_BY_DAY = [
  7_120_000, 7_480_000, 6_910_000, 7_830_000, 8_240_000, 6_380_000, 6_090_000,
  7_710_000, 8_020_000, 7_940_000, 8_310_000, 7_560_000, 8_060_000,
]
export const FAILED_BY_DAY = [0, 1, 0, 0, 2, 1, 0, 1, 0, 3, 2, 0, 2]
export const HEALTHY_YESTERDAY = 12
export const LINKED_LAST_WEEK = 31

/** A token expiring inside this window shows up under Needs Attention. */
export const EXPIRY_WARN_MS = 14 * DAY_MS
/** How long a renewed OAuth grant lives. */
export const RENEW_DAYS = 90
/** The shortest secret a rotate or a new connection accepts. */
export const MIN_SECRET = 12

// ── Types ──

export type IntegrationId =
  | "neon"
  | "planetscale"
  | "supabase"
  | "redis"
  | "bigquery"
  | "stripe"
  | "github"
  | "linear"
  | "slack"
  | "googleDrive"
  | "dropbox"
export type IntegrationCategory = "database" | "warehouse" | "app" | "files"
export type AuthKind =
  "password" | "apiKey" | "serviceAccount" | "oauth" | "githubApp"
export type Environment = "production" | "staging" | "sandbox"
export type EnvironmentScope = "all" | Environment
export type SyncFrequency = "realtime" | "15m" | "1h" | "6h" | "24h"
export type Health = "healthy" | "degraded" | "failing" | "pending"
export type ConnectionStatus =
  "healthy" | "syncing" | "pending" | "degraded" | "failing" | "paused"
export type ConnectionTab = "all" | IntegrationCategory
export type SheetTab = "overview" | "datasets" | "preview" | "settings"
export type DatasetKind =
  "table" | "view" | "resource" | "keyspace" | "sheet" | "folder"
export type ColumnType =
  | "id"
  | "text"
  | "enum"
  | "number"
  | "money"
  | "timestamp"
  | "date"
  | "boolean"
  | "json"
export type RunOutcome = "succeeded" | "partial" | "failed"
export type HourOutcome = RunOutcome | "skipped" | "none"
export type Density = "compact" | "comfortable"
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
export type ConsumerId =
  | "JOB-214"
  | "JOB-219"
  | "JOB-226"
  | "JOB-237"
  | "JOB-240"
  | "JOB-263"
  | "JOB-272"
  | "JOB-304"
  | "SLO-105"
  | "fraud-scorer"
  | "deployments"

export type Person = {
  id: PersonId
  name: string
  avatar: string
  role: string
  team: Team
  initials: string
}

/** How a sample value generates; the view formats it by `type`. */
export type ColumnSpec = {
  name: string
  type: ColumnType
  /** The dataset's primary key. */
  key?: boolean
  /** Personal data: the preview masks it until the reader unmasks. */
  pii?: boolean
  /** Pool for text, enum and json columns. */
  values?: string[]
  /** Id prefix: "le_", "ch_". */
  prefix?: string
  /** Inclusive range for numbers; money in minor units. */
  range?: [number, number]
  decimals?: number
  /** Timestamps after the reference instead of before it. */
  future?: boolean
  nullable?: boolean
}

export type DatasetSeed = {
  name: string
  kind: DatasetKind
  rows: number
  /** Bytes per row, for the size estimate. */
  rowBytes: number
  columns: ColumnSpec[]
  /** The incremental cursor; full refresh without one. */
  cursor?: string
  consumers?: ConsumerId[]
}

export type Dataset = DatasetSeed & {
  id: string
  linked: boolean
  /** Newest successful sync while linked; null when never synced. */
  syncedAt: number | null
  /** Columns that appeared upstream and wait for acceptance. */
  drift: ColumnSpec[]
  /** Found by the last Refresh Schema; cleared once linked. */
  discovered: boolean
}

export type SyncRun = {
  id: string
  startedAt: number
  durationSec: number
  rows: number
  outcome: RunOutcome
  message?: string
  /** Manual runs carry who started them. */
  by?: PersonId
}

export type HourCell = {
  start: number
  outcome: HourOutcome
  runs: number
  failed: number
  rows: number
}

export type Credential = {
  kind: AuthKind
  /** The redacted tail: never the secret. */
  hint: string
  principal: string
  rotatedAt: number
  rotatedBy: PersonId | "JOB-290"
  expiresAt: number | null
}

export type Connection = {
  id: string
  name: string
  integration: IntegrationId
  environment: Environment
  endpoint: string
  frequency: SyncFrequency
  ownerId: PersonId
  health: Health
  /** What is wrong while degraded or failing. */
  issue?: string
  failingSince?: number
  paused: boolean
  pausedAt?: number
  pausedBy?: PersonId
  pauseNote?: string
  syncing: boolean
  alertOnFailure: boolean
  credential: Credential
  createdAt: number
  /** 24 hourly cells, oldest first; the last is the current, partial hour. */
  hours: HourCell[]
  /** Newest first, capped at RUN_HISTORY. */
  runs: SyncRun[]
  /** Typical run, for manual syncs and new connections. */
  rowsPerRun: number
  durationSec: number
  datasets: Dataset[]
  /** What the next Refresh Schema finds upstream. */
  discoverable: DatasetSeed[]
}

export type ConnectionDraft = Pick<
  Connection,
  | "name"
  | "environment"
  | "endpoint"
  | "frequency"
  | "ownerId"
  | "alertOnFailure"
>

export type NewConnectionInput = ConnectionDraft & {
  integration: IntegrationId
  secret: string
  /** Starter dataset names to link on create. */
  linked: string[]
}

export type SampleValue = string | number | boolean | null
export type SampleRow = Record<string, SampleValue>

// ── People ──

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

// ── Catalog maps ──

// prettier-ignore
export const CATEGORIES: Record<IntegrationCategory, { label: string; plural: string; icon: ReactNode }> = {
  database:  { label: "Database",  plural: "Databases",  icon: <DatabaseIcon aria-hidden="true" /> },
  warehouse: { label: "Warehouse", plural: "Warehouses", icon: <LayersIcon aria-hidden="true" /> },
  app:       { label: "App",       plural: "Apps",       icon: <BlocksIcon aria-hidden="true" /> },
  files:     { label: "Files",     plural: "Files",      icon: <FolderIcon aria-hidden="true" /> },
}

export const CATEGORY_ORDER: IntegrationCategory[] = [
  "database",
  "warehouse",
  "app",
  "files",
]

export const CONNECTION_TABS: { value: ConnectionTab; label: string }[] = [
  { value: "all", label: "All" },
  ...CATEGORY_ORDER.map((category) => ({
    value: category,
    label: CATEGORIES[category].plural,
  })),
]

export const ENVIRONMENTS: Record<Environment, { label: string }> = {
  production: { label: "Production" },
  staging: { label: "Staging" },
  sandbox: { label: "Sandbox" },
}

export const ENVIRONMENT_OPTIONS = (
  ["production", "staging", "sandbox"] satisfies Environment[]
).map((value) => ({ value, label: ENVIRONMENTS[value].label }))

export const SCOPE_OPTIONS: { value: EnvironmentScope; label: string }[] = [
  { value: "all", label: "All Environments" },
  ...ENVIRONMENT_OPTIONS,
]

export const FREQUENCIES: Record<
  SyncFrequency,
  { label: string; short: string; everyMs: number | null }
> = {
  realtime: { label: "Streaming", short: "Streaming", everyMs: null },
  "15m": {
    label: "Every 15 minutes",
    short: "Every 15m",
    everyMs: 15 * MINUTE_MS,
  },
  "1h": { label: "Hourly", short: "Hourly", everyMs: HOUR_MS },
  "6h": { label: "Every 6 hours", short: "Every 6h", everyMs: 6 * HOUR_MS },
  "24h": { label: "Daily", short: "Daily", everyMs: DAY_MS },
}

export const FREQUENCY_OPTIONS = (
  ["realtime", "15m", "1h", "6h", "24h"] satisfies SyncFrequency[]
).map((value) => ({ value, label: FREQUENCIES[value].label }))

export const AUTH_KINDS: Record<
  AuthKind,
  { label: string; secret: string; renewable: boolean }
> = {
  password: { label: "Password", secret: "Password", renewable: false },
  apiKey: { label: "API key", secret: "Restricted key", renewable: false },
  serviceAccount: {
    label: "Service account",
    secret: "JSON key",
    renewable: false,
  },
  oauth: { label: "OAuth", secret: "Access token", renewable: true },
  githubApp: { label: "GitHub App", secret: "Installation", renewable: true },
}

export const CONNECTION_STATUS: Record<
  ConnectionStatus,
  {
    label: string
    variant: BadgeProps["variant"]
    tick: string
    text: string
  }
> = {
  healthy: {
    label: "Healthy",
    variant: "success-light",
    tick: "bg-success",
    text: "text-success",
  },
  syncing: {
    label: "Syncing",
    variant: "primary-light",
    tick: "bg-primary",
    text: "text-primary",
  },
  pending: {
    label: "First Sync",
    variant: "info-light",
    tick: "bg-info",
    text: "text-info",
  },
  degraded: {
    label: "Degraded",
    variant: "warning-light",
    tick: "bg-warning",
    text: "text-warning",
  },
  failing: {
    label: "Failing",
    variant: "destructive-light",
    tick: "bg-destructive",
    text: "text-destructive",
  },
  paused: {
    label: "Paused",
    variant: "outline",
    tick: "bg-muted-foreground/40",
    text: "text-muted-foreground",
  },
}

/** Worst first: the triage order of the grid, the matrix and the ticks. */
export const STATUS_ORDER: ConnectionStatus[] = [
  "failing",
  "degraded",
  "paused",
  "pending",
  "syncing",
  "healthy",
]

export const OUTCOME_LABEL: Record<HourOutcome, string> = {
  succeeded: "Succeeded",
  partial: "Slow or partial",
  failed: "Failed",
  skipped: "Paused",
  none: "No run due",
}

// prettier-ignore
export const DATASET_KINDS: Record<DatasetKind, { label: string; icon: ReactNode }> = {
  table:    { label: "Table",    icon: <TableIcon aria-hidden="true" /> },
  view:     { label: "View",     icon: <EyeIcon aria-hidden="true" /> },
  resource: { label: "Resource", icon: <FileJson2Icon aria-hidden="true" /> },
  keyspace: { label: "Keyspace", icon: <KeyRoundIcon aria-hidden="true" /> },
  sheet:    { label: "Sheet",    icon: <FileSpreadsheetIcon aria-hidden="true" /> },
  folder:   { label: "Folder",   icon: <FolderIcon aria-hidden="true" /> },
}

// prettier-ignore
export const COLUMN_TYPES: Record<ColumnType, { label: string; icon: ReactNode }> = {
  id:        { label: "ID",        icon: <KeyRoundIcon aria-hidden="true" /> },
  text:      { label: "Text",      icon: <TypeIcon aria-hidden="true" /> },
  enum:      { label: "Enum",      icon: <ListIcon aria-hidden="true" /> },
  number:    { label: "Number",    icon: <HashIcon aria-hidden="true" /> },
  money:     { label: "Money",     icon: <BanknoteIcon aria-hidden="true" /> },
  timestamp: { label: "Timestamp", icon: <CalendarClockIcon aria-hidden="true" /> },
  date:      { label: "Date",      icon: <CalendarIcon aria-hidden="true" /> },
  boolean:   { label: "Boolean",   icon: <CircleCheckIcon aria-hidden="true" /> },
  json:      { label: "JSON",      icon: <FileJson2Icon aria-hidden="true" /> },
}

/** Jobs, objectives and services elsewhere in Harbor Ops that read a dataset. */
export const CONSUMERS: Record<ConsumerId, { label: string; kind: string }> = {
  "JOB-214": { label: "Nightly ledger reconciliation", kind: "Cron job" },
  "JOB-219": { label: "Import bank settlement files", kind: "Cron job" },
  "JOB-226": { label: "Expire stale payout holds", kind: "Cron job" },
  "JOB-237": { label: "Refresh fraud model features", kind: "Cron job" },
  "JOB-240": { label: "Rebuild merchant search index", kind: "Cron job" },
  "JOB-263": { label: "Sync FX reference rates", kind: "Cron job" },
  "JOB-272": { label: "Export daily settlement report", kind: "Cron job" },
  "JOB-304": { label: "Reconcile card network fees", kind: "Cron job" },
  "SLO-105": { label: "Ledger posting freshness", kind: "SLO" },
  "fraud-scorer": { label: "fraud-scorer", kind: "Service" },
  deployments: { label: "Deployments console", kind: "Page" },
}

export const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
]

// ── Dataset seeds ──

const id = (name: string, prefix: string, key = false): ColumnSpec => ({
  name,
  type: "id",
  prefix,
  key,
})
const text = (name: string, values: string[], pii = false): ColumnSpec => ({
  name,
  type: "text",
  values,
  pii,
})
const pick = (name: string, values: string[]): ColumnSpec => ({
  name,
  type: "enum",
  values,
})
const num = (
  name: string,
  range: [number, number],
  decimals = 0
): ColumnSpec => ({ name, type: "number", range, decimals })
const money = (name: string, range: [number, number]): ColumnSpec => ({
  name,
  type: "money",
  range,
})
const time = (name: string, future = false): ColumnSpec => ({
  name,
  type: "timestamp",
  future,
})
const day = (name: string): ColumnSpec => ({ name, type: "date" })
const flag = (name: string): ColumnSpec => ({ name, type: "boolean" })
const json = (name: string, values: string[]): ColumnSpec => ({
  name,
  type: "json",
  values,
})

// Demo pools: reserved example domains and documentation IP ranges only.
const EMAILS = [
  "avery.brooks@example.com",
  "m.okafor@example.net",
  "lena.fischer@example.org",
  "j.morales@example.com",
  "rafael.costa@example.net",
  "hana.sato@example.org",
]
const NAMES = [
  "Avery Brooks",
  "Malik Okafor",
  "Lena Fischer",
  "Julia Morales",
  "Rafael Costa",
  "Hana Sato",
]
const IPS = [
  "203.0.113.24",
  "198.51.100.7",
  "203.0.113.181",
  "198.51.100.62",
  "203.0.113.90",
]
const MERCHANTS = [
  "Northwind Coffee",
  "Bluebird Outfitters",
  "Atlas Grocers",
  "Kestrel Labs",
  "Juniper Health",
  "Copperline Travel",
]
const LEDGER_CCY = ["USD", "USD", "EUR", "GBP"]
const STRIPE_CCY = ["usd", "usd", "eur", "gbp"]

// prettier-ignore
const LEDGER_ENTRIES: DatasetSeed = { name: "public.ledger_entries", kind: "table", rows: 48_214_903, rowBytes: 212, cursor: "created_at", consumers: ["JOB-214", "SLO-105"], columns: [
  id("id", "le_", true), id("account_id", "acct_"), pick("direction", ["debit", "credit"]), money("amount", [1_200, 2_480_000]), pick("currency", LEDGER_CCY), pick("status", ["posted", "posted", "posted", "pending", "reversed"]), time("created_at"),
] }
// prettier-ignore
const LEDGER_ACCOUNTS: DatasetSeed = { name: "public.accounts", kind: "table", rows: 182_450, rowBytes: 164, cursor: "updated_at", columns: [
  id("id", "acct_", true), id("merchant_id", "mer_"), pick("type", ["operating", "reserve", "payout"]), pick("currency", LEDGER_CCY), money("balance", [0, 91_400_000]), time("updated_at"),
] }
// prettier-ignore
const LEDGER_TRANSFERS: DatasetSeed = { name: "public.transfers", kind: "table", rows: 6_901_288, rowBytes: 188, cursor: "initiated_at", columns: [
  id("id", "tr_", true), id("source_account", "acct_"), id("destination_account", "acct_"), money("amount", [5_000, 12_600_000]), pick("status", ["settled", "settled", "in_transit", "failed"]), time("initiated_at"),
] }
// prettier-ignore
const PAYOUT_HOLDS: DatasetSeed = { name: "public.payout_holds", kind: "table", rows: 3_412, rowBytes: 140, cursor: "created_at", consumers: ["JOB-226"], columns: [
  id("id", "hold_", true), id("payout_id", "po_"), pick("reason", ["risk_review", "negative_balance", "kyc_pending"]), money("amount", [10_000, 4_800_000]), time("expires_at", true), flag("released"),
] }
// prettier-ignore
const FX_RATES: DatasetSeed = { name: "public.fx_rates", kind: "table", rows: 96_480, rowBytes: 72, cursor: "captured_at", consumers: ["JOB-263"], columns: [
  pick("base", ["USD", "EUR", "GBP"]), pick("quote", ["EUR", "GBP", "JPY", "CAD"]), num("rate", [62, 15_840], 4), pick("source", ["ecb", "fed", "boe"]), time("captured_at"),
] }
// prettier-ignore
const SCHEMA_MIGRATIONS: DatasetSeed = { name: "audit.schema_migrations", kind: "view", rows: 418, rowBytes: 96, columns: [
  text("version", ["20260914_add_hold_reason", "20260902_partition_entries", "20260821_fx_source_enum", "20260810_transfer_status_idx"]), text("applied_by", ["alex", "harbor-migrator"]), time("applied_at"),
] }
// prettier-ignore
const LEDGER_SNAPSHOTS: DatasetSeed = { name: "public.ledger_snapshots", kind: "table", rows: 2_190, rowBytes: 256, cursor: "taken_at", columns: [
  id("id", "snap_", true), id("account_id", "acct_"), money("closing_balance", [0, 91_400_000]), pick("currency", LEDGER_CCY), time("taken_at"),
] }

// prettier-ignore
const STRIPE_BALANCE: DatasetSeed = { name: "balance_transactions", kind: "resource", rows: 9_842_117, rowBytes: 320, cursor: "created", consumers: ["JOB-214", "JOB-304"], columns: [
  id("id", "txn_", true), pick("type", ["charge", "charge", "refund", "payout", "stripe_fee", "adjustment"]), money("amount", [500, 1_980_000]), money("fee", [30, 58_000]), pick("currency", STRIPE_CCY), time("created"),
] }
// prettier-ignore
const STRIPE_CHARGES: DatasetSeed = { name: "charges", kind: "resource", rows: 7_120_554, rowBytes: 410, cursor: "created", columns: [
  id("id", "ch_", true), money("amount", [500, 1_980_000]), pick("currency", STRIPE_CCY), pick("status", ["succeeded", "succeeded", "succeeded", "failed", "pending"]), text("receipt_email", EMAILS, true), time("created"),
] }
// prettier-ignore
const STRIPE_PAYOUTS: DatasetSeed = { name: "payouts", kind: "resource", rows: 41_208, rowBytes: 260, cursor: "created", columns: [
  id("id", "po_", true), money("amount", [120_000, 48_000_000]), pick("currency", STRIPE_CCY), pick("status", ["paid", "paid", "in_transit", "failed"]), id("destination", "ba_"), day("arrival_date"),
] }
// prettier-ignore
const STRIPE_DISPUTES: DatasetSeed = { name: "disputes", kind: "resource", rows: 2_917, rowBytes: 380, cursor: "created", columns: [
  id("id", "dp_", true), id("charge", "ch_"), money("amount", [1_500, 640_000]), pick("reason", ["fraudulent", "product_not_received", "duplicate"]), pick("status", ["needs_response", "under_review", "won", "lost"]), time("created"),
] }
// prettier-ignore
const STRIPE_REFUNDS: DatasetSeed = { name: "refunds", kind: "resource", rows: 188_430, rowBytes: 220, cursor: "created", columns: [
  id("id", "re_", true), id("charge", "ch_"), money("amount", [500, 820_000]), pick("reason", ["requested_by_customer", "duplicate", "fraudulent"]), pick("status", ["succeeded", "succeeded", "pending"]), time("created"),
] }
// prettier-ignore
const STRIPE_CUSTOMERS: DatasetSeed = { name: "customers", kind: "resource", rows: 912_004, rowBytes: 300, cursor: "created", columns: [
  id("id", "cus_", true), text("email", EMAILS, true), text("name", NAMES, true), pick("country", ["US", "GB", "DE", "NL", "IE"]), time("created"),
] }
// prettier-ignore
const STRIPE_EFW: DatasetSeed = { name: "radar.early_fraud_warnings", kind: "resource", rows: 1_284, rowBytes: 190, cursor: "created", columns: [
  id("id", "issfr_", true), id("charge", "ch_"), pick("fraud_type", ["card_never_received", "made_with_stolen_card", "unauthorized_use_of_card"]), flag("actionable"), time("created"),
] }

// prettier-ignore
const DAILY_SETTLEMENTS: DatasetSeed = { name: "finance.daily_settlements", kind: "table", rows: 412_880, rowBytes: 120, cursor: "settlement_date", consumers: ["JOB-272"], columns: [
  day("settlement_date"), id("merchant_id", "mer_"), money("gross", [80_000, 96_000_000]), money("fees", [2_400, 2_880_000]), money("net", [77_600, 93_120_000]), pick("currency", LEDGER_CCY),
] }
// prettier-ignore
const FRAUD_SCORES: DatasetSeed = { name: "risk.fraud_scores", kind: "table", rows: 210_554_190, rowBytes: 64, cursor: "scored_at", consumers: ["fraud-scorer"], columns: [
  id("charge_id", "ch_", true), num("score", [3, 982]), pick("model", ["fs-v6", "fs-v7", "fs-v7"]), pick("decision", ["allow", "allow", "allow", "review", "block"]), time("scored_at"),
] }
// prettier-ignore
const AUTH_RATES: DatasetSeed = { name: "payments.authorization_rates", kind: "view", rows: 8_760, rowBytes: 48, columns: [
  time("hour"), pick("network", ["visa", "mastercard", "amex"]), num("attempts", [8_200, 61_000]), num("approval_rate", [9_120, 9_870], 2),
] }
// prettier-ignore
const REVENUE_RECOGNITION: DatasetSeed = { name: "finance.revenue_recognition", kind: "table", rows: 52_330, rowBytes: 110, cursor: "recognized_on", columns: [
  id("invoice_id", "in_", true), day("recognized_on"), money("amount", [9_900, 4_800_000]), pick("schedule", ["ratable", "point_in_time"]),
] }
// prettier-ignore
const ATTRIBUTION: DatasetSeed = { name: "marketing.attribution", kind: "table", rows: 3_406_771, rowBytes: 96, cursor: "touched_at", columns: [
  id("session_id", "ses_", true), pick("channel", ["organic", "paid_search", "partner", "direct"]), text("ip_address", IPS, true), flag("converted"), time("touched_at"),
] }

// prettier-ignore
const MERCHANTS_TABLE: DatasetSeed = { name: "merchants", kind: "table", rows: 48_391, rowBytes: 240, cursor: "updated_at", consumers: ["JOB-240"], columns: [
  id("id", "mer_", true), text("legal_name", MERCHANTS), pick("mcc", ["5812", "5732", "4722", "5411", "8099"]), pick("country", ["US", "GB", "DE", "NL"]), pick("risk_tier", ["low", "standard", "standard", "elevated"]), time("updated_at"),
] }
// prettier-ignore
const MERCHANT_USERS: DatasetSeed = { name: "merchant_users", kind: "table", rows: 131_706, rowBytes: 180, cursor: "last_login", columns: [
  id("id", "usr_", true), id("merchant_id", "mer_"), text("email", EMAILS, true), pick("role", ["owner", "admin", "analyst", "developer"]), time("last_login"),
] }
// prettier-ignore
const MERCHANT_LIMITS: DatasetSeed = { name: "merchant_limits", kind: "table", rows: 48_391, rowBytes: 64, cursor: "updated_at", columns: [
  id("merchant_id", "mer_", true), money("daily_volume", [500_000, 250_000_000]), num("payout_hold_days", [0, 7]), time("updated_at"),
] }
// prettier-ignore
const API_KEYS: DatasetSeed = { name: "api_keys", kind: "table", rows: 96_220, rowBytes: 120, cursor: "last_used", columns: [
  id("id", "key_", true), id("merchant_id", "mer_"), pick("prefix", ["pk_live", "rk_live", "sk_live"]), flag("revoked"), time("last_used"),
] }

// prettier-ignore
const CARD_VELOCITY: DatasetSeed = { name: "features.card_velocity", kind: "table", rows: 18_402_771, rowBytes: 72, cursor: "updated_at", consumers: ["JOB-237", "fraud-scorer"], columns: [
  id("card_fingerprint", "fp_", true), num("charges_1h", [0, 14]), num("charges_24h", [0, 61]), num("distinct_merchants_24h", [0, 9]), time("updated_at"),
] }
// prettier-ignore
const DEVICE_GRAPH: DatasetSeed = { name: "features.device_graph", kind: "table", rows: 6_281_330, rowBytes: 96, cursor: "last_seen", consumers: ["JOB-237"], columns: [
  id("device_id", "dev_", true), num("linked_cards", [1, 12]), num("linked_accounts", [1, 5]), text("ip_address", IPS, true), time("last_seen"),
] }
// prettier-ignore
const IP_REPUTATION: DatasetSeed = { name: "features.ip_reputation", kind: "table", rows: 2_118_904, rowBytes: 48, cursor: "last_seen", columns: [
  text("ip_address", IPS, true), num("asn", [3_356, 64_496]), num("risk_score", [0, 100]), flag("is_proxy"), time("last_seen"),
] }
// prettier-ignore
const MERCHANT_BASELINES: DatasetSeed = { name: "features.merchant_baselines", kind: "table", rows: 48_391, rowBytes: 56, cursor: "updated_at", columns: [
  id("merchant_id", "mer_", true), money("avg_ticket", [1_800, 42_000]), num("refund_rate", [10, 640], 2), time("updated_at"),
] }

// prettier-ignore
const RATE_LIMITS: DatasetSeed = { name: "ratelimit:*", kind: "keyspace", rows: 1_284_553, rowBytes: 40, columns: [
  text("key", ["ratelimit:mer_8Hq2:charges", "ratelimit:mer_3Kd9:refunds", "ratelimit:mer_Z71x:payouts", "ratelimit:mer_Qe40:charges"]), num("count", [1, 950]), num("ttl_s", [2, 60]),
] }
// prettier-ignore
const IDEMPOTENCY: DatasetSeed = { name: "idempotency:*", kind: "keyspace", rows: 3_906_118, rowBytes: 380, columns: [
  text("key", ["idempotency:7f3a9c21", "idempotency:b18e40d7", "idempotency:2c9f11ae", "idempotency:e04d7b62"]), pick("status", ["completed", "completed", "in_flight"]), num("response_code", [200, 409]), num("ttl_s", [600, 86_400]),
] }
// prettier-ignore
const SESSIONS: DatasetSeed = { name: "session:*", kind: "keyspace", rows: 211_904, rowBytes: 520, columns: [
  text("key", ["session:4a7e01", "session:91bd3c", "session:0fe842"]), text("user_email", EMAILS, true), num("ttl_s", [60, 43_200]),
] }

// prettier-ignore
const GH_DEPLOYMENTS: DatasetSeed = { name: "deployments", kind: "resource", rows: 18_204, rowBytes: 340, cursor: "created_at", consumers: ["deployments"], columns: [
  num("id", [1_840_000_000, 1_849_999_999]), pick("repository", ["payments-api", "ledger-worker", "fraud-scorer", "webhook-dispatcher"]), pick("ref", ["v2.41.0", "v1.18.3", "v3.9.0", "v5.2.1"]), pick("environment", ["production", "staging", "sandbox"]), text("creator", ["emma-wilson", "github-actions[bot]", "argo-rollouts[bot]"]), time("created_at"),
] }
// prettier-ignore
const GH_PULLS: DatasetSeed = { name: "pull_requests", kind: "resource", rows: 46_117, rowBytes: 900, cursor: "updated_at", columns: [
  num("number", [3_100, 4_380]), pick("repository", ["payments-api", "ledger-worker", "fraud-scorer"]), text("title", ["Retry acquirer timeouts with jitter", "Partition ledger_entries by month", "Add fs-v7 feature flags", "Bump pg driver to 8.13"]), pick("state", ["merged", "merged", "open", "closed"]), time("updated_at"),
] }
// prettier-ignore
const GH_RUNS: DatasetSeed = { name: "workflow_runs", kind: "resource", rows: 912_448, rowBytes: 610, cursor: "run_started_at", columns: [
  num("id", [11_200_000_000, 11_299_999_999]), pick("workflow", ["ci", "ci", "deploy", "nightly-e2e"]), pick("conclusion", ["success", "success", "success", "failure", "cancelled"]), num("duration_s", [48, 1_420]), time("run_started_at"),
] }
// prettier-ignore
const GH_ISSUES: DatasetSeed = { name: "issues", kind: "resource", rows: 8_441, rowBytes: 1_200, cursor: "updated_at", columns: [
  num("number", [1_200, 2_960]), pick("repository", ["payments-api", "ledger-worker"]), text("title", ["Flaky refund webhook test", "Ledger lag alert too noisy", "Document payout hold reasons"]), json("labels", ['["bug","p2"]', '["infra"]', '["docs"]']), time("updated_at"),
] }

// prettier-ignore
const LINEAR_ISSUES: DatasetSeed = { name: "issues", kind: "resource", rows: 12_906, rowBytes: 820, cursor: "updatedAt", columns: [
  text("identifier", ["SRE-1182", "SRE-1179", "PLAT-640", "RISK-311", "SRE-1174"]), text("title", ["Webhook retry storm follow up", "Rotate risk store credentials", "Ledger worker memory limit", "Tune card velocity window"]), pick("priority", ["urgent", "high", "medium", "low"]), pick("state", ["triage", "in_progress", "in_review", "done"]), time("updatedAt"),
] }
// prettier-ignore
const LINEAR_CYCLES: DatasetSeed = { name: "cycles", kind: "resource", rows: 96, rowBytes: 240, columns: [
  num("number", [38, 42]), day("startsAt"), day("endsAt"), num("completedScope", [18, 64]),
] }
// prettier-ignore
const LINEAR_PROJECTS: DatasetSeed = { name: "projects", kind: "resource", rows: 58, rowBytes: 600, columns: [
  text("name", ["Postgres 16 upgrade", "fs-v7 rollout", "Payout holds v2"]), pick("state", ["started", "planned", "completed"]), num("progress", [0, 100]), day("targetDate"),
] }

// prettier-ignore
const SLACK_CHANNELS: DatasetSeed = { name: "channels", kind: "resource", rows: 14, rowBytes: 200, columns: [
  id("id", "C0", true), text("name", ["#sre-oncall", "#deploys", "#payments-alerts", "#risk-ops", "#data-platform"]), num("members", [6, 140]), flag("is_private"), time("created"),
] }
// prettier-ignore
const SLACK_MESSAGES: DatasetSeed = { name: "messages", kind: "resource", rows: 1_208_440, rowBytes: 700, cursor: "ts", columns: [
  text("ts", ["1727619583.004119", "1727619421.002210", "1727618904.000318"]), pick("channel", ["#sre-oncall", "#deploys", "#payments-alerts"]), text("text", ["Ack, looking at the ledger lag now", "Promoting payments-api v2.41.0", "Risk store creds rotated upstream?"], true), time("posted_at"),
] }

// prettier-ignore
const CLOSE_SHEET: DatasetSeed = { name: "Month-end close 2026-09", kind: "sheet", rows: 2_418, rowBytes: 160, columns: [
  id("entry_id", "je_", true), text("account", ["4000 Revenue", "2100 Merchant payables", "1200 Settlement clearing", "5100 Network fees"]), money("debit", [0, 9_600_000]), money("credit", [0, 9_600_000]), text("memo", ["Card network fees, Sep", "Chase settlement true up", "Reserve release, Atlas Grocers"]), day("posted_on"),
] }
// prettier-ignore
const CHARGEBACK_SHEET: DatasetSeed = { name: "Chargeback ledger", kind: "sheet", rows: 6_903, rowBytes: 140, columns: [
  id("case_id", "cb_", true), text("merchant", MERCHANTS), money("amount", [1_500, 640_000]), pick("outcome", ["won", "lost", "pending"]), day("opened_on"),
] }
// prettier-ignore
const FX_OVERRIDES: DatasetSeed = { name: "FX overrides", kind: "sheet", rows: 64, rowBytes: 90, columns: [
  pick("pair", ["EUR/USD", "GBP/USD", "USD/JPY"]), num("rate", [10_710, 14_980], 4), text("approved_by", ["Priya Patel", "Sofia Romero"]), day("effective"),
] }

// prettier-ignore
const CHASE_FILES: DatasetSeed = { name: "/settlements/chase", kind: "folder", rows: 2_204_118, rowBytes: 110, cursor: "value_date", consumers: ["JOB-219"], columns: [
  text("file", ["CHASE_20260929_1300.csv", "CHASE_20260929_1200.csv", "CHASE_20260929_1100.csv"]), id("record_id", "srec_", true), money("amount", [2_000, 14_800_000]), pick("status", ["matched", "matched", "matched", "unmatched"]), day("value_date"),
] }
// prettier-ignore
const BARCLAYS_FILES: DatasetSeed = { name: "/settlements/barclays", kind: "folder", rows: 1_118_402, rowBytes: 110, cursor: "value_date", consumers: ["JOB-219"], columns: [
  text("file", ["BARC_20260929_1300.csv", "BARC_20260929_1200.csv", "BARC_20260928_2100.csv"]), id("record_id", "srec_", true), money("amount", [2_000, 9_200_000]), pick("status", ["matched", "matched", "unmatched"]), day("value_date"),
] }
// prettier-ignore
const ARCHIVE_FILES: DatasetSeed = { name: "/settlements/archive", kind: "folder", rows: 31_480_220, rowBytes: 110, columns: [
  text("file", ["CHASE_20250930_2300.csv", "BARC_20250930_2300.csv"]), id("record_id", "srec_", true), money("amount", [2_000, 14_800_000]), day("value_date"),
] }

// ── Integrations ──

export type Integration = {
  label: string
  /** What it speaks: "Postgres", "REST API". */
  engine: string
  category: IntegrationCategory
  auth: AuthKind
  /** Endpoint field label and placeholder on the form. */
  endpointLabel: string
  endpointHint: string
  principal: string
  frequency: SyncFrequency
  logo: ReactNode
  /** Discovered by a successful test; the New Connection sheet links from these. */
  starter: DatasetSeed[]
}

// prettier-ignore
export const INTEGRATIONS: Record<IntegrationId, Integration> = {
  neon:        { label: "Neon",         engine: "Postgres",       category: "database",  auth: "password",       endpointLabel: "Host",         endpointHint: "ep-name.us-east-1.aws.neon.tech",  principal: "harbor_sync",                    frequency: "15m",      logo: <Neon aria-hidden="true" />,        starter: [LEDGER_ENTRIES, LEDGER_ACCOUNTS, LEDGER_TRANSFERS] },
  planetscale: { label: "PlanetScale",  engine: "MySQL",          category: "database",  auth: "password",       endpointLabel: "Host",         endpointHint: "aws.connect.psdb.cloud",            principal: "harbor-readonly",                frequency: "1h",
    logo: (<><Planetscale className="dark:hidden" aria-hidden="true" /><PlanetscaleDark className="hidden dark:block" aria-hidden="true" /></>), starter: [MERCHANTS_TABLE, MERCHANT_USERS, MERCHANT_LIMITS] },
  supabase:    { label: "Supabase",     engine: "Postgres",       category: "database",  auth: "password",       endpointLabel: "Host",         endpointHint: "db.project-ref.supabase.co",        principal: "harbor_sync",                    frequency: "15m",      logo: <Supabase aria-hidden="true" />,    starter: [CARD_VELOCITY, DEVICE_GRAPH, IP_REPUTATION] },
  redis:       { label: "Redis",        engine: "Redis 7",        category: "database",  auth: "password",       endpointLabel: "Host",         endpointHint: "redis.internal:6380",               principal: "harbor-ro",                      frequency: "realtime", logo: <Redis aria-hidden="true" />,       starter: [RATE_LIMITS, IDEMPOTENCY] },
  bigquery:    { label: "BigQuery",     engine: "Google Cloud",   category: "warehouse", auth: "serviceAccount", endpointLabel: "Project",      endpointHint: "project-id",                        principal: "harbor-sync service account",    frequency: "6h",       logo: <GoogleCloud aria-hidden="true" />, starter: [DAILY_SETTLEMENTS, FRAUD_SCORES, AUTH_RATES] },
  stripe:      { label: "Stripe",       engine: "REST API",       category: "app",       auth: "apiKey",         endpointLabel: "Account",      endpointHint: "acct_...",                          principal: "Restricted key, read only",      frequency: "1h",       logo: <Stripe aria-hidden="true" />,      starter: [STRIPE_BALANCE, STRIPE_CHARGES, STRIPE_PAYOUTS, STRIPE_DISPUTES] },
  github:      { label: "GitHub",       engine: "REST API",       category: "app",       auth: "githubApp",      endpointLabel: "Organization", endpointHint: "github.com/org",                    principal: "Harbor Ops GitHub App",          frequency: "15m",
    logo: (<><GithubLight className="dark:hidden" aria-hidden="true" /><GithubDark className="hidden dark:block" aria-hidden="true" /></>), starter: [GH_DEPLOYMENTS, GH_PULLS, GH_RUNS] },
  linear:      { label: "Linear",       engine: "GraphQL API",    category: "app",       auth: "oauth",          endpointLabel: "Workspace",    endpointHint: "linear.app/workspace",              principal: "OAuth app",                      frequency: "1h",       logo: <Linear aria-hidden="true" />,      starter: [LINEAR_ISSUES, LINEAR_CYCLES] },
  slack:       { label: "Slack",        engine: "Web API",        category: "app",       auth: "oauth",          endpointLabel: "Workspace",    endpointHint: "workspace.slack.com",               principal: "Harbor Ops bot",                 frequency: "15m",      logo: <Slack aria-hidden="true" />,       starter: [SLACK_CHANNELS, SLACK_MESSAGES] },
  googleDrive: { label: "Google Drive", engine: "Sheets API",     category: "files",     auth: "serviceAccount", endpointLabel: "Shared drive", endpointHint: "Shared drive name",                 principal: "drive-sync service account",     frequency: "24h",      logo: <GoogleDrive aria-hidden="true" />, starter: [CLOSE_SHEET, CHARGEBACK_SHEET] },
  dropbox:     { label: "Dropbox",      engine: "Files API",      category: "files",     auth: "oauth",          endpointLabel: "Folder",       endpointHint: "/Team folder/path",                 principal: "harbor-settlements app",         frequency: "1h",       logo: <Dropbox aria-hidden="true" />,     starter: [CHASE_FILES, BARCLAYS_FILES] },
}

export const INTEGRATION_IDS = [
  "neon",
  "planetscale",
  "supabase",
  "redis",
  "bigquery",
  "stripe",
  "github",
  "linear",
  "slack",
  "googleDrive",
  "dropbox",
] satisfies IntegrationId[]

export const INTEGRATION_OPTIONS = INTEGRATION_IDS.map((value) => ({
  value,
  label: INTEGRATIONS[value].label,
}))

export const categoryOf = (connection: Pick<Connection, "integration">) =>
  INTEGRATIONS[connection.integration].category

// ── Seed ──

/** "s" succeeded, "p" slow or partial, "f" failed, "x" paused, "-" none due. */
type RawConnection = {
  id: string
  name: string
  integration: IntegrationId
  environment: Environment
  endpoint: string
  frequency: SyncFrequency
  ownerId: PersonId
  createdAt: string
  credential: {
    hint: string
    principal?: string
    rotatedAt: string
    rotatedBy: Credential["rotatedBy"]
    expiresAt?: string
  }
  health: Health
  issue?: string
  failingSince?: string
  paused?: { at: string; by: PersonId; note: string }
  alertOnFailure?: boolean
  pattern: string
  /** Minute past the hour hourly runs start at. */
  offsetMin: number
  rowsPerRun: number
  durationSec: number
  /** Message failed runs carry when it differs from the issue. */
  failureNote?: string
  /** [seed, linked, drifted columns]. */
  datasets: [DatasetSeed, boolean, ColumnSpec[]?][]
  discoverable?: DatasetSeed[]
}

// prettier-ignore
const RAW_CONNECTIONS: RawConnection[] = [
  { id: "CON-101", name: "ledger-primary", integration: "neon", environment: "production", endpoint: "ep-quiet-harbor-41.us-east-1.aws.neon.tech", frequency: "15m", ownerId: "alex", createdAt: "2025-11-04T10:12:00Z",
    credential: { hint: "••••a71c", rotatedAt: "2026-09-01T05:01:00Z", rotatedBy: "JOB-290" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 0, rowsPerRun: 9_200, durationSec: 38,
    datasets: [[LEDGER_ENTRIES, true], [LEDGER_ACCOUNTS, true], [LEDGER_TRANSFERS, true], [PAYOUT_HOLDS, true], [FX_RATES, false], [SCHEMA_MIGRATIONS, false]],
    discoverable: [LEDGER_SNAPSHOTS] },
  { id: "CON-102", name: "stripe-live", integration: "stripe", environment: "production", endpoint: "acct_1Q8xLumenHarbor", frequency: "1h", ownerId: "david", createdAt: "2025-10-21T15:40:00Z",
    credential: { hint: "rk_live_••••9f2c", rotatedAt: "2026-08-14T09:30:00Z", rotatedBy: "david" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 5, rowsPerRun: 14_600, durationSec: 96,
    datasets: [[STRIPE_BALANCE, true], [STRIPE_CHARGES, true], [STRIPE_PAYOUTS, true], [STRIPE_DISPUTES, true], [STRIPE_REFUNDS, false], [STRIPE_CUSTOMERS, false]],
    discoverable: [STRIPE_EFW] },
  { id: "CON-103", name: "analytics-warehouse", integration: "bigquery", environment: "production", endpoint: "lumen-harbor-analytics", frequency: "6h", ownerId: "sofia", createdAt: "2025-12-02T11:05:00Z",
    credential: { hint: "key ••••3e8d", rotatedAt: "2026-07-19T13:22:00Z", rotatedBy: "sofia" },
    health: "degraded", issue: "Loads take 41m against a 30m budget; slot quota at 92%", pattern: "---s-----s-----p-----p--", offsetMin: 0, rowsPerRun: 1_240_000, durationSec: 2_460,
    datasets: [[DAILY_SETTLEMENTS, true], [FRAUD_SCORES, true], [AUTH_RATES, true], [REVENUE_RECOGNITION, false], [ATTRIBUTION, false]] },
  { id: "CON-104", name: "merchant-directory", integration: "planetscale", environment: "production", endpoint: "aws.connect.psdb.cloud/merchant-directory", frequency: "1h", ownerId: "priya", createdAt: "2026-01-12T09:00:00Z",
    credential: { hint: "pscale_pw_••••d204", rotatedAt: "2026-09-03T16:10:00Z", rotatedBy: "priya" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 10, rowsPerRun: 620, durationSec: 14,
    datasets: [[MERCHANTS_TABLE, true], [MERCHANT_USERS, true], [MERCHANT_LIMITS, true], [API_KEYS, false]] },
  { id: "CON-105", name: "risk-feature-store", integration: "supabase", environment: "production", endpoint: "db.xqzrhvkt.supabase.co", frequency: "15m", ownerId: "kenji", createdAt: "2026-03-08T14:30:00Z",
    credential: { hint: "••••77e0", rotatedAt: "2026-06-30T08:00:00Z", rotatedBy: "kenji" },
    health: "failing", issue: "password authentication failed for user harbor_sync", failingSince: "2026-09-29T13:00:00Z", pattern: "ssssssssssssssssssssssff", offsetMin: 0, rowsPerRun: 22_400, durationSec: 52,
    datasets: [[CARD_VELOCITY, true], [DEVICE_GRAPH, true], [IP_REPUTATION, true], [MERCHANT_BASELINES, false]] },
  { id: "CON-106", name: "rate-limit-cache", integration: "redis", environment: "production", endpoint: "redis-prod.harbor.internal:6380", frequency: "realtime", ownerId: "michael", createdAt: "2026-02-17T10:45:00Z",
    credential: { hint: "••••5b19", rotatedAt: "2026-09-01T05:03:00Z", rotatedBy: "JOB-290" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 0, rowsPerRun: 5_100, durationSec: 4,
    datasets: [[RATE_LIMITS, true], [IDEMPOTENCY, true], [SESSIONS, false]] },
  { id: "CON-107", name: "harbor-github", integration: "github", environment: "production", endpoint: "github.com/lumen-harbor", frequency: "15m", ownerId: "emma", createdAt: "2025-10-02T12:00:00Z",
    credential: { hint: "installation 51208833", rotatedAt: "2026-04-11T10:00:00Z", rotatedBy: "emma" },
    health: "healthy", pattern: "ssssssssssspssssssssssss", offsetMin: 0, rowsPerRun: 310, durationSec: 22, failureNote: "GitHub API secondary rate limit, resumed after 60s",
    datasets: [[GH_DEPLOYMENTS, true], [GH_PULLS, true], [GH_RUNS, true], [GH_ISSUES, false]] },
  { id: "CON-108", name: "incident-tracker", integration: "linear", environment: "production", endpoint: "linear.app/lumen-harbor", frequency: "1h", ownerId: "nina", createdAt: "2026-04-28T08:20:00Z",
    credential: { hint: "lin_oauth_••••c0de", principal: "OAuth as Nina Santos", rotatedAt: "2026-07-07T11:00:00Z", rotatedBy: "nina", expiresAt: "2026-10-05T11:00:00Z" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 15, rowsPerRun: 42, durationSec: 6,
    datasets: [[LINEAR_ISSUES, true], [LINEAR_CYCLES, false], [LINEAR_PROJECTS, false]] },
  { id: "CON-109", name: "sre-slack", integration: "slack", environment: "production", endpoint: "lumen-harbor.slack.com", frequency: "15m", ownerId: "omar", createdAt: "2026-05-19T17:00:00Z",
    credential: { hint: "xoxb-••••41aa", rotatedAt: "2026-05-19T17:00:00Z", rotatedBy: "omar" },
    health: "healthy", paused: { at: "2026-09-28T19:00:00Z", by: "omar", note: "Held for the Enterprise Grid migration" }, pattern: "ssssxxxxxxxxxxxxxxxxxxxx", offsetMin: 0, rowsPerRun: 1_180, durationSec: 11,
    datasets: [[SLACK_CHANNELS, true], [SLACK_MESSAGES, true]] },
  { id: "CON-110", name: "finance-close-sheets", integration: "googleDrive", environment: "production", endpoint: "Finance Close", frequency: "24h", ownerId: "sofia", createdAt: "2026-06-03T09:10:00Z",
    credential: { hint: "key ••••19b2", rotatedAt: "2026-06-03T09:10:00Z", rotatedBy: "sofia" },
    health: "healthy", pattern: "-----------s------------", offsetMin: 0, rowsPerRun: 9_321, durationSec: 31,
    datasets: [[CLOSE_SHEET, true, [money("fx_adjustment", [-48_000, 48_000]), text("settlement_bank", ["Chase", "Barclays"])]], [CHARGEBACK_SHEET, true], [FX_OVERRIDES, false]] },
  { id: "CON-111", name: "bank-settlement-files", integration: "dropbox", environment: "production", endpoint: "/Lumen Harbor/Settlements", frequency: "1h", ownerId: "alex", createdAt: "2026-02-02T13:40:00Z",
    credential: { hint: "sl.••••8d1f", principal: "harbor-settlements app", rotatedAt: "2026-08-29T10:15:00Z", rotatedBy: "alex", expiresAt: "2026-12-27T10:15:00Z" },
    health: "healthy", pattern: "sssssssfssssssssssssssss", offsetMin: 2, rowsPerRun: 9_480, durationSec: 44, failureNote: "BARC_20260928_2100.csv: header row missing, file skipped",
    datasets: [[CHASE_FILES, true], [BARCLAYS_FILES, true], [ARCHIVE_FILES, false]] },
  { id: "CON-112", name: "ledger-staging", integration: "neon", environment: "staging", endpoint: "ep-calm-tide-07.us-east-1.aws.neon.tech", frequency: "1h", ownerId: "alex", createdAt: "2026-03-30T10:00:00Z",
    credential: { hint: "••••0c3b", rotatedAt: "2026-09-01T05:04:00Z", rotatedBy: "JOB-290" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 12, rowsPerRun: 2_050, durationSec: 18,
    datasets: [[{ ...LEDGER_ENTRIES, rows: 1_204_559, consumers: [] }, true], [{ ...LEDGER_ACCOUNTS, rows: 4_120 }, true], [{ ...LEDGER_TRANSFERS, rows: 88_310 }, false]] },
  { id: "CON-113", name: "stripe-sandbox", integration: "stripe", environment: "sandbox", endpoint: "acct_1Q8xLumenHarbor (test mode)", frequency: "1h", ownerId: "david", createdAt: "2026-01-09T16:25:00Z",
    credential: { hint: "rk_test_••••0b7e", rotatedAt: "2026-01-09T16:25:00Z", rotatedBy: "david" },
    health: "healthy", pattern: "ssssssssssssssssssssssss", offsetMin: 8, rowsPerRun: 310, durationSec: 9,
    datasets: [[{ ...STRIPE_CHARGES, rows: 64_208 }, true], [{ ...STRIPE_PAYOUTS, rows: 912 }, true], [{ ...STRIPE_DISPUTES, rows: 140, consumers: [] }, false]] },
]

// ── Deterministic generation ──

/** Small seeded PRNG: the same seed always yields the same demo. */
function prng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function hashOf(text: string) {
  let hash = 2_166_136_261
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

const RUNS_PER_HOUR: Record<SyncFrequency, number> = {
  realtime: 12,
  "15m": 4,
  "1h": 1,
  "6h": 1,
  "24h": 1,
}
const RUN_HISTORY = 8
const OUTCOME_OF: Record<string, HourOutcome> = {
  s: "succeeded",
  p: "partial",
  f: "failed",
  x: "skipped",
  "-": "none",
}

/** Run start minutes inside an hour; the current hour stops at the reference. */
function slotsIn(raw: Pick<RawConnection, "frequency" | "offsetMin">) {
  const count = RUNS_PER_HOUR[raw.frequency]
  const step = 60 / count
  return Array.from(
    { length: count },
    (_, index) => (raw.offsetMin + index * step) % 60
  ).sort((a, b) => a - b)
}

function historyOf(raw: RawConnection) {
  const random = prng(hashOf(raw.id))
  const hours: HourCell[] = []
  const runs: SyncRun[] = []
  // Seed run ids stay below the store's RUN-64000 counter.
  let seq = 58_000 + (Number(raw.id.slice(4)) - 100) * 400
  for (let index = 0; index < HOURS; index++) {
    const start = CURRENT_HOUR_MS - (HOURS - 1 - index) * HOUR_MS
    const outcome = OUTCOME_OF[raw.pattern[index]] ?? "none"
    const slots = slotsIn(raw).filter(
      (minute) => start + minute * MINUTE_MS < REFERENCE_MS
    )
    const ran = outcome === "none" || outcome === "skipped" ? [] : slots
    let rows = 0
    let failed = 0
    for (const minute of ran) {
      const share = outcome === "failed" ? 0 : outcome === "partial" ? 0.55 : 1
      const runRows = Math.round(
        raw.rowsPerRun * (0.7 + random() * 0.6) * share
      )
      const slow = outcome === "partial" ? 1.4 : 1
      rows += runRows
      if (outcome === "failed") failed += 1
      runs.push({
        id: `RUN-${++seq}`,
        startedAt:
          start + minute * MINUTE_MS + Math.round(random() * 40) * 1000,
        durationSec: Math.round(
          raw.durationSec * (0.8 + random() * 0.4) * slow
        ),
        rows: runRows,
        outcome:
          outcome === "partial"
            ? "partial"
            : outcome === "failed"
              ? "failed"
              : "succeeded",
        message:
          outcome === "failed"
            ? (raw.failureNote ?? raw.issue)
            : outcome === "partial"
              ? (raw.failureNote ?? raw.issue)
              : undefined,
      })
    }
    hours.push({
      start,
      outcome,
      runs: ran.length,
      failed,
      rows,
    })
  }
  return {
    hours,
    runs: runs.sort((a, b) => b.startedAt - a.startedAt).slice(0, RUN_HISTORY),
  }
}

export function datasetOf(
  connectionId: string,
  seed: DatasetSeed,
  linked: boolean,
  syncedAt: number | null,
  drift: ColumnSpec[] = []
): Dataset {
  return {
    ...seed,
    id: `${connectionId}:${seed.name}`,
    linked,
    syncedAt: linked ? syncedAt : null,
    drift,
    discovered: false,
  }
}

/** Newest run that moved data: the time a dataset was last current. */
export const lastGoodSync = (runs: SyncRun[]) =>
  runs.find((run) => run.outcome !== "failed")?.startedAt ?? null

function seedConnections(): Connection[] {
  return RAW_CONNECTIONS.map((raw) => {
    const { hours, runs } = historyOf(raw)
    const synced = lastGoodSync(runs)
    return {
      id: raw.id,
      name: raw.name,
      integration: raw.integration,
      environment: raw.environment,
      endpoint: raw.endpoint,
      frequency: raw.frequency,
      ownerId: raw.ownerId,
      health: raw.health,
      issue: raw.issue,
      failingSince: raw.failingSince ? Date.parse(raw.failingSince) : undefined,
      paused: raw.paused !== undefined,
      pausedAt: raw.paused ? Date.parse(raw.paused.at) : undefined,
      pausedBy: raw.paused?.by,
      pauseNote: raw.paused?.note,
      syncing: false,
      alertOnFailure: raw.alertOnFailure ?? true,
      credential: {
        kind: INTEGRATIONS[raw.integration].auth,
        hint: raw.credential.hint,
        principal:
          raw.credential.principal ?? INTEGRATIONS[raw.integration].principal,
        rotatedAt: Date.parse(raw.credential.rotatedAt),
        rotatedBy: raw.credential.rotatedBy,
        expiresAt: raw.credential.expiresAt
          ? Date.parse(raw.credential.expiresAt)
          : null,
      },
      createdAt: Date.parse(raw.createdAt),
      hours,
      runs,
      rowsPerRun: raw.rowsPerRun,
      durationSec: raw.durationSec,
      datasets: raw.datasets.map(([seed, linked, drift]) =>
        datasetOf(raw.id, seed, linked, synced, drift)
      ),
      discoverable: raw.discoverable ?? [],
    }
  })
}

export const CONNECTIONS: Connection[] = seedConnections()

export const LAST_SEED_CONNECTION = Math.max(
  ...CONNECTIONS.map((connection) => Number(connection.id.slice(4)))
)

/** An empty day for a connection that has not synced yet. */
export function emptyHours(): HourCell[] {
  return Array.from({ length: HOURS }, (_, index) => ({
    start: CURRENT_HOUR_MS - (HOURS - 1 - index) * HOUR_MS,
    outcome: "none" as const,
    runs: 0,
    failed: 0,
    rows: 0,
  }))
}

export const newConnectionDraft = (
  integration: IntegrationId
): ConnectionDraft => ({
  name: "",
  environment: "production",
  endpoint: "",
  frequency: INTEGRATIONS[integration].frequency,
  ownerId: CURRENT_USER_ID,
  alertOnFailure: true,
})

export const draftOf = (connection: Connection): ConnectionDraft => ({
  name: connection.name,
  environment: connection.environment,
  endpoint: connection.endpoint,
  frequency: connection.frequency,
  ownerId: connection.ownerId,
  alertOnFailure: connection.alertOnFailure,
})

// ── Derived state ──

export function statusOf(connection: Connection): ConnectionStatus {
  if (connection.syncing) return "syncing"
  if (connection.paused) return "paused"
  if (connection.health === "failing") return "failing"
  if (connection.health === "degraded") return "degraded"
  if (connection.health === "pending") return "pending"
  return "healthy"
}

/** Failing first, then degraded, paused and the rest, each by name. */
export function triageOrder(connections: Connection[]) {
  return [...connections].sort(
    (a, b) =>
      STATUS_ORDER.indexOf(statusOf(a)) - STATUS_ORDER.indexOf(statusOf(b)) ||
      a.name.localeCompare(b.name)
  )
}

export const rowsOf = (connection: Connection) =>
  connection.hours.reduce((sum, hour) => sum + hour.rows, 0)

export const failedRunsOf = (connection: Connection) =>
  connection.hours.reduce((sum, hour) => sum + hour.failed, 0)

export const linkedOf = (connection: Connection) =>
  connection.datasets.filter((dataset) => dataset.linked)

/** When the token stops working, inside the warning window; else null. */
export function expiringIn(connection: Connection) {
  const { expiresAt } = connection.credential
  if (expiresAt === null) return null
  const left = expiresAt - REFERENCE_MS
  return left <= EXPIRY_WARN_MS ? left : null
}

/** The next scheduled run, or null while streaming or paused. */
export function nextSyncAt(connection: Connection) {
  const every = FREQUENCIES[connection.frequency].everyMs
  if (connection.paused || every === null) return null
  const last = connection.runs[0]?.startedAt ?? connection.createdAt
  let next = last + every
  while (next <= REFERENCE_MS) next += every
  return next
}

export const bytesOf = (dataset: Pick<Dataset, "rows" | "rowBytes">) =>
  dataset.rows * dataset.rowBytes

// ── Sample rows ──

export const PREVIEW_ROWS = 8

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function sampleValue(
  spec: ColumnSpec,
  random: () => number,
  rowIndex: number,
  gapMs: number
): SampleValue {
  const from = (values: string[]) =>
    values[Math.floor(random() * values.length)]
  switch (spec.type) {
    case "id":
      return `${spec.prefix ?? ""}${Array.from({ length: 10 }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join("")}`
    case "text":
    case "enum":
    case "json":
      return from(spec.values ?? [spec.name])
    case "number": {
      const [min, max] = spec.range ?? [0, 100]
      const raw = min + Math.floor(random() * (max - min + 1))
      return spec.decimals ? raw / 10 ** spec.decimals : raw
    }
    case "money": {
      const [min, max] = spec.range ?? [0, 100_000]
      return min + Math.floor(random() * (max - min + 1))
    }
    case "timestamp":
    case "date": {
      const offset = (rowIndex + random()) * gapMs
      return spec.future ? REFERENCE_MS + offset : REFERENCE_MS - offset
    }
    case "boolean":
      return random() < 0.78
  }
}

/** Sample rows, newest first; `draw` re-rolls the sample on Refresh. */
export function sampleRows(
  dataset: Pick<Dataset, "id" | "rows" | "columns">,
  draw = 0
): SampleRow[] {
  const random = prng(hashOf(`${dataset.id}#${draw}`))
  // Rows sit as far apart as the table's volume implies over three years.
  const gapMs = Math.min(
    7 * DAY_MS,
    Math.max(1_000, Math.round((3 * 365 * DAY_MS) / dataset.rows))
  )
  return Array.from({ length: PREVIEW_ROWS }, (_, rowIndex) =>
    Object.fromEntries(
      dataset.columns.map((spec) => [
        spec.name,
        sampleValue(spec, random, rowIndex, gapMs),
      ])
    )
  )
}

// ── Formatting ──

const pad = (value: number) => String(value).padStart(2, "0")
const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})
const countFormat = new Intl.NumberFormat("en-US")
const dayFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
})

export const formatCompact = (value: number) =>
  compactFormat.format(Math.round(value))

export const formatCount = (value: number) => countFormat.format(value)

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

/** Seconds as a span: "41s", "2m 14s", "1h 03m" */
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return `${total}s`
  if (total < 3600) return `${Math.floor(total / 60)}m ${pad(total % 60)}s`
  return `${Math.floor(total / 3600)}h ${pad(Math.floor((total % 3600) / 60))}m`
}

/** "14:20" UTC */
export function formatClock(ms: number) {
  const date = new Date(ms)
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

/** "Sep 29" */
export const formatDay = (ms: number) => dayFormat.format(ms)

/** "Sep 29, 14:20 UTC" */
export const formatDateTime = (ms: number) =>
  `${formatDay(ms)}, ${formatClock(ms)} UTC`

/** "in 9m", "2h 10m ago", "6d ago", "just now" */
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

/** Change against a baseline: "6.1%", or null when there is no baseline. */
export function formatDelta(current: number, previous: number) {
  if (previous === 0) return null
  const change = Math.abs((current - previous) / previous) * 100
  return `${change >= 100 ? Math.round(change) : change.toFixed(1)}%`
}

/** "6 days", "18 hours" */
export function formatSpanDays(ms: number) {
  const hours = Math.max(0, Math.round(ms / HOUR_MS))
  if (hours < 48) return plural(hours, "hour")
  return plural(Math.round(hours / 24), "day")
}

/** The cell text of a sample value, by column type. */
export function formatSample(
  spec: ColumnSpec,
  value: SampleValue,
  row: SampleRow
) {
  if (value === null) return "NULL"
  switch (spec.type) {
    case "money": {
      const currency = String(row.currency ?? "usd").toUpperCase()
      return `${(Number(value) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
    }
    case "number":
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: spec.decimals ?? 0,
        maximumFractionDigits: spec.decimals ?? 0,
      })
    case "timestamp": {
      const date = new Date(Number(value))
      return `${date.toISOString().slice(0, 10)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
    }
    case "date":
      return new Date(Number(value)).toISOString().slice(0, 10)
    case "boolean":
      return value ? "true" : "false"
    default:
      return String(value)
  }
}

/** Personal data keeps its shape and loses its content. */
export function maskSample(value: string) {
  if (value.includes("@")) {
    const [local, domain] = value.split("@")
    return `${local.slice(0, 1)}${"•".repeat(5)}@${domain}`
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) {
    return `${value.split(".").slice(0, 3).join(".")}.•••`
  }
  return value
    .split(" ")
    .map(
      (word) => `${word.slice(0, 1)}${"•".repeat(Math.max(3, word.length - 1))}`
    )
    .join(" ")
}

/** The query the preview runs, for the copy action. */
export function previewQuery(connection: Connection, dataset: Dataset) {
  const category = categoryOf(connection)
  if (category === "database" || category === "warehouse") {
    if (dataset.kind === "keyspace")
      return `SCAN 0 MATCH ${dataset.name} COUNT ${PREVIEW_ROWS}`
    const order = dataset.cursor ? ` ORDER BY ${dataset.cursor} DESC` : ""
    return `SELECT * FROM ${dataset.name}${order} LIMIT ${PREVIEW_ROWS};`
  }
  return `harbor datasets preview ${connection.id} "${dataset.name}" --limit ${PREVIEW_ROWS}`
}

/** Jobs and objectives carry an id (JOB-214); services and pages go by name. */
export const consumerHasId = (consumer: ConsumerId) =>
  consumer.startsWith("JOB-") || consumer.startsWith("SLO-")

export const consumerLabel = (consumer: ConsumerId) =>
  consumerHasId(consumer) ? consumer : CONSUMERS[consumer].label

const listFormat = new Intl.ListFormat("en-US", { type: "conjunction" })

/** "JOB-237 Refresh fraud model features and fraud-scorer" */
export const consumerSentence = (consumers: ConsumerId[]) =>
  listFormat.format(
    consumers.map((consumer) =>
      consumerHasId(consumer)
        ? `${consumer} ${CONSUMERS[consumer].label}`
        : CONSUMERS[consumer].label
    )
  )

export const plural = (count: number, noun: string, many = `${noun}s`) =>
  `${count} ${count === 1 ? noun : many}`