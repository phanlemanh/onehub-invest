// do-lam-giau-db.mjs — DO3 do-lam-giau: dò và nạp migration 086 (ảnh chụp giá trị làm giàu + dòng đổi theo ngày).
// KHÔNG dùng napLamGiau ngoài giao dịch sẽ ROLLBACK: áp 086 lên DB máy thu là bước triển khai riêng (Mạnh duyệt, có pg_dump trước).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { khoangNgay } from "../mau-soat-cuon-chieu.mjs";
import { docNguoiCuaTaiKhoan, KENH_LIEN_LAC, SQL_LL } from "./lien-lac-nguoi.mjs";
import { daCoBang079 } from "./nap-079.mjs";

export const SO_MIG = "086";
export const MIG_086 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/086_lam_giau.sql"), "utf8");

/** Hai bảng của 086 có chưa (theo search_path). Dò bằng to_regclass, không bắt lỗi: lỗi SELECT làm hỏng giao dịch của người gọi.
 * @param {import("pg").Client} client */
export async function daCoLamGiau(client) {
  const { rows } = await client.query(
    "SELECT to_regclass('enrichment_value_state') IS NOT NULL AND to_regclass('enrichment_value_change') IS NOT NULL AS co");
  return rows[0].co;
}

/** Nạp 086 trong giao dịch đang mở khi chưa có (giữ khoá 33033 như các bộ nạp migration khác của test).
 * @param {import("pg").Client} client đang ở trong giao dịch @returns {Promise<boolean>} true khi vừa áp */
export async function napLamGiau(client) {
  if (await daCoLamGiau(client)) return false;
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(MIG_086);
  return true;
}

// ================= Bộ đọc của DO3 (chỉ SELECT) =================
/**
 * Đường đã lập mốc chưa, khi ảnh chụp rỗng: ảnh chụp rỗng có hai nghĩa — chưa từng lập mốc, hoặc đã lập mốc mà mọi giá trị đã rời
 * đường. Dấu bền là một dòng `do3-thay-doi` cũ của đường không phải «chưa chạy» (lập mốc hay pass).
 * @param {import("pg").Client} c @param {string} duong
 */
export async function daLapMoc(c, duong) {
  const { rows } = await c.query(
    `SELECT 1 FROM dq_check_results WHERE check_name = 'do3-thay-doi' AND entity = $1
        AND coalesce(detail::jsonb ->> 'ly_do', '') <> 'chua-chay' LIMIT 1`, [duong]);
  return rows.length > 0;
}

/**
 * Giá trị sống của một đường trên tin: Map `subject_key → {value_key, offer_id}`. `rule_ids` rỗng → Map rỗng («chưa chạy»).
 * - `so-tren-tin`: tin S03 sống mang dấu số suy; khoá `tin:<offer_id>`, value_key là băm số (`seller_phone_hash`), không bao giờ là số.
 * - `phat-bieu`: phát biểu sống `resource_name = 'Property'`; khoá `<subject_key>|<field>`; chỉ phát biểu nối được tin sống (qua
 *   `offer_subject_keys` của 045) — giá trị trên vật thể toà (Building) không phải giá trị trên tin.
 * @param {import("pg").Client} c @param {{doc: string, rule_ids: readonly string[], duong: string}} d
 */
export async function docGiaTriSong(c, d, { dotBien } = {}) {
  if (dotBien === "toa-thanh-tin" && d.duong === "danh-muc-cdt") {
    const { rows } = await c.query(
      `SELECT subject_key || '|' || field AS k, value_key FROM field_assertions
        WHERE retracted_at IS NULL AND resource_name = 'Building' AND field = 'area_id' AND method = 'registry_inherit'`);
    return new Map(rows.map((r) => [r.k, { value_key: r.value_key, offer_id: null }]));
  }
  if (!d.rule_ids.length) return new Map();
  if (d.doc === "so-tren-tin") {
    const { rows } = await c.query(
      `SELECT offer_id, seller_phone_hash FROM sale_offer_records
        WHERE source = 'S03' AND retired_at IS NULL AND seller_phone_hash IS NOT NULL
          AND field_provenance -> 'seller_phone' ->> 'rule_id' = ANY ($1::text[])`, [[...d.rule_ids]]);
    return new Map(rows.map((r) => [`tin:${r.offer_id}`, { value_key: r.seller_phone_hash, offer_id: r.offer_id }]));
  }
  const { rows } = await c.query(
    `WITH fa AS (SELECT subject_key, field, value_key FROM field_assertions
                  WHERE retracted_at IS NULL AND resource_name = 'Property' AND rule_id = ANY ($1::text[])),
          sk AS (SELECT o.offer_id, unnest(offer_subject_keys(o.source, o.originating_system_key, o.post_ids)) AS s FROM sale_offers o
                  WHERE o.source IN (SELECT DISTINCT split_part(subject_key, ':', 1) FROM fa))
     SELECT DISTINCT ON (fa.subject_key, fa.field) fa.subject_key || '|' || fa.field AS k, fa.value_key, sk.offer_id
       FROM fa JOIN sk ON sk.s = fa.subject_key
      ORDER BY fa.subject_key, fa.field, fa.value_key, sk.offer_id`, [[...d.rule_ids]]);
  return new Map(rows.map((r) => [r.k, { value_key: r.value_key, offer_id: r.offer_id }]));
}

