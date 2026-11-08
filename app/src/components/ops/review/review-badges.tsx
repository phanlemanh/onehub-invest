import { Badge } from "@/components/reui/badge"
import { reviewKind, type CategoryInput } from "@/lib/ops/review-hang-muc"
import { reviewStatusLabel, reviewTypeLabel } from "@/lib/ops/review-queue"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "warning-light",
  approved: "success-light",
  rejected: "destructive-light",
  deferred: "outline",
}

const KIND_VARIANT: Record<string, BadgeVariant> = {
  entity_match: "info-light",
  agent_output: "primary-light",
  nguoi: "warning-light",
}

/** Loại thẻ: loại đã có giao diện → nhãn tiếng Việt (thẻ Người tách khỏi `data_quality`); loại lạ → mã nguyên văn trong <code>. */
export function ReviewTypeBadge({ item }: { item: CategoryInput }) {
  const label = reviewTypeLabel(item)
  if (label === null) {
    return (
      <Badge variant="outline">
        <code>{item.item_type}</code>
      </Badge>
    )
  }
  return <Badge variant={KIND_VARIANT[reviewKind(item)]} data-review-kind={reviewKind(item)}>{label}</Badge>
}

/** Trạng thái: chờ → «Chờ duyệt»; đã quyết → nhãn đáp án đã bấm (OD1 · ĐC1). Màu theo trạng thái. */
export function ReviewStatusBadge({ item }: { item: CategoryInput & { status: string } }) {
  return <Badge variant={STATUS_VARIANT[item.status] ?? "outline"} data-review-status={item.status}>{reviewStatusLabel(item)}</Badge>
}
