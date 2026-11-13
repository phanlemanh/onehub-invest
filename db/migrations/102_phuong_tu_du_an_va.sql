-- 102_phuong_tu_du_an_va.sql — DA9 phuong-tu-du-an, vá hàm resolve_offer_area_du_an của 099 (GS quyết sửa trước lượt chấm 3, 13/11).
-- docs/superpowers/specs/2026-11-13-phuong-tu-du-an-design.md §2 · _acceptance/phuong-tu-du-an/
-- Lỗi: hàm 099 lấy phường kế thừa thẳng từ field_assertions.value. Phát biểu chỉ được kiểm là phường lúc ghi, value không có
-- khoá ngoại tới areas; reassign-areas --xoa-khu-vuc-lac đặt NULL cho tin rồi XOÁ khu vực lạc mà không rút phát biểu. Lượt
-- phân xử kế đưa mã đã xoá vào sale_offer_records.area_id → vỡ khoá ngoại sale_offers_area_id_fkey, cả lệnh resolve_offer_fields
-- (và transform gọi nó) dừng. Vá: chỉ nhận giá trị có dòng areas cấp submarket; còn lại như 099.
-- Định nghĩa lại trọn hàm (hàm chỉ 099 định nghĩa, không chèn mốc). Áp lại được. Thứ tự áp trên máy: 099 rồi 102, một lượt;
-- áp lại 099 sau 102 thì phải áp lại 102.
-- Áp lên DB máy thu/cloud là bước triển khai riêng (lời Mạnh sau gộp, pg_dump trước).

CREATE OR REPLACE FUNCTION resolve_offer_area_du_an(p_offer_ids text[])
RETURNS integer LANGUAGE sql AS $$
  WITH o AS (
    SELECT r.offer_id, r.area_id AS cot, r.field_provenance -> 'area_id' AS fp,
           coalesce(r.field_provenance -> 'area_id' ->> 'nguon' = 'du-an', false) AS la_nhan,
           offer_subject_keys(r.source, r.originating_system_key, r.post_ids) AS subj
      FROM sale_offer_records r
     WHERE p_offer_ids IS NULL OR r.offer_id = ANY (p_offer_ids)
  ), g AS (
    SELECT o.*, CASE WHEN o.la_nhan AND o.fp ->> 'v' IS NOT DISTINCT FROM o.cot THEN o.fp ->> 'goc' ELSE o.cot END AS goc
      FROM o
  ), sk AS (
    SELECT DISTINCT g.offer_id, unnest(g.subj) AS subject_key FROM g
  ), k AS (
    SELECT sk.offer_id, array_agg(DISTINCT fa.value ORDER BY fa.value) AS ws
      FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.retracted_at IS NULL
                                     AND fa.resource_name = 'Property' AND fa.field = 'area_id'
                                     AND fa.evidence_tier = 'inferred' AND fa.method = 'registry_inherit'
      -- 102: chỉ phường còn trong areas và là cấp phường — phường đã bị dọn (reassign-areas --xoa-khu-vuc-lac) thì bỏ qua
      JOIN areas aw ON aw.id = fa.value AND aw.region_type = 'submarket'
     GROUP BY sk.offer_id
  ), muc AS (
    SELECT g.offer_id, g.la_nhan,
           CASE WHEN ar.region_type = 'submarket' THEN g.goc
                WHEN cardinality(k.ws) = 1 THEN k.ws[1]
                ELSE g.goc END AS cot_moi,
           CASE WHEN ar.region_type IS DISTINCT FROM 'submarket' AND cardinality(k.ws) = 1
                THEN jsonb_build_object('method', 'registry_inherit', 'tier', 'inferred', 'nguon', 'du-an',
                                        'goc', g.goc, 'v', k.ws[1]) END AS nhan_moi
      FROM g
      LEFT JOIN k ON k.offer_id = g.offer_id
      LEFT JOIN areas ar ON ar.id = g.goc
  ), upd AS (
    UPDATE sale_offer_records r SET
           area_id = m.cot_moi,
           field_provenance = CASE WHEN m.nhan_moi IS NOT NULL
                                   THEN coalesce(r.field_provenance, '{}'::jsonb) || jsonb_build_object('area_id', m.nhan_moi)
                                   WHEN m.la_nhan THEN r.field_provenance - 'area_id'
                                   ELSE r.field_provenance END
      FROM muc m
     WHERE r.offer_id = m.offer_id
       AND (r.area_id IS DISTINCT FROM m.cot_moi
            OR (m.nhan_moi IS NOT NULL AND r.field_provenance -> 'area_id' IS DISTINCT FROM m.nhan_moi)
            OR (m.nhan_moi IS NULL AND m.la_nhan))
    RETURNING 1
  )
  SELECT count(*)::int FROM upd
$$;
