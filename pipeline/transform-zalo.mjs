// transform-zalo.mjs — parse tin rao VN + dedup + canonical offers (G1).
// Pipeline 5 bước: clean → parse regex → confidence → dedup → offers.
// Parser đo coverage: % tin có đủ (giá + diện tích + phường) cho confidence=high.
// Export parsePost/matchPhuong cho bench-extraction dùng chung (C2) — nguồn
// chân lý của parser là một, bench và transform không được fork logic.
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { khoaNhomThat } from "./lib/eval-labels.mjs";
import { auditRejected, loadStgPosts } from "./lib/test-posts.mjs";
import { docBiDanhAnToan, docPhuongHopLe, docThiTruongCoPhuong, docThiTruongCoXa } from "./lib/osm.mjs";
import { matchXaCuCoTienTo } from "./lib/dvhc.mjs";
import { writeOffers } from "./lib/write-offers.mjs";
import { ganSdtQuaNguoi } from "./lib/gan-sdt-qua-nguoi.mjs";
import { co095, subjectKey, phatBieuLoaiHinh, phatBieuPhongNgu, phatBieuTang, phatBieuToaTruc, rutLoaiHinhCu, rutTangCu } from "./lib/assert.mjs";
import { assignStickyIds } from "./lib/offer-key.mjs";
import { normText } from "./lib/norm-text.mjs";
import { ASSERTION_METHOD, CONFIDENCE, ENRICH_FIELD, FLOOR_BAND, KIND, PROPERTY_TYPE } from "./lib/vocab.generated.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripPrefix = (s) => s.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/, "");

/** Số VN: "2.9"/"2,9" (thập phân, 1-2 chữ số) giữ nguyên; "2.900" (nhóm 3)
 *  là ngăn cách nghìn → bỏ separator. Comma cũng là thập phân chuẩn VN. */
export function parseVnNumber(raw) {
  if (/^\d+[.,]\d{1,2}$/.test(raw)) return parseFloat(raw.replace(",", "."));
  return parseFloat(raw.replace(/[.,]/g, ""));
}

// Cách môi giới viết giá (hồ sơ s03-cam-mau-so-lieu, bản nghiên cứu s03-boc-tach-cau-truc-3010 §3.2).
// "2.650 tỷ", "3,349 tỷ": một–hai chữ số + đúng ba chữ số sau dấu, kèm chữ tỷ — môi giới viết triệu, không phải 2.650 tỷ.
const GIA_TY_NHOM_NGHIN = /^\d{1,2}[.,]\d{3}$/;
// "2ty450", "3ty2", "2 tỷ 450" — phần lẻ không được là số phòng, diện tích, triệu hay số đếm của căn ("8 tỷ 4 tầng",
// "3 tỷ 2 ô tô tránh" — Ngoài-1, Ngoài-4 nâng phạm vi ở Cổng Bằng chứng 30/10).
const GIA_TY_LE = /(?<![\p{L}\d.,])(\d{1,3})\s*t(?:ỷ|y)\s*(\d{1,3})(?![\d.,])(?!\s*(?:pn|phòng|wc|tr|triệu|m\b|m2|m²|%|n\b|ng|tầng|lầu|trệt|ô\s*tô|oto|căn|mặt))/giu;
// "5tr5", "8tr5" (không dấu cách giữa tr và phần lẻ).
const GIA_TR_LE = /(?<![\p{L}\d.,])(\d{1,3})tr(\d{1,2})(?![\d.,])(?!\s*(?:pn|wc|m\b|m2|m²))/giu;
// Số dính chữ cái («S702 triệu») không phải giá; cờ g để bỏ qua số ngữ cảnh rồi xét số kế (khopGia).
const GIA_TY = /(?<![\p{L}\d])(?<!\d[.,])(\d+(?:[.,]\d+)*)\s*t(?:ỷ|y|\b)(?![a-zA-Zà-ỹÀ-Ỹ])/giu;
const GIA_TRIEU_SO = /(?<![\p{L}\d])(?<!\d[.,])(\d[\d.,]*)\s*(?:tr|triệu)(?!\/m)(?:\s*\/\s*th(?:áng)?)?/giu;
// "7.000.000" — đồng, đủ hai nhóm nghìn, không theo sau là đơn vị hay "/m" (đơn giá — Ngoài-2).
const GIA_DONG = /(?<![\d.,])(\d{1,3}(?:\.\d{3}){2,})(?![\d.,])(?!\s*(?:tỷ|ty|tr|triệu|m\b|m2|m²|đ\/m|\/\s*m[2²]|\/\s*m\b))/gi;
// "45.000.000/m2", "45.000.000đ/m2" — đơn giá viết bằng đồng: giá/m², không phải tổng giá (Ngoài-2).
const GIA_DONG_M2 = /(?<![\d.,])(\d{1,3}(?:\.\d{3}){2,})(?![\d.,])\s*(?:đ|vnđ|vnd)?\s*\/\s*m(?:2|²)?(?![\p{L}\p{N}])/iu;
// "Giá: 4,000 (thu về)" — số nhóm nghìn đứng sau nhãn giá, không đơn vị: triệu.
const GIA_NHAN_TRIEU = /giá(?:\s*bán)?\s*:?\s*(\d{1,3}[.,]\d{3})(?![\d.,])(?!\s*(?:tỷ|ty|tr|triệu|m\b|m2|m²|đ|vnd))/i;

// Vá hẹp SV1 (hồ sơ s03-va-doc-tin, audit 02/11 §3). Số đứng sau những chữ này là khoản khác, không phải giá chào: «cắt 450tr»,
// «vốn 1,4 tỷ», «đã vào 800tr». Sau «còn», «giá», «bán», «chỉ» thì lại là giá: «cắt lỗ còn 3 tỷ». «Không vay», «bán vay» không nêu khoản vay nào: «ko vay 2ty1», «bán vay full 2.350ty» vẫn là giá.
const KHONG_PHAI_GIA = /(?<![\p{L}])(?:cắt|lỗ|lõm|âm|giảm|hạ|chênh|lời|đã\s*vào|đã\s*đóng|đã\s*thanh\s*toán|(?<!(?<![\p{L}])(?:không|ko|k|chưa|bán)\s+)vay|cọc|vốn|trả\s*trước|gốc|tiến\s*độ|bớt|hỗ\s*trợ|chiết\s*khấu|dòng\s*tiền|thu\s*nhập|lãi|tài\s*chính|ngân\s*sách|tc|ttc|tts|htls)(?![\p{L}])[^\d\n]{0,18}$/iu;
const LAI_LA_GIA = /(?<![\p{L}])(?:còn|giá|bán|chỉ)\s*[:：]?\s*$/iu;
/** Số ở vị trí i trong chữ là khoản khác, không phải giá chào (AC-4). */
function laSoNguCanh(so, i) {
  const truoc = so.slice(Math.max(0, i - 25), i);
  if (LAI_LA_GIA.test(truoc)) return false;
  // Cửa sổ rộng hơn đoạn regex xét, để chặn «không», «bán» trước «vay» không bị cắt mất.
  if (KHONG_PHAI_GIA.test(so.slice(Math.max(0, i - 40), i))) return true;
  return false;
}
/** Khớp đầu tiên của `re` (có cờ g) không phải số ngữ cảnh. */
function khopGia(re, so) {
  for (const m of so.matchAll(re)) if (!laSoNguCanh(so, m.index)) return m;
  return null;
}
// Nhãn giá ngay trước số: «Giá:», «Giá bán:», «GIÁ;», «Giá thuê», «Giá chỉ». «Đơn giá», «giá gốc» không phải.
const NHAN_GIA = /(?<!đơn\s)(?<![\p{L}])gi[áa](?:\s*(?:bán|thuê|chốt|chào|net|nét|chỉ(?:\s*từ|\s*còn)?|cho\s*thuê))*\s*[:：;=\-–]?\s*(?:chỉ\s*)?$/iu;
const SAU_THU_VE = /^\s*\(?\s*(?:net|nét|thu\s*về|thu\s*vè|thu\s*nét|thu\s*net|btp|bao\s*thuế|all\s*in)(?![\p{L}])/iu;
// Giá che số: «4.9xx», «3,0x tỷ», «3,2** tỷ», «36xx», «18XX tỷ». Số không dấu phải đủ hai chữ số; không dính chữ cái hay chữ số
// («PR6xx20», «Be2.2x12» là mã căn).
const GIA_CHE = /(?<![\p{L}\d])(?<!\d[.,])(\d{1,2}[.,]\d{1,2}|\d{2})([xX*]{1,3})(?![\p{L}\d*])/gu;

/** Giá che số ra số sàn (đồng), hoặc null. Chữ số môi giới viết ra là phần chắc chắn; phần che không đoán (hồ sơ: một cột giá). */
function docGiaChe(so) {
  for (const m of so.matchAll(GIA_CHE)) {
    if (laSoNguCanh(so, m.index)) continue;
    const sau = so.slice(m.index + m[0].length);
    const coTy = /^\s*t(?:ỷ|ỉ|y)(?![\p{L}])/iu.test(sau);
    const coNhan = NHAN_GIA.test(so.slice(Math.max(0, m.index - 30), m.index));
    if (!coTy && !coNhan && !SAU_THU_VE.test(sau)) continue;
    if (/[.,]/.test(m[1])) return Math.round(parseFloat(m[1].replace(",", ".")) * 1e9);
    return parseInt(m[1], 10) * 10 ** m[2].length * 1e6;
  }
  return null;
}

// Số trần không đơn vị mà môi giới hiểu là triệu hay tỷ. Nhóm 1 = số.
const SO_TRAN = /(?<![\p{L}\d])(?<!\d[.,])(\d{1,2}[.,]\d{1,3}|\d{4,5})(?![\p{L}\d.,²%])(?!\s*(?:tỷ|tỉ|ty|tr|triệu|m\b|m2|m²|đ|vnd|\/))/giu;
const GIA_CO_NHAN_SO = NHAN_GIA;

/** Giá không đơn vị (AC-7), hẹp: phải có nhãn giá ngay trước, hoặc «net», «thu về», «btp» ngay sau; không có thì không đọc.
 *  «2800», «2.800», «1,950» là triệu (từ 1 tỷ). «4.1», «2.65» là tỷ ở tin bán; «8.5» là triệu ở tin thuê. */
function docGiaKhongDonVi(so, kind) {
  for (const m of so.matchAll(SO_TRAN)) {
    if (laSoNguCanh(so, m.index)) continue;
    const truoc = so.slice(Math.max(0, m.index - 30), m.index);
    const coNhan = GIA_CO_NHAN_SO.test(truoc);
    const sauNet = SAU_THU_VE.test(so.slice(m.index + m[0].length));
    if (!coNhan && !sauNet) continue;
    const raw = m[1];
    if (/^\d{1,2}[.,]\d{3}$/.test(raw) || /^\d{4,5}$/.test(raw)) {
      // Chưa biết loại mà có dấu («Giá: 2,900»): để `suyLoai` đọc theo bối cảnh nhóm, như bản nền.
      if (kind == null && !sauNet && /[.,]/.test(raw)) return null;
      const trieu = parseInt(raw.replace(/[.,]/g, ""), 10);
      // Tin thuê viết theo nghìn đồng, không dấu: «Giá 12000» là 12 triệu một tháng; «4,000» ở tin thuê không rõ nên để trống.
      if (kind === KIND.rent_lt && !sauNet) return /^\d{4,5}$/.test(raw) ? trieu * 1e3 : null;
      if (trieu >= 1000 && trieu < 100000) return trieu * 1e6;
      continue;
    }
    const v = parseFloat(raw.replace(",", "."));
    if (kind === KIND.rent_lt) return v < 100 ? Math.round(v * 1e6) : null;
    if ((kind === KIND.sale || sauNet) && v >= 1 && v < 100) return Math.round(v * 1e9);
  }
  return null;
}

/** Số đứng trước chữ tỷ, ra đơn vị tỷ: "2.650" → 2,65 · "2400" (từ 1.000, không dấu) → 2,4 · còn lại như parseVnNumber. */
export function soTy(raw) {
  if (GIA_TY_NHOM_NGHIN.test(raw)) return parseFloat(raw.replace(",", "."));
  const v = parseVnNumber(raw);
  if (/^\d{4,}$/.test(raw) && v >= 1000) return v / 1000;
  return v;
}

// Diện tích viết thiếu chữ 2 ("64m", "DT:43.2m"): chỉ nhận 15–500 m², và không phải bề ngang/khoảng cách đứng trước.
const BE_NGANG = /(ngang|mặt tiền|\bmt\b|rộng|dài|sâu|hẻm|ngõ|đường|lộ giới|cách)/i;
const MET_TRAN = /(\d+(?:[.,]\d+)?)\s*m(?![\p{L}\p{N}²])/giu;

/** Diện tích từ "<số>m" đứng một mình, hoặc null. */
export function dienTichMetTran(so) {
  for (const m of so.matchAll(MET_TRAN)) {
    const v = parseFloat(m[1].replace(",", "."));
    if (!(v >= 15 && v <= 500)) continue;
    const truoc = so.slice(Math.max(0, m.index - 12), m.index);
    if (BE_NGANG.test(truoc)) continue;
    return v;
  }
  return null;
}

/** Diện tích có đơn vị: "65m2", "65m²", rồi "<số>m" đứng một mình. */
function dienTichCoDonVi(so) {
  const area = so.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i);
  return area ? parseFloat(area[1].replace(",", ".")) : dienTichMetTran(so);
}

