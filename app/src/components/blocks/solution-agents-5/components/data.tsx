import { type ReactNode } from "react"
import { type BadgeProps } from "@/components/reui/badge"
import { CreditCardIcon, SendIcon, DatabaseIcon, ReceiptTextIcon, SparklesIcon, FileTextIcon, CircleCheckIcon, InfoIcon, ZapIcon, BanknoteIcon, UsersIcon, ShieldAlertIcon, TimerIcon, UserCheckIcon, Building2Icon, LockKeyholeIcon, ShieldCheckIcon } from "lucide-react"

export type RiskTier = "high" | "medium" | "low"
export type ApprovalStatus = "pending" | "approved" | "rejected"

export type AgentName =
  | "Refund Resolver"
  | "Outreach Composer"
  | "Data Steward"
  | "Invoice Reconciler"
  | "Lead Enricher"
  | "Contract Summarizer"

export interface ApprovalReviewer {
  name: string
  role: string
  initials: string
  avatarUrl?: string
}

export interface ApprovalFact {
  label: string
  value: string
}

export interface PolicyAlert {
  tone: "warning" | "info"
  title: string
  description: string
}

export interface IApprovalRequest {
  id: string
  agent: AgentName
  action: string
  requestedAt: string
  age: string
  tool: string
  risk: RiskTier
  status: ApprovalStatus
  slaMinutesRemaining: number
  reviewer: ApprovalReviewer
  decidedAt?: string
  decidedReason?: string
  policy?: PolicyAlert
  facts: ApprovalFact[]
}

// prettier-ignore
export const RISK_LABEL: Record<RiskTier, string> = { high: "High", medium: "Medium", low: "Low" }

// prettier-ignore
export const RISK_BADGE_VARIANT: Record<RiskTier, BadgeProps["variant"]> = { high: "destructive-light", medium: "warning-light", low: "secondary" }

// prettier-ignore
export const STATUS_LABEL: Record<ApprovalStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" }

// prettier-ignore
export const STATUS_BADGE_VARIANT: Record<ApprovalStatus, BadgeProps["variant"]> = { pending: "warning-outline", approved: "success-outline", rejected: "destructive-outline" }

// prettier-ignore
export const STATUS_DOT: Record<ApprovalStatus, string> = { pending: "bg-amber-500 dark:bg-amber-400", approved: "bg-emerald-500 dark:bg-emerald-400", rejected: "bg-rose-500 dark:bg-rose-400" }

// prettier-ignore
export const STATUS_ORDER: ApprovalStatus[] = ["pending", "approved", "rejected"]

export type RiskFilter = "all" | RiskTier

// prettier-ignore
export const RISK_FILTER_OPTIONS: { value: RiskFilter; label: string }[] = [{ value: "all", label: "All risk tiers" }, { value: "high", label: "High risk" }, { value: "medium", label: "Medium risk" }, { value: "low", label: "Low risk" }]

