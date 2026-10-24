import type { ReactNode } from "react"
import { InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { LOCAL_ONLY_TEXT } from "@/lib/freshness"

/** Trang Ops trên cloud gặp bảng tầng A vắng (không rời máy local): nói rõ thay vì hiện 0/0 hay vỡ trang.
 * Mặc định là câu độ tươi của /ops và /ops/collections; trang khác truyền tiêu đề + mô tả của mình. */
export function LocalOnlyAlert({ title = LOCAL_ONLY_TEXT, children }: { title?: string; children?: ReactNode }) {
  return (
    <Alert variant="info">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {children ?? (
          <>
            Bản cloud không giữ bảng nguồn và bảng nạp thô, nên số «nguồn đạt SLO» chỉ có trên Ops ở máy thu. Kiểm ở đó
            hoặc chạy node scripts/check-freshness.mjs.
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
