import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { LOCAL_ONLY_TEXT } from "@/lib/freshness"

/** /ops và /ops/collections trên cloud: không có source_registry và bảng nạp (tầng A không rời máy), nên độ tươi
 * không đo được ở đây — nói rõ thay vì hiện 0/0 hay vỡ trang. */
export function LocalOnlyAlert() {
  return (
    <Alert variant="info">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>{LOCAL_ONLY_TEXT}</AlertTitle>
      <AlertDescription>
        Bản cloud không giữ bảng nguồn và bảng nạp thô, nên số «nguồn đạt SLO» chỉ có trên Ops ở máy thu. Kiểm ở đó hoặc chạy
        node scripts/check-freshness.mjs.
      </AlertDescription>
    </Alert>
  )
}
