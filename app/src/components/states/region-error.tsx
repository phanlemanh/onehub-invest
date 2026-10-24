"use client"

import { catchError, type ErrorInfo } from "next/error"
import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Button } from "@/components/ui/button"

/**
 * Lỗi tại chỗ của MỘT vùng dữ liệu (c-alert-1 destructive + Thử lại, cùng chữ với PageError).
 * Khác error.tsx: chỉ thay vùng hỏng, PageHeader và phần còn lại của trang vẫn đứng. `retry()`
 * của `catchError` tải lại vùng từ server; redirect()/notFound() không bị bắt nhầm.
 */
function RegionErrorFallback({ what }: { what: string }, { error, retry }: ErrorInfo) {
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Không tải được {what}</AlertTitle>
      <AlertDescription>
        <p>Thử lại sau giây lát; nếu vẫn lỗi, báo cho đội vận hành kèm mã bên dưới.</p>
        {digest && <p className="font-mono text-xs">Mã lỗi: {digest}</p>}
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={() => retry()}>
          <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
          Thử lại
        </Button>
      </AlertAction>
    </Alert>
  )
}

export const RegionError = catchError(RegionErrorFallback)
