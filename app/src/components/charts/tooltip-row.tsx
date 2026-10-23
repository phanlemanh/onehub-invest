import { type ReactNode } from "react"
import { cn } from "cn"

import { CAP_BOX } from "./faces"

/** A tooltip row: a 16px glyph slot, the label, then the figure. */
export function TooltipRow({
  glyph,
  label,
  value,
  className,
}: {
  glyph: ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("flex h-4 items-center justify-between gap-4", className)}>
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        <span className="flex size-4 shrink-0 items-center justify-center">
          {glyph}
        </span>
        <span className={CAP_BOX}>{label}</span>
      </span>
      <span className={cn("font-medium tabular-nums", CAP_BOX)}>{value}</span>
    </div>
  )
}