// «Diện tích: 45.7» không đơn vị (GC1). Bỏ dấu cách rồi ký tự kế không được là chữ hay số: «65 triệu», «3pn2wc», «20 x 30» không
// qua; dải và kích thước cũng không. Chỉ nhãn đầy đủ: «dt» còn là doanh thu và nằm trong «hdt».
const NHAN_DIEN_TICH = /(?:diện\s*tích|dien\s*tich)\s*[:=\-–]?\s*(\d{1,3}(?:[.,]\d{1,2})?)(?![\d.,]*\d)(?!\s*[-–~\/x×]\s*\d)[ \t]*(?:$|[^\p{L}\p{N}\s])/imu;

/** Diện tích sau nhãn, không đơn vị, cùng khoảng 15–500 m² với dienTichMetTran; hoặc null. */
export function dienTichSauNhan(so) {
  const m = so.match(NHAN_DIEN_TICH);
  if (!m) return null;
  const v = parseFloat(m[1].replace(",", "."));
  return v >= 15 && v <= 500 ? v : null;
}

/** SĐT di động VN từ text tin rao: "0973034567", "0973 034 567",
 * "0973.034.567", "+84973…". Chuẩn hoá về dạng 0xxxxxxxxx(x); chỉ nhận đầu
 * số mobile (3,5,7,8,9) — môi giới gần như luôn dùng mobile, lọc luôn giúp
 * tránh vớ phải số nhà/mã nào đó. Guard (?<!\d)(?!\d) để không cắt giữa dãy
 * số dài (mã bưu chính, số tài khoản…). */
const PHONE_RE = /(?<!\d)(?:\+84|0)(?:[.\-\s]?\d){8,10}(?!\d)/g;
const URL_RE = /https?:\/\/\S+|www\.\S+/gi;

/** Chữ bài để đọc số (N1): mọi URL và mọi dãy dạng SĐT thay bằng một dấu cách — URL ảnh mang «6tY», «/2650/»
 *  từng thành giá, SĐT thành diện tích. SĐT người đăng vẫn đọc từ chữ gốc (extractPhones). */
export function gatSo(text) {
  const t = (text ?? "").replace(URL_RE, " ");
  return t.replace(PHONE_RE, (m, i) => (laDuoiNhomNghin(t, m, i) ? m : " "));
}

/** Khớp SĐT ở vị trí i thật ra là đuôi nhóm nghìn của một số tiền («3.|000.000.000» — hồ sơ s03-gia-ty-chan-dong): đứng
 *  ngay sau «chữ số + dấu chấm/phẩy» và gồm đủ các nhóm 3 chữ số nối bằng cùng dấu ấy. SĐT nối SĐT («…567,0912345678») và
 *  SĐT sau «m2,» không có dạng nhóm 3 chữ số nên vẫn bị gạt. */
function laDuoiNhomNghin(t, m, i) {
  const dau = t[i - 1];
  if ((dau !== "." && dau !== ",") || !/\d/.test(t[i - 2] ?? "")) return false;
  const nhom = dau === "." ? /^\d{3}(?:\.\d{3})+$/ : /^\d{3}(?:,\d{3})+$/;
  if (coDuoiSoNgan(t, m, i, nhom)) return true;
  return nhom.test(m);
}

/** Thân số tiền đứng riêng ngay trước dấu: 1–3 chữ số không dính chữ cái hay dấu chấm/phẩy («Bán 3.» — không phải «50m2.»). */
const THAN_SO_TIEN = /(?:^|[^\p{L}\d.,])\d{1,3}$/u;

/** Khớp kéo sang số ngắn đứng sau giá («3.|000.000.000\n50» trong «3.000.000.000\n50m2» — hồ sơ s03-gia-ty-sau-khoang-trang):
 *  đuôi nhóm nghìn có nhóm cuối «000», rồi khoảng trắng/xuống dòng và 1–2 chữ số (không thể là SĐT), sau một thân số tiền
 *  đứng riêng. SĐT 3-3-3 kèm đuôi («LH 2.098.765.432 1», «50m2.098.765.000 1») trượt một trong hai điều kiện nên vẫn bị gạt. */
function coDuoiSoNgan(t, m, i, nhom) {
  const duoi = /\s\d{1,2}$/.exec(m);
  if (!duoi) return false;
  const than = m.slice(0, duoi.index);
  return nhom.test(than) && than.endsWith("000") && THAN_SO_TIEN.test(t.slice(0, i - 1));
}

/** Bộ bóc SĐT (SD2) — tách khỏi PHONE_RE để chữ đọc giá (gatSo) không đổi. Tiền tố 0 · +84 · 84 rồi đúng 9 chữ số, mỗi
 *  chữ số đứng sau tối đa hai ký tự tách (chấm, gạch, cách, tab, «•», «·» — xuống dòng không nối số). «(+84)», «(84)»,
 *  «(0dd)» mở ngoặc trước khi khớp. */
const TACH_SDT = "[.\\- \\t•·]";
const SDT_RE = new RegExp(`(?<!\\d)(?:\\+84|84|0)(?:${TACH_SDT}{0,2}\\d){9}(?!\\d)`, "g");
/** Ngay sau một khớp: ký tự tách rồi đúng một chữ số lẻ — số 11 chữ số viết tách («0912 345 678 9»), bỏ cả khớp. */
const DUOI_SO_LE = new RegExp(`^${TACH_SDT}{1,2}\\d(?!\\d)`);

/** Chữ để bóc SĐT: gạt URL (tên tệp ảnh mang dãy số giống SĐT), mở ngoặc mã quốc gia và đầu số. */
function chuBocSdt(text) {
  return (text ?? "")
    .replace(URL_RE, " ")
    .replace(/\(\s*\+?84\s*\)/g, "+84")
    .replace(/\(\s*(0\d{2})\s*\)/g, "$1");
}

export function extractPhones(text) {
  const t = chuBocSdt(text);
  const raw = [...t.matchAll(SDT_RE)].filter((m) => !DUOI_SO_LE.test(t.slice(m.index + m[0].length))).map((m) => m[0]);
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    let digits = r.replace(/\D/g, "");
    if (digits.startsWith("84")) digits = "0" + digits.slice(2);
    if (digits.length !== 10) continue;
    if (!/^[35789]/.test(digits.slice(1))) continue;
    const e164 = "+84" + digits.slice(1); // SD3 (Hỏi-A): một dạng E.164 cho mọi chỗ lưu
    if (seen.has(e164)) continue;
    seen.add(e164);
    out.push(e164);
    if (out.length >= 3) break; // tin rao hiếm khi có >3 SĐT thật
  }
  return out;
}

