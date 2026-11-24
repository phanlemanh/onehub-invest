// ghep-tin-truc-can.mjs — PL36 ghep-tin-vao-truc-can: luật gắn một bài S03 đã có toà xuống trục hoặc căn của Danh bạ.
// Hàm thuần, không đọc DB. Thiết kế: docs/superpowers/specs/2026-11-24-ghep-tin-vao-truc-can-design.md §3.
// Quy ước «Mã căn» (CONTEXT.md, Mạnh chốt 24/11): khớp tên toà dài nhất có trong danh bạ trước, phần còn lại là tầng rồi trục —
// trục là hai chữ số cuối của số căn, có thể kèm một chữ cái. Máy gắn và trợ lý gắn nháp dùng chung `tachMa`.
import { chuNhieuCan } from "./ghep-tin-danh-muc.mjs";

/** Mỗi nguồn một rule_id để tắt riêng được. */
export const RULE = Object.freeze({
  truc: "ghep-can-truc", ma: "ghep-can-ma", trucTang: "ghep-can-truc-tang", tangTuMa: "ghep-can-tang-tu-ma",
});
export const TAT_CA_NGUON = Object.freeze([RULE.truc, RULE.ma, RULE.trucTang, RULE.tangTuMa]);
/** Nguồn đang bật. Tắt một nguồn: bỏ rule_id khỏi danh sách, lượt kế rút hết dòng của nguồn đó. */
export const NGUON_BAT = Object.freeze([...TAT_CA_NGUON]);

const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase();
/** Tên toà để so tiền tố: bỏ dấu, chữ hoa, bỏ khoảng trắng và gạch; giữ dấu chấm (S2.09 khác S2 + 09). */
export const chuanTen = (s) => boDau(s).replace(/[\s_-]+/g, "");
/** Tầng dạng chuẩn: bỏ số 0 đầu, chữ hoa («09» → «9», «12a» → «12A»); không phải tầng → null. */
export function chuanTang(t) {
  const m = /^0*([1-9][0-9]{0,2})([A-Z]?)$/.exec(boDau(t).replace(/\s+/g, "").replace(/^(TANG|T|L)/, ""));
  return m ? m[1] + m[2] : null;
}
/** Trục để so: bỏ số 0 đầu, chữ hoa («03» → «3», «08a» → «8A»). */
export const chuanTruc = (t) => { const m = /^0*([0-9]{1,2})([A-Z]?)$/.exec(boDau(t)); return m ? (m[1] || "0") + m[2] : null; };

/**
 * Tách một mã căn theo quy ước «Mã căn».
 * @param {string} raw mã như người đăng viết: «LD2XX03», «S2.091710», «S2.05.24.17», «S5.03-22.06»
 * @param {{ten: string, key: string}[]} tenToa tên toà của dự án (mọi bí danh tên)
 * @returns {{toa: string, tenToa: string, tang: string|null, truc: string, dang: 'truc'|'tang-can'} | {ly_do: 'ma-khong-toa'|'ma-la'}}
 */
export function tachMa(raw, tenToa) {
  const s = boDau(raw).replace(/\s+/g, "");
  if (!s) return { ly_do: "ma-la" };
  let best = null;
  for (const t of tenToa) {
    const n = chuanTen(t.ten);
    if (n.length < 2 || !s.startsWith(n)) continue;
    if (!best || n.length > best.n.length) best = { n, key: t.key, ten: t.ten };
  }
  if (!best) return { ly_do: "ma-khong-toa" };
  const duoi = s.slice(best.n.length).replace(/^[.-]/, "");
  let m;
  // Tầng che hẳn («XX») hay che một phần («1x», «2X» — biết hàng chục, che hàng đơn vị): chỉ biết trục.
  if ((m = /^(?:[0-9]X|X{1,2})[.-]?([0-9]{1,2}[A-Z]?)$/.exec(duoi))) {
    return { toa: best.key, tenToa: best.ten, tang: null, truc: chuanTruc(m[1]), dang: "truc" };
  }
  if ((m = /^([0-9]{1,2}[A-Z]?)[.-]([0-9]{1,2}[A-Z]?)$/.exec(duoi)) || (m = /^([0-9]{1,2}A?)([0-9]{2}[A-Z]?)$/.exec(duoi))) {
    const tang = chuanTang(m[1]); const truc = chuanTruc(m[2]);
    if (tang && truc) return { toa: best.key, tenToa: best.ten, tang, truc, dang: "tang-can" };
  }
  return { ly_do: "ma-la" };
}

const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Mã có dấu ngăn ngay sau tên toà trong chữ bài («S2.05.24.17», «S5.03-22.06») — cách ghi của Grand Park mà bộ đọc chữ không bắt.
 * Bắt buộc dấu chấm hay gạch giữa toà, tầng, căn: «S10.07 67» (toà + diện tích) và mã tin sàn (NTL02362) không phải mã căn.
 */
export function maTrongChu(chu, tenToa) {
  const s = ` ${boDau(chu)} `;
  const ra = new Set();
  for (const t of tenToa) {
    const n = chuanTen(t.ten);
    if (n.length < 2) continue;
    const re = new RegExp(`(?<![A-Z0-9.])(${thoat(n)}[.-][0-9]{1,2}[.-][0-9]{2}[A-Z]?)(?![0-9.]?[0-9])`, "g");
    for (const x of s.matchAll(re)) ra.add(x[1]);
  }
  return [...ra];
}

