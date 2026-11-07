// ghep-mau.mjs — hồ sơ ghep-anh-tren-the-gan-nhan: ghép của từng dòng mẫu gắn nhãn, bằng đúng luật PL28 ở gop-anh.mjs.
// Hàm thuần, không import pg. Bên đọc là app/src/lib/labels-anh.ts (`docGhep`), app không import pipeline nên đọc qua cột.
import { khoaTrung } from "./eval-labels.mjs";
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

/**
 * Dấu trùng theo khoá của lay-mau-khu-trung-theo-tin, chạy sau ghepChoMau. Khoá của thẻ = khoaTrung trên bài chữ (chu_ref của cụm,
 * hay chính bài khi không có cụm). Mỗi nhóm khoá còn đúng một thẻ hiện.
 * - Dòng có `an_tay` (Mạnh ẩn tay) giữ nguyên, không bao giờ bị gỡ hay đổi đích.
 * - Thẻ đã ẩn vì cụm ảnh không xét lại.
 * - Thẻ giữ: nhiều dòng nhãn nhất → được dấu ẩn tay trỏ tới → item_id nhỏ nhất.
 * - Thẻ còn lại nhận `trung_voi` = ref_id thẻ giữ và `khu_trung` "tin" | "chu".
 * @param {{ item_id: number|string, ref_id: string, ghep_cu?: object|null }[]} items
 * @param {Map<string, object|null>} ghep kết quả ghepChoMau
 * @param {{ posts: { post_id: string, text?: string|null }[], tinCua: Map<string, string>, soNhan: Map<string, number> }} opts
 * @returns {{ ghep: Map<string, object|null>, an_moi: number, an_tay_giu: number, an_them: { item_id: string, khoa: string }[] }}
 */
export function nhomTrung(items, ghep, { posts, tinCua, soNhan }) {
  const theoId = new Map(posts.map((p) => [p.post_id, p]));
  const out = new Map(ghep);
  const laAnTay = (it) => typeof it.ghep_cu?.an_tay === "string" && it.ghep_cu.an_tay !== "";
  const anTay = items.filter(laAnTay);
  for (const it of anTay) out.set(String(it.item_id), it.ghep_cu);
  const duocTro = new Set(anTay.map((it) => it.ghep_cu.trung_voi).filter(Boolean));
  const nhom = new Map();
  for (const it of [...items].sort((a, b) => Number(a.item_id) - Number(b.item_id))) {
    const g = out.get(String(it.item_id)) ?? null;
    if (!laAnTay(it) && g?.trung_voi) continue;
    const chuId = g ? g.chu_ref : it.ref_id;
    const bai = chuId ? theoId.get(chuId) : null;
    if (!bai || laChiAnh(bai.text)) continue;
    const khoa = khoaTrung(bai, tinCua);
    if (!khoa) continue;
    if (!nhom.has(khoa)) nhom.set(khoa, []);
    nhom.get(khoa).push(it);
  }
  const anThem = [];
  for (const [khoa, ds] of nhom) {
    const ung = ds.filter((it) => !laAnTay(it));
    if (ds.length < 2 || ung.length === 0) continue;
    const nhan = (it) => soNhan.get(String(it.item_id)) ?? 0;
    const [giu, ...con] = [...ung].sort((a, b) => nhan(b) - nhan(a)
      || Number(duocTro.has(b.ref_id)) - Number(duocTro.has(a.ref_id))
      || Number(a.item_id) - Number(b.item_id));
    // Nhóm có dấu ẩn tay mà mọi thẻ chưa ẩn đã là thẻ giữ duy nhất: không có gì để ẩn thêm.
    for (const it of con) {
      const id = String(it.item_id);
      const g = out.get(id) ?? { chu_ref: it.ref_id, anh_refs: [], so_chu_gan: 0, trung_voi: null };
      out.set(id, { ...g, trung_voi: giu.ref_id, khu_trung: khoa.startsWith("o:") ? "tin" : "chu" });
      anThem.push({ item_id: id, khoa });
    }
  }
  return { ghep: out, an_moi: anThem.length, an_tay_giu: anTay.length, an_them: anThem };
}
