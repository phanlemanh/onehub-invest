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
  /** Gửi bằng `keepalive` — hàng chờ tự đặt khi xả lúc rời trang hay khi hàng duyệt bị gỡ; bên gọi không đặt. */
  keepalive?: boolean
}

/** Tình trạng một lệnh đã rời hàng chờ (od2-phim-va-loi-ghi AC-2): «Hoàn tác» muộn trả lời theo đúng tình trạng này. */
export type TinhTrangGui = "dang-gui" | "da-ghi" | "loi"

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

const guiQuyet = (lenh: LenhQuyet) =>
  fetch(`/api/v1/ops/review/${lenh.id}/decide`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lenh.body),
    ...(lenh.keepalive ? { keepalive: true } : {}),
  })

/**
 * Hàng chờ gửi: mỗi lệnh giữ `HOAN_TAC_MS` rồi mới gửi. Bên gọi (ReviewQueue) nhận ba nhịp: `onXep` (thẻ rời hàng duyệt
 * ngay, toast có «Hoàn tác»), `onXong` (route trả 200), `onLoi` (route trả lỗi — thẻ trở lại). `hoanTac(id)` huỷ hẹn giờ.
 * Rời trang (`pagehide`) hay hàng duyệt bị gỡ khi còn lệnh → gửi hết ngay bằng `keepalive`, không bỏ quyết định nào; kết
 * quả của lệnh xả vẫn về `onXong`/`onLoi` như lệnh gửi lúc 5 giây (od2-phim-va-loi-ghi AC-1 — trước đây bị bỏ).
 */
export function HangGuiProvider({ children, onXep, onXong, onLoi }: {
  children: ReactNode
  /**
   * `hoanTac()` trả false khi lệnh đã gửi (toast còn hiện vì người đè chuột lên, hay hàng duyệt đã gỡ) — bên gọi không được
   * đưa thẻ trở lại; `tinhTrang()` nói lệnh đã gửi ấy đang chờ, đã ghi hay lỗi.
   */
  onXep: (lenh: LenhQuyet, hoanTac: () => boolean, tinhTrang: () => TinhTrangGui) => void
  onXong: (lenh: LenhQuyet) => void
  onLoi: (lenh: LenhQuyet, loi: string) => void
}) {
  const cho = useRef(new Map<number, { lenh: LenhQuyet; hen: ReturnType<typeof setTimeout> }>())
  const giu = useRef(new Map<number, string>())
  // Ref, không state: «Hoàn tác» muộn có thể bấm sau khi hàng duyệt đã gỡ — bảng phải còn đọc được lúc ấy.
  const daGui = useRef(new Map<number, TinhTrangGui>())
  const nhip = useRef({ onXong, onLoi })
  useEffect(() => {
    nhip.current = { onXong, onLoi }
  }, [onXong, onLoi])

  const gui = useCallback(async (lenh: LenhQuyet) => {
    cho.current.delete(lenh.id)
    daGui.current.set(lenh.id, "dang-gui")
    try {
      const res = await guiQuyet(lenh)
      daGui.current.set(lenh.id, res.ok ? "da-ghi" : "loi")
      if (res.ok) nhip.current.onXong(lenh)
      else nhip.current.onLoi(lenh, (await res.json().catch(() => ({}))).error ?? `mã ${res.status}`)
    } catch {
      daGui.current.set(lenh.id, "loi")
      nhip.current.onLoi(lenh, "mất kết nối")
    }
  }, [])

  const xep = useCallback((lenh: LenhQuyet) => {
    const cu = cho.current.get(lenh.id)
    if (cu) clearTimeout(cu.hen)
    const hen = setTimeout(() => void gui(lenh), HOAN_TAC_MS)
    cho.current.set(lenh.id, { lenh, hen })
    giu.current.delete(lenh.id)
    daGui.current.delete(lenh.id)
    onXep(lenh, () => {
      const c = cho.current.get(lenh.id)
      if (!c || c.lenh !== lenh) return false
      clearTimeout(c.hen)
      cho.current.delete(lenh.id)
      giu.current.set(lenh.id, lenh.lyDoGo)
      return true
    }, () => daGui.current.get(lenh.id) ?? "dang-gui")
  }, [gui, onXep])

  useEffect(() => {
    const xa = () => {
      for (const { lenh, hen } of [...cho.current.values()]) {
        clearTimeout(hen)
        // Đi chung `gui` để lỗi của lệnh xả vẫn tới `onLoi` (Ngoài-5 của OD2: trước đây kết quả bị bỏ).
        void gui({ ...lenh, keepalive: true })
      }
      cho.current.clear()
    }
    // Rời trang (đóng tab) phát pagehide; chuyển route trong app không phát — thành phần bị gỡ thì cũng xả (gap-probe P1).
    window.addEventListener("pagehide", xa)
    return () => {
      window.removeEventListener("pagehide", xa)
      xa()
    }
  }, [gui])

  const value = useMemo<HangGui>(() => ({
    xep,
    // Không xoá khi đọc: StrictMode gọi bộ khởi tạo state hai lần. Lần xếp kế của cùng thẻ ghi đè giá trị.
    lyDoGiu: (id) => giu.current.get(id),
  }), [xep])

  return <HangGuiContext.Provider value={value}>{children}</HangGuiContext.Provider>
}
