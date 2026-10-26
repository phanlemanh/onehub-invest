-- 048_so_nhom_mot_noi.sql — PL12 `so-nhom-mot-noi`: một sổ đơn vị thu cho mọi nguồn (collection_units).
-- Nguồn: review phân loại §0.3 F1 · docs/research/ops-tu-van-hanh-nguon-saas.md §3.2, §4.8 #7 · ADR-0015 · design doc
-- docs/superpowers/specs/2026-10-26-so-nhom-mot-noi-design.md · hồ sơ _acceptance/so-nhom-mot-noi (Mạnh duyệt 26/10).
-- Số 048 do phiên liên làn cấp (sổ SO-MIGRATION). Đơn vị thu là cấu hình vận hành, không phải field tin/căn — ngoài RESO.
--
-- source_groups đổi tên thành collection_units, giữ nguyên dòng, id, dãy, khoá, năm CHECK và trigger của 047. Tên cũ
-- thành view gồm MỌI dòng với đúng cột cũ (ghi xuyên được) — script thu của làn ZCode, che-do-thu, ha-bung-het-han và
-- isRunnable chạy y như trước. Cột mới: unit_code (S03-N012, máy cấp theo cặp nguồn × loại, không cấp lại, không sửa
-- được), unit_type (nhom · vung · market), original_name, market_codes (areas market), project_node_ids (asset_nodes
-- project — Hỏi-3: chỉ khu đô thị).
--
-- KHÔNG sync cloud (tầng A — ADR-0007): Supabase không có bảng này, khối tự bỏ qua khi thiếu bảng.
-- Áp lên DB local :5433 dùng chung CHỈ sau khi gộp (lời dặn của phiên liên làn khi cấp số).
-- Tên không mang tiền tố lược đồ: phép đo chạy tệp này trên lược đồ tạm mà không chạm bảng thật.

BEGIN;