/** SĐT của tin (SD2): số nằm trong nhiều bài nhất của tin; hoà thì xét bài theo thứ tự neo (posted_at sớm nhất, hoà thì
 *  post_id nhỏ nhất — cùng «post neo» của lib/offer-key.mjs) và lấy số hoà đầu tiên trong bài sớm nhất có nó.
 *  @param {{post_id: string, posted_at: string|Date, phones: string[]|null}[]} bai @returns {string|null} */
export function chonSdtTin(bai) {
  const dem = new Map();
  for (const b of bai) for (const p of new Set(b.phones ?? [])) dem.set(p, (dem.get(p) ?? 0) + 1);
  if (!dem.size) return null;
  const max = Math.max(...dem.values());
  const neo = [...bai].sort((a, b) => new Date(a.posted_at) - new Date(b.posted_at) || (a.post_id < b.post_id ? -1 : a.post_id > b.post_id ? 1 : 0));
  for (const b of neo) for (const p of b.phones ?? []) if (dem.get(p) === max) return p;
  return null;
}

/**
 * seller_ref của tin S03/S05 (HD4, audit 30/10 H15): người gửi (`sender_id`) của bài neo — posted_at sớm nhất, hoà thì
 * post_id nhỏ nhất, cùng thứ tự neo của chonSdtTin. Bài không có người gửi thì xét bài kế. Không rơi về author_hash: đó là
 * mã agent thu, một giá trị cho cả nguồn.
 * @param {{ post_id: string, posted_at: string|Date, sender_id?: string|null }[]} bai
 */
export function chonNguoiGuiTin(bai) {
  const neo = [...bai].sort((a, b) => new Date(a.posted_at) - new Date(b.posted_at) || (a.post_id < b.post_id ? -1 : a.post_id > b.post_id ? 1 : 0));
  for (const b of neo) {
    const ai = typeof b.sender_id === "string" ? b.sender_id.trim() : "";
    if (ai) return ai;
  }
  return null; // không bài nào có người gửi
}

/** Số tin mà hợp các số trên mọi bài của tin có ≥ 2 số khác nhau (dòng log «tin nhiều SĐT»). */
export function demTinNhieuSdt(nhom) {
  return nhom.filter((o) => new Set(o.baiSdt.flatMap((b) => b.phones ?? [])).size >= 2).length;
}

// Phòng ngủ viết tắt: «2N», «1N+», «2n1wc», «3n2vs», «2 ngủ». Chữ theo sau không được là chữ cái: «2 năm», «3 nữ», «5 ngày». Dấu
// cộng («1N+») chưa có chỗ lưu. Studio là 0 phòng ngủ.
const PN_TAT = /(?<![\p{L}\d.,])([1-9])\s*(?:n|ngủ|ngu)(?![\p{L}])/iu;
// «1+»: một phòng ngủ cộng; chỉ tính khi đứng riêng, không phải phép cộng số.
const PN_CONG = /(?<![\p{L}\d.,+])([1-3])\+(?![\p{L}\d+])(?!\s*\d)/u;
const STUDIO = /(?<![\p{L}])(?:studio|stu)(?![\p{L}])/iu;

// Mã căn: toà + tầng + trục. Thứ tự: đủ tầng và trục → viết liền → tầng che → lộ một chữ số → toà + trục (bộ đọc audit 02/11 §10).
// Giữ nguyên chữ môi giới (UnitNumber); «S801» viết liền không tầng chưa kiểm cách tách nên không đọc.
const TOA = "([A-Z]{1,3}\\d{1,2}(?:[A-Z]\\d)?)";
const MA_DANG = [
  // Bốn phần: toà có đuôi số («S1.03», «S605» viết liền) + tầng + trục; đứng đầu để dạng ba phần không cắt cụt mã.
  new RegExp(`(?<![\\p{L}\\p{N}_])([A-Z]{1,3}\\d{1,2}[.\\-_]\\d{2}|[A-Z]{1,3}\\d{3})[.\\-_]\\d{2}[.\\-_]\\d{2}[A-Z]?(?![\\p{L}\\p{N}])`, "giu"),
  new RegExp(`(?<![\\p{L}\\p{N}_])${TOA}[.\\-_ ]?\\d{2}[.\\-_]\\d{2}[A-Z]?(?![\\p{L}\\p{N}])`, "giu"),
  new RegExp(`(?<![\\p{L}\\p{N}_])${TOA}(?:\\.\\d{2}\\.?|[.\\-_])\\d{4}(?![\\p{L}\\p{N}])`, "giu"),
  new RegExp(`(?<![\\p{L}\\p{N}_])${TOA}(?:\\.\\d{2})?[.\\-_ ]?(?:[xX*]{2}|[xX*]\\.)[.\\-_]?\\d{2}(?!\\d)`, "giu"),
  new RegExp(`(?<![\\p{L}\\p{N}_])${TOA}[.\\-_ ]?\\d[xX*][.\\-_]?\\d{2}(?!\\d)`, "giu"),
];
// Toà có đuôi số («S1.03», «R1.01»): cả cụm là tên toà của khu đó, không phải toà + trục.
const TOA_DUOI_SO = new RegExp(`(?<![\\p{L}\\p{N}_])([A-Z]{1,3}\\d{1,2}[.\\-_]\\d{2})(?![\\p{L}\\p{N}.\\-])`, "giu");
// Không phải toà: tháng «T4», quận «Q9», và các chữ của mô tả căn.
const KHONG_PHAI_TOA = /^(?:T|Q|PN|WC|VS|N|M|DT|TR|BR|W|HD|HH)\d/i;
const TOA_RIENG = /(?<![\p{L}])(?:toà|tòa|toa)\s*:?\s*([A-Z]{1,3}\d{1,2}[A-Z]?\d?)(?![\p{L}\p{N}])/giu;
// Mã trông như toà ở phần còn lại của bài: chữ HOA + 1–3 số. Chỉ để biết bài có nhắc toà khác, không đọc thành toà.
const MA_TOA_KHAC = /(?<![\p{L}\p{N}_.\-])[A-Z]{1,3}\d{1,3}(?:[A-Z]\d?)?(?![\p{L}\p{N}])/gu;

/** Toà duy nhất khi so không phân biệt hoa thường, giữ nguyên chữ của lần đầu; không có hoặc nhiều toà thì null. */
const motToa = (ds) => (new Set(ds.map((t) => t.toUpperCase())).size === 1 ? ds[0] : null);

/** Các mã căn trong chữ bài, theo dạng khớp đầu tiên của MA_DANG. */
function maTrongBai(so) {
  for (const re of MA_DANG) {
    const thay = [...so.matchAll(re)].filter((m) => !KHONG_PHAI_TOA.test(m[1]));
    if (thay.length) return thay;
  }
  return [];
}

// ---- Tầng của căn (hồ sơ tang-tren-tin-s03, DV4; bộ đọc lấy từ phần tầng của SV2, audit 02/11 §10) ----
// Số tầng chỉ khi có từ dẫn «tầng», «lầu»: «T<số>» trần đa phần là tháng, thứ, tên toà (đo 11/11: 0/40 bài mẫu là tầng),
// «tang» không dấu dễ là «tăng». Không đọc khi số đứng trước («nhà 5 tầng» là số tầng của nhà), nhiều tầng («tầng 2-3»,
// «tầng 1 và 2»), hay số theo sau là diện tích.
const DUOI_KHONG_PHAI_TANG = "(?![\\d\\p{L}]|[.,]\\d|\\s*(?:m\\b|m2|tầng|tum|và|,\\s*\\d|-\\s*\\d))";
// Số đứng riêng ngay trước «tầng» («nhà 5 tầng 2 mặt») chặn; đuôi mã căn («S1.12.08 tầng 15») thì không.
const TRUOC_TANG = "(?<![\\p{L}]|(?<![\\p{L}\\p{N}.\\-_])\\d{1,2}\\s*)";
const TANG_SO = new RegExp(`${TRUOC_TANG}(?:tầng|lầu)\\s*[:\\-]?\\s*(\\d{1,4})${DUOI_KHONG_PHAI_TANG}`, "iu");
const TANG_SO_BO_CHAN = /(?<![\p{L}]|\d\s*)(?:tầng|lầu)\s*[:-]?\s*(\d{1,4})(?![\d\p{L}])/iu; // chỉ cho ca đột biến
const T_TRAN = /(?<![\p{L}\d])T(\d{1,2})(?![\d/])/u; // chỉ cho ca đột biến
const TANG_DAI = /(?<![\p{L}])(?:tầng\s*(trung\s*cao|trung|cao|thấp|vừa)|(trung)\s*tầng)(?![\p{L}]|\s*(?:cấp|tâm))/iu;

/** Dải tầng về đúng ba mã: «trung cao» ra cao, «vừa» ra trung. */
function maDai(m) {
  const k = (m[1] ?? m[2]).toLowerCase().replace(/\s+/gu, " ");
  if (k === "cao" || k === "trung cao") return FLOOR_BAND.upper;
  return k === "thấp" ? FLOOR_BAND.lower : FLOOR_BAND.middle;
}

/** Tầng trong mã căn: hai chữ số trước trục ở dạng đủ («S1.12.08», «GH3-1203»); mã che tầng thì null. */
function tangTuMa(m) {
  const so = m[0].slice(m[1].length).match(/(\d{2})[.\-_]?\d{2}[A-Z]?$/iu)?.[1];
  return so && Number(so) > 0 ? String(Number(so)) : null;
}

/** Số tầng hợp lệ (1–999, không đệm) hay null. */
const soTang = (s) => (s && /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= 999 ? String(Number(s)) : null);

/** Tầng đọc từ chữ bài. Bài nhiều mã căn để trống (chờ PL18 tách căn). Có số thì không ghi dải.
 *  @param {string} text
 *  @param {{ _dotBien?: "bo-chan-nhieu-tang"|"doc-T-tran" }} [opts] `_dotBien` chỉ để ca đột biến của test chứng thước đỏ được
 *  @returns {{ floor: string|null, floorBand: "lower"|"middle"|"upper"|null, trich: string|null }} trich: đoạn khớp nguyên văn trong chữ NFC */
