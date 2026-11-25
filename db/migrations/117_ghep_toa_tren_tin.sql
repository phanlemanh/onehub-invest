-- 117_ghep_toa_tren_tin.sql — PL20 ghep-tin-vao-danh-muc: phát biểu toà trên tin và view offer_building (một tin một nơi gắn).
-- Thiết kế: docs/superpowers/specs/2026-11-18-ghep-tin-vao-danh-muc-design.md §3 · ADR-0016 §5 (UniversalPropertyId trên listing) · ADR-0013.
-- RESO: UniversalPropertyId có trong DD 2.1 (ADR-0016). KHÔNG sync cloud: view và trường chỉ ở máy thu, field_assertions không nằm trong FILL.
-- Số 117 do giám sát cấp, viết chồng lên 113 và 118; thứ tự áp trên máy thu 113 → 118 → 117. Chạy lại an toàn.
-- Lùi: DROP VIEW offer_building; rút dòng của bốn rule_id ghep-toa-*; áp lại khối 2 và 3 của 113.

DO $$
BEGIN
  IF to_regclass('public.stg_s16_can_chi_tiet') IS NULL THEN
    RAISE EXCEPTION '117: cần áp 113 trước (thứ tự 113 → 118 → 117)';
  END IF;
END $$;

-- 1. Trục trường phát biểu = tập của 113 + universal_property_id (sổ: pipeline/mappings.yaml trục assertion_field).
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status', 'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude', 'builder_name', 'area_id', 'floor_raw', 'floor_band', 'project_node_id', 'subzone_node_id', 'living_area', 'building_area_total', 'direction_faces', 'lot_size_area', 'universal_property_id'));

-- 2. Thay thân hàm trigger 082 tại chỗ, giữ nguyên luật của 113. Thêm: universal_property_id chỉ ở tin (Property) và chỉ nhận UPI
--    của toà đang hoạt động.
CREATE OR REPLACE FUNCTION field_assertions_vat_the_082()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.resource_name = 'Property') <> (NEW.subject_key ~ '^[A-Z][A-Z0-9]{1,5}:')
     OR (NEW.resource_name = 'Building' AND NEW.subject_key !~ '^bld_')
     OR (NEW.resource_name = 'Stack' AND NEW.subject_key !~ '^stk_')
     OR (NEW.resource_name = 'Unit' AND NEW.subject_key !~ '^unt_') THEN
    RAISE EXCEPTION 'field_assertions: resource không khớp khoá (% / %)', NEW.resource_name, NEW.subject_key;
  END IF;
  -- universal_property_id xét trước luật chung để thông báo gọi đúng tên trường
  IF NEW.field = 'universal_property_id' AND NEW.resource_name <> 'Property' THEN
    RAISE EXCEPTION 'field_assertions: universal_property_id chỉ ở resource Property, nhận %', NEW.resource_name;
  END IF;
  -- chủ đầu tư là của toà; phường ở toà hoặc tin; dự án, phân khu chỉ trên tin; thuộc tính căn ở căn hoặc tin
  IF (NEW.field = 'builder_name' AND NEW.resource_name <> 'Building')
     OR (NEW.field <> 'builder_name' AND NEW.resource_name = 'Building' AND NEW.field <> 'area_id')
     OR (NEW.field = 'area_id' AND NEW.resource_name NOT IN ('Building', 'Property'))
     OR (NEW.field IN ('project_node_id', 'subzone_node_id') AND NEW.resource_name <> 'Property')
     OR (NEW.field IN ('living_area', 'building_area_total', 'direction_faces', 'lot_size_area') AND NEW.resource_name NOT IN ('Unit', 'Property')) THEN
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
  IF NEW.field = 'universal_property_id' AND NOT EXISTS (
       SELECT 1 FROM buildings b WHERE b.upi = NEW.value AND b.status = 'active') THEN
    RAISE EXCEPTION 'field_assertions: universal_property_id phải là UPI của toà đang hoạt động, nhận «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;

