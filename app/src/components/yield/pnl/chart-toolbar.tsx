import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { CHART_ICONS } from "@/components/charts/icons"
import { OverflowMenu } from "@/components/charts/overflow-menu"
import { SegmentedToggle } from "@/components/charts/segmented-toggle"

import { GRANULARITIES, type ViewState } from "./data"

export interface ChartActions {
  downloadCsv: () => void
  copySummary: () => void
}

/** The grouping toggle, then a menu for layers and export. */
export function ChartToolbar({
  view,
  onViewChange,
  actions,
}: {
  view: ViewState
  onViewChange: (patch: Partial<ViewState>) => void
  actions: ChartActions
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedToggle
        items={GRANULARITIES}
        value={view.granularity}
        onChange={(granularity) => onViewChange({ granularity })}
        ariaLabel="Gộp theo"
        size="sm"
      />
      {/* Layer toggles keep the menu open, so both can change in one visit. */}
      <OverflowMenu size="icon-sm">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Hiện</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={view.target}
            onCheckedChange={(next: boolean) => onViewChange({ target: next })}
            closeOnClick={false}
          >
            {CHART_ICONS.target}
            Mốc ngang thuê dài hạn
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Xuất dữ liệu</DropdownMenuLabel>
          <DropdownMenuItem onClick={actions.downloadCsv}>
            {CHART_ICONS.download}
            Tải CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={actions.copySummary}>
            {CHART_ICONS.summary}
            Sao chép tóm tắt
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </OverflowMenu>
    </div>
  )
}
