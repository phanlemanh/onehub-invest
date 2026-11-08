"use client"

import { useEffect, useRef } from "react"

export type PhimDuyet = {
  sau: () => void
  truoc: () => void
  /** Phím số n: bấm nút đáp án mang `data-review-answer="n"` trong sheet (nút tắt → không làm gì). */
  dapAn: (n: number) => void
  vaoLyDo: () => void
  moBangPhim: () => void
}

/** Tiêu điểm đang ở ô nhập: phím chữ/số thuộc về ô đó, không phải chế độ duyệt. */
function dangGo(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  return ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)
}

/**
 * Phím của chế độ duyệt (OD2 · ĐC4), chỉ khi `bat` (sheet đang mở, không Dialog chồng). Phím có ⌘/Ctrl/Alt không bị bắt —
 * vỏ Ops giữ ⌘K, trình duyệt giữ phím của nó. Tiêu điểm ở ô nhập → bỏ qua mọi phím chữ/số.
 */
export function usePhimDuyet(bat: boolean, hanh: PhimDuyet) {
  const ref = useRef(hanh)
  useEffect(() => {
    ref.current = hanh
  })
  useEffect(() => {
    if (!bat) return
    const nghe = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (dangGo(e.target)) return
      const h = ref.current
      const lam = (f: () => void) => {
        e.preventDefault()
        f()
      }
      switch (e.key) {
        case "j":
        case "J":
        case "ArrowDown":
          return lam(h.sau)
        case "k":
        case "K":
        case "ArrowUp":
          return lam(h.truoc)
        case "r":
        case "R":
          return lam(h.vaoLyDo)
        case "?":
          return lam(h.moBangPhim)
        case "1":
        case "2":
        case "3":
        case "4":
          return lam(() => h.dapAn(Number(e.key)))
      }
    }
    window.addEventListener("keydown", nghe)
    return () => window.removeEventListener("keydown", nghe)
  }, [bat])
}

/** Bấm nút đáp án thứ n trong vùng `goc` — dùng chung cho phím số và test. Trả true khi đã bấm. */
export function bamDapAn(goc: ParentNode | null, n: number): boolean {
  const nut = goc?.querySelector<HTMLButtonElement>(`[data-review-answer="${n}"]`)
  if (!nut || nut.disabled) return false
  nut.click()
  return true
}
