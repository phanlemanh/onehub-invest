-- 058_inquiry_records.sql — bang-yeu-cau: bảng Yêu cầu bên mua (cần mua · cần thuê), đối xứng listing, theo khuôn bảng
-- bản ghi + view sống của 044 (sale_offer_records / sale_offers). Số 058 liên làn cấp (30/10).
-- Nguồn: docs/superpowers/specs/2026-10-30-bang-yeu-cau-design.md · RESO DD 2.1 SavedSearch (khoá/hệ thống) + trường RESO
-- phía bán dùng lại cho tiêu chí · sổ pipeline/mappings.yaml (khối inquiries, trục kind / property_type).
-- CHỈ DB local: không vào FILL / CLOUD_ALLOW của sync-cloud. Không cột danh tính người tìm (sender chỉ đi vào băm khoá).
-- Idempotent; migration KHÔNG ghi dòng nào vào bảng (chỉ hạt giống ref_field_lookup).

CREATE TABLE IF NOT EXISTS inquiry_records (
  inquiry_id             text PRIMARY KEY,          -- SavedSearchKey: 'inq_' + băm (nguồn · người gửi · chữ chuẩn hoá)
  source                 text NOT NULL,             -- OriginatingSystemName: mã S0x (ADR-0007)
  originating_system_key text NOT NULL,             -- OriginatingSystemKey: post_id bài neo (sớm nhất của nhóm)
  post_ids               text[] NOT NULL,           -- mọi bài cùng nhu cầu (đăng lại)
  kind                   text,                      -- PropertyType phía bán dùng lại: sale = mua · rent_lt = thuê
  property_type          text,                      -- PropertySubType dùng lại; trống khi chưa rõ (không ghi unknown)
  bedrooms               int,                       -- BedroomsTotal dùng lại
  area_m2                numeric,                   -- LivingArea dùng lại
  budget_min_vnd         bigint,                    -- ListPrice dùng lại, đầu dưới khoảng ngân sách
  budget_max_vnd         bigint,                    -- ListPrice dùng lại, đầu trên khoảng ngân sách
  area_id                text,                      -- phường khớp được; không khoá ngoại (reassign-areas xoá area không phải phường)
  market_id              text,                      -- thị trường (cha của phường, hoặc thị trường duy nhất nhóm khai)
  first_seen             timestamptz,               -- OriginalEntryTimestamp
  last_seen              timestamptz,               -- ModificationTimestamp
  intent_evidence        jsonb NOT NULL,            -- phát biểu ý định đã quyết {assertion_id, method, tier, p}
  retired_at             timestamptz,               -- nghỉ thay vì xoá (khuôn PL14)
  retired_reason         text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_records_kind_chk') THEN
    ALTER TABLE inquiry_records ADD CONSTRAINT inquiry_records_kind_chk CHECK (kind IN ('sale', 'rent_lt'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_records_property_type_chk') THEN
    ALTER TABLE inquiry_records ADD CONSTRAINT inquiry_records_property_type_chk
      CHECK (property_type IN ('apartment', 'house', 'land', 'room', 'commercial', 'unknown'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_records_source_chk') THEN
    ALTER TABLE inquiry_records ADD CONSTRAINT inquiry_records_source_chk CHECK (source ~ '^S0[0-9]$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_records_budget_chk') THEN
    ALTER TABLE inquiry_records ADD CONSTRAINT inquiry_records_budget_chk CHECK (budget_min_vnd <= budget_max_vnd);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiry_records_retired_chk') THEN
    ALTER TABLE inquiry_records ADD CONSTRAINT inquiry_records_retired_chk
      CHECK ((retired_at IS NULL) = (retired_reason IS NULL));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS inquiry_records_source_live_idx ON inquiry_records (source) WHERE retired_at IS NULL;

-- View sống: mọi chỗ ĐỌC dùng view, đường GHI dùng bảng bản ghi.
CREATE OR REPLACE VIEW inquiries AS SELECT * FROM inquiry_records WHERE retired_at IS NULL;

-- Cột gắn trục sổ (vocab --check-db đọc).
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('inquiry_records', 'kind', 'kind'),
  ('inquiry_records', 'property_type', 'property_type')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