// prettier-ignore
export const REVIEWERS: Record<"maya" | "jonas", ApprovalReviewer> = { maya: { name: "Maya Perez", role: "Operations lead", initials: "MP", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&dpr=2&q=80" }, jonas: { name: "Jonas Reed", role: "Safety reviewer", initials: "JR" } }

// prettier-ignore
export const AGENT_ICON: Record<AgentName, ReactNode> = {
  "Refund Resolver": <CreditCardIcon aria-hidden="true" />,
  "Outreach Composer": <SendIcon aria-hidden="true" />,
  "Data Steward": <DatabaseIcon aria-hidden="true" />,
  "Invoice Reconciler": <ReceiptTextIcon aria-hidden="true" />,
  "Lead Enricher": <SparklesIcon aria-hidden="true" />,
  "Contract Summarizer": <FileTextIcon aria-hidden="true" />,
}

// prettier-ignore
export const TOAST_SUCCESS_ICON = <CircleCheckIcon className="size-[18px] text-green-600" aria-hidden="true" />

// prettier-ignore
export const TOAST_INFO_ICON = <InfoIcon className="text-muted-foreground size-[18px]" aria-hidden="true" />

// prettier-ignore
export function formatSla(minutes: number, status: ApprovalStatus): { primary: string; secondary: string; tone: string } {
  if (status !== "pending") return { primary: "Decided", secondary: "No live SLA", tone: "text-muted-foreground" }
  if (minutes < 0) {
    const abs = Math.abs(minutes)
    const label = abs >= 60 ? `${Math.floor(abs / 60)}h ${abs % 60}m` : `${abs}m`
    return { primary: `Breached ${label}`, secondary: "Past the 4h review SLA", tone: "text-warning" }
  }
  if (minutes < 60) return { primary: `${minutes}m left`, secondary: "Due within the hour", tone: "text-foreground font-medium" }
  return { primary: `${Math.floor(minutes / 60)}h ${minutes % 60}m left`, secondary: "Within 4h target", tone: "text-foreground" }
}

type FactSeed = [label: string, value: string]
type ReviewerKey = keyof typeof REVIEWERS
// prettier-ignore
type ApprovalSeed = [string, AgentName, string, string, string, string, RiskTier, ApprovalStatus, number, ReviewerKey, ApprovalFact[], PolicyAlert?, string?, string?]

function facts(...items: FactSeed[]): ApprovalFact[] {
  return items.map(([label, value]) => ({ label, value }))
}

function approvalPolicy(
  tone: PolicyAlert["tone"],
  title: string,
  description: string
): PolicyAlert {
  return { tone, title, description }
}

// prettier-ignore
const APPROVAL_SEEDS: ApprovalSeed[] = [
  ["APR-7421", "Refund Resolver", "Issue $1,240 refund on ORD-99214", "04:52", "5h 8m", "stripe.refunds.create", "high", "pending", -68, "maya", facts(["Amount", "$1,240.00"], ["Order", "ORD-99214"], ["Customer", "Acme Corp"]), approvalPolicy("warning", "Above the $500 finance threshold", "Refunds over $500 need a finance second approval.")],
  ["APR-7415", "Contract Summarizer", "Share renewal summary with Globex", "08:18", "1h 42m", "kb.search", "low", "approved", 99999, "maya", facts(["Document", "Globex renewal, 14 pages"], ["Recipients", "3 Globex contacts"]), undefined, "08:54"],
  ["APR-7429", "Outreach Composer", "Send bulk email to 2,480 EU customers", "09:36", "24m", "sendgrid.mail.send", "high", "pending", 36, "maya", facts(["Recipients", "2,480 EU customers"], ["Playbook", "Renewal Outreach PB-31"], ["Send window", "10:30 to 12:00"]), approvalPolicy("warning", "Bulk send over 2,000 recipients", "Goes to 2,480 EU customers under GDPR consent rules.")],
  ["APR-7412", "Refund Resolver", "Issue $2,150 refund on ORD-99102", "08:02", "1h 58m", "stripe.refunds.create", "high", "rejected", 99999, "jonas", facts(["Amount", "$2,150.00"], ["Order", "ORD-99102"], ["Customer", "Acme Corp"]), undefined, "08:31", "No return scan on file"],
  ["APR-7427", "Data Steward", "Purge 1,290 stale lead records", "09:29", "31m", "postgres.query", "high", "pending", 54, "jonas", facts(["Records", "1,290 leads"], ["Rule", "No activity since Jan 1"]), approvalPolicy("warning", "Irreversible data deletion", "Purges 1,290 lead records with no restore path.")],
  ["APR-7428", "Lead Enricher", "Backfill titles on 312 leads", "09:14", "46m", "postgres.query", "medium", "pending", 96, "jonas", facts(["Records", "312 leads"], ["Fields", "Title, company size"], ["Source", "Events list, May 28"])],
  ["APR-7431", "Outreach Composer", "Send win-back offer to 540 churned accounts", "09:48", "12m", "sendgrid.mail.send", "medium", "pending", 142, "jonas", facts(["Recipients", "540 accounts"], ["Offer", "20% renewal credit"], ["Playbook", "Win-back PB-44"]), approvalPolicy("info", "Discount code attached", "Applies a 20% renewal credit to 540 accounts.")],
  ["APR-7430", "Invoice Reconciler", "Credit $86 on ORD-99186", "09:48", "8m", "stripe.refunds.create", "low", "pending", 198, "maya", facts(["Amount", "$86.00"], ["Order", "ORD-99186"], ["Customer", "Globex"])],
]

// prettier-ignore
export const APPROVALS: IApprovalRequest[] = APPROVAL_SEEDS.map(([id, agent, action, requestedAt, age, tool, risk, status, slaMinutesRemaining, reviewer, facts, policy, decidedAt, decidedReason]) => ({ id, agent, action, requestedAt, age, tool, risk, status, slaMinutesRemaining, reviewer: REVIEWERS[reviewer], facts, ...(policy ? { policy } : {}), ...(decidedAt ? { decidedAt } : {}), ...(decidedReason ? { decidedReason } : {}) }))

// prettier-ignore
export function getRequestSearchBlob(request: IApprovalRequest) { return [request.id, request.agent, request.action, request.tool, request.risk, request.status, request.reviewer.name].join(" ").toLowerCase() }

export interface ISummaryTile {
  title: string
  value: string
  delta: number
  positive: boolean
  sublabel: string
  liveKey?: "pending" | "overSla" | "approvedToday"
}

export const APPROVED_TODAY_BASE = 13

// prettier-ignore
export const SUMMARY: ISummaryTile[] = [
  { title: "Pending", value: "8", delta: 3, positive: false, sublabel: "Awaiting a decision", liveKey: "pending" },
  { title: "Over SLA", value: "2", delta: -4, positive: true, sublabel: "Past the 4h target", liveKey: "overSla" },
  { title: "Approved Today", value: "14", delta: 9, positive: true, sublabel: "Cleared since midnight", liveKey: "approvedToday" },
  { title: "Median Decision", value: "1h 22m", delta: -11, positive: true, sublabel: "From request to decision" },
]

export interface IDecisionEvent {
  id: string
  outcome: "approved" | "rejected"
  title: string
  reviewer: ApprovalReviewer
  elapsed: string
}

// prettier-ignore
export const RECENT_DECISIONS: IDecisionEvent[] = [
  { id: "APR-7415", outcome: "approved", title: "Renewal summary", reviewer: REVIEWERS.maya, elapsed: "1h ago" },
  { id: "APR-7412", outcome: "rejected", title: "$2,150 refund", reviewer: REVIEWERS.jonas, elapsed: "1h 30m ago" },
  { id: "APR-7409", outcome: "approved", title: "$42 credit", reviewer: REVIEWERS.maya, elapsed: "2h ago" },
  { id: "APR-7404", outcome: "rejected", title: "Lead purge held", reviewer: REVIEWERS.jonas, elapsed: "2h 40m ago" },
]

export interface IPolicyRule {
  title: string
  description: string
  icon: ReactNode
  iconBg: string
  value?: string
}

// prettier-ignore
export const POLICY: IPolicyRule[] = [
  { title: "Auto-Approve Threshold", description: "Low-risk actions run without a human reviewer.", iconBg: "bg-emerald-600", icon: <ZapIcon aria-hidden="true" /> },
  { title: "Finance Second Approval", description: "Refunds over $500 need a finance sign-off.", iconBg: "bg-indigo-600", icon: <BanknoteIcon aria-hidden="true" /> },
  { title: "Bulk Send Cap", description: "Sends above 2,000 recipients need review.", iconBg: "bg-amber-600", icon: <UsersIcon aria-hidden="true" /> },
  { title: "Irreversible Action Hold", description: "Deletes and purges pause for a human.", iconBg: "bg-rose-600", icon: <ShieldAlertIcon aria-hidden="true" /> },
  { title: "Review SLA", description: "Every request gets a decision within 4 hours.", iconBg: "bg-sky-600", icon: <TimerIcon aria-hidden="true" /> },
]

// prettier-ignore
export const COVERAGE: IPolicyRule[] = [
  { title: "Ops Lead", value: "Maya Perez", description: "Breached high-risk", iconBg: "bg-teal-600", icon: <UserCheckIcon aria-hidden="true" /> },
  { title: "Finance Desk", value: "Finance", description: "Refunds over $500", iconBg: "bg-violet-600", icon: <Building2Icon aria-hidden="true" /> },
  { title: "Privacy Review", value: "Consent", description: "EU bulk sends", iconBg: "bg-cyan-600", icon: <LockKeyholeIcon aria-hidden="true" /> },
  { title: "Safety Review", value: "Jonas Reed", description: "Destructive actions", iconBg: "bg-lime-600", icon: <ShieldCheckIcon aria-hidden="true" /> },
]