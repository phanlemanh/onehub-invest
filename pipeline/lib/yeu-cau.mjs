// yeu-cau.mjs — bang-yeu-cau: bài S03 có phát biểu ý định = Yêu cầu (lớp cao nhất thắng) thành một dòng ở bảng
// inquiry_records (migration 058) kèm tiêu chí — dịch vụ, loại hình, PN, diện tích, khoảng ngân sách, khu vực. Phần thuần
// (đọc tiêu chí, khoá gom) ở trên; phần DB (đọc phát biểu thắng, upsert, nghỉ) ở dưới.
// Spec: docs/superpowers/specs/2026-10-30-bang-yeu-cau-design.md · Hỏi-1 trần · Hỏi-2 gom · Hỏi-3 bảng ánh xạ (Mạnh 30/10).
//
// Vòng nhập: transform-zalo nhập ghiYeuCau, tệp này nhập hàm thuần của transform-zalo — chỉ an toàn khi không tệp nào gọi
// hàm của tệp kia ở cấp đỉnh. Đừng thêm lời gọi cấp đỉnh.

import { createHash } from "node:crypto";
import { extractPhones, gatSo, lyDoGiaPhiLy, normText, parsePost, parseVnNumber, soTy } from "../transform-zalo.mjs";
import { KIND, PROPERTY_TYPE } from "./vocab.generated.mjs";

// ---- Ngân sách (Hỏi-1: số tiền không kèm chữ chỉ chiều là trần) ----
const NUM = String.raw`(\d+(?:[.,]\d+)*)`;
const DV = String.raw`(tỷ|tỉ|ty|triệu|tr|củ)`;
// Sau đơn vị: không dính chữ cái («trung tâm»), không phải đơn giá («45tr/m2»).
const SAU = String.raw`(?!\p{L})(?!\s*\/\s*m)`;
const MAU_NS = [
  // Thứ tự = ưu tiên khi hai mẫu cùng bắt đầu ở một chỗ.
  ["khoang", new RegExp(String.raw`(?:từ\s*)?(?<![\d.,])${NUM}\s*${DV}?\s*(?:-|–|—|~|đến|tới)\s*${NUM}\s*${DV}${SAU}`, "giu")],
  ["tran", new RegExp(String.raw`(?:tầm\s+dưới|dưới|tối\s*đa|không\s+quá|max)\s*:?\s*${NUM}\s*${DV}${SAU}`, "giu")],
  ["san", new RegExp(String.raw`(?:trên|từ|tối\s*thiểu|min)\s*:?\s*${NUM}\s*${DV}${SAU}`, "giu")],
  ["mot", new RegExp(String.raw`(?<![\d.,])${NUM}\s*${DV}${SAU}`, "giu")],
];

/** Số tiền VND của «số + đơn vị»; đơn vị tỷ đọc theo luật giá VN của transform-zalo (soTy). */
function vnd(so, dv) {
  return /^t[ỷỉy]/i.test(dv) ? Math.round(soTy(so) * 1e9) : Math.round(parseVnNumber(so) * 1e6);
}

/** Sàn kèm trần viết rời («từ 2 tỷ, tối đa 3 tỷ»): số của mẫu `loai` đứng sau biểu thức đầu `m`, hoặc null. */
function sauDo(so, loai, m) {
  const re = MAU_NS.find(([l]) => l === loai)[1];
  re.lastIndex = m.index + m[0].length;
  const k = re.exec(so);
  return k ? vnd(k[1], k[2]) : null;
}

/**
 * Khoảng ngân sách của bài: biểu thức tiền ĐẦU TIÊN trong chữ đã gạt URL/SĐT. Khoảng «a–b» / «từ a đến b» → min/max (ngược
 * thì đảo); «tầm dưới / dưới / tối đa / không quá X» → max; «trên / từ / tối thiểu X» → min, và sàn kèm trần viết rời phía
 * sau thì lấy cả hai («từ 2 tỷ, tối đa 3 tỷ»); mọi dạng còn lại («tầm X»,
 * «khoảng X», «tài chính X», «X» trơn) → max. Đầu nào phi lý theo luật giá của tin rao (lyDoGiaPhiLy) thì trống.
 * @param {string} text
 * @param {string|null} kind dịch vụ đã đọc (sale · rent_lt · null) — chỉ để chặn giá phi lý
 * @returns {{min: number|null, max: number|null}}
 */
