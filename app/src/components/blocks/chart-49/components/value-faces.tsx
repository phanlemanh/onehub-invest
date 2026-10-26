import { cn } from "cn"

import { type Stage } from "./data"

/** Stage tokens; the journey stays neutral so the two outcomes carry colour. */
export const STAGE_COLOR: Record<Stage, string> = {
  channel: "var(--foreground)",
  journey: "var(--foreground)",
  upgraded: "var(--success)",
  dropped: "var(--destructive)",
}

export const STAGE_LABEL: Record<Stage, string> = {
  channel: "Channel",
  journey: "In Journey",
  upgraded: "Upgraded",
  dropped: "Dropped Off",
}

const STAGE_DOT: Record<Stage, string> = {
  channel: "bg-foreground",
  journey: "bg-foreground",
  upgraded: "bg-success",
  dropped: "bg-destructive",
}

export function StageFace({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", STAGE_DOT[stage])}
      />
      {STAGE_LABEL[stage]}
    </span>
  )
}