/**
 * Gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`): chín trường lõi, kiểm miền và chuẩn hoá một lượt ghi TRƯỚC khi lưu.
 * Chuẩn hoá ở đây là điều kiện để view đồng thuận (054_labels.sql) so bằng bằng chữ: «4,35 tỷ» và «4350 triệu» cùng
 * thành "4350000000"; «LD2» và « ld2 » cùng thành "ld2"; chữ dựng sẵn và chữ tổ hợp cùng về NFC.
 * Tệp thuần (không DB) — test và phép đo của hồ sơ nạp thẳng.
 */
import { ENRICH_FIELD, LABELS_VI, VOCAB } from "./vocab.generated"

/** Chín trường lõi (Hỏi-3), theo thứ tự trên màn. Hai trường trùng tên trường làm giàu lấy từ sổ từ vựng. */
export const LABEL_FIELDS = [
  "listing_intent",
  "kind",
  ENRICH_FIELD.property_type,
  "project",
  "building",
  "price_min_vnd",
  "price_max_vnd",
  "area_m2",
  ENRICH_FIELD.bedrooms,
] as const
export type LabelField = (typeof LABEL_FIELDS)[number]

/** Ba trường chọn: lựa chọn đúng bằng trục cùng tên của sổ từ vựng (PL6), nhãn tiếng Việt từ sổ. */
export const SELECT_AXES = ["listing_intent", "kind", ENRICH_FIELD.property_type] as const
export type SelectAxis = (typeof SELECT_AXES)[number]
export function selectOptions(axis: SelectAxis): { value: string; label: string }[] {
  const nhan = LABELS_VI[axis] as Record<string, string>
  return VOCAB[axis].map((code) => ({ value: code, label: nhan[code] }))
}

export const FIELD_LABEL: Record<LabelField, string> = {
  listing_intent: "Ý định tin",
  kind: "Loại tin",
  property_type: "Loại hình",
  project: "Dự án",
  building: "Toà",
  price_min_vnd: "Giá thấp nhất",
  price_max_vnd: "Giá cao nhất",
  area_m2: "Diện tích",
  bedrooms: "Phòng ngủ",
}

export const PRICE_UNITS = ["ty", "trieu"] as const
export type PriceUnit = (typeof PRICE_UNITS)[number]

/** Chữ lỗi khi người gắn ghi lại tin CHÍNH MÌNH đã gắn (409). Một chỗ: truy vấn ghi trả nó, biểu mẫu nhận ra nó để coi
 * lượt trước đã vào (lỗi mạng sau khi máy thu đã ghi) — hàng nhan-gia-va-luu-loi-mang. */
export const DA_GAN_CUA_TOI = "Anh đã gắn tin này"

/** Số mơ hồ: một dấu `.`/`,` theo sau đúng ba chữ số — ngăn nghìn hay thập phân? Từ chối, không đoán (Ngoài-7 của PL7). */
export const MSG_NGAN_NGHIN = "Dấu ngăn nghìn không được nhận — gõ 4350 hoặc 4,35"
export const MSG_DON_VI = "Đơn vị giá không hợp lệ — chọn tỷ hoặc triệu"
/** Một ô như người gõ: `not_stated` = «Tin không nêu». Giá mang đơn vị. */
export type RawCell = { not_stated?: boolean; value?: string; unit?: PriceUnit }
export type RawLabels = Partial<Record<LabelField, RawCell>>
export type LabelRow = { field: LabelField; value: string | null; not_stated: boolean }
export type Chuan = { ok: true; rows: LabelRow[] } | { ok: false; loi: Partial<Record<LabelField, string>> }

/** Số thập phân như người Việt gõ («4,35», «4.35», «64»): trả phần nguyên đã nhân 10^scale. Sai khuôn (kể cả hơn một
 * dấu) → null; một dấu theo sau đúng ba chữ số («4.350», «4,350») → "nghin" (mơ hồ, bên gọi báo MSG_NGAN_NGHIN). */
function docThapPhan(s: string): { so: bigint; scale: number } | "nghin" | null {
  const t = s.trim().replace(/\s+/g, "")
  if (/^\d+[.,]\d{3}$/.test(t)) return "nghin"
  const m = /^(\d+)(?:[.,](\d+))?$/.exec(t)
  if (!m) return null
  const phan = m[2] ?? ""
  return { so: BigInt(m[1] + phan), scale: phan.length }
}

/** Đổi về VND nguyên bằng số nguyên (không số thực): tỷ = 10^9, triệu = 10^6; phần lẻ dưới 1 đồng làm tròn. */
export function veVnd(s: string, unit: PriceUnit): bigint | "nghin" | null {
  const d = docThapPhan(s)
  if (d === null || d === "nghin") return d
  const mu = unit === "ty" ? 9 : 6
  if (d.scale <= mu) return d.so * BigInt(10) ** BigInt(mu - d.scale)
  const chia = BigInt(10) ** BigInt(d.scale - mu)
  return (d.so + chia / BigInt(2)) / chia
}

