import { useState } from "react"
import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  bytesOf,
  consumerLabel,
  DATASET_KINDS,
  formatBytes,
  formatCompact,
  formatRelative,
  linkedOf,
  plural,
  type Connection,
  type Dataset,
} from "./data"
import { UI_ICONS } from "./icons"
import { DotSeparator } from "./value-faces"

type Show = "all" | "linked" | "unlinked"

const SHOW_OPTIONS: { value: Show; label: string }[] = [
  { value: "all", label: "All" },
  { value: "linked", label: "Linked" },
  { value: "unlinked", label: "Unlinked" },
]

function DatasetRow({
  dataset,
  onToggle,
  onPreview,
  onAccept,
}: {
  dataset: Dataset
  onToggle: (
    dataset: Dataset,
    linked: boolean,
    origin: HTMLElement | null
  ) => void
  onPreview: (dataset: Dataset) => void
  onAccept: (dataset: Dataset) => void
}) {
  const pii = dataset.columns.some((column) => column.pii)
  const consumers = dataset.consumers ?? []
  const drift = dataset.linked && dataset.drift.length > 0
  return (
    // px-2 matches the 8px vertical inset: the tile sits 9px from every edge.
    <Item size="xs" className="px-2">
      {/* translate-y-0 centres the 40px tile; phones give its room to the name. */}
      <ItemMedia className="translate-y-0 max-sm:hidden">
        <IconTile variant="outline" aria-hidden="true">
          {DATASET_KINDS[dataset.kind].icon}
        </IconTile>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle className="max-w-full min-w-0">
          <button
            type="button"
            onClick={() => onPreview(dataset)}
            className="hover:text-primary min-w-0 cursor-pointer truncate text-left font-mono underline-offset-2 hover:underline"
          >
            {dataset.name}
          </button>
          {drift ? (
            <Badge variant="warning-light" className="shrink-0">
              {plural(dataset.drift.length, "New Column", "New Columns")}
            </Badge>
          ) : dataset.discovered ? (
            <Badge variant="info-light" className="shrink-0">
              Discovered
            </Badge>
          ) : null}
        </ItemTitle>
        {/* One line: each dot travels with its segment, the tail truncates. */}
        <ItemDescription className="flex min-w-0 items-center gap-1.5 text-xs tabular-nums">
          <span className="shrink-0">{formatCompact(dataset.rows)} rows</span>
          <span className="flex shrink-0 items-center gap-1.5 max-sm:hidden">
            <DotSeparator />
            {formatBytes(bytesOf(dataset))}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 sm:shrink-0">
            <DotSeparator />
            <span className="truncate">
              {dataset.linked
                ? dataset.syncedAt === null
                  ? "First sync pending"
                  : `Synced ${formatRelative(dataset.syncedAt)}`
                : "Not synced"}
            </span>
          </span>
          {pii ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <DotSeparator />
              <span className="inline-flex items-center gap-1 [&_svg:not([class*=size-])]:size-3">
                {UI_ICONS.lock}
                PII
              </span>
            </span>
          ) : null}
          {consumers.length > 0 ? (
            <span className="flex min-w-0 shrink-[4] items-center gap-1.5 max-sm:hidden">
              <DotSeparator />
              <span className="truncate">
                Read by {consumers.map(consumerLabel).join(", ")}
              </span>
            </span>
          ) : null}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="gap-1">
        {drift ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Accept new columns in ${dataset.name}`}
                  onClick={() => onAccept(dataset)}
                />
              }
            >
              {UI_ICONS.check}
            </TooltipTrigger>
            <TooltipContent>Accept new columns</TooltipContent>
          </Tooltip>
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Preview ${dataset.name}`}
                onClick={() => onPreview(dataset)}
              />
            }
          >
            {UI_ICONS.rows}
          </TooltipTrigger>
          <TooltipContent>Preview rows</TooltipContent>
        </Tooltip>
        <Switch
          size="sm"
          checked={dataset.linked}
          onCheckedChange={(checked) =>
            // The switch holds focus after the click; a confirm returns it there.
            onToggle(
              dataset,
              checked,
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null
            )
          }
          aria-label={`Link ${dataset.name}`}
        />
      </ItemActions>
    </Item>
  )
}

export function DatasetsTab({
  connection,
  onToggle,
  onPreview,
  onAccept,
  onRefresh,
}: {
  connection: Connection
  onToggle: (
    dataset: Dataset,
    linked: boolean,
    origin: HTMLElement | null
  ) => void
  onPreview: (dataset: Dataset) => void
  onAccept: (dataset: Dataset) => void
  onRefresh: () => void
}) {
  const [search, setSearch] = useState("")
  const [show, setShow] = useState<Show>("all")
  const query = search.trim().toLowerCase()
  const visible = connection.datasets.filter(
    (dataset) =>
      (show === "all" || dataset.linked === (show === "linked")) &&
      (!query || dataset.name.toLowerCase().includes(query))
  )
  const linked = linkedOf(connection)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="min-w-0 flex-1 basis-40">
          <InputGroupAddon align="inline-start">
            {UI_ICONS.search}
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search datasets..."
            aria-label="Search datasets"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Clear search"
                size="icon-xs"
                onClick={() => setSearch("")}
              >
                {UI_ICONS.close}
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <ToggleGroup
          multiple={false}
          value={[show]}
          onValueChange={(value: string[]) => {
            const next = SHOW_OPTIONS.find((item) => item.value === value[0])
            if (next) setShow(next.value)
          }}
          variant="outline"
          spacing={0}
          aria-label="Datasets shown"
        >
          {SHOW_OPTIONS.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              className="text-muted-foreground data-pressed:text-foreground"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Frame spacing="default" className="min-w-0">
        {/* px-2.5 puts the text on the rows' tile spine, 9px in from the panel. */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-(--frame-panel-header-py)">
          <p className="text-muted-foreground text-sm tabular-nums">
            <span className="text-foreground font-medium">{linked.length}</span>{" "}
            of {plural(connection.datasets.length, "dataset")} linked
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={onRefresh}>
            {UI_ICONS.scan}
            Refresh Schema
          </Button>
        </div>
        <FramePanel className="p-0">
          {visible.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">{UI_ICONS.search}</EmptyMedia>
                <EmptyTitle>No Datasets Match</EmptyTitle>
                <EmptyDescription>
                  Try another name or show every dataset.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setShow("all")
                  }}
                >
                  Clear
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            // No group inset: the separators run edge to edge of the panel.
            <ItemGroup className="gap-0">
              {visible.map((dataset, index) => (
                <div key={dataset.id} role="listitem" className="contents">
                  {index > 0 ? <ItemSeparator className="my-0" /> : null}
                  <DatasetRow
                    dataset={dataset}
                    onToggle={onToggle}
                    onPreview={onPreview}
                    onAccept={onAccept}
                  />
                </div>
              ))}
            </ItemGroup>
          )}
        </FramePanel>
      </Frame>
    </>
  )
}