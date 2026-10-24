import { repostLabel } from "@/lib/deals"
import { fmtVnDate } from "@/lib/format"

/** Dòng «thấy <ngày VN> · đăng N lần» dưới mỗi căn giá tốt (/ops/deals) — ngày theo giờ VN (ON8). */
export function DealSeenNote({ firstSeen, nReposts }: { firstSeen: string; nReposts: number }) {
  return (
    <p className="text-muted-foreground text-xs">
      thấy {fmtVnDate(firstSeen)} · {repostLabel(nReposts)}
    </p>
  )
}
