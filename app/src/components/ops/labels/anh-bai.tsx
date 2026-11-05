"use client"

import { useEffect, useRef, useState } from "react"
import { ImageOffIcon } from "lucide-react"

import { Attachment, AttachmentContent, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger } from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtInt } from "@/lib/format"

/**
 * Ảnh của bài trên thẻ gắn nhãn (chuyển thể @reui/c-attachment-3, cùng kiểu với ops/review-photos.tsx, thêm ô tải và Thử lại).
 * `anh` chỉ là đường `/api/zalo-media?nhan=&anh=`, không có URL gốc. Ảnh hỏng không chặn gắn nhãn.
 */
export function AnhBai({ anh, soLinkKhac, coChu }: { anh: string[]; soLinkKhac: number; coChu: boolean }) {
  const [xem, setXem] = useState<number | null>(null)
  if (anh.length === 0 && soLinkKhac === 0) {
    return coChu ? null : <p className="text-muted-foreground text-sm" data-labels-anh-trong="">Bài không có chữ và không có ảnh.</p>
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-labels-anh="">
      {anh.length ? (
        <AttachmentGroup role="group" aria-label="Ảnh của bài">
          {anh.map((src, i) => (
            <OAnh key={src} src={src} thuTu={i + 1} onXem={() => setXem(i)} />
          ))}
        </AttachmentGroup>
      ) : null}
      {soLinkKhac > 0 ? (
        <p className="text-muted-foreground text-xs" data-labels-link-khac="">Bài có {fmtInt(soLinkKhac)} liên kết khác</p>
      ) : null}
      <Dialog open={xem !== null} onOpenChange={(o) => !o && setXem(null)}>
        {xem !== null ? (
          <DialogContent className="sm:max-w-3xl" data-labels-anh-lon="">
            <DialogHeader>
              <DialogTitle>Ảnh {xem + 1}/{anh.length} của bài</DialogTitle>
              <DialogDescription>Đọc chữ trên ảnh rồi đóng để gắn nhãn tiếp.</DialogDescription>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tầng A qua route ops, không qua bộ tối ưu ảnh */}
            <img src={anh[xem]} alt={`Ảnh ${xem + 1} của bài, cỡ lớn`} className="max-h-[75vh] w-full object-contain" />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

function OAnh({ src, thuTu, onXem }: { src: string; thuTu: number; onXem: () => void }) {
  const [trangThai, setTrangThai] = useState<"tai" | "co" | "loi">("tai")
  const [lan, setLan] = useState(0)
  const anhRef = useRef<HTMLImageElement>(null)
  // Ảnh có thể xong hay hỏng trước khi React gắn onLoad, onError: sự kiện đó không phát lại.
  useEffect(() => {
    const a = anhRef.current
    if (a?.complete) setTrangThai(a.naturalWidth > 0 ? "co" : "loi")
  }, [lan])
  if (trangThai === "loi") {
    return (
      <div className="flex items-center gap-2" data-labels-anh-loi="">
        <Attachment orientation="vertical" state="error">
          <AttachmentMedia><ImageOffIcon aria-hidden /></AttachmentMedia>
          <AttachmentContent><AttachmentTitle>Ảnh không tải được</AttachmentTitle></AttachmentContent>
        </Attachment>
        <Button variant="outline" size="xs" onClick={() => { setTrangThai("tai"); setLan((n) => n + 1) }}>Thử lại</Button>
      </div>
    )
  }
  return (
    <Attachment orientation="vertical" state="done" data-labels-anh-o={trangThai}>
      <AttachmentMedia variant="image">
        {trangThai === "tai" ? <Skeleton className="absolute inset-0" data-labels-anh-tai="" /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tầng A qua route ops, không qua bộ tối ưu ảnh */}
        <img
          ref={anhRef}
          src={lan ? `${src}&lan=${lan}` : src}
          alt={`Ảnh ${thuTu} của bài`}
          width={96}
          height={96}
          decoding="async"
          onLoad={() => setTrangThai("co")}
          onError={() => setTrangThai("loi")}
        />
      </AttachmentMedia>
      <AttachmentTrigger aria-label={`Xem lớn ảnh ${thuTu}`} onClick={onXem} />
    </Attachment>
  )
}
