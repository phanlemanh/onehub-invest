// yeu-cau.mjs — bang-yeu-cau: bài S03 có phát biểu ý định = Yêu cầu (lớp cao nhất thắng) thành một dòng ở bảng
// inquiry_records (migration 058) kèm tiêu chí — dịch vụ, loại hình, PN, diện tích, khoảng ngân sách, khu vực. Phần thuần
// (đọc tiêu chí, khoá gom) ở trên; phần DB (đọc phát biểu thắng, upsert, nghỉ) ở dưới.
// Spec: docs/superpowers/specs/2026-10-30-bang-yeu-cau-design.md · Hỏi-1 trần · Hỏi-2 gom · Hỏi-3 bảng ánh xạ (Mạnh 30/10).
//
// Vòng nhập: transform-zalo nhập ghiYeuCau, tệp này nhập hàm thuần của transform-zalo — chỉ an toàn khi không tệp nào gọi
// hàm của tệp kia ở cấp đỉnh. Đừng thêm lời gọi cấp đỉnh.

import { createHash } from "node:crypto";
import { extractPhones, gatSo, lyDoGiaPhiLy, normText, parsePost, parseVnNumber, soTy } from "../transform-zalo.mjs";
import { subjectKey } from "./assert.mjs";
import { ASSERTION_FIELD, KIND, LISTING_INTENT, PROPERTY_TYPE } from "./vocab.generated.mjs";

// ---- Ngân sách (Hỏi-1: số tiền không kèm chữ chỉ chiều là trần) ----
// YC1 sua-doc-ngan-sach-yeu-cau: phần lẻ sau đơn vị, khoảng thiếu đơn vị đầu dưới, không bao giờ min > max, số trơn sau
// «tc / tài chính / ngân sách» theo dịch vụ, trần thuê 100 triệu/tháng. Spec: docs/superpowers/specs/2026-11-11-sua-doc-ngan-sach-yeu-cau-design.md
const NUM = String.raw`(\d+(?:[.,]\d+)*)`;
// Chữ đứng sau phần lẻ thì số đó không phải phần lẻ («2 tỷ 2pn», «2 tỷ 70m2», «2 tỷ 5 tầng», «2 tỷ 2 căn»).
const CHAN_LE = String.raw`(?![\d.,])(?!\s*(?:pn|phòng|m(?!\p{L})|tầng|căn))`;
// Phần lẻ viết cách («8tr 5») không đứng trước dấu nối hay gạch chéo — đó là ngày hay khoảng khác («tc 8tr 7-8/11»).
// Riêng đầu dưới của mẫu «khoang» không chặn: dấu nối đã do NOI đòi, đầu trên do TIEN("b") đòi có đơn vị («2 tỷ 5 - 3 tỷ»,
// yc1-khoang-le-va-doi-chung-do).
const CACH_LE = String.raw`(?!\s*[-–—~/])`;
/** «số + đơn vị (+ phần lẻ) (+ rưỡi)» với tiền tố tên nhóm `p` (khoảng có hai số nên cần hai bộ tên). */
const TIEN = (p, batBuoc = true) =>
  String.raw`(?<${p}so>\d+(?:[.,]\d+)*)\s*(?<${p}dv>tỷ|tỉ|ty|triệu|tr|củ)${batBuoc ? "" : "?"}` +
  String.raw`(?:(?<${p}le>\d{1,3})${CHAN_LE}|\s(?<${p}lec>\d{1,3})${CHAN_LE}${CACH_LE})?(?<${p}ruoi>\s*rưỡi)?`;
