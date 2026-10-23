// chuyển thể từ @reui/solution-dev-ops-5 (section-lead.tsx): khung vùng dùng chung
// của trang Tổng quan — Frame dày, dải đầu có icon + tiêu đề + một mệnh đề, dải chân.
// Giữ nguyên cấu trúc; chỉ đổi import cn sang @/lib/utils.
import { type ComponentProps, type ReactNode } from "react"

import { Frame, FrameDescription, FrameFooter, FrameHeader, FrameTitle } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import { cn } from "@/lib/utils"

export function SectionFrame({ className, ...props }: ComponentProps<"div">) {
  return <Frame dense spacing="default" className={cn("min-w-0", className)} {...props} />
}

export function SectionHead({
  icon,
  title,
  badges,
  description,
  compact = false,
  children,
}: {
  icon: ReactNode
  title: string
  badges?: ReactNode
  description?: ReactNode
  /** Ô KPI: mô tả xuống text-xs. */
  compact?: boolean
  children?: ReactNode
}) {
  return (
    <FrameHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <IconTile variant="frame" size="sm" aria-hidden="true">
          {icon}
        </IconTile>
        <div className="flex min-w-0 flex-col gap-px">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <FrameTitle role="heading" aria-level={3} className="truncate">
              {title}
            </FrameTitle>
            {badges}
          </div>
          {description ? (
            <FrameDescription className={cn("truncate", compact && "text-xs")}>{description}</FrameDescription>
          ) : null}
        </div>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2 max-sm:w-full">{children}</div> : null}
    </FrameHeader>
  )
}

export function SectionFoot({ className, ...props }: ComponentProps<"footer">) {
  return (
    <FrameFooter
      className={cn(
        "text-muted-foreground min-h-10 flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export function DotSeparator() {
  return <span aria-hidden className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
}
