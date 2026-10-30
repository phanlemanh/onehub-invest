-- 055_danh_ba_nguoi.sql — DB2b ho-nguoi-theo-nguon: khung chung danh bạ (ADR-0016 §3) + danh bạ Người theo từng nguồn,
-- vai «người đăng» là phát biểu chỉ-thêm (ADR-0016 §8, §10 Đợt 2b).
-- Căn cứ: docs/adr/0016-danh-ba-vat-the-va-nguoi.md · docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md
-- KHÔNG sync cloud ở hàng này (Hỏi-3): bốn bảng không có trong FILL của pipeline/sync-cloud.mjs. Tên, SĐT băm, ID tài
-- khoản người đăng là tầng C (ADR-0007 sửa đổi 23/10); nguồn chỉ là mã S0x (CHECK).
-- Idempotent: nạp lại không lỗi, lược đồ không đổi.

-- ---- Khung chung: người (bảng thuộc tính rỗng — thuộc tính là bí danh) ----
CREATE TABLE IF NOT EXISTS parties (
  party_key   text PRIMARY KEY CHECK (party_key ~ '^pty_[0-9A-HJKMNP-TV-Z]{26}$'),
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into text REFERENCES parties (party_key),
  source      text NOT NULL CHECK (source ~ '^S0[1-9]$'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- Khung chung: bí danh dùng chung mọi danh bạ (người · toà · trục · căn) ----
CREATE TABLE IF NOT EXISTS registry_aliases (
  id         bigserial PRIMARY KEY,
  object_key text NOT NULL CHECK (object_key ~ '^(pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$'),
  kind       text NOT NULL CHECK (kind IN ('tai_khoan_nguon', 'sdt_bam', 'ten')),
  value      text NOT NULL CHECK (btrim(value) <> ''),
  source     text NOT NULL CHECK (source ~ '^S0[1-9]$'),
  first_seen timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
-- Một định danh (tài khoản, SĐT băm) thuộc đúng một đối tượng sống mỗi nguồn — cái chặn «nạp lại nhân người».
CREATE UNIQUE INDEX IF NOT EXISTS registry_aliases_dinh_danh_uq ON registry_aliases (source, kind, value)
  WHERE retired_at IS NULL AND kind IN ('tai_khoan_nguon', 'sdt_bam');
-- Tên không duy nhất giữa người (trùng tên), chỉ duy nhất trong một đối tượng.
CREATE UNIQUE INDEX IF NOT EXISTS registry_aliases_ten_uq ON registry_aliases (object_key, kind, value)
  WHERE kind = 'ten';
CREATE INDEX IF NOT EXISTS registry_aliases_object_idx ON registry_aliases (object_key);

-- ---- Khung chung: sự kiện gộp · tách · nghỉ (khuôn HistoryTransactional) — hàng này chưa ghi sự kiện nào ----
CREATE TABLE IF NOT EXISTS registry_events (
  id           bigserial PRIMARY KEY,
  object_key   text NOT NULL CHECK (object_key ~ '^(pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$'),
  kind         text NOT NULL CHECK (kind IN ('gop', 'tach', 'nghi')),
  related_keys text[] NOT NULL DEFAULT '{}',
  reason       text NOT NULL CHECK (btrim(reason) <> ''),
  changed_by   text NOT NULL,
  at           timestamptz NOT NULL DEFAULT now()
);

-- ---- Vai là phát biểu chỉ-thêm (cặp lớp/phương pháp như field_assertions, 045) ----
CREATE TABLE IF NOT EXISTS party_roles (
  id             bigserial PRIMARY KEY,
  party_key      text NOT NULL REFERENCES parties (party_key),
  role           text NOT NULL CHECK (role IN ('nguoi_dang')),
  subject_key    text NOT NULL CHECK (subject_key ~ '^S0[1-9]:.+$'), -- khoá tin <S0x>:<OriginatingSystemKey> (ADR-0016 §5)
  evidence_tier  text NOT NULL CHECK (evidence_tier IN ('fact', 'observed', 'inferred')),
  method         text NOT NULL CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy')),
  evidence       jsonb NOT NULL DEFAULT '{}',
  observed_at    timestamptz NOT NULL DEFAULT now(),
  run_id         text NOT NULL,
  retracted_at   timestamptz,
  retract_reason text,
  CONSTRAINT party_roles_rut_chk CHECK ((retracted_at IS NULL) = (retract_reason IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS party_roles_song_uq ON party_roles (subject_key, role, party_key)
  WHERE retracted_at IS NULL;
CREATE INDEX IF NOT EXISTS party_roles_party_idx ON party_roles (party_key);

-- ---- Rào chỉ-thêm ----
CREATE OR REPLACE FUNCTION danh_ba_chi_them()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('DELETE', 'TRUNCATE') THEN
    RAISE EXCEPTION '%: chỉ thêm — không xoá (% bị từ chối)', TG_TABLE_NAME, TG_OP;
  END IF;
  IF TG_TABLE_NAME = 'registry_events' THEN
    RAISE EXCEPTION 'registry_events: chỉ thêm — sự kiện không sửa được, id %', OLD.id;
  END IF;
  IF TG_TABLE_NAME = 'parties' THEN
    IF NEW.party_key IS DISTINCT FROM OLD.party_key OR NEW.source IS DISTINCT FROM OLD.source
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'parties: chỉ thêm — khoá, nguồn, ngày tạo không đổi được, %', OLD.party_key;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'registry_aliases' THEN
    IF OLD.retired_at IS NOT NULL OR NEW.retired_at IS NULL
       OR (NEW.object_key, NEW.kind, NEW.value, NEW.source, NEW.first_seen)
          IS DISTINCT FROM (OLD.object_key, OLD.kind, OLD.value, OLD.source, OLD.first_seen) THEN
      RAISE EXCEPTION 'registry_aliases: chỉ thêm — chỉ được nghỉ bí danh một lần (retired_at), id %', OLD.id;
    END IF;
    RETURN NEW;
  END IF;
  -- party_roles: chỉ rút (retracted_at + lý do), một lần
  IF OLD.retracted_at IS NOT NULL OR NEW.retracted_at IS NULL OR NEW.retract_reason IS NULL
     OR btrim(NEW.retract_reason) = ''
     OR (NEW.party_key, NEW.role, NEW.subject_key, NEW.evidence_tier, NEW.method, NEW.evidence, NEW.observed_at, NEW.run_id)
        IS DISTINCT FROM (OLD.party_key, OLD.role, OLD.subject_key, OLD.evidence_tier, OLD.method, OLD.evidence, OLD.observed_at, OLD.run_id) THEN
    RAISE EXCEPTION 'party_roles: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  RETURN NEW;
END $$;

-- Cặp lớp/phương pháp hợp lệ (cùng bảng của field_assertions_guard, 045) — trigger, không CHECK hai cột,
-- để `vocab --check-db` đọc đúng CHECK một cột của từng trục.
CREATE OR REPLACE FUNCTION party_roles_cap_lop()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT ((NEW.evidence_tier = 'fact' AND NEW.method IN ('hitl', 'source_field'))
       OR (NEW.evidence_tier = 'observed' AND NEW.method IN ('parser', 'e1_rule', 'e2_llm', 'legacy'))
       OR (NEW.evidence_tier = 'inferred' AND NEW.method IN ('e1_rule', 'e2_llm'))) THEN
    RAISE EXCEPTION 'party_roles: cặp lớp/phương pháp không hợp lệ (% / %)', NEW.evidence_tier, NEW.method;
  END IF;
  RETURN NEW;
END $$;

-- merged_into bắt buộc đúng khi merged — trigger, cùng lý do (CHECK một cột cho mỗi trục).
CREATE OR REPLACE FUNCTION parties_gop_chk()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.status = 'merged') IS DISTINCT FROM (NEW.merged_into IS NOT NULL) THEN
    RAISE EXCEPTION 'parties: merged_into bắt buộc khi và chỉ khi status = merged (%, %)', NEW.status, NEW.merged_into;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['parties', 'registry_aliases', 'registry_events', 'party_roles'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_chi_them_dong', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION danh_ba_chi_them()',
                   t || '_chi_them_dong', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_chi_them_truncate', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION danh_ba_chi_them()',
                   t || '_chi_them_truncate', t);
  END LOOP;
END $$;
DROP TRIGGER IF EXISTS party_roles_cap_lop ON party_roles;
CREATE TRIGGER party_roles_cap_lop BEFORE INSERT ON party_roles FOR EACH ROW EXECUTE FUNCTION party_roles_cap_lop();
DROP TRIGGER IF EXISTS parties_gop_chk ON parties;
CREATE TRIGGER parties_gop_chk BEFORE INSERT OR UPDATE ON parties FOR EACH ROW EXECUTE FUNCTION parties_gop_chk();

-- ---- Sổ từ vựng (sinh bằng `node pipeline/vocab.mjs --emit-seed`, lọc bốn trục mới + hai cột party_roles) ----
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('registry_status', 'active', NULL, 'Đang dùng', true, 1),
  ('registry_status', 'merged', NULL, 'Đã gộp', true, 2),
  ('registry_status', 'split', NULL, 'Đã tách', true, 3),
  ('registry_status', 'retired', NULL, 'Đã nghỉ', true, 4),
  ('alias_kind', 'tai_khoan_nguon', NULL, 'Tài khoản tại nguồn', true, 1),
  ('alias_kind', 'sdt_bam', NULL, 'SĐT băm', true, 2),
  ('alias_kind', 'ten', NULL, 'Tên hiển thị', true, 3),
  ('registry_event_kind', 'gop', NULL, 'Gộp', true, 1),
  ('registry_event_kind', 'tach', NULL, 'Tách', true, 2),
  ('registry_event_kind', 'nghi', NULL, 'Nghỉ', true, 3),
  ('party_role', 'nguoi_dang', NULL, 'Người đăng', true, 1)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('party_roles', 'evidence_tier', 'evidence_tier'),
  ('party_roles', 'method', 'assertion_method'),
  ('parties', 'status', 'registry_status'),
  ('registry_aliases', 'kind', 'alias_kind'),
  ('registry_events', 'kind', 'registry_event_kind'),
  ('party_roles', 'role', 'party_role')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
