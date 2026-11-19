-- 113-lui.sql — lùi migration 113 (thuoc-tinh-can-s16, DA40) trên DB máy thu. Chạy SAU khi đã rút mọi phát biểu S16 Unit
-- (lệnh ở ap-may-thu.md §Lùi) — CHECK của 096 từ chối dòng sống mang ba trường mới. Một giao dịch; chạy lại an toàn.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM field_assertions WHERE field IN ('living_area', 'building_area_total', 'direction_faces', 'lot_size_area')) THEN
    RAISE EXCEPTION '113-lui: còn phát biểu mang trường của 113 (kể cả đã rút) — CHECK 096 sẽ từ chối; xem ap-may-thu.md §Lùi';
  END IF;
END $$;
DROP VIEW IF EXISTS v_unit_thuoc_tinh;
DROP VIEW IF EXISTS v_s16_gia_cdt;
DROP TRIGGER IF EXISTS field_assertions_gia_tri_113 ON field_assertions;
DROP FUNCTION IF EXISTS field_assertions_gia_tri_113();
DELETE FROM ref_lookup WHERE lookup_name = 'assertion_field' AND lookup_value IN ('living_area', 'building_area_total', 'direction_faces', 'lot_size_area');
DROP TABLE IF EXISTS stg_s16_can_chi_tiet;
-- Trục trường và thân trigger trở về đúng bản 096 (chép nguyên văn khối 1–2 của 096):
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
COMMIT;
