/**
 * Gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`): chín trường lõi, kiểm miền và chuẩn hoá một lượt ghi TRƯỚC khi lưu.
 * Chuẩn hoá ở đây là điều kiện để view đồng thuận (054_labels.sql) so bằng bằng chữ: «4,35 tỷ» và «4350 triệu» cùng
 * thành "4350000000"; «LD2» và « ld2 » cùng thành "ld2"; chữ dựng sẵn và chữ tổ hợp cùng về NFC.
 * Tệp thuần (không DB) — test và phép đo của hồ sơ nạp thẳng.
 * GC0 `gan-nhan-theo-nhom-s03`: lát theo nhóm gắn 17 trường, mỗi ô một căn cứ, kèm lý do; lát đời trước giữ chín trường.
 * GN1 `truong-nhan-s03-081`: thêm bảy trường (mã căn, nội thất, hướng, view, ngày vào ở, cơ sở giá, phí đã gồm), căn cứ Danh mục CĐT.
 */
import { ASSERTION_FIELD, ENRICH_FIELD, LABELS_VI, VOCAB } from "./vocab.generated"

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

/** 24 trường của lát theo nhóm (bản D + truong-nhan-s03-081), theo thứ tự sáu khối trên màn. */
export const LABEL_FIELDS_NHOM = [
  "listing_intent",
  "kind",
  ENRICH_FIELD.property_type,
  "multi_unit",
  "project",
  "subzone",
  "unit_number",
  "building",
  "stack",
  "floor",
  ENRICH_FIELD.bedrooms,
  "bedrooms_plus",
  "bathrooms",
  "area_m2",
  "furnished",
  "direction_faces",
  "view",
  "availability_date",
  "price_min_vnd",
  "price_max_vnd",
  "price_basis",
  "rent_includes",
  "seller_name",
  "seller_phone",
] as const
export type LabelField = (typeof LABEL_FIELDS_NHOM)[number]

/** Căn cứ của một ô: nhãn là điều người trong nhóm hiểu, nên phải biết hiểu từ đâu. */
export const BASIS = ["chu_bai", "anh", "ngu_canh_nhom", "kien_thuc_nghe", "danh_muc_cdt"] as const
export type Basis = (typeof BASIS)[number]
export const BASIS_LABEL: Record<Basis, string> = {
  chu_bai: "Chữ bài",
  anh: "Ảnh trong bài",
  ngu_canh_nhom: "Ngữ cảnh nhóm",
  kien_thuc_nghe: "Kiến thức nghề",
  danh_muc_cdt: "Danh mục CĐT",
}
/** Trường mà danh mục CĐT (S08) có cột tương ứng — căn cứ «Danh mục CĐT» chỉ nhận ở các trường này (labels-s08.ts). */
export const CDT_FIELDS = [
  ASSERTION_FIELD.unit_number,
  "subzone",
  "direction_faces",
  "area_m2",
  ASSERTION_FIELD.bedrooms,
  ASSERTION_FIELD.bathrooms,
] as const
/** Hai ô có/không: mã lưu trong `eval_labels.value`. */
export const CO_KHONG = ["no", "yes"] as const

/** Ba trường chọn của mọi lát: lựa chọn đúng bằng trục cùng tên của sổ từ vựng (PL6), nhãn tiếng Việt từ sổ. */
export const SELECT_AXES = ["listing_intent", "kind", ENRICH_FIELD.property_type] as const
export type SelectAxis = (typeof SELECT_AXES)[number]
/** Trường chọn một của lát theo nhóm: ba trục trên cộng ba trục GN1. */
export const CHON_MOT_NHOM = [...SELECT_AXES, "furnished", "direction_faces", "price_basis"] as const
/** Hai trường chọn nhiều (RESO isCollection): lưu mã đã sắp xếp, bỏ trùng, nối bằng dấu phẩy. */
export const MULTI_AXES = ["view", "rent_includes"] as const
/** Mọi trục chọn của biểu mẫu, đều là trục của sổ từ vựng. */
export type TrucChon = (typeof CHON_MOT_NHOM)[number] | (typeof MULTI_AXES)[number]
export function selectOptions(axis: TrucChon): { value: string; label: string }[] {
  const nhan = LABELS_VI[axis] as Record<string, string>
  return VOCAB[axis].map((code) => ({ value: code, label: nhan[code] }))
}

