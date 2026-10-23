import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameFooter,
  FramePanel,
} from "@/components/reui/frame"
import { cn } from "cn"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  COLUMN_TYPES,
  DATASET_KINDS,
  formatClock,
  formatCount,
  formatSample,
  maskSample,
  plural,
  PREVIEW_ROWS,
  previewQuery,
  REFERENCE_MS,
  sampleRows,
  type ColumnSpec,
  type Connection,
  type Dataset,
  type SampleRow,
} from "./data"
import { TOAST_ERROR_ICON, TOAST_SUCCESS_ICON, UI_ICONS } from "./icons"
import { ColumnTypeGlyph } from "./value-faces"

type View = "rows" | "schema"

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "rows", label: "Rows" },
  { value: "schema", label: "Schema" },
]

const RESAMPLE_MS = 600

function copyQuery(query: string) {
  const failed = () =>
    toast.error("Copy failed", {
      icon: TOAST_ERROR_ICON,
      description: "Clipboard access was blocked.",
    })
  // Clipboard access can be refused (an iframe, an insecure origin), so both paths answer.
  if (!navigator.clipboard) {
    failed()
    return
  }
  navigator.clipboard.writeText(query).then(
    () =>
      toast.success("Query copied", {
        icon: TOAST_SUCCESS_ICON,
        description: query,
      }),
    failed
  )
}

/** One sample value, masked while personal data stays hidden. */
function SampleCell({
  spec,
  row,
  masked,
}: {
  spec: ColumnSpec
  row: SampleRow
  masked: boolean
}) {
  const value = row[spec.name]
  const text = formatSample(spec, value, row)
  if (spec.pii && masked) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 [&_svg:not([class*=size-])]:size-3">
        {UI_ICONS.lock}
        {maskSample(text)}
      </span>
    )
  }
  return (
    <span
      className={cn(
        (value === null || spec.type === "boolean") && "text-muted-foreground"
      )}
    >
      {text}
    </span>
  )
}

