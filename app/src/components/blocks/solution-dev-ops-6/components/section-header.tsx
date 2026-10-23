import { type ReactNode } from "react"
import {
  FrameDescription,
  FrameHeader,
  FrameTitle,
} from "@/components/reui/frame"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { UI_ICONS } from "./icons"

/** The one header band every page section uses: title over a one-clause
 *  description, actions trailing, wrapping under the title when narrow. */
export function SectionHeader({
  title,
  description,
  children,
}: {
  title: string
  description: ReactNode
  children?: ReactNode
}) {
  return (
    <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-px">
        <FrameTitle>{title}</FrameTitle>
        <FrameDescription>{description}</FrameDescription>
      </div>
      {children}
    </FrameHeader>
  )
}

/** The band for a frame nested inside a sheet: one line, the description
 *  moved into a hint beside the title. */
export function HintHeader({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children?: ReactNode
}) {
  return (
    <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-0.5">
        <FrameTitle className="truncate">{title}</FrameTitle>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={hint}
                className="text-muted-foreground"
              />
            }
          >
            {UI_ICONS.info}
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      </div>
      {children}
    </FrameHeader>
  )
}