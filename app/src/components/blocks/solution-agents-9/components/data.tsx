import { type ReactNode } from "react"
import { LayersIcon, UserIcon, CreditCardIcon, PackageIcon, BookOpenIcon } from "lucide-react"

// Data is scoped to the agent operations world pack: MEM-74xx entries,
// RUN-48xx source runs, and the pinned support automation roster.

export type ScopeId =
  | "all"
  | "customer-facts"
  | "billing-policies"
  | "product-catalog"
  | "support-runbooks"

export type MemoryScopeId = Exclude<ScopeId, "all">
export type MemoryKind = "Preference" | "Policy" | "Procedure" | "Constraint"
export type MemoryState = "Trusted" | "Needs review" | "Stale"
export type MemoryOwnerId =
  | "maya-perez"
  | "noa-kim"
  | "emil-novak"
  | "jonas-reed"

export const MEMORY_KINDS = [
  "Preference",
  "Policy",
  "Procedure",
  "Constraint",
] as const

export interface IMemoryOwner {
  id: MemoryOwnerId
  name: string
  role: string
  initials: string
  avatar?: string
}

export interface IMemoryScope {
  id: ScopeId
  name: string
  description: string
  ownerId: MemoryOwnerId
  retention: string
  icon: ReactNode
}

export interface IMemoryEntry {
  id: string
  fact: string
  kind: MemoryKind
  scope: MemoryScopeId
  confidence: number
  state: MemoryState
  agent: string
  ownerId: MemoryOwnerId
  sourceRun: string
  sourceRunLabel: string
  updated: string
  lastUsed: string
  retrievals: number
}

export const MEMORY_OWNERS: IMemoryOwner[] = [
  {
    id: "maya-perez",
    name: "Maya Perez",
    role: "Operations lead",
    initials: "MP",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&dpr=2&q=80",
  },
  {
    id: "noa-kim",
    name: "Noa Kim",
    role: "Reliability engineer",
    initials: "NK",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&dpr=2&q=80",
  },
  {
    id: "emil-novak",
    name: "Emil Novak",
    role: "Platform engineer",
    initials: "EN",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&dpr=2&q=80",
  },
  {
    id: "jonas-reed",
    name: "Jonas Reed",
    role: "Safety reviewer",
    initials: "JR",
  },
]

export function getMemoryOwner(ownerId: MemoryOwnerId) {
  return MEMORY_OWNERS.find((owner) => owner.id === ownerId) ?? MEMORY_OWNERS[0]
}

export const MEMORY_SCOPES: IMemoryScope[] = [
  {
    id: "all",
    name: "All scopes",
    description: "18 entries indexed",
    ownerId: "maya-perez",
    retention: "90 days",
    icon: (
      <LayersIcon aria-hidden="true" />
    ),
  },
  {
    id: "customer-facts",
    name: "customer-facts",
    description: "Acme and Globex preferences",
    ownerId: "maya-perez",
    retention: "60 days",
    icon: (
      <UserIcon aria-hidden="true" />
    ),
  },
  {
    id: "billing-policies",
    name: "billing-policies",
    description: "Refund rules above 500 USD",
    ownerId: "noa-kim",
    retention: "120 days",
    icon: (
      <CreditCardIcon aria-hidden="true" />
    ),
  },
  {
    id: "product-catalog",
    name: "product-catalog",
    description: "No entries stored yet",
    ownerId: "jonas-reed",
    retention: "30 days",
    icon: (
      <PackageIcon aria-hidden="true" />
    ),
  },
  {
    id: "support-runbooks",
    name: "support-runbooks",
    description: "Refund escalation steps",
    ownerId: "emil-novak",
    retention: "90 days",
    icon: (
      <BookOpenIcon aria-hidden="true" />
    ),
  },
]