export const FIELD_LABEL: Record<LabelField, string> = {
  listing_intent: "Ý định tin",
  kind: "Loại tin",
  property_type: "Loại hình",
  multi_unit: "Nhiều căn",
  project: "Khu đô thị",
  subzone: "Phân khu",
  building: "Toà",
  stack: "Trục",
  floor: "Tầng",
  price_min_vnd: "Giá thấp nhất",
  price_max_vnd: "Giá cao nhất",
  area_m2: "Diện tích",
  bedrooms: "Phòng ngủ",
  bedrooms_plus: "Có «+»",
  bathrooms: "WC",
  seller_name: "Tên",
  seller_phone: "SĐT",
  unit_number: "Mã căn",
  furnished: "Nội thất",
  direction_faces: "Hướng",
  view: "View",
  availability_date: "Ngày vào ở",
  price_basis: "Cơ sở giá",
  rent_includes: "Phí đã gồm",
}

/** Loại trường hợp ghi ở lượt hai. Danh sách khởi đầu; lượt thử sẽ sửa nó. */
export const CASE_KINDS = [
  { value: "bi-danh", label: "Bí danh viết tắt" },
  { value: "mac-dinh-nhom", label: "Mặc định theo nhóm" },
  { value: "ma-trung-du-an", label: "Mã trùng giữa khu đô thị" },
  { value: "nhieu-can", label: "Bài nhiều căn" },
  { value: "che-tang", label: "Che tầng" },
  { value: "so-ngoai-bai", label: "Số ngoài chữ bài" },
  { value: "khong-phai-tin-rao", label: "Không phải tin rao" },
  { value: "ghep-sai", label: "Ghép sai" },
  { value: "the-nhom-sai", label: "Thẻ nhóm sai" },
  { value: "khac", label: "Khác" },
] as const
export type CaseKind = (typeof CASE_KINDS)[number]["value"]
/** Trả lời «thẻ nhóm đúng không» ở lượt hai. */
export const GROUP_CARD_VERDICTS = ["correct", "wrong", "unsure"] as const
export type GroupCardVerdict = (typeof GROUP_CARD_VERDICTS)[number]

export const PRICE_UNITS = ["ty", "trieu"] as const
export type PriceUnit = (typeof PRICE_UNITS)[number]

/** Chữ lỗi khi người gắn ghi lại tin CHÍNH MÌNH đã gắn (409). Một chỗ: truy vấn ghi trả nó, biểu mẫu nhận ra nó để coi
 * lượt trước đã vào (lỗi mạng sau khi máy thu đã ghi) — hàng nhan-gia-va-luu-loi-mang. */
export const DA_GAN_CUA_TOI = "Anh đã gắn tin này"

/** Số mơ hồ: một dấu `.`/`,` theo sau đúng ba chữ số — ngăn nghìn hay thập phân? Từ chối, không đoán (Ngoài-7 của PL7). */
export const MSG_NGAN_NGHIN = "Dấu ngăn nghìn không được nhận — gõ 4350 hoặc 4,35"
export const MSG_DON_VI = "Đơn vị giá không hợp lệ — chọn tỷ hoặc triệu"
export const MSG_THIEU_LY_DO = "Có trường không từ chữ bài — ghi lý do"
export const MSG_KHONG_TRONG_CHU = "Chữ bài không có giá trị này — chọn căn cứ khác"
export const MSG_CAN_CU = "Căn cứ không hợp lệ — chọn Chữ bài, Ảnh, Ngữ cảnh nhóm, Kiến thức nghề hoặc Danh mục CĐT"
export const MSG_NGAY_VAO = "Ngày vào ở: ghi «ngay», tháng (2026-12) hoặc ngày (2026-12-15)"
export const MSG_SDT = "SĐT phải có 10 chữ số, đầu 03, 05, 07, 08 hoặc 09"
/** Một ô như người gõ: `not_stated` = «Tin không nêu». Giá mang đơn vị. */
export type RawCell = { not_stated?: boolean; value?: string | string[]; unit?: PriceUnit; basis?: string }
export type RawLabels = Partial<Record<LabelField, RawCell>>
export type LabelRow = { field: LabelField; value: string | null; not_stated: boolean; basis: Basis | null }
/** Lỗi theo ô; `reason` là ô Lý do của lát theo nhóm. */
export type LoiLuot = Partial<Record<LabelField | "reason", string>>
export type Chuan = { ok: true; rows: LabelRow[]; reason: string | null } | { ok: false; loi: LoiLuot }

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

