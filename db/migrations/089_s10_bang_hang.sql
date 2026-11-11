-- 089_s10_bang_hang.sql — DA29 s10-bang-hang-vao-danh-ba: bảng hàng chủ đầu tư S10 vào stg và nối vào nút dự án của danh bạ.
-- docs/superpowers/specs/2026-11-11-s10-bang-hang-vao-danh-ba-design.md · _acceptance/s10-bang-hang-vao-danh-ba (Mạnh duyệt 12/11,
-- Hỏi-1 A, Hỏi-2 A) · ROADMAP §3 mục 45 Q3. Số 089 do vùng khai của hàng (giám sát đợt dot0-cam-mau).
-- KHÔNG sync cloud: ba bảng và view không vào FILL của pipeline/sync-cloud.mjs — stg_* là tầng A (payload theo nguồn), bảng nối
-- cùng luật 074. Quỹ căn S10 là tin sơ cấp (DA17): không vào Bán, thước giá, metrics. Áp lên DB máy thu là lời riêng của Mạnh.
-- Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Bảng hàng: đúng cột COT_S10 của pipeline/import-airbnb.mjs (napS10) ----
-- Một dòng = một sản phẩm (stock_id) ở MỘT snapshot; trạng thái và giá đổi theo thời gian nên giữ từng mốc chụp.
CREATE TABLE IF NOT EXISTS stg_s10_stock (
  id                     bigserial PRIMARY KEY,
  stock_id               text NOT NULL,      -- khoá nguồn trong data-url của ô đầu
  source_id              text NOT NULL,      -- 's10:' || stock_id
  project_id             text NOT NULL,      -- meta.request.project_id (bộ bóc trả số, lưu chữ như s08_project_links)
  block_type             smallint NOT NULL,  -- 177 thấp tầng · 178 cao tầng
  unit_number            text,               -- mã căn → UnitNumber
  subdivision_name       text,               -- phân khu → ComplexName
  block_raw              text,               -- dãy/toà thô
  property_sub_type_raw  text,               -- loại sản phẩm thô → PropertySubType ở transform
  lot_size_m2            numeric,            -- → LotSizeArea
  building_area_m2       numeric,            -- → BuildingAreaTotal
  handover_condition_raw text,               -- hiện trạng bàn giao
  direction_faces_raw    text,               -- → DirectionFaces
  list_price_vnd         numeric,            -- giá chủ đầu tư (VND) → ListPrice; khuôn 178 không có giá
  status_raw             text,               -- trạng thái quỹ căn thô → StandardStatus ở transform
  remarks_raw            text,
  source_modified_on     date,
  snapshot_id            text NOT NULL,
  captured_at            timestamptz,
  server_cond            jsonb,              -- bộ lọc máy chủ trả về (DATA-CONTRACT S10 luật 1)
  raw_row                text NOT NULL,      -- nguyên văn tr.p_row (dòng lệch khuôn chỉ còn cột này)
  loaded_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stg_s10_stock_snap_stock_key UNIQUE (snapshot_id, stock_id),
  CONSTRAINT stg_s10_stock_block_type_chk CHECK (block_type IN (177, 178))
);
CREATE INDEX IF NOT EXISTS stg_s10_stock_project_idx ON stg_s10_stock (project_id, stock_id, captured_at);

-- ---- 2. Tên dự án: bộ nạp v11 của ZCode (napS10Project) ghi từ meta.duAn, meta.phanKhu, meta.projectLabel ----
-- Hai item (177, 178) cùng project_id cùng nhãn → một dòng; khác nhãn → hai dòng. NULLS NOT DISTINCT để nạp lại không nhân dòng
-- nhãn rỗng (bộ nạp dùng ON CONFLICT (snapshot_id, project_id, project_label), đúng thứ tự cột này).
CREATE TABLE IF NOT EXISTS stg_s10_project (
  id            bigserial PRIMARY KEY,
  project_id    text NOT NULL,
  du_an         text,
  phan_khu      text,
  project_label text,
  snapshot_id   text NOT NULL,
  captured_at   timestamptz,
  loaded_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stg_s10_project_snap_du_an_nhan_key UNIQUE NULLS NOT DISTINCT (snapshot_id, project_id, project_label)
);
CREATE INDEX IF NOT EXISTS stg_s10_project_project_idx ON stg_s10_project (project_id, captured_at);

-- ---- 3. Bảng nối dự án S10 → nút dự án (cùng khuôn s08_project_links, 074) ----
-- Dòng do pipeline/transform-s10.mjs ghi từ tệp bảng nối ở máy thu (gitignored), không nằm ở đây.
CREATE TABLE IF NOT EXISTS s10_project_links (
  project_id    text PRIMARY KEY,
  asset_node_id bigint REFERENCES asset_nodes (id),
  status        text NOT NULL,
  ly_do         text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT s10_project_links_status_check CHECK (status IN ('noi', 'chua_noi')),
  CONSTRAINT s10_project_links_noi_check CHECK (status <> 'noi' OR asset_node_id IS NOT NULL),
  CONSTRAINT s10_project_links_chua_noi_ly_do_check CHECK (status <> 'chua_noi' OR ly_do IS NOT NULL),
  CONSTRAINT s10_project_links_chua_noi_nut_check CHECK (status <> 'chua_noi' OR asset_node_id IS NULL)
);
CREATE INDEX IF NOT EXISTS s10_project_links_node_idx ON s10_project_links (asset_node_id);

-- ---- 4. Quỹ căn S10 theo nút dự án: mỗi stock_id lấy dòng của snapshot mới nhất ----
CREATE OR REPLACE VIEW s10_quy_can_du_an AS
SELECT l.asset_node_id, s.project_id, s.block_type, s.stock_id, s.unit_number, s.subdivision_name, s.block_raw,
       s.property_sub_type_raw, s.lot_size_m2, s.building_area_m2, s.direction_faces_raw, s.list_price_vnd, s.status_raw,
       s.source_modified_on, s.snapshot_id, s.captured_at
  FROM (SELECT DISTINCT ON (project_id, stock_id) *
          FROM stg_s10_stock
         ORDER BY project_id, stock_id, captured_at DESC NULLS LAST, id DESC) s
  JOIN s10_project_links l ON l.project_id = s.project_id AND l.status = 'noi';