export function docNganSach(text, kind) {
  const so = gatSo(text).normalize("NFC").toLowerCase();
  let best = null;
  MAU_NS.forEach(([loai, re], uuTien) => {
    re.lastIndex = 0;
    const m = re.exec(so);
    if (m && (!best || m.index < best.m.index || (m.index === best.m.index && uuTien < best.uuTien))) best = { loai, m, uuTien };
  });
  if (!best) return { min: null, max: null };
  const { loai, m } = best;
  let min = null, max = null;
  if (loai === "khoang") {
    min = vnd(m[1], m[2] ?? m[4]);
    max = vnd(m[3], m[4]);
    if (min > max) [min, max] = [max, min];
  } else if (loai === "san") {
    min = vnd(m[1], m[2]);
    max = sauDo(so, "tran", m);
  } else if (loai === "tran") {
    max = vnd(m[1], m[2]);
    min = sauDo(so, "san", m);
  } else max = vnd(m[1], m[2]);
  const hopLy = (v) => (v != null && Number.isFinite(v) && !lyDoGiaPhiLy({ kind, priceVnd: v }) ? v : null);
  return { min: hopLy(min), max: hopLy(max) };
}

// ---- Loại hình và dịch vụ theo chữ (Hỏi-3) ----
const LOAI_HINH = [
  ["chung cư", PROPERTY_TYPE.apartment], ["căn hộ", PROPERTY_TYPE.apartment],
  ["nhà mặt phố", PROPERTY_TYPE.house], ["nhà phố", PROPERTY_TYPE.house], ["nhà riêng", PROPERTY_TYPE.house],
  ["nhà ngõ", PROPERTY_TYPE.house],
  ["đất nền", PROPERTY_TYPE.land], ["lô đất", PROPERTY_TYPE.land], ["đất", PROPERTY_TYPE.land],
  ["phòng trọ", PROPERTY_TYPE.room], ["phòng khép kín", PROPERTY_TYPE.room],
  ["văn phòng", PROPERTY_TYPE.commercial], ["mặt bằng", PROPERTY_TYPE.commercial], ["shophouse", PROPERTY_TYPE.commercial],
];
const DICH_VU = [["cần mua", KIND.sale], ["tìm mua", KIND.sale], ["cần thuê", KIND.rent_lt], ["tìm thuê", KIND.rent_lt]];

/** Mã của cụm xuất hiện trước trong chữ (cùng chỗ thì cụm dài hơn), so có ranh chữ; không cụm nào → null. */
function cumDauTien(text, bang) {
  const t = (text ?? "").normalize("NFC").toLowerCase();
  let best = null;
  for (const [cum, ma] of bang) {
    const m = new RegExp(String.raw`(?<!\p{L})${cum}(?!\p{L})`, "u").exec(t);
    if (m && (!best || m.index < best.i || (m.index === best.i && cum.length > best.len))) best = { i: m.index, len: cum.length, ma };
  }
  return best?.ma ?? null;
}

/** Loại hình đọc từ chữ theo bảng Hỏi-3; «nhà» đứng một mình không có trong bảng nên ra null. */
export const docLoaiHinh = (text) => cumDauTien(text, LOAI_HINH);

/** Dịch vụ đọc từ chữ: «cần mua / tìm mua» → sale, «cần thuê / tìm thuê» → rent_lt (kể cả thuê theo ngày — sổ chưa có rent_st). */
export const docDichVu = (text) => cumDauTien(text, DICH_VU);

// ---- Khoá gom (Hỏi-2: cùng nguồn · cùng người · cùng chữ chuẩn hoá) ----

