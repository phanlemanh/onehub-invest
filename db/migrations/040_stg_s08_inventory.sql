-- 040_stg_s08_inventory.sql — PL10 S08 bước 1: staging cho item `inventory_unit` của S08
-- (danh mục căn chủ đầu tư; DATA-CONTRACT schemaVersion 4 — ZCode, vòng claudedp-2310-12).
-- AGENTS.md luật 5 (S08 cùng chính sách AirDNA: chỉ đọc, ≤1 lần/tuần, CHỈ dùng nội bộ để dựng
-- danh mục căn + hiệu chuẩn; không tái xuất nguyên văn lên cổng Invest hay API công khai) ·
-- ADR-0007 (SPL) · ADR-0011/0013 (RESO: staging giữ hình dạng nguồn, ánh xạ DD 2.1 ở
-- pipeline/mappings.yaml mục sources.S08 — lên canonical mới đặt field chuẩn).
-- KHÔNG sync cloud: bảng stg_* là tầng A (payload gốc theo nguồn) — sync-cloud.mjs chỉ đẩy
-- bảng trong FILL, leak gate đòi stg_* vắng/0 dòng ở cloud. Tên thật của S08 chỉ nằm ở
-- source_registry local, không ghi trong file này.
--
-- Một dòng = một căn trong quỹ ở MỘT snapshot (khoá source_id + snapshot_id): trạng thái
-- notSold → sold đổi theo thời gian, giữ từng mốc chụp để đo vòng đời căn và giá chốt.
-- Cột trích xuất giữ tên field nguồn (snake_case) và đơn vị nguồn; payload giữ nguyên vẹn.
CREATE TABLE IF NOT EXISTS stg_s08_inventory (
  source_id              text NOT NULL,   -- RawItem.sourceId = sha256(S08|project_id|product_code)
  snapshot_id            text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  project_id             text NOT NULL,   -- id dự án phía nguồn (vd 87, 92, 355)
  project_type           text,            -- low_rise | high_rise (get_project_detail)
  state                  text NOT NULL,   -- tham số truy vấn: notSold | sold → StandardStatus khi transform
  product_code           text NOT NULL,   -- mã căn nguồn (KĐ5-44, PR60216) → UnitNumber; tầng/toà tách ở transform
  row_code               text,            -- dãy — không nhất quán (KĐ / tên phân khu / null)
  subdivision_name       text,            -- phân khu → Building.ComplexName; high_rise lẫn toà → BuildingName
  apartment_type_name    text,            -- chữ nguồn (SHOPHOUSE, SONG LẬP…) → PropertySubType ở transform
  land_area              numeric,         -- m² đất → LotSizeArea
  construction_area      numeric,         -- m² xây dựng → BuildingAreaTotal
  base_direction_name    text,            -- hướng → DirectionFaces
  number_of_room         int,             -- thường null — giữ null → BedroomsTotal
  number_of_wc           int,             -- thường null — giữ null → BathroomsTotalInteger
  apartment_price        numeric,         -- giá niêm yết (đơn vị nguồn) → ListPrice
  early_payment_price    numeric,         -- giá thanh toán sớm — DD không có, chưa map
  state_line             text,
  delivery_standard_name text,            -- tiêu chuẩn bàn giao
  fund_groups_sell_code  text,            -- nhóm quỹ (QC / QĐQ / QCK)
  payload                jsonb NOT NULL,  -- nguyên vẹn RawItem.payload (không có contact_data)
  fetched_at             timestamptz,
  captured_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, snapshot_id),
  CONSTRAINT stg_s08_inventory_state_chk CHECK (state IN ('notSold', 'sold'))
);
CREATE INDEX IF NOT EXISTS stg_s08_inventory_snap_idx ON stg_s08_inventory(snapshot_id);
CREATE INDEX IF NOT EXISTS stg_s08_inventory_unit_idx ON stg_s08_inventory(project_id, product_code);
