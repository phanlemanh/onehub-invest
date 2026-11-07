-- 083_do_hang_ngay.sql — DO1 do-hieu-qua-hang-ngay: nháp máy chụp lúc rút mẫu soát, bậc hiện hành từng đơn vị, dòng chuyển bậc.
-- docs/superpowers/specs/2026-11-07-do-hieu-qua-hang-ngay-design.md · _acceptance/do-hieu-qua-hang-ngay (Mạnh duyệt 07/11).
-- Số 083 do giám sát đợt dot0-cam-mau cấp (sổ SO-MIGRATION). Trục `data_level` là mở rộng local đã có (056, mappings.yaml).
-- KHÔNG sync cloud: ba vật dưới không vào FILL của pipeline/sync-cloud.mjs — số gộp lên cloud qua dq_check_results (do1-*).
-- Áp lên DB máy thu là lời riêng của Mạnh (Hỏi-3), sau gộp. Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Nháp của từng cách đọc, chụp lúc rút thẻ mẫu soát (lát s03-cuon-chieu) ----
-- {hien, cach_doc: {<khoá>: {trang_thai: co|khong-tin|vang, o: {<ô>: <chuỗi chuẩn hoá>|null}}}, chup_luc}
ALTER TABLE eval_label_items ADD COLUMN IF NOT EXISTS draft jsonb;

-- ---- 2. Bậc hiện hành từng đơn vị (căn: 'can:<property_id>', tin lẻ: 'tin:<offer_id>') ----
CREATE TABLE IF NOT EXISTS data_level_unit (
  unit_key     text PRIMARY KEY CHECK (unit_key ~ '^(can|tin):.+$'),
  unit         text NOT NULL CHECK (unit IN ('can', 'tin_le')),
  source       text,                                  -- mã S0x (tin lẻ: nguồn của tin; căn: nguồn của tin gắn sớm nhất)
  data_level   text NOT NULL CHECK (data_level IN ('B0', 'B1', 'B2', 'B3', 'B4', 'B5')),
  ke_thieu     text,
  core         jsonb NOT NULL,                        -- {kind,property_type,price_vnd,area_m2,area_id: đủ?, measured, tin: [offer_id]}
  market_id    text,
  ward_id      text,
  project_key  text,                                  -- khoá vật thể dự án; NULL = chưa gắn (lý do ở core.chua)
  building_key text,
  seen_on      date NOT NULL
);

-- ---- 3. Dòng chuyển bậc: một dòng mỗi đơn vị đổi bậc mỗi ngày (giờ VN) ----
CREATE TABLE IF NOT EXISTS data_level_change (
  snap_date    date NOT NULL,
  unit_key     text NOT NULL,
  unit         text NOT NULL CHECK (unit IN ('can', 'tin_le')),
  source       text,
  from_level   text CHECK (from_level IS NULL OR from_level IN ('B0', 'B1', 'B2', 'B3', 'B4', 'B5')),
  to_level     text CHECK (to_level IS NULL OR to_level IN ('B0', 'B1', 'B2', 'B3', 'B4', 'B5')),
  huong        text NOT NULL CHECK (huong IN ('len', 'tut', 'moi', 'mat')),
  ly_do        text[] NOT NULL CHECK (cardinality(ly_do) > 0),
  market_id    text,
  ward_id      text,
  project_key  text,
  building_key text,
  PRIMARY KEY (snap_date, unit_key),
  CHECK ((huong = 'moi') = (from_level IS NULL)),
  CHECK ((huong = 'mat') = (to_level IS NULL))
);
CREATE INDEX IF NOT EXISTS data_level_change_ngay_idx ON data_level_change (snap_date, huong);

-- ---- 4. Cột theo trục data_level (pipeline/mappings.yaml `columns`) ----
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('data_level_unit', 'data_level', 'data_level'),
  ('data_level_change', 'from_level', 'data_level'),
  ('data_level_change', 'to_level', 'data_level')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
