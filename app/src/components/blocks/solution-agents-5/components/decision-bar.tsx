import { Button } from "@/components/ui/button"
import { CircleXIcon, CheckIcon } from "lucide-react"

interface DecisionBarProps {
  selectedCount: number
  onApprove: () => void
  onReject: () => void
  onClear: () => void
}

export function DecisionBar({
  selectedCount,
  onApprove,
  onReject,
  onClear,
}: DecisionBarProps) {
  return (
    <div className="bg-muted/25 flex flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">
          {selectedCount} request{selectedCount === 1 ? "" : "s"} selected
        </span>
        <span className="text-muted-foreground text-xs">
          Approve or reject the selected requests in one step.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onReject}>
          <CircleXIcon data-icon="inline-start" aria-hidden="true" />
          Reject {selectedCount}
        </Button>

        <Button type="button" size="sm" onClick={onApprove}>
          <CheckIcon data-icon="inline-start" aria-hidden="true" />
          Approve {selectedCount}
        </Button>

        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  )
}