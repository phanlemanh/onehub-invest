/**
 * Hiển thị lệnh tạm dừng/bật lại nguồn (TV4b `tam-dung-nguon-tu-cloud`, ADR-0015 §5–§6) — hàm thuần, dùng chung cho cột
 * Thao tác của lưới «Sức khoẻ nguồn» và vùng «Lệnh gần đây». Không đọc DB, không gọi mạng; ca thử ở tests/lenh-hien.test.ts.
 */
import type { Vai } from "./auth"
import { fmtVnClock } from "./format"
import { sourceStatusLabel } from "./source-status-labels"

export const LY_DO_TOI_DA = 500
/** Lệnh chưa xong: còn đi tiếp trên máy trạng thái §5 — nguồn có lệnh này thì không có nút. */
export const DANG_CHO: readonly string[] = Object.freeze(["submitted", "approved", "queued"])
/** Máy thu kéo mỗi 60″; quá 5′ chưa kéo thì cờ. */
const IM_LANG_MS = 5 * 60_000
const GIO_VN = "Asia/Ho_Chi_Minh"

/**
 * Bậc vai — bản chép của BAC_VAI ở ops-access.ts (tệp đó nạp auth phía server nên thành phần client không import được).
 * Test TD-AC-6 so hai bản bằng nhau.
 */
export const BAC_VAI: Readonly<Record<Vai, number>> = Object.freeze({ user: 0, viewer: 1, ops: 2, admin: 3, owner: 4 })

export type ToneLenh = "warning-light" | "info-light" | "success-light" | "destructive-light" | "secondary"

export type LenhHien = {
  id: string
  type: string
  target: string
  payload: Record<string, unknown> | null
  status: string
  requested_by: string
  approved_by: string | null
  note: string | null
  before: { status?: string } | null
  after: { status?: string } | null
  result: { ly_do?: string } | null
  created_at: string
  decided_at: string | null
  queued_at: string | null
  finished_at: string | null
}

const gio = (v: string | null) => fmtVnClock(v, GIO_VN)

/** Chữ một trạng thái nguồn trong dòng trước → sau của lệnh (hợp đồng AC-4 ghim «Đang chạy»). */
export function nhanTruocSau(status: string | undefined): string {
  if (status === "active") return "Đang chạy"
  if (status === "paused") return "Tạm dừng"
  return sourceStatusLabel(status).label
}

/** Mã lý do bộ áp (pipeline/lib/lenh.mjs) → câu cho người; mã lạ giữ nguyên. */
export function dichLyDoAp(ma: string | undefined): string {
  if (!ma) return "không rõ lý do"
  if (ma === "nguon-khong-active") return "nguồn không ở trạng thái Đang chạy"
  if (ma === "kiem-sau-hong") return "kiểm sau khi áp không đạt"
  if (ma === "thieu-reason") return "thiếu lý do"
  const tdk = /^tien-dieu-kien:nguon-(.+)$/.exec(ma)
  if (tdk) return tdk[1] === "khong-co" ? "không có nguồn này ở máy thu" : `nguồn đang ${nhanTruocSau(tdk[1])}`
  return ma
}

/** Một nhãn tiến trình cho mỗi trạng thái của lệnh, kèm cờ máy thu im lặng (chỉ lệnh `approved`). */
export function trangThaiLenh(
  cmd: LenhHien,
  lastPullAt: string | null,
  nowMs: number,
): { nhan: string; tone: ToneLenh; truoc_sau?: string; canh: string | null } {
  let canh: string | null = null
  if (cmd.status === "approved" && (lastPullAt === null || nowMs - Date.parse(lastPullAt) > IM_LANG_MS)) {
    canh = lastPullAt === null ? "Máy thu chưa kéo lệnh lần nào" : `Máy thu chưa nhận lệnh từ ${gio(lastPullAt)}`
  }
  switch (cmd.status) {
    case "submitted":
      return cmd.target === "S03"
        ? { nhan: "Chờ người thứ hai duyệt", tone: "info-light", canh }
        : { nhan: "Chờ duyệt", tone: "warning-light", canh }
    case "approved":
      return { nhan: "Chờ máy thu nhận", tone: "warning-light", canh }
    case "queued":
      return { nhan: `Máy thu đã nhận lúc ${gio(cmd.queued_at)}`, tone: "info-light", canh }
    case "applied":
      return {
        nhan: `Đã áp lúc ${gio(cmd.finished_at)}`,
        tone: "success-light",
        truoc_sau: `${nhanTruocSau(cmd.before?.status)} → ${nhanTruocSau(cmd.after?.status)}`,
        canh,
      }
    case "failed":
      return { nhan: `Không áp được: ${dichLyDoAp(cmd.result?.ly_do)}`, tone: "destructive-light", canh }
    case "reverted":
      return { nhan: "Đã hoàn lại", tone: "secondary", canh }
    case "rejected":
      return { nhan: "Bị từ chối", tone: "secondary", canh }
    default:
      return { nhan: cmd.status, tone: "secondary", canh }
  }
}

/**
 * Trạng thái nguồn để quyết nút: lệnh `applied` mới nhất của nguồn xong SAU mốc bản tin thì bản tin chưa kịp phản ánh nó
 * → lấy `after.status` của lệnh; ngược lại tin bản tin (nút không đứng sai 15′ sau khi áp — gap-probe P0).
 */
export function trangThaiHieuLuc(trangThaiBanTin: string, factsPushedAt: string | null, lenhCuaNguon: LenhHien[]): string {
  const moc = factsPushedAt ? Date.parse(factsPushedAt) : Number.NEGATIVE_INFINITY
  const daAp = lenhCuaNguon
    .filter((l): l is LenhHien & { finished_at: string } => l.status === "applied" && typeof l.finished_at === "string")
    .sort((a, b) => Date.parse(b.finished_at) - Date.parse(a.finished_at))
  const l = daAp[0]
  if (l?.after?.status && Date.parse(l.finished_at) > moc) return l.after.status
  return trangThaiBanTin
}

/** Nút của một hàng nguồn: Tạm dừng (vai ≥ ops, đang chạy) · Bật lại (vai ≥ admin, tạm dừng) · không nút. */
export function nutNguon(
  vai: Vai,
  trangThai: string,
  coLenhDangCho: boolean,
): { nut: "pause" | "resume" | null; ghi_chu?: "Đang có lệnh chờ" } {
  const coTheDoi = trangThai === "active" || trangThai === "paused"
  if (coLenhDangCho) return coTheDoi ? { nut: null, ghi_chu: "Đang có lệnh chờ" } : { nut: null }
  if (trangThai === "active" && BAC_VAI[vai] >= BAC_VAI.ops) return { nut: "pause" }
  if (trangThai === "paused" && BAC_VAI[vai] >= BAC_VAI.admin) return { nut: "resume" }
  return { nut: null }
}

/** Lý do gửi được: sau khi cắt hai đầu, không rỗng và không quá 500 ký tự. */
export function coTheGui(lyDo: string): boolean {
  const t = lyDo.trim()
  return t.length > 0 && t.length <= LY_DO_TOI_DA
}
