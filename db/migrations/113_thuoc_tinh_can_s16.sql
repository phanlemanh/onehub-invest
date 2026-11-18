-- 113_thuoc_tinh_can_s16.sql — DA40 thuoc-tinh-can-s16: thuộc tính căn S16 (chủ đầu tư) vào danh bạ.
-- Thiết kế: _acceptance/thuoc-tinh-can-s16/design.md §4 · ADR-0016 §3 (thuộc tính vật thể là phát biểu), §7.1 (giá thuộc chào
-- bán, không phải sự thật của căn) · ADR-0011 (RESO-first: LivingArea, BuildingAreaTotal tra DD 2.1; direction_faces là trục
-- local đã có, Mạnh chốt nghĩa 07/11 GN1).
-- KHÔNG sync cloud: bảng nạp và hai view lấy từ dữ liệu S16 sau đăng nhập (ROADMAP §3 mục 48); sync-cloud.mjs chặn mọi bảng
-- ^stg_s16 (pipeline/lib/s16-soat.mjs), field_assertions và view không nằm trong FILL. Chỉ DB local; áp máy thu sau gộp.
-- Số 113 do giám sát cấp (111 DA37, 112 cờ match_whole). Chạy lại an toàn.

-- 1. Bảng nạp của kind snapshot mngt-can-chi-tiet (DATA-CONTRACT v14, bộ nạp của làn thu). Giữ trường nguồn cần dùng, đã gõ
--    kiểu; KHÔNG có cột cho trường chủ căn tự nhập (giá mua, ngày mua, vốn, khoản vay, pháp lý, bàn giao, nội thất, hiện trạng)
--    — chúng ở lại raw snapshot. dong = số thứ tự dòng trong tệp của snapshot (một mã có thể có nhiều lần thử).
CREATE TABLE IF NOT EXISTS stg_s16_can_chi_tiet (
  snapshot_id       text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  du_an             text NOT NULL CHECK (btrim(du_an) <> ''),
  khu               text NOT NULL DEFAULT '',
  toa               text NOT NULL DEFAULT '',
  ma_can            text NOT NULL CHECK (btrim(ma_can) <> ''),
  dong              integer NOT NULL CHECK (dong >= 0),
  height_type       text,
  property_type     text,
  floor_number      text,
  bedroom           smallint CHECK (bedroom >= 0),
  bathroom          smallint CHECK (bathroom >= 0),
  direction         text,
  balcony_direction text,
  house_style       text,
  sale_price        bigint CHECK (sale_price >= 0),
  area_using        numeric(10, 2) CHECK (area_using >= 0),
  area_building     numeric(10, 2) CHECK (area_building >= 0),
  editable_fields   text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (snapshot_id, du_an, toa, ma_can, dong)
);
CREATE INDEX IF NOT EXISTS stg_s16_can_chi_tiet_ma_idx ON stg_s16_can_chi_tiet (du_an, upper(btrim(ma_can)));

-- 2. Trục trường phát biểu = tập của 096 + ba trường thuộc tính căn (sổ: pipeline/mappings.yaml trục assertion_field).
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status', 'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude', 'builder_name', 'area_id', 'floor_raw', 'floor_band', 'project_node_id', 'subzone_node_id', 'living_area', 'building_area_total', 'direction_faces'));

