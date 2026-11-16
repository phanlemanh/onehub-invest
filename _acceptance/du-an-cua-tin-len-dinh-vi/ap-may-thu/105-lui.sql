-- 105-lui.sql — DV7: lùi migration 105 trên DB máy thu. Chạy trong MỘT giao dịch (psql -1 hoặc BEGIN … COMMIT).
-- Thứ tự có răng: trả hai hàm về thân 087 TRƯỚC (bac-du-lieu đang chạy song song không bao giờ gọi vào view đã mất), rồi
-- DROP VIEW không CASCADE — có view của người khác dựa trên offer_project thì câu DROP lỗi và cả khối lùi không đổi gì;
-- người lùi view phụ thuộc kia trước. Thân hai hàm chép nguyên văn từ db/migrations/087_thang_bac_moi.sql.

CREATE OR REPLACE FUNCTION offer_located(p_offer_id text)
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION data_level_units()
RETURNS TABLE (unit_key text, unit text, data_level text, ke_thieu text, source text, area_id text, property_type text,
               offer_ids text[]) LANGUAGE sql STABLE AS $$
  SELECT 'tin:' || o.offer_id, 'tin_le', l.data_level, l.ke_thieu, o.source, o.area_id, o.property_type,
         ARRAY[o.offer_id]
    FROM sale_offers o
   CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id,
                                       offer_located(o.offer_id)) l
   WHERE o.source IN ('S03', 'S05', 'S06')
     AND (NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id)
          OR NOT EXISTS (SELECT 1 FROM units un WHERE un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active'))
  UNION ALL
  SELECT 'can:' || u.unit_key, 'can', u.data_level, u.ke_thieu, u.source, u.area_id, u.property_type, u.offer_ids
    FROM unit_data_level() u
$$;

DROP VIEW offer_project;