export function docTang(text, { _dotBien } = {}) {
  const rong = { floor: null, floorBand: null, trich: null };
  const so = gatSo(text).normalize("NFC");
  const ma = maTrongBai(so);
  if (new Set(ma.map((m) => m[0].toUpperCase())).size > 1) return rong;
  const mSo = so.match(_dotBien === "bo-chan-nhieu-tang" ? TANG_SO_BO_CHAN : TANG_SO);
  if (mSo) {
    const floor = soTang(mSo[1]);
    return floor ? { floor, floorBand: null, trich: mSo[0] } : rong;
  }
  if (_dotBien === "doc-T-tran") {
    const t = so.match(T_TRAN);
    if (t && soTang(t[1])) return { floor: soTang(t[1]), floorBand: null, trich: t[0] };
  }
  const tangMa = ma.length ? tangTuMa(ma[0]) : null;
  if (tangMa) return { floor: tangMa, floorBand: null, trich: ma[0][0] };
  const dai = so.match(TANG_DAI);
  return dai ? { floor: null, floorBand: maDai(dai), trich: dai[0] } : rong;
}

/** Toà và trục đọc từ chữ bài (AC-8). Bài nhiều mã (thường nhiều căn) để trống trục, chờ PL18; toà chỉ giữ khi mọi mã cùng toà.
 *  @returns {{ block: string|null, unit: string|null }} */
export function docToaTruc(text) {
  const so = gatSo(text);
  const thay = maTrongBai(so);
  const units = [...new Set(thay.map((m) => m[0].toUpperCase()))];
  let unit = thay[0]?.[0] ?? null;
  if (units.length !== 1) unit = null;
  if (thay.length) return { block: motToa(thay.map((m) => m[1])), unit };
  const duoi = [...so.matchAll(TOA_DUOI_SO)].filter((m) => !KHONG_PHAI_TOA.test(m[1])).map((m) => m[1]);
  const conLai = so.replace(TOA_DUOI_SO, " "); // «toà S1.03» là một toà, không đọc lại «S1» ở các bước sau
  const rieng = [...conLai.matchAll(TOA_RIENG)].map((m) => m[1]);
  if (duoi.length || rieng.length) {
    const khac = (conLai.match(MA_TOA_KHAC) ?? []).filter((m) => !KHONG_PHAI_TOA.test(m));
    return { block: motToa([...duoi, ...rieng, ...khac]), unit: null };
  }
  return { block: motToa(maToaCan(text).filter((m) => !KHONG_PHAI_TOA.test(m))), unit: null };
}

// ---- Bước 2: parse ----
export function parsePost(text, { giaKhongDonVi = true } = {}) {
  const out = { kind: null, priceVnd: null, pricePerm2Vnd: null, areaM2: null, bedrooms: null, phuong: null, phone: null, phones: null };

  // Số đọc trên chữ đã gạt URL và SĐT (N1); SĐT người đăng đọc từ chữ gốc ở dưới.
  const so = gatSo(text);

  // loại tin: bán vs thuê. KHÔNG return sớm khi thiếu keyword — môi giới ở
  // nhóm "mua bán" thường không lặp chữ "bán", chỉ ghi giá ("Giá: 6.1 tỷ").
  // Transform tự suy kind theo bối cảnh khi cần; parser cứ parse đủ trường.
  // Ý định không vá ở đây (hồ sơ s03-cam-mau-so-lieu: việc của PL5).
  if (/cho thuê|thuê dài hạn|cần cho thuê|thuê dài hạn/i.test(so)) out.kind = "rent_lt";
  else if (/bán|chính chủ bán|cần tiền bán|bán gấp/i.test(so)) out.kind = "sale";

  // giá: "45tr/m2", "3.2 tỷ", "2tỷ", "15tr/tháng", "12 triệu/th"
  const perm2 = so.match(/(\d[\d.,]*)\s*(?:tr|triệu)\/m[²2]/i);
  if (perm2) out.pricePerm2Vnd = Math.round(parseVnNumber(perm2[1]) * 1e6);
  const dongM2 = so.match(GIA_DONG_M2);
  if (!out.pricePerm2Vnd && dongM2) out.pricePerm2Vnd = parseInt(dongM2[1].replace(/\./g, ""), 10);

  // "2ty450", "3ty2", "2 tỷ 450": phần sau chữ tỷ là phần lẻ (2,45 tỷ) — xét trước dạng tỷ thường, vì "3ty2" khớp cả hai.
  const tyLe = khopGia(GIA_TY_LE, so);
  // (?!..) chặn 't' của chữ thường tiếng Việt ("62m2, tổng …") — \b của JS
  // chỉ theo ASCII nên 'tổ' vẫn tạo boundary giả (bench C2 bắt được).
  const ty = khopGia(GIA_TY, so);
  const che = docGiaChe(so);
  if (che != null) out.priceVnd = che;
  else if (tyLe) out.priceVnd = Math.round(parseFloat(`${tyLe[1]}.${tyLe[2]}`) * 1e9);
  else if (ty) out.priceVnd = Math.round(soTy(ty[1]) * 1e9);

  if (!out.priceVnd && !out.pricePerm2Vnd) {
    // "5tr5", "8tr5": phần sau chữ tr là phần lẻ (5,5 triệu).
    const trLe = khopGia(GIA_TR_LE, so);
    const trieu = khopGia(GIA_TRIEU_SO, so);
    if (trLe) out.priceVnd = Math.round(parseFloat(`${trLe[1]}.${trLe[2]}`) * 1e6);
    else if (trieu) out.priceVnd = Math.round(parseVnNumber(trieu[1]) * 1e6);
  }

  if (!out.priceVnd && !out.pricePerm2Vnd) {
    // Không đơn vị: "7.000.000" (đủ hai nhóm nghìn) là đồng; "Giá: 4,000" ở tin bán là triệu (4 tỷ), tin thuê để trống.
    const dong = khopGia(GIA_DONG, so);
    const giaTrieu = out.kind === "sale" ? so.match(GIA_NHAN_TRIEU) : null;
    if (dong) out.priceVnd = parseInt(dong[1].replace(/\./g, ""), 10);
    else if (giaTrieu) out.priceVnd = Math.round(parseVnNumber(giaTrieu[1]) * 1e6);
    else if (giaKhongDonVi) out.priceVnd = docGiaKhongDonVi(so, out.kind);
  }

  // diện tích: "65m2", "65m²", "DT 45m". Số đọc được trên chữ gốc giữ nguyên; còn rỗng mới đọc chữ kiểu Unicode rồi nhãn (GC1).
  // Chỉ diện tích đi qua NFKC: đổi giá kéo theo thước giá và gom tin, việc riêng.
  const soKieu = gatSo((text ?? "").normalize("NFKC"));
  out.areaM2 = dienTichCoDonVi(so) ?? dienTichCoDonVi(soKieu) ?? dienTichSauNhan(soKieu);

  // bedrooms: "2PN", "2 phòng ngủ", "2BR"
  const bd = so.match(/(\d+)\s*(?:PN|phòng ngủ|BR)/i);
  const tat = bd ? null : so.match(PN_TAT);
  if (bd) out.bedrooms = parseInt(bd[1]);
  else if (tat) out.bedrooms = parseInt(tat[1]);
  else if (PN_CONG.test(so)) out.bedrooms = parseInt(so.match(PN_CONG)[1]);
  else if (STUDIO.test(so)) out.bedrooms = 0;

  // SĐT người đăng (nằm sẵn trong text tin rao — nguồn contact chính của P1)
  out.phones = extractPhones(text);
  out.phone = out.phones[0] ?? null;
  out.ma = maToaCan(text);
  Object.assign(out, docToaTruc(text));
  const tang = docTang(text);
  out.floor = tang.floor;
  out.floorBand = tang.floorBand;
  out.trichTang = tang.trich;

  // sanitize: regex "tổng thể" có thể vớ chuỗi lạ → NaN; NaN vô hại hoá
  // thành null để transform bỏ qua thay vì gãy INSERT bigint.
  for (const k of ["priceVnd", "pricePerm2Vnd", "areaM2", "bedrooms"]) {
    if (!Number.isFinite(out[k])) out[k] = null;
  }

  // phường: match tên phường từ text (danh sách sẽ load từ DB)
  out._phuongCandidates = [];
  return out;
}

// ---- Bước 2b: suy loại tin khi chữ bài không ghi «bán/cho thuê» (s03-nhan-loai-tin-rong, RM1) ----
// Mạnh 31/10: nhóm S03 đã tham gia đều là mua bán và cho thuê — bài mặc định là tin rao theo bối cảnh nhóm. Luật xác
// định (luật 7), chỉ chạy khi parsePost để kind rỗng: bài đã có loại không bao giờ đổi. Thứ tự quyết: Yêu cầu → cửa vào
// (giá + dấu hiệu BĐS) → đơn vị giá thuê → tín hiệu bán → mục đích nhóm. Model thay luật này qua KC1/PL5 khi tập nhãn
// vàng xác nhận; luật ở lại làm dự phòng.

/** Nguồn suy loại, theo thứ tự đếm của dòng log. */
export const NGUON_LOAI = Object.freeze(["chu-bai", "tin-hieu-chu", "don-vi-gia", "boi-canh-nhom", "yeu-cau", "bo"]);

