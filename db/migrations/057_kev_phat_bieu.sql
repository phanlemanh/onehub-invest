-- 057_kev_phat_bieu.sql — PL5: điểm Kev typed (ý định tin, bán/thuê) có cột ở bảng nạp tin Zalo và thành phát biểu theo bài
-- (trường listing_intent / kind, lớp inferred, phương pháp kev). Số 057 liên làn cấp (30/10).
-- Nguồn: docs/superpowers/specs/2026-10-30-meta-kev-thanh-phat-bieu-design.md · bộ cột liên làn chốt 30/10 (meta.kev v5)
-- · sổ pipeline/mappings.yaml (trục assertion_field, mã kev của assertion_method).
-- CHỈ DB local: stg_zalo_posts và field_assertions không sync cloud. Migration KHÔNG ghi dòng nào vào bảng tin hay bảng nạp.
-- Idempotent; cần 045 (field_assertions) đã áp; 055 (party_roles) có thì nới CHECK phương pháp của nó theo sổ.

-- 1. party_roles trước (bảng nhỏ, test danh bạ khoá nó sớm — xếp khoá cùng chiều để không deadlock với test song song).
-- CHECK phương pháp nội tuyến của 055 thay bằng CHECK có tên cùng bộ mã sổ; hàm canh party_roles_guard (055) KHÔNG đổi,
-- nên kev vẫn bị từ chối ở vai người.
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('party_roles') IS NOT NULL THEN
    FOR r IN SELECT conname FROM pg_constraint
              WHERE conrelid = 'party_roles'::regclass AND contype = 'c' AND conname <> 'party_roles_method_chk'
                AND pg_get_constraintdef(oid) ~ '\mmethod\M' AND pg_get_constraintdef(oid) ~ '''e2_llm''' LOOP
      EXECUTE format('ALTER TABLE party_roles DROP CONSTRAINT %I', r.conname);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'party_roles_method_chk') THEN
      ALTER TABLE party_roles ADD CONSTRAINT party_roles_method_chk
        CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'kev'));
    END IF;
  END IF;
END $$;

-- 2. Bảy cột điểm Kev ở bảng nạp (meta.kev v5 = {p, intent, intent_p, kind, kind_p, model, at}); v3/v4 chỉ có p, model, at;
-- gate down → mọi điểm NULL. Kev chỉ trả một lớp kèm xác suất mỗi câu.
ALTER TABLE stg_zalo_posts
  ADD COLUMN IF NOT EXISTS kev_p        real,          -- điểm «có phải tin BĐS» (v3 lẫn v5)
  ADD COLUMN IF NOT EXISTS kev_intent   text,          -- lớp ý định: offer · inquiry · not_listing (tập con trục listing_intent)
  ADD COLUMN IF NOT EXISTS kev_intent_p real,          -- xác suất của lớp ý định
  ADD COLUMN IF NOT EXISTS kev_kind     text,          -- sale · rent (mã Kev; transform đổi rent → rent_lt)
  ADD COLUMN IF NOT EXISTS kev_kind_p   real,          -- xác suất của lớp bán/thuê
  ADD COLUMN IF NOT EXISTS kev_model    text,          -- model chấm
  ADD COLUMN IF NOT EXISTS kev_at       timestamptz;   -- lúc chấm
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stg_zalo_posts_kev_intent_chk') THEN
    ALTER TABLE stg_zalo_posts ADD CONSTRAINT stg_zalo_posts_kev_intent_chk
      CHECK (kev_intent IN ('offer', 'inquiry', 'not_listing'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stg_zalo_posts_kev_kind_chk') THEN
    ALTER TABLE stg_zalo_posts ADD CONSTRAINT stg_zalo_posts_kev_kind_chk CHECK (kev_kind IN ('sale', 'rent'));
  END IF;
END $$;

-- 3. field_assertions: trường theo trục assertion_field, phương pháp thêm kev (CHECK literal — vocab --check-db đọc).
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'listing_intent', 'kind'));
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_method_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_method_chk
  CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'kev'));

-- 4. Hàm canh (thân 045) + kev chỉ đi với inferred: Kev cho một lớp kèm xác suất, không trích dẫn — lớp inferred không bao
-- giờ vào cột canonical (PL15), năm cột và bộ phân xử không đổi.
CREATE OR REPLACE FUNCTION field_assertions_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — không xoá (rút bằng retracted_at + lý do), id %', OLD.id;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.retracted_at IS NOT NULL THEN
      RAISE EXCEPTION 'field_assertions: chỉ thêm — không ghi phát biểu đã rút';
    END IF;
    -- Cặp lớp ↔ phương pháp (design §3.2): sự thật = người, trường nguồn; quan sát = bộ đọc, E1, E2, giá trị cũ;
    -- suy luận = E1/E2 hạ lớp (PL18), Bộ lọc Kev (PL5).
    -- Giá trị ngoài trục để CHECK của cột báo (trigger BEFORE chạy trước CHECK).
    IF NEW.evidence_tier IN ('fact', 'observed', 'inferred')
       AND NEW.method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'kev')
       AND NOT ((NEW.evidence_tier = 'fact' AND NEW.method IN ('hitl', 'source_field'))
         OR (NEW.evidence_tier = 'observed' AND NEW.method IN ('parser', 'e1_rule', 'e2_llm', 'legacy'))
         OR (NEW.evidence_tier = 'inferred' AND NEW.method IN ('e1_rule', 'e2_llm', 'kev'))) THEN
      RAISE EXCEPTION 'field_assertions: cặp lớp/phương pháp không hợp lệ (% / %)', NEW.evidence_tier, NEW.method;
    END IF;
    IF NEW.field IN ('bedrooms', 'bathrooms') AND btrim(NEW.value) !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'field_assertions: % phải là số nguyên, nhận «%»', NEW.field, NEW.value;
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF OLD.retracted_at IS NOT NULL THEN
    RAISE EXCEPTION 'field_assertions: đã rút — không đổi được nữa, id %', OLD.id;
  END IF;
  IF (to_jsonb(NEW) - 'retracted_at' - 'retract_reason' - 'value_key')
     IS DISTINCT FROM (to_jsonb(OLD) - 'retracted_at' - 'retract_reason' - 'value_key') THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  IF NEW.retracted_at IS NULL THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  IF coalesce(btrim(NEW.retract_reason), '') = '' THEN
    RAISE EXCEPTION 'field_assertions: rút phải có lý do, id %', OLD.id;
  END IF;
  RETURN NEW;
END $$;

-- 5. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed: trục assertion_field, mã kev, cột field_assertions.field)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'property_type', 'PropertySubType', 'Loại hình', false, 1),
  ('assertion_field', 'bedrooms', 'BedroomsTotal', 'Phòng ngủ', false, 2),
  ('assertion_field', 'bathrooms', 'BathroomsTotalInteger', 'WC', false, 3),
  ('assertion_field', 'street_raw', 'StreetName', 'Đường', false, 4),
  ('assertion_field', 'block_raw', 'BuildingName', 'Toà', false, 5),
  ('assertion_field', 'listing_intent', NULL, 'Ý định tin', true, 6),
  ('assertion_field', 'kind', 'PropertyType', 'Loại tin', false, 7),
  ('assertion_method', 'kev', NULL, 'Bộ lọc Kev', true, 7)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('field_assertions', 'field', 'assertion_field')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
