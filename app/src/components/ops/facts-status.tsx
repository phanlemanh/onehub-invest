import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { fmtVnDateTime } from "@/lib/format"
import type { FactsState } from "@/lib/ops-facts"

/** Trạng thái số máy local đẩy lên cloud (ON3, ADR-0014 §Ngưỡng trễ) — dựng một lần, ON2/ON4/ON5 dùng lại.
 * `measuredAt` là mốc đẩy cuối; giờ VN qua bộ định dạng chung của ON8. */
export type FactsStatusProps = { state: FactsState; measuredAt: string | null }

/** Dòng «Số đo lúc … từ máy thu» dưới PageHeader khi đã có bản tin (tươi hay cũ). */
export function FactsStamp({ state, measuredAt }: FactsStatusProps) {
  if (state === "none") return null
  return (
    <p className="text-muted-foreground text-xs tabular-nums" data-facts-stamp={state}>
      Số đo lúc {fmtVnDateTime(measuredAt)} từ máy thu
    </p>
  )
}

/** Alert số cũ quá 45′ (FACTS_STALE_MS của lib/ops-facts): số dưới đó là lần đo cuối, không phải trạng thái hiện tại. */
export function FactsStaleAlert({ state, measuredAt }: FactsStatusProps) {
  if (state !== "stale") return null
  return (
    <Alert variant="warning" data-facts-stale="">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Máy thu không đẩy số từ {fmtVnDateTime(measuredAt)}</AlertTitle>
      <AlertDescription>Số dưới đây là lần đo cuối — kiểm tác vụ đồng bộ ở máy thu.</AlertDescription>
    </Alert>
  )
}
