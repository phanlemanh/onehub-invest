// nap-lai-matrix.mjs — ma trận đếm quyết định + liên kết của PL14 (nap-lai-khong-xoa AC-5, AC-7).
// Bảy hàng × hai cột, chụp trước và sau một lượt nạp rồi so:
//   co_mat        — tập định danh dòng con còn có mặt (id của dòng; property_offers theo căn; nights/listing_stats đếm)
//   tro_cha_song  — dòng con có cha sống, hoặc cha đã nghỉ HẲN (không tin kế); dòng nằm trên tin đã có tin kế = treo
// Hàng nào sau ít hơn trước ở cột nào thì «mất». Chụp chỉ đọc; hai hàm gieo ghi fixture — người gọi giữ transaction
// (ROLLBACK).
import { createHash } from "node:crypto";

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

/** Gắn quyết định thử lên tin thật của nguồn: đề xuất đã quyết + thẻ enrich đã duyệt, ứng viên merged + thẻ pair,
 *  và một căn chỉ liên kết với tin ấy. Người gọi giữ transaction (ROLLBACK). */
export async function gieoQuyetDinh(client, source) {
  const { rows } = await client.query(
    `SELECT offer_id FROM sale_offers WHERE source = $1 AND cardinality(post_ids) > 0 ORDER BY offer_id LIMIT 2`, [source]);
  if (rows.length < 2) return 0;
  const [a, b] = rows.map((r) => r.offer_id);
  await client.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, decided_by, evidence)
    VALUES ('nap-lai', $1, 'block_raw', 'thu', 'thu', 'e2_llm', 'review', 'rejected', 'hitl:manh', '{}'::jsonb)`, [a]);
  await client.query(`INSERT INTO review_queue (item_type, item_id, title, evidence, status, decided_by, decided_at)
    VALUES ('agent_output', $1, 'thẻ thử', '{}'::jsonb, 'approved', 'hitl:manh', now())`, [`enrich:${a}`]);
  await client.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status, decided_by)
    VALUES ($1, $2, 0.9, 'merged', 'hitl:manh') ON CONFLICT (offer_a, offer_b) DO UPDATE SET status = 'merged'`, [a, b]);
  await client.query(`INSERT INTO review_queue (item_type, item_id, title, evidence, status, decided_by, decided_at)
    VALUES ('entity_match', $1, 'cặp thử', '{}'::jsonb, 'approved', 'hitl:manh', now())`, [`pair:${a}|${b}`]);
  // Liên kết căn chỉ trỏ tin này — căn mất liên kết duy nhất thì hàng property_offers đếm mất.
  const { rows: [p] } = await client.query(
    `INSERT INTO properties (kind, cluster_key, resolved_by) VALUES ('sale', 'nap-lai-' || $1, 'test') RETURNING id`, [a]);
  await client.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [p.id, a]);
  return 2;
}

/** Tin khoá cũ cố định: chép một tin sống của nguồn (cùng post_ids), offer_id kiểu băm nội dung (không thoả bất biến khoá
 *  mới), gắn đề xuất đã quyết + thẻ đã duyệt + một căn chỉ liên kết với nó. Có mặt dù DB thật đã đổi khoá — lượt nạp
 *  kế luôn phải cho nó nghỉ 'doi_khoa' và chuyển dòng con sang tin kế. Trả { id, de, can } hoặc null khi nguồn trống. */
export async function gieoTinKhoaCu(client, source, tag) {
  const { rows: [goc] } = await client.query(
    `SELECT * FROM sale_offers WHERE source = $1 AND cardinality(post_ids) > 0 ORDER BY offer_id LIMIT 1`, [source]);
  if (!goc) return null;
  const id = "offer_" + createHash("sha256").update(`${tag}|${source}|${process.pid}`).digest("hex").slice(0, 16);
  await client.query(`INSERT INTO sale_offer_records (offer_id, source, kind, confidence, first_seen, last_seen, n_reposts, post_ids, price_tier, area_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, source, goc.kind, goc.confidence, goc.first_seen, goc.last_seen, goc.n_reposts, goc.post_ids, goc.price_tier, goc.area_id]);
  const { rows: [de] } = await client.query(`INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status, decided_by, evidence)
    VALUES ($1, $2, 'street_raw', 'thu', 'thu', 'e2_llm', 'review', 'rejected', 'hitl:manh', '{}'::jsonb) RETURNING id`, [tag, id]);
  await client.query(`INSERT INTO review_queue (item_type, item_id, title, evidence, status, decided_by, decided_at)
    VALUES ('agent_output', $1, 'thẻ thử', '{}'::jsonb, 'approved', 'hitl:manh', now())`, [`enrich:${id}`]);
  const { rows: [can] } = await client.query(
    `INSERT INTO properties (kind, cluster_key, resolved_by) VALUES ('sale', $1, 'test') RETURNING id`, [`${tag}-${id}`]);
  await client.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [can.id, id]);
  return { id, de: Number(de.id), can: Number(can.id) };
}
