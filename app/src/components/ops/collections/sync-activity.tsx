"use client"

// chuyển thể từ @reui/solution-dev-ops-6 (sync-activity.tsx): cột chồng theo thời gian
// + chú giải + nút chọn chế độ. Khác bản gốc: trục là 7 NGÀY (không phải 24 giờ — dữ liệu
// luồng tính theo ngày), hai chế độ Listing / Tin Zalo; bỏ hoa văn cột trống và thẻ docked.
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
  { value: "zalo", label: `Tin ${sourceLabel("S03", roles)}` },
]
// ON6 (luật 5): tab Listing chỉ đếm tự thu — không chuỗi S02.
export const SERIES: Record<Mode, (keyof FlowDay)[]> = {
  listings: ["airbnbListingsSeen"],
  zalo: ["zaloOffers", "zaloPosts"],
}
// Chuỗi thứ nhất của mỗi chế độ là khối lượng đã vào kho (opsVolume), chuỗi thứ hai là bản ghi
// thô/chạm (opsVolumeRaw) — khoá Ops trong palette.ts, xem data-color.md mục Ops.
export const configOf = (roles: SourceRoles) =>
  ({
    airbnbListingsSeen: { label: `${sourceLabel("S01", roles)} — listing tươi`, theme: themeOf("opsVolume") },
    zaloOffers: { label: `${sourceLabel("S03", roles)} — tin rao vào kho`, theme: themeOf("opsVolume") },
    zaloPosts: { label: `${sourceLabel("S03", roles)} — bài thô`, theme: themeOf("opsVolumeRaw") },
  }) satisfies ChartConfig

/** Mô tả dưới tiêu đề: nói rõ tab đang đếm gì (ON6), kèm tổng của đúng tab. */
export function describeMode(mode: Mode, total: number): string {
  return mode === "listings"
    ? `Listing tự thu (S01) thấy theo ngày — ${fmtInt(total)} listing trong 7 ngày, ngày theo giờ VN`
    : `Bài thô và tin rao S03 theo ngày đăng — ${fmtInt(total)} bản ghi trong 7 ngày, ngày theo giờ VN`
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
      <SectionHeader title="Luồng 7 ngày" description={describeMode(mode, total)}>
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
                <Bar key={`${mode}-${key}`} dataKey={key} stackId={mode} fill={`var(--color-${key})`} maxBarSize={28} isAnimationActive={false} />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </FramePanel>
    </Frame>
  )
}
