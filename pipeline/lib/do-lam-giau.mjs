// do-lam-giau.mjs (lib) — DO3 do-lam-giau: hàm thuần cho sổ đường làm giàu, so ảnh chụp, gộp ngày, đếm người sửa, tự soát.
// Không DB, không model. Thiết kế: docs/superpowers/specs/2026-11-08-do-lam-giau-design.md; hồ sơ _acceptance/do-lam-giau.
// Làm giàu = giá trị máy thêm vào tin mà tin không tự ghi. Mỗi đường một dòng trong sổ; đường mới (GC2, PL20) thêm dòng khi bắt đầu ghi.
import { createHash } from "node:crypto";

import { docLoaiHinh, extractPhones, LOAI_HINH_VERSION, loaiHinhNhom } from "../transform-zalo.mjs";
import { chuanHoa } from "./chuan-hoa-nhan.mjs";
import { RULE_QUA_NGUOI } from "./danh-ba-nguoi.mjs";
import { soTuan, wilson } from "./do-hang-ngay.mjs";
import { khoaNhomThat } from "./eval-labels.mjs";
import { chonSoNguoi, rutLienLac } from "./lien-lac-nguoi.mjs";
import { testMarker } from "./test-posts.mjs";

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

// ================= Kiểm ngược bỏ-một-ra (mỗi tuần ISO giờ VN) =================
const sachChu = (s) => (typeof s === "string" && s.trim() !== "" ? s.trim() : null);
const laSoSuy = (t) => t.field_provenance?.seller_phone?.rule_id === RULE_QUA_NGUOI;
const them = (m, k, v) => (m.get(k) ?? m.set(k, []).get(k)).push(v);
const ketQua = (ket) => {
  const v = [...ket.values()];
  return { n: v.length, dung: v.filter((x) => x === "dung").length, sai: v.filter((x) => x === "sai").length, khong_ra: v.filter((x) => x === "khong_ra").length };
};

/**
 * Kiểm ngược đường số qua người đăng. Tập đo: tin S03 sống có số riêng (không mang dấu số suy) và người đăng ra được Người. Với mỗi tin
 * T: bỏ T, mọi bài trong `T.post_ids` và mọi tin khác chung bài với T (số trong chữ bài cũng là bằng chứng của chính tin), dựng lại
 * liên lạc bằng đúng `rutLienLac` rồi chọn số bằng `chonSoNguoi` cho Người của T. Số chọn trùng số riêng → đúng, khác → sai, không
 * còn số → không ra. Tối ưu (kết quả như dựng trên toàn bộ): chỉ dựng trên bài, tin của Người ấy cộng bài, tin của người khác có
 * cùng số (đủ để luật số chung của rutLienLac thấy), và chỉ bài có số (bài không số không sinh liên lạc nào).
 * @param {{post_id: string, sender_id: string|null, text: string|null}[]} bai
 * @param {{offer_id: string, seller_ref: string|null, seller_phone: string|null, field_provenance?: object|null, post_ids: string[], song?: boolean}[]} tins
 * @param {Map<string, string>} nguoiCuaTaiKhoan tài khoản nguồn → Người cuối chuỗi gộp
 */
