-- 082_danh_ba_vat_the.sql — DB1 danh-ba-toa-truc-can: danh bạ vật thể toà · trục · căn (ADR-0016 §2–§4, Đợt 1).
-- docs/superpowers/specs/2026-11-07-danh-ba-toa-truc-can-design.md · _acceptance/danh-ba-toa-truc-can (Mạnh duyệt 07/11).
-- Số 082 do phiên liên làn cấp. Ba bảng chỉ-thêm theo khuôn parties (055); mở khung chung registry_aliases (bí danh
-- ma_nguon) và field_assertions (resource Building/Stack/Unit, field builder_name, area_id, method registry_inherit).
-- KHÔNG sync cloud: ba bảng mới không vào FILL của pipeline/sync-cloud.mjs (ADR-0016 §9 — vật thể chỉ có từ S08 ở lại máy
-- thu tới khi có tin trỏ vào). Không thuộc tính viết tay: tên toà là bí danh, chủ đầu tư và phường là phát biểu.
-- Áp lên DB máy thu là lời riêng của Mạnh sau Cổng Bằng chứng. Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Ba bảng vật thể ----
CREATE TABLE IF NOT EXISTS buildings (
  building_key   text PRIMARY KEY CHECK (building_key ~ '^bld_[0-9A-HJKMNP-TV-Z]{26}$'),
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into    text REFERENCES buildings (building_key),
  region_node_id bigint NOT NULL REFERENCES asset_nodes (id),
  upi            text NOT NULL UNIQUE CHECK (upi ~ '^urn:onehub:upi:1:VN:VN-(HN|SG):bld_[0-9A-HJKMNP-TV-Z]{26}$'),
  iso_region     text NOT NULL CHECK (iso_region IN ('VN-HN', 'VN-SG')),
  catalog_tier   text NOT NULL CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buildings_upi_khop_khoa CHECK (upi = 'urn:onehub:upi:1:VN:' || iso_region || ':' || building_key)
);
CREATE INDEX IF NOT EXISTS buildings_region_idx ON buildings (region_node_id);

CREATE TABLE IF NOT EXISTS stacks (
  stack_key    text PRIMARY KEY CHECK (stack_key ~ '^stk_[0-9A-HJKMNP-TV-Z]{26}$'),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into  text REFERENCES stacks (stack_key),
  building_key text NOT NULL REFERENCES buildings (building_key),
  catalog_tier text NOT NULL CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai')),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stacks_building_idx ON stacks (building_key);

CREATE TABLE IF NOT EXISTS units (
  unit_key     text PRIMARY KEY CHECK (unit_key ~ '^unt_[0-9A-HJKMNP-TV-Z]{26}$'),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into  text REFERENCES units (unit_key),
  building_key text NOT NULL REFERENCES buildings (building_key),
  stack_key    text REFERENCES stacks (stack_key),
  floor        text CHECK (floor ~ '^[0-9]+[A-Z]?$'),
  sub_id       text NOT NULL,
  catalog_tier text NOT NULL CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  -- UniversalPropertySubId (ADR-0016 §4): <khoá trục>:<tầng>; không biết trục → <khoá căn>.
  CONSTRAINT units_sub_id_khop CHECK (
    (stack_key IS NOT NULL AND floor IS NOT NULL AND sub_id = stack_key || ':' || floor)
    OR (stack_key IS NULL AND sub_id = unit_key))
);
CREATE INDEX IF NOT EXISTS units_building_idx ON units (building_key);
CREATE INDEX IF NOT EXISTS units_stack_idx ON units (stack_key);

-- merged_into bắt buộc khi và chỉ khi merged (trigger, như parties_gop_chk của 055).
CREATE OR REPLACE FUNCTION vat_the_gop_chk()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.status = 'merged') IS DISTINCT FROM (NEW.merged_into IS NOT NULL) THEN
    RAISE EXCEPTION '%: merged_into bắt buộc khi và chỉ khi status = merged (%)', TG_TABLE_NAME, NEW.status;
  END IF;
  RETURN NEW;
END $$;

-- Rào chỉ-thêm của ba bảng: không DELETE/TRUNCATE; khoá, UPI, SubId, cha, ngày tạo không đổi; chỉ status, merged_into đổi.
CREATE OR REPLACE FUNCTION vat_the_chi_them()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
    RAISE EXCEPTION '%: chỉ thêm — không xoá (% bị từ chối)', TG_TABLE_NAME, TG_OP;
  END IF;
  IF (to_jsonb(NEW) - 'status' - 'merged_into') IS DISTINCT FROM (to_jsonb(OLD) - 'status' - 'merged_into') THEN
    RAISE EXCEPTION '%: chỉ thêm — chỉ đổi được status, merged_into', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['buildings', 'stacks', 'units'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_chi_them_dong', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION vat_the_chi_them()',
                   t || '_chi_them_dong', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_chi_them_truncate', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION vat_the_chi_them()',
                   t || '_chi_them_truncate', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_gop_chk', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION vat_the_gop_chk()',
                   t || '_gop_chk', t);
  END LOOP;
