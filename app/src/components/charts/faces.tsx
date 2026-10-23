import { type ReactNode } from "react"
import { cn } from "cn"

/** Trims a label to its caps, so `items-center` lines the letters up with
 *  the dot or control beside it. Needs a fixed-height row. */
export const CAP_BOX = "[text-box:trim-both_cap_alphabetic]"
/** CAP_BOX for a label that may ellipsize: it clips only sideways, so the
 *  descenders a trimmed box hangs below its edge stay whole. */
export const CAP_TRUNCATE = `${CAP_BOX} overflow-x-clip text-ellipsis whitespace-nowrap`

export function DotSeparator() {
  return (
    <span
      aria-hidden="true"
      className="bg-muted-foreground/40 size-1 shrink-0 rounded-full"
    />
  )
}

/** A series' key: a dot in its palette colour (`swatchOf` của charts/palette). */
export function KeyDot({
  swatch,
  size = "sm",
}: {
  swatch: string
  /** sm = chấm chú giải đường/cột; md = chấm lát donut. */
  size?: "sm" | "md"
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(size === "sm" ? "size-2" : "size-2.5", "shrink-0 rounded-full", swatch)}
    />
  )
}

/** A text-xs fact on a status line: cap-trimmed inside an h-4 row. */
export function Fact({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn("flex h-4 items-center", className)}>
      <span className={CAP_BOX}>{children}</span>
    </span>
  )
}
