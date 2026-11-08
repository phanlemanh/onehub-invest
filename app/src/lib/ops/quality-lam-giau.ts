/**
 * Khối «Làm giàu» của /ops/quality (DO3 `do-lam-giau`). Đọc các dòng `do3-*` của dq_check_results trong 14 ngày —
 * pipeline/do-lam-giau.mjs tính sẵn (luật 10): `do3-thay-doi` một dòng mỗi đường mỗi ngày VN, `do3-kiem-nguoc` một dòng mỗi
 * đường mỗi tuần ISO VN. React chỉ đọc; lát dùng chung `?lat-do=` với khối «Đo hằng ngày» (LAT_DO của DO1).
 */
import type { Lat, LatDo, Wilson } from "@/lib/do-hang-ngay"

type Queryable = { query: (sql: string) => Promise<{ rows: unknown[] }> }

/** Bốn chiều lát của DO1 trong detail `do3-*` (không có lát «Tổng»). */
export type ChieuLat = Exclude<LatDo, "tong">
type LatNhom<K extends string> = Partial<Record<K, Partial<Record<ChieuLat, Lat>>>>

/** Nhóm số của detail `do3-thay-doi` có phân rã lát (NHOM_LAT_THAY_DOI của pipeline). */
export const NHOM_THAY_DOI = ["song", "them", "doi", "may_rut"] as const
/** Nhóm số của detail `do3-kiem-nguoc` có phân rã lát. */
export const NHOM_KIEM = ["dung", "sai", "khong_ra"] as const

export type DongNgay = {
  ngay: string
  status: string
  checkedAt: string
  ly_do?: "chua-chay" | "lap-moc" | string
  song?: number
  them?: number
  doi?: number
  may_rut?: number
  nguoi_sua?: number
  /** Phần của `nguoi_sua` do người ghi đè phát biểu `hitl`; vắng = đường không có lối ghi đè. */
  nguoi_sua_de?: number
  nhan_da_so?: number
  nguoi_rut?: number
  /** `false` = đường không có lối người rút (không có khoá `nguoi_rut`). */
  duong_nguoi_rut?: false
  soat_lech?: string
  lat?: LatNhom<(typeof NHOM_THAY_DOI)[number]>
}

export type DongKiem = {
  tuan: string
  status: string
  checkedAt: string
  ly_do?: "chua-co-kiem-nguoc" | string
  tap_do?: string
  n?: number
  dung?: number
  sai?: number
  khong_ra?: number
  ty_le_dung?: number | null
  wilson?: Wilson
  phu?: number | null
  chenh?: number | null
  co_y_nghia?: boolean
  nguong_phat_hien?: number | null
  lat?: LatNhom<(typeof NHOM_KIEM)[number]>
}

export type DuongLamGiau = { duong: string; homNay: DongNgay | null; bayNgay: DongNgay[]; kiemNay: DongKiem | null; kiemTruoc: DongKiem | null }
/** `tuanNay`: tuần ISO (giờ VN) của ngày đo mới nhất — mốc của «kiểm ngược tuần này». */
export type LamGiau = { ngay: string | null; tuanNay: string | null; duong: DuongLamGiau[] }

/** Bốn đường của sổ DUONG (pipeline/lib/do-lam-giau.mjs), đúng thứ tự sổ; đường lạ xếp sau, hiện mã. */
export const TEN_DUONG: Record<string, string> = {
  "so-qua-nguoi-dang": "Số qua người đăng",
  "quy-uoc-nhom": "Quy ước nhóm",
  "dien-tich-suy-ra": "Diện tích suy ra",
  "danh-muc-cdt": "Danh mục CĐT",
}
const THU_TU = Object.keys(TEN_DUONG)

/** Tập đo của kiểm ngược (`tap_do`) — để số không bị đọc nhầm là độ đúng trên mọi tin. */
export const TEN_TAP_DO: Record<string, string> = {
  "tin-co-so-rieng": "trên tin có số riêng",
  "bai-co-chu-loai": "trên bài có chữ loại hình",
}

/** Dòng `do3-*` trong 14 ngày: bản mới nhất của mỗi (kiểm, đường, ngày đo hay tuần đo). */
export function lamGiauSql(): string {
  return `SELECT DISTINCT ON (check_name, entity, k) check_name, entity, status, detail, checked_at::text
    FROM (SELECT *, coalesce(detail::jsonb ->> 'ngay', detail::jsonb ->> 'tuan', '') AS k FROM dq_check_results
           WHERE check_name LIKE 'do3-%' AND checked_at > now() - interval '14 days') x
    ORDER BY check_name, entity, k, checked_at DESC`
}

