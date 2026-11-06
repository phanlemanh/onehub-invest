-- 079_lien_lac_nguoi.sql — enrich-nguoi-s03: sổ liên lạc của Người (party_contacts, chỉ thêm) + nhãn số qua người đăng.
-- docs/superpowers/specs/2026-11-06-enrich-nguoi-s03-design.md · _acceptance/enrich-nguoi-s03 · ADR-0016 §3, §8.
-- Liên lạc là phát biểu, khác bí danh định danh (registry_aliases): một số dùng chung liên lạc được nhiều Người mà không gộp họ.
-- KHÔNG sync cloud party_contacts (như bốn bảng 055). Số, mã tài khoản người đăng là tầng C; số chỉ rời máy qua
-- sale_offers.seller_phone như hôm nay. Áp lên DB máy thu là lời riêng của Mạnh (pg_dump trước). Idempotent.

-- ---- 1. Sổ liên lạc (khuôn party_roles của 055) ----
CREATE TABLE IF NOT EXISTS party_contacts (
  id             bigserial PRIMARY KEY,
  party_key      text NOT NULL REFERENCES parties (party_key),
  kind           text NOT NULL CHECK (kind IN ('sdt', 'chat_profile')),
  value          text NOT NULL,
  evidence_tier  text NOT NULL CHECK (evidence_tier IN ('fact', 'observed', 'inferred')),
  method         text NOT NULL CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy')),
  rule_id        text NOT NULL CHECK (rule_id IN ('so_tren_tin', 'so_trong_bai')),
  evidence       jsonb NOT NULL DEFAULT '{}',
  observed_at    timestamptz NOT NULL DEFAULT now(),
  run_id         text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  retracted_at   timestamptz,
  retract_reason text,
  CONSTRAINT party_contacts_rut_chk CHECK ((retracted_at IS NULL) = (retract_reason IS NULL)),
  -- sdt: số gốc E.164 (SD3); chat_profile: username trần của tài khoản kênh chat, khác rỗng — không link, không tên miền; link
  -- dựng lúc hiển thị từ source_registry local (hồ sơ link-nguoi-ban-s03, 080, ghi sau với rule_id riêng; vòng này chưa có bộ ghi)
  CONSTRAINT party_contacts_value_chk CHECK (
    (kind = 'sdt' AND value ~ '^\+84[35789][0-9]{8}$') OR (kind = 'chat_profile' AND btrim(value) <> ''))
);
CREATE UNIQUE INDEX IF NOT EXISTS party_contacts_song_uq ON party_contacts (party_key, kind, value, rule_id)
  WHERE retracted_at IS NULL;
CREATE INDEX IF NOT EXISTS party_contacts_party_idx ON party_contacts (party_key);

-- ---- 2. Rào chỉ-thêm: không xoá, chỉ rút một lần có lý do; cặp lớp/phương pháp như 045 ----
CREATE OR REPLACE FUNCTION party_contacts_chi_them()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
    RAISE EXCEPTION 'party_contacts: chỉ thêm — không xoá (% bị từ chối)', TG_OP;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.retracted_at IS NOT NULL THEN
      RAISE EXCEPTION 'party_contacts: chỉ thêm — không ghi liên lạc đã rút';
    END IF;
    IF NOT ((NEW.evidence_tier = 'fact' AND NEW.method IN ('hitl', 'source_field'))
         OR (NEW.evidence_tier = 'observed' AND NEW.method IN ('parser', 'e1_rule', 'e2_llm', 'legacy'))
         OR (NEW.evidence_tier = 'inferred' AND NEW.method IN ('e1_rule', 'e2_llm'))) THEN
      RAISE EXCEPTION 'party_contacts: cặp lớp/phương pháp không hợp lệ (% / %)', NEW.evidence_tier, NEW.method;
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.retracted_at IS NOT NULL OR NEW.retracted_at IS NULL OR NEW.retract_reason IS NULL
     OR btrim(NEW.retract_reason) = ''
     OR (to_jsonb(NEW) - 'retracted_at' - 'retract_reason') IS DISTINCT FROM (to_jsonb(OLD) - 'retracted_at' - 'retract_reason') THEN
    RAISE EXCEPTION 'party_contacts: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS party_contacts_chi_them_dong ON party_contacts;
CREATE TRIGGER party_contacts_chi_them_dong BEFORE INSERT OR UPDATE OR DELETE ON party_contacts
  FOR EACH ROW EXECUTE FUNCTION party_contacts_chi_them();
DROP TRIGGER IF EXISTS party_contacts_chi_them_truncate ON party_contacts;
CREATE TRIGGER party_contacts_chi_them_truncate BEFORE TRUNCATE ON party_contacts
  FOR EACH STATEMENT EXECUTE FUNCTION party_contacts_chi_them();

-- ---- 3. Nhãn số chưa xác minh: giữ nguyên mọi cột và thứ tự của 070, chỉ mở cột cuối cho dấu s03-qua-nguoi-dang ----
-- S06 giữ «hỏng theo hướng đóng» của 070; S03 số trực tiếp (không dấu) vẫn false. So sánh bằng IS NOT DISTINCT FROM: «=» với dấu
-- vắng cho NULL, và app đọc NULL là chưa xác minh (PHONE_INFERRED) — mọi số S03 trực tiếp sẽ mang nhãn sai.
CREATE OR REPLACE VIEW sale_offers AS
SELECT offer_id, area_id, kind, price_vnd, area_m2, price_perm2, bedrooms, phuong_raw, confidence, first_seen, last_seen,
       n_reposts, post_ids, source, price_tier, district_raw, seller_name, seller_phone, seller_phone_hash, seller_ref,
       bait_gap_pct, listing_url, property_type, street_raw, block_raw, floor_raw, bathrooms, retired_at, retired_reason,
       superseded_by, originating_system_key, field_provenance, offer_status, street_number, unit_number, frontage_length,
       lot_size_dimensions, stories, latitude, longitude,
       (seller_phone IS NOT NULL
        AND ((source = 'S06' AND field_provenance -> 'seller_phone' ->> 'rule_id' IS DISTINCT FROM 's06-so-tren-tin')
             OR field_provenance -> 'seller_phone' ->> 'rule_id' IS NOT DISTINCT FROM 's03-qua-nguoi-dang')) AS seller_phone_inferred
  FROM sale_offer_records
 WHERE retired_at IS NULL;

-- ---- 4. Sổ từ vựng (sinh bằng `node pipeline/vocab.mjs --emit-seed`, lọc hai trục mới) ----
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('contact_kind', 'sdt', NULL, 'Số điện thoại', true, 1),
  ('contact_kind', 'chat_profile', NULL, 'Hồ sơ chat', true, 2),
  ('contact_rule', 'so_tren_tin', NULL, 'Số trên tin của chính người đăng', true, 1),
  ('contact_rule', 'so_trong_bai', NULL, 'Số trong bài khác của người đăng', true, 2)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('party_contacts', 'kind', 'contact_kind'),
  ('party_contacts', 'rule_id', 'contact_rule')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
