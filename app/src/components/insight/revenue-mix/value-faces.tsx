import { cn } from "cn"

import type { ChartConfig } from "@/components/ui/chart"

import { swatchOf, themeOf } from "../../charts/palette"

import { type Slice } from "./view"

/** Trims a label to its caps, so `items-center` centres the letters exactly. */
export const CAP_BOX = "[text-box:trim-both_cap_alphabetic]"

/** A cap-trimmed label that still ellipsizes; it clips only sideways, so
 *  descenders survive the trimmed box. */
export const CAP_TRUNCATE = `${CAP_BOX} overflow-x-clip text-ellipsis whitespace-nowrap`

// Thang doanh thu (chàm) theo độ sáng, sáng hơn một bậc trên thẻ tối; phần "Khác" là vạch
// chéo trung tính để không đọc thành một nguồn. Màu từ bảng màu chung (charts/palette.ts).
export const chartConfig = {
  lead: { label: "Thứ nhất", theme: themeOf("share1") },
  second: { label: "Thứ hai", theme: themeOf("share2") },
  third: { label: "Thứ ba", theme: themeOf("share3") },
  rest: { label: "Khác", theme: themeOf("rest") },
  hatch: { label: "Hatch", theme: themeOf("hatch") },
} satisfies ChartConfig

// Chấm "Khác" mang màu vạch chéo, như block gốc.
const SLICE_DOT: Record<Slice["key"], string> = {
  lead: swatchOf("share1"),
  second: swatchOf("share2"),
  third: swatchOf("share3"),
  rest: swatchOf("hatch"),
}

/** A slice's face: a dot in its ring colour. */
export function SliceDot({ slice }: { slice: Slice["key"] }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-2.5 shrink-0 rounded-full", SLICE_DOT[slice])}
    />
  )
}

export function DotSeparator() {
  return (
    <span
      aria-hidden="true"
      className="bg-muted-foreground/40 size-1 shrink-0 rounded-full"
    />
  )
}