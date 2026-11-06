// ghep-mau.mjs — hồ sơ ghep-anh-tren-the-gan-nhan: ghép của từng dòng mẫu gắn nhãn, bằng đúng luật PL28 ở gop-anh.mjs.
// Hàm thuần, không import pg. Bên đọc là app/src/lib/labels-anh.ts (`docGhep`), app không import pipeline nên đọc qua cột.
import { ganBaiAnh, laChiAnh, soChuGan } from "./gop-anh.mjs";

const giay = (v) => new Date(v).getTime();

/**
 * @param {{ item_id: number|string, ref_id: string }[]} items dòng mẫu của một lát
 * @param {{ post_id: string, text?: string|null, posted_at: unknown, sender_id?: string|null, conversation_id?: string|null }[]} posts
 * @returns {Map<string, { chu_ref: string|null, anh_refs: string[], so_chu_gan: number, trung_voi: string|null }|null>}
 *   khoá là `String(item_id)`. Bài có chữ không cụm là null: đường đọc giữ như trước.
 */
export function ghepChoMau(items, posts) {
  const chu = posts.filter((p) => !laChiAnh(p.text));
  const anh = posts.filter((p) => laChiAnh(p.text));
  const theoId = new Map(posts.map((p) => [p.post_id, p]));
  const cum = new Map();
  for (const [anhId, chuId] of ganBaiAnh(chu, anh)) {
    if (!cum.has(chuId)) cum.set(chuId, []);
    cum.get(chuId).push(anhId);
  }
  const theoNguoi = new Map();
  for (const c of chu) {
    if (!c.sender_id || !c.conversation_id) continue;
    const k = `${c.conversation_id}|${c.sender_id}`;
    if (!theoNguoi.has(k)) theoNguoi.set(k, []);
    theoNguoi.get(k).push(c);
  }
  // Số tin chữ gần của cả cụm là số lớn nhất: dòng đại diện không được mất cờ vì bài ảnh khác của cụm mới là ca lệch.
  const chuGan = (id) => {
    const a = theoId.get(id);
    return a ? soChuGan(theoNguoi.get(`${a.conversation_id}|${a.sender_id}`) ?? [], a) : 0;
  };
  const cuaCum = (chuId) => {
    const ds = [...(cum.get(chuId) ?? [])].sort((x, y) => giay(theoId.get(x).posted_at) - giay(theoId.get(y).posted_at) || x.localeCompare(y));
    return { chu_ref: chuId, anh_refs: ds, so_chu_gan: Math.max(...ds.map(chuGan)), trung_voi: null };
  };
  const gan = ganBaiAnh(chu, anh);
  const out = new Map();
  const daiDien = new Map();
  for (const it of [...items].sort((a, b) => Number(a.item_id) - Number(b.item_id))) {
    const p = theoId.get(it.ref_id);
    let g = null;
    if (p) {
      if (laChiAnh(p.text)) {
        const chuId = gan.get(p.post_id);
        g = chuId ? cuaCum(chuId) : { chu_ref: null, anh_refs: [p.post_id], so_chu_gan: 0, trung_voi: null };
      } else if (cum.has(p.post_id)) {
        g = cuaCum(p.post_id);
      }
    }
    if (g?.chu_ref) {
      if (daiDien.has(g.chu_ref)) g.trung_voi = daiDien.get(g.chu_ref);
      else daiDien.set(g.chu_ref, it.ref_id);
    }
    out.set(String(it.item_id), g);
  }
  return out;
}
