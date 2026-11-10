// eval-labels.mjs — PL7 `man-gan-nhan-mu`: phần thuần của tập nhãn đánh giá (chọn mẫu lát, phút công).
// Spec: docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md. Lệnh dùng: label-sample.mjs, label-agreement.mjs.
import { createHash } from "node:crypto";

import { normText } from "./norm-text.mjs";

/** Mẫu tên nhóm của từng lát (tên nhóm S03 là tầng C). Lát OCP1: cùng mẫu đã dùng để đếm lát 26/10. */
export const LAT_NHOM = Object.freeze({ ocp1: "ocp|ocean|masteri" });

/** Phần tin được hai người gắn (F5). */
export const TI_LE_TRUNG = 0.2;

/** Khoảng nghỉ: hai lượt lưu cách nhau quá mức này không tính vào phút công. */
export const NGHI_PHUT = 10;

const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Băm nội dung đã chuẩn hoá — hai post cùng chữ (khác dấu câu, hoa thường) cho cùng băm. */
export const textHash = (text) => sha(normText(text));

/** Chữ bài đã gạt mọi link `http(s)://…` rồi chuẩn hoá — hai bài cùng chữ khác link ảnh cho cùng chuỗi. */
export const chuGatUrl = (text) => normText(String(text ?? "").replace(/https?:\/\/\S+/gi, " "));

/**
 * Khoá trùng của một bài (lay-mau-khu-trung-theo-tin): bài đã thành tin của pipeline dùng `o:<offer_id>`, bài chưa thành tin
 * dùng `c:<chữ đã gạt URL>`; chữ rỗng thì không có khoá (bài đứng riêng). Định nghĩa duy nhất — sampler và label-ghep cùng dùng.
 * @param {{ post_id: string, text?: string|null }} bai
 * @param {Map<string, string>} tinCua post_id → offer_id (sale_offer_records.post_ids của S03)
 * @returns {string|null}
 */
export function khoaTrung(bai, tinCua) {
  const tin = tinCua?.get(bai.post_id);
  if (tin) return `o:${tin}`;
  const chu = chuGatUrl(bai.text);
  return chu ? `c:${chu}` : null;
}

/**
 * Sự kiện hệ thống lưu ở cột chữ (thu hồi `clientDelMsgId`, nhãn dán, thẻ link): chữ mở đầu «[» hoặc «{» mà là JSON của
 * một object hay một mảng object. Tin rao mở đầu «[» mà không phải JSON vẫn là bài thật.
 */
