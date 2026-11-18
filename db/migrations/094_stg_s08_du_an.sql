-- 094_stg_s08_du_an.sql — DA30 stg-du-an-s08: staging cấp dự án của S08 (item project_catalog + inventory_unit/detail)
-- Thiết kế: docs/superpowers/specs/2026-11-12-stg-du-an-s08-design.md · ADR-0011/0013 (stg giữ hình dạng nguồn; ánh DD 2.1 ở DA3)
-- KHÔNG sync cloud: payload có chữ mang tên nguồn thật (tầng A) — sync-cloud.mjs, app/, data-api/ không nhắc bảng này.
-- Thông tin dự án là công khai (ROADMAP §3 mục 38) nhưng bảng stg_* thô không lên nguyên bảng; đường lên cloud là danh bạ (DA3).
--
-- Một dòng = một dự án ở MỘT snapshot. Bộ nạp (làn ZCode) chỉ ghi năm cột thô bằng hàm dongDuAnS08 của
-- pipeline/lib/s08-du-an.mjs và câu chèn ON CONFLICT (snapshot_id, project_id) DO NOTHING; mọi cột đọc được là cột sinh.
-- Điểm bóc từ khung bản đồ nhúng (!2d<kinh độ>!3d<vĩ độ>) bằng mẫu số chặt: khung lạ cho điểm NULL, không làm hỏng lượt nạp.
CREATE TABLE IF NOT EXISTS stg_s08_project (
  snapshot_id        text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  project_id         text NOT NULL,   -- id dự án phía nguồn (meta.projectId)
  catalog_payload    jsonb NOT NULL,  -- nguyên vẹn payload item project_catalog
  detail_payload     jsonb,           -- nguyên vẹn payload item inventory_unit state detail; NULL khi snapshot thiếu
  fetched_at         timestamptz,
  project_code       text GENERATED ALWAYS AS (catalog_payload ->> 'project_code') STORED,
  project_name       text GENERATED ALWAYS AS (catalog_payload ->> 'project_name') STORED,
  project_address    text GENERATED ALWAYS AS (catalog_payload ->> 'project_address') STORED,
  investor           text GENERATED ALWAYS AS (catalog_payload ->> 'investor') STORED,
  project_type       text GENERATED ALWAYS AS (catalog_payload ->> 'project_type') STORED,       -- low_rise | high_rise
  ownership_type_raw text GENERATED ALWAYS AS (detail_payload -> 'project_info' ->> 'ownership_type') STORED,  -- chữ tự do
  total_area_raw     text GENERATED ALWAYS AS (detail_payload -> 'project_info' ->> 'total_area') STORED,
  progress_raw       text GENERATED ALWAYS AS (detail_payload -> 'project_info' ->> 'progress') STORED,
  point_lng          numeric GENERATED ALWAYS AS ((regexp_match(detail_payload -> 'project_info' ->> 'iframe_location',
                       '!2d(-?[0-9]{1,3}\.[0-9]+)!3d(-?[0-9]{1,2}\.[0-9]+)'))[1]::numeric) STORED,
  point_lat          numeric GENERATED ALWAYS AS ((regexp_match(detail_payload -> 'project_info' ->> 'iframe_location',
                       '!2d(-?[0-9]{1,3}\.[0-9]+)!3d(-?[0-9]{1,2}\.[0-9]+)'))[2]::numeric) STORED,
  PRIMARY KEY (snapshot_id, project_id)
);
CREATE INDEX IF NOT EXISTS stg_s08_project_pid_idx ON stg_s08_project(project_id);
