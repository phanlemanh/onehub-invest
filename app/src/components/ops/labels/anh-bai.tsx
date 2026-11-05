"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon, ImageOffIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Attachment, AttachmentGroup, AttachmentMedia, AttachmentTrigger } from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtInt } from "@/lib/format"
import type { GhepHien } from "@/lib/labels-anh"

/**
 * Ảnh của bài trên thẻ gắn nhãn (chuyển thể @reui/c-attachment-3, cùng kiểu với ops/review-photos.tsx, thêm ô tải và Thử lại).
 * `anh` chỉ là đường `/api/zalo-media?nhan=&anh=`, không có URL gốc. Ảnh hỏng không chặn gắn nhãn.
 * `ghep` là kết quả luật PL28: ảnh và chữ ghép theo thời gian, nên phải ghi rõ là suy ra.
 */
export function AnhBai({ anh, soLinkKhac, coChu, ghep = null }: { anh: string[]; soLinkKhac: number; coChu: boolean; ghep?: GhepHien | null }) {
  const [xem, setXem] = useState<number | null>(null)
  const chuyen = useCallback((buoc: number) => setXem((i) => (i === null ? i : Math.min(anh.length - 1, Math.max(0, i + buoc)))), [anh.length])
  const dangXem = xem !== null
  // Nghe ở window: nút đang giữ tiêu điểm bị tắt khi chạm đầu mút thì tiêu điểm rơi ra ngoài hộp.
  useEffect(() => {
    if (!dangXem) return
    const nghe = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") chuyen(-1)
      if (e.key === "ArrowRight") chuyen(1)
    }
    window.addEventListener("keydown", nghe)
    return () => window.removeEventListener("keydown", nghe)
  }, [dangXem, chuyen])
  if (anh.length === 0 && soLinkKhac === 0) {
    return coChu ? null : <p className="text-muted-foreground text-sm" data-labels-anh-trong="">Bài không có chữ và không có ảnh.</p>
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5" data-labels-anh="">
      {ghep?.suyRa ? (
        <div className="flex flex-wrap items-center gap-1.5" data-labels-ghep="">
          <Badge variant="info-light">Ghép suy ra · {fmtInt(anh.length)} ảnh</Badge>
          {ghep.soChuGan > 1 ? (
            <Badge variant="warning-light" data-labels-ghep-nhieu="">Có {fmtInt(ghep.soChuGan)} tin chữ trong 2 phút, máy chọn tin gần nhất</Badge>
          ) : null}
        </div>
      ) : null}
      {ghep?.khongChu && anh.length > 0 ? (
        <p className="text-muted-foreground text-xs" data-labels-ghep-khong-chu="">Không có tin chữ trong 2 phút</p>
      ) : null}
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
              <DialogTitle>Ảnh {fmtInt(xem + 1)}/{fmtInt(anh.length)} của bài</DialogTitle>
              <DialogDescription>Đọc chữ trên ảnh rồi đóng để gắn nhãn tiếp.</DialogDescription>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh tầng A qua route ops, không qua bộ tối ưu ảnh */}
            <img src={anh[xem]} alt={`Ảnh ${xem + 1} của bài, cỡ lớn`} className="max-h-[70vh] w-full object-contain" />
            {anh.length > 1 ? (
              <DialogFooter>
                <Button variant="outline" size="sm" disabled={xem === 0} onClick={() => chuyen(-1)}>
                  <ChevronLeftIcon data-icon="inline-start" aria-hidden />
                  Ảnh trước
                </Button>
                <Button variant="outline" size="sm" disabled={xem === anh.length - 1} onClick={() => chuyen(1)}>
                  Ảnh sau
                  <ChevronRightIcon data-icon="inline-end" aria-hidden />
                </Button>
              </DialogFooter>
            ) : null}
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
      <div className="flex flex-wrap items-center gap-2" data-labels-anh-loi="">
        <Attachment orientation="vertical" state="error">
          <AttachmentMedia><ImageOffIcon aria-hidden /></AttachmentMedia>
        </Attachment>
        {/* Không để trong AttachmentTitle: ô rộng 96px cắt câu thành «Ảnh không t…». */}
        <span className="text-sm">Ảnh không tải được</span>
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
          loading="lazy"
          decoding="async"
          onLoad={() => setTrangThai("co")}
          onError={() => setTrangThai("loi")}
        />
      </AttachmentMedia>
      <AttachmentTrigger aria-label={`Xem lớn ảnh ${thuTu}`} onClick={onXem} />
    </Attachment>
  )
}
