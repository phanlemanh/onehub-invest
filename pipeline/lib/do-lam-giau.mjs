// do-lam-giau.mjs (lib) — DO3 do-lam-giau: hàm thuần cho sổ đường làm giàu, so ảnh chụp, gộp ngày, đếm người sửa, tự soát.
// Không DB, không model. Thiết kế: docs/superpowers/specs/2026-11-08-do-lam-giau-design.md; hồ sơ _acceptance/do-lam-giau.
// Làm giàu = giá trị máy thêm vào tin mà tin không tự ghi. Mỗi đường một dòng trong sổ; đường mới (GC2, PL20) thêm dòng khi bắt đầu ghi.
import { createHash } from "node:crypto";

import { LOAI_HINH_VERSION } from "../transform-zalo.mjs";
import { chuanHoa } from "./chuan-hoa-nhan.mjs";
import { RULE_QUA_NGUOI } from "./danh-ba-nguoi.mjs";

/**
 * Sổ đường làm giàu. `doc`: cách đọc giá trị sống — `so-tren-tin` (số suy ghi thẳng lên `sale_offer_records`, dấu ở
 * `field_provenance.seller_phone.rule_id`) hay `phat-bieu` (`field_assertions` sống, `resource_name = 'Property'`).
 * `rule_ids` rỗng = đường chưa có mã ghi (đọc ra Map rỗng → «chưa chạy»). `nguoi_rut`: đường có lối người rút hay không.
 * `kiem`: hàm kiểm ngược bỏ-một-ra (`so` · `nhom`) hoặc null.
 */
export const DUONG = Object.freeze([
  Object.freeze({ duong: "so-qua-nguoi-dang", doc: "so-tren-tin", rule_ids: Object.freeze([RULE_QUA_NGUOI]), o_nhan: "seller_phone", nguoi_rut: false, kiem: "so" }),
  Object.freeze({ duong: "quy-uoc-nhom", doc: "phat-bieu", rule_ids: Object.freeze(["loai-hinh-nhom"]), o_nhan: "property_type", nguoi_rut: true, kiem: "nhom" }),
  Object.freeze({ duong: "dien-tich-suy-ra", doc: "phat-bieu", rule_ids: Object.freeze([]), o_nhan: null, nguoi_rut: false, kiem: null }),
  Object.freeze({ duong: "danh-muc-cdt", doc: "phat-bieu", rule_ids: Object.freeze([]), o_nhan: null, nguoi_rut: false, kiem: null }),
]);

/** Lý do rút tính là «người rút» (045): người thay giá trị, người hoàn tác. `thay-boi-luot` là máy tự thay — không tính. */
export const LY_DO_NGUOI_RUT = Object.freeze({ bang: ["hitl-thay"], dau: ["hoan-tac:"] });
export const laNguoiRut = (lyDo) => LY_DO_NGUOI_RUT.bang.includes(lyDo) || LY_DO_NGUOI_RUT.dau.some((p) => String(lyDo ?? "").startsWith(p));

export const PHIEN_BAN_THUOC = createHash("sha256")
  .update(JSON.stringify({ duong: DUONG, loai_hinh: LOAI_HINH_VERSION, chuan_hoa: "labels-normalize@081", kiem: "bo-mot-ra@1" }))
  .digest("hex").slice(0, 12);

/** Nhóm số của detail `do3-thay-doi` được phân rã theo lát. */
export const NHOM_LAT_THAY_DOI = Object.freeze(["song", "them", "doi", "may_rut"]);

/**
 * So giá trị sống với ảnh chụp lần chạy trước. Chủ thể bị người rút trong ngày (`nguoiRut`) mà rời đường không sinh `may_rut` —
 * chỉ đếm ở «người rút», để một lần người rút không đếm hai lần.
 * @param {Map<string, {value_key: string, offer_id: string|null}>} truoc @param {Map<string, {value_key, offer_id}>} nay
 * @param {Set<string>} nguoiRut
 * @returns {{subject_key, from_value, to_value, huong: 'them'|'doi'|'may_rut', offer_id}[]}
 */
