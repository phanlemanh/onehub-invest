import { CircleCheckIcon, AlertCircleIcon, PlusIcon, XIcon, MoreHorizontalIcon, EyeIcon, PanelRightIcon, PencilIcon, CopyIcon, CheckIcon, Trash2Icon, SearchIcon, ChevronUpIcon, ChevronDownIcon, BellIcon, BellOffIcon, FlameIcon, TargetIcon, TrendingDown, ShieldAlertIcon, FileCode2Icon, OctagonXIcon, ListFilterIcon, Settings2Icon, ArrowUpIcon, ArrowDownIcon, WalletIcon, CalendarClockIcon, ActivityIcon, ListChecksIcon } from "lucide-react";

/** The toast state glyphs, one per typed method, so every toast reads alike. */
export const TOAST_SUCCESS_ICON = (
  <CircleCheckIcon className="text-success size-4" aria-hidden="true" />
)

export const TOAST_ERROR_ICON = (
  <AlertCircleIcon className="text-destructive size-4" aria-hidden="true" />
)

// prettier-ignore
export const UI_ICONS = {
  plus:     <PlusIcon aria-hidden="true" />,
  close:    <XIcon aria-hidden="true" />,
  more:     <MoreHorizontalIcon aria-hidden="true" />,
  view:     <EyeIcon aria-hidden="true" />,
  open:     <PanelRightIcon aria-hidden="true" />,
  edit:     <PencilIcon aria-hidden="true" />,
  copy:     <CopyIcon aria-hidden="true" />,
  check:    <CheckIcon aria-hidden="true" />,
  trash:    <Trash2Icon aria-hidden="true" />,
  search:   <SearchIcon aria-hidden="true" />,
  previous: <ChevronUpIcon aria-hidden="true" />,
  next:     <ChevronDownIcon aria-hidden="true" />,
  bell:     <BellIcon aria-hidden="true" />,
  mute:     <BellOffIcon aria-hidden="true" />,
  flame:    <FlameIcon aria-hidden="true" />,
  target:   <TargetIcon aria-hidden="true" />,
  budget:   <TrendingDown aria-hidden="true" />,
  incident: <ShieldAlertIcon aria-hidden="true" />,
  yaml:     <FileCode2Icon aria-hidden="true" />,
  freeze:   <OctagonXIcon aria-hidden="true" />,
  filter:   <ListFilterIcon aria-hidden="true" />,
  display:  <Settings2Icon aria-hidden="true" />,
  arrowUp:   <ArrowUpIcon aria-hidden="true" />,
  arrowDown: <ArrowDownIcon aria-hidden="true" />,
  wallet:   <WalletIcon aria-hidden="true" />,
  events:   <CalendarClockIcon aria-hidden="true" />,
  activity: <ActivityIcon aria-hidden="true" />,
  objectives: <ListChecksIcon aria-hidden="true" />,
}