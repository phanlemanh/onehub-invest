import { IconTile } from "@/components/reui/icon-tile"
import { cn } from "cn"

import type { Workspace } from "./data"

export const CAP_BOX = "[text-box:trim-both_cap_alphabetic]"
export const CAP_TRUNCATE = `${CAP_BOX} overflow-x-clip text-ellipsis whitespace-nowrap`

// Menu rows take a 28px tile with a 14px glyph; the card trigger's is 24px.
export const MENU_TILE =
  "[--icon-tile-size:--spacing(7)] [--icon-tile-icon-size:--spacing(3.5)]"
export const CARD_TILE =
  "[--icon-tile-size:--spacing(6)] [--icon-tile-icon-size:--spacing(3.5)]"

// app-shell-24's account card, worn by both sidebar menu triggers: a border
// (the ring is the focus channel) on the muted fill, 40px.
export const CARD_TRIGGER =
  "border-input/50 bg-muted/50 h-10 gap-2 rounded-lg border px-2 text-xs [&>svg:last-child]:size-3.5"
export const CARD_TEXT = "grid min-w-0 flex-1 gap-0.5 text-start leading-none"
export const CARD_NAME =
  "text-sidebar-accent-foreground truncate text-xs leading-none font-medium"
export const CARD_META = "text-muted-foreground truncate text-[10px]"
// Sized from the trigger: its own [&_svg]:size-4 outranks the glyph.
export const CARD_CHEVRON = "text-muted-foreground"

// app-shell-29's folded card: the wash and hairline survive as a 32px square
// with the 24px mark 4px in from its edge.
export const RAIL_CARD =
  "bg-muted/50 border-input/50 hover:bg-muted size-8 justify-center rounded-lg border bg-clip-border p-0"

/** The workspace's coloured tile. A focused menu row inks every descendant,
 * the glyph's paths included, with the accent colour, so all of them hold white. */
export function WorkspaceTile({
  workspace,
  className,
}: {
  workspace: Workspace
  className?: string
}) {
  return (
    <IconTile
      variant="solid"
      size="sm"
      aria-hidden="true"
      className={cn(workspace.color, "**:text-white!", className)}
    >
      {workspace.icon}
    </IconTile>
  )
}