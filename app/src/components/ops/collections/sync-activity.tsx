"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (sync-activity.tsx): cột chồng theo thời gian
// + chú giải + nút chọn chế độ. Khác bản gốc: trục là 7 NGÀY (không phải 24 giờ — dữ liệu
// luồng tính theo ngày), hai chế độ Listing / S03 (bài nhận + tin rao mới + tin có bài hôm đó); bỏ hoa văn cột trống và thẻ docked.
// ON25: tab S03 không chồng cột — tin rao mới là tập con của tin có bài hôm đó, chồng lên nhau là đếm trùng.
import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { themeOf } from "@/components/charts/palette"
import { Frame, FramePanel } from "@/components/reui/frame"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { FlowDay } from "@/lib/collections-queries"
import { fmtCompact, fmtInt } from "@/lib/format"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"
import { cn } from "@/lib/utils"

import { SectionHeader } from "./section"

type Mode = "listings" | "zalo"
const modesOf = (roles: SourceRoles): { value: Mode; label: string }[] => [
  { value: "listings", label: "Listing" },
  { value: "zalo", label: sourceLabel("S03", roles) },
]
// ON6 (luật 5): tab Listing chỉ đếm tự thu — không chuỗi S02.
export const SERIES: Record<Mode, (keyof FlowDay)[]> = {
  listings: ["airbnbListingsSeen"],
  zalo: ["zaloPosts", "zaloOffers", "s03ActiveOffers"],
}
// Khối lượng đã vào kho dùng opsVolume (tin rao mới) và opsVolumeActive (tin có bài hôm đó, cùng họ, nhạt hơn); bản ghi
// thô/chạm dùng opsVolumeRaw — khoá Ops trong palette.ts, xem data-color.md mục Ops.
export const configOf = (roles: SourceRoles) =>
  ({
    airbnbListingsSeen: { label: `${sourceLabel("S01", roles)} — listing tươi`, theme: themeOf("opsVolume") },
    zaloPosts: { label: `${sourceLabel("S03", roles)} — bài nhận`, theme: themeOf("opsVolumeRaw") },
    zaloOffers: { label: `${sourceLabel("S03", roles)} — tin rao mới`, theme: themeOf("opsVolume") },
    s03ActiveOffers: { label: `${sourceLabel("S03", roles)} — tin có bài hôm đó`, theme: themeOf("opsVolumeActive") },
  }) satisfies ChartConfig

/** ON25: nhóm chồng cột theo chế độ — tab S03 không chồng (tin rao mới ⊂ tin có bài hôm đó), tab Listing giữ chồng như cũ. */
export const stackOf = (mode: Mode): string | undefined => (mode === "zalo" ? undefined : mode)

/** Mô tả dưới tiêu đề: nói rõ tab đang đếm gì (ON6). Tab S03 (ON25) không cộng bài với tin: nêu riêng tổng bài nhận, tổng
 * tin rao mới và khoảng tin có bài mỗi ngày. */
export function describeMode(mode: Mode, days: FlowDay[]): string {
  const sum = (k: keyof FlowDay) => days.reduce((s, d) => s + Number(d[k] || 0), 0)
  if (mode === "listings") return `Listing tự thu (S01) thấy theo ngày — ${fmtInt(sum("airbnbListingsSeen"))} listing trong 7 ngày, ngày theo giờ VN`
  const active = days.map((d) => Number(d.s03ActiveOffers || 0))
  const khoang = active.length ? `${fmtInt(Math.min(...active))}–${fmtInt(Math.max(...active))}` : "0"
  return `S03 theo ngày đăng — 7 ngày: ${fmtInt(sum("zaloPosts"))} bài nhận · ${fmtInt(sum("zaloOffers"))} tin rao mới; mỗi ngày ${khoang} tin có bài, ngày theo giờ VN`
}

export function SyncActivity({ days, roles = {}, className }: { days: FlowDay[]; roles?: SourceRoles; className?: string }) {
  const modes = modesOf(roles)
  const config = configOf(roles)
  const [mode, setMode] = useState<Mode>("listings")
  const series = SERIES[mode]
  // Truy vấn trả ngày mới nhất trước; biểu đồ đọc trái → phải theo thời gian.
  const data = [...days].reverse()
  const total = data.reduce((sum, d) => sum + series.reduce((s, k) => s + Number(d[k] || 0), 0), 0)

  return (
    <Frame id="luong" spacing="default" className={cn("scroll-mt-4", className)}>
      <SectionHeader title="Luồng 7 ngày" description={describeMode(mode, data)}>
        <ToggleGroup
          multiple={false}
          value={[mode]}
          onValueChange={(value: string[]) => {
            const next = modes.find((m) => m.value === value[0])
            if (next) setMode(next.value)
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Chế độ biểu đồ"
        >
          {modes.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value} className="text-muted-foreground data-pressed:text-foreground">
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SectionHeader>
      <FramePanel>
        {total === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyTitle>Chưa có luồng</EmptyTitle>
              <EmptyDescription>7 ngày qua chưa có bản ghi nào cho chế độ này.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-56 w-full min-w-0" initialDimension={{ width: 720, height: 224 }}>
            <BarChart data={data} accessibilityLayer barCategoryGap="20%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5).split("-").reverse().join("/")} tickLine={false} axisLine={false} tickMargin={8} height={26} />
              <YAxis allowDecimals={false} tickCount={4} tickFormatter={(v: number) => fmtCompact(v)} tickLine={false} axisLine={false} tickMargin={4} width="auto" />
              <ChartTooltip cursor={false} isAnimationActive={false} content={<ChartTooltipContent />} />
              {series.map((key) => (
                <Bar key={`${mode}-${key}`} dataKey={key} stackId={stackOf(mode)} fill={`var(--color-${key})`} maxBarSize={28} isAnimationActive={false} />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </FramePanel>
    </Frame>
  )
}
