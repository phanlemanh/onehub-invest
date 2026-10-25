"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "cn";

import { Item } from "@/components/ui/item";

/**
 * Gallery ảnh tự thu của listing — chuyển thể product-gallery của @reui/product-detail-5: ảnh chính +
 * dải thumbnail chọn bằng chuột hoặc phím mũi tên. Khác bản gốc: thumbnail là Radio của Base UI (bản gốc
 * dựng `<button role="radio">` tay); ảnh chính khung 3:2, ảnh dọc/vuông hiện trọn trên nền (`photoFit`);
 * ảnh chết trên CDN rời gallery, hết ảnh thì báo `onEmpty` để cha bỏ cột ảnh. Dải thumbnail là MỘT hàng trượt ngang
 * gồm ô vuông 1:1 (thấy 5 ảnh, kéo/cuộn để xem tiếp — Mạnh chốt ở Cổng Phạm vi 25/10: listing nhiều ảnh không đẩy
 * cao bố cục); đổi ảnh bằng phím thì thumbnail đang chọn tự trượt vào khung.
 * Không có ảnh AirDNA ở đây (luật 5) — `urls` chỉ là `listings.photo_urls` tự thu.
 */

/** URL CDN gốc → bản lớn (ảnh chính) và bản nhỏ (thumbnail); DB đã chuẩn hoá https://, URL trần còn sót thì thêm scheme. */
export function photoSrc(url: string, large: boolean) {
  const base = url.startsWith("http") ? url : `https://${url}`;
  // aki_policy=x_large ổn định cho ảnh lớn (im_w=1024 bị CDN 404 tuỳ ảnh); im_w=480 không 404 riêng — ảnh chết thì mọi cỡ đều 404 (đo 25/10).
  return `${base}${large ? "?aki_policy=x_large" : "?im_w=480"}`;
}

/**
 * Quy định khung ảnh (catalog.md «Ảnh»; Mạnh chốt 25/10 trên số đo 469 ảnh tự thu): khung lớn 3:2 — ảnh ngang phủ kín
 * (cắt TB 4%), ảnh dọc/vuông (rộng/cao < 1,2) hiện trọn trên nền muted vì phủ kín khung ngang sẽ mất khoảng nửa ảnh.
 */
export const photoFit = (width: number, height: number): "cover" | "contain" =>
  height > 0 && width / height < 1.2 ? "contain" : "cover";

/** Ảnh đã lỗi trước khi React gắn sự kiện (lỗi giữa HTML server và hydrate): complete mà không có kích thước. */
const failedBeforeHydrate = (img: HTMLImageElement | null) =>
  Boolean(img && img.complete && img.currentSrc && img.naturalWidth === 0);

