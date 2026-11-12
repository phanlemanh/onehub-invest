-- 096_truong_du_an_tren_tin.sql — DA2 `truong-du-an-tren-tin`: tin rao (resource Property) nhận phát biểu dự án, phân khu, phường.
-- docs/superpowers/specs/2026-11-12-truong-du-an-tren-tin-design.md · _acceptance/truong-du-an-tren-tin/ · sổ pipeline/mappings.yaml.
-- RESO DD 2.1 (tra bản local 12/11): dự án ứng SubdivisionName (Property, Building); ComplexName chỉ ở Building nên phân khu
-- trên tin là extension subzone_node_id đủ 6 điều kiện ADR-0011; DD không có cấp phường (area_id là mã local, City là tên).
-- Chạy sau 095 (DV4). Chỉ phát biểu: bộ phân xử resolve_offer_fields không đổi, không dựng cột (GCQ2, DA9 đọc phát biểu).
-- Chỉ DB local — áp máy thu là lời riêng của Mạnh; không áp cloud. Chạy lại an toàn.

-- 1. Trục trường phát biểu = tập của 095 + hai trường dự án, phân khu.
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude',
                   'builder_name', 'area_id', 'floor_raw', 'floor_band', 'project_node_id', 'subzone_node_id'));

-- 2. Thay thân hàm trigger 082 tại chỗ (giữ tên hàm và trigger). Luật cũ giữ nguyên chữ; luật trường ↔ resource mở area_id
-- cho Property và thêm hai trường chỉ ở Property; thêm miền id nút asset_nodes.
CREATE OR REPLACE FUNCTION field_assertions_vat_the_082()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.resource_name = 'Property') <> (NEW.subject_key ~ '^[A-Z][A-Z0-9]{1,5}:')
     OR (NEW.resource_name = 'Building' AND NEW.subject_key !~ '^bld_')
     OR (NEW.resource_name = 'Stack' AND NEW.subject_key !~ '^stk_')
     OR (NEW.resource_name = 'Unit' AND NEW.subject_key !~ '^unt_') THEN
    RAISE EXCEPTION 'field_assertions: resource không khớp khoá (% / %)', NEW.resource_name, NEW.subject_key;
  END IF;
  -- chủ đầu tư là của toà; phường ở toà hoặc tin; dự án, phân khu chỉ trên tin
  IF (NEW.field = 'builder_name' AND NEW.resource_name <> 'Building')
     OR (NEW.field <> 'builder_name' AND NEW.resource_name = 'Building' AND NEW.field <> 'area_id')
     OR (NEW.field = 'area_id' AND NEW.resource_name NOT IN ('Building', 'Property'))
     OR (NEW.field IN ('project_node_id', 'subzone_node_id') AND NEW.resource_name <> 'Property') THEN
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

-- 3. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của trục assertion_field đổi ở hàng này)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'area_id', NULL, 'Phường', true, 15),
  ('assertion_field', 'project_node_id', 'SubdivisionName', 'Dự án', false, 18),
  ('assertion_field', 'subzone_node_id', NULL, 'Phân khu', true, 19)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
