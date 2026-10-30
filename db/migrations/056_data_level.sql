-- 056_data_level.sql — PL16 `de-xuat-thanh-phat-bieu-bac` (C2.3): bậc dữ liệu B0–B5 của căn và tin lẻ + ảnh chụp phân bố.
-- Nguồn: design docs/superpowers/specs/2026-10-30-de-xuat-thanh-phat-bieu-bac-design.md · hồ sơ
-- _acceptance/de-xuat-thanh-phat-bieu-bac (Mạnh duyệt 30/10) · thang FRAMING §3.4. Số 056 do phiên liên làn cấp
-- (sổ SO-MIGRATION). Trục `data_level` là mở rộng local (mappings.yaml, Mạnh duyệt 23/10), không có trong RESO DD.
--
-- Bậc là MỘT hàm SQL — các hàng sau chỉ thay vị từ (PL17/PL21 mở B3, DB1 nhánh danh mục của B4, PL19 vị từ B5), không đổi
-- bên đọc. Năm trường lõi giữ đúng levelOf (app/src/lib/data-level.ts); app/tests/data-level-sql.itest.tsx đối chiếu.
-- Căn lấy bậc cao nhất trên các tin gắn (sổ quyết định S2): một tin đã đo hay xác minh là đủ để căn lên bậc.
--
-- KHÔNG sync cloud ở vòng này: `data_level_snapshot` chỉ ở máy thu, không vào FILL của pipeline/sync-cloud.mjs.
-- Áp lên DB local :5433 dùng chung CHỈ sau khi gộp.

-- 1. Năm trường lõi đủ chưa — loại tin, loại hình khác `unknown`, giá > 0, diện tích > 0, phường.
CREATE OR REPLACE FUNCTION offer_core_complete(p_kind text, p_property_type text, p_price_vnd numeric, p_area_m2 numeric,
                                               p_area_id text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(p_kind <> '', false) AND coalesce(p_property_type <> 'unknown', false)
     AND coalesce(p_price_vnd > 0, false) AND coalesce(p_area_m2 > 0, false) AND coalesce(p_area_id <> '', false)
$$;

-- 2. Bậc của một tin (B0–B2) và chỗ kẹt của bậc kế.
CREATE OR REPLACE FUNCTION offer_data_level(p_kind text, p_property_type text, p_price_vnd numeric, p_area_m2 numeric,
                                            p_area_id text, p_linked boolean)
RETURNS TABLE (data_level text, ke_thieu text) LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN NOT d.du THEN 'B0' WHEN coalesce(p_linked, false) THEN 'B2' ELSE 'B1' END,
         CASE WHEN NOT d.du THEN 'truong-loi' WHEN coalesce(p_linked, false) THEN 'so-do' ELSE 'gan-can' END
    FROM (SELECT offer_core_complete(p_kind, p_property_type, p_price_vnd, p_area_m2, p_area_id) AS du) d
$$;

-- 3. Bậc của căn (NULL = mọi căn): mỗi tin gắn còn sống cho một bậc, căn lấy bậc cao nhất.
--    B2 tin đủ trường lõi · B3 thêm mọi trường lõi `measured` · B4 thêm lớp `fact` ở mọi trường lõi và căn `verified`.
CREATE OR REPLACE FUNCTION property_data_level(p_ids bigint[] DEFAULT NULL)
RETURNS TABLE (property_id bigint, data_level text, ke_thieu text) LANGUAGE sql STABLE AS $$
  WITH tin AS (
    SELECT p.id AS pid,
           CASE
             WHEN o.offer_id IS NULL
               OR NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id) THEN 0
             WHEN NOT d.da_do THEN 2
             WHEN p.verification = 'verified' AND d.su_that THEN 4
             ELSE 3
           END AS lv
      FROM properties p
      LEFT JOIN property_offers po ON po.property_id = p.id
      LEFT JOIN sale_offers o ON o.offer_id = po.offer_id
      LEFT JOIN LATERAL (
        SELECT bool_and(coalesce(o.field_provenance -> k ->> 'measured', '') = 'true') AS da_do,
               bool_and(coalesce(o.field_provenance -> k ->> 'tier', '') = 'fact') AS su_that
          FROM unnest(ARRAY['kind', 'property_type', 'price_vnd', 'area_m2', 'area_id']) AS k
      ) d ON true
     WHERE p_ids IS NULL OR p.id = ANY (p_ids)
  )
  SELECT pid, 'B' || max(lv),
         CASE max(lv) WHEN 0 THEN 'truong-loi' WHEN 2 THEN 'so-do' WHEN 3 THEN 'xac-minh' ELSE 'hieu-luc' END
    FROM tin
   GROUP BY pid
$$;

-- 4. Ảnh chụp phân bố theo ngày × thị trường × loại hình × đơn vị × bậc (pipeline/sql/610_data_level.sql ghi).
--    Không phường → market_id 'chua-ro' (chữ, không NULL — cột nằm trong khoá chính).
CREATE TABLE IF NOT EXISTS data_level_snapshot (
  snap_date     date    NOT NULL,
  market_id     text    NOT NULL,
  property_type text    NOT NULL,
  unit          text    NOT NULL CHECK (unit IN ('can', 'tin_le')),
  data_level    text    NOT NULL CHECK (data_level IN ('B0', 'B1', 'B2', 'B3', 'B4', 'B5')),
  n             integer NOT NULL CHECK (n > 0),
  PRIMARY KEY (snap_date, market_id, property_type, unit, data_level)
);

-- 5. Cột theo trục data_level (pipeline/mappings.yaml `columns`).
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('data_level_snapshot', 'data_level', 'data_level')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