// Yêu cầu (listing_intent = inquiry, CONTEXT.md): bên mua — «cần mua/thuê/tìm», «tìm mua/thuê/căn/nhà», «khách … xem/tìm/cần»
// trong cùng câu ngắn, «anh chị/ai có căn (gửi)». «Có khách cọc», «đã có khách» là tin rao (không có động từ tìm/xem/cần).
const YEU_CAU = /(?:cần\s+(?:mua|thuê|tìm)|tìm\s+(?:mua|thuê|căn|nhà|phòng)|kh[aá]c?h\b[^.!?\n]{0,30}?\b(?:xem|tìm|cần)\b|(?:anh|a)\s*(?:\/\s*)?(?:chị|c)\s+(?:nào\s+)?có\s+căn|ai\s+có\s+căn|có\s+căn\s+gửi)/iu;
// Viết tắt «<số>n» (2n, 2n1wc) kết bằng lookahead chữ có dấu, không \b — \b của JS chỉ hiểu ASCII nên «1 năm», «3 nữ»
// từng khớp (s03-cho-vay-khong-phai-bds).
const DAU_HIEU_BDS = /(?:\d+\s*(?:pn|phòng\s*ngủ|wc|vs)\b|\d+\s*n\s*\+?\s*\d?(?![a-zà-ỹđ])|\d+(?:[.,]\d+)?\s*m[²2]|\bstudio\b|căn\s*hộ|chung\s*cư|\bccmn\b|shophouse|biệt\s*thự|liền\s*kề|nhà\s*phố|\bduplex\b|penthouse)/iu;
// Tín hiệu bán: giá đơn vị tỷ, «thu về», «cắt lỗ», «hạ giá», «giá tốt», «chuyển nhượng», «bao thuế phí»/«BTP», «sổ hồng/đỏ».
// KHÔNG «CN» trần — trong bài S03 «CN» hay là «chủ nhật» («xem nhà T7-CN»).
const CO_TY = /\d(?:[\d.,]*\d)?\s*t(?:ỷ|y)(?![a-zà-ỹ])/iu;
const TIN_HIEU_BAN = /(?:thu\s*về|cắt\s*lỗ|hạ\s*giá|giá\s*tốt|chuyển\s*nh[ưư][ợơ]ng|bao\s*thuế|\bbtp\b|sổ\s*(?:hồng|đỏ))/iu;
// «tháng» chỉ tính khi đi liền sau giá triệu («14tr tháng», «10 triệu/tháng») — «bàn giao tháng 12» không phải thuê.
const DON_VI_THUE = /(?:\/\s*th(?:áng)?\b|\d\s*(?:tr|triệu)\s*(?:một|mỗi|1)?\s*tháng\b|\bpass\b)/iu;
const GIA_TRIEU = /\d\s*(?:tr|triệu)(?!\s*\/\s*m)/iu;
const TEN_BAN = /(?:chuyển\s*nh[ưư][ợơ]ng|\bbán\b|giỏ\s*hàng|quỹ|giá\s*đáy)/iu;
const TEN_THUE = /cho\s*thuê/iu;
const NHOM_TOI_THIEU = 20;
const NHOM_TI_LE = 0.85;
/** Sàn giá bán suy loại (AC-9): bài suy ra bán mà giá dưới 300 triệu (vd «5.000.000» trong nhóm bán) giữ rỗng. */
const GIA_BAN_SAN = 3e8;

/** Bài là Yêu cầu (bên mua). */
export function laYeuCau(text) {
  return YEU_CAU.test(gatSo(text ?? ""));
}

/** Bài có dấu hiệu BĐS (số phòng, diện tích, loại căn). */
export function coDauHieuBds(text) {
  return DAU_HIEU_BDS.test(gatSo(text ?? ""));
}

/** Mục đích nhóm theo tên: chỉ bán («chuyển nhượng», «giỏ hàng»…) hay chỉ thuê («cho thuê»); lẫn hoặc không rõ → null. */
export function mucDichTheoTen(ten) {
  if (!ten) return null;
  const ban = TEN_BAN.test(ten), thue = TEN_THUE.test(ten);
  return ban && !thue ? KIND.sale : thue && !ban ? KIND.rent_lt : null;
}

/** Bài mang khoá nhóm đã chuẩn hoá: mọi phép gom theo nhóm đọc khoá này, một nhóm đăng ký hai dạng khoá không bị chia đôi. */
const veKhoaNhom = (p, khoaNhom) => (p.conversation_id == null ? p : { ...p, conversation_id: khoaNhom(p.conversation_id) });

/**
 * Mục đích từng nhóm (khoá conversation_id): theo tên, rồi theo tỉ lệ loại chữ bài trên mọi bài của lượt (lượt nạp lại
 * toàn bộ stg nên là lịch sử nhóm) — ≥ 20 bài chữ bài và ≥ 85% một loại; còn lại «ca-hai».
 * @param {{ conversation_id: string|null, group_name?: string|null, kind: string|null }[]} bai kind = kết quả parsePost
 * @returns {Map<string, KIND.sale|KIND.rent_lt|"ca-hai">}
 */
export function mucDichNhom(bai) {
  const dem = new Map();
  for (const b of bai) {
    const k = b.conversation_id;
    if (!k) continue; // Bài không có khoá không thuộc nhóm nào, như loaiHinhNhom.
    const e = dem.get(k) ?? { ten: b.group_name ?? null, sale: 0, rent_lt: 0 };
    if (!e.ten && b.group_name) e.ten = b.group_name;
    if (b.kind === KIND.sale || b.kind === KIND.rent_lt) e[b.kind]++;
    dem.set(k, e);
  }
  const out = new Map();
  for (const [k, e] of dem) {
    const theoTen = mucDichTheoTen(e.ten);
    if (theoTen) { out.set(k, theoTen); continue; }
    const tong = e.sale + e.rent_lt;
    if (tong >= NHOM_TOI_THIEU && e.sale / tong >= NHOM_TI_LE) out.set(k, KIND.sale);
    else if (tong >= NHOM_TOI_THIEU && e.rent_lt / tong >= NHOM_TI_LE) out.set(k, KIND.rent_lt);
    else out.set(k, "ca-hai");
  }
  return out;
}

/**
 * Suy loại một bài. Bài parsePost đã có kind → giữ nguyên (nguồn chu-bai). Bài bán mà giá không đơn vị («Giá: 4,000 thu về»)
 * thì điền giá theo triệu như parsePost làm cho bài có chữ «bán».
 * @param {ReturnType<typeof parsePost>} pr  (bị sửa priceVnd trong ca giá không đơn vị)
 * @param {string} text
 * @param {KIND.sale|KIND.rent_lt|"ca-hai"|undefined} mucDich
 * @returns {{ kind: KIND.sale|KIND.rent_lt|null, nguon: string }}
 */
export function suyLoai(pr, text, mucDich) {
  if (pr.kind) return { kind: pr.kind, nguon: "chu-bai" };
  const so = gatSo(text ?? "");
  if (YEU_CAU.test(so)) return { kind: null, nguon: "yeu-cau" };
  const giaKhongDonVi = pr.priceVnd == null && pr.pricePerm2Vnd == null ? so.match(GIA_NHAN_TRIEU) : null;
  const coGia = pr.priceVnd != null || pr.pricePerm2Vnd != null || giaKhongDonVi != null;
  if (!coGia || !DAU_HIEU_BDS.test(so)) return { kind: null, nguon: "bo" };
  const coTy = CO_TY.test(so);
  const giaThue = pr.priceVnd != null && pr.priceVnd < 1e9 && pr.pricePerm2Vnd == null && !coTy && GIA_TRIEU.test(so);
  // Giá theo m² hay giá từ 1 tỷ không bao giờ là thuê (AC-2), dù chữ có «/tháng» hay «pass».
  const giaCoTheThue = pr.pricePerm2Vnd == null && (pr.priceVnd == null || pr.priceVnd < 1e9) && !coTy;
  if (giaThue || (DON_VI_THUE.test(so) && giaCoTheThue)) return { kind: KIND.rent_lt, nguon: "don-vi-gia" };
  if (coTy || TIN_HIEU_BAN.test(so)) {
    if (pr.priceVnd == null && giaKhongDonVi) pr.priceVnd = Math.round(parseVnNumber(giaKhongDonVi[1]) * 1e6);
    if (pr.priceVnd != null && pr.priceVnd < GIA_BAN_SAN) return { kind: null, nguon: "bo" };
    return { kind: KIND.sale, nguon: "tin-hieu-chu" };
  }
  if (mucDich === KIND.sale || mucDich === KIND.rent_lt) {
    if (mucDich === KIND.sale && pr.priceVnd == null && giaKhongDonVi) pr.priceVnd = Math.round(parseVnNumber(giaKhongDonVi[1]) * 1e6);
    if (mucDich === KIND.sale && pr.priceVnd != null && pr.priceVnd < GIA_BAN_SAN) return { kind: null, nguon: "bo" };
    if (mucDich === KIND.rent_lt && !giaCoTheThue) return { kind: null, nguon: "bo" };
    return { kind: mucDich, nguon: "boi-canh-nhom" };
  }
  return { kind: null, nguon: "bo" };
}

/** Đếm số bài theo nguồn suy loại — đủ mọi khoá của NGUON_LOAI (khoá vắng = 0). */
export function demNguonLoai(nguon) {
  const out = Object.fromEntries(NGUON_LOAI.map((k) => [k, 0]));
  for (const n of nguon) out[n] = (out[n] ?? 0) + 1;
  return out;
}

/**
 * Tầng loại tin của từng bài cho lát nhãn `s03-loai-tin` (AC-10): `chu-bai` — parsePost đã gán loại; `moi-nhan` — suy
 * loại mới nhận; `van-bo` — vẫn không loại (kể cả Yêu cầu). Tính bằng chính parsePost + suyLoai của lượt transform.
 * @param {{ post_id: string, text: string, conversation_id?: string|null, group_name?: string|null }[]} posts
 * @returns {Map<string, "chu-bai"|"moi-nhan"|"van-bo">}
 */
export function tangLoai(posts, { parse = parsePost, khoaNhom = khoaNhomThat } = {}) {
  const docBai = posts.map((p) => ({ p: veKhoaNhom(p, khoaNhom), pr: parse(p.text) }));
  const mucDich = mucDichNhom(docBai.map(({ p, pr }) => ({ conversation_id: p.conversation_id, group_name: p.group_name, kind: pr.kind })));
  const out = new Map();
  for (const { p, pr } of docBai) {
    if (pr.kind) { out.set(p.post_id, "chu-bai"); continue; }
    out.set(p.post_id, suyLoai(pr, p.text, mucDich.get(p.conversation_id ?? "")).kind ? "moi-nhan" : "van-bo");
  }
  return out;
}

