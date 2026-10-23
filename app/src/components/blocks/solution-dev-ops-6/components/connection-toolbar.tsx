import { type RefObject } from "react"
import { Badge } from "@/components/reui/badge"
import { Filters } from "@/components/reui/filters/filters"
import { countFilterRules } from "@/components/reui/filters/filters-query"
import { type FilterQuery } from "@/components/reui/filters/filters-types"
import { type ColumnVisibilityState } from "@tanstack/react-table"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { OPTIONAL_COLUMNS } from "./columns"
import {
  COMPACT_OPERATORS,
  CONNECTION_FILTER_FIELDS,
} from "./connection-filters"
import {
  CATEGORIES,
  CATEGORY_ORDER,
  DENSITY_OPTIONS,
  type Density,
  type IntegrationCategory,
} from "./data"
import { UI_ICONS } from "./icons"

/** Below sm a trigger with no count badge is icon only: square it to 32px. */
const ICON_ONLY_BELOW_SM = "max-sm:w-8 max-sm:px-0"

/** Search on the left; categories, filters and display on the right. */
export function ConnectionToolbar({
  search,
  onSearchChange,
  searchRef,
  hidden,
  onHiddenChange,
  counts,
  filterQuery,
  onFilterQueryChange,
  display,
}: {
  search: string
  onSearchChange: (value: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  /** Categories the reader switched off. */
  hidden: IntegrationCategory[]
  onHiddenChange: (next: IntegrationCategory[]) => void
  counts: Record<IntegrationCategory, number>
  filterQuery: FilterQuery
  onFilterQueryChange: (next: FilterQuery) => void
  display: DisplayProps
}) {
  const ruleCount = countFilterRules(filterQuery)

  return (
    <div className="flex flex-wrap items-center gap-2 px-(--frame-panel-header-px) py-(--frame-panel-header-py)">
      <InputGroup className="min-w-0 flex-1 basis-48 sm:max-w-64">
        <InputGroupAddon align="inline-start">
          {UI_ICONS.search}
        </InputGroupAddon>
        <InputGroupInput
          ref={searchRef}
          placeholder="Search connections or datasets..."
          aria-label="Search connections"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search.length > 0 && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              size="icon-xs"
              onClick={() => {
                onSearchChange("")
                searchRef.current?.focus()
              }}
            >
              {UI_ICONS.close}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <div className="ms-auto flex shrink-0 items-center gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className={cn(hidden.length === 0 && ICON_ONLY_BELOW_SM)}
                aria-label={
                  hidden.length > 0
                    ? `Categories, ${CATEGORY_ORDER.length - hidden.length} shown`
                    : "Categories"
                }
              />
            }
          >
            {UI_ICONS.layers}
            <span className="max-sm:sr-only">Categories</span>
            {hidden.length > 0 ? (
              <Badge variant="outline" radius="full" className="tabular-nums">
                {CATEGORY_ORDER.length - hidden.length}
              </Badge>
            ) : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Shown categories</DropdownMenuLabel>
              {CATEGORY_ORDER.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={!hidden.includes(category)}
                  closeOnClick={false}
                  onCheckedChange={(checked) =>
                    onHiddenChange(
                      checked
                        ? hidden.filter((item) => item !== category)
                        : [...hidden, category]
                    )
                  }
                >
                  {CATEGORIES[category].icon}
                  {CATEGORIES[category].plural}
                  <span className="text-muted-foreground ms-auto text-xs tabular-nums">
                    {counts[category]}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={hidden.length === 0}
                closeOnClick={false}
                onClick={() => onHiddenChange([])}
              >
                {UI_ICONS.view}
                Show All
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Own trigger: the stock one always prints its label, so it
            could not go icon-only below sm. Widths fit COMPACT_OPERATORS. */}
        <Filters
          variant="advanced"
          advancedMode="popover"
          advancedAlign="end"
          size="sm"
          fields={CONNECTION_FILTER_FIELDS}
          operatorLabels={COMPACT_OPERATORS}
          className="w-lg [--filter-field-width:7.5rem] [--filter-operator-width:6.5rem] [--filter-value-width:8.5rem]"
          query={filterQuery}
          onQueryChange={onFilterQueryChange}
          trigger={
            <Button
              type="button"
              variant="outline"
              className={cn(ruleCount === 0 && ICON_ONLY_BELOW_SM)}
              aria-label={
                ruleCount > 0
                  ? `Filter, ${ruleCount} ${ruleCount === 1 ? "rule" : "rules"}`
                  : "Filter"
              }
            >
              {UI_ICONS.filter}
              <span className="max-sm:sr-only">Filter</span>
              {ruleCount > 0 ? (
                <Badge variant="outline" radius="full" className="tabular-nums">
                  {ruleCount}
                </Badge>
              ) : null}
            </Button>
          }
        />

        <ConnectionDisplayPopover {...display} />
      </div>
    </div>
  )
}

type DisplayProps = {
  density: Density
  onDensityChange: (next: Density) => void
  striped: boolean
  onStripedChange: (next: boolean) => void
  columnVisibility: ColumnVisibilityState
  onColumnVisibilityChange: (next: ColumnVisibilityState) => void
}

/** Density, stripes and column visibility, shared by every group's table.
 *  "Display", not "Settings": the connection sheet owns a Settings tab. */
function ConnectionDisplayPopover({
  density,
  onDensityChange,
  striped,
  onStripedChange,
  columnVisibility,
  onColumnVisibilityChange,
}: DisplayProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={ICON_ONLY_BELOW_SM}
            aria-label="Display"
          />
        }
      >
        {UI_ICONS.display}
        <span className="max-sm:sr-only">Display</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <FieldSet className="gap-3">
          <FieldLegend variant="label">Table</FieldLegend>
          <FieldGroup className="gap-3">
            <Field orientation="horizontal">
              <FieldLabel htmlFor="devops-6-density">Density</FieldLabel>
              <Select
                value={density}
                items={DENSITY_OPTIONS}
                onValueChange={(next) => {
                  const option = DENSITY_OPTIONS.find(
                    (item) => item.value === next
                  )
                  if (option) onDensityChange(option.value)
                }}
              >
                <SelectTrigger id="devops-6-density" size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {DENSITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="devops-6-striped">Striped rows</FieldLabel>
              <Switch
                id="devops-6-striped"
                size="sm"
                checked={striped}
                onCheckedChange={onStripedChange}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet className="gap-3">
          <FieldLegend variant="label">Columns</FieldLegend>
          <FieldGroup className="gap-3">
            {OPTIONAL_COLUMNS.map((column) => (
              <Field key={column.id} orientation="horizontal">
                <FieldLabel htmlFor={`devops-6-column-${column.id}`}>
                  {column.label}
                </FieldLabel>
                <Switch
                  id={`devops-6-column-${column.id}`}
                  size="sm"
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(checked) =>
                    onColumnVisibilityChange({
                      ...columnVisibility,
                      [column.id]: checked,
                    })
                  }
                />
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </PopoverContent>
    </Popover>
  )
}