import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { CHART_ICONS } from "@/components/charts/icons"
import { OverflowMenu } from "@/components/charts/overflow-menu"

export interface CardActions {
  exportCsv: () => void
  copySummary: () => void
}

/** The header menu: export and summary (no period switch — one window). */
export function MoreMenu({
  actions,
  canExport,
}: {
  actions: CardActions
  canExport: boolean
}) {
  return (
    <OverflowMenu size="icon" contentClassName="w-48">
      <DropdownMenuGroup>
        <DropdownMenuLabel>Dữ liệu</DropdownMenuLabel>
        <DropdownMenuItem disabled={!canExport} onClick={actions.exportCsv}>
          {CHART_ICONS.download}
          Tải CSV
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canExport} onClick={actions.copySummary}>
          {CHART_ICONS.copy}
          Sao chép tóm tắt
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </OverflowMenu>
  )
}
