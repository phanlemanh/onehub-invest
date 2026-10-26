-- 047_vong_doi_nguon.sql — TV2a `vong-doi-nguon`: vòng đời năm trạng thái cho nguồn và đơn vị thu.
-- Nguồn: ADR-0015 (đường lệnh kéo một chiều) · design doc docs/superpowers/specs/2026-10-26-vong-doi-nguon-design.md ·
-- hồ sơ _acceptance/vong-doi-nguon (Mạnh duyệt 26/10). Số 047 do phiên liên làn cấp (sổ SO-MIGRATION).
--
-- source_registry và source_groups: status ∈ draft · active · paused · retired · completed (CHECK); paused bắt buộc
-- reason; resume_when (điều kiện bật lại) tuỳ chọn. Với source_groups, status là nguồn sự thật và enabled là bản soi do
-- trigger giữ khớp (CHECK enabled = (status = 'active')) — script thu của làn ZCode và mọi đường ghi cũ còn ghi
-- enabled chạy y như trước. Migration không đổi trạng thái của dòng nào: dòng paused nhận reason từ note, nhóm
-- enabled = false thành paused kèm lý do cố định. Không ghi tên nguồn nào.
--
-- KHÔNG sync cloud (tầng A — ADR-0007, luật 6): Supabase không có hai bảng này, mỗi khối tự bỏ qua khi thiếu bảng.
-- Áp lên DB local :5433 dùng chung CHỈ sau khi gộp (lời dặn của phiên liên làn khi cấp số).
-- Tên không mang tiền tố lược đồ: phép đo chạy tệp này trên lược đồ tạm mà không chạm bảng thật.

BEGIN;

DO $khoi$
BEGIN
  IF to_regclass('source_registry') IS NULL THEN
    RAISE NOTICE '047: không có bảng source_registry — bỏ qua khối nguồn';
    RETURN;
  END IF;

  ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS reason text;
  ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS resume_when text;

  -- Dòng đang tạm dừng mà chưa có lý do: lấy từ note, note trống thì ghi chuỗi cố định.
  UPDATE source_registry
     SET reason = coalesce(nullif(btrim(note), ''), 'trước TV2a: chưa ghi lý do')
   WHERE status = 'paused' AND length(btrim(coalesce(reason, ''))) = 0;

  ALTER TABLE source_registry DROP CONSTRAINT IF EXISTS source_registry_status_chk;
  ALTER TABLE source_registry ADD CONSTRAINT source_registry_status_chk
    CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed'));
  ALTER TABLE source_registry DROP CONSTRAINT IF EXISTS source_registry_paused_reason_chk;
  ALTER TABLE source_registry ADD CONSTRAINT source_registry_paused_reason_chk
    CHECK (status <> 'paused' OR length(btrim(coalesce(reason, ''))) > 0);
END
$khoi$;

DO $khoi$
BEGIN
  IF to_regclass('source_groups') IS NULL THEN
    RAISE NOTICE '047: không có bảng source_groups — bỏ qua khối đơn vị';
    RETURN;
  END IF;

  ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS status text;
  ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS reason text;
  ALTER TABLE source_groups ADD COLUMN IF NOT EXISTS resume_when text;

  UPDATE source_groups
     SET status = CASE WHEN enabled THEN 'active' ELSE 'paused' END,
         reason = CASE WHEN enabled THEN reason
                       ELSE coalesce(nullif(btrim(reason), ''), 'trước TV2a: tắt bằng công tắc enabled') END
   WHERE status IS NULL;

  -- Mặc định 'active' đặt SAU backfill (đặt lúc thêm cột thì dòng enabled = false cũng nhận 'active'). Bản chép
  -- LIKE … INCLUDING ALL mang mặc định và CHECK nhưng không mang trigger — chèn kiểu cũ (không nêu status, enabled
  -- true) vẫn ra 'active' khớp enabled (lỗi CI run 40302608712, sửa tại chỗ khi 047 chưa gộp — Mạnh duyệt 26/10).
  ALTER TABLE source_groups ALTER COLUMN status SET DEFAULT 'active';
  ALTER TABLE source_groups ALTER COLUMN status SET NOT NULL;

  ALTER TABLE source_groups DROP CONSTRAINT IF EXISTS source_groups_status_chk;
  ALTER TABLE source_groups ADD CONSTRAINT source_groups_status_chk
    CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed'));
  ALTER TABLE source_groups DROP CONSTRAINT IF EXISTS source_groups_paused_reason_chk;
  ALTER TABLE source_groups ADD CONSTRAINT source_groups_paused_reason_chk
    CHECK (status <> 'paused' OR length(btrim(coalesce(reason, ''))) > 0);
  ALTER TABLE source_groups DROP CONSTRAINT IF EXISTS source_groups_enabled_khop_chk;
  ALTER TABLE source_groups ADD CONSTRAINT source_groups_enabled_khop_chk
    CHECK (enabled = (status = 'active'));

  -- Giữ enabled khớp status. Lệnh nêu status (hoặc đổi status) thì status thắng; lệnh chỉ đổi enabled (đường ghi cũ)
  -- thì status suy theo trạng thái cũ — không bật lại được đơn vị đã gỡ hay đã xong (bảng 5 × 2 của design doc).
  CREATE OR REPLACE FUNCTION source_groups_dong_bo_enabled() RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      -- Không nêu status (NULL, hoặc mặc định 'active' mà enabled = false) → đường ghi cũ: suy từ enabled.
      IF NEW.status IS NULL OR (NEW.status = 'active' AND NOT NEW.enabled) THEN
        IF NEW.enabled THEN
          NEW.status := 'active';
        ELSE
          NEW.status := 'paused';
          NEW.reason := coalesce(nullif(btrim(NEW.reason), ''), 'tắt qua cột enabled (đường ghi cũ)');
        END IF;
      ELSE
        NEW.enabled := (NEW.status = 'active');
      END IF;
      RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.enabled := (NEW.status = 'active');
    ELSIF NEW.enabled IS DISTINCT FROM OLD.enabled THEN
      IF NEW.enabled THEN
        IF OLD.status IN ('retired', 'completed') THEN
          RAISE EXCEPTION 'source_groups: không bật được đơn vị % qua cột enabled', OLD.status
            USING ERRCODE = 'check_violation';
        END IF;
        NEW.status := 'active';
        NEW.reason := NULL;
        NEW.resume_when := NULL;
      ELSE
        -- Chỉ dòng active có enabled = true nên tới được đây.
        NEW.status := 'paused';
        NEW.reason := coalesce(nullif(btrim(NEW.reason), ''), 'tắt qua cột enabled (đường ghi cũ)');
      END IF;
    END IF;
    RETURN NEW;
  END
  $fn$;

  DROP TRIGGER IF EXISTS source_groups_dong_bo_enabled ON source_groups;
  CREATE TRIGGER source_groups_dong_bo_enabled
    BEFORE INSERT OR UPDATE ON source_groups
    FOR EACH ROW EXECUTE FUNCTION source_groups_dong_bo_enabled();
END
$khoi$;

COMMIT;
