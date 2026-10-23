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
  CONNECTION_STATUS,
  ENVIRONMENT_OPTIONS,
  FREQUENCY_OPTIONS,
  INTEGRATION_OPTIONS,
  INTEGRATIONS,
  PERSON_OPTIONS,
  STATUS_ORDER,
  statusOf,
  type Connection,
  type ConnectionStatus,
  type IntegrationId,
  type PersonId,
} from "./data"
import {
  FirstFacePlus,
  IntegrationFace,
  IntegrationLogo,
  OwnerAvatar,
  OwnerFace,
  StatusFace,
} from "./value-faces"
import { ActivityIcon, PlugZapIcon, LayersIcon, UserRoundIcon, ClockIcon } from "lucide-react"

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
  status:      <ActivityIcon className="size-4" aria-hidden="true" />,
  integration: <PlugZapIcon className="size-4" aria-hidden="true" />,
  environment: <LayersIcon className="size-4" aria-hidden="true" />,
  owner:       <UserRoundIcon className="size-4" aria-hidden="true" />,
  frequency:   <ClockIcon className="size-4" aria-hidden="true" />,
}

const faceValue = (face: (value: string) => ReactNode, empty: string) =>
  function FaceValue({ values }: FilterValueDisplayContext) {
    return (
      <FirstFacePlus values={values.map(String)} face={face} empty={empty} />
    )
  }

const isStatus = (value: string): value is ConnectionStatus =>
  value in CONNECTION_STATUS
const isIntegration = (value: string): value is IntegrationId =>
  value in INTEGRATIONS
const isPerson = (value: string): value is PersonId =>
  PERSON_OPTIONS.some((option) => option.value === value)

export const CONNECTION_FILTER_FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: FIELD_ICONS.status,
    type: "select",
    options: STATUS_ORDER.map((status) => ({
      value: status,
      label: CONNECTION_STATUS[status].label,
    })),
    renderValue: faceValue(
      (value) => (isStatus(value) ? <StatusFace status={value} /> : value),
      "any status"
    ),
  },
  {
    id: "integration",
    label: "Integration",
    icon: FIELD_ICONS.integration,
    type: "select",
    searchable: true,
    options: INTEGRATION_OPTIONS.map((option) => ({
      ...option,
      icon: <IntegrationLogo integration={option.value} size="xs" />,
    })),
    renderValue: faceValue(
      (value) =>
        isIntegration(value) ? <IntegrationFace integration={value} /> : value,
      "any integration"
    ),
  },
  {
    id: "environment",
    label: "Environment",
    icon: FIELD_ICONS.environment,
    type: "select",
    options: ENVIRONMENT_OPTIONS,
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
    id: "frequency",
    label: "Frequency",
    icon: FIELD_ICONS.frequency,
    type: "select",
    options: FREQUENCY_OPTIONS,
  },
]

// ── Evaluation ──

function readPath(connection: Connection, path: string[]): unknown {
  switch (path[0]) {
    case "status":
      return statusOf(connection)
    case "integration":
      return connection.integration
    case "environment":
      return connection.environment
    case "owner":
      return connection.ownerId
    case "frequency":
      return connection.frequency
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
function evaluate(connection: Connection, node: FilterNode): boolean | null {
  if (node.type === "group") {
    const votes = node.rules
      .map((child) => evaluate(connection, child))
      .filter((vote): vote is boolean => vote !== null)
    if (votes.length === 0) return null
    return node.combinator === "and"
      ? votes.every(Boolean)
      : votes.some(Boolean)
  }
  const test = TESTS[node.operator]
  if (!test || isIncomplete(node.operator, node.value)) return null
  const result = test(readPath(connection, node.path), node.value)
  return node.negated ? !result : result
}

export const matchesConnectionFilters = (
  connection: Connection,
  query: FilterNode
) => evaluate(connection, query) ?? true