import { AlertCircleIcon, ChartColumnIcon, ChartLineIcon, ChevronDownIcon, CircleCheckIcon, CopyIcon, DownloadIcon, FileTextIcon, Grid2x2Icon, InfoIcon, MinusIcon, MoreHorizontalIcon, RotateCcwIcon, Settings2Icon, TableIcon, TagIcon, TargetIcon, TrendingDown, TrendingUp } from "lucide-react";

/** Chrome glyphs, unsized: the owning Button, Badge, menu item or tile sizes them. */
// prettier-ignore
export const CHART_ICONS = {
  chart:       <ChartLineIcon aria-hidden="true" />,
  ledger:      <ChartColumnIcon aria-hidden="true" />,
  display:     <Settings2Icon aria-hidden="true" />,
  chevron:     <ChevronDownIcon className="text-muted-foreground" aria-hidden="true" />,
  more:        <MoreHorizontalIcon aria-hidden="true" />,
  info:        <InfoIcon aria-hidden="true" />,
  annotations: <TagIcon aria-hidden="true" />,
  average:     <MinusIcon aria-hidden="true" />,
  grid:        <Grid2x2Icon aria-hidden="true" />,
  target:      <TargetIcon aria-hidden="true" />,
  download:    <DownloadIcon aria-hidden="true" />,
  table:       <TableIcon aria-hidden="true" />,
  summary:     <FileTextIcon aria-hidden="true" />,
  copy:        <CopyIcon aria-hidden="true" />,
  reset:       <RotateCcwIcon aria-hidden="true" />,
}

/** Direction glyphs at the house glyph size, for a tooltip row's slot. */
// prettier-ignore
export const TREND_ICONS = {
  up:   <TrendingUp className="size-4" aria-hidden="true" />,
  down: <TrendingDown className="size-4" aria-hidden="true" />,
}

/** The success toast glyph, shared by every confirmation a chart raises. */
export const TOAST_SUCCESS_ICON = (
  <CircleCheckIcon className="text-success size-4" aria-hidden="true" />
)

/** The error toast glyph, so a failed copy reads like every other toast. */
export const TOAST_ERROR_ICON = (
  <AlertCircleIcon className="text-destructive size-4" aria-hidden="true" />
)
