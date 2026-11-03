-- 067_tang_huong_tin.sql — SV2 `s03-luu-tang-huong`: tầng và hướng của tin đi qua phát biểu; hướng là một trường kèm nhãn «của cái gì»
-- docs/superpowers/specs/2026-11-02-s03-luu-tang-huong-design.md · docs/research/s03-audit-trich-xuat-0211.md §10 · sổ pipeline/mappings.yaml.
-- RESO DD 2.1: tầng ứng với UnitFloorLocation; hướng ban công không có tương đương (DirectionFaces là hướng lối vào của toà) nên là extension đủ 6 điều kiện ADR-0011.
-- Chỉ DB local — áp cloud khi Mạnh duyệt; unit_facing không có trong CLOUD_ALLOW của sync-cloud.mjs nên không lên cloud.

-- 1. Cột hướng của bản ghi tin (chỉ resolve_offer_fields ghi, §5) và trục trường phát biểu.
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS unit_facing text;
CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude',
                   'floor_raw', 'unit_facing'));

-- 2. Tầng có từ 030 (chỉ S06) chưa có phát biểu: ghi thành legacy đúng khuôn cắt chuyển PL15, mỗi dòng chỉ đỡ tin đã sinh ra nó.
-- PHẢI đứng trước trigger §4: giá trị cũ ngoài miền mới (vd 4 chữ số) được giữ nguyên, còn từ nay về sau thì bị từ chối.
WITH o_ AS (
  SELECT offer_id, source, coalesce(originating_system_key, post_ids[1]) AS neo, last_seen, floor_raw AS v,
         offer_subject_keys(source, originating_system_key, post_ids) AS subj
    FROM sale_offer_records
   WHERE floor_raw IS NOT NULL AND btrim(floor_raw) <> ''
), sk AS (SELECT DISTINCT offer_id, unnest(subj) AS subject_key FROM o_)
INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
SELECT o_.source || ':' || o_.neo, 'floor_raw', o_.v, 'observed', 'legacy', '045', 'offer:' || o_.offer_id,
       jsonb_build_object('note', 'giá trị có trước 067, không căn cứ', 'offer_id', o_.offer_id),
       least(o_.last_seen, clock_timestamp())
  FROM o_
 WHERE o_.neo IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.field = 'floor_raw'
                    AND fa.retracted_at IS NULL WHERE sk.offer_id = o_.offer_id)
ON CONFLICT DO NOTHING;

-- 3. Khuôn hướng: <của cái gì>:<hướng>[,<hướng>]; hướng sắp theo chữ cái, không trùng, để hai bài cùng hướng ra đúng một giá trị.
CREATE OR REPLACE FUNCTION unit_facing_hop_le(p_value text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  huong text[];
BEGIN
  IF p_value !~ '^(balcony|door|unspecified):(north|south|east|west|northeast|northwest|southeast|southwest)(,(north|south|east|west|northeast|northwest|southeast|southwest))*$' THEN
    RETURN false;
  END IF;
  huong := string_to_array(split_part(p_value, ':', 2), ',');
  FOR i IN 2 .. array_length(huong, 1) LOOP
    IF huong[i - 1] COLLATE "C" >= huong[i] COLLATE "C" THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_unit_facing_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_unit_facing_chk CHECK (unit_facing_hop_le(unit_facing));
  END IF;
END $$;

-- 4. Miền hai trường mới, ở MỌI phương pháp — tầng là số hoặc đúng ba chữ khoảng.
CREATE OR REPLACE FUNCTION field_assertions_gia_tri_067()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.field = 'floor_raw' AND NEW.value !~ '^([0-9]{1,3}|tầng thấp|tầng trung|tầng cao)$' THEN
    RAISE EXCEPTION 'phát biểu floor_raw sai khuôn: «%»', NEW.value;
  END IF;
  IF NEW.field = 'unit_facing' AND NOT unit_facing_hop_le(NEW.value) THEN
    RAISE EXCEPTION 'phát biểu unit_facing sai khuôn: «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_067 ON field_assertions;
CREATE TRIGGER field_assertions_gia_tri_067 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_gia_tri_067();

-- 5. Bộ phân xử dựng thêm hai cột (nguyên thân bản 061, cộng floor_raw và unit_facing).
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
           max(w.v) FILTER (WHERE w.field = 'floor_raw') AS floor_raw,
           max(w.v) FILTER (WHERE w.field = 'unit_facing') AS unit_facing,
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
           lot_size_dimensions = k.lot_size_dimensions, stories = k.stories, latitude = k.latitude, longitude = k.longitude,
           floor_raw = k.floor_raw, unit_facing = k.unit_facing
      FROM kq k
     WHERE r.offer_id = k.offer_id
       AND (r.property_type, r.bedrooms, r.bathrooms, r.street_raw, r.block_raw, r.field_provenance,
            r.street_number, r.unit_number, r.frontage_length, r.lot_size_dimensions, r.stories, r.latitude, r.longitude, r.floor_raw, r.unit_facing)
           IS DISTINCT FROM (k.property_type, k.bedrooms, k.bathrooms, k.street_raw, k.block_raw, k.field_provenance,
            k.street_number, k.unit_number, k.frontage_length, k.lot_size_dimensions, k.stories, k.latitude, k.longitude, k.floor_raw, k.unit_facing)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM kq), (SELECT count(*) FROM upd) INTO n_offers, n_changed;
  RETURN jsonb_build_object('offers', n_offers, 'offers_changed', n_changed);
END $$;

-- 6. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của ba trục)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'floor_raw', 'UnitFloorLocation', 'Tầng', false, 14),
  ('assertion_field', 'unit_facing', NULL, 'Hướng', true, 15),
  ('unit_facing_of', 'balcony', NULL, 'Ban công', true, 1),
  ('unit_facing_of', 'door', NULL, 'Cửa chính', true, 2),
  ('unit_facing_of', 'unspecified', NULL, 'Không nói rõ', true, 3),
  ('facing_direction', 'north', NULL, 'Bắc', true, 1),
  ('facing_direction', 'south', NULL, 'Nam', true, 2),
  ('facing_direction', 'east', NULL, 'Đông', true, 3),
  ('facing_direction', 'west', NULL, 'Tây', true, 4),
  ('facing_direction', 'northeast', NULL, 'Đông Bắc', true, 5),
  ('facing_direction', 'northwest', NULL, 'Tây Bắc', true, 6),
  ('facing_direction', 'southeast', NULL, 'Đông Nam', true, 7),
  ('facing_direction', 'southwest', NULL, 'Tây Nam', true, 8)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
