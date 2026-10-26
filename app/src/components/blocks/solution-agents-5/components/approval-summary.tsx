import { Badge } from "@/components/reui/badge"
import { cn } from "cn"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SUMMARY } from "./data"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

// ── Approval summary metrics (stats-1 tile grammar, page Card container) ──

export function ApprovalSummary({
  counts,
  className,
}: {
  counts: { pending: number; overSla: number; approvedToday: number }
  className?: string
}) {
  return (
    <div className={cn("@container w-full", className)}>
      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @4xl:grid-cols-4">
        {SUMMARY.map((tile) => (
          <Card key={tile.title}>
            <CardContent className="flex flex-col gap-5">
              <h3 className="text-muted-foreground text-sm font-medium">
                {tile.title}
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                    {tile.liveKey ? counts[tile.liveKey] : tile.value}
                  </span>
                  <Badge
                    variant={
                      tile.positive ? "success-light" : "destructive-light"
                    }
                  >
                    {tile.delta > 0 ? (
                      <ArrowUpIcon aria-hidden="true" />
                    ) : (
                      <ArrowDownIcon aria-hidden="true" />
                    )}
                    {Math.abs(tile.delta)}%
                  </Badge>
                </div>
                <Separator />
                <div className="text-muted-foreground text-xs">
                  {tile.sublabel}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}