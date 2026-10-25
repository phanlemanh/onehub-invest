import Link from "next/link"
import { BookmarkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * Đã lưu trống — chuyển thể c-empty-11 (Bookmarks empty state): ô bookmark + MỘT nút outline.
 * Khác bản gốc: chữ tiếng Việt, nút dẫn sang Finder, thêm `border` để khung khớp các vùng trống
 * khác của app.
 */
export function SavedEmpty() {
  return (
    <Empty className="border py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookmarkIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa lưu khu vực nào</EmptyTitle>
        <EmptyDescription>Mở một thị trường hoặc phường và bấm “Lưu” để theo dõi ở đây.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vn" />}>
          Tìm thị trường
        </Button>
      </EmptyContent>
    </Empty>
  )
}
