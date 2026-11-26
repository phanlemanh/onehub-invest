// yeu-cau.mjs — lớp bài Yêu cầu (YC0 bang-yeu-cau-noi-lai, migration 136): bài S03 mà luật hay nhãn model nói là Yêu cầu (bên
// mua: cần mua, cần thuê). Ý định đi qua phát biểu `listing_intent` (luật = observed, nhãn Haiku = inferred); bộ phân xử
// `resolve_inquiry_fields` của 136 ghi mỗi bài một dòng `inquiry_post_records` khoá '<S0x>:<post_id>' (ADR-0013 câu 3, 4).
// Phần thuần: bộ đọc tiêu chí (ngân sách, loại hình, dịch vụ — YC9 sẽ ghi qua phát biểu), chọn nhãn, sinh phát biểu ý định.
// Phần DB: đọc nhãn Haiku hợp lệ mới nhất, ghi phát biểu, rút dòng lượt không còn, gọi phân xử.
// Spec: docs/superpowers/specs/2026-11-26-bang-yeu-cau-noi-lai-design.md · hồ sơ _acceptance/bang-yeu-cau-noi-lai.
//
// Vòng nhập: transform-zalo nhập ghiYeuCau, tệp này (và nhanh-bai-s03) nhập hàm thuần của transform-zalo — chỉ an toàn khi
// không tệp nào gọi hàm của tệp kia ở cấp đỉnh. Đừng thêm lời gọi cấp đỉnh.

import { gatSo, lyDoGiaPhiLy, parsePost, parseVnNumber, soTy } from "../transform-zalo.mjs";
import { retractRule, subjectKey, writeAssertions } from "./assert.mjs";
import { laChiAnh } from "./gop-anh.mjs";
import { co136 } from "./nap-136.mjs";
import { NHANH, nhanhCuaBai } from "./nhanh-bai-s03.mjs";
import { testMarker } from "./test-posts.mjs";
import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER, KIND, LISTING_INTENT, PROPERTY_TYPE } from "./vocab.generated.mjs";

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

// ---- Ý định từng bài (YC0) ----

/** rule_id của hai bộ phát biểu ý định — bộ ghi chỉ thay, rút dòng mang đúng hai mã này. */
export const RULE_LUAT = "yeu-cau-luat";
export const RULE_NHAN = "yeu-cau-nhan-haiku";
/** Phiên bản bộ đọc luật (method_version của dòng luật). */
export const LUAT_VERSION = "transform-zalo@yc0";
/** Lý do rút dòng mà lượt này không còn sinh (luật không còn nhận, nhãn không còn, bài thành tin rao). */
export const LY_DO_RUT = "yeu-cau-luot-khong-con";

/** Nhãn dùng được: model Haiku, JSON đọc được, có ý định. */
export const nhanHopLe = (n) => /haiku/i.test(n?.model ?? "") && n.json_ok !== false && n.listing_intent != null;

const moc = (t) => (t == null ? -Infinity : new Date(t).getTime());

/**
 * Nhãn Haiku hợp lệ MỚI NHẤT của một bài: bỏ nhãn hỏng TRƯỚC rồi mới lấy mới nhất theo (labeled_at, label_id) — nhãn mới mà
 * hỏng không được đè nhãn cũ hợp lệ.
 * @param {Array<{label_id: number|string, model: string, json_ok: boolean, listing_intent: string|null, labeled_at: any}>} nhan
 */
export function chonNhan(nhan) {
  let best = null;
  for (const n of nhan ?? []) {
    if (!nhanHopLe(n)) continue;
    if (!best || moc(n.labeled_at) > moc(best.labeled_at)
      || (moc(n.labeled_at) === moc(best.labeled_at) && BigInt(n.label_id) > BigInt(best.label_id))) best = n;
  }
  return best;
}

/**
 * Phát biểu ý định của các bài (hàm thuần). Bài xét = có chữ (không phải bài chỉ-ảnh) và parsePost KHÔNG ra loại tin — bài
 * parsePost ra loại đang là tin rao, không thành Yêu cầu dù nhãn nói inquiry (Hỏi-1b, Hỏi-2), nên không nhận dòng nào. Bài thử
 * (bốn dấu của testMarker) không bao giờ có dòng — người gọi đã gạt ở loadStgPosts, ở đây chặn lần nữa. Trong bài xét:
 *   - luật nhận (nhánh `yeu-cau` của nhanhCuaBai — dùng chung với /ops/data-flow) → listing_intent = inquiry, observed, parser;
 *   - nhãn Haiku hợp lệ mới nhất (chonNhan) → listing_intent = <nhãn>, inferred, e2_llm, evidence {label_id, prompt_version, probability}.
 * @param {Array<{post_id: string, text: string|null, posted_at?: any, snapshot_id?: string, agent_id?: string, group_name?: string}>} posts
 * @param {Map<string, Array<object>>} nhanTheoBai post_id → các dòng silver_labels của bài
 * @param {{ source?: string }} [opts]
 * @returns {{ dong: object[], xet: number, loaiTinNhanYeuCau: number }} loaiTinNhanYeuCau: bài parsePost ra loại mà nhãn nói inquiry (đếm để soi)
 */