export const MEMORY_ENTRIES: IMemoryEntry[] = [
  {
    id: "MEM-7421",
    fact: "Acme Corp prefers email over phone for refunds",
    kind: "Preference",
    scope: "customer-facts",
    confidence: 96,
    state: "Trusted",
    agent: "Refund Resolver",
    ownerId: "maya-perez",
    sourceRun: "RUN-4822",
    sourceRunLabel: "Refund partial return on ORD-99102 for Acme Corp",
    updated: "12 min ago",
    lastUsed: "8 min ago",
    retrievals: 184,
  },
  {
    id: "MEM-7427",
    fact: "Refunds above 500 USD require finance approval",
    kind: "Policy",
    scope: "billing-policies",
    confidence: 98,
    state: "Trusted",
    agent: "Refund Resolver",
    ownerId: "noa-kim",
    sourceRun: "RUN-4827",
    sourceRunLabel: "Issue customer refund of 1,240 USD on ORD-99214",
    updated: "26 min ago",
    lastUsed: "17 min ago",
    retrievals: 132,
  },
  {
    id: "MEM-7430",
    fact: "Refund disputes older than 7 days need supervisor review",
    kind: "Procedure",
    scope: "support-runbooks",
    confidence: 93,
    state: "Needs review",
    agent: "Refund Resolver",
    ownerId: "emil-novak",
    sourceRun: "RUN-4830",
    sourceRunLabel: "Escalate PB-31 Refund Escalation for Globex",
    updated: "44 min ago",
    lastUsed: "31 min ago",
    retrievals: 77,
  },
  {
    id: "MEM-7415",
    fact: "Partial refunds cap at 60 percent before APR-7421",
    kind: "Constraint",
    scope: "billing-policies",
    confidence: 91,
    state: "Needs review",
    agent: "Data Steward",
    ownerId: "noa-kim",
    sourceRun: "RUN-4815",
    sourceRunLabel: "Audit refund ceiling on 42 June orders",
    updated: "1 hr ago",
    lastUsed: "54 min ago",
    retrievals: 68,
  },
  {
    id: "MEM-7434",
    fact: "Globex pays invoices through its Coupa portal",
    kind: "Procedure",
    scope: "customer-facts",
    confidence: 88,
    state: "Trusted",
    agent: "Invoice Reconciler",
    ownerId: "maya-perez",
    sourceRun: "RUN-4831",
    sourceRunLabel: "Reconcile 14 open invoices for Globex",
    updated: "1 hr ago",
    lastUsed: "44 min ago",
    retrievals: 97,
  },
  {
    id: "MEM-7428",
    fact: "Acme Corp support tier is Enterprise Plus",
    kind: "Preference",
    scope: "customer-facts",
    confidence: 39,
    state: "Needs review",
    agent: "Lead Enricher",
    ownerId: "jonas-reed",
    sourceRun: "RUN-4828",
    sourceRunLabel: "Enrich renewal profile for Acme Corp",
    updated: "2 hr ago",
    lastUsed: "1 hr ago",
    retrievals: 16,
  },
  {
    id: "MEM-7438",
    fact: "Support digest sends to 1,847 subscribers every Friday",
    kind: "Procedure",
    scope: "support-runbooks",
    confidence: 82,
    state: "Trusted",
    agent: "Outreach Composer",
    ownerId: "emil-novak",
    sourceRun: "RUN-4838",
    sourceRunLabel: "Send weekly digest to 1,847 subscribers",
    updated: "2 hr ago",
    lastUsed: "47 min ago",
    retrievals: 58,
  },
  {
    id: "MEM-7419",
    fact: "ORD-99102 uses manual refund receipts",
    kind: "Constraint",
    scope: "billing-policies",
    confidence: 76,
    state: "Stale",
    agent: "Invoice Reconciler",
    ownerId: "noa-kim",
    sourceRun: "RUN-4819",
    sourceRunLabel: "Close receipt mismatch for ORD-99102",
    updated: "3 hr ago",
    lastUsed: "2 hr ago",
    retrievals: 42,
  },
  {
    id: "MEM-7425",
    fact: "Globex ships only to bonded warehouses",
    kind: "Constraint",
    scope: "customer-facts",
    confidence: 28,
    state: "Stale",
    agent: "Data Steward",
    ownerId: "jonas-reed",
    sourceRun: "RUN-4825",
    sourceRunLabel: "Validate Globex shipping notes from March import",
    updated: "3 days ago",
    lastUsed: "2 days ago",
    retrievals: 9,
  },
  {
    id: "MEM-7322",
    fact: "Globex requests EUR quotes on EU orders",
    kind: "Preference",
    scope: "customer-facts",
    confidence: 44,
    state: "Needs review",
    agent: "Contract Summarizer",
    ownerId: "jonas-reed",
    sourceRun: "RUN-4722",
    sourceRunLabel: "Summarize Globex purchasing addendum",
    updated: "6 days ago",
    lastUsed: "4 days ago",
    retrievals: 11,
  },
  {
    id: "MEM-7440",
    fact: "APR-7421 resolves within 4 hours for finance reviewers",
    kind: "Policy",
    scope: "billing-policies",
    confidence: 72,
    state: "Trusted",
    agent: "Refund Resolver",
    ownerId: "noa-kim",
    sourceRun: "RUN-4840",
    sourceRunLabel: "Review APR-7421 approval SLA for refunds",
    updated: "7 hr ago",
    lastUsed: "3 hr ago",
    retrievals: 36,
  },
  {
    id: "MEM-7442",
    fact: "Payment tool retries stop after 3 failed 502 responses",
    kind: "Procedure",
    scope: "support-runbooks",
    confidence: 64,
    state: "Needs review",
    agent: "Data Steward",
    ownerId: "emil-novak",
    sourceRun: "RUN-4842",
    sourceRunLabel: "Backfill INC-208 payment retry notes",
    updated: "8 hr ago",
    lastUsed: "5 hr ago",
    retrievals: 23,
  },
  {
    id: "MEM-7445",
    fact: "Acme Corp finance contact replies after 14:00 UTC",
    kind: "Preference",
    scope: "customer-facts",
    confidence: 79,
    state: "Trusted",
    agent: "Invoice Reconciler",
    ownerId: "maya-perez",
    sourceRun: "RUN-4845",
    sourceRunLabel: "Reconcile 8 overdue invoices for Acme Corp",
    updated: "9 hr ago",
    lastUsed: "6 hr ago",
    retrievals: 54,
  },
  {
    id: "MEM-7448",
    fact: "Bulk EU emails require Lara Chen review above 2,480 recipients",
    kind: "Policy",
    scope: "support-runbooks",
    confidence: 71,
    state: "Trusted",
    agent: "Outreach Composer",
    ownerId: "emil-novak",
    sourceRun: "RUN-4848",
    sourceRunLabel: "Send bulk email to 2,480 EU customers",
    updated: "10 hr ago",
    lastUsed: "7 hr ago",
    retrievals: 29,
  },
  {
    id: "MEM-7452",
    fact: "Globex invoice batches close on the 20th of each month",
    kind: "Procedure",
    scope: "customer-facts",
    confidence: 83,
    state: "Trusted",
    agent: "Invoice Reconciler",
    ownerId: "maya-perez",
    sourceRun: "RUN-4852",
    sourceRunLabel: "Prepare Globex month-end invoice batch",
    updated: "12 hr ago",
    lastUsed: "8 hr ago",
    retrievals: 61,
  },
  {
    id: "MEM-7454",
    fact: "Refund Resolver checks orders.lookup before stripe.refunds.create",
    kind: "Procedure",
    scope: "support-runbooks",
    confidence: 35,
    state: "Stale",
    agent: "Refund Resolver",
    ownerId: "jonas-reed",
    sourceRun: "RUN-4854",
    sourceRunLabel: "Replay refund tool sequence for ORD-99214",
    updated: "12 days ago",
    lastUsed: "9 days ago",
    retrievals: 12,
  },
  {
    id: "MEM-7457",
    fact: "Finance notes mention invoice tax lines above 80 USD",
    kind: "Constraint",
    scope: "billing-policies",
    confidence: 67,
    state: "Needs review",
    agent: "Contract Summarizer",
    ownerId: "jonas-reed",
    sourceRun: "RUN-4857",
    sourceRunLabel: "Summarize Acme Corp finance addendum",
    updated: "16 hr ago",
    lastUsed: "11 hr ago",
    retrievals: 18,
  },
  {
    id: "MEM-7460",
    fact: "pinecone.search returns memory evidence in 180ms to 8s",
    kind: "Procedure",
    scope: "support-runbooks",
    confidence: 86,
    state: "Trusted",
    agent: "Data Steward",
    ownerId: "emil-novak",
    sourceRun: "RUN-4860",
    sourceRunLabel: "Measure memory retrieval latency across 120 daily runs",
    updated: "18 hr ago",
    lastUsed: "15 hr ago",
    retrievals: 45,
  },
]

export const INITIAL_PINNED_IDS = ["MEM-7421", "MEM-7427"]