// Sau đơn vị: không dính chữ cái («trung tâm»), không phải đơn giá («45tr/m2»).
const SAU = String.raw`(?!\p{L})(?!\s*\/\s*m)`;
const NOI = String.raw`\s*(?:-|–|—|~|đến|tới)\s*`;
const MAU_NS = [
  // Thứ tự = ưu tiên khi hai mẫu cùng bắt đầu ở một chỗ.
  ["khoang", new RegExp(String.raw`(?:từ\s*)?(?<![\d.,])(?<aso>\d+(?:[.,]\d+)*)\s*(?:(?<adv>tỷ|tỉ|ty|triệu|tr|củ)(?:(?<ale>\d{1,3})${CHAN_LE}|\s(?<alec>\d{1,3})${CHAN_LE})?(?<aruoi>\s*rưỡi)?)?${NOI}${TIEN("b")}${SAU}`, "giu")],
  ["tran", new RegExp(String.raw`(?:tầm\s+dưới|dưới|tối\s*đa|không\s+quá|max)\s*:?\s*${TIEN("a")}${SAU}`, "giu")],
  ["san", new RegExp(String.raw`(?:trên|từ|tối\s*thiểu|min)\s*:?\s*${TIEN("a")}${SAU}`, "giu")],
  // Số trơn sau «tc / tài chính / ngân sách»: đơn vị theo dịch vụ (thuê → triệu, mua → tỷ), không phải đầu một khoảng.
  ["tron", new RegExp(String.raw`(?<!\p{L})(?:tc|tài\s*chính|ngân\s*sách)\s*:?\s*(?<aso>\d+(?:[.,]\d+)?)(?![\d.,])(?!\s*(?:tỷ|tỉ|ty|triệu|tr|củ|k|nghìn|ngàn|pn|phòng|m2|m²|\d))(?!${NOI})`, "giu")],
  ["mot", new RegExp(String.raw`(?<![\d.,])${TIEN("a")}${SAU}`, "giu")],
];
const TRAN_THUE = 100e6;

const laTy = (dv) => /^t[ỷỉy]/i.test(dv);
/** Số tiền VND của «số + đơn vị»; đơn vị tỷ đọc theo luật giá VN của transform-zalo (soTy). */
function vnd(so, dv) {
  return laTy(dv) ? Math.round(soTy(so) * 1e9) : Math.round(parseVnNumber(so) * 1e6);
}

/** Số tiền của nhóm tên `p` trong khớp `g`, đơn vị `dv` (mặc định đơn vị của chính nó); phần lẻ chỉ cộng khi số nguyên. */
function tien(g, p, dv = g[`${p}dv`]) {
  let v = vnd(g[`${p}so`], dv);
  const donVi = laTy(dv) ? 1e9 : 1e6;
  const le = g[`${p}le`] ?? g[`${p}lec`];
  if (le && /^\d+$/.test(g[`${p}so`])) v += Math.round((Number(le) / 10 ** le.length) * donVi);
  if (g[`${p}ruoi`]) v += donVi / 2;
  return v;
}

/** Sàn kèm trần viết rời («từ 2 tỷ, tối đa 3 tỷ»): số của mẫu `loai` đứng sau biểu thức đầu `m`, hoặc null. */
function sauDo(so, loai, m) {
  const re = MAU_NS.find(([l]) => l === loai)[1];
  re.lastIndex = m.index + m[0].length;
  const k = re.exec(so);
  return k ? tien(k.groups, "a") : null;
}

/**
 * Khoảng ngân sách của bài: biểu thức tiền ĐẦU TIÊN trong chữ đã gạt URL/SĐT. Khoảng «a–b» / «từ a đến b» → min/max: đầu
 * dưới thiếu đơn vị lấy đơn vị đầu trên, trừ khi đầu trên là tỷ và đầu dưới từ 100 trở lên thì đầu dưới là triệu
 * («800 - 1,2 tỷ»); khoảng ngược thì đảo. «tầm dưới / dưới / tối đa / không quá X» → max; «trên / từ / tối thiểu X» → min;
 * sàn kèm trần viết rời phía sau thì lấy cả hai, ngược nhau thì giữ biểu thức đầu. Số trơn sau «tc / tài chính / ngân
 * sách» → max theo dịch vụ (thuê triệu, mua tỷ, chưa rõ thì trống). Mọi dạng còn lại («tầm X», «X quay đầu», «X» trơn) →
 * max. Phần lẻ sau đơn vị được cộng («2ty6», «6tr5», «2 tỷ 500», «2 tỷ rưỡi»). Đầu nào phi lý theo luật giá của tin rao
 * (lyDoGiaPhiLy) hay thuê từ 100 triệu/tháng thì trống; không bao giờ trả min > max.
 * @param {string} text
 * @param {string|null} kind dịch vụ đã đọc (sale · rent_lt · null) — chặn giá phi lý và chọn đơn vị số trơn
 * @returns {{min: number|null, max: number|null}}
 */