/** Chữ tự do (dự án, toà): NFC, bỏ khoảng trắng đầu cuối, gộp khoảng trắng, chữ thường. */
export const chuanChu = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase()

/** Số thập phân về chuỗi chuẩn «64.5» (bỏ số 0 thừa). */
function chuanThapPhan(d: { so: bigint; scale: number }): string {
  if (d.scale === 0) return d.so.toString()
  const s = d.so.toString().padStart(d.scale + 1, "0")
  const nguyen = s.slice(0, -d.scale)
  const le = s.slice(-d.scale).replace(/0+$/, "")
  return le ? `${BigInt(nguyen)}.${le}` : BigInt(nguyen).toString()
}

/** Kiểm miền + chuẩn hoá đủ chín trường của một lượt ghi. Lỗi trả theo trường (chữ hiện dưới đúng ô). */
export function chuanHoaLuot(raw: RawLabels | null | undefined): Chuan {
  const loi: Partial<Record<LabelField, string>> = {}
  const rows: LabelRow[] = []
  const o = raw ?? {}
  const giaTri = (f: LabelField): RawCell | null => {
    const c = o[f]
    if (!c || (!c.not_stated && (c.value == null || c.value.trim() === ""))) {
      loi[f] = "Chưa điền — nhập giá trị hoặc chọn «Tin không nêu»"
      return null
    }
    return c
  }
  for (const f of LABEL_FIELDS) {
    if (f === "price_min_vnd" || f === "price_max_vnd") continue
    const c = giaTri(f)
    if (!c) continue
    if (c.not_stated) {
      rows.push({ field: f, value: null, not_stated: true })
      continue
    }
    const v = c.value!.trim()
    if ((SELECT_AXES as readonly string[]).includes(f)) {
      if (!(VOCAB[f as SelectAxis] as readonly string[]).includes(v)) loi[f] = "Giá trị không có trong sổ từ vựng"
      else rows.push({ field: f, value: v, not_stated: false })
    } else if (f === "project" || f === "building") {
      rows.push({ field: f, value: chuanChu(v), not_stated: false })
    } else if (f === "area_m2") {
      const d = docThapPhan(v)
      if (d === "nghin") loi[f] = MSG_NGAN_NGHIN
      else if (!d) loi[f] = "Diện tích phải là số, vd 64,5"
      else if (d.so <= BigInt(0)) loi[f] = "Diện tích phải lớn hơn 0"
      else rows.push({ field: f, value: chuanThapPhan(d), not_stated: false })
    } else if (f === "bedrooms") {
      if (!/^\d+$/.test(v)) loi[f] = "Phòng ngủ phải là số nguyên không âm"
      else rows.push({ field: f, value: BigInt(v).toString(), not_stated: false })
    }
  }
  // Giá là một khoảng: hai đầu cùng «Tin không nêu», hoặc cùng có số; thấp ≤ cao.
  const lo = giaTri("price_min_vnd")
  const hi = giaTri("price_max_vnd")
  if (lo && hi) {
    if (lo.not_stated !== hi.not_stated) {
      loi.price_max_vnd = "Giá thấp nhất và cao nhất phải cùng có số, hoặc cùng «Tin không nêu»"
    } else if (lo.not_stated) {
      rows.push({ field: "price_min_vnd", value: null, not_stated: true }, { field: "price_max_vnd", value: null, not_stated: true })
    } else {
      // Đơn vị đóng: vắng hay khác «ty»/«trieu» là lỗi — không còn ngầm mặc định (Ngoài-3 của PL7).
      const donVi = (c: RawCell) => ((PRICE_UNITS as readonly string[]).includes(String(c.unit)) ? (c.unit as PriceUnit) : null)
      const uLo = donVi(lo)
      const uHi = donVi(hi)
      if (!uLo) loi.price_min_vnd = MSG_DON_VI
      if (!uHi) loi.price_max_vnd = MSG_DON_VI
      const a = uLo ? veVnd(lo.value!, uLo) : null
      const b = uHi ? veVnd(hi.value!, uHi) : null
      if (uLo && a == null) loi.price_min_vnd = "Giá phải là số không âm, vd 4,35"
      if (uHi && b == null) loi.price_max_vnd = "Giá phải là số không âm, vd 4,35"
      if (a === "nghin") loi.price_min_vnd = MSG_NGAN_NGHIN
      if (b === "nghin") loi.price_max_vnd = MSG_NGAN_NGHIN
      if (typeof a === "bigint" && typeof b === "bigint") {
        if (a > b) loi.price_max_vnd = "Giá thấp nhất lớn hơn giá cao nhất"
        else rows.push({ field: "price_min_vnd", value: a.toString(), not_stated: false }, { field: "price_max_vnd", value: b.toString(), not_stated: false })
      }
    }
  }
  if (Object.keys(loi).length > 0) return { ok: false, loi }
  return { ok: true, rows }
}