export function phatBieuYDinh(posts, nhanTheoBai, { source = "S03" } = {}) {
  const dong = [];
  let xet = 0, loaiTinNhanYeuCau = 0;
  const trong = new Set();
  for (const p of posts) {
    if (laChiAnh(p.text) || testMarker(p)) continue;
    const nhan = chonNhan(nhanTheoBai.get(p.post_id));
    if (parsePost(p.text ?? "").kind) {
      if (nhan?.listing_intent === LISTING_INTENT.inquiry) loaiTinNhanYeuCau++;
      continue;
    }
    xet++;
    const k = subjectKey(source, p.post_id);
    const luc = p.posted_at ?? null;
    if (nhanhCuaBai(p, trong) === NHANH.yeuCau) {
      dong.push({
        subject_key: k, field: ASSERTION_FIELD.listing_intent, value: LISTING_INTENT.inquiry, evidence_tier: EVIDENCE_TIER.observed,
        method: ASSERTION_METHOD.parser, method_version: LUAT_VERSION, rule_id: RULE_LUAT, evidence: {}, observed_at: luc,
      });
    }
    if (nhan) {
      dong.push({
        subject_key: k, field: ASSERTION_FIELD.listing_intent, value: nhan.listing_intent, evidence_tier: EVIDENCE_TIER.inferred,
        method: ASSERTION_METHOD.e2_llm, method_version: nhan.model, rule_id: RULE_NHAN,
        evidence: { label_id: Number(nhan.label_id), prompt_version: nhan.prompt_version, probability: nhan.probability ?? null },
        observed_at: luc,
      });
    }
  }
  return { dong, xet, loaiTinNhanYeuCau };
}

// ---- Phần DB ----

/** Nhãn Haiku hợp lệ mới nhất mỗi bài: bỏ nhãn hỏng trong WHERE rồi mới DISTINCT ON mới nhất ($1 nguồn, $2 post_id). */
export const SQL_NHAN = `
  SELECT DISTINCT ON (post_id) label_id, post_id, model, prompt_version, listing_intent, probability, json_ok, labeled_at
    FROM silver_labels
   WHERE source_code = $1 AND post_id = ANY ($2::text[])
     AND model ILIKE '%haiku%' AND json_ok IS NOT FALSE AND listing_intent IS NOT NULL
   ORDER BY post_id, labeled_at DESC, label_id DESC`;

/**
 * Nhãn của các bài, mỗi bài tối đa một dòng (SQL_NHAN).
 * @returns {Promise<Map<string, object[]>>}
 */
export async function docNhanHaiku(client, source, postIds) {
  const { rows } = await client.query(SQL_NHAN, [source, postIds]);
  const out = new Map();
  for (const r of rows) out.set(r.post_id, [r]);
  return out;
}

/**
 * Bước Yêu cầu của transform (sau bước tin rao, cùng giao dịch của người gọi). Mọi bài trong `posts` (đã gạt bài thử) là phạm vi
 * của lượt: ghi phát biểu ý định (thay dòng cũ của chính bộ này), rút dòng luật / nhãn mà lượt không còn sinh, rồi phân xử
 * ĐÚNG các bài này — bài ngoài lượt không bị rút, không bị nghỉ (AC-5 i). Không DELETE. Thiếu bảng (chưa áp 136) → in một dòng,
 * bỏ bước, không ghi gì.
 * @param {import("pg").Client} client
 * @param {Array<{post_id: string, text: string|null, posted_at?: any}>} posts
 * @param {{ source?: string }} [opts]
 * @returns {Promise<null|{xet: number, phatBieu: number, themPhatBieu: number, rut: number, loaiTinNhanYeuCau: number,
 *   xetPhanXu: number, them: number, capNhat: number, songLai: number, nghi: number}>}
 */
export async function ghiYeuCau(client, posts, { source = "S03" } = {}) {
  if (!(await co136(client))) {
    console.log("yêu cầu: chưa áp 136 — bỏ bước Yêu cầu");
    return null;
  }
  const coChu = posts.filter((p) => !laChiAnh(p.text));
  const nhan = await docNhanHaiku(client, source, coChu.map((p) => p.post_id));
  const { dong, xet, loaiTinNhanYeuCau } = phatBieuYDinh(coChu, nhan, { source });
  const ghi = await writeAssertions(client, dong, { replaceOwn: true });
  // Phạm vi rút và phân xử = đúng bài của lượt.
  const phamVi = posts.map((p) => subjectKey(source, p.post_id));
  const coDong = (rule) => new Set(dong.filter((d) => d.rule_id === rule).map((d) => d.subject_key));
  const coLuat = coDong(RULE_LUAT), coNhan = coDong(RULE_NHAN);
  const rutLuat = await retractRule(client, phamVi.filter((k) => !coLuat.has(k)), ASSERTION_FIELD.listing_intent, RULE_LUAT, LY_DO_RUT);
  const rutNhan = await retractRule(client, phamVi.filter((k) => !coNhan.has(k)), ASSERTION_FIELD.listing_intent, RULE_NHAN, LY_DO_RUT);
  const { rows: [{ r }] } = await client.query("SELECT resolve_inquiry_fields($1::text[]) AS r", [phamVi]);
  const kq = {
    xet, phatBieu: dong.length, themPhatBieu: ghi.inserted, rut: ghi.retracted + rutLuat + rutNhan, loaiTinNhanYeuCau,
    xetPhanXu: r.xet, them: r.them, capNhat: r.cap_nhat, songLai: r.song_lai, nghi: r.nghi,
  };
  console.log(`yêu cầu: ${xet} bài xét · ${dong.length} phát biểu ý định (thêm ${kq.themPhatBieu}, rút ${kq.rut}) · ` +
    `dòng Yêu cầu thêm ${kq.them}, cập nhật ${kq.capNhat}, sống lại ${kq.songLai}, nghỉ ${kq.nghi} · ` +
    `bài tin rao mà nhãn nói Yêu cầu (không ghi, Hỏi-1b) ${loaiTinNhanYeuCau}`);
  return kq;
}