/**
 * Chủ thể có phát biểu của đường bị NGƯỜI rút trong ngày VN (`hitl-thay`, `hoan-tac:*` của 045). Đường không có lối người rút → rỗng.
 * @returns {Promise<Set<string>>} khoá `<subject_key>|<field>`
 */
export async function docNguoiRut(c, d, ngay, { dotBien } = {}) {
  if (!d.nguoi_rut || !d.rule_ids.length) return new Set();
  const [tu, den] = khoangNgay(ngay);
  const { rows } = await c.query(
    `SELECT DISTINCT subject_key || '|' || field AS k FROM field_assertions
      WHERE rule_id = ANY ($1::text[]) AND retracted_at >= $2 AND retracted_at < $3
        AND (retract_reason = 'hitl-thay' OR retract_reason LIKE 'hoan-tac:%' ${dotBien === "may-rut-thanh-nguoi" ? "OR retract_reason = 'thay-boi-luot'" : ""})`,
    [[...d.rule_ids], tu, den]);
  return new Set(rows.map((r) => r.k));
}

/**
 * Phát biểu `hitl` (lối người của 045, `apply_enrichment`) ghi trong ngày VN trên tin (`resource_name = 'Property'`), kể cả đã bị
 * phát biểu `hitl` sau thay. Khoá `<subject_key>|<field>` như giá trị sống của đường phát biểu. Đường không có lối ghi đè → rỗng.
 * @returns {Promise<{k: string, value_key: string}[]>}
 */
export async function docNguoiDe(c, d, ngay, { dotBien } = {}) {
  if (!d.nguoi_de || !d.rule_ids.length) return [];
  const [tu, den] = khoangNgay(ngay);
  const { rows } = await c.query(
    `SELECT subject_key || '|' || field AS k, value_key FROM field_assertions
      WHERE method = 'hitl' AND resource_name = 'Property' AND created_at >= $1::timestamptz AND created_at < $2::timestamptz`,
    [dotBien === "de-ngoai-ngay" ? "-infinity" : tu, den]);
  return rows;
}

/**
 * Nhãn người (`eval_labels`) gắn trong ngày VN, ô `d.o_nhan`, trên bài của tin S03 sống đang mang giá trị đường, kèm `gia_tri` của
 * đường. Với số: `gia_tri` là số thật, chỉ để so trong bộ nhớ — không bao giờ vào detail. Mỗi (thẻ, người gắn, ô) lấy nhãn mới nhất.
 * @returns {Promise<{value: string|null, not_stated: boolean, gia_tri: string, labeler_id: string, item_id: number, ref_id: string, offer_id: string}[]>}
 */