export function soAnh(truoc, nay, nguoiRut = new Set(), { dotBien } = {}) {
  const ra = [];
  for (const [k, v] of nay) {
    const c = truoc.get(k);
    if (!c) ra.push({ subject_key: k, from_value: null, to_value: v.value_key, huong: "them", offer_id: v.offer_id ?? null });
    else if (c.value_key !== v.value_key) ra.push({ subject_key: k, from_value: c.value_key, to_value: v.value_key, huong: "doi", offer_id: v.offer_id ?? c.offer_id ?? null });
    // Đột biến: chủ thể không đổi vẫn sinh dòng (như ảnh chụp bị bỏ sót).
    else if (dotBien === "doi-gia") ra.push({ subject_key: k, from_value: null, to_value: v.value_key, huong: "them", offer_id: v.offer_id ?? null });
  }
  for (const [k, c] of truoc) {
    if (nay.has(k)) continue;
    if (nguoiRut.has(k) && dotBien !== "nguoi-rut-hai-lan") continue;
    ra.push({ subject_key: k, from_value: c.value_key, to_value: null, huong: "may_rut", offer_id: c.offer_id ?? null });
  }
  return ra.sort((a, b) => a.subject_key.localeCompare(b.subject_key));
}

const huongCua = (from, to) => (from === null ? "them" : to === null ? "may_rut" : "doi");

/**
 * Gộp một thay đổi vào dòng đã có của ngày (bước đêm chạy mỗi 15′): giữ `from` đầu ngày, lấy `to` mới nhất, tính lại hướng.
 * Về lại giá trị đầu ngày → null (xoá dòng).
 * @param {{from_value, to_value, huong}|undefined} cu @param {{from_value, to_value}} moi
 */
export function gopNgay(cu, moi, { dotBien } = {}) {
  const from = cu ? cu.from_value : moi.from_value;
  const to = moi.to_value;
  if (from === to) return dotBien === "khong-xoa-ve-cu" && cu ? { from_value: cu.from_value, to_value: cu.to_value, huong: cu.huong } : null;
  return { from_value: from, to_value: to, huong: huongCua(from, to) };
}

/** Đếm dòng đổi của một ngày theo hướng. */
export function demThayDoi(dongNgay) {
  const d = { them: 0, doi: 0, may_rut: 0 };
  for (const r of dongNgay) d[r.huong]++;
  return d;
}

/**
 * Người sửa: nhãn người cùng ô trên bài của tin đang mang giá trị đường, khác giá trị đó sau chuẩn hoá (`seller_phone` theo E.164,
 * `property_type` theo mã). Nhãn «không nêu» hay sai khuôn không so được nên không vào mẫu số.
 * @param {{value: string|null, not_stated: boolean, gia_tri: string}[]} nhan @param {string} o
 */
export function nguoiSua(nhan, o, { dotBien } = {}) {
  let sua = 0, so = 0;
  for (const n of nhan) {
    if (n.not_stated || n.value === null || n.value === undefined) continue;
    const a = dotBien === "sdt-chua-chuan" ? { ok: true, v: String(n.value).trim() } : chuanHoa(o, n.value);
    const b = chuanHoa(o, n.gia_tri);
    if (!a.ok || !b.ok || a.v === null || b.v === null) continue;
    so++;
    if (a.v !== b.v) sua++;
  }
  return { nguoi_sua: sua, nhan_da_so: so };
}

/**
 * Bộ tự soát của một dòng `do3-thay-doi`. Trả tên phép lệch hoặc null.
 * - `song-lech`: song ≠ song hôm qua + thêm − máy rút − người rút (bỏ qua khi hôm qua chưa có dòng).
 * - `lat-lech:<nhóm>.<chiều>`: tổng các ô khác tổng của chiều, hoặc tổng của chiều khác số chung của nhóm.
 * @param {{song_hom_qua: number|null, song: number, them: number, may_rut: number, nguoi_rut?: number,
 *          lat: Record<string, {o: Record<string, number>, tong: number}>}} x lat phẳng theo khoá `<nhóm>.<chiều>`
 */
export function tuSoat(x) {
  if (x.song_hom_qua !== null && x.song_hom_qua !== undefined
      && x.song !== x.song_hom_qua + x.them - x.may_rut - (x.nguoi_rut ?? 0)) return "song-lech";
  for (const [k, v] of Object.entries(x.lat ?? {})) {
    const tong = Object.values(v.o).reduce((s, n) => s + n, 0);
    if (tong !== v.tong) return `lat-lech:${k}`;
    const nhom = k.split(".")[0];
    if (typeof x[nhom] === "number" && x[nhom] !== v.tong) return `lat-lech:${k}`;
  }
  return null;
}

/** Lát lồng `{nhóm: {chiều: {o, tong}}}` → phẳng `{'nhóm.chiều': {o, tong}}` cho tuSoat. */
export const latPhang = (lat) => Object.fromEntries(Object.entries(lat ?? {}).flatMap(([n, cs]) => Object.entries(cs).map(([c, v]) => [`${n}.${c}`, v])));
