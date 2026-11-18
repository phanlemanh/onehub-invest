// ghep-tin-danh-muc.mjs — PL20 ghep-tin-vao-danh-muc: luật gắn một bài S03 vào toà hay vùng (phân khu, cụm) của Danh bạ.
// Hàm thuần, không đọc DB. Thứ tự luật: docs/superpowers/specs/2026-11-18-ghep-tin-vao-danh-muc-design.md §3.
// Luật 7: model chỉ trích; gắn hay không do luật xác định ở đây quyết (căn cứ chu_bai, đoạn trích đã kiểm, tên nằm trong đoạn trích,
// tên khớp đúng một nút của dự án).
import { chuanHoaTenToa as chuan } from "./danh-ba-vat-the.mjs";

/** Mỗi nhóm nguồn một rule_id để tắt riêng được. */
export const RULE = Object.freeze({
  cot: "ghep-toa-cot", cotChuan: "ghep-toa-cot-chuan", chuModel: "ghep-toa-chu-model", model: "ghep-toa-model",
});
export const TAT_CA_NGUON = Object.freeze([RULE.cot, RULE.cotChuan, RULE.chuModel, RULE.model]);
/** Nguồn đang bật. Tắt một nguồn: bỏ rule_id khỏi danh sách này, lượt kế rút hết dòng của nguồn đó.
 * RULE.model (D, G) tắt: chỉ có 81 tin, không đủ 110 bài để chấm (Mạnh chọn 18/11). */
export const NGUON_BAT = Object.freeze([RULE.cot, RULE.cotChuan, RULE.chuModel]);

const boDot = (s) => s.replace(/\./g, "");
const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase();
/** Chữ để dò tên: giữ chữ, số, dấu chấm; có khoảng trắng hai đầu. */
const chuDo = (s) => ` ${boDau(s).replace(/[^A-Z0-9.]+/g, " ")} `;
/** Chữ gọn để kiểm tên trong đoạn trích: chỉ giữ chữ và số. */
const gon = (s) => boDau(s).replace(/[^A-Z0-9]/g, "");
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const them = (m, k, v) => { (m.get(k) ?? m.set(k, new Set()).get(k)).add(v); };

/** Mẫu dò một tên trong chữ bài; cho phép mã căn dính sau tên toà (S1.02.1508, S1.02-15XX08). */
function mauTen(ten) {
  const tu = boDau(ten).replace(/[^A-Z0-9.]+/g, " ").trim().split(" ").filter(Boolean);
  if (!tu.length) return null;
  return new RegExp(`(?<![A-Z0-9.])${tu.map(thoat).join(" ?")}(?:[ .-]?(?:[0-9]{3,4}|[0-9]{0,2}X{1,2}[0-9]{2}))?(?![A-Z0-9]|\\.[A-Z0-9])`);
}

/**
 * Bảng tên của một dự án. Tên dưới 2 ký tự sau chuẩn hoá bị loại (khớp nhầm chữ thường trong bài).
 * @param {{ toa: {key: string, upi: string, vung_id: string|number|null, ten: string[]}[],
 *           vung: {id: string|number, cha_id: string|number|null, ten: string[]}[] }} vao
 */
export function dungDanhBa({ toa, vung }) {
  const d = { tenToa: new Map(), tenToaBoDot: new Map(), tenVung: new Map(), mauToa: [], mauVung: [], tenGon: new Map(),
    upi: new Map(), vungCuaToa: new Map(), cha: new Map() };
  const dungDuoc = (t) => chuan(t).length >= 2;
  for (const b of toa) {
    const ten = (b.ten ?? []).filter((t) => dungDuoc(t) && /[A-Z]/.test(chuan(t)));
    for (const t of ten) { them(d.tenToa, chuan(t), b.key); them(d.tenToaBoDot, boDot(chuan(t)), b.key); }
    d.mauToa.push({ k: b.key, re: ten.map(mauTen).filter(Boolean) });
    d.tenGon.set(b.key, ten.map(gon).filter((g) => g.length >= 2));
    d.upi.set(b.key, b.upi);
    d.vungCuaToa.set(b.key, b.vung_id ?? null);
  }
  for (const v of vung) {
    const ten = (v.ten ?? []).filter(dungDuoc);
    for (const t of ten) them(d.tenVung, chuan(t), v.id);
    d.mauVung.push({ k: v.id, re: ten.map(mauTen).filter(Boolean) });
    d.tenGon.set(v.id, ten.map(gon).filter((g) => g.length >= 2));
    d.cha.set(v.id, v.cha_id ?? null);
  }
  return d;
}

