"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react"

/** Thời gian giữ lệnh ở trình duyệt trước khi gửi route decide (OD2 · ĐC5, Q7). */
export const HOAN_TAC_MS = 5000

export type LenhQuyet = {
  id: number
  /** Body gửi route decide — đã chốt `elapsed_ms` lúc bấm, nên 5 giây chờ không vào số giây ở thẻ. */
  body: Record<string, unknown>
  /** Nhãn đáp án hiện trên toast. */
  nhan: string
  /** Chữ người đã gõ ở ô lý do — trả lại nguyên khi hoàn tác. */
  lyDoGo: string
  /** Làm mới trang sau khi route ghi xong (router của thẻ — hàng duyệt không cần router riêng). */
  lamMoi: () => void
}

export type HangGui = {
  xep: (lenh: LenhQuyet) => void
  /** Lý do còn giữ của thẻ vừa hoàn tác (thẻ dựng lại đọc một lần). */
  lyDoGiu: (id: number) => string | undefined
}

const HangGuiContext = createContext<HangGui | null>(null)

/** Thẻ ở chế độ duyệt đẩy lệnh vào hàng chờ; thẻ dựng riêng (ngoài provider) nhận null và gửi thẳng như OD1. */
export function useHangGui(): HangGui | null {
  return useContext(HangGuiContext)
}

const guiQuyet = (lenh: LenhQuyet, keepalive = false) =>
  fetch(`/api/v1/ops/review/${lenh.id}/decide`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lenh.body),
    ...(keepalive ? { keepalive: true } : {}),
  })

/**
 * Hàng chờ gửi: mỗi lệnh giữ `HOAN_TAC_MS` rồi mới gửi. Bên gọi (ReviewQueue) nhận ba nhịp: `onXep` (thẻ rời hàng duyệt
 * ngay, toast có «Hoàn tác»), `onXong` (route trả 200), `onLoi` (route trả lỗi — thẻ trở lại). `hoanTac(id)` huỷ hẹn giờ.
 * Rời trang (`pagehide`) khi còn lệnh → gửi hết ngay bằng `keepalive`, không bỏ quyết định nào.
 */
export function HangGuiProvider({ children, onXep, onXong, onLoi }: {
  children: ReactNode
  /** `hoanTac()` trả false khi lệnh đã gửi (toast còn hiện vì người đè chuột lên) — bên gọi không được đưa thẻ trở lại. */
  onXep: (lenh: LenhQuyet, hoanTac: () => boolean) => void
  onXong: (lenh: LenhQuyet) => void
  onLoi: (lenh: LenhQuyet, loi: string) => void
}) {
  const cho = useRef(new Map<number, { lenh: LenhQuyet; hen: ReturnType<typeof setTimeout> }>())
  const giu = useRef(new Map<number, string>())
  const nhip = useRef({ onXong, onLoi })
  useEffect(() => {
    nhip.current = { onXong, onLoi }
  }, [onXong, onLoi])

  const gui = useCallback(async (lenh: LenhQuyet) => {
    cho.current.delete(lenh.id)
    try {
      const res = await guiQuyet(lenh)
      if (res.ok) nhip.current.onXong(lenh)
      else nhip.current.onLoi(lenh, (await res.json().catch(() => ({}))).error ?? `mã ${res.status}`)
    } catch {
      nhip.current.onLoi(lenh, "mất kết nối")
    }
  }, [])

  const xep = useCallback((lenh: LenhQuyet) => {
    const cu = cho.current.get(lenh.id)
    if (cu) clearTimeout(cu.hen)
    const hen = setTimeout(() => void gui(lenh), HOAN_TAC_MS)
    cho.current.set(lenh.id, { lenh, hen })
    giu.current.delete(lenh.id)
    onXep(lenh, () => {
      const c = cho.current.get(lenh.id)
      if (!c || c.lenh !== lenh) return false
      clearTimeout(c.hen)
      cho.current.delete(lenh.id)
      giu.current.set(lenh.id, lenh.lyDoGo)
      return true
    })
  }, [gui, onXep])

  useEffect(() => {
    const xa = () => {
      for (const { lenh, hen } of cho.current.values()) {
        clearTimeout(hen)
        void guiQuyet(lenh, true)
      }
      cho.current.clear()
    }
    // Rời trang (đóng tab) phát pagehide; chuyển route trong app không phát — thành phần bị gỡ thì cũng xả (gap-probe P1).
    window.addEventListener("pagehide", xa)
    return () => {
      window.removeEventListener("pagehide", xa)
      xa()
    }
  }, [])

  const value = useMemo<HangGui>(() => ({
    xep,
    // Không xoá khi đọc: StrictMode gọi bộ khởi tạo state hai lần. Lần xếp kế của cùng thẻ ghi đè giá trị.
    lyDoGiu: (id) => giu.current.get(id),
  }), [xep])

  return <HangGuiContext.Provider value={value}>{children}</HangGuiContext.Provider>
}