/** Match phường: tên phường xuất hiện trong text. Chọn ứng viên khớp DÀI
 *  NHẤT (không phải đầu tiên) — tránh "Láng" nuốt "Láng Thượng"; thử cả tên
 *  bỏ prefix vì tin rao chỉ ghi tên trần. Normalize NFC hai phía — tên OSM
 *  trong DB trộn NFC/NFD khiến includes() thất bại byte-wise. Slug/tên rỗng
 *  và bare chỉ toàn số/chữ ngược (vd "3" của "Quận 3") skip. */
export function matchPhuong(text, phuongSlugs) {
  const textLower = text.normalize("NFC").toLowerCase();
  let best = null;
  let bestLen = 0;
  for (const [slug, name] of phuongSlugs) {
    if (!slug || !name) continue;
    const variants = [
      name,
      slug.replace(/-/g, " "),
      name.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/i, ""),
    ].map((v) => v.normalize("NFC").toLowerCase());
    for (const v of variants) {
      if (v.length < 2 || /^[\d\s]+$/.test(v)) continue;
      if (textLower.includes(v) && v.length > bestLen) {
        best = { slug, name };
        bestLen = v.length;
      }
    }
  }
  return best;
}

const HUONG_GHEP = /^(?:đông|tây)\s*(?:nam|bắc)$/u;

/**
 * Phường theo thị trường (N1): khớp dài nhất như matchPhuong trên danh sách phường của nhiều thị trường; khớp dài nhất
 * rơi vào hai thị trường (tên trùng giữa Hà Nội và TP.HCM) thì không đoán — trả null.
 * @param {string} text
 * @param {{ id: string, name: string, market: string }[]} entries
 * @returns {{ id: string, slug: string, market: string } | null}
 */
export function matchPhuongThiTruong(text, entries) {
  const textLower = text.normalize("NFC").toLowerCase();
  // AC-3: tên phường trùng hướng («Tây Nam») chỉ khớp khi gọi đích danh; không thì là hướng nhà.
  const tenHuongHopLe = (v, chu) => !HUONG_GHEP.test(v) || new RegExp(`(?<![\\p{L}])(?:phường|p\\.|p|xã)\\s*${v}(?![\\p{L}])`, "u").test(chu);
  let best = null;
  let bestLen = 0;
  let tranh = false;
  for (const e of entries) {
    const slug = e.id.slice(e.market.length + 1);
    const variants = [e.name, slug.replace(/-/g, " "), e.name.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/i, "")]
      .map((v) => v.normalize("NFC").toLowerCase());
    let len = 0;
    for (const v of variants) {
      if (v.length < 2 || /^[\d\s]+$/.test(v)) continue;
      if (!tenHuongHopLe(v, textLower)) continue;
      if (textLower.includes(v) && v.length > len) len = v.length;
    }
    if (len === 0) continue;
    if (len > bestLen) { best = { id: e.id, slug, market: e.market }; bestLen = len; tranh = false; }
    else if (len === bestLen && best && best.market !== e.market) tranh = true;
  }
  return tranh ? null : best;
}

/**
 * Phường của một bài S03 (PX1): tên hiện hành trên danh sách của tập thị trường (nhóm khai → thị trường đã khai; chưa
 * khai → thị trường có phường OSM, không mở ra 34 tỉnh — Hỏi-2); không khớp thì tên xã cũ an toàn, chỉ khi bài gọi đích
 * danh «phường/xã/P. <tên cũ>» (Hỏi-3); hai thị trường ra hai xã khác nhau → không đoán.
 * @param {string} text
 * @param {string[]|null|undefined} khai thị trường nhóm khai
 * @param {{ entries: (m: string[]) => { id: string, name: string, market: string }[], moiThiTruong: string[], biDanhCua: Map<string, Map<string, string>> }} o
 * @returns {{ ph: { id: string, slug: string, market: string } | null, cach: "ten"|"bi-danh"|null }}
 */
export function ganPhuongS03(text, khai, { entries, moiThiTruong, biDanhCua }) {
  const tap = khai?.length ? khai : moiThiTruong;
  const ph = matchPhuongThiTruong(text, entries(tap));
  if (ph) return { ph, cach: "ten" };
  let thay = null;
  for (const m of tap) {
    const id = matchXaCuCoTienTo(text, biDanhCua?.get(m));
    if (!id) continue;
    if (thay && thay.id !== id) return { ph: null, cach: null };
    thay = { id, slug: id.slice(m.length + 1), market: m };
  }
  return thay ? { ph: thay, cach: "bi-danh" } : { ph: null, cach: null };
}

/**
 * Khu vực của một bài (hồ sơ s03-len-cong). Khớp phường thì lấy phường. Không khớp mà nhóm khai đúng một thị trường có trong `areas`:
 * mã thị trường, `phuong` trống nên confidence không lên high. Chưa khai hay khai nhiều: trống.
 * @param {{ khai?: string[]|null, ph?: { id: string, slug: string }|null, maCoThat: Set<string> }} v
 * @returns {{ areaId: string|null, phuong: string|null }}
 */
export function ganKhuVuc({ khai, ph, maCoThat }) {
  if (ph) return { areaId: ph.id, phuong: ph.slug };
  if (khai?.length === 1 && maCoThat.has(khai[0])) return { areaId: khai[0], phuong: null };
  return { areaId: null, phuong: null };
}

/** Tin chỉ cấp thị trường có `phuong` trống nên không lên high. */
export const mucTinCay = ({ hasPrice, hasArea, hasPhuong }) =>
  hasPrice && hasArea && hasPhuong ? CONFIDENCE.high : hasPrice ? CONFIDENCE.medium : CONFIDENCE.low;

/**
 * Gộp khu vực khi một tin có thêm bài. Tin có phường giữ nguyên (khoá gom đã chứa phường). Tin chỉ cấp thị trường: nhận mã đầu tiên có,
 * hai bài khai hai thị trường thì về trống vì không biết tin thuộc đâu.
 * @param {{ areaId: string|null, phuongRaw: string|null, xungKhuVuc?: boolean }} o bị sửa
 * @param {string|null} areaId
 */
export function gopKhuVuc(o, areaId) {
  if (o.phuongRaw || !areaId || o.xungKhuVuc) return;
  if (o.areaId === null) o.areaId = areaId;
  else if (o.areaId !== areaId) { o.areaId = null; o.xungKhuVuc = true; }
}

const LOAI_CAN_HO = /(căn hộ|chung cư|chcc|studio)/iu;
const LOAI_NHA = /(biệt thự|liền kề|shophouse|nhà phố|nhà mặt|nhà riêng)/iu;
export const LOAI_HINH_VERSION = "transform-zalo@sl1";

/** Loại hình nói rõ trong chữ bài; nói cả hai loại hay chỉ «PN», «căn» thì không nhận. */
export function docLoaiHinh(text) {
  const chu = (text ?? "").normalize("NFC");
  const ch = LOAI_CAN_HO.test(chu), nh = LOAI_NHA.test(chu);
  return ch && !nh ? PROPERTY_TYPE.apartment : nh && !ch ? PROPERTY_TYPE.house : null;
}

/**
 * Loại hình của nhóm theo bài nói rõ loại: ≥ 20 bài và ≥ 85% một loại, cùng ngưỡng với mucDichNhom. Bài không có nhóm không tính.
 * @param {{ conversation_id: string|null, loai: string|null }[]} bai
 * @returns {Map<string, string>}
 */
export function loaiHinhNhom(bai) {
  const dem = new Map();
  for (const { conversation_id: k, loai } of bai) {
    if (!k || !loai) continue;
    const e = dem.get(k) ?? new Map();
    e.set(loai, (e.get(loai) ?? 0) + 1);
    dem.set(k, e);
  }
  const out = new Map();
  for (const [k, e] of dem) {
    const tong = [...e.values()].reduce((a, b) => a + b, 0);
    for (const [loai, n] of e) if (tong >= NHOM_TOI_THIEU && n / tong >= NHOM_TI_LE) out.set(k, loai);
  }
  return out;
}

export { normText };

/**
 * Khoá gom repost của một bài đã đọc (bước 4). Đủ phường và diện tích: chỉ nội dung kind|phường|giá|DT|PN — bài của
 * người khác đăng lại cùng căn vẫn gộp. Thiếu phường hoặc diện tích: nội dung còn lại quá rộng (26/10: 95 bài «cho thuê
 * 12 triệu» của nhiều người thành một tin; 321/324 tin S03 không có phường) nên thêm người đăng — `sender_id`, rồi SĐT
 * trong bài, không có cả hai thì chữ bài đã chuẩn hoá. Khoá này chỉ để gom; offer_id vẫn theo post (PL14, offer-key.mjs).
 * @param {{ kind: string, phuong?: string|null, priceVnd: number|null, pricePerm2Vnd: number|null, areaM2: number|null,
 *           bedrooms: number|null, phone?: string|null }} pr
 * @param {{ sender_id?: string|null, text?: string|null }} post
 */
export function repostKey(pr, post) {
  const noiDung = `${pr.kind}|${pr.phuong ?? "?"}|${pr.priceVnd ?? pr.pricePerm2Vnd}|${pr.areaM2 ?? "?"}|${pr.bedrooms ?? "?"}`;
  // SV1: trục tách căn ở cả nhánh đủ phường + DT, để một tin không phát biểu hai trục.
  if (pr.phuong && pr.areaM2 != null) return pr.unit ? `${noiDung}|${pr.unit.toUpperCase()}` : noiDung;
  const nguoi = post.sender_id ? `sender:${post.sender_id}` : pr.phone ? `phone:${pr.phone}` : `text:${normText(post.text)}`;
  // N1: mã toà/căn tách các căn khác nhau của một môi giới cùng giá/PN (đo 30/10: một offer gom 40 bài).
  // SV1: thêm trục mới đọc để hai căn khác trục không chung tin; viết hoa để cùng trục khác hoa thường vẫn chung.
  const ma = [...new Set([...(pr.ma ?? []), ...(pr.unit ? [pr.unit] : [])].map((m) => m.toUpperCase()))].sort();
  return `${noiDung}|${ma.join(",") || "?"}|${nguoi}`;
}

