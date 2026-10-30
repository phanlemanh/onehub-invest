// gop-anh.mjs — PL28 `gop-tin-chi-anh-o-transform`: nhận tin chỉ-ảnh S03 và gán nó vào tin chữ cùng người gửi.
// Môi giới gửi ảnh thành tin riêng (mỗi ảnh một event, chữ chỉ là URL ảnh) trước hoặc sau tin chữ mô tả căn. Hàm thuần,
// không import pg: transform-media.mjs nối bài ảnh đã gán vào danh sách bài của offer trước khi dựng dòng bảng media.

const URL_RE = /https?:\/\/\S+|www\.\S+/gi;

/** Cửa sổ gộp: bài chữ và bài ảnh cách nhau DƯỚI chừng này giây (hai phía). */
export const CUA_SO_GIAY = 120;

/** Bài chỉ có ảnh: bỏ mọi URL thì chữ còn lại trống. */
export function laChiAnh(text) {
  return (text ?? "").replace(URL_RE, " ").trim() === "";
}

const giay = (v) => new Date(v).getTime() / 1000;
const khoa = (p) => `${p.conversation_id}|${p.sender_id}`;

/**
 * Gán mỗi bài chỉ-ảnh vào bài chữ GẦN NHẤT cùng nhóm (`conversation_id`), cùng người gửi (`sender_id`), cách dưới
 * `cuaSoGiay` giây, trước hay sau (Hỏi-1, Mạnh chọn 30/10). Hoà thời gian → bài chữ đứng SAU ảnh (nếp gửi album rồi mới
 * gửi chú thích), rồi `post_id` nhỏ hơn. Thiếu nhóm hay người gửi → không gán.
 * @param {{ post_id: string, posted_at: unknown, sender_id?: string|null, conversation_id?: string|null }[]} baiChu
 * @param {typeof baiChu} baiAnh
 * @returns {Map<string, string>} post_id bài ảnh → post_id bài chữ
 */
export function ganBaiAnh(baiChu, baiAnh, { cuaSoGiay = CUA_SO_GIAY } = {}) {
  const theoNguoi = new Map();
  for (const c of baiChu) {
    if (!c.sender_id || !c.conversation_id) continue;
    const k = khoa(c);
    if (!theoNguoi.has(k)) theoNguoi.set(k, []);
    theoNguoi.get(k).push(c);
  }
  const out = new Map();
  for (const a of baiAnh) {
    if (!a.sender_id || !a.conversation_id) continue;
    const ta = giay(a.posted_at);
    let best = null;
    for (const c of theoNguoi.get(khoa(a)) ?? []) {
      const tc = giay(c.posted_at);
      const d = Math.abs(ta - tc);
      if (!(d < cuaSoGiay)) continue;
      if (!best || d < best.d || (d === best.d && totHon(tc, c.post_id, best, ta))) best = { d, tc, id: c.post_id };
    }
    if (best) out.set(a.post_id, best.id);
  }
  return out;
}

/** Hoà khoảng cách: bài chữ đứng sau ảnh thắng; cùng phía thì post_id nhỏ hơn thắng. */
function totHon(tc, id, best, ta) {
  const sau = tc > ta, bestSau = best.tc > ta;
  if (sau !== bestSau) return sau;
  return String(id) < String(best.id);
}
