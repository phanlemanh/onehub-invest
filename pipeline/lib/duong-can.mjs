// duong-can.mjs — DS1: căn nhận đường từ tin của nó, cuối Stage A của resolve-properties. Chỉ điền ô đang trống, lấy từ tin
// còn sống có đường thấy gần nhất (hoà thì offer_id nhỏ nhất), mỗi ô điền ghi một mục enrichment_log. Cùng nếp COALESCE của 066.
// `q` là client đã bọc thử lại deadlock (thu-lai-deadlock.mjs).

const SRC = "resolve-properties";

/** @returns {Promise<number>} số căn vừa được điền */
export async function dienDuongCan(q) {
  const { rowCount } = await q.query(
    `WITH chon AS (
       SELECT DISTINCT ON (po.property_id) po.property_id, o.street_raw, o.offer_id
         FROM property_offers po
         JOIN sale_offers o ON o.offer_id = po.offer_id
        WHERE NULLIF(btrim(o.street_raw), '') IS NOT NULL
        ORDER BY po.property_id, o.last_seen DESC, o.offer_id ASC)
     UPDATE properties p
        SET street = chon.street_raw,
            enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
              'src', $1::text, 'field', 'street', 'value', chon.street_raw, 'offer_id', chon.offer_id, 'at', now()))
       FROM chon
      WHERE p.id = chon.property_id AND NULLIF(btrim(p.street), '') IS NULL`,
    [SRC],
  );
  return rowCount;
}

/**
 * Trả về trống đúng các ô do dienDuongCan điền: mục cuối của nguồn này chưa hoàn tác và ô còn đúng giá trị đã ghi. Mỗi ô trả về
 * thêm một mục `hoan_tac`, log không bị xoá.
 * @returns {Promise<number>} số ô đã trả về trống
 */
export async function hoanTacDuong(q) {
  const { rowCount } = await q.query(
    `WITH cuoi AS (
       SELECT p.id, e.muc
         FROM properties p
         CROSS JOIN LATERAL (
           SELECT x AS muc FROM jsonb_array_elements(p.enrichment_log) WITH ORDINALITY t(x, i)
            WHERE x->>'src' = $1 AND x->>'field' = 'street'
            ORDER BY i DESC LIMIT 1) e
        WHERE NOT e.muc ? 'hoan_tac')
     UPDATE properties p
        SET street = NULL,
            enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
              'src', $1::text, 'field', 'street', 'value', p.street, 'hoan_tac', true, 'at', now()))
       FROM cuoi
      WHERE p.id = cuoi.id AND p.street = cuoi.muc->>'value'`,
    [SRC],
  );
  return rowCount;
}