/**
 * Xét một bài đã có toà.
 * @param {{toa: string, ma?: string[], chu?: string|null, tangChu?: string[], nhieuCan?: boolean}} bai
 *   toa: building_key đã gắn (PL20); ma: unit_number của bộ đọc chữ; tangChu: floor_raw của bộ đọc chữ.
 * @param {{tenToa: {ten: string, key: string}[], truc: Map<string, Map<string, string[]>>, can: Map<string, Map<string, string[]>>,
 *          biDanh: Map<string, string[]>}} d danh bạ của dự án: trục theo toà → số trục chuẩn → stack_key; căn theo stack_key →
 *   tầng chuẩn → unit_key; bí danh mã căn (khoá `khoaBiDanh`) → unit_key.
 * @returns {{muc: 'truc'|'can', stack: string, tang: string|null, unit: string|null, rule_id: string, can_cu: object, ly_do?: string,
 *            tangTuMa: string|null} | {ly_do: string}}
 */
export function xetBai({ toa, ma = [], chu = null, tangChu = [], nhieuCan = false }, d, { nguonBat = NGUON_BAT } = {}) {
  if (nhieuCan || chuNhieuCan(chu)) return { ly_do: "bai-nhieu-can" };
  const nguon = [...new Set([...ma.filter(Boolean), ...maTrongChu(chu, d.tenToa)])];
  if (!nguon.length) return { ly_do: "khong-ma" };
  const tach = nguon.map((raw) => ({ raw, ...tachMa(raw, d.tenToa) }));
  const hop = tach.filter((x) => x.toa);
  if (hop.some((x) => x.toa !== toa)) return { ly_do: "toa-lech" };
  if (!hop.length) return { ly_do: tach.some((x) => x.ly_do === "ma-la") ? "ma-la" : "ma-khong-toa" };
  // Hai mã cùng trục (một dạng trục, một dạng tầng + căn) là cùng căn; khác trục hay khác tầng là bài nêu hai căn.
  if (new Set(hop.map((y) => y.truc)).size > 1 || new Set(hop.filter((y) => y.tang).map((y) => y.tang)).size > 1) return { ly_do: "ma-nhieu" };
  const x = hop.find((y) => y.tang) ?? hop[0];
  const stacks = d.truc.get(toa)?.get(x.truc) ?? [];
  if (stacks.length !== 1) return { ly_do: stacks.length ? "truc-mo-ho" : "truc-ngoai-danh-ba" };
  const stack = stacks[0];

  const tangC = [...new Set(tangChu.map(chuanTang).filter(Boolean))];
  const tangMa = x.tang;
  const can_cu = { ma: x.raw, toa: x.tenToa, truc: x.truc };
  const trucRule = x.dang === "truc" ? (tangC.length === 1 ? RULE.trucTang : RULE.truc) : RULE.ma;
  const kq = (o) => (nguonBat.includes(o.rule_id) ? o : { ly_do: "nguon-tat" });
  if (tangMa && tangC.length === 1 && tangC[0] !== tangMa) {
    return kq({ muc: "truc", stack, tang: null, unit: null, rule_id: trucRule, can_cu: { ...can_cu, tang_ma: tangMa, tang_chu: tangC[0] }, ly_do: "tang-lech", tangTuMa: null });
  }
  const tang = tangMa ?? (tangC.length === 1 ? tangC[0] : null);
  const tangTuMa = tangMa && !tangC.length && nguonBat.includes(RULE.tangTuMa) ? tangMa : null;
  if (!tang) return kq({ muc: "truc", stack, tang: null, unit: null, rule_id: trucRule, can_cu, tangTuMa: null });
  const units = new Set(d.can.get(stack)?.get(tang) ?? []);
  if (tangMa) for (const u of d.biDanh.get(khoaBiDanh(x.tenToa, tangMa, x.truc)) ?? []) units.add(u);
  const cc = { ...can_cu, tang, nguon_tang: tangMa ? "ma" : "chu" };
  if (units.size === 1) return kq({ muc: "can", stack, tang, unit: [...units][0], rule_id: trucRule, can_cu: cc, tangTuMa });
  return kq({ muc: "truc", stack, tang: null, unit: null, rule_id: trucRule, can_cu: cc, ly_do: units.size ? "bi-danh-mo-ho" : "can-ngoai-danh-ba", tangTuMa });
}

/** Khoá bí danh mã căn: tên toà + tầng hai chữ số + trục hai chữ số, bỏ mọi dấu ngăn («S6.0220.08» → «S6022008»). */
export function khoaBiDanh(tenToa, tang, truc) {
  const pad = (v) => { const m = /^([0-9]+)([A-Z]?)$/.exec(v); return m ? m[1].padStart(2, "0") + m[2] : v; };
  return `${chuanTen(tenToa)}${pad(tang)}${pad(truc)}`.replace(/[.-]/g, "");
}
/** Khoá của một giá trị bí danh nguồn («<dự án>/S6.0220.08»): bỏ phần dự án, bỏ dấu ngăn. */
export const khoaGiaTriBiDanh = (v) => boDau(String(v).split("/").pop()).replace(/[\s.-]+/g, "");

/** Giá trị UniversalPropertySubId: «khoá trục:tầng» cho căn, «khoá trục:*» cho trục (ADR-0016 §4). */
export const subId = (kq) => `${kq.stack}:${kq.muc === "can" ? kq.tang : "*"}`;
