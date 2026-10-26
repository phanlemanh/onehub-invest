// nap-lai-matrix.mjs — ma trận đếm quyết định + liên kết của PL14 (nap-lai-khong-xoa AC-5, AC-7).
// Bảy hàng × hai cột, chụp trước và sau một lượt nạp rồi so:
//   co_mat        — tập định danh dòng con còn có mặt (id của dòng; property_offers theo căn; nights/listing_stats đếm)
//   tro_cha_song  — dòng con có cha sống, hoặc cha đã nghỉ HẲN (không tin kế); dòng nằm trên tin đã có tin kế = treo
// Hàng nào sau ít hơn trước ở cột nào thì «mất». Chỉ đọc; người gọi giữ transaction.

/** Tên bảy hàng theo thứ tự in. */
export const HANG = [
  "de_xuat_da_quyet", "the_review_da_quyet", "ung_vien_merged_rejected", "property_offers", "the_pair", "nights", "listing_stats",
];

// Cha của tin: sống, hoặc nghỉ hẳn (superseded_by NULL). Dòng con trỏ tin đã có tin kế là treo.
const TIN_OK = `(SELECT offer_id FROM sale_offer_records WHERE retired_at IS NULL OR superseded_by IS NULL)`;

/** Dòng con đếm theo định danh (mảng text) — mỗi hàng: [sql có_mặt, sql trỏ_cha_sống]. */
const SQL = {
  de_xuat_da_quyet: [
    `SELECT id::text AS k FROM enrichment_proposals WHERE status IN ('applied','rejected','reverted','skipped')`,
    `SELECT id::text AS k FROM enrichment_proposals WHERE status IN ('applied','rejected','reverted','skipped') AND offer_id IN ${TIN_OK}`,
  ],
  the_review_da_quyet: [
    `SELECT id::text AS k FROM review_queue WHERE item_type = 'agent_output' AND item_id LIKE 'enrich:%' AND status IN ('approved','rejected')`,
    `SELECT id::text AS k FROM review_queue WHERE item_type = 'agent_output' AND item_id LIKE 'enrich:%' AND status IN ('approved','rejected')
       AND substr(item_id, 8) IN ${TIN_OK}`,
  ],
  ung_vien_merged_rejected: [
    `SELECT id::text AS k FROM property_candidates WHERE status IN ('merged','rejected')`,
    `SELECT id::text AS k FROM property_candidates WHERE status IN ('merged','rejected') AND offer_a IN ${TIN_OK} AND offer_b IN ${TIN_OK}`,
  ],
  property_offers: [
    `SELECT DISTINCT property_id::text AS k FROM property_offers`,
    `SELECT DISTINCT property_id::text AS k FROM property_offers WHERE offer_id IN ${TIN_OK}`,
  ],
  the_pair: [
    `SELECT id::text AS k FROM review_queue WHERE item_type = 'entity_match' AND item_id LIKE 'pair:%'`,
    `SELECT id::text AS k FROM review_queue WHERE item_type = 'entity_match' AND item_id LIKE 'pair:%'
       AND split_part(substr(item_id, 6), '|', 1) IN ${TIN_OK} AND split_part(substr(item_id, 6), '|', 2) IN ${TIN_OK}`,
  ],
  // Listing không có tin kế: cha còn dòng trong listing_records là đủ (nghỉ ngoài phường vẫn giữ đêm).
  nights: [`SELECT count(*)::text AS k FROM nights`, `SELECT count(*)::text AS k FROM nights n JOIN listing_records l ON l.id = n.listing_id`],
  listing_stats: [
    `SELECT listing_id AS k FROM listing_stats`,
    `SELECT s.listing_id AS k FROM listing_stats s JOIN listing_records l ON l.id = s.listing_id`,
  ],
};
const DEM = new Set(["nights"]);

/** Chụp ma trận: { hàng: { co_mat: Set|number, tro_cha_song: Set|number } }. */
export async function chupMaTran(client) {
  const out = {};
  for (const h of HANG) {
    const [a, b] = await Promise.all(SQL[h].map((q) => client.query(q)));
    const doc = (r) => (DEM.has(h) ? Number(r.rows[0].k) : new Set(r.rows.map((x) => x.k)));
    out[h] = { co_mat: doc(a), tro_cha_song: doc(b) };
  }
  return out;
}

const n = (v) => (typeof v === "number" ? v : v.size);
const thieu = (truoc, sau) => (typeof truoc === "number" ? Math.max(0, truoc - sau) : [...truoc].filter((k) => !sau.has(k)).length);

/** So hai lần chụp → [{ hang, cot, truoc, sau, mat }] chỉ gồm ô có mất. */
export function soMaTran(truoc, sau) {
  const mat = [];
  for (const h of HANG) for (const cot of ["co_mat", "tro_cha_song"]) {
    const m = thieu(truoc[h][cot], sau[h][cot]);
    if (m > 0) mat.push({ hang: h, cot, truoc: n(truoc[h][cot]), sau: n(sau[h][cot]), mat: m });
  }
  return mat;
}

/** Bảng in: một dòng mỗi hàng, «trước→sau» cho hai cột. */
export function inMaTran(truoc, sau) {
  return HANG.map((h) => `${h.padEnd(26)} co_mat ${n(truoc[h].co_mat)}→${n(sau[h].co_mat)} · tro_cha_song ${n(truoc[h].tro_cha_song)}→${n(sau[h].tro_cha_song)}`).join("\n");
}
