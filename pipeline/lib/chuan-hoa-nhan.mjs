// chuan-hoa-nhan.mjs — DO1: đưa giá trị máy đọc (bộ đọc luật, đọc gộp, đọc chữ) về ĐÚNG khuôn chuỗi mà eval_labels lưu, để so
// «giữ nháp» được. Bản chép quy tắc của app/src/lib/labels-normalize.ts (chuanHoaLuot): ô chọn giữ mã, ô có/không «yes|no»,
// chữ tự do NFC + gộp khoảng trắng + chữ thường, mã căn giữ hoa thường, diện tích thập phân bỏ số 0 thừa, phòng số nguyên,
// giá VND nguyên, SĐT E.164, ô nhiều giá trị sắp xếp nối phẩy. Test DO1-CHUAN-HOA đối chiếu bảng vào/ra.

import { ENRICH_FIELD } from "./vocab.generated.mjs";

const O_CHON = new Set(["listing_intent", "kind", "property_type", "furnished", "direction_faces", "price_basis"]);
const O_NHIEU = new Set(["view", "rent_includes"]);
const O_CO_KHONG = new Set(["multi_unit", "bedrooms_plus"]);
const O_CHU = new Set(["project", "building", "subzone", "stack", "floor", "seller_name"]);

export const chuanChu = (s) => String(s).normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/** SĐT về E.164 (cùng luật veE164 của app). Sai khuôn → null. */
export function veE164(s) {
  if (!/^[\d\s.+()-]+$/.test(String(s))) return null;
  let so = String(s).replace(/\D/g, "");
  if (so.startsWith("84")) so = "0" + so.slice(2);
  return /^0[35789]\d{8}$/.test(so) ? "+84" + so.slice(1) : null;
}

/** Số thập phân về chuỗi chuẩn «64.5» (bỏ số 0 thừa). */
function chuoiThapPhan(n) {
  if (!Number.isFinite(n)) return null;
  return String(Number(n.toFixed(6)));
}

/**
 * Một giá trị máy → chuỗi khuôn eval_labels. Trả `{ ok: true, v: string|null }` (null = không nêu) hoặc `{ ok: false }` khi
 * giá trị có mặt mà sai khuôn (đếm «sai khuôn», Ngoài-10 của PL30).
 * @param {string} o tên ô
 * @param {unknown} v
 */
export function chuanHoa(o, v) {
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return { ok: true, v: null };
  const s = typeof v === "string" ? v.trim() : v;
  if (O_CHON.has(o)) return typeof s === "string" && /^[a-z_]+$/.test(s) ? { ok: true, v: s } : { ok: false };
  if (O_CO_KHONG.has(o)) return s === "yes" || s === "no" ? { ok: true, v: s } : { ok: false };
  if (O_NHIEU.has(o)) {
    const ds = (Array.isArray(s) ? s : String(s).split(",")).map((x) => String(x).trim()).filter(Boolean);
    return ds.length ? { ok: true, v: [...new Set(ds)].sort().join(",") } : { ok: true, v: null };
  }
  if (O_CHU.has(o)) return typeof s === "string" || typeof s === "number" ? { ok: true, v: chuanChu(s) } : { ok: false };
  if (o === "unit_number") return { ok: true, v: String(s).normalize("NFC").replace(/\s+/g, " ") };
  if (o === "seller_phone") {
    const e = veE164(String(s));
    return e ? { ok: true, v: e } : { ok: false };
  }
  if (o === "area_m2") {
    const n = typeof s === "number" ? s : Number(String(s).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? { ok: true, v: chuoiThapPhan(n) } : { ok: false };
  }
  if (o === ENRICH_FIELD.bedrooms || o === ENRICH_FIELD.bathrooms) {
    const n = typeof s === "number" ? s : Number(s);
    return Number.isInteger(n) && n >= 0 ? { ok: true, v: String(n) } : { ok: false };
  }
  if (o === "price_min_vnd" || o === "price_max_vnd") {
    const n = typeof s === "number" ? s : Number(s);
    return Number.isFinite(n) && n >= 0 ? { ok: true, v: String(Math.round(n)) } : { ok: false };
  }
  if (o === "availability_date") return { ok: true, v: String(s) };
  return { ok: false };
}
