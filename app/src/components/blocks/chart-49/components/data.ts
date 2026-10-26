export type Stage = "channel" | "journey" | "upgraded" | "dropped"

export type NodeId =
  | "docs"
  | "referrals"
  | "newsletter"
  | "marketplace"
  | "signedUp"
  | "onboarded"
  | "teamInvited"
  | "upgraded"
  | "skippedSetup"
  | "wentSolo"
  | "noUpgrade"

export type RangeId = "7d" | "30d" | "90d"

/** Raw counts for one range; drop-offs are derived. */
export type Journey = {
  id: RangeId
  label: string
  channels: Record<"docs" | "referrals" | "newsletter" | "marketplace", number>
  onboarded: number
  teamInvited: number
  upgraded: number
}

export type FlowNode = {
  id: NodeId
  name: string
  stage: Stage
  amount: number
}

export type FlowLink = { source: number; target: number; value: number }

/** One column caption, drawn above the first node of its depth. */
export type ColumnHeader = {
  title: string
  value: string
  note?: string
  focal?: boolean
}

// ── Taxonomy ──

/** Array order is the vertical order inside each column: survivors on top. */
// prettier-ignore
export const NODES: ReadonlyArray<Omit<FlowNode, "amount">> = [
  { id: "docs",         name: "Docs",           stage: "channel" },
  { id: "referrals",    name: "Referrals",      stage: "channel" },
  { id: "newsletter",   name: "Newsletter",     stage: "channel" },
  { id: "marketplace",  name: "Marketplace",    stage: "channel" },
  { id: "signedUp",     name: "Signed Up",      stage: "journey" },
  { id: "onboarded",    name: "Onboarded",      stage: "journey" },
  { id: "skippedSetup", name: "Skipped Setup",  stage: "dropped" },
  { id: "teamInvited",  name: "Team Invited",   stage: "journey" },
  { id: "wentSolo",     name: "Went Solo",      stage: "dropped" },
  { id: "upgraded",     name: "Upgraded",       stage: "upgraded" },
  { id: "noUpgrade",    name: "Didn't Upgrade", stage: "dropped" },
]

const INDEX = Object.fromEntries(
  NODES.map((node, index) => [node.id, index])
) as Record<NodeId, number>

// prettier-ignore
const EDGES: ReadonlyArray<[NodeId, NodeId]> = [
  ["docs", "signedUp"], ["referrals", "signedUp"], ["newsletter", "signedUp"], ["marketplace", "signedUp"],
  ["signedUp", "onboarded"], ["signedUp", "skippedSetup"],
  ["onboarded", "teamInvited"], ["onboarded", "wentSolo"],
  ["teamInvited", "upgraded"], ["teamInvited", "noUpgrade"],
]

// ── Seed ──

// prettier-ignore
export const JOURNEYS: ReadonlyArray<Journey> = [
  { id: "7d",  label: "7D",  channels: { docs: 2060,  referrals: 1380,  newsletter: 1140,  marketplace: 470 },  onboarded: 3390,  teamInvited: 1910,  upgraded: 742 },
  { id: "30d", label: "30D", channels: { docs: 8420,  referrals: 5960,  newsletter: 3870,  marketplace: 2150 }, onboarded: 13260, teamInvited: 7830,  upgraded: 2940 },
  { id: "90d", label: "90D", channels: { docs: 24900, referrals: 17350, newsletter: 10620, marketplace: 6840 }, onboarded: 37620, teamInvited: 21480, upgraded: 7690 },
]

export const DEFAULT_RANGE: RangeId = "30d"

// ── Derivations ──

export function countsOf(journey: Journey): Record<NodeId, number> {
  const { channels } = journey
  const signedUp =
    channels.docs +
    channels.referrals +
    channels.newsletter +
    channels.marketplace
  return {
    ...channels,
    signedUp,
    onboarded: journey.onboarded,
    teamInvited: journey.teamInvited,
    upgraded: journey.upgraded,
    // Each stage's leavers: what entered minus what moved on.
    skippedSetup: signedUp - journey.onboarded,
    wentSolo: journey.onboarded - journey.teamInvited,
    noUpgrade: journey.teamInvited - journey.upgraded,
  }
}

export function buildJourney(journey: Journey) {
  const counts = countsOf(journey)
  const nodes: FlowNode[] = NODES.map((node) => ({
    ...node,
    amount: counts[node.id],
  }))
  const links: FlowLink[] = EDGES.map(([from, to]) => ({
    source: INDEX[from],
    target: INDEX[to],
    // Channels feed signups; every later link carries its target's count.
    value: counts[to === "signedUp" ? from : to],
  }))
  const rate = (a: NodeId, b: NodeId) => counts[a] / counts[b]
  /** Captions keyed by the node that draws them. */
  const headers: Partial<Record<NodeId, ColumnHeader>> = {
    docs: { title: "Channels", value: "4 sources" },
    signedUp: { title: "Signed Up", value: formatCount(counts.signedUp) },
    onboarded: {
      title: "Onboarded",
      value: formatCount(counts.onboarded),
      note: formatRate(rate("onboarded", "signedUp")),
    },
    teamInvited: {
      title: "Team Invited",
      value: formatCount(counts.teamInvited),
      note: formatRate(rate("teamInvited", "onboarded")),
    },
    upgraded: {
      title: "Converted",
      value: formatRate(rate("upgraded", "signedUp")),
      focal: true,
    },
  }
  return { nodes, links, counts, headers }
}

/** The stage a node is measured against, for its step rate. */
export const PREVIOUS_STAGE: Partial<Record<NodeId, NodeId>> = {
  onboarded: "signedUp",
  skippedSetup: "signedUp",
  teamInvited: "onboarded",
  wentSolo: "onboarded",
  upgraded: "teamInvited",
  noUpgrade: "teamInvited",
}

/** Nodes upstream of `upFrom` and downstream of `downFrom`, both included. */
export function lineageOf(upFrom: number, downFrom: number) {
  const up = new Set<number>([upFrom])
  const down = new Set<number>([downFrom])
  const walk = (set: Set<number>, from: "source" | "target") => {
    const to = from === "source" ? "target" : "source"
    let grew = true
    while (grew) {
      grew = false
      for (const [a, b] of EDGES) {
        const edge = { source: INDEX[a], target: INDEX[b] }
        if (set.has(edge[from]) && !set.has(edge[to])) {
          set.add(edge[to])
          grew = true
        }
      }
    }
  }
  walk(down, "source")
  walk(up, "target")
  return { up, down }
}

// ── Formatting ──

export function formatCount(value: number) {
  return value.toLocaleString("en-US")
}

export function formatRate(value: number) {
  return `${(value * 100).toFixed(1)}%`
}