import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { CHART_ICONS } from "./icons"
import { useTriggerTooltip } from "./use-trigger-tooltip"

/** The header's "Thao tác khác" menu: an icon button with a hint, the items as children. */
export function OverflowMenu({
  size,
  contentClassName = "w-auto",
  children,
}: {
  size: "icon" | "icon-sm"
  contentClassName?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const hint = useTriggerTooltip(open)
  return (
    <DropdownMenu open={open} onOpenChange={(next: boolean) => setOpen(next)}>
      <Tooltip {...hint.tooltip}>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size={size}
                  aria-label="Thao tác khác"
                  {...hint.triggerProps}
                />
              }
            />
          }
        >
          {CHART_ICONS.more}
        </TooltipTrigger>
        <TooltipContent>Thao tác khác</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className={contentClassName}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