-- 3. Sổ từ vựng (khớp trục assertion_field của pipeline/mappings.yaml).
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'universal_property_id', 'UniversalPropertyId', 'Toà của tin', false, 24)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

-- 4. Nơi gắn của tin S03: mỗi tin có phát biểu của bốn rule_id ghep-toa-* một dòng. Toà cùng các vùng chứa nó ra mức toà; các vùng
--    lồng nhau ra vùng sâu nhất; hai toà, toà với vùng không chứa nó, hai vùng không lồng nhau là xung_dot và không có nơi gắn.
--    Quan hệ toà thuộc vùng đọc từ v_toa_nut_vung (nút hiệu lực của DA36). Phát biểu trỏ toà đã ngừng hoạt động không được tính.
CREATE OR REPLACE VIEW offer_building AS
WITH RECURSIVE to_tien AS (
  SELECT id AS node_id, id AS cur_id, parent_id, 0 AS sau FROM asset_nodes
  UNION ALL
  SELECT t.node_id, n.id, n.parent_id, t.sau + 1
    FROM to_tien t JOIN asset_nodes n ON n.id = t.parent_id
   WHERE t.sau < 16
),
chuoi AS (SELECT node_id, array_agg(cur_id) AS ds FROM to_tien GROUP BY node_id),
phat_bieu AS (
  SELECT o.offer_id, p.post_id, f.field, f.value
    FROM sale_offers o
   CROSS JOIN LATERAL unnest(o.post_ids) AS p(post_id)
    JOIN field_assertions f ON f.subject_key = 'S03:' || p.post_id
     AND f.field IN ('universal_property_id', 'subzone_node_id')
     AND f.retracted_at IS NULL
     AND f.rule_id IN ('ghep-toa-cot', 'ghep-toa-cot-chuan', 'ghep-toa-chu-model', 'ghep-toa-model')
    LEFT JOIN buildings b ON f.field = 'universal_property_id' AND b.upi = f.value
   WHERE o.source = 'S03' AND (f.field <> 'universal_property_id' OR b.status = 'active')
),
gom AS (
  SELECT offer_id, count(DISTINCT post_id)::integer AS n_posts,
         array_agg(DISTINCT value) FILTER (WHERE field = 'universal_property_id') AS upis,
         array_agg(DISTINCT value::bigint) FILTER (WHERE field = 'subzone_node_id') AS vungs
    FROM phat_bieu GROUP BY offer_id
),
vung_sau AS (
  SELECT DISTINCT ON (g.offer_id) g.offer_id, c.node_id
    FROM gom g
   CROSS JOIN LATERAL unnest(g.vungs) AS u(id)
    JOIN chuoi c ON c.node_id = u.id
   WHERE g.vungs <@ c.ds
   ORDER BY g.offer_id, cardinality(c.ds) DESC, c.node_id
),
xet AS (
  SELECT g.offer_id, g.n_posts, g.upis, g.vungs, b.building_key, b.upi, s.node_id AS vung,
         COALESCE(cardinality(g.upis) = 1 AND (g.vungs IS NULL OR COALESCE(g.vungs <@ c.ds, false)), false) AS toa_hop_le
    FROM gom g
    LEFT JOIN buildings b ON cardinality(g.upis) = 1 AND b.upi = g.upis[1]
    LEFT JOIN v_toa_nut_vung v ON v.building_key = b.building_key
    LEFT JOIN chuoi c ON c.node_id = v.region_node_id
    LEFT JOIN vung_sau s ON s.offer_id = g.offer_id
)
SELECT offer_id,
       CASE WHEN toa_hop_le OR (upis IS NULL AND vung IS NOT NULL) THEN 'gan' ELSE 'xung_dot' END AS status,
       CASE WHEN toa_hop_le THEN 'toa' WHEN upis IS NULL AND vung IS NOT NULL THEN 'vung' END AS muc,
       CASE WHEN toa_hop_le THEN building_key END AS building_key,
       CASE WHEN toa_hop_le THEN upi END AS upi,
       CASE WHEN NOT toa_hop_le AND upis IS NULL THEN vung END AS subzone_node_id,
       n_posts
  FROM xet;
