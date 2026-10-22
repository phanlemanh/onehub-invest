import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** The bordered card every panel and designed state sits on. */
export const PANEL_CARD = "border-border border shadow-xs ring-0"

function PanelSkeleton({ height }: { height: string }) {
  return (
    <Card className={PANEL_CARD}>
      <CardContent className={`flex flex-col gap-6 ${height}`}>
        <div className="flex h-10 shrink-0 flex-col gap-2">
          <Skeleton className="bg-input/50 min-h-px flex-1" />
          <Skeleton className="bg-input/50 min-h-px flex-1" />
        </div>
        <Skeleton className="bg-input/50 min-h-px flex-1" />
      </CardContent>
    </Card>
  )
}

export function ContentSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      {/* Summary strip: four short tiles where the stat cards would sit. */}
      <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
        {["stat-1", "stat-2", "stat-3", "stat-4"].map((id) => (
          <PanelSkeleton key={id} height="h-24" />
        ))}
      </div>
      <div className="grid gap-4 @2xl:grid-cols-2">
        {["panel-1", "panel-2", "panel-3", "panel-4"].map((id) => (
          <PanelSkeleton key={id} height="h-65" />
        ))}
      </div>
    </div>
  )
}