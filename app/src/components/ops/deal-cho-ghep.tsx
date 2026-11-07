import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"

/**
 * Căn đang là một vế của thẻ Ghép căn còn chờ (OD1 · ĐC7): badge «Đang chờ ghép»; `lienKet` thêm nút tới từng thẻ ở hàng
 * duyệt (`/ops/review?card=<id>`). Không lộ nội dung thẻ — vai Người xem tới trang chỉ có số đếm như cũ.
 */
export function DealChoGhep({ ids, lienKet = false }: { ids: number[] | undefined; lienKet?: boolean }) {
  if (!ids || ids.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5" data-deal-cho-ghep={ids.join(",")}>
      <Badge variant="warning-light">Đang chờ ghép</Badge>
      {lienKet &&
        ids.map((id) => (
          <Button
            key={id}
            variant="link"
            size="xs"
            nativeButton={false}
            render={<Link prefetch={false} href={`/ops/review?card=${id}`} />}
            data-deal-cho-ghep-the={id}
          >
            Mở thẻ ghép #{id}
          </Button>
        ))}
    </div>
  )
}
