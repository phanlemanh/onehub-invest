// Luật chế độ thu (C7 vết dầu loang — docs/plan/vet-dau-loang-thu-thap-2510.md §1.4, §3.4, Hỏi-3). Thuần, không DB:
// dùng chung cho datCheDo (máy chủ) và hộp thoại /ops/sources (client). Nhãn khớp CONTEXT.md «Chế độ thu».
import { vnDayKey } from "./format"

export const CHE_DO = ["cho", "bung", "duy_tri"] as const
export type CheDo = (typeof CHE_DO)[number]
export const NHAN_CHE_DO: Record<CheDo, string> = { cho: "Chờ", bung: "Bùng", duy_tri: "Duy trì" }
/** Trần số đêm của một đợt bùng: hạn hợp lệ là hôm nay … hôm nay + (TRAN_DEM_BUNG − 1), tính cả hai đầu. */
export const TRAN_DEM_BUNG = 14

const KHUON_NGAY = /^\d{4}-\d{2}-\d{2}$/

export const isCheDo = (v: unknown): v is CheDo => typeof v === "string" && (CHE_DO as readonly string[]).includes(v)

/** Hôm nay theo giờ Việt Nam, "YYYY-MM-DD" — không theo múi giờ của tiến trình hay trình duyệt. */
export function homNayVN(now: Date): string {
  return vnDayKey(now)
}

/** Cộng n ngày vào một ngày "YYYY-MM-DD" (lịch thuần, không múi giờ). */
export function congNgay(ngay: string, n: number): string {
  const [y, m, d] = ngay.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** Ngày "YYYY-MM-DD" có thật (loại 2026-02-30, 2026/11/07…). */
export function laNgay(v: unknown): v is string {
  return typeof v === "string" && KHUON_NGAY.test(v) && congNgay(v, 0) === v
}

export const hanToiDa = (homNay: string) => congNgay(homNay, TRAN_DEM_BUNG - 1)

export type KetQuaKiem = { ok: true; mode: CheDo; burstUntil: string | null } | { ok: false; error: string }

/** Kiểm một yêu cầu đổi chế độ. Hạn chỉ có nghĩa với Bùng; chế độ khác bỏ qua hạn gửi kèm. */
export function kiemCheDo(mode: unknown, burstUntil: unknown, homNay: string): KetQuaKiem {
  if (!isCheDo(mode)) return { ok: false, error: "chế độ phải là cho, bung hoặc duy_tri" }
  if (mode !== "bung") return { ok: true, mode, burstUntil: null }
  if (burstUntil === undefined || burstUntil === null || burstUntil === "") return { ok: false, error: "bật Bùng phải có hạn (YYYY-MM-DD)" }
  if (!laNgay(burstUntil)) return { ok: false, error: "hạn bùng phải là một ngày có thật dạng YYYY-MM-DD" }
  if (burstUntil < homNay) return { ok: false, error: "hạn bùng đã qua" }
  const max = hanToiDa(homNay)
  if (burstUntil > max) return { ok: false, error: `hạn bùng tối đa ${TRAN_DEM_BUNG} đêm (đến ${max})` }
  return { ok: true, mode, burstUntil }
}

/** Nhãn Badge của một điểm: «Bùng · đến 07/11», «Duy trì», «Chờ», hoặc null khi chưa đặt. */
export function nhanCheDo(mode: string | null, burstUntil: string | null): string | null {
  if (!isCheDo(mode)) return null
  if (mode === "bung" && laNgay(burstUntil)) return `${NHAN_CHE_DO.bung} · đến ${burstUntil.slice(8, 10)}/${burstUntil.slice(5, 7)}`
  return NHAN_CHE_DO[mode]
}
