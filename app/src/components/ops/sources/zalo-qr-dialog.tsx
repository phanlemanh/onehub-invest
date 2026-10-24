"use client"

// chuyển thể từ @reui/solution-ai-ops-2 (provider-settings.tsx · SettingsDialog, nhánh "connect"):
// hộp kết nối một tài khoản — thay ô nhập khoá bằng ảnh mã QR của Zalo.
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export function ZaloQrDialog({
  qr,
  connected,
  onOpenChange,
  onRetry,
  onCancelLogin,
}: {
  qr: { accountId: string; base64: string | null } | null
  connected: boolean | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
  onCancelLogin: () => void
}) {
  return (
    <Dialog open={qr !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập {qr?.accountId}</DialogTitle>
          <DialogDescription>Mở ứng dụng Zalo trên điện thoại của số dùng cho tài khoản này rồi quét mã. Mã hết hạn sau khoảng 2 phút.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {qr?.base64 ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh QR là data URI do API trả, không qua tối ưu ảnh của Next
            <img src={`data:image/png;base64,${qr.base64}`} alt="Mã QR đăng nhập Zalo" className="size-48" />
          ) : (
            <Skeleton className="size-48" aria-label="Đang sinh mã QR" />
          )}
          {connected === true ? <Badge variant="success-light">Đã kết nối</Badge> : connected === false ? <Badge variant="outline">Đang chờ quét</Badge> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancelLogin}>
            Huỷ đăng nhập
          </Button>
          <Button type="button" variant="outline" onClick={onRetry}>
            Mã QR mới
          </Button>
          <DialogClose render={<Button type="button" />}>Xong</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
