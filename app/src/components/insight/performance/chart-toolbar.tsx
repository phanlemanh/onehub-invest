import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
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

import { CAP_BOX } from "@/components/charts/faces"
import { CHART_ICONS } from "@/components/charts/icons"
import { OverflowMenu } from "@/components/charts/overflow-menu"
import { SegmentedToggle } from "@/components/charts/segmented-toggle"
import { RANGES, type LayerKey, type ViewState } from "./data"

export interface ChartActions {
  downloadCsv: () => void
  copyData: () => void
  copySummary: () => void
  resetView: () => void
}

const LAYERS = [
  { key: "annotations", label: "Mốc lễ, mùa vụ", icon: CHART_ICONS.annotations },
  { key: "average", label: "Đường trung bình", icon: CHART_ICONS.average },
  { key: "grid", label: "Lưới", icon: CHART_ICONS.grid },
] as const satisfies readonly {
  key: LayerKey
  label: string
  icon: ReactNode
}[]

const layersShown = (view: ViewState) =>
  `${LAYERS.filter((layer) => view[layer.key]).length}/${LAYERS.length}`

/** The header toolbar: the range, then what the plot shows and more. */
export function ChartToolbar({
  view,
  onViewChange,
  canReset,
  actions,
}: {
  view: ViewState
  onViewChange: (patch: Partial<ViewState>) => void
  canReset: boolean
  actions: ChartActions
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedToggle
        items={RANGES}
        value={view.range}
        onChange={(range) => onViewChange({ range })}
        ariaLabel="Khoảng thời gian"
        itemClassName="tabular-nums"
        renderLabel={(label) => <span className={CAP_BOX}>{label}</span>}
      />
      <ButtonGroup aria-label="Thao tác biểu đồ">
        <DisplayMenu view={view} onViewChange={onViewChange} />
        <OverflowMenu size="icon">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Xuất dữ liệu</DropdownMenuLabel>
            <DropdownMenuItem onClick={actions.downloadCsv}>
              {CHART_ICONS.download}
              Tải CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={actions.copyData}>
              {CHART_ICONS.table}
              Sao chép bảng số
            </DropdownMenuItem>
            <DropdownMenuItem onClick={actions.copySummary}>
              {CHART_ICONS.summary}
              Sao chép tóm tắt
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled={!canReset} onClick={actions.resetView}>
              {CHART_ICONS.reset}
              Về mặc định
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </OverflowMenu>
      </ButtonGroup>
    </div>
  )
}

// Stays open while toggling, so several layers read at once.
function DisplayMenu({
  view,
  onViewChange,
}: {
  view: ViewState
  onViewChange: (patch: Partial<ViewState>) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={`Hiển thị, ${layersShown(view)} lớp đang bật`}
          />
        }
      >
        {CHART_ICONS.display}
        <span className={CAP_BOX}>Hiển thị</span>
        {CHART_ICONS.chevron}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Hiện</DropdownMenuLabel>
          {LAYERS.map((layer) => (
            <DropdownMenuCheckboxItem
              key={layer.key}
              checked={view[layer.key]}
              onCheckedChange={(next: boolean) => {
                const patch: Partial<ViewState> = {}
                patch[layer.key] = next
                onViewChange(patch)
              }}
              closeOnClick={false}
            >
              {layer.icon}
              {layer.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
