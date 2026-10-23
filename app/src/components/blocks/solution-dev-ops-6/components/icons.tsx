import { CircleCheckIcon, CircleAlertIcon, PlusIcon, XIcon, MoreHorizontalIcon, EyeIcon, PencilIcon, CopyIcon, CheckIcon, Trash2Icon, SearchIcon, ChevronUpIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, ListFilterIcon, Settings2Icon, RefreshCwIcon, PauseCircleIcon, PlayIcon, KeyRoundIcon, LinkIcon, Link2OffIcon, PlugZapIcon, ScanSearchIcon, Rows3Icon, Columns3Icon, CodeIcon, LockIcon, ShieldCheckIcon, TriangleAlertIcon, CircleXIcon, CircleDotIcon, ClockIcon, LayersIcon, DatabaseIcon, InfoIcon, ArrowLeftRightIcon } from "lucide-react";

/** The toast state glyphs, one per typed method, so every toast reads alike. */
export const TOAST_SUCCESS_ICON = (
  <CircleCheckIcon className="text-success size-4" aria-hidden="true" />
)

export const TOAST_ERROR_ICON = (
  <CircleAlertIcon className="text-destructive size-4" aria-hidden="true" />
)

// prettier-ignore
export const UI_ICONS = {
  plus:     <PlusIcon aria-hidden="true" />,
  close:    <XIcon aria-hidden="true" />,
  more:     <MoreHorizontalIcon aria-hidden="true" />,
  view:     <EyeIcon aria-hidden="true" />,
  edit:     <PencilIcon aria-hidden="true" />,
  copy:     <CopyIcon aria-hidden="true" />,
  check:    <CheckIcon aria-hidden="true" />,
  trash:    <Trash2Icon aria-hidden="true" />,
  search:   <SearchIcon aria-hidden="true" />,
  previous: <ChevronUpIcon aria-hidden="true" />,
  next:     <ChevronDownIcon aria-hidden="true" />,
  up:       <ArrowUpIcon aria-hidden="true" />,
  down:     <ArrowDownIcon aria-hidden="true" />,
  back:     <ChevronLeftIcon aria-hidden="true" />,
  forward:  <ChevronRightIcon aria-hidden="true" />,
  go:       <ArrowRightIcon aria-hidden="true" />,
  filter:   <ListFilterIcon aria-hidden="true" />,
  display:  <Settings2Icon aria-hidden="true" />,
  sync:     <RefreshCwIcon aria-hidden="true" />,
  pause:    <PauseCircleIcon aria-hidden="true" />,
  resume:   <PlayIcon aria-hidden="true" />,
  key:      <KeyRoundIcon aria-hidden="true" />,
  link:     <LinkIcon aria-hidden="true" />,
  unlink:   <Link2OffIcon aria-hidden="true" />,
  plug:     <PlugZapIcon aria-hidden="true" />,
  scan:     <ScanSearchIcon aria-hidden="true" />,
  rows:     <Rows3Icon aria-hidden="true" />,
  columns:  <Columns3Icon aria-hidden="true" />,
  code:     <CodeIcon aria-hidden="true" />,
  lock:     <LockIcon aria-hidden="true" />,
  shield:   <ShieldCheckIcon aria-hidden="true" />,
  alert:    <TriangleAlertIcon aria-hidden="true" />,
  failed:   <CircleXIcon aria-hidden="true" />,
  passed:   <CircleCheckIcon aria-hidden="true" />,
  pending:  <CircleDotIcon aria-hidden="true" />,
  clock:    <ClockIcon aria-hidden="true" />,
  layers:   <LayersIcon aria-hidden="true" />,
  database: <DatabaseIcon aria-hidden="true" />,
  info:     <InfoIcon aria-hidden="true" />,
  rowsIn:   <ArrowLeftRightIcon aria-hidden="true" />,
}