-- 3. Thay thân hàm trigger 082 tại chỗ (giữ tên hàm và trigger; luật 096 giữ nguyên chữ). Thêm: ba trường thuộc tính căn chỉ ở
--    Unit và Property (vật thể hoặc tin), không ở Building, Stack.
CREATE OR REPLACE FUNCTION field_assertions_vat_the_082()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.resource_name = 'Property') <> (NEW.subject_key ~ '^[A-Z][A-Z0-9]{1,5}:')
     OR (NEW.resource_name = 'Building' AND NEW.subject_key !~ '^bld_')
     OR (NEW.resource_name = 'Stack' AND NEW.subject_key !~ '^stk_')
     OR (NEW.resource_name = 'Unit' AND NEW.subject_key !~ '^unt_') THEN
    RAISE EXCEPTION 'field_assertions: resource không khớp khoá (% / %)', NEW.resource_name, NEW.subject_key;
  END IF;
  -- chủ đầu tư là của toà; phường ở toà hoặc tin; dự án, phân khu chỉ trên tin; thuộc tính căn ở căn hoặc tin
  IF (NEW.field = 'builder_name' AND NEW.resource_name <> 'Building')
     OR (NEW.field <> 'builder_name' AND NEW.resource_name = 'Building' AND NEW.field <> 'area_id')
     OR (NEW.field = 'area_id' AND NEW.resource_name NOT IN ('Building', 'Property'))
     OR (NEW.field IN ('project_node_id', 'subzone_node_id') AND NEW.resource_name <> 'Property')
     OR (NEW.field IN ('living_area', 'building_area_total', 'direction_faces') AND NEW.resource_name NOT IN ('Unit', 'Property')) THEN
    RAISE EXCEPTION 'field_assertions: trường % không thuộc resource %', NEW.field, NEW.resource_name;
  END IF;
  IF NEW.method = 'registry_inherit' AND NEW.evidence_tier <> 'inferred' THEN
    RAISE EXCEPTION 'field_assertions: registry_inherit chỉ đi với lớp inferred (nhận %)', NEW.evidence_tier;
  END IF;
  IF NEW.field = 'area_id' AND NOT EXISTS (SELECT 1 FROM areas a WHERE a.id = NEW.value AND a.region_type = 'submarket') THEN
    RAISE EXCEPTION 'field_assertions: area_id phải là phường/xã (submarket), nhận «%»', NEW.value;
  END IF;
  -- id nút: số dương không đệm, vừa bigint (≤ 18 chữ số), trỏ đúng loại nút
  IF NEW.field = 'project_node_id' AND (NEW.value !~ '^[1-9][0-9]{0,17}$' OR NOT EXISTS (
       SELECT 1 FROM asset_nodes n WHERE n.id = NEW.value::bigint AND n.node_type = 'project')) THEN
    RAISE EXCEPTION 'field_assertions: project_node_id phải là id nút dự án, nhận «%»', NEW.value;
  END IF;
  -- ba nút building của Grand Park là phân khu (ADR-0016 §3) tới khi DA1 đổi loại
  IF NEW.field = 'subzone_node_id' AND (NEW.value !~ '^[1-9][0-9]{0,17}$' OR NOT EXISTS (
       SELECT 1 FROM asset_nodes n WHERE n.id = NEW.value::bigint AND n.node_type IN ('subzone', 'building'))) THEN
    RAISE EXCEPTION 'field_assertions: subzone_node_id phải là id nút phân khu, nhận «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;

-- 4. Miền giá trị của ba trường mới: diện tích là số m² dương ≤ 100.000; hướng là một trong tám mã của trục direction_faces.
CREATE OR REPLACE FUNCTION field_assertions_gia_tri_113()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.field IN ('living_area', 'building_area_total') THEN
    IF btrim(NEW.value) !~ '^[0-9]+(\.[0-9]+)?$' OR btrim(NEW.value)::numeric <= 0 OR btrim(NEW.value)::numeric > 100000 THEN
      RAISE EXCEPTION 'phát biểu % phải là số m² dương ≤ 100000: «%»', NEW.field, NEW.value;
    END IF;
  END IF;
  IF NEW.field = 'direction_faces' AND NEW.value NOT IN
       ('east', 'west', 'south', 'north', 'northeast', 'southeast', 'northwest', 'southwest') THEN
    RAISE EXCEPTION 'phát biểu direction_faces ngoài tám hướng: «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_113 ON field_assertions;
CREATE TRIGGER field_assertions_gia_tri_113 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_gia_tri_113();

-- 5. Sổ từ vựng (khớp trục assertion_field của pipeline/mappings.yaml).
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'living_area', 'LivingArea', 'Diện tích thông thuỷ', false, 20),
  ('assertion_field', 'building_area_total', 'BuildingAreaTotal', 'Diện tích tim tường', false, 21),
  ('assertion_field', 'direction_faces', NULL, 'Hướng', true, 22)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

