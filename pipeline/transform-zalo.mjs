// transform-zalo.mjs — parse tin rao VN + dedup + canonical offers (G1).
// Pipeline 5 bước: clean → parse regex → confidence → dedup → offers.
// Parser đo coverage: % tin có đủ (giá + diện tích + phường) cho confidence=high.
// Export parsePost/matchPhuong cho bench-extraction dùng chung (C2) — nguồn
// chân lý của parser là một, bench và transform không được fork logic.
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { auditRejected, loadStgPosts } from "./lib/test-posts.mjs";
import { docPhuongHopLe } from "./lib/osm.mjs";
import { writeOffers } from "./lib/write-offers.mjs";
import { phatBieuPhongNgu } from "./lib/assert.mjs";
import { assignStickyIds } from "./lib/offer-key.mjs";
import { CONFIDENCE } from "./lib/vocab.generated.mjs";

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
// "2ty450", "3ty2", "2 tỷ 450" — phần lẻ không được là số phòng, diện tích hay triệu.
const GIA_TY_LE = /(?<![\d.,])(\d{1,3})\s*t(?:ỷ|y)\s*(\d{1,3})(?![\d.,])(?!\s*(?:pn|phòng|wc|tr|triệu|m\b|m2|m²|%|n\b|ng))/i;
// "5tr5", "8tr5" (không dấu cách giữa tr và phần lẻ).
const GIA_TR_LE = /(?<![\d.,])(\d{1,3})tr(\d{1,2})(?![\d.,])(?!\s*(?:pn|wc|m\b|m2|m²))/i;
// "7.000.000" — đồng, đủ hai nhóm nghìn, không theo sau là đơn vị.
const GIA_DONG = /(?<![\d.,])(\d{1,3}(?:\.\d{3}){2,})(?![\d.,])(?!\s*(?:tỷ|ty|tr|triệu|m\b|m2|m²|đ\/m))/i;
// "Giá: 4,000 (thu về)" — số nhóm nghìn đứng sau nhãn giá, không đơn vị: triệu.
const GIA_NHAN_TRIEU = /giá(?:\s*bán)?\s*:?\s*(\d{1,3}[.,]\d{3})(?![\d.,])(?!\s*(?:tỷ|ty|tr|triệu|m\b|m2|m²|đ|vnd))/i;

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
  return (text ?? "").replace(URL_RE, " ").replace(PHONE_RE, " ");
}

export function extractPhones(text) {
  const raw = text.match(PHONE_RE) ?? [];
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    let digits = r.replace(/\D/g, "");
    if (digits.startsWith("84")) digits = "0" + digits.slice(2);
    if (digits.length !== 10 && digits.length !== 11) continue;
    if (!/^[35789]/.test(digits.slice(1))) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push(digits);
    if (out.length >= 3) break; // tin rao hiếm khi có >3 SĐT thật
  }
  return out;
}

