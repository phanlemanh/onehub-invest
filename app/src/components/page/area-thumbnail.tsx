"use client"

import { useState, useSyncExternalStore } from "react"

import type { AreaThumbnail as Thumb } from "@/lib/queries"

const noopSubscribe = () => () => {}

/**
 * Ảnh đại diện khu vực (So sánh, Đã lưu) — ảnh chính của một listing tự thu trong khu vực, phủ kín
 * khung cha (cha giữ kích thước, nền muted, bo góc, overflow-hidden). Chữ thay thế nói rõ đây là ảnh
 * một listing, không phải ảnh chụp khu vực. Ảnh chết trên CDN thì lùi sang ứng viên kế; hết ứng viên
 * → `onBroken` để cha quay về ô số.
 * `<img>` chỉ gắn sau khi hydrate: ảnh lỗi trong khoảng HTML server → hydrate thì sự kiện error mất
 * (đo 24/10 trên :3460), gắn sau thì onError luôn có trước lần tải đầu.
 */
export function AreaThumbnail({ thumb, areaName, onBroken }: { thumb: Thumb; areaName: string; onBroken: () => void }) {
  // false lúc render server + hydrate, true sau khi hydrate xong — không setState trong effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [i, setI] = useState(0)
  if (!mounted) return null
  const c = thumb.candidates[i]
  const label = `Ảnh một listing ở ${areaName}${c.listingName ? ` — ${c.listingName}` : ""}`
  return (
    // eslint-disable-next-line @next/next/no-img-element -- CDN Airbnb ngoài domain, kích thước động (cùng luật trang Listing)
    <img
      key={c.src}
      src={c.src}
      alt={label}
      title={label}
      className="absolute inset-0 size-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => (i + 1 < thumb.candidates.length ? setI(i + 1) : onBroken())}
    />
  )
}