DO $khoi$
BEGIN
  IF to_regclass('collection_units') IS NULL THEN
    IF to_regclass('source_groups') IS NULL THEN
      RAISE NOTICE '048: không có bảng source_groups — bỏ qua';
      RETURN;
    END IF;
    ALTER TABLE source_groups RENAME TO collection_units;
  END IF;

  ALTER TABLE collection_units ADD COLUMN IF NOT EXISTS unit_code text;
  ALTER TABLE collection_units ADD COLUMN IF NOT EXISTS unit_type text;
  ALTER TABLE collection_units ADD COLUMN IF NOT EXISTS original_name text;
  ALTER TABLE collection_units ADD COLUMN IF NOT EXISTS market_codes text[] NOT NULL DEFAULT '{}';
  ALTER TABLE collection_units ADD COLUMN IF NOT EXISTS project_node_ids bigint[] NOT NULL DEFAULT '{}';

  -- Loại theo nguồn cho dòng cũ (hôm nay chỉ S05, S06); nguồn khác để NULL để SET NOT NULL dưới đây lỗi có tên.
  UPDATE collection_units
     SET unit_type = CASE source_code WHEN 'S03' THEN 'nhom' WHEN 'S05' THEN 'nhom' WHEN 'S06' THEN 'vung'
                                      WHEN 'S02' THEN 'market' END
   WHERE unit_type IS NULL;
  UPDATE collection_units SET original_name = name WHERE original_name IS NULL;
  ALTER TABLE collection_units ALTER COLUMN unit_type SET NOT NULL;
  ALTER TABLE collection_units DROP CONSTRAINT IF EXISTS collection_units_unit_type_chk;
  ALTER TABLE collection_units ADD CONSTRAINT collection_units_unit_type_chk
    CHECK (unit_type IN ('nhom', 'vung', 'market'));

  -- Bộ đếm mã theo (nguồn, loại): chỉ tăng — xoá dòng hay retired không trả số về.
  CREATE TABLE IF NOT EXISTS collection_unit_seq (
    source_code text NOT NULL,
    unit_type   text NOT NULL,
    last        int  NOT NULL,
    PRIMARY KEY (source_code, unit_type)
  );

  WITH cap AS (
    SELECT id, source_code, unit_type,
           row_number() OVER (PARTITION BY source_code, unit_type ORDER BY id)
             + coalesce((SELECT s.last FROM collection_unit_seq s
                          WHERE s.source_code = u.source_code AND s.unit_type = u.unit_type), 0) AS n
      FROM collection_units u
     WHERE unit_code IS NULL
  )
  UPDATE collection_units u
     SET unit_code = cap.source_code || '-'
                     || CASE cap.unit_type WHEN 'nhom' THEN 'N' WHEN 'vung' THEN 'V' ELSE 'M' END
                     || lpad(cap.n::text, 3, '0')
    FROM cap
   WHERE u.id = cap.id;

  INSERT INTO collection_unit_seq (source_code, unit_type, last)
  SELECT source_code, unit_type, max(substring(unit_code FROM '[0-9]{3}$')::int)
    FROM collection_units GROUP BY source_code, unit_type
  ON CONFLICT (source_code, unit_type) DO UPDATE SET last = greatest(collection_unit_seq.last, EXCLUDED.last);

  ALTER TABLE collection_units ALTER COLUMN unit_code SET NOT NULL;
  ALTER TABLE collection_units DROP CONSTRAINT IF EXISTS collection_units_unit_code_chk;
  ALTER TABLE collection_units ADD CONSTRAINT collection_units_unit_code_chk
    CHECK (unit_code ~ '^S0[0-9]-[NVM][0-9]{3}$');
  ALTER TABLE collection_units DROP CONSTRAINT IF EXISTS collection_units_unit_code_key;
  ALTER TABLE collection_units ADD CONSTRAINT collection_units_unit_code_key UNIQUE (unit_code);

  -- Chèn: suy loại và tên gốc khi đường ghi cũ không nêu, cấp mã từ bộ đếm. Mã do máy cấp — chèn kèm mã bị từ chối.
  CREATE OR REPLACE FUNCTION collection_units_cap_ma() RETURNS trigger LANGUAGE plpgsql AS $fn$
  DECLARE
    n int;
  BEGIN
    IF NEW.unit_code IS NOT NULL THEN
      RAISE EXCEPTION 'collection_units_cap_ma: unit_code do máy cấp, không chèn kèm mã'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.unit_type IS NULL THEN
      NEW.unit_type := CASE NEW.source_code WHEN 'S03' THEN 'nhom' WHEN 'S05' THEN 'nhom' WHEN 'S06' THEN 'vung'
                                            WHEN 'S02' THEN 'market' END;
      IF NEW.unit_type IS NULL THEN
        RAISE EXCEPTION 'collection_units: không suy được unit_type cho %', NEW.source_code
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    NEW.original_name := coalesce(NEW.original_name, NEW.name);
    INSERT INTO collection_unit_seq (source_code, unit_type, last) VALUES (NEW.source_code, NEW.unit_type, 1)
    ON CONFLICT (source_code, unit_type) DO UPDATE SET last = collection_unit_seq.last + 1
    RETURNING last INTO n;
    IF n > 999 THEN
      RAISE EXCEPTION 'collection_units_cap_ma: hết mã cho % %', NEW.source_code, NEW.unit_type
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.unit_code := NEW.source_code || '-'
                     || CASE NEW.unit_type WHEN 'nhom' THEN 'N' WHEN 'vung' THEN 'V' ELSE 'M' END
                     || lpad(n::text, 3, '0');
    RETURN NEW;
  END
  $fn$;

  -- Mã và loại đã cấp không sửa được (mã là khoá cho lệnh và nhật ký về sau).
  CREATE OR REPLACE FUNCTION collection_units_khoa_ma() RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN
    IF NEW.unit_code IS DISTINCT FROM OLD.unit_code OR NEW.unit_type IS DISTINCT FROM OLD.unit_type THEN
      RAISE EXCEPTION 'collection_units_khoa_ma: không sửa unit_code/unit_type của %', OLD.unit_code
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END
  $fn$;

  -- market_codes chỉ nhận vùng cấp thị trường; project_node_ids chỉ nhận khu đô thị (Hỏi-3).
  CREATE OR REPLACE FUNCTION collection_units_kiem_tham_chieu() RETURNS trigger LANGUAGE plpgsql AS $fn$
  DECLARE
    sai text;
  BEGIN
    IF cardinality(NEW.market_codes) > 0 THEN
      IF to_regclass('areas') IS NULL THEN
        RAISE EXCEPTION 'collection_units_kiem_tham_chieu: không có bảng areas để kiểm market_codes'
          USING ERRCODE = 'check_violation';
      END IF;
      SELECT m INTO sai FROM unnest(NEW.market_codes) m
       WHERE NOT EXISTS (SELECT 1 FROM areas a WHERE a.id = m AND a.region_type = 'market') LIMIT 1;
      IF FOUND THEN
        RAISE EXCEPTION 'collection_units_kiem_tham_chieu: % không phải thị trường', sai
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    IF cardinality(NEW.project_node_ids) > 0 THEN
      IF to_regclass('asset_nodes') IS NULL THEN
        RAISE EXCEPTION 'collection_units_kiem_tham_chieu: không có bảng asset_nodes để kiểm project_node_ids'
          USING ERRCODE = 'check_violation';
      END IF;
      SELECT p::text INTO sai FROM unnest(NEW.project_node_ids) p
       WHERE NOT EXISTS (SELECT 1 FROM asset_nodes n WHERE n.id = p AND n.node_type = 'project') LIMIT 1;
      IF FOUND THEN
        RAISE EXCEPTION 'collection_units_kiem_tham_chieu: node % không phải khu đô thị', sai
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END
  $fn$;

  DROP TRIGGER IF EXISTS collection_units_cap_ma ON collection_units;
  CREATE TRIGGER collection_units_cap_ma
    BEFORE INSERT ON collection_units
    FOR EACH ROW EXECUTE FUNCTION collection_units_cap_ma();
  DROP TRIGGER IF EXISTS collection_units_khoa_ma ON collection_units;
  CREATE TRIGGER collection_units_khoa_ma
    BEFORE UPDATE OF unit_code, unit_type ON collection_units
    FOR EACH ROW EXECUTE FUNCTION collection_units_khoa_ma();
  DROP TRIGGER IF EXISTS collection_units_kiem_tham_chieu ON collection_units;
  CREATE TRIGGER collection_units_kiem_tham_chieu
    BEFORE INSERT OR UPDATE OF market_codes, project_node_ids ON collection_units
    FOR EACH ROW EXECUTE FUNCTION collection_units_kiem_tham_chieu();

  -- Tên cũ: view một bảng không lọc → PostgreSQL cho ghi xuyên (INSERT/UPDATE/DELETE, SELECT … FOR UPDATE); cột vắng
  -- khi chèn qua view nhận mặc định của bảng gốc.
  CREATE OR REPLACE VIEW source_groups AS
    SELECT id, source_code, group_key, name, enabled, params, note, created_at, updated_at, status, reason, resume_when
      FROM collection_units;
END
$khoi$;

COMMIT;
