import type { ReactNode } from "react"
import type { BadgeProps } from "@/components/reui/badge"
import { DatabaseIcon, SparklesIcon, PackageIcon, ShieldCheckIcon, LayersIcon, EyeIcon, Share2Icon, ShieldAlertIcon, ActivityIcon, TrendingUp } from "lucide-react"

export type ProviderStatus = "connected" | "degraded" | "paused" | "missing_key"

export type ProviderId =
  | "PROV-2041"
  | "PROV-2042"
  | "PROV-2043"
  | "PROV-2044"
  | "PROV-2045"
  | "PROV-2046"
  | "PROV-2047"
  | "PROV-2048"

export type ProviderPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface ProviderConnection {
  id: ProviderId
  name: string
  routeId: string
  routeLabel: string
  endpoint: string
  fallbackRole: string
  credential: string
  owner: string
  latency: string
  volume: string
  status: ProviderStatus
  priority: ProviderPriority
  icon: ReactNode
}

export interface ProviderWidgetCard {
  title: string
  icon: ReactNode
  iconColor: string
  badge: { color: BadgeProps["variant"]; icon: ReactNode; text: string }
  value: string
  dateRange: string
  detailLabel: string
  detailValue: string
}

export const PROVIDER_STATUS_META: Record<
  ProviderStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  connected: { label: "Connected", variant: "success-light" },
  degraded: { label: "Degraded", variant: "warning-light" },
  paused: { label: "Paused", variant: "outline" },
  missing_key: { label: "Missing Key", variant: "destructive-light" },
}

const providerIconClassName = "size-4"

export const PROVIDER_CONNECTIONS: ProviderConnection[] = [
  {
    id: "PROV-2041",
    name: "OpenRoute Primary",
    routeId: "ROUTE-318",
    routeLabel: "Support drafting",
    endpoint: "hf://providers/openroute-primary/chat",
    fallbackRole: "Primary low-latency route",
    credential: "Key ending 4921",
    owner: "Leo Grant",
    latency: "420ms p95",
    volume: "1.8M requests/day",
    status: "connected",
    priority: 1,
    icon: (
      <DatabaseIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2042",
    name: "Northstar Claude Pool",
    routeId: "ROUTE-319",
    routeLabel: "Renewal summaries",
    endpoint: "hf://providers/northstar-claude/context",
    fallbackRole: "Fallback for long context",
    credential: "Key ending 7740",
    owner: "Mira Stone",
    latency: "12s p95 review",
    volume: "22M tokens/day",
    status: "degraded",
    priority: 2,
    icon: (
      <SparklesIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2043",
    name: "VectorEdge Small",
    routeId: "ROUTE-320",
    routeLabel: "Classifier routing",
    endpoint: "hf://providers/vectoredge-small/classify",
    fallbackRole: "Cost saver for triage",
    credential: "Key ending 3180",
    owner: "Theo Park",
    latency: "180ms p95",
    volume: "$0.18 per 1M tokens",
    status: "connected",
    priority: 3,
    icon: (
      <PackageIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2044",
    name: "Local Guardrail Runner",
    routeId: "SAFE-0914",
    routeLabel: "Safety review",
    endpoint: "hf://providers/local-guardrail/safety",
    fallbackRole: "Safety gate before tools",
    credential: "No active key",
    owner: "Nora Vale",
    latency: "6h safety SLA",
    volume: "SAFE-0914 gated",
    status: "missing_key",
    priority: 4,
    icon: (
      <ShieldCheckIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2045",
    name: "Batch Summarizer Fleet",
    routeId: "BUD-2210",
    routeLabel: "Nightly reports",
    endpoint: "hf://providers/batch-summarizer/jobs",
    fallbackRole: "Batch fallback lane",
    credential: "Key ending 2210",
    owner: "Kenji Tan",
    latency: "$11.40 per 1M tokens",
    volume: "BUD-2210 guarded",
    status: "paused",
    priority: 5,
    icon: (
      <LayersIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2046",
    name: "Atlas Vision Proxy",
    routeId: "ROUTE-452",
    routeLabel: "Image triage",
    endpoint: "hf://providers/atlas-vision/inspect",
    fallbackRole: "Vision overflow route",
    credential: "Key ending 6408",
    owner: "Sana Qureshi",
    latency: "910ms p95",
    volume: "640K images/day",
    status: "connected",
    priority: 6,
    icon: (
      <EyeIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2047",
    name: "Embedding Gateway",
    routeId: "ROUTE-487",
    routeLabel: "Retrieval context",
    endpoint: "hf://providers/embed-gateway/vector",
    fallbackRole: "Context recall fallback",
    credential: "Key ending 9044",
    owner: "Alex Johnson",
    latency: "260ms p95",
    volume: "3.4M vectors/day",
    status: "degraded",
    priority: 7,
    icon: (
      <Share2Icon className={providerIconClassName} aria-hidden="true" />
    ),
  },
  {
    id: "PROV-2048",
    name: "Canary Replay Pool",
    routeId: "SAFE-1042",
    routeLabel: "Release checks",
    endpoint: "hf://providers/canary-replay/eval",
    fallbackRole: "Redteam replay before rollout",
    credential: "No active key",
    owner: "Nora Vale",
    latency: "4h eval SLA",
    volume: "SAFE-1042 gated",
    status: "missing_key",
    priority: 8,
    icon: (
      <ShieldAlertIcon className={providerIconClassName} aria-hidden="true" />
    ),
  },
]

export const PRIORITY_OPTIONS: ProviderPriority[] = [1, 2, 3, 4, 5, 6, 7, 8]

export const ROUTE_OPTIONS = ["ROUTE-318", "SAFE-0914", "BUD-2210"] as const

export const PROVIDER_WIDGET_CARDS: ProviderWidgetCard[] = [
  {
    title: "Ready Providers",
    icon: (
      <ActivityIcon className={providerIconClassName} aria-hidden="true" />
    ),
    iconColor: "text-emerald-600",
    badge: {
      color: "success-light",
      icon: (
        <TrendingUp aria-hidden="true" />
      ),
      text: "+2",
    },
    value: "6 / 8",
    dateRange: "Connected or degraded endpoints",
    detailLabel: "Needs key",
    detailValue: "2 providers",
  },
  {
    title: "Guarded Fallbacks",
    icon: (
      <ShieldCheckIcon className={providerIconClassName} aria-hidden="true" />
    ),
    iconColor: "text-blue-600",
    badge: {
      color: "warning-light",
      icon: (
        <ShieldAlertIcon aria-hidden="true" />
      ),
      text: "2 Gaps",
    },
    value: "4",
    dateRange: "Safety routes with fallback owners",
    detailLabel: "Open gaps",
    detailValue: "2 routes",
  },
]