export function laSuKien(text) {
  const t = String(text ?? "").trim();
  if (!/^[[{]/.test(t)) return false;
  let v;
  try { v = JSON.parse(t); } catch { return false; }
  const laObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  return Array.isArray(v) ? v.length > 0 && v.every(laObj) : laObj(v);
}

const theoPostId = (a, b) => (a.post_id < b.post_id ? -1 : a.post_id > b.post_id ? 1 : 0);

/**
 * Khử trùng một tập bài: gạt sự kiện, gom theo khoaTrung (bài không khoá đứng riêng), giữ post_id nhỏ nhất; rồi giữ một đại
 * diện mỗi text_hash vì cột (lat, text_hash) của eval_label_items là khoá duy nhất. Trả đại diện kèm khoá.
 * @returns {{ dai: { post_id: string, text: string, khoa: string, text_hash: string }[], bo_su_kien: number, bo_vi_trung: number }}
 */
export function khuTrung(posts, tinCua = new Map()) {
  const theoKhoa = new Map();
  const daBam = new Set();
  let boSuKien = 0;
  for (const p of [...posts].sort(theoPostId)) {
    if (laSuKien(p.text)) { boSuKien++; continue; }
    const khoa = khoaTrung(p, tinCua) ?? `p:${p.post_id}`;
    if (theoKhoa.has(khoa)) continue;
    const text_hash = textHash(p.text);
    if (daBam.has(text_hash)) continue;
    daBam.add(text_hash);
    theoKhoa.set(khoa, { ...p, khoa, text_hash });
  }
  const dai = [...theoKhoa.values()];
  return { dai, bo_su_kien: boSuKien, bo_vi_trung: posts.length - boSuKien - dai.length };
}

/**
 * Chọn mẫu tất định cho một lát: khử trùng theo khoaTrung (tin trước, chữ đã gạt URL sau), gạt sự kiện, lấy n bài có băm
 * (seed, khoá) nhỏ nhất, đánh 20% gắn trùng và chia đôi dev/test (lệch tối đa 1). Cùng đầu vào + seed → cùng kết quả.
 * @param {{ post_id: string, text: string }[]} posts tin đã gạt post thử và đã lọc nhóm
 * @param {{ n: number, seed: string, tiLeTrung?: number, tinCua?: Map<string, string> }} opts
 * @returns {{ chon: { ref_id: string, text_hash: string, khoa: string, double_label: boolean, split: "dev"|"test" }[], khac_nhau: number, bo_su_kien: number, bo_vi_trung: number }}
 */
export function chonMau(posts, { n, seed, tiLeTrung = TI_LE_TRUNG, tinCua = new Map() }) {
  const { dai, bo_su_kien, bo_vi_trung } = khuTrung(posts, tinCua);
  const xep = (nhan) => (a, b) => {
    const x = sha(`${seed}:${nhan}:${a.khoa}`), y = sha(`${seed}:${nhan}:${b.khoa}`);
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const tatCa = dai.map((p) => ({ ref_id: p.post_id, text_hash: p.text_hash, khoa: p.khoa }));
  const chon = tatCa.sort(xep("chon")).slice(0, n);
  const soTrung = Math.round(chon.length * tiLeTrung);
  const trung = new Set([...chon].sort(xep("trung")).slice(0, soTrung).map((r) => r.khoa));
  const dev = new Set([...chon].sort(xep("split")).slice(0, Math.ceil(chon.length / 2)).map((r) => r.khoa));
  return {
    chon: chon.map((r) => ({ ...r, double_label: trung.has(r.khoa), split: dev.has(r.khoa) ? "dev" : "test" })),
    khac_nhau: dai.length, bo_su_kien, bo_vi_trung,
  };
}

/**
 * Khoá thật của một nhóm S03: bỏ một tiền tố `group:` hay `<kênh>:group:` khi sau đó còn chữ. Cổng thu khai `group:<khoá>`, bài
 * từ 22/10 mang khoá trần, bài cũ và dòng sổ ghi tay mang tiền tố kênh; khoá khác giữ nguyên.
 * @param {string} khoa
 */
export function khoaNhomThat(khoa) {
  return String(khoa).replace(/^(?:[^:]+:)?group:(?=.)/, "");
}

/**
 * Gom sổ theo khoá thật. Đại diện của nhóm là dòng khoá trần, không có thì mã nhỏ nhất; không xét trạng thái vì lượt đồng bộ sổ
 * đổi dòng vắng ở cổng sang `paused` mà bài của nó vẫn thuộc nhóm đó.
 * @param {{ unit_code: string, group_key: string, note?: string|null }[]} so
 */
export function donViTheoNhomThat(so) {
  const theoKhoa = new Map();
  for (const r of so) {
    const khoa = khoaNhomThat(r.group_key);
    if (!theoKhoa.has(khoa)) theoKhoa.set(khoa, []);
    theoKhoa.get(khoa).push(r);
  }
  const donVi = new Map();
  const gop = [];
  for (const [khoa, ds] of theoKhoa) {
    const [dau, ...phu] = [...ds].sort((a, b) => (a.group_key === khoa ? 0 : 1) - (b.group_key === khoa ? 0 : 1) || (a.unit_code < b.unit_code ? -1 : 1));
    donVi.set(khoa, dau.unit_code);
    if (phu.length) gop.push({ khoa, khoa_dai_dien: dau.group_key, unit_code: dau.unit_code, gop_tu: phu.map((r) => r.unit_code), the_lech: new Set(ds.map((r) => r.note ?? "")).size > 1 });
  }
  return { donVi, gop: gop.sort((a, b) => (a.unit_code < b.unit_code ? -1 : 1)) };
}

/** Đơn vị của một bài; bài không có khoá hay khoá không có trong sổ trả `null`. */
export function donViCuaBai(donVi, khoa) {
  return khoa == null ? null : donVi.get(khoaNhomThat(khoa)) ?? null;
}

/**
 * Mẫu theo nhóm (GC0): `soNhomLon` nhóm nhiều nội dung nhất lấy `moiNhomLon` bài, còn lại `moiNhomNho` bài. Nhóm xếp theo số nội dung
 * khác nhau giảm dần, hoà theo unit_code. Nội dung trùng thuộc về nhóm xếp trước, nhóm sau bù từ phần còn lại của nó. Gắn trùng và
 * dev/test tính trong từng nhóm. Bài không có đơn vị trong sổ bị bỏ, đếm ở `bo_khong_don_vi`.
 * @param {{ post_id: string, text: string, unit_code: string|null }[]} posts
 * @param {{ seed: string, moiNhomLon: number, moiNhomNho: number, soNhomLon: number, tiLeTrung?: number }} opts
 */
export function chonMauTheoNhom(posts, { seed, moiNhomLon, moiNhomNho, soNhomLon, tiLeTrung = TI_LE_TRUNG, tinCua = new Map() }) {
  const theoNhom = new Map();
  let boKhongDonVi = 0, boSuKien = 0;
  for (const p of posts) {
    if (!p.unit_code) { boKhongDonVi++; continue; }
    if (laSuKien(p.text)) { boSuKien++; continue; }
    if (!theoNhom.has(p.unit_code)) theoNhom.set(p.unit_code, []);
    theoNhom.get(p.unit_code).push(p);
  }
  // Khoá và băm của đại diện từng nhóm: nội dung (tin hay chữ) đã dùng ở nhóm trước thì nhóm sau không lấy lại.
  const xep = [...theoNhom].map(([unit_code, ds]) => ({ unit_code, ...khuTrung(ds, tinCua) }))
    .sort((a, b) => b.dai.length - a.dai.length || (a.unit_code < b.unit_code ? -1 : 1));
  const daKhoa = new Set(), daBam = new Set();
  const chon = [];
  const moiNhom = xep.map(({ unit_code, dai, bo_vi_trung }, i) => {
    const can = i < soNhomLon ? moiNhomLon : moiNhomNho;
    const con = dai.filter((x) => !daKhoa.has(x.khoa) && !daBam.has(x.text_hash));
    const r = chonMau(con, { n: can, seed, tiLeTrung, tinCua });
    for (const c of r.chon) {
      daKhoa.add(c.khoa);
      daBam.add(c.text_hash);
      chon.push({ ...c, stratum: unit_code });
    }
    return { unit_code, khac_nhau: dai.length, can, chon: r.chon.length, bo_vi_trung: bo_vi_trung + dai.length - con.length };
  });
  return { chon, moiNhom, bo_khong_don_vi: boKhongDonVi, bo_su_kien: boSuKien, bo_vi_trung: moiNhom.reduce((a, x) => a + x.bo_vi_trung, 0) };
}

/**
 * Phút công theo người gắn: cộng khoảng giữa hai lượt lưu liên tiếp (mỗi lượt lưu là một mốc `labeled_at`), bỏ khoảng
 * nghỉ quá NGHI_PHUT phút.
 * @param {{ labeler_id: string, labeled_at: string|Date }[]} rows
 * @returns {Record<string, number>} phút (làm tròn 1 chữ số)
 */
export function phutCong(rows) {
  const moc = new Map();
  for (const r of rows) {
    const t = new Date(r.labeled_at).getTime();
    if (!moc.has(r.labeler_id)) moc.set(r.labeler_id, new Set());
    moc.get(r.labeler_id).add(t);
  }
  const kq = {};
  for (const [id, set] of moc) {
    const ts = [...set].sort((a, b) => a - b);
    let ms = 0;
    for (let i = 1; i < ts.length; i++) {
      const d = ts[i] - ts[i - 1];
      if (d <= NGHI_PHUT * 60_000) ms += d;
    }
    kq[id] = Math.round((ms / 60_000) * 10) / 10;
  }
  return kq;
}

/** Trường có tỉ lệ khớp thấp nhất (bỏ trường chưa có cặp); null khi chưa trường nào có cặp. */
export function thapNhat(truong) {
  const co = truong.filter((t) => t.ti_le !== null && t.ti_le !== undefined);
  if (co.length === 0) return null;
  return co.reduce((a, b) => (Number(b.ti_le) < Number(a.ti_le) ? b : a));
}