export function kiemNguocSo(bai, tins, nguoiCuaTaiKhoan, { dotBien } = {}) {
  const baiCua = new Map(), baiTheoSo = new Map();
  for (const b of bai) {
    const ai = sachChu(b.sender_id);
    if (!ai) continue;
    const so = extractPhones(b.text ?? "");
    if (!so.length) continue;
    them(baiCua, ai, b);
    for (const x of new Set(so)) them(baiTheoSo, x, b);
  }
  const bang = tins.filter((t) => sachChu(t.seller_ref) && sachChu(t.seller_phone) && !laSoSuy(t));
  const tinCua = new Map(), tinTheoSo = new Map();
  for (const t of bang) { them(tinCua, sachChu(t.seller_ref), t); them(tinTheoSo, sachChu(t.seller_phone), t); }
  const taiKhoan = new Map();
  for (const [ai, p] of nguoiCuaTaiKhoan) them(taiKhoan, p, ai);
  const nguCanh = new Map();
  const canhCua = (p) => {
    if (nguCanh.has(p)) return nguCanh.get(p);
    const b = new Set(), t = new Set();
    for (const ai of taiKhoan.get(p) ?? []) { for (const x of baiCua.get(ai) ?? []) b.add(x); for (const x of tinCua.get(ai) ?? []) t.add(x); }
    const so = new Set([...[...b].flatMap((x) => extractPhones(x.text ?? "")), ...[...t].map((x) => sachChu(x.seller_phone))]);
    for (const x of so) { for (const y of baiTheoSo.get(x) ?? []) b.add(y); for (const y of tinTheoSo.get(x) ?? []) t.add(y); }
    const ra = { bai: [...b], tins: [...t] };
    nguCanh.set(p, ra);
    return ra;
  };
  const tap = tins.filter((t) => t.song !== false && sachChu(t.seller_phone) && (dotBien === "so-suy-vao-tap" || !laSoSuy(t))
    && sachChu(t.seller_ref) && nguoiCuaTaiKhoan.get(sachChu(t.seller_ref)));
  const ket = new Map();
  for (const T of tap) {
    const p = nguoiCuaTaiKhoan.get(sachChu(T.seller_ref));
    const canh = canhCua(p);
    const baiT = new Set(T.post_ids ?? []);
    const boBai = dotBien === "khong-bo-ra" || dotBien === "giu-bai" ? new Set() : baiT;
    const boTin = new Set(dotBien === "khong-bo-ra" ? [] : [T.offer_id]);
    if (dotBien !== "khong-bo-ra" && dotBien !== "giu-tin-cung-bai") {
      for (const t of canh.tins) if ((t.post_ids ?? []).some((x) => baiT.has(x))) boTin.add(t.offer_id);
    }
    const { lienLac } = rutLienLac(canh.bai.filter((b) => !boBai.has(b.post_id)), canh.tins.filter((t) => !boTin.has(t.offer_id)), nguoiCuaTaiKhoan);
    const chon = chonSoNguoi(lienLac.filter((l) => l.party_key === p));
    ket.set(T.offer_id, !chon ? "khong_ra" : chon.value === sachChu(T.seller_phone) ? "dung" : "sai");
  }
  return { tap_do: "tin-co-so-rieng", ...ketQua(ket), ket };
}

/**
 * Kiểm ngược đường loại hình theo nhóm. Tập đo: bài S03 không phải bài thử (cùng bộ lọc `testMarker` của transform) có loại hình
 * đọc từ chữ (`docLoaiHinh`). Với mỗi bài B: `loaiHinhNhom` tính lại trên các bài cùng nhóm (khoá nhóm thật như transform) trừ B.
 * Bỏ ra hai bài cùng loại trong một nhóm cho cùng kết quả (loaiHinhNhom chỉ đếm loại), nên mỗi (nhóm, loại) gọi một lần.
 * @param {{post_id: string, conversation_id: string|null, text: string|null, snapshot_id?, agent_id?, group_name?}[]} bai
 */
export function kiemNguocNhom(bai, { dotBien } = {}) {
  const sachBai = dotBien === "giu-bai-thu" ? bai : bai.filter((b) => !testMarker(b));
  const doc = sachBai.map((b) => ({ post_id: b.post_id, conversation_id: b.conversation_id == null ? null : khoaNhomThat(b.conversation_id), loai: docLoaiHinh(b.text) }));
  const theoNhom = new Map();
  for (const d of doc) if (d.conversation_id) them(theoNhom, d.conversation_id, d);
  const nho = new Map(), ket = new Map();
  for (const d of doc) {
    if (!d.loai) continue;
    if (!d.conversation_id) { ket.set(d.post_id, "khong_ra"); continue; }
    const khoa = dotBien === "khong-bo-bai" ? d.conversation_id : `${d.conversation_id}|${d.loai}`;
    if (!nho.has(khoa)) {
      const nhom = theoNhom.get(d.conversation_id);
      const con = dotBien === "khong-bo-bai" ? nhom : nhom.filter((x) => x !== d);
      nho.set(khoa, loaiHinhNhom(con).get(d.conversation_id) ?? null);
    }
    const du = nho.get(khoa);
    ket.set(d.post_id, du === null ? "khong_ra" : du === d.loai ? "dung" : "sai");
  }
  return { tap_do: "bai-co-chu-loai", ...ketQua(ket), ket };
}

/** Bộ số của một dòng kiểm ngược: tỉ lệ đúng trên (đúng + sai), Wilson 95%, độ phủ, so tuần trước (FRAMING §5 nguyên tắc 6). */
export function tongKiem(k, truoc, { dotBien } = {}) {
  const mau = dotBien === "khong-ra-mau-so" ? k.n : k.dung + k.sai;
  const so = truoc && Number.isFinite(truoc.dung) && Number.isFinite(truoc.sai)
    ? soTuan({ k: k.dung, n: mau }, { k: truoc.dung, n: truoc.dung + truoc.sai })
    : { chenh: null, co_y_nghia: false, nguong_phat_hien: null };
  return { ty_le_dung: mau ? k.dung / mau : null, wilson: wilson(k.dung, mau), phu: k.n ? (k.dung + k.sai) / k.n : null, ...so };
}

/** Thứ Hai của tuần ISO chứa `ngay`. */
export function ngayDauTuan(ngay) {
  const d = new Date(`${ngay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
