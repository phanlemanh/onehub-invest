"use client"

import { CircleAlertIcon, HouseIcon, RotateCwIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Button } from "@/components/ui/button"

/**
 * Lỗi toàn cục (nội dung của `app/global-error.tsx`): layout gốc hoặc layout một cổng hỏng nên
 * không còn shell nào. Cùng Alert destructive với PageError, thêm lối về trang chủ bằng thẻ <a>
 * thường — router phía client có thể chính là thứ đang hỏng.
 */
export function AppCrash({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>One Invest không mở được</AlertTitle>
          <AlertDescription>
            <p>
              Đã có lỗi khi dựng trang. Thử lại sau giây lát; nếu vẫn lỗi, báo cho đội vận hành
              kèm mã bên dưới.
            </p>
            {error?.digest && <p className="font-mono text-xs">Mã lỗi: {error.digest}</p>}
          </AlertDescription>
          <AlertAction className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
              Thử lại
            </Button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- sau lỗi toàn cục cần tải lại cả tài liệu, không điều hướng mềm qua router đang hỏng */}
            <Button variant="ghost" size="sm" nativeButton={false} render={<a href="/" />}>
              <HouseIcon data-icon="inline-start" aria-hidden="true" />
              Về trang chủ
            </Button>
          </AlertAction>
        </Alert>
      </div>
    </main>
  )
}