/** Khớp một giá trị tên với danh bạ: toà trước vùng, đúng tên trước chuẩn hoá cách viết. */
export function khopTen(raw, d) {
  const t = chuan(raw ?? "");
  if (!t) return { muc: "rong" };
  const a = d.tenToa.get(t);
  if (a?.size === 1) return { muc: "toa", k: [...a][0], cach: "dung" };
  if (a?.size > 1) return { muc: "mo_ho" };
  const v = d.tenVung.get(t);
  if (v?.size === 1) return { muc: "vung", k: [...v][0], cach: "dung" };
  if (v?.size > 1) return { muc: "mo_ho" };
  const b = d.tenToaBoDot.get(boDot(t));
  if (b?.size === 1) return { muc: "toa", k: [...b][0], cach: "chuan", ten_chuan: tenDangKy(d, [...b][0], boDot(t)) };
  if (b?.size > 1) return { muc: "mo_ho" };
  const dau = t.split(".")[0];
  if (dau !== t) {
    const x = d.tenToa.get(dau);
    if (x?.size === 1) return { muc: "toa", k: [...x][0], cach: "chuan", ten_chuan: dau };
    if (x?.size > 1) return { muc: "mo_ho" };
    const y = d.tenVung.get(dau);
    if (y?.size === 1) return { muc: "vung", k: [...y][0], cach: "chuan", ten_chuan: dau };
    if (y?.size > 1) return { muc: "mo_ho" };
  }
  return { muc: "ngoai" };
}

/** Tên đã đăng ký của toà ứng với dạng bỏ dấu chấm. */
function tenDangKy(d, key, daBoDot) {
  for (const [ten, keys] of d.tenToa) if (keys.has(key) && boDot(ten) === daBoDot) return ten;
  return daBoDot;
}

/** Tên toà, vùng mà luật dò được trong chữ bài. */
function docChu(chu, d) {
  const s = chuDo(chu);
  const t = new Set(), v = new Set();
  for (const b of d.mauToa) if (b.re.some((r) => r.test(s))) t.add(b.k);
  for (const x of d.mauVung) if (x.re.some((r) => r.test(s))) v.add(x.k);
  return { t, v };
}

/** Ô bản đọc được tính: có giá trị chuỗi, căn cứ chữ bài, đoạn trích đã kiểm có trong bài. */
const oDuocTinh = (x) => typeof x?.v === "string" && x.v.trim() !== "" && x.cc === "chu_bai" && (x.trich_ok === true || x.trich_ok === "true");

/** Toà, vùng mà model nêu, kèm ô làm căn cứ. */
function docModel(banDoc, d) {
  const t = new Map(), v = new Map();
  for (const x of [banDoc?.building, banDoc?.subzone]) {
    if (!oDuocTinh(x)) continue;
    const m = khopTen(x.v, d);
    if (m.muc === "toa" && !t.has(m.k)) t.set(m.k, x);
    if (m.muc === "vung" && !v.has(m.k)) v.set(m.k, x);
  }
  return { t, v };
}

const coTenTrongTrich = (x, k, d) => { const s = gon(x?.trich); return (d.tenGon.get(k) ?? []).some((g) => s.includes(g)); };

/** Quyết định khi luật đọc được đúng một nút, hoặc chỉ model đọc được. */
function xetChuModel({ luat, model, muc, nguonChung, nguonModel, banDoc, d }) {
  if (luat.size === 1) {
    const k = [...luat][0];
    if (model.size === 1 && model.has(k)) {
      const x = model.get(k);
      return { muc, k, nguon: nguonChung, rule_id: RULE.chuModel, can_cu: { nguon: "chu-model", ten: x.v, label_id: banDoc.label_id, trich: x.trich } };
    }
    return { ly_do: model.size ? "chu-model-khac" : "chi-luat" };
  }
  if (model.size > 1) return { ly_do: muc === "toa" ? "model-nhieu-toa" : "model-nhieu-vung" };
  if (model.size === 1) {
    const [k, x] = [...model][0];
    if (!coTenTrongTrich(x, k, d)) return { ly_do: "trich-khong-co-ten" };
    return { muc, k, nguon: nguonModel, rule_id: RULE.model, can_cu: { nguon: "model", ten: x.v, label_id: banDoc.label_id, model: banDoc.model, trich: x.trich } };
  }
  return null;
}

/**
 * Xét một bài trong phạm vi dự án của tin.
 * @param {{ cot: string[], chu: string|null, banDoc: object|null }} bai
 * @returns {{muc: 'toa'|'vung', k: string|number, nguon: string, rule_id: string, can_cu: object} | {ly_do: string}}
 */