/** SĐT người gõ về E.164, cùng luật `extractPhones` của transform-zalo: 10 chữ số, đầu 0 rồi 3, 5, 7, 8, 9. Sai khuôn → null. */
export function veE164(s: string): string | null {
  if (!/^[\d\s.+()-]+$/.test(s)) return null
  let so = s.replace(/\D/g, "")
  if (so.startsWith("84")) so = "0" + so.slice(2)
  return /^0[35789]\d{8}$/.test(so) ? "+84" + so.slice(1) : null
}

/** So chữ: NFKC để «𝟑𝟒𝐦²» về «34m2», bỏ dấu để «Rainbow» khớp mọi cách gõ, chữ thường, gộp khoảng trắng. */
const chuSo = (s: string) =>
  s.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim()

/** Giá trị có trong chữ bài không. Số so theo cả số («64.5» khớp «64,50», «59» không khớp «590») và theo từng số trong mã hay
 * danh sách («03» trong «S5.03», «15» trong «12,15»); «64,5» một chữ số sau dấu là số thập phân nên không tách. Chữ khớp theo ranh
 * giới để «12» không khớp «120», «park» không khớp «parking». */
export function coTrongChu(value: string, text: string): boolean {
  const v = chuSo(value)
  const t = chuSo(text)
  if (!v || !t) return false
  if (/^\d+(?:\.\d+)?$/.test(v)) {
    const so = (x: string) => (x.includes(".") ? x.replace(/0+$/, "").replace(/\.$/, "") : x)
    const nguyen = (x: string) => x.replace(/^0+(?=\d)/, "")
    return [...t.matchAll(/\d+(?:[.,]\d+)*/g)].some((m) => {
      if (so(m[0].replace(",", ".")) === so(v)) return true
      const phan = m[0].split(/[.,]/)
      const thapPhan = phan.length === 2 && phan[1].length === 1
      return !thapPhan && phan.length > 1 && !v.includes(".") && phan.some((x) => nguyen(x) === nguyen(v))
    })
  }
  const dau = /^\p{L}/u.test(v) ? "\\p{L}" : /^\d/.test(v) ? "\\d" : null
  const cuoi = /\p{L}$/u.test(v) ? "\\p{L}" : /\d$/.test(v) ? "\\d" : null
  const than = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`${dau ? `(?<!${dau})` : ""}${than}${cuoi ? `(?!${cuoi})` : ""}`, "u").test(t)
}

/** Sáu trường khai «Chữ bài» phải đọc được trong chữ: để căn cứ không bị để nhầm mặc định. */
const PHAI_TRONG_CHU: readonly LabelField[] = ["project", "subzone", "building", "stack", "area_m2", "unit_number"]

/** Ngày vào ở: «ngay», tháng `YYYY-MM` hay ngày `YYYY-MM-DD` có thật. Sai khuôn → null. */
export function chuanNgayVao(s: string): string | null {
  const t = s.trim()
  if (/^ngay$/i.test(t)) return "ngay"
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(t)
  if (!m) return null
  const nam = Number(m[1])
  const thang = Number(m[2])
  if (thang < 1 || thang > 12) return null
  if (m[3] === undefined) return t
  const ngay = Number(m[3])
  const d = new Date(Date.UTC(nam, thang - 1, ngay))
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay ? t : null
}