export function docNganSach(text, kind) {
  const so = gatSo(text).normalize("NFC").toLowerCase();
  let best = null;
  MAU_NS.forEach(([loai, re], uuTien) => {
    // Số trơn chỉ đọc được khi biết dịch vụ; chưa biết thì nhường biểu thức kế bên («tài chính 10 11tr»).
    if (loai === "tron" && kind !== KIND.rent_lt && kind !== KIND.sale) return;
    re.lastIndex = 0;
    const m = re.exec(so);
    if (m && (!best || m.index < best.m.index || (m.index === best.m.index && uuTien < best.uuTien))) best = { loai, m, uuTien };
  });
  if (!best) return { min: null, max: null };
  const { loai, m } = best;
  const g = m.groups;
  let min = null, max = null;
  if (loai === "khoang") {
    max = tien(g, "b");
    if (g.adv) min = tien(g, "a");
    else if (laTy(g.bdv) && parseVnNumber(g.aso) >= 100) min = tien(g, "a", "tr");
    else min = tien(g, "a", g.bdv);
    if (min > max) [min, max] = [max, min];
  } else if (loai === "san") {
    min = tien(g, "a");
    max = sauDo(so, "tran", m);
    if (max != null && max < min) max = null;
  } else if (loai === "tran") {
    max = tien(g, "a");
    min = sauDo(so, "san", m);
    if (min != null && min > max) min = null;
  } else if (loai === "tron") {
    if (kind === KIND.rent_lt) max = Math.round(parseVnNumber(g.aso) * 1e6);
    else if (kind === KIND.sale) max = Math.round(soTy(g.aso) * 1e9);
  } else max = tien(g, "a");
  const hopLy = (v) =>
    v != null && Number.isFinite(v) && !lyDoGiaPhiLy({ kind, priceVnd: v }) && !(kind === KIND.rent_lt && v >= TRAN_THUE) ? v : null;
  min = hopLy(min);
  max = hopLy(max);
  if (min != null && max != null && min > max) return { min: null, max: null };
  return { min, max };
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

// ---- Phần DB ----

// Ba trường phát biểu Yêu cầu đọc: ý định (ai là Yêu cầu), dịch vụ và loại hình (tiêu chí — đi trước chữ).
const TRUONG = [ASSERTION_FIELD.listing_intent, ASSERTION_FIELD.kind, ASSERTION_FIELD.property_type];

/**
 * Phát biểu sống THẮNG của từng bài theo trường: lớp cao nhất (fact › observed › inferred), trong lớp theo
 * assertion_method_rank của 045, rồi observed_at mới nhất, rồi id.
 * @param {import("pg").Client} client
 * @param {string} source
 * @param {string[]} postIds
 * @returns {Promise<Map<string, Record<string, {assertion_id: number, value: string, method: string, tier: string, p: number|null}>>>}
 */
export async function docPhatBieuThang(client, source, postIds) {
  const { rows } = await client.query(
    `SELECT DISTINCT ON (subject_key, field) id, subject_key, field, value, method, evidence_tier, evidence->>'p' AS p
       FROM field_assertions
      WHERE retracted_at IS NULL AND subject_key = ANY($1::text[]) AND field = ANY($2::text[])
      ORDER BY subject_key, field, CASE evidence_tier WHEN 'fact' THEN 0 WHEN 'observed' THEN 1 ELSE 2 END,
               assertion_method_rank(method), observed_at DESC NULLS LAST, id DESC`,
    [postIds.map((id) => subjectKey(source, id)), TRUONG]);
  const out = new Map();
  for (const r of rows) {
    const id = r.subject_key.slice(source.length + 1);
    if (!out.has(id)) out.set(id, {});
    out.get(id)[r.field] = {
      assertion_id: Number(r.id), value: r.value, method: r.method, tier: r.evidence_tier, p: r.p == null ? null : Number(r.p),
    };
  }
  return out;
}

// Cột ghi của inquiry_records (trừ retired_*, created_at, updated_at) — đúng thứ tự hàng gomYeuCau.
const COT = [
  ["inquiry_id", "text"], ["source", "text"], ["originating_system_key", "text"], ["post_ids", "text[]"], ["kind", "text"],
  ["property_type", "text"], ["bedrooms", "int"], ["area_m2", "numeric"], ["budget_min_vnd", "bigint"],
  ["budget_max_vnd", "bigint"], ["area_id", "text"], ["market_id", "text"], ["first_seen", "timestamptz"],
  ["last_seen", "timestamptz"], ["intent_evidence", "jsonb"],
];
const TEN = COT.map(([c]) => c);
const SQL_UPSERT = `
  INSERT INTO inquiry_records (${TEN.join(", ")})
  SELECT ${TEN.join(", ")} FROM jsonb_to_recordset($1::jsonb) AS x(${COT.map(([c, t]) => `${c} ${t}`).join(", ")})
  ON CONFLICT (inquiry_id) DO UPDATE SET
    ${TEN.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(", ")}, retired_at = NULL, retired_reason = NULL, updated_at = now()
  WHERE inquiry_records.retired_at IS NOT NULL
     OR (${TEN.slice(1).map((c) => `inquiry_records.${c}`).join(", ")}) IS DISTINCT FROM (${TEN.slice(1).map((c) => `EXCLUDED.${c}`).join(", ")})
  RETURNING inquiry_id`;

/**
 * Bước Yêu cầu của transform (sau bước Kev): mọi bài trong `posts` (đã gạt bài thử) có phát biểu ý định thắng = inquiry
 * thành Yêu cầu, gom theo Hỏi-2; upsert ghi đủ cột (post_ids là tập đầy đủ của lượt), gỡ nghỉ; Yêu cầu sống của nguồn không
 * còn bài nào thì nghỉ 'het-phat-bieu'. Không DELETE. Người gọi giữ transaction. Thiếu bảng (chưa áp 058) → bỏ bước.
 * @param {import("pg").Client} client
 * @param {Array<{post_id: string, text: string, posted_at: any, sender_id?: string|null}>} posts
 * @param {{phuongCua: Function, thiTruongKhai: Function}} ctx taoNguCanhPhuong của transform-zalo
 * @returns {Promise<null|{xet: number, yeuCau: number, them: number, capNhat: number, songLai: number, nghi: number}>}
 */
export async function ghiYeuCau(client, posts, ctx, source = "S03") {
  const { rows: [co] } = await client.query("SELECT to_regclass('inquiry_records') IS NOT NULL AS co");
  if (!co.co) {
    console.log("yêu cầu: chưa áp 058 — bỏ bước Yêu cầu");
    return null;
  }
  const thang = await docPhatBieuThang(client, source, posts.map((p) => p.post_id));
  const items = [];
  for (const post of posts) {
    const t = thang.get(post.post_id);
    if (t?.listing_intent?.value !== LISTING_INTENT.inquiry) continue;
    items.push({ post, thang: t, tieuChi: tieuChiYeuCau(post, t, ctx) });
  }
  const rows = gomYeuCau(source, items);
  const { rows: truoc } = await client.query(
    "SELECT inquiry_id, retired_at IS NOT NULL AS nghi FROM inquiry_records WHERE source = $1", [source]);
  const daCo = new Map(truoc.map((r) => [r.inquiry_id, r.nghi]));
  const { rows: ghi } = await client.query(SQL_UPSERT, [JSON.stringify(rows)]);
  let them = 0, capNhat = 0, songLai = 0;
  for (const { inquiry_id } of ghi) {
    if (!daCo.has(inquiry_id)) them++;
    else if (daCo.get(inquiry_id)) songLai++;
    else capNhat++;
  }
  const { rowCount: nghi } = await client.query(
    `UPDATE inquiry_records SET retired_at = now(), retired_reason = 'het-phat-bieu', updated_at = now()
      WHERE source = $1 AND retired_at IS NULL AND inquiry_id <> ALL($2::text[])`,
    [source, rows.map((r) => r.inquiry_id)]);
  console.log(`yêu cầu: ${items.length} bài inquiry · ${rows.length} Yêu cầu (thêm ${them}, cập nhật ${capNhat}, sống lại ${songLai}, nghỉ ${nghi})`);
  return { xet: items.length, yeuCau: rows.length, them, capNhat, songLai, nghi };
}
