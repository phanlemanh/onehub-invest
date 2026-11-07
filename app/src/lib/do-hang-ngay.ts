/**
 * Khối «Đo hằng ngày» của /ops/quality (DO1 `do-hieu-qua-hang-ngay`). Đọc các dòng `do1-*` mới nhất của dq_check_results —
 * pipeline/do-hang-ngay.mjs và so-sanh-cach-doc.mjs tính sẵn (luật 10), bảng đã lên cloud nên đọc được ở cả máy thu lẫn cloud.
 * React chỉ đọc; số có neo — chỉ so tuần với tuần và so cách đọc với nhau.
 */
type Queryable = { query: (sql: string) => Promise<{ rows: unknown[] }> }

export type Wilson = { thap: number; cao: number } | null
export type TuanSo = { tuan: string | null; n: number; giu?: number; bo?: number; thieu_nhap?: number; ty_le: number | null; wilson: Wilson }
export type DongGiu = { cach_doc: string; o: string; nhom: "A" | "B" | "C"; tuan_nay: TuanSo; tuan_truoc: TuanSo; chenh: number | null; co_y_nghia: boolean; nguong_phat_hien: number | null }
export type DongBoSot = { cach_doc: string; tuan_nay: TuanSo; tuan_truoc: TuanSo; chenh: number | null; co_y_nghia: boolean }
export type Lat = { o: Record<string, number>; tong: number }
export type DongTinHieu = { cach_doc: string; status: "pass" | "skip"; n_goi?: number; json_hong?: number; trich_lac?: number | null; phu?: Record<string, { co: number; giao: number; sai_khuon: number }> }
export type SoCap = { n_cap: number; giu_cu: number; giu_moi: number; chenh_cap: number | null; khoang: Wilson; co_y_nghia: boolean }

export type Do1 = {
  giuNhap: { status: string; checkedAt: string; dong: DongGiu[]; ty_le_soat?: { tuan_nay: { rut: number; soat: number; ty_le: number | null } }; canh_bao_soat?: boolean; phien_ban_thuoc?: string; lat?: Record<string, Lat> } | null
  boSot: { status: string; cach_doc: DongBoSot[]; lat?: Record<string, Lat> } | null
  tinHieu: { status: string; ngay?: string; cach_doc: DongTinHieu[]; lat?: Record<string, Lat> } | null
  chuyenBac: { status: string; ly_do?: string; don_vi?: number; so_dong?: number; doi_khoa?: number; theo_nguon?: Record<string, Record<string, number>>; theo_huong_ly_do?: Record<string, number>; lat?: Record<string, Lat> } | null
  soSanh: { entity: string; status: string; ly_do?: string; cu?: string; o?: Record<string, SoCap> }[]
}

export function do1Sql(): string {
  return `SELECT DISTINCT ON (check_name, entity) check_name, entity, status, detail, checked_at::text
    FROM dq_check_results
    WHERE check_name LIKE 'do1-%' AND checked_at > now() - interval '14 days'
    ORDER BY check_name, entity, checked_at DESC`
}

type Raw = { check_name: string; entity: string; status: string; detail: string | null; checked_at: string }
const docJson = (s: string | null) => {
  try { return s ? (JSON.parse(s) as Record<string, unknown>) : {} } catch { return {} }
}

/** Gom các dòng do1-* thành một đối tượng cho khối; không có dòng nào → null (trạng thái trống). */
export function gomDo1(rows: Raw[]): Do1 | null {
  if (!rows.length) return null
  const lay = (ten: string) => rows.find((r) => r.check_name === ten)
  const mot = <T,>(ten: string): T | null => {
    const r = lay(ten)
    return r ? ({ status: r.status, checkedAt: r.checked_at, ...docJson(r.detail) } as T) : null
  }
  return {
    giuNhap: mot("do1-giu-nhap"),
    boSot: mot("do1-bo-sot"),
    tinHieu: mot("do1-tin-hieu"),
    chuyenBac: mot("do1-chuyen-bac"),
    soSanh: rows.filter((r) => r.check_name === "do1-so-sanh").map((r) => ({ entity: r.entity, status: r.status, ...docJson(r.detail) })),
  }
}

export async function loadDo1(db: Queryable): Promise<Do1 | null> {
  return gomDo1((await db.query(do1Sql())).rows as Raw[])
}

/** Bốn lát của khối; khoá trùng tham số URL `?lat-do=`. */
export const LAT_DO = [
  { value: "tong", label: "Tổng" },
  { value: "thi_truong", label: "Thị trường" },
  { value: "phuong", label: "Phường/xã" },
  { value: "du_an", label: "Dự án" },
  { value: "toa", label: "Toà" },
] as const
export type LatDo = (typeof LAT_DO)[number]["value"]
export const latDo = (v: string | undefined | null): LatDo => (LAT_DO.some((l) => l.value === v) ? (v as LatDo) : "tong")

/** Nhãn một ô của lát: hai ô chưa gắn, «khác», dự án theo chữ bài, mã khu vực theo tên. */
export function nhanO(k: string, areaNames: Record<string, string> = {}): string {
  if (k === "khong-tin-hieu") return "Không nêu chỗ"
  if (k === "chua-co-danh-ba") return "Chưa có trong danh bạ"
  if (k === "khac") return "Khác"
  if (k.startsWith("theo-chu-bai:")) return `${k.slice(13)} (theo chữ bài)`
  return areaNames[k] ?? k
}

/** Ô có ít hơn 5 mẫu thì không hiện phần trăm. */
export const IT_MAU = 5

/** Tên ngắn của một cách đọc: bộ đọc luật, đọc gộp, đọc chữ kèm model rút gọn và phiên bản prompt. */
export function tenCachDoc(k: string): string {
  if (k === "bo-doc-luat") return "Bộ đọc luật"
  const [loai, ...rest] = k.split(":")
  const pv = rest.at(-1) ?? ""
  const model = rest.slice(0, -1).join(":").replace(/^gateway:/, "").split("/").at(-1) ?? ""
  return `${loai === "doc-gop" ? "Đọc gộp" : "Đọc chữ"} · ${model} · ${pv}`
}