/** Kiểm miền + chuẩn hoá một lượt ghi. Lỗi trả theo trường (chữ hiện dưới đúng ô). Vắng `nhom`: lát đời trước, chín trường,
 * không căn cứ. Có `nhom`: lát theo nhóm, 17 trường, mỗi ô một căn cứ; `text` là chữ bài để so, `reason` là ô Lý do. */
export function chuanHoaLuot(raw: RawLabels | null | undefined, nhom?: { text: string; reason?: unknown }): Chuan {
  const loi: LoiLuot = {}
  const rows: LabelRow[] = []
  const o = raw ?? {}
  const giaTri = (f: LabelField): RawCell | null => {
    const c = o[f]
    const trong = (v: RawCell["value"]) => v == null || (Array.isArray(v) ? v.length === 0 : v.trim() === "")
    if (!c || (!c.not_stated && trong(c.value))) {
      loi[f] = `Chưa điền — nhập giá trị hoặc chọn «${nhom ? "Không suy ra được" : "Tin không nêu"}»`
      return null
    }
    return c
  }
  for (const f of nhom ? LABEL_FIELDS_NHOM : LABEL_FIELDS) {
    if (f === "price_min_vnd" || f === "price_max_vnd") continue
    const c = giaTri(f)
    if (!c) continue
    if (c.not_stated) {
      if (f === "multi_unit") loi[f] = "Chọn Không hoặc Có"
      else rows.push({ field: f, value: null, not_stated: true, basis: null })
      continue
    }
    if ((MULTI_AXES as readonly string[]).includes(f)) {
      const ds = (Array.isArray(c.value) ? c.value : String(c.value).split(",")).map((x) => String(x).trim()).filter(Boolean)
      const so = VOCAB[f as (typeof MULTI_AXES)[number]] as readonly string[]
      if (ds.length === 0) loi[f] = `Chưa điền — nhập giá trị hoặc chọn «${nhom ? "Không suy ra được" : "Tin không nêu"}»`
      else if (ds.some((x) => !so.includes(x))) loi[f] = "Giá trị không có trong sổ từ vựng"
      else rows.push({ field: f, value: [...new Set(ds)].sort().join(","), not_stated: false, basis: null })
      continue
    }
    if (Array.isArray(c.value)) {
      loi[f] = "Ô này chỉ nhận một giá trị"
      continue
    }
    const v = c.value!.trim()
    if ((CHON_MOT_NHOM as readonly string[]).includes(f)) {
      if (!(VOCAB[f as (typeof CHON_MOT_NHOM)[number]] as readonly string[]).includes(v)) loi[f] = "Giá trị không có trong sổ từ vựng"
      else rows.push({ field: f, value: v, not_stated: false, basis: null })
    } else if (f === "multi_unit" || f === "bedrooms_plus") {
      if (!(CO_KHONG as readonly string[]).includes(v)) loi[f] = "Chọn Không hoặc Có"
      else rows.push({ field: f, value: v, not_stated: false, basis: null })
    } else if (f === "seller_phone") {
      const e164 = veE164(v)
      if (!e164) loi[f] = MSG_SDT
      else rows.push({ field: f, value: e164, not_stated: false, basis: null })
    } else if (f === "project" || f === "building" || f === "subzone" || f === "stack" || f === "floor" || f === "seller_name") {
      rows.push({ field: f, value: chuanChu(v), not_stated: false, basis: null })
    } else if (f === "unit_number") {
      // Mã căn giữ nguyên chữ hoa thường và dấu che «xx» như bài viết (reso-khung-phan-loai: UnitNumber).
      rows.push({ field: f, value: v.normalize("NFC").replace(/\s+/g, " "), not_stated: false, basis: null })
    } else if (f === "availability_date") {
      const ngay = chuanNgayVao(v)
      if (!ngay) loi[f] = MSG_NGAY_VAO
      else rows.push({ field: f, value: ngay, not_stated: false, basis: null })
    } else if (f === "area_m2") {
      const d = docThapPhan(v)
      if (d === "nghin") loi[f] = MSG_NGAN_NGHIN
      else if (!d) loi[f] = "Diện tích phải là số, vd 64,5"
      else if (d.so <= BigInt(0)) loi[f] = "Diện tích phải lớn hơn 0"
      else rows.push({ field: f, value: chuanThapPhan(d), not_stated: false, basis: null })
    } else if (f === ENRICH_FIELD.bedrooms || f === ENRICH_FIELD.bathrooms) {
      if (!/^\d+$/.test(v)) loi[f] = `${FIELD_LABEL[f]} phải là số nguyên không âm`
      else rows.push({ field: f, value: BigInt(v).toString(), not_stated: false, basis: null })
    }
  }
  // Giá là một khoảng: hai đầu cùng «Tin không nêu», hoặc cùng có số; thấp ≤ cao.
  const lo = giaTri("price_min_vnd")
  const hi = giaTri("price_max_vnd")
  if (lo && hi) {
    if (lo.not_stated !== hi.not_stated) {
      loi.price_max_vnd = "Giá thấp nhất và cao nhất phải cùng có số, hoặc cùng «Tin không nêu»"
    } else if (lo.not_stated) {
      rows.push({ field: "price_min_vnd", value: null, not_stated: true, basis: null }, { field: "price_max_vnd", value: null, not_stated: true, basis: null })
    } else {
      // Đơn vị đóng: vắng hay khác «ty»/«trieu» là lỗi — không còn ngầm mặc định (Ngoài-3 của PL7).
      const donVi = (c: RawCell) => ((PRICE_UNITS as readonly string[]).includes(String(c.unit)) ? (c.unit as PriceUnit) : null)
      const uLo = donVi(lo)
      const uHi = donVi(hi)
      if (!uLo) loi.price_min_vnd = MSG_DON_VI
      if (!uHi) loi.price_max_vnd = MSG_DON_VI
      // Giá là một chuỗi; mảng (client gửi sai kiểu) coi như sai khuôn.
      const a = uLo && typeof lo.value === "string" ? veVnd(lo.value, uLo) : null
      const b = uHi && typeof hi.value === "string" ? veVnd(hi.value, uHi) : null
      if (uLo && a == null) loi.price_min_vnd = "Giá phải là số không âm, vd 4,35"
      if (uHi && b == null) loi.price_max_vnd = "Giá phải là số không âm, vd 4,35"
      if (a === "nghin") loi.price_min_vnd = MSG_NGAN_NGHIN
      if (b === "nghin") loi.price_max_vnd = MSG_NGAN_NGHIN
      if (typeof a === "bigint" && typeof b === "bigint") {
        if (a > b) loi.price_max_vnd = "Giá thấp nhất lớn hơn giá cao nhất"
        else rows.push({ field: "price_min_vnd", value: a.toString(), not_stated: false, basis: null }, { field: "price_max_vnd", value: b.toString(), not_stated: false, basis: null })
      }
    }
  }
  let reason: string | null = null
  if (nhom) {
    reason = (typeof nhom.reason === "string" ? nhom.reason.trim() : "") || null
    for (const r of rows) {
      if (r.not_stated || r.field === "multi_unit") continue
      const b = o[r.field]?.basis
      if (!(BASIS as readonly string[]).includes(String(b))) {
        loi[r.field] = MSG_CAN_CU
        continue
      }
      r.basis = b as Basis
      if (r.basis === "chu_bai" && PHAI_TRONG_CHU.includes(r.field) && !coTrongChu(r.value!, nhom.text)) loi[r.field] = MSG_KHONG_TRONG_CHU
    }
    // Chữ và ảnh đều nằm trong chính bài nên không cần giải thích; chỉ căn cứ ngoài bài mới đòi lý do.
    // Danh mục CĐT truy được về dòng danh mục (labels-s08.ts kiểm) nên cũng không đòi lý do.
    if (!reason && rows.some((r) => r.basis && r.basis !== "chu_bai" && r.basis !== "anh" && r.basis !== "danh_muc_cdt")) loi.reason = MSG_THIEU_LY_DO
  }
  if (Object.keys(loi).length > 0) return { ok: false, loi }
  return { ok: true, rows, reason }
}
