import { type ReactNode } from "react"
import { TriangleAlertIcon, CheckIcon, CircleCheckIcon, XIcon, CopyIcon, DownloadIcon, EyeIcon, FilterIcon, InfoIcon, MoreHorizontalIcon, ArrowUpRightIcon, ShieldCheckIcon, CircleXIcon, SearchIcon, TimerIcon } from "lucide-react"

// prettier-ignore
const BLOCK_ICONS = {
  alert: (className) => <TriangleAlertIcon className={className} aria-hidden="true" />,
  approve: (className) => <CheckIcon className={className} aria-hidden="true" />,
  approved: (className) => <CircleCheckIcon className={className} aria-hidden="true" />,
  clear: (className) => <XIcon className={className} aria-hidden="true" />,
  copy: (className) => <CopyIcon className={className} aria-hidden="true" />,
  download: (className) => <DownloadIcon className={className} aria-hidden="true" />,
  eye: (className) => <EyeIcon className={className} aria-hidden="true" />,
  filter: (className) => <FilterIcon className={className} aria-hidden="true" />,
  info: (className) => <InfoIcon className={className} aria-hidden="true" />,
  menu: (className) => <MoreHorizontalIcon className={className} aria-hidden="true" />,
  open: (className) => <ArrowUpRightIcon className={className} aria-hidden="true" />,
  policy: (className) => <ShieldCheckIcon className={className} aria-hidden="true" />,
  reject: (className) => <CircleXIcon className={className} aria-hidden="true" />,
  search: (className) => <SearchIcon className={className} aria-hidden="true" />,
  timer: (className) => <TimerIcon className={className} aria-hidden="true" />,
} satisfies Record<string, (className?: string) => ReactNode>

export function BlockIcon({
  name,
  className,
}: {
  name: keyof typeof BLOCK_ICONS
  className?: string
}) {
  return BLOCK_ICONS[name](className)
}