function DatasetPicker({
  datasets,
  value,
  onChange,
}: {
  datasets: Dataset[]
  value: Dataset
  onChange: (id: string) => void
}) {
  const items = datasets.map((dataset) => ({
    value: dataset.id,
    label: dataset.name,
  }))
  return (
    <Select
      value={value.id}
      items={items}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next)
      }}
    >
      <SelectTrigger className="w-full" aria-label="Dataset to preview">
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground flex shrink-0">
              {DATASET_KINDS[value.kind].icon}
            </span>
            <span className="truncate font-mono">{value.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>
          {datasets.map((dataset) => (
            <SelectItem key={dataset.id} value={dataset.id}>
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground flex shrink-0">
                  {DATASET_KINDS[dataset.kind].icon}
                </span>
                <span className="truncate font-mono">{dataset.name}</span>
                {dataset.linked ? null : (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    Unlinked
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function RowsTable({
  dataset,
  rows,
  masked,
  loading,
}: {
  dataset: Dataset
  rows: SampleRow[]
  masked: boolean
  loading: boolean
}) {
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          {dataset.columns.map((spec) => (
            <TableHead key={spec.name} className="ps-3 first:ps-4 last:pe-4">
              <span className="flex items-center gap-1.5 font-mono font-medium">
                <ColumnTypeGlyph type={spec.type} />
                {spec.name}
                {spec.pii ? (
                  <span className="text-muted-foreground flex [&_svg:not([class*=size-])]:size-3">
                    {UI_ICONS.lock}
                  </span>
                ) : null}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {dataset.columns.map((spec) => (
              <TableCell
                key={spec.name}
                className={cn(
                  "ps-3 font-mono whitespace-nowrap tabular-nums first:ps-4 last:pe-4",
                  (spec.type === "money" || spec.type === "number") &&
                    "text-right"
                )}
              >
                {loading ? (
                  <Skeleton className="h-3.5 w-20" />
                ) : (
                  <SampleCell spec={spec} row={row} masked={masked} />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SchemaTable({
  dataset,
  first,
  masked,
}: {
  dataset: Dataset
  first: SampleRow | undefined
  masked: boolean
}) {
  const columns = [
    ...dataset.columns.map((spec) => ({ spec, upstream: false })),
    ...dataset.drift.map((spec) => ({ spec, upstream: true })),
  ]
  return (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          <TableHead className="ps-4">Column</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="pe-4">Sample</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {columns.map(({ spec, upstream }) => (
          <TableRow key={spec.name}>
            <TableCell className="ps-4">
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-medium">{spec.name}</span>
                {spec.key ? <Badge variant="outline">Key</Badge> : null}
                {spec.pii ? <Badge variant="outline">PII</Badge> : null}
                {upstream ? (
                  <Badge variant="warning-light">Upstream</Badge>
                ) : null}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ColumnTypeGlyph type={spec.type} />
                {COLUMN_TYPES[spec.type].label}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground max-w-48 truncate pe-4 font-mono">
              {upstream || !first ? (
                "Not synced yet"
              ) : (
                <SampleCell spec={spec} row={first} masked={masked} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Keyed by dataset id: a new pick starts with a fresh, masked sample. */
function DatasetPreview({
  connection,
  dataset,
  onLink,
  onAccept,
}: {
  connection: Connection
  dataset: Dataset
  onLink: (dataset: Dataset) => void
  onAccept: (dataset: Dataset) => void
}) {
  const [view, setView] = useState<View>("rows")
  const [masked, setMasked] = useState(true)
  const [draw, setDraw] = useState(0)
  const [resampling, setResampling] = useState(false)
  const rows = useMemo(() => sampleRows(dataset, draw), [dataset, draw])
  const query = previewQuery(connection, dataset)
  const hasPii = dataset.columns.some((column) => column.pii)

  useEffect(() => {
    // Frozen demo guard: ?demo=frozen pins the demo, so no timer starts.
    if (document.documentElement.dataset.demo === "frozen") return
    if (!resampling) return
    const timer = window.setTimeout(() => {
      setDraw((current) => current + 1)
      setResampling(false)
    }, RESAMPLE_MS)
    return () => window.clearTimeout(timer)
  }, [resampling])

  function resample() {
    if (document.documentElement.dataset.demo === "frozen") {
      setDraw((current) => current + 1)
      return
    }
    setResampling(true)
  }

  return (
    <>
      {!dataset.linked ? (
        <Alert variant="info">
          {UI_ICONS.link}
          <AlertTitle>Not Linked</AlertTitle>
          <AlertAction>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => onLink(dataset)}
            >
              Link
            </Button>
          </AlertAction>
          <AlertDescription>
            This is a one-off read. Link it to sync on the connection&apos;s
            schedule.
          </AlertDescription>
        </Alert>
      ) : dataset.drift.length > 0 ? (
        <Alert variant="warning">
          {UI_ICONS.columns}
          <AlertTitle>
            {plural(dataset.drift.length, "New Column", "New Columns")} Upstream
          </AlertTitle>
          <AlertAction>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => onAccept(dataset)}
            >
              Accept
            </Button>
          </AlertAction>
          <AlertDescription>
            {dataset.drift.map((column) => column.name).join(" and ")} sync once
            accepted.
          </AlertDescription>
        </Alert>
      ) : null}

      <Frame spacing="default" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 px-(--frame-panel-header-px) py-(--frame-panel-header-py)">
          <ToggleGroup
            multiple={false}
            value={[view]}
            onValueChange={(value: string[]) => {
              const next = VIEW_OPTIONS.find((item) => item.value === value[0])
              if (next) setView(next.value)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Preview as"
          >
            {VIEW_OPTIONS.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                className="text-muted-foreground data-pressed:text-foreground"
              >
                {item.value === "rows" ? UI_ICONS.rows : UI_ICONS.columns}
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex items-center gap-3">
            {hasPii ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="devops-6-mask"
                  size="sm"
                  checked={masked}
                  onCheckedChange={setMasked}
                />
                <Label htmlFor="devops-6-mask" className="text-xs">
                  Mask PII
                </Label>
              </div>
            ) : null}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Copy preview query"
                      onClick={() => copyQuery(query)}
                    />
                  }
                >
                  {UI_ICONS.code}
                </TooltipTrigger>
                <TooltipContent>Copy query</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Draw a new sample"
                      disabled={resampling}
                      onClick={resample}
                    />
                  }
                >
                  {UI_ICONS.sync}
                </TooltipTrigger>
                <TooltipContent>New sample</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <FramePanel className="p-0">
          {view === "rows" ? (
            <RowsTable
              dataset={dataset}
              rows={rows}
              masked={masked}
              loading={resampling}
            />
          ) : (
            <SchemaTable dataset={dataset} first={rows[0]} masked={masked} />
          )}
        </FramePanel>
        <FrameFooter className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <p
            aria-live="polite"
            className="text-muted-foreground text-xs tabular-nums"
          >
            {view === "rows"
              ? `${PREVIEW_ROWS} of ${formatCount(dataset.rows)} rows, sampled ${formatClock(REFERENCE_MS)} UTC`
              : `${plural(dataset.columns.length, "column")}${dataset.cursor ? `, incremental on ${dataset.cursor}` : ", full refresh"}`}
          </p>
          {hasPii && !masked ? (
            <p className="text-warning text-xs">
              Unmasked reads are logged to the audit trail.
            </p>
          ) : null}
        </FrameFooter>
      </Frame>
    </>
  )
}

export function PreviewTab({
  connection,
  datasetId,
  onDatasetChange,
  onLink,
  onAccept,
  onCredential,
}: {
  connection: Connection
  datasetId: string | null
  onDatasetChange: (id: string) => void
  onLink: (dataset: Dataset) => void
  onAccept: (dataset: Dataset) => void
  onCredential: (origin: HTMLElement) => void
}) {
  const dataset =
    connection.datasets.find((item) => item.id === datasetId) ??
    connection.datasets.find((item) => item.linked) ??
    connection.datasets[0]

  if (!dataset) {
    return (
      <Empty className="py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">{UI_ICONS.database}</EmptyMedia>
          <EmptyTitle>No Datasets Yet</EmptyTitle>
          <EmptyDescription>
            Refresh the schema to find what this connection can read.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <DatasetPicker
        datasets={connection.datasets}
        value={dataset}
        onChange={onDatasetChange}
      />
      {connection.health === "failing" ? (
        <Empty className="border py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">{UI_ICONS.failed}</EmptyMedia>
            <EmptyTitle>Preview Unavailable</EmptyTitle>
            <EmptyDescription>
              {connection.issue}. Rotate the credential to read live rows again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              type="button"
              variant="outline"
              onClick={(event) => onCredential(event.currentTarget)}
            >
              {UI_ICONS.key}
              Rotate Key
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DatasetPreview
          key={dataset.id}
          connection={connection}
          dataset={dataset}
          onLink={onLink}
          onAccept={onAccept}
        />
      )}
    </>
  )
}