type Raw = { check_name: string; entity: string; status: string; detail: string | null; checked_at: string }
const docJson = (s: string | null): Record<string, unknown> => {
  try { return s ? (JSON.parse(s) as Record<string, unknown>) : {} } catch { return {} }
}

const truNgay = (ngay: string, n: number) => {
  const d = new Date(`${ngay}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Tuần ISO của một ngày lịch 'YYYY-MM-DD' — cùng công thức `tuanIso` của pipeline/lib/do-hang-ngay.mjs. */
export function tuanIso(ngay: string): string {
  const d = new Date(`${ngay}T00:00:00Z`)
  const thu = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - thu + 3)
  const dau = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  const tuan = 1 + Math.round(((d.getTime() - dau.getTime()) / 86400000 - 3 + ((dau.getUTCDay() + 6) % 7)) / 7)
  return `${d.getUTCFullYear()}-W${String(tuan).padStart(2, "0")}`
}

/** Gom dòng do3-* theo đường: dòng ngày mới nhất, 7 ngày tới ngày đo mới nhất, kiểm ngược tuần này và tuần trước. Không dòng → null. */
export function gomLamGiau(rows: Raw[]): LamGiau | null {
  if (!rows.length) return null
  const ngayRows = rows.filter((r) => r.check_name === "do3-thay-doi")
    .map((r) => ({ entity: r.entity, d: { status: r.status, checkedAt: r.checked_at, ...docJson(r.detail) } as DongNgay }))
    .filter((x) => typeof x.d.ngay === "string")
  const kiemRows = rows.filter((r) => r.check_name === "do3-kiem-nguoc")
    .map((r) => ({ entity: r.entity, d: { status: r.status, checkedAt: r.checked_at, ...docJson(r.detail) } as DongKiem }))
    .filter((x) => typeof x.d.tuan === "string")
  const ngay = ngayRows.map((x) => x.d.ngay).sort().at(-1) ?? null
  const tuanNay = ngay ? tuanIso(ngay) : (kiemRows.map((x) => x.d.tuan).sort().at(-1) ?? null)
  const tuanTruoc = ngay ? tuanIso(truNgay(ngay, 7)) : null
  const tu = ngay ? truNgay(ngay, 6) : null
  const ten = [...new Set([...ngayRows, ...kiemRows].map((x) => x.entity))]
    .sort((a, b) => (THU_TU.indexOf(a) + 1 || 99) - (THU_TU.indexOf(b) + 1 || 99) || a.localeCompare(b))
  return {
    ngay,
    tuanNay,
    duong: ten.map((duong) => {
      const cua = ngayRows.filter((x) => x.entity === duong).map((x) => x.d).sort((a, b) => b.ngay.localeCompare(a.ngay))
      const kiem = kiemRows.filter((x) => x.entity === duong).map((x) => x.d).sort((a, b) => b.tuan.localeCompare(a.tuan))
      const kiemNay = kiem.find((k) => k.tuan === tuanNay) ?? null
      return {
        duong,
        homNay: cua[0] ?? null,
        bayNgay: tu ? cua.filter((d) => d.ngay >= tu) : cua,
        kiemNay,
        // Không có ngày đo (chỉ có kiểm ngược): tuần trước là dòng kiểm kế dòng mới nhất.
        kiemTruoc: tuanTruoc ? kiem.find((k) => k.tuan === tuanTruoc) ?? null : kiem.find((k) => k !== kiemNay && k.tuan < (tuanNay ?? "")) ?? null,
      }
    }),
  }
}

export async function loadLamGiau(db: Queryable): Promise<LamGiau | null> {
  return gomLamGiau((await db.query(lamGiauSql())).rows as Raw[])
}

/** Tổng 7 ngày của một ô đếm trên dòng ngày đã có số (bỏ dòng lập mốc, chưa chạy). */
export function tong7(bayNgay: DongNgay[], o: "them" | "doi" | "may_rut" | "nguoi_sua" | "nguoi_rut"): number {
  return bayNgay.reduce((s, d) => s + (typeof d[o] === "number" ? (d[o] as number) : 0), 0)
}

/** Mẫu số của tỉ lệ đúng: đúng + sai (không ra không vào mẫu số, như tongKiem của pipeline). */
export const mauKiem = (k: DongKiem) => (k.dung ?? 0) + (k.sai ?? 0)
