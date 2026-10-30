// eval-labels.mjs — PL7 `man-gan-nhan-mu`: phần thuần của tập nhãn đánh giá (chọn mẫu lát, phút công).
// Spec: docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md. Lệnh dùng: label-sample.mjs, label-agreement.mjs.
import { createHash } from "node:crypto";

import { normText } from "../transform-zalo.mjs";

/** Mẫu tên nhóm của từng lát (tên nhóm S03 là tầng C). Lát OCP1: cùng mẫu đã dùng để đếm lát 26/10. */
export const LAT_NHOM = Object.freeze({ ocp1: "ocp|ocean|masteri" });

/** Phần tin được hai người gắn (F5). */
export const TI_LE_TRUNG = 0.2;

/** Khoảng nghỉ: hai lượt lưu cách nhau quá mức này không tính vào phút công. */
export const NGHI_PHUT = 10;

const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Băm nội dung đã chuẩn hoá — hai post cùng chữ (khác dấu câu, hoa thường) cho cùng băm. */
export const textHash = (text) => sha(normText(text));

/**
 * Chọn mẫu tất định cho một lát: khử trùng theo nội dung, lấy n tin có băm (seed, nội dung) nhỏ nhất, đánh 20% gắn trùng
 * và chia đôi dev/test (lệch tối đa 1). Cùng đầu vào + seed → cùng kết quả.
 * @param {{ post_id: string, text: string }[]} posts tin đã gạt post thử và đã lọc nhóm
 * @param {{ n: number, seed: string, tiLeTrung?: number }} opts
 * @returns {{ chon: { ref_id: string, text_hash: string, double_label: boolean, split: "dev"|"test" }[], khac_nhau: number }}
 */
export function chonMau(posts, { n, seed, tiLeTrung = TI_LE_TRUNG }) {
  const theoBam = new Map();
  for (const p of [...posts].sort((a, b) => (a.post_id < b.post_id ? -1 : a.post_id > b.post_id ? 1 : 0))) {
    const h = textHash(p.text);
    if (!theoBam.has(h)) theoBam.set(h, p.post_id); // bản trùng chữ: giữ post_id nhỏ nhất
  }
  const xep = (nhan) => (a, b) => {
    const x = sha(`${seed}:${nhan}:${a.text_hash}`), y = sha(`${seed}:${nhan}:${b.text_hash}`);
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const tatCa = [...theoBam].map(([text_hash, ref_id]) => ({ ref_id, text_hash }));
  const chon = tatCa.sort(xep("chon")).slice(0, n);
  const soTrung = Math.round(chon.length * tiLeTrung);
  const trung = new Set([...chon].sort(xep("trung")).slice(0, soTrung).map((r) => r.text_hash));
  const dev = new Set([...chon].sort(xep("split")).slice(0, Math.ceil(chon.length / 2)).map((r) => r.text_hash));
  return {
    chon: chon.map((r) => ({ ...r, double_label: trung.has(r.text_hash), split: dev.has(r.text_hash) ? "dev" : "test" })),
    khac_nhau: theoBam.size,
  };
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
