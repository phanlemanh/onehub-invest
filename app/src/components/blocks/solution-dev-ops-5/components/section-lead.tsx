import { type ComponentProps, type ReactNode } from "react"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
} from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import { cn } from "cn"

/** Every section's container: one dense frame at the house rung. */
export function SectionFrame({ className, ...props }: ComponentProps<"div">) {
  return (
    <Frame
      dense
      spacing="default"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
}

/** The header band: frame tile, title with state badges, one clause, actions. */
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
  /** State chips inline after the title (house badge policy, never ms-auto). */
  badges?: ReactNode
  description?: ReactNode
  /** KPI tiles: the description drops to text-xs, as dev-ops-1 tiles do. */
  compact?: boolean
  /** Trailing actions; they wrap to their own full row when the band is narrow. */
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
            <FrameDescription className={cn("truncate", compact && "text-xs")}>
              {description}
            </FrameDescription>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
          {children}
        </div>
      ) : null}
    </FrameHeader>
  )
}

/** The footer band: it reads its panel. One 40px row, wrapping only when it must. */
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