-- 100_ma_du_an_s06_nut.sql — DA32 ma-du-an-s06-thanh-nut: mã dự án S06 thành bí danh của nút dự án (lát mỏng của DA3).
-- docs/superpowers/specs/2026-11-14-ma-du-an-s06-thanh-nut-design.md · _acceptance/ma-du-an-s06-thanh-nut (Mạnh duyệt 14/11).
-- Số 100 dành cho dãy P4 (GS quyết 14/11, PR #450); DA3 lát đầy đủ lấy số mới và dựng tiếp trên hai bảng của tệp này.
-- Mở registry_aliases và registry_events cho nút dự án (object_key 'node:<id>'), thêm hạng tin cậy cho nút, bảng trạng thái
-- nối mã nguồn (project_links) và nhật ký thẻ luật (project_link_rules), view tin S06 → nút qua bí danh.
-- KHÔNG sync cloud: hai bảng mới và registry_aliases không vào FILL của pipeline/sync-cloud.mjs — mã nguồn ở lại máy thu.
-- Áp lên DB máy thu là lời riêng của Mạnh sau Cổng Bằng chứng. Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Hạng tin cậy của nút danh bạ (cùng ba giá trị catalog_tier của 082) ----
-- Nút có sẵn (20 dự án, 3 phân khu nhập tay) nhận 'xac_minh' (Hỏi-2); nút ứng viên do thẻ luật S06 đúc mang 'mot_loi_khai'.
ALTER TABLE asset_nodes ADD COLUMN IF NOT EXISTS catalog_tier text NOT NULL DEFAULT 'xac_minh';
ALTER TABLE asset_nodes DROP CONSTRAINT IF EXISTS asset_nodes_catalog_tier_check;
ALTER TABLE asset_nodes ADD CONSTRAINT asset_nodes_catalog_tier_check
  CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai'));

-- ---- 2. Bí danh và sự kiện nhận khoá nút dự án ----
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_object_key_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_object_key_check
  CHECK (object_key ~ '^((pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}|node:[0-9]+)$');
ALTER TABLE registry_events DROP CONSTRAINT IF EXISTS registry_events_object_key_check;
ALTER TABLE registry_events ADD CONSTRAINT registry_events_object_key_check
  CHECK (object_key ~ '^((pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}|node:[0-9]+)$');

-- ---- 3. Nhật ký thẻ luật theo nguồn (mục 44 Hỏi-1): một dòng mỗi lần áp, đảo ghi vào chính dòng ấy ----
CREATE TABLE IF NOT EXISTS project_link_rules (
  id         bigserial PRIMARY KEY,
  source     text NOT NULL CHECK (source ~ '^S[0-9]{2}$'),
  can_cu     text NOT NULL CHECK (btrim(can_cu) <> ''),
  mau_bam    text NOT NULL CHECK (mau_bam ~ '^[0-9a-f]{64}$'),
  so_ma      integer NOT NULL CHECK (so_ma >= 0),
  decided_by text NOT NULL CHECK (btrim(decided_by) <> ''),
  decided_at timestamptz NOT NULL DEFAULT now(),
  dao_by     text,
  dao_at     timestamptz,
  CONSTRAINT project_link_rules_dao_chk CHECK ((dao_by IS NULL) = (dao_at IS NULL))
);

-- ---- 4. Trạng thái nối từng mã dự án nguồn (khuôn DA3 §2, chỉ cột lát mỏng cần; DA3 thêm cột bằng ALTER) ----
CREATE TABLE IF NOT EXISTS project_links (
  source            text NOT NULL CHECK (source ~ '^S[0-9]{2}$'),
  source_project_id text NOT NULL CHECK (btrim(source_project_id) <> ''),
  asset_node_id     bigint REFERENCES asset_nodes (id),
  status            text NOT NULL CHECK (status IN ('noi', 'chua_noi')),
  can_cu            text,
  ly_do             text,
  rule_id           bigint REFERENCES project_link_rules (id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, source_project_id),
  CONSTRAINT project_links_noi_co_nut CHECK (status <> 'noi' OR asset_node_id IS NOT NULL),
  CONSTRAINT project_links_chua_noi_co_ly_do CHECK (status <> 'chua_noi' OR btrim(coalesce(ly_do, '')) <> '')
);
CREATE INDEX IF NOT EXISTS project_links_rule_idx ON project_links (rule_id);
CREATE INDEX IF NOT EXISTS project_links_nut_idx ON project_links (asset_node_id);

-- ---- 5. Tin S06 căn hộ đang rao đọc dự án qua bí danh còn hiệu lực (DS2 đọc view này) ----
CREATE OR REPLACE VIEW s06_offer_project AS
SELECT r.offer_id,
       c.payload ->> 'projectid'                AS source_project_id,
       substring(a.object_key FROM 6)::bigint   AS node_id
  FROM sale_offer_records r
  JOIN stg_chotot_ads c ON c.list_id::text = r.originating_system_key
  JOIN registry_aliases a
    ON a.source = 'S06' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
   AND a.object_key LIKE 'node:%'
   AND a.value = 'du_an/' || (c.payload ->> 'projectid')
 WHERE r.source = 'S06' AND r.property_type = 'apartment'
   AND r.retired_at IS NULL AND r.superseded_by IS NULL;
