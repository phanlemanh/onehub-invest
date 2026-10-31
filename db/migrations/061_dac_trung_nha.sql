-- 061_dac_trung_nha.sql — HD5 `dac-trung-nha-s06-len-canonical`: đặc trưng nhà của tin S06 lên canonical qua phát biểu
-- docs/superpowers/specs/2026-10-31-dac-trung-nha-s06-len-canonical-design.md · docs/research/audit-hang-duyet-3010.md §7 (Q12)
-- · sổ pipeline/mappings.yaml (trục assertion_field, khối cột sale_offer_records). RESO DD 2.1: StreetNumber, UnitNumber,
-- FrontageLength, LotSizeDimensions, Stories, Latitude, Longitude. Chỉ DB local — áp cloud khi Mạnh duyệt; bảy cột không có
-- trong CLOUD_ALLOW của sync-cloud.mjs nên không lên cloud.

-- 1. Bảy cột của bản ghi tin — chỉ resolve_offer_fields (§4) ghi.
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS street_number text;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS unit_number text;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS frontage_length numeric;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS lot_size_dimensions text;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS stories integer;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS longitude numeric;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_frontage_length_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_frontage_length_chk CHECK (frontage_length > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_stories_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_stories_chk CHECK (stories > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_latitude_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_latitude_chk CHECK (latitude BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_longitude_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_longitude_chk CHECK (longitude BETWEEN -180 AND 180);
  END IF;
END $$;
CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;

-- 2. Trục cột phát biểu: sáu mã của 059 + bảy đặc trưng nhà (CHECK literal — vocab --check-db đọc).
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude'));

-- 3. Kiểu và miền của bốn trường số mới, ở MỌI phương pháp (kể cả hitl) — cùng miền CHECK cột §1, để phân xử không bao giờ
--    ghi giá trị vi phạm CHECK. Trigger riêng, không chép lại thân field_assertions_guard của 059.
CREATE OR REPLACE FUNCTION field_assertions_gia_tri_061()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  so numeric;
BEGIN
  IF NEW.field IN ('frontage_length', 'stories', 'latitude', 'longitude') THEN
    IF btrim(NEW.value) !~ '^-?[0-9]+(\.[0-9]+)?$' THEN
      RAISE EXCEPTION 'phát biểu % phải là số: «%»', NEW.field, NEW.value;
    END IF;
    so := btrim(NEW.value)::numeric;
    IF (NEW.field = 'frontage_length' AND so <= 0)
       OR (NEW.field = 'stories' AND (so <= 0 OR so <> trunc(so)))
       OR (NEW.field = 'latitude' AND so NOT BETWEEN -90 AND 90)
       OR (NEW.field = 'longitude' AND so NOT BETWEEN -180 AND 180) THEN
      RAISE EXCEPTION 'phát biểu % ngoài miền: «%»', NEW.field, NEW.value;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_061 ON field_assertions;
CREATE TRIGGER field_assertions_gia_tri_061 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_gia_tri_061();

-- 4. resolve_offer_fields bản 061 — nguyên thân 059, cộng bảy cột đặc trưng nhà.
CREATE OR REPLACE FUNCTION resolve_offer_fields(p_offer_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_offers  integer;
  n_changed integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;

  WITH o AS (
    SELECT offer_id, offer_subject_keys(source, originating_system_key, post_ids) AS subj,
           field_provenance -> 'offer_status' AS fp_chao
      FROM sale_offer_records
     WHERE p_offer_ids IS NULL OR offer_id = ANY (p_offer_ids)
  ), sk AS (   -- mỗi (tin, chủ thể) một dòng — nối bằng đẳng thức (hash join), không quét bảng phát biểu cho từng tin
    SELECT DISTINCT o.offer_id, unnest(o.subj) AS subject_key FROM o
  ), a AS (
    SELECT sk.offer_id, fa.id, fa.subject_key, fa.field, fa.value, fa.value_key, fa.method,
           CASE fa.evidence_tier WHEN 'fact' THEN 0 WHEN 'observed' THEN 1 ELSE 2 END AS tier_rank,
           fa.evidence_tier, assertion_method_rank(fa.method) AS method_rank
      FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.retracted_at IS NULL
                                     AND fa.field <> 'offer_status'   -- trạng thái chào: resolve_offer_status (059)
     -- legacy = lịch sử của chính bản ghi (không biết đến từ post nào) → chỉ đỡ đúng tin đã sinh ra nó; không rò sang tin
     -- khác chung post (tin đã nghỉ vì đổi khoá PL14 chung post với tin kế). Phát biểu khác đi theo post như thiết kế §3.1.
     WHERE fa.method <> 'legacy' OR fa.evidence ->> 'offer_id' = sk.offer_id
  ), g AS (   -- mỗi (tin, trường, lớp, giá trị) một nhóm
    SELECT offer_id, field, tier_rank, min(evidence_tier) AS tier, value_key,
           min(value COLLATE "C") AS v,
           min(method_rank) AS mrank,
           (array_agg(method ORDER BY method_rank, id))[1] AS method,
           count(DISTINCT subject_key) AS nsub,
           array_agg(id ORDER BY id) AS ids
      FROM a GROUP BY offer_id, field, tier_rank, value_key
  ), top AS (  -- lớp cao nhất có thể vào cột (suy luận không bao giờ)
    SELECT offer_id, field, min(tier_rank) AS tr FROM g WHERE tier_rank < 2 GROUP BY offer_id, field
  ), ranked AS (
    SELECT g.*, row_number() OVER (PARTITION BY g.offer_id, g.field ORDER BY g.mrank, g.nsub DESC, g.value_key) AS rn,
           count(*) OVER (PARTITION BY g.offer_id, g.field) AS ngroups
      FROM g JOIN top ON top.offer_id = g.offer_id AND top.field = g.field AND g.tier_rank = top.tr
  ), win AS (   -- lớp dưới có giá trị khác giá trị thắng → lower_disagree (nối + gộp, không truy vấn con từng dòng)
    SELECT r.offer_id, r.field, r.v, r.value_key, r.tier, r.method, r.ids, r.ngroups > 1 AS conflict,
           coalesce(bool_or(x.tier_rank > r.tier_rank AND x.value_key <> r.value_key), false) AS lower_disagree
      FROM ranked r JOIN g x ON x.offer_id = r.offer_id AND x.field = r.field
     WHERE r.rn = 1
     GROUP BY r.offer_id, r.field, r.v, r.value_key, r.tier, r.method, r.ids, r.ngroups
  ), goi_y AS (  -- trường chỉ có suy luận
    SELECT g.offer_id, g.field,
           jsonb_agg(jsonb_build_object('v', g.v, 'method', g.method, 'ids', to_jsonb(g.ids)) ORDER BY g.mrank, g.value_key) AS ds
      FROM g WHERE NOT EXISTS (SELECT 1 FROM top WHERE top.offer_id = g.offer_id AND top.field = g.field)
     GROUP BY g.offer_id, g.field
  ), prov AS (
    SELECT offer_id, field, jsonb_build_object('v', CASE WHEN field IN ('bedrooms', 'bathrooms') THEN value_key ELSE v END,
             'tier', tier, 'method', method, 'ids', to_jsonb(ids), 'conflict', conflict,
             'lower_disagree', lower_disagree, 'measured', false) AS p
      FROM win
    UNION ALL
    SELECT offer_id, field, jsonb_build_object('goi_y', ds) FROM goi_y
  ), pv AS (
    SELECT offer_id, jsonb_object_agg(field, p) AS field_provenance FROM prov GROUP BY offer_id
  ), kq AS (   -- mỗi (tin, trường) có tối đa một dòng win
    SELECT o.offer_id,
           coalesce(max(w.value_key) FILTER (WHERE w.field = 'property_type'), 'unknown') AS property_type,
           (max(w.value_key) FILTER (WHERE w.field = 'bedrooms'))::int AS bedrooms,
           (max(w.value_key) FILTER (WHERE w.field = 'bathrooms'))::int AS bathrooms,
           max(w.v) FILTER (WHERE w.field = 'street_raw') AS street_raw,
           max(w.v) FILTER (WHERE w.field = 'block_raw') AS block_raw,
           max(w.v) FILTER (WHERE w.field = 'street_number') AS street_number,
           max(w.v) FILTER (WHERE w.field = 'unit_number') AS unit_number,
           (max(w.v) FILTER (WHERE w.field = 'frontage_length'))::numeric AS frontage_length,
           max(w.v) FILTER (WHERE w.field = 'lot_size_dimensions') AS lot_size_dimensions,
           (max(w.v) FILTER (WHERE w.field = 'stories'))::int AS stories,
           (max(w.v) FILTER (WHERE w.field = 'latitude'))::numeric AS latitude,
           (max(w.v) FILTER (WHERE w.field = 'longitude'))::numeric AS longitude,
           coalesce(max(pv.field_provenance::text)::jsonb, '{}'::jsonb)
             || CASE WHEN max(o.fp_chao::text) IS NULL THEN '{}'::jsonb
                     ELSE jsonb_build_object('offer_status', max(o.fp_chao::text)::jsonb) END AS field_provenance
      FROM o
      LEFT JOIN win w ON w.offer_id = o.offer_id
      LEFT JOIN pv ON pv.offer_id = o.offer_id
     GROUP BY o.offer_id
  ), upd AS (
    UPDATE sale_offer_records r SET
           property_type = k.property_type, bedrooms = k.bedrooms, bathrooms = k.bathrooms,
           street_raw = k.street_raw, block_raw = k.block_raw, field_provenance = k.field_provenance,
           street_number = k.street_number, unit_number = k.unit_number, frontage_length = k.frontage_length,
           lot_size_dimensions = k.lot_size_dimensions, stories = k.stories, latitude = k.latitude, longitude = k.longitude
      FROM kq k
     WHERE r.offer_id = k.offer_id
       AND (r.property_type, r.bedrooms, r.bathrooms, r.street_raw, r.block_raw, r.field_provenance,
            r.street_number, r.unit_number, r.frontage_length, r.lot_size_dimensions, r.stories, r.latitude, r.longitude)
           IS DISTINCT FROM (k.property_type, k.bedrooms, k.bathrooms, k.street_raw, k.block_raw, k.field_provenance,
            k.street_number, k.unit_number, k.frontage_length, k.lot_size_dimensions, k.stories, k.latitude, k.longitude)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM kq), (SELECT count(*) FROM upd) INTO n_offers, n_changed;
  RETURN jsonb_build_object('offers', n_offers, 'offers_changed', n_changed);
END $$;

-- 5. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của trục assertion_field)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'street_number', 'StreetNumber', 'Số nhà', false, 7),
  ('assertion_field', 'unit_number', 'UnitNumber', 'Mã căn', false, 8),
  ('assertion_field', 'frontage_length', 'FrontageLength', 'Mặt tiền', false, 9),
  ('assertion_field', 'lot_size_dimensions', 'LotSizeDimensions', 'Ngang × dài', false, 10),
  ('assertion_field', 'stories', 'Stories', 'Số tầng', false, 11),
  ('assertion_field', 'latitude', 'Latitude', 'Vĩ độ', false, 12),
  ('assertion_field', 'longitude', 'Longitude', 'Kinh độ', false, 13)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
