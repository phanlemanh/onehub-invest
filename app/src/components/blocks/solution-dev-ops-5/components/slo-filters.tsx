import { type ReactNode } from "react"
import { type FilterOperatorLabels } from "@/components/reui/filters/filters-operators"
import { createFilterQuery } from "@/components/reui/filters/filters-query"
import {
  type FilterField,
  type FilterNode,
  type FilterQuery,
  type FilterValueDisplayContext,
} from "@/components/reui/filters/filters-types"
import {
  PERSON_OPTIONS,
  SERVICE_OPTIONS,
  SERVICES,
  SLI_KINDS,
  SLI_OPTIONS,
  TEAM_OPTIONS,
  teamOf,
  WINDOW_OPTIONS,
  type PersonId,
  type ServiceId,
  type SliKind,
  type Slo,
} from "./data"
import {
  FirstFacePlus,
  OwnerAvatar,
  OwnerFace,
  ServiceFace,
  SliFace,
} from "./value-faces"
import { LayersIcon, UserRoundIcon, ActivityIcon, ClockIcon, BellIcon, UsersIcon } from "lucide-react"

export const EMPTY_FILTER_QUERY: FilterQuery = createFilterQuery()

/** Short operator words keep the dropdown's operator column narrow. */
export const COMPACT_OPERATORS: FilterOperatorLabels = {
  is_any_of: "any of",
  is_none_of: "none of",
  empty: "empty",
  not_empty: "not empty",
}

// prettier-ignore
const FIELD_ICONS = {
  service: <LayersIcon className="size-4" aria-hidden="true" />,
  owner:   <UserRoundIcon className="size-4" aria-hidden="true" />,
  sli:     <ActivityIcon className="size-4" aria-hidden="true" />,
  window:  <ClockIcon className="size-4" aria-hidden="true" />,
  alerts:  <BellIcon className="size-4" aria-hidden="true" />,
  team:    <UsersIcon className="size-4" aria-hidden="true" />,
}

const faceValue = (face: (value: string) => ReactNode, empty: string) =>
  function FaceValue({ values }: FilterValueDisplayContext) {
    return (
      <FirstFacePlus values={values.map(String)} face={face} empty={empty} />
    )
  }

const isService = (value: string): value is ServiceId => value in SERVICES
const isPerson = (value: string): value is PersonId =>
  PERSON_OPTIONS.some((option) => option.value === value)
const isSli = (value: string): value is SliKind => value in SLI_KINDS

export const SLO_FILTER_FIELDS: FilterField[] = [
  {
    id: "service",
    label: "Service",
    icon: FIELD_ICONS.service,
    type: "select",
    searchable: true,
    options: SERVICE_OPTIONS.map((option) => ({
      ...option,
      icon: SERVICES[option.value].icon,
    })),
    renderValue: faceValue(
      (value) => (isService(value) ? <ServiceFace service={value} /> : value),
      "any service"
    ),
  },
  {
    id: "sli",
    label: "SLI",
    icon: FIELD_ICONS.sli,
    type: "select",
    options: SLI_OPTIONS.map((option) => ({
      ...option,
      icon: SLI_KINDS[option.value].icon,
    })),
    renderValue: faceValue(
      (value) => (isSli(value) ? <SliFace sli={value} /> : value),
      "any SLI"
    ),
  },
  {
    id: "owner",
    label: "Owner",
    icon: FIELD_ICONS.owner,
    type: "select",
    searchable: true,
    options: PERSON_OPTIONS.map((option) => ({
      ...option,
      icon: <OwnerAvatar ownerId={option.value} />,
    })),
    renderValue: faceValue(
      (value) => (isPerson(value) ? <OwnerFace ownerId={value} /> : value),
      "anyone"
    ),
  },
  {
    id: "window",
    label: "Window",
    icon: FIELD_ICONS.window,
    type: "select",
    options: WINDOW_OPTIONS.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: FIELD_ICONS.alerts,
    type: "select",
    options: [
      { value: "on", label: "On" },
      { value: "muted", label: "Muted" },
    ],
  },
  {
    id: "team",
    label: "Team",
    icon: FIELD_ICONS.team,
    type: "select",
    options: TEAM_OPTIONS,
  },
]

// ── Evaluation ──

function readSloPath(slo: Slo, path: string[]): unknown {
  switch (path[0]) {
    case "service":
      return slo.service
    case "sli":
      return slo.sli
    case "owner":
      return slo.ownerId
    case "window":
      return String(slo.windowDays)
    case "alerts":
      return slo.alerting ? "on" : "muted"
    case "team":
      return teamOf(slo)
    default:
      return undefined
  }
}

const list = (value: unknown) => (Array.isArray(value) ? value : [value])
const isBlank = (value: unknown) =>
  value === undefined || value === null || value === ""

const TESTS: Record<string, (actual: unknown, value: unknown) => boolean> = {
  is: (actual, value) => actual === value,
  is_not: (actual, value) => actual !== value,
  is_any_of: (actual, value) => list(value).includes(actual),
  is_none_of: (actual, value) => !list(value).includes(actual),
  empty: (actual) => isBlank(actual),
  not_empty: (actual) => !isBlank(actual),
}

/** A rule still being built (no value picked yet) constrains nothing. */
function isIncomplete(operator: string, value: unknown) {
  if (operator === "empty" || operator === "not_empty") return false
  if (isBlank(value)) return true
  return Array.isArray(value) && value.length === 0
}

/** null abstains: an unfinished rule must not satisfy an OR on its own. */
function evaluate(slo: Slo, node: FilterNode): boolean | null {
  if (node.type === "group") {
    const votes = node.rules
      .map((child) => evaluate(slo, child))
      .filter((vote): vote is boolean => vote !== null)
    if (votes.length === 0) return null
    return node.combinator === "and"
      ? votes.every(Boolean)
      : votes.some(Boolean)
  }
  const test = TESTS[node.operator]
  if (!test || isIncomplete(node.operator, node.value)) return null
  const result = test(readSloPath(slo, node.path), node.value)
  return node.negated ? !result : result
}

export const matchesSloFilters = (slo: Slo, query: FilterNode) =>
  evaluate(slo, query) ?? true