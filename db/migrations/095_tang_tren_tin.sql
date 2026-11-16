-- 095_tang_tren_tin.sql — DV4 `tang-tren-tin-s03`: tầng của tin đi qua phát biểu; số tầng → floor_raw, dải tầng → floor_band.
-- docs/superpowers/specs/2026-11-11-tang-tren-tin-s03-design.md · _acceptance/tang-tren-tin-s03/ · sổ pipeline/mappings.yaml.
-- RESO DD 2.1 (tra bản local 11/11): số tầng ứng UnitFloorLocation (Property, chuỗi ≤3 ký tự); dải tầng không có field chuẩn
-- → extension floor_band đủ 6 điều kiện ADR-0011 (không có cột, chỉ phát biểu và field_provenance).
-- Nhận trọn phần tầng của SV2 (067 cũ bỏ trống); SV2 khi nối lại chỉ còn hướng và phải giữ hai trường này trong CHECK.
-- Chỉ DB local — áp máy thu là lời riêng của Mạnh; không áp cloud, không đổi sync-cloud. Chạy lại an toàn.

-- 1. Trục trường phát biểu = tập của 082 + hai trường tầng.
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude',
                   'builder_name', 'area_id', 'floor_raw', 'floor_band'));

-- 2. Tầng có từ 030 (chỉ S06) chưa có phát biểu: ghi thành legacy đúng khuôn cắt chuyển PL15, mỗi dòng chỉ đỡ tin đã sinh ra nó.
-- PHẢI đứng trước trigger §3: giá trị cũ ngoài miền mới (vd «0») được giữ nguyên, còn từ nay về sau thì bị từ chối.
WITH o_ AS (
  SELECT offer_id, source, coalesce(originating_system_key, post_ids[1]) AS neo, last_seen, floor_raw AS v,
         offer_subject_keys(source, originating_system_key, post_ids) AS subj
    FROM sale_offer_records
   WHERE floor_raw IS NOT NULL AND btrim(floor_raw) <> ''
), sk AS (SELECT DISTINCT offer_id, unnest(subj) AS subject_key FROM o_)
INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
SELECT o_.source || ':' || o_.neo, 'floor_raw', o_.v, 'observed', 'legacy', '045', 'offer:' || o_.offer_id,
       jsonb_build_object('note', 'giá trị có trước 095, không căn cứ', 'offer_id', o_.offer_id),
       least(o_.last_seen, clock_timestamp())
  FROM o_
 WHERE o_.neo IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.field = 'floor_raw'
                    AND fa.retracted_at IS NULL WHERE sk.offer_id = o_.offer_id)
ON CONFLICT DO NOTHING;

-- 3. Miền hai trường, ở MỌI phương pháp: số tầng 1–999 không đệm; dải đúng ba mã.
CREATE OR REPLACE FUNCTION field_assertions_gia_tri_095()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.field = 'floor_raw' AND NEW.value !~ '^[1-9][0-9]{0,2}$' THEN
    RAISE EXCEPTION 'phát biểu floor_raw sai khuôn (số tầng 1–999): «%»', NEW.value;
  END IF;
  IF NEW.field = 'floor_band' AND NEW.value NOT IN ('lower', 'middle', 'upper') THEN
    RAISE EXCEPTION 'phát biểu floor_band sai khuôn (lower|middle|upper): «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_095 ON field_assertions;
CREATE TRIGGER field_assertions_gia_tri_095 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_gia_tri_095();

-- 4. Bộ phân xử dựng thêm cột floor_raw. Vá thân hàm đang có theo khuôn 068/069 (không chép cả hàm), để áp được ở mọi thứ
-- tự với các migration vá khác. Mất mốc thì dừng có tên thay vì âm thầm sai.
DO $do$
DECLARE
  ham       regprocedure := to_regprocedure('resolve_offer_fields(text[])');
  moc_kq    constant text := $m$(max(w.v) FILTER (WHERE w.field = 'longitude'))::numeric AS longitude,$m$;
  moi_kq    constant text := moc_kq || $m$
           max(w.v) FILTER (WHERE w.field = 'floor_raw') AS floor_raw, /* floor_raw_095 */$m$;
  moc_set   constant text := $m$latitude = k.latitude, longitude = k.longitude$m$;
  moi_set   constant text := moc_set || $m$, floor_raw = k.floor_raw$m$;
  moc_r     constant text := $m$r.latitude, r.longitude)$m$;
  moi_r     constant text := $m$r.latitude, r.longitude, r.floor_raw)$m$;
  moc_k     constant text := $m$k.latitude, k.longitude)$m$;
  moi_k     constant text := $m$k.latitude, k.longitude, k.floor_raw)$m$;
  dinh_nghia text;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-095: không có hàm resolve_offer_fields(text[])';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('floor_raw_095' IN dinh_nghia) > 0 THEN
    RETURN;   -- đã vá
  END IF;
  IF position(moc_kq IN dinh_nghia) = 0 OR position(moc_set IN dinh_nghia) = 0
     OR position(moc_r IN dinh_nghia) = 0 OR position(moc_k IN dinh_nghia) = 0 THEN
    RAISE EXCEPTION 'MOC-095: định nghĩa resolve_offer_fields không còn đủ bốn mốc của longitude, phải sửa tay 095';
  END IF;
  dinh_nghia := replace(replace(replace(replace(dinh_nghia, moc_kq, moi_kq), moc_set, moi_set), moc_r, moi_r), moc_k, moi_k);
  EXECUTE dinh_nghia;
END $do$;

-- 5. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của hai trục)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'floor_raw', 'UnitFloorLocation', 'Tầng', false, 16),
  ('assertion_field', 'floor_band', NULL, 'Dải tầng', true, 17),
  ('floor_band', 'lower', NULL, 'Tầng thấp', true, 1),
  ('floor_band', 'middle', NULL, 'Tầng trung', true, 2),
  ('floor_band', 'upper', NULL, 'Tầng cao', true, 3)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