// ---- Bước 2: parse ----
export function parsePost(text) {
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

  // "2ty450", "3ty2", "2 tỷ 450": phần sau chữ tỷ là phần lẻ (2,45 tỷ) — xét trước dạng tỷ thường, vì "3ty2" khớp cả hai.
  const tyLe = so.match(GIA_TY_LE);
  // (?!..) chặn 't' của chữ thường tiếng Việt ("62m2, tổng …") — \b của JS
  // chỉ theo ASCII nên 'tổ' vẫn tạo boundary giả (bench C2 bắt được).
  const ty = so.match(/(\d+(?:[.,]\d+)*)\s*t(?:ỷ|y|\b)(?![a-zA-Zà-ỹÀ-Ỹ])/i);
  if (tyLe) out.priceVnd = Math.round(parseFloat(`${tyLe[1]}.${tyLe[2]}`) * 1e9);
  else if (ty) out.priceVnd = Math.round(soTy(ty[1]) * 1e9);

  if (!out.priceVnd && !out.pricePerm2Vnd) {
    // "5tr5", "8tr5": phần sau chữ tr là phần lẻ (5,5 triệu).
    const trLe = so.match(GIA_TR_LE);
    const trieu = so.match(/(\d[\d.,]*)\s*(?:tr|triệu)(?!\/m)(?:\s*\/\s*th(?:áng)?)?/i);
    if (trLe) out.priceVnd = Math.round(parseFloat(`${trLe[1]}.${trLe[2]}`) * 1e6);
    else if (trieu) out.priceVnd = Math.round(parseVnNumber(trieu[1]) * 1e6);
  }

  if (!out.priceVnd && !out.pricePerm2Vnd) {
    // Không đơn vị: "7.000.000" (đủ hai nhóm nghìn) là đồng; "Giá: 4,000" ở tin bán là triệu (4 tỷ), tin thuê để trống.
    const dong = so.match(GIA_DONG);
    const giaTrieu = out.kind === "sale" ? so.match(GIA_NHAN_TRIEU) : null;
    if (dong) out.priceVnd = parseInt(dong[1].replace(/\./g, ""), 10);
    else if (giaTrieu) out.priceVnd = Math.round(parseVnNumber(giaTrieu[1]) * 1e6);
  }

  // diện tích: "65m2", "65m²", "DT 45m"
  const area = so.match(/(\d+(?:\.\d+)?)\s*m[²2]/i);
  if (area) out.areaM2 = parseFloat(area[1]);
  else out.areaM2 = dienTichMetTran(so);

  // bedrooms: "2PN", "2 phòng ngủ", "2BR"
  const bd = so.match(/(\d+)\s*(?:PN|phòng ngủ|BR)/i);
  if (bd) out.bedrooms = parseInt(bd[1]);

  // SĐT người đăng (nằm sẵn trong text tin rao — nguồn contact chính của P1)
  out.phones = extractPhones(text);
  out.phone = out.phones[0] ?? null;

  // sanitize: regex "tổng thể" có thể vớ chuỗi lạ → NaN; NaN vô hại hoá
  // thành null để transform bỏ qua thay vì gãy INSERT bigint.
  for (const k of ["priceVnd", "pricePerm2Vnd", "areaM2", "bedrooms"]) {
    if (!Number.isFinite(out[k])) out[k] = null;
  }

  // phường: match tên phường từ text (danh sách sẽ load từ DB)
  out._phuongCandidates = [];
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

/** Chữ bài đã chuẩn hoá để so trùng: NFC, chữ thường, mọi dãy không phải chữ/số thành một dấu cách. */
export const normText = (text) => (text ?? "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

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
  if (pr.phuong && pr.areaM2 != null) return noiDung;
  const nguoi = post.sender_id ? `sender:${post.sender_id}` : pr.phone ? `phone:${pr.phone}` : `text:${normText(post.text)}`;
  return `${noiDung}|${nguoi}`;
}

/**
 * Thân transform S03 — người gọi giữ transaction (main bọc BEGIN…COMMIT; test và thước dư
 * lượng bọc BEGIN…ROLLBACK). Post thử bị gạt ở đầu đọc (lib/test-posts.mjs, PL2).
 * @param {import("pg").Client} client
 */
// `parse` chỉ để thước giả lập đổi rule parser (PL14 NL-AC-4); đường chạy thật luôn dùng parsePost.
export async function runTransformZalo(client, { parse = parsePost } = {}) {
  // Load phường list (tên + area_id)
  const areas = await docPhuongHopLe(client, ["vn-hanoi"]);
  const phuongSlugs = areas.map((a) => [a.id.replace("vn-hanoi-", ""), a.name]);
  const areaBySlug = new Map(areas.map((a) => [a.id.replace("vn-hanoi-", ""), a.id]));

  // Load staging posts (mới nhất per post_id). Chỉ nguồn Zalo — posts
  // Facebook (agent_id apify-facebook) do transform-fb.mjs xử lý (S05).
  // Post thử (zalo-mock, e2e, nhóm TEST) bị gạt tại đây — L19.
  const { posts, rejected } = await loadStgPosts(client, "zalo");
  console.log(`posts: ${posts.length} (gạt ${rejected.total} post thử ${JSON.stringify(rejected.by_marker)})`);

  // ---- Bước 2+3: parse + confidence ----
  const parsed = [];
  let nFull = 0, nPartial = 0, nFail = 0;
  for (const p of posts) {
    const pr = parse(p.text);
    if (!pr.kind) { nFail++; continue; }
    const ph = matchPhuong(p.text, phuongSlugs);
    if (ph) pr.phuong = ph.slug;
    // tính price_perm2 nếu thiếu
    if (!pr.pricePerm2Vnd && pr.priceVnd && pr.areaM2) {
      pr.pricePerm2Vnd = Math.round(pr.priceVnd / pr.areaM2);
    }
    const hasPrice = pr.priceVnd !== null || pr.pricePerm2Vnd !== null;
    const hasArea = pr.areaM2 !== null;
    const hasPhuong = pr.phuong !== null;
    pr.confidence = hasPrice && hasArea && hasPhuong ? CONFIDENCE.high : hasPrice ? CONFIDENCE.medium : CONFIDENCE.low;
    if (pr.confidence === CONFIDENCE.high) nFull++;
    else if (pr.confidence !== CONFIDENCE.low) nPartial++;
    else if (hasPrice) nPartial++;
    parsed.push({ ...pr, post: p });
  }
  console.log(`parse: ${nFull} high, ${nPartial} medium, ${nFail} fail — coverage ${(nFull / posts.length * 100).toFixed(1)}%`);

  // ---- Bước 4: gom repost theo khoá nội dung (repostKey); offer_id cấp ở bước 5 ----
  const dedup = new Map();
  for (const pr of parsed) {
    if (pr.confidence === "low") continue;
    const key = createHash("sha256").update(repostKey(pr, pr.post)).digest("hex").slice(0, 16);
    const offerId = `offer_${key}`;
    if (!dedup.has(offerId)) {
      dedup.set(offerId, {
        offerId, kind: pr.kind, areaId: pr.phuong ? areaBySlug.get(pr.phuong) : null,
        priceVnd: pr.priceVnd, areaM2: pr.areaM2, pricePerm2: pr.pricePerm2Vnd,
        bedrooms: pr.bedrooms, phuongRaw: pr.phuong, confidence: pr.confidence,
        firstSeen: pr.post.posted_at, lastSeen: pr.post.posted_at, nReposts: 1,
        postIds: [pr.post.post_id], posts: [{ post_id: pr.post.post_id, posted_at: pr.post.posted_at }],
        phone: pr.phone, authorHash: pr.post.author_hash,
      });
    } else {
      const o = dedup.get(offerId);
      o.nReposts++;
      o.postIds.push(pr.post.post_id);
      o.posts.push({ post_id: pr.post.post_id, posted_at: pr.post.posted_at });
      if (new Date(pr.post.posted_at) < new Date(o.firstSeen)) o.firstSeen = pr.post.posted_at;
      if (new Date(pr.post.posted_at) > new Date(o.lastSeen)) o.lastSeen = pr.post.posted_at;
    }
  }
  console.log(`dedup: ${dedup.size} unique offers (từ ${parsed.filter(p => p.confidence !== "low").length} tin có giá)`);

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
      seller_phone_hash: phoneHash, seller_ref: o.authorHash,
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
  // PL15: phòng ngủ đi qua phát biểu (mỗi post một), năm cột do bộ phân xử dựng — không ghi thẳng.
  const { reconcile } = await writeOffers(client, "S03", rows, { assertions: phatBieuPhongNgu("S03", nhom, "transform-zalo@045") });
  console.log(`đối soát: ${JSON.stringify({ ...reconcile, pairs: undefined })}`);
  console.log(`offers ghi: ${dedup.size} (SĐT: ${sellerAgg.size} người bán)`);
  return { offers: rows.length, rejected, reconcile };
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
