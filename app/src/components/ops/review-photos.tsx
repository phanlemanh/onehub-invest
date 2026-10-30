"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageOffIcon } from "lucide-react";

import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReviewImage } from "@/lib/ops/review-media";

/**
 * Dải ảnh tin trên thẻ hàng duyệt (chuyển thể @reui/c-attachment-3) + hộp phóng to.
 * `images` từ loadReviewMedia: vai Vận hành nhận ảnh đã tải về máy thu, quản trị viên nhận cả URL gốc (PL3);
 * undefined thì không render gì. `chiGoc` = số ảnh chỉ có URL gốc mà vai người xem không nhận — thẻ nói ra thay vì im.
 * URL gốc fbcdn/zdn có hạn → ảnh lỗi hiện «Ảnh hỏng».
 */
export function ReviewPhotos({ label, images, chiGoc = 0 }: {
  label: string;
  images: ReviewImage[] | undefined;
  chiGoc?: number;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  if (!images) return null;
  const giu = chiGoc > 0 ? (
    <p className="text-muted-foreground text-xs" data-review-photos-chi-goc>
      {label}: {chiGoc} ảnh chỉ có ở nguồn — quản trị viên xem được
    </p>
  ) : null;
  if (images.length === 0) {
    return giu ?? <p className="text-muted-foreground text-xs">{label}: không có ảnh</p>;
  }
  const markBroken = (i: number) => setBroken((s) => new Set(s).add(i));

  return (
    <>
      <AttachmentGroup role="group" aria-label={`Ảnh ${label}`}>
        {images.map((img, i) => (
          <Attachment
            key={img.src}
            orientation="vertical"
            state={broken.has(i) ? "error" : "done"}
          >
            {broken.has(i) ? (
              <>
                <AttachmentMedia>
                  <ImageOffIcon aria-hidden />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>Ảnh hỏng</AttachmentTitle>
                </AttachmentContent>
              </>
            ) : (
              <AttachmentMedia variant="image">
                <PhotoImg img={img} alt={`${label} — ảnh ${i + 1}`} size={96} onError={() => markBroken(i)} />
              </AttachmentMedia>
            )}
            <AttachmentTrigger aria-label={`Phóng to ${label} ảnh ${i + 1}`} onClick={() => setOpen(i)} />
          </Attachment>
        ))}
      </AttachmentGroup>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        {open !== null && (
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {label} · ảnh {open + 1}/{images.length}
              </DialogTitle>
              <DialogDescription>
                {images[open].origin === "local" ? "Ảnh lưu trên máy" : "Ảnh từ URL gốc của nguồn"}
                {images[open].expiring ? " — URL có hạn, có thể đã hết." : "."}
              </DialogDescription>
            </DialogHeader>
            {broken.has(open) ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <ImageOffIcon aria-hidden className="size-4" />
                Ảnh không tải được — URL gốc có thể đã hết hạn.
              </p>
            ) : (
              <PhotoImg
                img={images[open]}
                alt={`${label} — ảnh ${open + 1}`}
                className="max-h-[70vh] w-full object-contain"
                onError={() => markBroken(open)}
              />
            )}
            <DialogFooter>
              <Button variant="outline" size="sm" disabled={open === 0} onClick={() => setOpen(open - 1)}>
                <ChevronLeftIcon data-icon="inline-start" />
                Ảnh trước
              </Button>
              <Button variant="outline" size="sm" disabled={open === images.length - 1} onClick={() => setOpen(open + 1)}>
                Ảnh sau
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      {giu}
    </>
  );
}

/** `<img>` ảnh tin: ảnh ngoài không gửi Referer cho máy chủ nguồn. */
function PhotoImg({ img, alt, size, className, onError }: {
  img: ReviewImage;
  alt: string;
  size?: number;
  className?: string;
  onError: () => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh tầng A qua route admin / URL nguồn có hạn: next/image sẽ cache qua optimizer
    <img
      src={img.src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy={img.origin === "remote" ? "no-referrer" : undefined}
      onError={onError}
    />
  );
}
