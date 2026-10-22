"use client"

/**
 * Cơ cấu doanh thu theo loại phòng — chuyển thể từ @reui/chart-13: tổng ở trên,
 * vòng donut ba loại lớn nhất + phần còn lại, bảng loại phòng với tỉ trọng.
 * Khác bản gốc: một cửa sổ duy nhất (không đổi kỳ), cột "thay đổi" thành số
 * listing vì chưa có kỳ trước.
 */
import { useMemo } from "react"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { cn } from "cn"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { fmtInt, fmtMoneyCompact } from "@/lib/format"
import { copyText, downloadFile, toastDownloaded } from "@/components/charts/actions"
import { CAP_BOX, CAP_TRUNCATE, DotSeparator } from "@/components/charts/faces"

import { MoreMenu, type CardActions } from "./card-menu"
import { MixDonut } from "./mix-donut"
import { InfoTooltip, SliceLegend } from "./slice-legend"
import { csvOf, slicesOf, type MixInput } from "./view"

export function RevenueMixChart({
  rows,
  currency,
  window,
}: {
  rows: MixInput[]
  currency: string
  /** Mô tả cửa sổ dữ liệu, vd "12 tháng tới". */
  window: string
}) {
  const format = (v: number) => fmtMoneyCompact(v, currency)
  const { slices, total } = useMemo(() => slicesOf(rows), [rows])
  const listings = slices.reduce((sum, slice) => sum + slice.listings, 0)
  const empty = total <= 0

  const summary = [
    `Doanh thu ${window}: ${format(total)}.`,
    slices.map((s) => `${s.name} ${format(s.amount)} (${s.share}%)`).join(", ") + ".",
  ].join(" ")

  const actions: CardActions = {
    exportCsv: () => {
      const name = "co-cau-doanh-thu.csv"
      downloadFile(name, csvOf(slices, total), "text/csv")
      toastDownloaded(`${name}, ${slices.length} loại phòng và tổng.`)
    },
    copySummary: () => void copyText(summary, "Đã sao chép tóm tắt", summary),
  }

  return (
    <Frame stacked spacing="default" className="@container w-full min-w-0">
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-px">
          <span className="flex h-5 min-w-0 items-center gap-1">
            <FrameTitle role="heading" aria-level={3} className={CAP_TRUNCATE}>
              Cơ cấu doanh thu
            </FrameTitle>
            <InfoTooltip />
          </span>
          <FrameDescription>Theo loại phòng, {window}</FrameDescription>
        </div>
        <MoreMenu actions={actions} canExport={!empty} />
      </FrameHeader>

      <FramePanel className="flex flex-col gap-6">
        {empty ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có doanh thu</EmptyTitle>
              <EmptyDescription>
                Khu vực này chưa có đêm nào được đặt trong cửa sổ dữ liệu.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <span className="text-muted-foreground flex h-5 items-center text-sm">
                <span className={CAP_BOX}>Tổng doanh thu</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                <span
                  className={cn(
                    "text-3xl font-semibold tracking-tight tabular-nums",
                    CAP_BOX
                  )}
                >
                  {format(total)}
                </span>
              </span>
            </div>

            <div className="grid gap-6 @lg:grid-cols-[10rem_minmax(0,1fr)] @lg:items-center">
              <MixDonut
                slices={slices}
                center={fmtInt(listings)}
                centerLabel="listing"
                format={format}
                label={`Doanh thu theo loại phòng: ${slices
                  .map((slice) => `${slice.name} ${slice.share}%`)
                  .join(", ")}`}
              />
              <SliceLegend slices={slices} format={format} />
            </div>
          </>
        )}
      </FramePanel>

      <FrameFooter className="text-muted-foreground flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span className="flex h-4 items-center gap-2">
          <span className={CAP_BOX}>Giá niêm yết</span>
          <DotSeparator />
          <span className={CAP_BOX}>Đêm đã đặt</span>
        </span>
        <span className="flex h-4 items-center">
          <span className={CAP_BOX}>{currency}</span>
        </span>
      </FrameFooter>
    </Frame>
  )
}