// Mã toà/căn trong chữ bài: chữ HOA 1–3 + 1–2 số (S10, BS8, PR2, LD2), kèm đuôi căn ".03", "-1203", "xx13".
const MA_TOA_CAN = /(?<![\p{L}\p{N}])([A-Z]{1,3}\d{1,2}(?:[.\-]\d{2,4}|x{2}\d{2})?)(?![\p{L}\p{N}])/gu;

/** Mã toà/căn đọc từ chữ đã gạt URL, sắp xếp, không trùng; bỏ "T<số>" (thường là mốc «T4/2027»). Chỉ để gom, không nối. */
export function maToaCan(text) {
  const ma = [...gatSo(text).matchAll(MA_TOA_CAN)].map((m) => m[1]).filter((m) => !/^T\d{1,2}$/.test(m));
  return [...new Set(ma)].sort();
}

// Chốt khoảng giá (N1, Hỏi-2 = a): số phi lý không thành offer. Không đổi loại tin — ý định là việc của PL5.
const GIA_THUE_TRAN = 1e9;
const GIA_BAN_TRAN = 100e9;

// Đơn vị tháng, năm đi liền số tiền từ 1 tỷ («1 tỷ/tháng»): vẫn là thuê phi lý, không đổi loại. «/tháng» gắn với số khác là tiền thuê
// hiện tại của bài bán («đang cho thuê 7tr/tháng. Giá bán: 2,7 tỷ»).
const THEO_THANG = /(?:\d\s*(?:tỷ|tỉ|ty)\s*\d{0,3}|\d{1,3}(?:\.\d{3}){3,}\s*(?:đồng|đ|vnđ|vnd)?|\d{4,}\s*(?:triệu|tr))\s*(?:\/\s*(?:th(?:áng)?|năm|(?:một|1)\s*(?:tháng|năm))|(?:một|mỗi|1)\s*(?:tháng|năm))(?![\p{L}])/iu;

/** Bài thuê giá từ 1 tỷ không ghi đơn vị tháng là bài bán có chữ «cho thuê» («đang cho thuê», AC-5): đổi loại thay vì vứt. */
export function chinhLoaiThueTy(pr, text) {
  if (pr.kind !== KIND.rent_lt || pr.priceVnd == null || pr.priceVnd < GIA_THUE_TRAN) return;
  if (!THEO_THANG.test(gatSo(text))) pr.kind = KIND.sale;
}

/** Lý do một bài đã đọc có giá phi lý, hoặc null. */
export function lyDoGiaPhiLy(pr) {
  if (pr.priceVnd == null) return null;
  if (pr.kind === "rent_lt" && pr.priceVnd >= GIA_THUE_TRAN) return "thue-tu-1-ty";
  if (pr.kind === "sale" && pr.priceVnd > GIA_BAN_TRAN) return "ban-tren-100-ty";
  return null;
}

/**
 * Thị trường khai của từng nhóm S03 ở sổ nhóm (collection_units, PL12): group_key (= stg_zalo_posts.conversation_id) →
 * market_codes. Sổ chưa có (DB chưa áp 048) → bảng rỗng, mọi nhóm đi nhánh «chưa khai». Tra được cả theo khoá nguyên văn của
 * từng dòng lẫn theo khoá thật; hai dòng của một nhóm khác thị trường thì khoá thật theo dòng khoá trần.
 * @param {import("pg").Client} client
 * @returns {Promise<Map<string, string[]>>}
 */
export async function docThiTruongNhom(client, khoaNhom = khoaNhomThat) {
  const { rows: co } = await client.query("SELECT to_regclass('collection_units') IS NOT NULL AS ok");
  if (!co[0].ok) return new Map();
  const { rows } = await client.query(
    "SELECT group_key, market_codes FROM collection_units WHERE source_code = 'S03' AND cardinality(market_codes) > 0 ORDER BY unit_code",
  );
  const out = new Map(rows.map((r) => [r.group_key, r.market_codes]));
  for (const r of rows) {
    const khoa = khoaNhom(r.group_key);
    if (!out.has(khoa)) out.set(khoa, r.market_codes);
  }
  return out;
}

/**
 * Thân transform S03 — người gọi giữ transaction (main bọc BEGIN…COMMIT; test và thước dư
 * lượng bọc BEGIN…ROLLBACK). Post thử bị gạt ở đầu đọc (lib/test-posts.mjs, PL2).
 * @param {import("pg").Client} client
 */
// `parse` chỉ để thước giả lập đổi rule parser (PL14 NL-AC-4); đường chạy thật luôn dùng parsePost.
// `suyLoaiTin: false` tắt bước suy loại (RM1) — chỉ cho thước đối chiếu trước/sau; đường chạy thật luôn bật.
// `khoaNhom` chỉ để thước truyền hàm đột biến (nhom-hai-lan-s03-xu-goc); đường chạy thật luôn dùng khoaNhomThat.
/** Phiên bản bộ đọc tầng (DV4) — method_version của phát biểu tầng. */
export const TANG_VERSION = "transform-zalo@dv4";

