import { Badge } from "@/components/reui/badge"

/** Nhãn suy luận (ADR-0016 §8): chỉ hiển thị, không lưu — người từ 5 tin còn sống trở lên. */
export function MoiGioiBadge() {
  return (
    <Badge variant="info-light" data-people-moi-gioi="">
      Có thể là môi giới · suy luận
    </Badge>
  )
}
