-- 087_thang_bac_moi.sql — thang-bac-moi-b0-b5 (V4): bậc dữ liệu chạy hằng ngày theo thang FRAMING §3.4 viết lại 08/11.
-- docs/superpowers/specs/2026-11-09-thang-bac-moi-b0-b5-design.md · _acceptance/thang-bac-moi-b0-b5 (Mạnh duyệt 09/11).
-- Số 087 do giám sát đợt dot0-cam-mau cấp (sổ SO-MIGRATION). Trục `data_level` là mở rộng local đã có (056, mappings.yaml).
-- B0 Có lời khai · B1 Tin · B2 Định vị · B3 Gắn căn · B4 Làm giàu · B5 Sống; B0–B2 đếm tin, B3–B5 đếm căn của danh bạ (082).
-- Cụm `properties` không cho bậc nào. Hai vị từ chờ bảng nối (GC0–GC3) là chỗ cắm duy nhất: hàng GC chỉ thay thân hai hàm.
-- KHÔNG sync cloud: hàm và cột dưới chỉ ở máy thu. Áp lên DB máy thu là lời riêng của Mạnh, sau gộp, kèm pg_dump.
-- Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Hai vị từ chờ bảng nối tin → nút danh bạ (V9). Hôm nay chưa có bảng nối: không tin nào định vị hay gắn căn. ----
CREATE OR REPLACE FUNCTION offer_located(p_offer_id text)
RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT false $$;

CREATE OR REPLACE FUNCTION offer_unit_key(p_offer_id text)
RETURNS text LANGUAGE sql STABLE AS $$ SELECT NULL::text $$;

-- ---- 2. Bậc của một tin (B0–B2). Giữ đúng chữ ký của 056 — kiểu và TÊN tham số — để app trên cloud (chưa áp 087) vẫn
--         gọi được và các test nạp lại 056 trong giao dịch không vấp «cannot change name of input parameter».
--         Tham số cuối `p_linked` nay nghĩa là «đã định vị vào danh bạ» (offer_located), không còn là «nằm trong cụm». ----
CREATE OR REPLACE FUNCTION offer_data_level(p_kind text, p_property_type text, p_price_vnd numeric, p_area_m2 numeric,
                                            p_area_id text, p_linked boolean)
RETURNS TABLE (data_level text, ke_thieu text) LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN NOT d.du THEN 'B0' WHEN coalesce(p_linked, false) THEN 'B2' ELSE 'B1' END,
         CASE WHEN NOT d.du THEN 'truong-loi' WHEN coalesce(p_linked, false) THEN 'gan-can' ELSE 'dinh-vi' END
    FROM (SELECT offer_core_complete(p_kind, p_property_type, p_price_vnd, p_area_m2, p_area_id) AS du) d
$$;

-- ---- 3. Bậc của căn danh bạ có tin gắn (B3–B5): mỗi tin gắn đủ trường lõi cho một bậc, căn lấy bậc cao nhất.
--   B3 Gắn căn: tin gắn đủ năm trường lõi.
--   B4 Làm giàu (Hỏi-2, Mạnh duyệt 09/11): mọi trường lõi của tin `measured` hoặc `fact`; không đòi xác nhận người.
--   B5 Sống: B4 + tin đang chào, thấy trong cửa sổ độ tươi (059), và căn có ít nhất hai mốc giá (luật Hỏi-3 của 059:
--   một đổi giá, hoặc hai tin cùng căn). Tin gắn mà thiếu trường lõi không gắn căn được (bậc gồm mọi điều bậc dưới): nó
--   không vào căn, vẫn đếm ở đơn vị tin (B0) — data_level_units dùng cùng điều kiện.
CREATE OR REPLACE FUNCTION unit_data_level()
RETURNS TABLE (unit_key text, data_level text, ke_thieu text, source text, area_id text, property_type text,
               offer_ids text[]) LANGUAGE sql STABLE AS $$
  WITH gan AS (   -- chỉ căn có thật trong danh bạ, đang hiệu lực (082)
    SELECT un.unit_key AS uk, o.*
      FROM sale_offers o
      JOIN units un ON un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active'
     WHERE o.source IN ('S03', 'S05', 'S06')
  ), du AS (
    SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)
  ), gia AS (
    SELECT g.uk, count(*) AS n
      FROM du g JOIN history_transactional h ON h.resource_record_key = g.offer_id
     WHERE h.change_type IN ('new_listing', 'price_change')
     GROUP BY g.uk
  ), tin AS (
    SELECT g.uk, g.offer_id, g.source, g.area_id, g.property_type, g.first_seen,
           CASE
             WHEN NOT d.lam_giau THEN 3
             WHEN g.offer_status = 'active' AND g.last_seen >= now() - freshness_window()
                  AND (coalesce(gi.n, 0) >= 2 OR (SELECT count(*) FROM du x WHERE x.uk = g.uk) >= 2) THEN 5
             ELSE 4
           END AS lv
      FROM du g
      LEFT JOIN gia gi ON gi.uk = g.uk
      LEFT JOIN LATERAL (
        SELECT bool_and(coalesce(g.field_provenance -> k ->> 'measured', '') = 'true'
                        OR coalesce(g.field_provenance -> k ->> 'tier', '') = 'fact') AS lam_giau
          FROM unnest(ARRAY['kind', 'property_type', 'price_vnd', 'area_m2', 'area_id']) AS k
      ) d ON true
  ), can AS (
    SELECT uk, max(lv) AS lv,
           (array_agg(source ORDER BY first_seen, offer_id))[1] AS source,
           (array_agg(area_id ORDER BY first_seen, offer_id))[1] AS area_id,
           (array_agg(property_type ORDER BY first_seen, offer_id))[1] AS property_type,
           array_agg(offer_id ORDER BY offer_id) AS offer_ids
      FROM tin GROUP BY uk
  )
  SELECT uk, 'B' || lv,
         CASE lv WHEN 3 THEN 'lam-giau' WHEN 4 THEN 'hieu-luc' ELSE 'giu-nhip' END,
         source, area_id, property_type, offer_ids
    FROM can