END $$;

-- ---- 2. Khung chung: bí danh mã tại nguồn ----
-- Phạm vi nằm trong giá trị (<project_id>/<mã>), không thêm cột: index của bí danh Người (055, 060) giữ nguyên.
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_kind_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_kind_check
  CHECK (kind IN ('tai_khoan_nguon', 'sdt_bam', 'ten', 'sdt', 'ma_nguon'));
CREATE UNIQUE INDEX IF NOT EXISTS registry_aliases_ma_nguon_uq ON registry_aliases (source, kind, value)
  WHERE retired_at IS NULL AND kind = 'ma_nguon';

-- ---- 3. Phát biểu vật thể ----
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_resource_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_resource_chk
  CHECK (resource_name IN ('Property', 'Building', 'Stack', 'Unit'));
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_subject_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_subject_chk
  CHECK (subject_key ~ '^[A-Z][A-Z0-9]{1,5}:.+$' OR subject_key ~ '^(bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$');
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude',
                   'builder_name', 'area_id'));
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_method_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_method_chk
  CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'registry_inherit'));
-- party_roles dùng chung trục phương pháp (sổ từ vựng); party_roles_cap_lop (055) vẫn từ chối registry_inherit.
ALTER TABLE party_roles DROP CONSTRAINT IF EXISTS party_roles_method_check;
ALTER TABLE party_roles ADD CONSTRAINT party_roles_method_check
  CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'registry_inherit'));

-- Ghép resource ↔ tiền tố khoá, trường ↔ resource, phương pháp kế thừa ↔ lớp suy luận. Trigger riêng, không chép lại
-- thân field_assertions_guard (059).
CREATE OR REPLACE FUNCTION field_assertions_vat_the_082()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.resource_name = 'Property') <> (NEW.subject_key ~ '^[A-Z][A-Z0-9]{1,5}:')
     OR (NEW.resource_name = 'Building' AND NEW.subject_key !~ '^bld_')
     OR (NEW.resource_name = 'Stack' AND NEW.subject_key !~ '^stk_')
     OR (NEW.resource_name = 'Unit' AND NEW.subject_key !~ '^unt_') THEN
    RAISE EXCEPTION 'field_assertions: resource không khớp khoá (% / %)', NEW.resource_name, NEW.subject_key;
  END IF;
  IF (NEW.field IN ('builder_name', 'area_id')) <> (NEW.resource_name = 'Building') THEN
    RAISE EXCEPTION 'field_assertions: trường % không thuộc resource %', NEW.field, NEW.resource_name;
  END IF;
  IF NEW.method = 'registry_inherit' AND NEW.evidence_tier <> 'inferred' THEN
    RAISE EXCEPTION 'field_assertions: registry_inherit chỉ đi với lớp inferred (nhận %)', NEW.evidence_tier;
  END IF;
  IF NEW.field = 'area_id' AND NOT EXISTS (SELECT 1 FROM areas a WHERE a.id = NEW.value AND a.region_type = 'submarket') THEN
    RAISE EXCEPTION 'field_assertions: area_id phải là phường/xã (submarket), nhận «%»', NEW.value;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS field_assertions_vat_the_082 ON field_assertions;
CREATE TRIGGER field_assertions_vat_the_082 BEFORE INSERT ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_vat_the_082();

-- ---- 4. Sổ từ vựng (sinh bằng `node pipeline/vocab.mjs --emit-seed`, lọc các giá trị và cột mới của 082) ----
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'builder_name', 'BuilderName', 'Chủ đầu tư', false, 14),
  ('assertion_field', 'area_id', NULL, 'Phường của toà', true, 15),
  ('assertion_method', 'registry_inherit', NULL, 'Kế thừa từ danh bạ', true, 7),
  ('alias_kind', 'ma_nguon', NULL, 'Mã tại nguồn', true, 5),
  ('catalog_tier', 'xac_minh', NULL, 'Xác minh', true, 1),
  ('catalog_tier', 'suy_ra_manh', NULL, 'Suy ra mạnh', true, 2),
  ('catalog_tier', 'mot_loi_khai', NULL, 'Một lời khai', true, 3)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('buildings', 'status', 'registry_status'),
  ('stacks', 'status', 'registry_status'),
  ('units', 'status', 'registry_status'),
  ('buildings', 'catalog_tier', 'catalog_tier'),
  ('stacks', 'catalog_tier', 'catalog_tier'),
  ('units', 'catalog_tier', 'catalog_tier')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
