import Link from "next/link"
import { BookUserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

/** /ops/registry/<mã> không phải một dự án của danh bạ (mã sai khuôn, nút không có, nút không phải dự án gốc) — DA67. */
export default function NotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookUserIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Không có dự án này trong danh bạ</EmptyTitle>
        <EmptyDescription>Mã trong đường dẫn không trỏ tới một dự án gốc. Mở lại dự án từ danh sách.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link prefetch={false} href="/ops/registry" />}>
          Về danh bạ
        </Button>
      </EmptyContent>
    </Empty>
  )
}