$$;

-- ---- 4. Tập đơn vị đếm bậc — một nguồn cho 610 và DO1 (pipeline/do-hang-ngay.mjs). Tin: mọi tin S03/S05/S06 của
--         sale_offers (view đã loại tin rút) chưa gắn căn, kể cả tin nằm trong cụm; căn: căn danh bạ có tin gắn. ----
CREATE OR REPLACE FUNCTION data_level_units()
RETURNS TABLE (unit_key text, unit text, data_level text, ke_thieu text, source text, area_id text, property_type text,
               offer_ids text[]) LANGUAGE sql STABLE AS $$
  SELECT 'tin:' || o.offer_id, 'tin_le', l.data_level, l.ke_thieu, o.source, o.area_id, o.property_type,
         ARRAY[o.offer_id]
    FROM sale_offers o
   CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id,
                                       offer_located(o.offer_id)) l
   WHERE o.source IN ('S03', 'S05', 'S06')
     AND (NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id)
          OR NOT EXISTS (SELECT 1 FROM units un WHERE un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active'))
  UNION ALL
  SELECT 'can:' || u.unit_key, 'can', u.data_level, u.ke_thieu, u.source, u.area_id, u.property_type, u.offer_ids
    FROM unit_data_level() u
$$;

-- ---- 5. Căn = cụm properties không còn là đơn vị bậc. ----
DROP FUNCTION IF EXISTS property_data_level(bigint[]);

-- ---- 6. Thang của mỗi dòng: dòng cũ thang-2310, dòng mới thang-0811 — đổi thang là lần hạ một lần, có ngày. ----
ALTER TABLE data_level_snapshot
  ADD COLUMN IF NOT EXISTS scale text NOT NULL DEFAULT 'thang-2310' CHECK (scale IN ('thang-2310', 'thang-0811'));
ALTER TABLE data_level_snapshot ALTER COLUMN scale SET DEFAULT 'thang-0811';
ALTER TABLE data_level_unit
  ADD COLUMN IF NOT EXISTS scale text NOT NULL DEFAULT 'thang-2310' CHECK (scale IN ('thang-2310', 'thang-0811'));
ALTER TABLE data_level_unit ALTER COLUMN scale SET DEFAULT 'thang-0811';

-- ---- 7. Nhãn bậc theo thang mới (pipeline/mappings.yaml trục data_level). ----
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('data_level', 'B0', NULL, 'Có lời khai', true, 1),
  ('data_level', 'B1', NULL, 'Tin', true, 2),
  ('data_level', 'B2', NULL, 'Định vị', true, 3),
  ('data_level', 'B3', NULL, 'Gắn căn', true, 4),
  ('data_level', 'B4', NULL, 'Làm giàu', true, 5),
  ('data_level', 'B5', NULL, 'Sống', true, 6)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET label_vi = EXCLUDED.label_vi, sort_order = EXCLUDED.sort_order;
