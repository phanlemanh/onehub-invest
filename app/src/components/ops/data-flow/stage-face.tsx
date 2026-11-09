import { cn } from "@/lib/utils"

import type { Stage } from "./flow-sankey-data"

/** Màu chặng (chuyển thể value-faces của @reui/chart-49): dòng chảy trung tính, chỉ đích và nhánh rơi mang màu. */
export const STAGE_COLOR: Record<Stage, string> = {
  channel: "var(--foreground)",
  journey: "var(--foreground)",
  linked: "var(--success)",
  located: "var(--info)",
  clustered: "var(--chart-3)",
  dropped: "var(--destructive)",
  merged: "var(--muted-foreground)",
}

export const STAGE_LABEL: Record<Stage, string> = {
  channel: "Nguồn",
  journey: "Đang chảy",
  linked: "Gắn căn",
  located: "Định vị",
  clustered: "Gom cụm",
  dropped: "Rơi khỏi ống",
  merged: "Gộp trùng",
}

const STAGE_DOT: Record<Stage, string> = {
  channel: "bg-foreground",
  journey: "bg-foreground",
  linked: "bg-success",
  located: "bg-info",
  clustered: "bg-chart-3",
  dropped: "bg-destructive",
  merged: "bg-muted-foreground",
}

export function StageFace({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", STAGE_DOT[stage])} />
      {STAGE_LABEL[stage]}
    </span>
  )
}
