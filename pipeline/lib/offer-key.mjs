// offer-key.mjs — PL14: khoá tin bền cho S03/S05 (khoá dính, PL14-Hỏi-3 Mạnh duyệt 26/10).
// Tin «khoá mới» luôn thoả offer_id = 'offer_' + sha256(<nguồn>|<originating_system_key>)[:16]. Nhóm repost của lượt
// nạp thừa kế offer_id của tin khoá mới có chung nhiều post nhất; nhóm hoàn toàn mới băm nguồn|post neo (post sớm nhất).
// Tin khoá băm nội dung đời trước không thoả bất biến nên không được thừa kế → lượt đầu sau 044 đổi khoá (PL14-Hỏi-2),
// đối soát gắn lý do `doi_khoa` (migration 044).
import { createHash } from "node:crypto";

/** Khoá mới của một tin từ nguồn + khoá gốc nguồn. */
export function mintOfferId(source, osk) {
  return `offer_${createHash("sha256").update(`${source}|${osk}`).digest("hex").slice(0, 16)}`;
}

/** Tin mang khoá mới (bất biến của khoá dính)? */
export const isNewScheme = (source, offerId, osk) => osk != null && offerId === mintOfferId(source, osk);

const t = (x) => (x == null ? Number.POSITIVE_INFINITY : new Date(x).getTime());

/** Post neo của nhóm: posted_at sớm nhất, hoà thì post_id nhỏ nhất. */
export function anchorPost(posts) {
  return [...posts].sort((a, b) => t(a.posted_at) - t(b.posted_at) || String(a.post_id).localeCompare(String(b.post_id)))[0].post_id;
}

/**
 * Gán offer_id cho các nhóm repost của một lượt.
 * @param source  'S03' | 'S05'
 * @param groups  [{ posts: [{post_id, posted_at}] }] — thứ tự đầu vào giữ nguyên ở đầu ra
 * @param existing [{ offer_id, originating_system_key, post_ids }] — tin đã có của nguồn (kể cả đã nghỉ)
 * @returns [{ offer_id, originating_system_key }] cùng thứ tự groups
 */
export function assignOfferIds(source, groups, existing) {
  const owners = new Map(); // post_id → các tin khoá mới có post đó (tin đã nghỉ vẫn giữ post_ids của nó)
  const moi = existing.filter((e) => isNewScheme(source, e.offer_id, e.originating_system_key));
  for (const e of moi) for (const p of e.post_ids ?? []) owners.set(p, [...(owners.get(p) ?? []), e]);
  const anchors = groups.map((g) => {
    const id = anchorPost(g.posts);
    return { id, at: t(g.posts.find((p) => p.post_id === id).posted_at) };
  });
  // Ứng viên thừa kế: (nhóm, tin cũ, số post chung). Nhận tham lam: chung nhiều nhất trước; hoà thì tin còn sống
  // trước tin đã nghỉ, rồi neo sớm hơn, rồi offer_id — thứ tự toàn phần nên kết quả không phụ thuộc thứ tự đầu vào.
  const cand = [];
  groups.forEach((g, i) => {
    const dem = new Map();
    for (const p of g.posts) for (const e of owners.get(p.post_id) ?? []) dem.set(e.offer_id, { e, n: (dem.get(e.offer_id)?.n ?? 0) + 1 });
    for (const { e, n } of dem.values()) cand.push({ i, e, n });
  });
  const nghi = (e) => (e.retired_at ? 1 : 0);
  cand.sort((a, b) => b.n - a.n || nghi(a.e) - nghi(b.e) || anchors[a.i].at - anchors[b.i].at || a.e.offer_id.localeCompare(b.e.offer_id));
  const out = new Array(groups.length).fill(null);
  const daNhan = new Set();
  for (const c of cand) {
    if (out[c.i] || daNhan.has(c.e.offer_id)) continue;
    out[c.i] = { offer_id: c.e.offer_id, originating_system_key: c.e.originating_system_key };
    daNhan.add(c.e.offer_id);
  }
  // Nhóm mới: băm post neo; nếu id đó đã thuộc tin khác (nhóm tách ra mà neo trùng khoá gốc của tin vừa bị nhóm khác
  // nhận) thì thử post kế theo thứ tự neo; hết post thì `<neo>#2`, `<neo>#3`… — không bao giờ cấp trùng id, không ném.
  const dung = new Set(moi.map((e) => e.offer_id));
  for (const o of out) if (o) dung.add(o.offer_id);
  const cap = (osk) => {
    const id = mintOfferId(source, osk);
    if (dung.has(id)) return null;
    dung.add(id);
    return { offer_id: id, originating_system_key: osk };
  };
  return out.map((o, i) => {
    if (o) return o;
    const thuTu = [...groups[i].posts].sort((a, b) => t(a.posted_at) - t(b.posted_at) || String(a.post_id).localeCompare(String(b.post_id)));
    for (const p of thuTu) { const r = cap(String(p.post_id)); if (r) return r; }
    for (let k = 2; ; k++) { const r = cap(`${anchors[i].id}#${k}`); if (r) return r; }
  });
}

/**
 * Gán khoá dính cho các nhóm repost của một lượt nạp, đọc tin đã có của nguồn từ bảng bản ghi (044, kể cả tin đã nghỉ).
 * Người gọi giữ transaction.
 * @param {import("pg").Client} client
 * @param {string} source
 * @param {{ posts: { post_id: string, posted_at: unknown }[] }[]} groups
 */
export async function assignStickyIds(client, source, groups) {
  const { rows } = await client.query(
    `SELECT offer_id, originating_system_key, post_ids, retired_at FROM sale_offer_records WHERE source = $1`, [source]);
  return assignOfferIds(source, groups, rows);
}
