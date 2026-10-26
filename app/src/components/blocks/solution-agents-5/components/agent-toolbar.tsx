import { Button } from "@/components/ui/button"
import { RefreshCwIcon, DownloadIcon, ListChecksIcon } from "lucide-react"

// ── Approval Inbox header (content-level section header, agents-1 grammar) ──

export function AgentToolbar({
  total,
  pending,
  overSla,
  onReviewNext,
  onRefresh,
  onExport,
}: {
  total: number
  pending: number
  overSla: number
  onReviewNext: () => void
  onRefresh: () => void
  onExport: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: section identity + live status */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-foreground text-lg leading-tight font-semibold tracking-tight">
            Approval Inbox
          </h2>
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-muted-foreground hidden text-sm sm:block">
              Live
            </span>
          </span>
        </div>
        <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
          <span className="tabular-nums">{total} requests</span>
          <span className="bg-input size-1 shrink-0 rounded-full" aria-hidden="true" />
          <span className="tabular-nums">{pending} pending</span>
          <span className="bg-input size-1 shrink-0 rounded-full" aria-hidden="true" />
          <span className="tabular-nums">{overSla} over SLA</span>
        </p>
      </div>

      {/* Right: reviewer action bar */}
      <div className="flex shrink-0 items-center gap-2">
        <Button size="icon-sm" type="button" variant="ghost" onClick={onRefresh} aria-label="Refresh queue">
          <RefreshCwIcon aria-hidden="true" />
        </Button>

        <Button size="sm" type="button" variant="outline" onClick={onExport}>
          <DownloadIcon aria-hidden="true" />
          <span className="hidden sm:block">Export</span>
        </Button>

        <Button size="sm" type="button" onClick={onReviewNext}>
          <ListChecksIcon aria-hidden="true" />
          <span className="hidden sm:block">Review Next</span>
        </Button>
      </div>
    </div>
  )
}