export function xetBai({ cot = [], chu = null, banDoc = null }, d, { nguonBat = NGUON_BAT } = {}) {
  const kq = xetTheoThuTu(cot, chu, banDoc, d);
  return kq.rule_id && !nguonBat.includes(kq.rule_id) ? { ly_do: "nguon-tat" } : kq;
}

function xetTheoThuTu(cot, chu, banDoc, d) {
  const luat = docChu(chu, d);
  if (luat.t.size > 1) return { ly_do: "chu-nhieu-toa" };
  if (banDoc?.multi_unit?.v === "yes") return { ly_do: "bai-nhieu-can" };

  const cots = cot.map((raw) => ({ raw, ...khopTen(raw, d) })).filter((x) => x.muc !== "rong");
  const khop = cots.filter((x) => x.muc === "toa" || x.muc === "vung");
  if (new Set(khop.map((x) => x.k)).size > 1 || cots.some((x) => x.muc === "mo_ho")) return { ly_do: "mo-ho" };
  if (khop.length) {
    const x = khop.find((y) => y.cach === "dung") ?? khop[0];
    if (x.cach === "dung") return { muc: x.muc, k: x.k, nguon: "A", rule_id: RULE.cot, can_cu: { nguon: "cot", ten: x.raw } };
    return { muc: x.muc, k: x.k, nguon: "B", rule_id: RULE.cotChuan, can_cu: { nguon: "cot", ten: x.raw, ten_chuan: x.ten_chuan } };
  }
  if (cots.length) return { ly_do: "ngoai-danh-ba" };

  const model = docModel(banDoc, d);
  const toa = xetChuModel({ luat: luat.t, model: model.t, muc: "toa", nguonChung: "C", nguonModel: "D", banDoc, d });
  if (toa) return toa;
  if (luat.v.size > 1) return { ly_do: "chu-nhieu-vung" };
  return xetChuModel({ luat: luat.v, model: model.v, muc: "vung", nguonChung: "F", nguonModel: "G", banDoc, d }) ?? { ly_do: "khong-neu" };
}

/** Chuỗi vùng từ một nút lên gốc, gồm chính nó. */
export function chuoiVung(id, d) {
  const ra = new Set();
  for (let n = id, i = 0; n !== null && n !== undefined && i < 16; n = d.cha.get(n), i++) ra.add(n);
  return ra;
}

/**
 * Gộp kết quả các bài lên tin, cùng luật với view offer_building: toà cùng vùng chứa nó ra mức toà; hai toà, toà với vùng không
 * chứa nó, hai vùng không lồng nhau là xung đột.
 */
export function gopTin(ketQua, d) {
  const gan = ketQua.filter((x) => x.muc);
  if (!gan.length) return { status: "chua_gan" };
  const toa = new Set(gan.filter((x) => x.muc === "toa").map((x) => x.k));
  const vung = new Set(gan.filter((x) => x.muc === "vung").map((x) => x.k));
  if (toa.size > 1) return { status: "xung_dot" };
  if (toa.size === 1) {
    const k = [...toa][0];
    const chua = chuoiVung(d.vungCuaToa.get(k), d);
    return [...vung].every((v) => chua.has(v)) ? { status: "gan", muc: "toa", k } : { status: "xung_dot" };
  }
  const sau = [...vung].find((v) => { const c = chuoiVung(v, d); return [...vung].every((w) => c.has(w)); });
  return sau === undefined ? { status: "xung_dot" } : { status: "gan", muc: "vung", k: sau };
}

/**
 * Xét một tin: ngoài phạm vi thì không sinh kết quả bài nào.
 * @param {{ du_an: string|null, property_type: string, post_ids: string[] }} tin
 * @param {(post_id: string) => object|null|undefined} docBai bài không còn dữ liệu trả rỗng và bị bỏ qua
 * @param {Map<string, object>} danhBaTheoDuAn chỉ chứa các dự án trong phạm vi
 */
export function xetTin(tin, docBai, danhBaTheoDuAn, opts = {}) {
  const bai = new Map();
  if (!tin.du_an) return { ly_do: "chua-co-du-an", bai };
  const d = danhBaTheoDuAn.get(String(tin.du_an));
  if (!d) return { ly_do: "ngoai-pham-vi", bai };
  if (tin.property_type !== "apartment") return { ly_do: "khong-phai-can-ho", bai };
  for (const p of tin.post_ids ?? []) {
    const b = docBai(p);
    if (b) bai.set(p, xetBai(b, d, opts));
  }
  return { bai, gop: gopTin([...bai.values()], d) };
}
