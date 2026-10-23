import type { ChartConfig } from "@/components/ui/chart"

import { KeyDot } from "@/components/charts/faces"
import { swatchOf, themeOf } from "@/components/charts/palette"

import { type Slice } from "./view"

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
  return <KeyDot swatch={SLICE_DOT[slice]} size="md" />
}
