import type { AlertLevel, BudgetEvent, Slo, SloDay, SloStatus } from "./data"

// customize: the demo's "now"; every label and number hangs off it.
export const REFERENCE_MS = Date.parse("2026-09-29T14:20:00Z")
export const MINUTE_MS = 60_000
export const HOUR_MS = 3_600_000
export const DAY_MS = 86_400_000
export const HISTORY_DAYS = 90
const HOURLY_POINTS = 72
const MINUTE_POINTS = 12
const BUCKET_MS = 5 * MINUTE_MS
/** Under this share of budget left, an SLO is at risk. */
export const WARN_REMAINING = 0.25
/** Projected exhaustion inside this many days also puts an SLO at risk. */
const RISK_HORIZON_DAYS = 7

const TODAY_MS = Math.floor(REFERENCE_MS / DAY_MS) * DAY_MS

export const dayStartOf = (index: number) =>
  TODAY_MS - (HISTORY_DAYS - 1 - index) * DAY_MS

const dayIndexOf = (ms: number) =>
  HISTORY_DAYS -
  1 -
  Math.round((TODAY_MS - Math.floor(ms / DAY_MS) * DAY_MS) / DAY_MS)

// ── Seeded history ──

function hashOf(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32: small, fast and the same sequence for the same id. */
function randomFor(seed: string) {
  let state = hashOf(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export type SeriesSeed = {
  id: string
  /** Events per day: requests, records, or 1440 minutes for freshness. */
  volume: number
  objective: number
  /** Share of a window's budget the background error rate spends. */
  baseBurn: number
  /** Minute-counted SLIs keep a flat 1440 a day. */
  minutes: boolean
}

/** 90 days of totals and background failures, then the last 72 hours and the
 *  last hour in 5 minute buckets as bad ratios. Incidents are added on top. */
export function generateSeries({
  id,
  volume,
  objective,
  baseBurn,
  minutes,
}: SeriesSeed): Pick<Slo, "days" | "hourly" | "minutes"> {
  const random = randomFor(id)
  const between = (low: number, high: number) => low + random() * (high - low)
  const allowed = 1 - objective

  const days: SloDay[] = Array.from({ length: HISTORY_DAYS }, (_, index) => {
    const start = dayStartOf(index)
    const elapsed =
      index === HISTORY_DAYS - 1 ? (REFERENCE_MS - start) / DAY_MS : 1
    const weekday = new Date(start).getUTCDay()
    const load = minutes
      ? 1
      : (weekday === 0 || weekday === 6 ? 0.74 : 1) * between(0.93, 1.07)
    const total = Math.round(volume * load * elapsed)
    const bad = Math.round(total * allowed * baseBurn * between(0.6, 1.4))
    return { start, total, bad }
  })
  const hourly = Array.from(
    { length: HOURLY_POINTS },
    () => allowed * baseBurn * between(0.4, 1.6)
  )
  const lastHour = Array.from(
    { length: MINUTE_POINTS },
    () => allowed * baseBurn * between(0.35, 1.65)
  )
  return { days, hourly, minutes: lastHour }
}

// ── Budget events ──

export const isOngoing = (event: BudgetEvent) => event.durationMin === null

export const eventEndOf = (event: BudgetEvent) =>
  event.durationMin === null
    ? REFERENCE_MS
    : event.startedAt + event.durationMin * MINUTE_MS

/** Bad events an incident adds to [from, to), spread evenly over its span. */
function eventBadIn(event: BudgetEvent, from: number, to: number) {
  const start = event.startedAt
  const end = Math.max(eventEndOf(event), start + MINUTE_MS)
  const overlap = Math.min(end, to) - Math.max(start, from)
  return overlap > 0 ? (event.bad * overlap) / (end - start) : 0
}

const counted = (slo: Slo) => slo.events.filter((event) => !event.excluded)

// ── Window ──

export type WindowStats = {
  total: number
  bad: number
  attainment: number
  /** Bad events the objective allows over the window. */
  allowed: number
  consumed: number
  remaining: number
  /** Mean bad events per day over the last seven days. */
  dailyBad: number
  /** Days until the budget runs out at the seven day pace; null when idle. */
  daysLeft: number | null
  /** The budget as minutes of full outage. */
  downtimeMin: number
}

/** Background plus counted incident failures, per history day. */
export function dayBadOf(slo: Slo) {
  const bad = slo.days.map((day) => day.bad)
  for (const event of counted(slo)) {
    const index = dayIndexOf(event.startedAt)
    if (index >= 0 && index < bad.length) bad[index] += event.bad
  }
  return bad
}

function statsOf(slo: Slo, dayBad: number[]): WindowStats {
  const from = HISTORY_DAYS - slo.windowDays
  let total = 0
  let bad = 0
  for (let index = from; index < HISTORY_DAYS; index += 1) {
    total += slo.days[index].total
    bad += dayBad[index]
  }
  const allowed = Math.max(1, (1 - slo.objective) * total)
  const consumed = bad / allowed
  const remaining = 1 - consumed
  const recent = dayBad.slice(-7)
  const dailyBad = recent.reduce((sum, value) => sum + value, 0) / recent.length
  return {
    total,
    bad,
    attainment: total > 0 ? 1 - bad / total : 1,
    allowed,
    consumed,
    remaining,
    dailyBad,
    daysLeft:
      remaining <= 0
        ? 0
        : dailyBad > 0
          ? (remaining * allowed) / dailyBad
          : null,
    downtimeMin: (1 - slo.objective) * slo.windowDays * 1440,
  }
}

// ── Burn rates ──

export type BurnWindow = "5m" | "30m" | "1h" | "6h" | "3d"
export type BurnRates = Record<BurnWindow, number>

export type AlertRule = {
  id: "fast" | "medium" | "slow"
  label: string
  long: BurnWindow
  short: BurnWindow
  factor: number
  /** The long window's span, for what a burn at the factor spends. */
  longHours: number
  longLabel: string
  level: AlertLevel
}

// customize: the multiwindow, multi burn rate policy from the SRE workbook.
export const ALERT_RULES: AlertRule[] = [
  {
    id: "fast",
    label: "Fast Burn",
    long: "1h",
    short: "5m",
    factor: 14.4,
    longHours: 1,
    longLabel: "1 hour",
    level: "page",
  },
  {
    id: "medium",
    label: "Medium Burn",
    long: "6h",
    short: "30m",
    factor: 6,
    longHours: 6,
    longLabel: "6 hours",
    level: "page",
  },
  {
    id: "slow",
    label: "Slow Burn",
    long: "3d",
    short: "6h",
    factor: 1,
    longHours: 72,
    longLabel: "3 days",
    level: "ticket",
  },
]

/** The policy's rules by role; their factors draw every line and tick. */
export const [FAST_RULE, MEDIUM_RULE, SLOW_RULE] = ALERT_RULES

export type RuleState = {
  rule: AlertRule
  long: number
  short: number
  /** Both windows over the factor: the condition holds. */
  breached: boolean
  /** Breached, switched on and not muted: someone is notified. */
  firing: boolean
}

export type HourPoint = { at: number; burn: number }

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)

function burnOf(slo: Slo, events: BudgetEvent[]) {
  const allowed = Math.max(1e-6, 1 - slo.objective)
  const ratioIn = (base: number, from: number, to: number) => {
    const volume = (slo.volume * (to - from)) / DAY_MS
    const extra = events.reduce(
      (sum, event) => sum + eventBadIn(event, from, to),
      0
    )
    return base + (volume > 0 ? extra / volume : 0)
  }
  const minuteRatios = slo.minutes.map((base, index) => {
    const from = REFERENCE_MS - (MINUTE_POINTS - index) * BUCKET_MS
    return ratioIn(base, from, from + BUCKET_MS)
  })
  const hourRatios = slo.hourly.map((base, index) => {
    const from = REFERENCE_MS - (HOURLY_POINTS - index) * HOUR_MS
    return ratioIn(base, from, from + HOUR_MS)
  })
  // The last hour is the 5 minute buckets, so 1h and the chart's end agree.
  hourRatios[HOURLY_POINTS - 1] = mean(minuteRatios)

  const rates: BurnRates = {
    "5m": minuteRatios[MINUTE_POINTS - 1] / allowed,
    "30m": mean(minuteRatios.slice(-6)) / allowed,
    "1h": mean(minuteRatios) / allowed,
    "6h": mean(hourRatios.slice(-6)) / allowed,
    "3d": mean(hourRatios) / allowed,
  }
  const hours: HourPoint[] = hourRatios.map((ratio, index) => ({
    at: REFERENCE_MS - (HOURLY_POINTS - 1 - index) * HOUR_MS,
    burn: ratio / allowed,
  }))
  return { rates, hours }
}

function ruleStatesOf(slo: Slo, rates: BurnRates): RuleState[] {
  return ALERT_RULES.map((rule) => {
    const long = rates[rule.long]
    const short = rates[rule.short]
    const breached = long >= rule.factor && short >= rule.factor
    const enabled =
      rule.level === "page" ? slo.pageOnFastBurn : slo.ticketOnSlowBurn
    return {
      rule,
      long,
      short,
      breached,
      firing: breached && enabled && slo.alerting,
    }
  })
}

// ── Derived record ──

export type SloDerived = {
  stats: WindowStats
  dayBad: number[]
  rates: BurnRates
  hours: HourPoint[]
  rules: RuleState[]
  /** The most severe rule that notifies someone right now. */
  alert: AlertLevel | null
  /** The most severe breached rule, muted or not. */
  breach: AlertLevel | null
  status: SloStatus
}

const LEVEL_RANK: Record<AlertLevel, number> = { ticket: 1, page: 2 }

function topLevel(levels: AlertLevel[]): AlertLevel | null {
  return levels.reduce<AlertLevel | null>(
    (top, level) =>
      top === null || LEVEL_RANK[level] > LEVEL_RANK[top] ? level : top,
    null
  )
}

// Records are immutable, so one derivation per record object is enough.
const derivedCache = new WeakMap<Slo, SloDerived>()

export function derive(slo: Slo): SloDerived {
  const cached = derivedCache.get(slo)
  if (cached) return cached
  const dayBad = dayBadOf(slo)
  const stats = statsOf(slo, dayBad)
  const { rates, hours } = burnOf(slo, counted(slo))
  const rules = ruleStatesOf(slo, rates)
  const alert = topLevel(
    rules.filter((state) => state.firing).map((state) => state.rule.level)
  )
  const breach = topLevel(
    rules.filter((state) => state.breached).map((state) => state.rule.level)
  )
  const status: SloStatus =
    stats.remaining <= 0
      ? "exhausted"
      : stats.remaining < WARN_REMAINING ||
          breach !== null ||
          (stats.daysLeft !== null && stats.daysLeft < RISK_HORIZON_DAYS)
        ? "atRisk"
        : "healthy"
  const result = { stats, dayBad, rates, hours, rules, alert, breach, status }
  derivedCache.set(slo, result)
  return result
}

/** Budget a rule's burn spends over its long window, for this SLO's window. */
export const ruleSpendOf = (slo: Slo, rule: AlertRule) =>
  (rule.factor * rule.longHours) / (slo.windowDays * 24)

/** Budget an event spends, as a share of the current window's allowance. */
export function eventShareOf(slo: Slo, event: BudgetEvent) {
  return event.bad / derive(slo).stats.allowed
}

/** True when an event started inside the SLO's current window. */
export function inWindow(slo: Slo, event: BudgetEvent) {
  return dayIndexOf(event.startedAt) >= HISTORY_DAYS - slo.windowDays
}

// ── Burn-down ──

export type BurnPoint = {
  key: string
  /** The day the point closes; the window start for the first point. */
  day: number
  remaining: number | null
  ideal: number | null
  forecast: number | null
  /** Share of budget spent that day. */
  spent: number
  /** Incidents that started that day, counted or excluded. */
  events: BudgetEvent[]
}

export type BurnDown = {
  points: BurnPoint[]
  /** Index of the last measured point; forecast points follow it. */
  nowIndex: number
  /** When the budget runs out at the seven day pace; null when it holds. */
  exhaustAt: number | null
  floor: number
}

/** Remaining budget at the close of every day in the window, an even-burn
 *  guide from 100% to 0% at now, and a forecast tail at the 7 day pace. */
export function burnDownOf(slo: Slo): BurnDown {
  const { stats, dayBad } = derive(slo)
  const from = HISTORY_DAYS - slo.windowDays
  const forecastDays = slo.windowDays <= 7 ? 3 : 7
  const eventsByDay = new Map<number, BudgetEvent[]>()
  for (const event of slo.events) {
    const index = dayIndexOf(event.startedAt)
    eventsByDay.set(index, [...(eventsByDay.get(index) ?? []), event])
  }

  const points: BurnPoint[] = [
    {
      key: "p0",
      day: dayStartOf(from),
      remaining: 1,
      ideal: 1,
      forecast: null,
      spent: 0,
      events: [],
    },
  ]
  let spent = 0
  for (let step = 1; step <= slo.windowDays; step += 1) {
    const index = from + step - 1
    const share = dayBad[index] / stats.allowed
    spent += share
    points.push({
      key: `p${step}`,
      day: dayStartOf(index),
      remaining: 1 - spent,
      ideal: 1 - step / slo.windowDays,
      forecast: null,
      spent: share,
      events: eventsByDay.get(index) ?? [],
    })
  }
  const nowIndex = points.length - 1
  const pace = stats.dailyBad / stats.allowed
  points[nowIndex].forecast = stats.remaining

  const lowest = Math.min(
    stats.remaining - pace * forecastDays,
    stats.remaining
  )
  // Steps of 20% under the lowest value, and never above -20%, so the
  // exhausted line always has room under it.
  const floor = Math.min(-0.2, Math.floor(lowest * 5) / 5)
  for (let step = 1; step <= forecastDays; step += 1) {
    points.push({
      key: `f${step}`,
      day: TODAY_MS + step * DAY_MS,
      remaining: null,
      ideal: null,
      forecast: Math.max(floor, stats.remaining - pace * step),
      spent: 0,
      events: [],
    })
  }
  const exhaustAt =
    stats.remaining > 0 && pace > 0
      ? REFERENCE_MS + (stats.remaining / pace) * DAY_MS
      : null
  return { points, nowIndex, exhaustAt, floor }
}

/** Budget left over the rolling window as it stood at the close of a day. */
export function rollingRemainingAt(slo: Slo, index: number) {
  const { dayBad } = derive(slo)
  const from = Math.max(0, index - slo.windowDays + 1)
  let total = 0
  let bad = 0
  for (let day = from; day <= index; day += 1) {
    total += slo.days[day].total
    bad += dayBad[day]
  }
  const allowed = Math.max(1, (1 - slo.objective) * total)
  return 1 - bad / allowed
}

const STATUS_RANK: Record<SloStatus, number> = {
  exhausted: 0,
  atRisk: 1,
  healthy: 2,
}

/** Exhausted first, then at risk with breaches leading, then by budget left. */
export function triageOrder(slos: Slo[]) {
  return [...slos].sort((a, b) => {
    const left = derive(a)
    const right = derive(b)
    return (
      STATUS_RANK[left.status] - STATUS_RANK[right.status] ||
      Number(right.breach !== null) - Number(left.breach !== null) ||
      left.stats.remaining - right.stats.remaining
    )
  })
}