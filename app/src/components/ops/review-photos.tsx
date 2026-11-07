"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageOffIcon } from "lucide-react";

import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
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
 * `images` từ loadReviewMedia: ảnh đã tải về máy thu và ảnh máy chủ lấy hộ theo khoá (anh-goc-qua-may-chu) — không có
 * URL gốc; undefined thì không render gì. `chiGoc` = số ảnh chỉ có ở nguồn mà máy chủ chưa lấy hộ được — thẻ nói ra.
 * Ảnh tải lỗi (URL gốc fbcdn/zdn có hạn) rời dải, gom thành MỘT dòng «n ảnh không còn tải được» (OD1 · ĐC2, P1-5) — không ô
 * vỡ chiếm chỗ; hộp phóng to chỉ duyệt ảnh còn tải được.
 */
export function ReviewPhotos({ label, images, chiGoc = 0, lon = false }: {
  label: string;
  images: ReviewImage[] | undefined;
  chiGoc?: number;
  /** Ảnh là nội dung chính của trang (trang một căn): lưới ảnh lớn thay dải ảnh nhỏ. */
  lon?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  if (!images) return null;
  const giu = chiGoc > 0 ? (
    <p className="text-muted-foreground text-xs" data-review-photos-chi-goc>
      {label}: {chiGoc} ảnh chỉ có ở nguồn, chưa lấy được
    </p>
  ) : null;
  if (images.length === 0) {
    return giu ?? <p className="text-muted-foreground text-xs">{label}: không có ảnh</p>;
  }
  // Chỉ số (trong `images`) của ảnh còn tải được — dải và hộp phóng to đi trên danh sách này.
  const tot = images.flatMap((_, i) => (broken.has(i) ? [] : [i]));
  const markBroken = (i: number) => {
    setBroken((s) => new Set(s).add(i));
    // Ảnh đang phóng to vừa lỗi: sang ảnh tốt kế (hay trước), hết ảnh tốt thì đóng hộp.
    if (open === i) {
      const con = tot.filter((j) => j !== i);
      setOpen(con.find((j) => j > i) ?? con.at(-1) ?? null);
    }
  };
  const viTri = open === null ? -1 : tot.indexOf(open);
  const hong = broken.size > 0 ? (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs" data-review-photos-hong={broken.size}>
      <ImageOffIcon aria-hidden className="size-3.5" />
      {label}: {broken.size} ảnh không còn tải được
    </p>
  ) : null;

  return (
    <>
      {tot.length === 0 ? null : lon ? (
        <div role="group" aria-label={`Ảnh ${label}`} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tot.map((i) => (
            // eslint-disable-next-line onehub-ui/no-raw-controls -- ô ảnh lấp đầy lưới theo tỉ lệ ảnh; Button không có size này và ReUI cấm đặt height, padding lên nó
            <button
              key={images[i].src}
              type="button"
              aria-label={`Phóng to ${label} ảnh ${i + 1}`}
              onClick={() => setOpen(i)}
              className="bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md text-xs"
            >
              <PhotoImg img={images[i]} alt={`${label} — ảnh ${i + 1}`} className="size-full object-cover" onError={() => markBroken(i)} />
            </button>
          ))}
        </div>
      ) : (
      <AttachmentGroup role="group" aria-label={`Ảnh ${label}`}>
        {tot.map((i) => (
          <Attachment key={images[i].src} orientation="vertical" state="done">
            <AttachmentMedia variant="image">
              <PhotoImg img={images[i]} alt={`${label} — ảnh ${i + 1}`} size={96} onError={() => markBroken(i)} />
            </AttachmentMedia>
            <AttachmentTrigger aria-label={`Phóng to ${label} ảnh ${i + 1}`} onClick={() => setOpen(i)} />
          </Attachment>
        ))}
      </AttachmentGroup>
      )}
      {hong}
      <Dialog open={open !== null && viTri >= 0} onOpenChange={(o) => !o && setOpen(null)}>
        {open !== null && viTri >= 0 && (
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {label} · ảnh {viTri + 1}/{tot.length}
              </DialogTitle>
              <DialogDescription>
                {images[open].origin === "local"
                  ? "Ảnh lưu trên máy"
                  : images[open].origin === "proxy"
                    ? "Ảnh máy chủ lấy từ nguồn"
                    : "Ảnh từ URL gốc của nguồn"}
                {images[open].expiring ? " — URL có hạn, có thể đã hết." : "."}
              </DialogDescription>
            </DialogHeader>
            <PhotoImg
              img={images[open]}
              alt={`${label} — ảnh ${open + 1}`}
              className="max-h-[70vh] w-full object-contain"
              onError={() => markBroken(open)}
            />
            <DialogFooter>
              <Button variant="outline" size="sm" disabled={viTri === 0} onClick={() => setOpen(tot[viTri - 1])}>
                <ChevronLeftIcon data-icon="inline-start" />
                Ảnh trước
              </Button>
              <Button variant="outline" size="sm" disabled={viTri === tot.length - 1} onClick={() => setOpen(tot[viTri + 1])}>
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