export async function runTransformZalo(client, { parse = parsePost, suyLoaiTin = true, khoaNhom = khoaNhomThat, ganSo = ganSdtQuaNguoi } = {}) {
  // Phường theo thị trường của nhóm (N1): nhóm S03 khai market_codes ở sổ nhóm (collection_units, PL12) chỉ đối chiếu
  // phường của các thị trường đó; nhóm chưa khai (Hỏi-1, Mạnh duyệt 30/10) đối chiếu mọi thị trường có phường.
  const moiThiTruong = await docThiTruongCoPhuong(client);
  // PX1: danh sách tên phủ mọi thị trường có xã khớp tên được (nhóm khai tỉnh khác 4 thành phố); nhóm chưa khai vẫn chỉ
  // đối chiếu moiThiTruong (Hỏi-2). Chưa áp 084 → docThiTruongCoXa = docThiTruongCoPhuong, không bí danh.
  const coXa = await docThiTruongCoXa(client);
  const areas = await docPhuongHopLe(client, coXa);
  const biDanhCua = await docBiDanhAnToan(client, coXa);
  const entriesCua = new Map(); // khoá thị trường đã sắp → danh sách phường
  const entries = (markets) => {
    const k = [...markets].sort().join(",");
    if (!entriesCua.has(k)) {
      const set = new Set(markets);
      entriesCua.set(k, areas.filter((a) => set.has(a.parent_id)).map((a) => ({ id: a.id, name: a.name, market: a.parent_id })));
    }
    return entriesCua.get(k);
  };
  const thiTruongNhom = await docThiTruongNhom(client, khoaNhom);
  const { rows: dongTT } = await client.query("SELECT id FROM areas WHERE region_type = 'market'");
  const maCoThat = new Set(dongTT.map((r) => r.id));

  // Load staging posts (mới nhất per post_id). Chỉ nguồn Zalo — posts
  // Facebook (agent_id apify-facebook) do transform-fb.mjs xử lý (S05).
  // Post thử (zalo-mock, e2e, nhóm TEST) bị gạt tại đây — L19.
  const { posts: baiTho, rejected } = await loadStgPosts(client, "zalo");
  const posts = baiTho.map((p) => veKhoaNhom(p, khoaNhom));
  const baiDoiKhoa = posts.filter((p, i) => p.conversation_id !== baiTho[i].conversation_id).length;
  console.log(`posts: ${posts.length} (gạt ${rejected.total} post thử ${JSON.stringify(rejected.by_marker)})`);

  // ---- Bước 2+3: parse + confidence ----
  const parsed = [];
  let nFull = 0, nPartial = 0, nFail = 0;
  const loaiGiaPhiLy = { "thue-tu-1-ty": 0, "ban-tren-100-ty": 0 };
  // Đọc mọi bài trước: mục đích nhóm (bước 2b) tính trên loại chữ bài của cả nhóm.
  const docBai = posts.map((p) => ({ p, pr: parse(p.text) }));
  const mucDich = mucDichNhom(docBai.map(({ p, pr }) => ({ conversation_id: p.conversation_id, group_name: p.group_name, kind: pr.kind })));
  const loaiNhom = loaiHinhNhom(posts.map((p) => ({ conversation_id: p.conversation_id, loai: docLoaiHinh(p.text) })));
  const nguon = [];
  for (const { p, pr } of docBai) {
    if (suyLoaiTin) {
      const r = suyLoai(pr, p.text, mucDich.get(p.conversation_id ?? ""));
      pr.kind = r.kind;
      nguon.push(r.nguon);
    } else nguon.push(pr.kind ? "chu-bai" : "bo");
    if (!pr.kind) { nFail++; continue; }
    chinhLoaiThueTy(pr, p.text);
    const lyDo = lyDoGiaPhiLy(pr);
    if (lyDo) { loaiGiaPhiLy[lyDo]++; continue; }
    const khai = thiTruongNhom.get(p.conversation_id);
    const { ph } = ganPhuongS03(p.text, khai, { entries, moiThiTruong, biDanhCua });
    const kv = ganKhuVuc({ khai, ph, maCoThat });
    if (kv.areaId) { pr.areaId = kv.areaId; pr.phuong = kv.phuong; }
    const loaiChu = docLoaiHinh(p.text);
    pr.loaiHinh = loaiChu ?? loaiNhom.get(p.conversation_id) ?? null;
    pr.nguonLoaiHinh = loaiChu ? "chu" : pr.loaiHinh ? "nhom" : null;
    // tính price_perm2 nếu thiếu
    if (!pr.pricePerm2Vnd && pr.priceVnd && pr.areaM2) {
      pr.pricePerm2Vnd = Math.round(pr.priceVnd / pr.areaM2);
    }
    const hasPrice = pr.priceVnd !== null || pr.pricePerm2Vnd !== null;
    const hasArea = pr.areaM2 !== null;
    const hasPhuong = pr.phuong !== null;
    pr.confidence = mucTinCay({ hasPrice, hasArea, hasPhuong });
    if (pr.confidence === CONFIDENCE.high) nFull++;
    else if (pr.confidence !== CONFIDENCE.low) nPartial++;
    else if (hasPrice) nPartial++;
    parsed.push({ ...pr, post: p });
  }
  console.log(`parse: ${nFull} high, ${nPartial} medium, ${nFail} fail — coverage ${(nFull / posts.length * 100).toFixed(1)}%`);
  console.log(`giá phi lý (không thành offer): ${JSON.stringify(loaiGiaPhiLy)}`);
  const nguonLoai = demNguonLoai(nguon);
  console.log(`loại tin theo nguồn: ${JSON.stringify(nguonLoai)}`);

  // ---- Bước 4: gom repost theo khoá nội dung (repostKey); offer_id cấp ở bước 5 ----
  const dedup = new Map();
  for (const pr of parsed) {
    if (pr.confidence === "low") continue;
    const key = createHash("sha256").update(repostKey(pr, pr.post)).digest("hex").slice(0, 16);
    const offerId = `offer_${key}`;
    let o = dedup.get(offerId);
    if (!o) {
      o = {
        offerId, kind: pr.kind, areaId: pr.areaId ?? null,
        priceVnd: pr.priceVnd, areaM2: pr.areaM2, pricePerm2: pr.pricePerm2Vnd,
        bedrooms: pr.bedrooms, phuongRaw: pr.phuong, confidence: pr.confidence,
        firstSeen: pr.post.posted_at, lastSeen: pr.post.posted_at, nReposts: 1,
        postIds: [pr.post.post_id], posts: [{ post_id: pr.post.post_id, posted_at: pr.post.posted_at, sender_id: pr.post.sender_id, block: pr.block, unit: pr.unit, loaiHinh: pr.loaiHinh, nguonLoaiHinh: pr.nguonLoaiHinh, floor: pr.floor, floorBand: pr.floorBand, trichTang: pr.trichTang }],
        phone: null, baiSdt: [], sellerName: null, sellerNameAt: null,
      };
      dedup.set(offerId, o);
    } else {
      o.nReposts++;
      gopKhuVuc(o, pr.areaId ?? null);
      o.postIds.push(pr.post.post_id);
      o.posts.push({ post_id: pr.post.post_id, posted_at: pr.post.posted_at, sender_id: pr.post.sender_id, block: pr.block, unit: pr.unit, loaiHinh: pr.loaiHinh, nguonLoaiHinh: pr.nguonLoaiHinh, floor: pr.floor, floorBand: pr.floorBand, trichTang: pr.trichTang });
      if (new Date(pr.post.posted_at) < new Date(o.firstSeen)) o.firstSeen = pr.post.posted_at;
      if (new Date(pr.post.posted_at) > new Date(o.lastSeen)) o.lastSeen = pr.post.posted_at;
    }
    o.baiSdt.push({ post_id: pr.post.post_id, posted_at: pr.post.posted_at, phones: pr.phones });
    // seller_name (N1): tên hiển thị của bài mới nhất có tên — người bán trên tin rao là tầng C (ADR-0007 sửa đổi 23/10).
    const ten = (pr.post.sender_name ?? "").trim();
    if (ten && (o.sellerNameAt === null || new Date(pr.post.posted_at) >= new Date(o.sellerNameAt))) {
      o.sellerName = ten;
      o.sellerNameAt = pr.post.posted_at;
    }
  }
  console.log(`dedup: ${dedup.size} unique offers (từ ${parsed.filter(p => p.confidence !== "low").length} tin có giá)`);
  // SĐT của tin chọn trên mọi bài (SD2), không lấy số đầu của bài đầu.
  for (const o of dedup.values()) o.phone = chonSdtTin(o.baiSdt);
  console.log(`tin nhiều SĐT: ${demTinNhieuSdt([...dedup.values()])}`);

  // ---- Bước 5: ghi canonical ----
  // Upsert + đối soát offer cũ (writeOffers, migration 039) thay cho DELETE toàn nguồn:
  // đề xuất enrich + thẻ duyệt sống qua lần nạp lại (_acceptance/enrich-hau-ky).
  const sellerAgg = new Map(); // phone_hash → {n, first, last}
  const rows = [];
  // Khoá dính (PL14, migration 044): nhóm theo nội dung chỉ để gom repost; offer_id lấy theo post — nhóm thừa kế khoá
  // của tin có chung nhiều post nhất, nhóm mới băm 'S03|<post neo>'. Đổi giá/DT/PN/parser không đổi offer_id.
  const nhom = [...dedup.values()];
  const khoa = await assignStickyIds(client, "S03", nhom.map((o) => ({ posts: o.posts })));
  nhom.forEach((o, i) => { o.offerId = khoa[i].offer_id; o.osk = khoa[i].originating_system_key; });
  for (const o of nhom) {
    const phoneHash = o.phone
      ? createHash("sha256").update(o.phone).digest("hex").slice(0, 32)
      : null;
    rows.push({
      offer_id: o.offerId, originating_system_key: o.osk, area_id: o.areaId, kind: o.kind, price_vnd: o.priceVnd,
      area_m2: o.areaM2, price_perm2: o.pricePerm2, phuong_raw: o.phuongRaw,
      confidence: o.confidence, first_seen: o.firstSeen, last_seen: o.lastSeen,
      n_reposts: o.nReposts, post_ids: o.postIds, price_tier: "P1", seller_phone: o.phone,
      seller_phone_hash: phoneHash, seller_ref: chonNguoiGuiTin(o.posts), seller_name: o.sellerName,
    });
    if (phoneHash) {
      const s = sellerAgg.get(phoneHash) ?? { n: 0, first: o.firstSeen, last: o.lastSeen };
      s.n++;
      if (new Date(o.firstSeen) < new Date(s.first)) s.first = o.firstSeen;
      if (new Date(o.lastSeen) > new Date(s.last)) s.last = o.lastSeen;
      sellerAgg.set(phoneHash, s);
    }
  }
  await auditRejected(client, "S03", rejected);
  // Bài đã có phát biểu luật của bộ khác giữ nguyên: writeOffers thay theo (chủ thể, trường, phương pháp) nên sẽ rút nhầm dòng đó.
  const baiDoc = nhom.flatMap((o) => o.posts);
  const { rows: boKhac } = await client.query(
    `SELECT DISTINCT subject_key FROM field_assertions
      WHERE retracted_at IS NULL AND field = $1 AND method = $2 AND method_version IS DISTINCT FROM $3`,
    [ENRICH_FIELD.property_type, ASSERTION_METHOD.e1_rule, LOAI_HINH_VERSION],
  );
  const chuTheKhac = new Set(boKhac.map((r) => r.subject_key));
  const dongLoai = phatBieuLoaiHinh("S03", baiDoc, LOAI_HINH_VERSION).filter((d) => !chuTheKhac.has(d.subject_key));
  const rutLoai = await rutLoaiHinhCu(client, dongLoai.map((d) => d.subject_key), LOAI_HINH_VERSION);
  console.log(`loại hình: ${dongLoai.length} phát biểu, rút ${rutLoai}`);
  // DV4 (tang-tren-tin-s03): tầng qua phát biểu khi DB đã áp 095; chưa áp thì CHECK chặn nên bỏ phần tầng, lượt vẫn chạy.
  const coTang = await co095(client);
  if (!coTang) console.warn("transform-zalo: DB chưa áp migration 095, bỏ phát biểu tầng ở lượt này");
  const dongTang = coTang ? phatBieuTang("S03", baiDoc, TANG_VERSION) : [];
  // PL15: phòng ngủ đi qua phát biểu (mỗi post một), năm cột do bộ phân xử dựng — không ghi thẳng.
  const { reconcile } = await writeOffers(client, "S03", rows, {
    assertions: [...phatBieuPhongNgu("S03", nhom, "transform-zalo@045"), ...phatBieuToaTruc("S03", baiDoc, "transform-zalo@sv1"), ...dongLoai, ...dongTang],
  });
  if (coTang) {
    const rutTang = await rutTangCu(client, baiDoc.map((p) => subjectKey("S03", p.post_id)), dongTang.map((d) => `${d.subject_key}|${d.field}`), TANG_VERSION);
    if (rutTang) await client.query("SELECT resolve_offer_fields($1::text[])", [rows.map((r) => r.offer_id)]);
    console.log(`tầng: ${dongTang.length} phát biểu, rút ${rutTang}`);
  }
  // enrich-nguoi-s03: writeOffers vừa upsert seller_phone về số riêng của tin, nên tin đang mang số qua người đăng được gán lại
  // ngay trong giao dịch này — không có khoảng tin rơi về «Chưa có số» cho cloud-sync chép. Số mới do lượt sau dungNguoi.
  // `ganSo` thay bộ gán CHỈ cho đối chứng của thước.
  await ganSo(client, { rieng: new Map(rows.map((r) => [r.offer_id, r.seller_phone])) });
  console.log(`đối soát: ${JSON.stringify({ ...reconcile, pairs: undefined })}`);
  console.log(`offers ghi: ${dedup.size} (SĐT: ${sellerAgg.size} người bán)`);
  return { offers: rows.length, rejected, reconcile, loaiGiaPhiLy, nguonLoai, bai_doi_khoa: baiDoiKhoa };
}

/** Thị trường có phường và danh sách phường của chúng, để đối chiếu tên phường trong chữ bài. */
export async function docDanhSachPhuong(client) {
  const moiThiTruong = await docThiTruongCoPhuong(client);
  const areas = await docPhuongHopLe(client, moiThiTruong);
  return { moiThiTruong, phuong: areas.map((a) => ({ id: a.id, name: a.name, market: a.parent_id })) };
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    try {
      await runTransformZalo(client);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
