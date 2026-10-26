import { Badge } from "@/components/reui/badge"
import { REVIEW_TYPE_LABEL, reviewStatusLabel, reviewTypeLabel } from "@/lib/ops/review-queue"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "warning-light",
  approved: "success-light",
  rejected: "destructive-light",
  deferred: "outline",
}

/** Loại thẻ: loại đã có giao diện → nhãn tiếng Việt; loại lạ → mã nguyên văn trong <code>. */
export function ReviewTypeBadge({ type }: { type: string }) {
  if (!(type in REVIEW_TYPE_LABEL)) {
    return (
      <Badge variant="outline">
        <code>{type}</code>
      </Badge>
    )
  }
  return <Badge variant={type === "entity_match" ? "info-light" : "primary-light"}>{reviewTypeLabel(type)}</Badge>
}

export function ReviewStatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{reviewStatusLabel(status)}</Badge>
}