-- 6. Bộ phân xử của căn: một dòng mỗi căn có phát biểu Unit sống (trừ registry_inherit — ADR-0016 §7.3). Mỗi trường: lớp cao
--    nhất (fact > observed > inferred), rồi lần thu sau (observed_at), rồi id lớn nhất. direction_faces là mảng mọi giá trị của
--    cùng lớp và cùng observed_at thắng (căn góc hai hướng). nguon = mã S0x của phát biểu thắng (evidence->>'nguon').
CREATE OR REPLACE VIEW v_unit_thuoc_tinh AS
WITH song AS (
  SELECT fa.subject_key AS unit_key, fa.field, fa.value, fa.observed_at, fa.id,
         fa.evidence ->> 'nguon' AS nguon,
         CASE fa.evidence_tier WHEN 'fact' THEN 3 WHEN 'observed' THEN 2 ELSE 1 END AS bac
    FROM field_assertions fa
   WHERE fa.resource_name = 'Unit' AND fa.retracted_at IS NULL AND fa.method <> 'registry_inherit'
     AND fa.field IN ('living_area', 'building_area_total', 'bedrooms', 'bathrooms', 'direction_faces', 'property_type')
), xep AS (
  SELECT s.*, rank() OVER (PARTITION BY unit_key, field ORDER BY bac DESC, observed_at DESC) AS hang,
         row_number() OVER (PARTITION BY unit_key, field ORDER BY bac DESC, observed_at DESC, id DESC) AS thu_tu
    FROM song s
), thang AS (
  SELECT unit_key, field,
         (array_agg(value ORDER BY id DESC) FILTER (WHERE thu_tu = 1))[1] AS mot,
         array_agg(DISTINCT value ORDER BY value) AS cac,
         max(observed_at) AS observed_at
    FROM xep WHERE hang = 1
   GROUP BY unit_key, field
), nguon_can AS (
  SELECT unit_key, array_agg(DISTINCT nguon ORDER BY nguon) AS nguon
    FROM xep WHERE hang = 1 AND nguon IS NOT NULL
   GROUP BY unit_key
)
SELECT t.unit_key,
       max(t.mot) FILTER (WHERE t.field = 'living_area')::numeric AS living_area,
       max(t.mot) FILTER (WHERE t.field = 'building_area_total')::numeric AS building_area_total,
       max(t.mot) FILTER (WHERE t.field = 'bedrooms')::integer AS bedrooms_total,
       max(t.mot) FILTER (WHERE t.field = 'bathrooms')::integer AS bathrooms_total_integer,
       max(t.cac) FILTER (WHERE t.field = 'direction_faces') AS direction_faces,
       max(t.mot) FILTER (WHERE t.field = 'property_type') AS property_sub_type,
       n.nguon,
       max(t.observed_at) AS observed_at
  FROM thang t
  LEFT JOIN nguon_can n USING (unit_key)
 GROUP BY t.unit_key, n.nguon;

-- 7. Giá chủ đầu tư hiện hành theo căn (ADR-0016 §7.1: không là phát biểu của căn; mọi snapshot vẫn ở stg cho lịch sử giá).
--    Snapshot mới nhất (collected_at, rồi snapshot_id) có dòng của mã; chỉ mã một toà trong snapshot ấy; sale_price > 0; nối căn
--    qua bí danh ma_nguon S16 còn sống '<du_an>/<MÃ HOA>'.
CREATE OR REPLACE VIEW v_s16_gia_cdt AS
WITH moi AS (
  SELECT c.snapshot_id, c.du_an, upper(btrim(c.ma_can)) AS ma, c.toa, c.sale_price, c.area_using,
         s.collected_at,
         dense_rank() OVER (PARTITION BY c.du_an, upper(btrim(c.ma_can))
                            ORDER BY s.collected_at DESC NULLS LAST, c.snapshot_id DESC) AS r
    FROM stg_s16_can_chi_tiet c
    JOIN airbnb_snapshots s USING (snapshot_id)
), mot_toa AS (
  SELECT snapshot_id, du_an, ma, max(sale_price) AS sale_price, max(area_using) AS area_using, max(collected_at) AS thu_luc
    FROM moi WHERE r = 1
   GROUP BY snapshot_id, du_an, ma
  HAVING count(DISTINCT toa) = 1
)
SELECT a.object_key AS unit_key,
       m.sale_price AS list_price,
       CASE WHEN m.area_using > 0 THEN round(m.sale_price / m.area_using) END AS gia_m2_thong_thuy,
       m.snapshot_id,
       m.thu_luc
  FROM mot_toa m
  JOIN registry_aliases a ON a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
                         AND a.object_key LIKE 'unt\_%' AND a.value = m.du_an || '/' || m.ma
 WHERE m.sale_price > 0;