export async function docNhanNgay(c, d, ngay, { dotBien } = {}) {
  if (!d.o_nhan || !d.rule_ids.length) return [];
  const [tu, den] = khoangNgay(ngay);
  const tuLuc = dotBien === "nhan-ngoai-ngay" ? "-infinity" : tu;
  const giaTri = d.doc === "so-tren-tin"
    ? `JOIN LATERAL (SELECT r.offer_id, r.seller_phone AS gia_tri FROM sale_offer_records r
                      WHERE r.source = 'S03' AND r.retired_at IS NULL AND n.ref_id = ANY (r.post_ids) AND r.seller_phone IS NOT NULL
                        AND r.field_provenance -> 'seller_phone' ->> 'rule_id' = ANY ($4::text[])
                      ORDER BY r.offer_id LIMIT 1) g ON true`
    : `JOIN LATERAL (SELECT r.offer_id, fa.value AS gia_tri FROM sale_offer_records r
                      JOIN field_assertions fa ON fa.retracted_at IS NULL AND fa.resource_name = 'Property' AND fa.field = n.field
                       AND fa.rule_id = ANY ($4::text[]) AND fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
                      WHERE r.source = 'S03' AND r.retired_at IS NULL AND n.ref_id = ANY (r.post_ids)
                      ORDER BY r.offer_id, fa.value_key LIMIT 1) g ON true`;
  const { rows } = await c.query(
    `WITH n AS (SELECT DISTINCT ON (l.item_id, l.labeler_id, l.field) l.item_id, l.labeler_id, l.field, l.value, l.not_stated, i.ref_id
                  FROM eval_labels l JOIN eval_label_items i USING (item_id)
                 WHERE i.source_code = 'S03' AND l.field = $1 AND l.labeled_at >= $2::timestamptz AND l.labeled_at < $3::timestamptz
                 ORDER BY l.item_id, l.labeler_id, l.field, l.labeled_at DESC)
     SELECT n.*, g.offer_id, g.gia_tri FROM n ${giaTri}`, [d.o_nhan, tuLuc, den, [...d.rule_ids]]);
  return rows.map((r) => ({ ...r, item_id: Number(r.item_id) }));
}

/**
 * Vị trí của tin đúng khuôn đơn vị mà `KHOA_LAT_DON_VI` (DO1) đọc: thị trường, phường từ `area_id` qua `areas`; dự án từ
 * `properties.project_node` qua `property_offers`; toà chưa có liên kết tin → toà (PL20), `core.toa_chu` = tin có chữ toà.
 * @param {string[]} offerIds
 */
export async function docViTriTin(c, offerIds) {
  const ids = [...new Set(offerIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const { rows } = await c.query(
    `SELECT o.offer_id, w.id AS ward_id, m.id AS market_id, coalesce(o.block_raw <> '', false) AS toa_chu,
            (SELECT min(p.project_node) FROM property_offers po JOIN properties p ON p.id = po.property_id
              WHERE po.offer_id = o.offer_id) AS project_node
       FROM sale_offer_records o
       LEFT JOIN areas w ON w.id = o.area_id AND w.region_type = 'submarket'
       LEFT JOIN areas m ON m.region_type = 'market' AND m.id IN (o.area_id, (SELECT parent_id FROM areas WHERE id = o.area_id))
      WHERE o.offer_id = ANY ($1::text[])`, [ids]);
  return new Map(rows.map((r) => [r.offer_id, {
    market_id: r.market_id, ward_id: r.ward_id, project_key: r.project_node ? `node:${r.project_node}` : null, building_key: null,
    core: { toa_chu: r.toa_chu },
  }]));
}

/**
 * Đầu vào kiểm ngược số qua người đăng — đúng nguồn bộ dựng liên lạc đọc (bài kênh S03 có người gửi, tin S03 có số kể cả đã nghỉ;
 * tập đo chỉ lấy tin sống). Chỉ dùng trong bộ nhớ: số và chữ bài không vào detail. Chưa áp 079 → null.
 */
export async function docBaiNguoi(c) {
  if (!(await daCoBang079(c))) return null;
  const bai = (await c.query(SQL_LL.bai, [KENH_LIEN_LAC])).rows;
  const { rows: tins } = await c.query(
    `SELECT offer_id, seller_ref, seller_phone, field_provenance, post_ids, retired_at IS NULL AS song
       FROM sale_offer_records WHERE source = 'S03' AND seller_phone IS NOT NULL`);
  return { bai, tins, nguoiCuaTaiKhoan: await docNguoiCuaTaiKhoan(c) };
}

/**
 * Đầu vào kiểm ngược loại hình theo nhóm: bài S03 mới nhất mỗi post_id của kênh Zalo (cùng câu với loadStgPosts của transform; lọc bài
 * thử nằm ở hàm thuần) và tin sống của từng bài để lát. Chữ bài chỉ dùng trong bộ nhớ.
 */
export async function docBaiNhom(c) {
  const { rows: bai } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name, conversation_id, text
       FROM stg_zalo_posts WHERE agent_id IS NULL OR agent_id <> 'apify-facebook' ORDER BY post_id, captured_at DESC`);
  const { rows: tin } = await c.query(
    `SELECT DISTINCT ON (pid) pid, offer_id FROM sale_offers, unnest(post_ids) pid WHERE source = 'S03' ORDER BY pid, offer_id`);
  return { bai, tinCuaBai: new Map(tin.map((r) => [r.pid, r.offer_id])) };
}