/** Khung trượt ngang của dải thumbnail — cùng khuôn ScrollArea Base UI với lịch (booking-heatmap), thanh cuộn ngang. */
function ThumbStrip({ children }: { children: ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className="relative min-w-0"
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full snap-x snap-mandatory rounded-lg outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        data-slot="scroll-area-scrollbar"
        orientation="horizontal"
        className="flex h-2.5 touch-none flex-col p-px transition-colors select-none"
      >
        <ScrollAreaPrimitive.Thumb
          data-slot="scroll-area-thumb"
          className="bg-foreground/15 relative flex-1 rounded-full"
        />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

export function ListingGallery({
  urls,
  name,
  onEmpty,
}: {
  urls: string[];
  name: string;
  onEmpty?: () => void;
}) {
  const [broken, setBroken] = useState<ReadonlySet<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const thumbs = useRef(new Map<string, HTMLElement>());
  // Ảnh chính dọc/vuông → contain; biết khi ảnh tải xong (kể cả tải xong trước hydrate — đọc ở ref).
  const [contain, setContain] = useState<ReadonlySet<string>>(() => new Set());
  const learnFit = (url: string, img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    const fit = photoFit(img.naturalWidth, img.naturalHeight);
    setContain((prev) =>
      (fit === "contain") === prev.has(url)
        ? prev
        : fit === "contain"
          ? new Set(prev).add(url)
          : new Set([...prev].filter((u) => u !== url)),
    );
  };

  const photos = urls.filter((u) => !broken.has(u));
  const active = photos.includes(selected ?? "")
    ? (selected as string)
    : photos[0];

  const markBroken = (url: string) =>
    setBroken((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));

  // Hết ảnh sống → cha bỏ cột ảnh (hộp thông tin chiếm cả bề ngang như listing không ảnh).
  const empty = photos.length === 0;
  useEffect(() => {
    if (empty) onEmpty?.();
  }, [empty, onEmpty]);

  // Ảnh đang chọn đổi (bấm, phím mũi tên) → kéo thumbnail của nó vào khung trượt; lần đầu không cuộn.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!active) return;
    const el = thumbs.current.get(active);
    const viewport = el?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!el || !viewport) return;
    // Chỉ cuộn NGANG trong khung dải ảnh — scrollIntoView sẽ kéo cả trang theo chiều dọc.
    const a = el.getBoundingClientRect();
    const v = viewport.getBoundingClientRect();
    const dx =
      a.left < v.left
        ? a.left - v.left - 4
        : a.right > v.right
          ? a.right - v.right + 4
          : 0;
    const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches;
    if (dx !== 0)
      viewport.scrollBy({ left: dx, behavior: smooth ? "smooth" : "auto" });
  }, [active]);

  if (!active) return null;
  const index = photos.indexOf(active);

  return (
    <div className="flex flex-col gap-3">
      <Item variant="muted" className="aspect-[3/2] w-full overflow-hidden p-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- CDN Airbnb ngoài domain, kích thước động */}
        <img
          key={active}
          ref={(img) => {
            if (failedBeforeHydrate(img)) markBroken(active);
            else if (img?.complete) learnFit(active, img);
          }}
          src={photoSrc(active, true)}
          alt={`Ảnh ${index + 1}/${photos.length} — ${name}`}
          data-fit={contain.has(active) ? "contain" : "cover"}
          className={cn(
            "animate-in fade-in size-full duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none",
            contain.has(active) ? "object-contain" : "object-cover",
          )}
          onLoad={(e) => learnFit(active, e.currentTarget)}
          loading="eager"
          referrerPolicy="no-referrer"
          onError={() => markBroken(active)}
        />
      </Item>

      {photos.length > 1 && (
        <ThumbStrip>
          <RadioGroup
            value={active}
            onValueChange={(value) => setSelected(value as string)}
            aria-label={`${photos.length} ảnh của listing`}
            className="flex gap-2 p-0.5 pb-3"
          >
            {photos.map((url, i) => (
              <Radio.Root
                key={url}
                value={url}
                ref={(el: HTMLElement | null) => {
                  if (el) thumbs.current.set(url, el);
                  else thumbs.current.delete(url);
                }}
                aria-label={`Xem ảnh ${i + 1}/${photos.length}`}
                render={
                  <Item
                    variant="muted"
                    className={cn(
                      // 5 thumbnail vừa một khung: (bề rộng − 4 khe gap-2) / 5; thêm ảnh thì trượt ngang.
                      "aspect-square w-[calc((100%-2rem)/5)] shrink-0 cursor-pointer snap-start overflow-hidden p-0 transition-opacity",
                      url === active
                        ? "ring-foreground ring-2"
                        : "focus-visible:ring-ring opacity-80 hover:opacity-100 focus-visible:ring-2",
                    )}
                  />
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- CDN Airbnb ngoài domain, kích thước động */}
                <img
                  ref={(img) => {
                    if (failedBeforeHydrate(img)) markBroken(url);
                  }}
                  src={photoSrc(url, false)}
                  alt=""
                  aria-hidden="true"
                  className="size-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => markBroken(url)}
                />
              </Radio.Root>
            ))}
          </RadioGroup>
        </ThumbStrip>
      )}
    </div>
  );
}