/** Người gửi của bài: sender_id, vắng thì SĐT đầu tiên trong chữ, vắng cả hai → null. Chỉ đi vào băm khoá, không lưu. */
export function khoaNguoi(post) {
  if (post.sender_id) return `sender:${post.sender_id}`;
  const sdt = extractPhones(post.text ?? "")[0];
  return sdt ? `phone:${sdt}` : null;
}

/** SavedSearchKey: 'inq_' + 16 hex của băm (nguồn · người · chữ chuẩn hoá); bài không có người thì khoá gồm post_id (không gom). */
export function inquiryId(source, post) {
  const nguoi = khoaNguoi(post) ?? `post:${post.post_id}`;
  return `inq_${createHash("sha256").update(`${source}|${nguoi}|${normText(post.text)}`).digest("hex").slice(0, 16)}`;
}

/**
 * Tiêu chí của một bài Yêu cầu. Phát biểu thắng của bài (kind, property_type) đi trước chữ; property_type «unknown» coi như
 * vắng.
 * @param {{post_id: string, text: string, sender_id?: string|null}} post
 * @param {{kind?: {value: string}, property_type?: {value: string}}} thang phát biểu thắng theo trường (docPhatBieuThang)
 * @param {{phuongCua: (post: object) => ({id: string, market: string}|null), thiTruongKhai: (post: object) => string[]}} ctx
 */
export function tieuChiYeuCau(post, thang, ctx) {
  const kind = thang?.kind?.value ?? docDichVu(post.text);
  const ptThang = thang?.property_type?.value;
  const property_type = ptThang && ptThang !== PROPERTY_TYPE.unknown ? ptThang : docLoaiHinh(post.text);
  const pr = parsePost(post.text ?? "");
  const ns = docNganSach(post.text ?? "", kind);
  const ph = ctx.phuongCua(post);
  const khai = ctx.thiTruongKhai(post) ?? [];
  return {
    kind, property_type, bedrooms: pr.bedrooms, area_m2: pr.areaM2, budget_min_vnd: ns.min, budget_max_vnd: ns.max,
    area_id: ph?.id ?? null, market_id: ph?.market ?? (khai.length === 1 ? khai[0] : null),
  };
}

const moc = (t) => (t == null ? NaN : new Date(t).getTime());

/**
 * Gom bài Yêu cầu thành dòng inquiry_records theo inquiryId. post_ids sắp theo (posted_at, post_id); bài neo = sớm nhất;
 * tiêu chí + chứng cứ ý định theo bài mới nhất.
 * @param {string} source
 * @param {Array<{post: {post_id: string, text: string, posted_at: any, sender_id?: string|null},
 *   thang: {listing_intent: {assertion_id: any, method: string, tier: string, p: any}}, tieuChi: object}>} items
 */
export function gomYeuCau(source, items) {
  const nhom = new Map();
  for (const it of items) {
    const id = inquiryId(source, it.post);
    if (!nhom.has(id)) nhom.set(id, []);
    nhom.get(id).push(it);
  }
  const rows = [];
  for (const [inquiry_id, ds] of nhom) {
    ds.sort((a, b) => (moc(a.post.posted_at) || 0) - (moc(b.post.posted_at) || 0) || a.post.post_id.localeCompare(b.post.post_id));
    const moi = ds[ds.length - 1];
    const lan = ds.map((x) => moc(x.post.posted_at)).filter(Number.isFinite);
    const li = moi.thang.listing_intent;
    rows.push({
      inquiry_id, source, originating_system_key: ds[0].post.post_id, post_ids: ds.map((x) => x.post.post_id),
      ...moi.tieuChi,
      first_seen: lan.length ? new Date(Math.min(...lan)).toISOString() : null,
      last_seen: lan.length ? new Date(Math.max(...lan)).toISOString() : null,
      intent_evidence: { assertion_id: li.assertion_id, method: li.method, tier: li.tier, p: li.p ?? null },
    });
  }
  return rows;
}
