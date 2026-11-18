-- 111_v_toa_nut_vung_s16.sql — DA37 danh-ba-s16-thang-cau-truc: tầng S16 cho nút vùng hiệu lực của toà, và đếm lệch cấu trúc.
-- docs/superpowers/specs/2026-11-17-danh-ba-s16-thang-cau-truc-design.md §3.1 · ROADMAP §3 mục 54 (Q-B, Q-C) · mô hình danh bạ §1.3a.
-- Số 111 do giám sát cấp. Cột gốc buildings.region_node_id giữ nguyên (rào chỉ-thêm 082); toà vào phân khu S16 qua view.
-- Toà KHÔNG mang bí danh S16 ra đúng các dòng như view của 097. Lùi: áp lại phần view v_toa_nut_vung của 097 rồi
-- DROP VIEW v_lech_cau_truc_s16. Idempotent. KHÔNG sync cloud (đọc stg_s16_*, chỉ ở máy thu).

-- ---- 1. v_toa_nut_vung: S16 → cụm S09 → phân khu S09 → cột gốc ----
CREATE OR REPLACE VIEW v_toa_nut_vung AS
WITH s09 AS (
  SELECT a.object_key AS building_key, t.sector_id,
         upper((regexp_match(btrim(COALESCE(NULLIF(t.block_code, ''), t.block_name)), '^([A-Za-z]+[0-9]+)\.[0-9]+$'))[1]) AS tien_to
    FROM registry_aliases a
    JOIN v_s09_toa t ON a.value = t.project_id || '/' || t.block_id
   WHERE a.kind = 'ma_nguon' AND a.source = 'S09' AND a.retired_at IS NULL
), chon AS (
  SELECT DISTINCT ON (building_key) building_key, sector_id, tien_to
    FROM s09 ORDER BY building_key, (sector_id IS NULL), sector_id
), s16 AS (
  -- Khu của toà S16: chỉ từ bản thu mà khu_id có trong danh sách khu (stg_s16_khu) của cùng bản; toà có hơn một khu → không vào.
  SELECT a.object_key AS building_key, min(t.du_an || '/' || t.khu_id) AS khu
    FROM registry_aliases a
    JOIN stg_s16_toa t ON t.du_an = split_part(a.value, '/', 1) AND t.toa_id = split_part(a.value, '/', 2)
    JOIN stg_s16_khu k ON k.snapshot_id = t.snapshot_id AND k.du_an = t.du_an AND k.khu_id = t.khu_id
   WHERE a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL
     AND a.object_key LIKE 'bld\_%' AND a.value ~ '^[^/]+/[^/]+$'
   GROUP BY a.object_key
  HAVING count(DISTINCT t.du_an || '/' || t.khu_id) = 1
)
SELECT b.building_key,
       COALESCE(pk16.id, cum.id, pk.id, b.region_node_id) AS region_node_id,
       b.region_node_id                                   AS region_node_id_goc,
       CASE WHEN pk16.id IS NOT NULL THEN 's16_phan_khu' WHEN cum.id IS NOT NULL THEN 's09_cum'
            WHEN pk.id IS NOT NULL THEN 's09_phan_khu' ELSE 'goc' END AS nguon
  FROM buildings b
  LEFT JOIN chon c ON c.building_key = b.building_key
  LEFT JOIN s16 ON s16.building_key = b.building_key
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE s16.khu IS NOT NULL AND n.meta -> 's16_khu_ids' ? s16.khu
                        AND COALESCE((n.meta ->> 'nghi')::boolean, false) = false
                      ORDER BY n.id LIMIT 1) pk16 ON true
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.sector_id IS NOT NULL AND n.meta -> 's09_sector_ids' ? c.sector_id
                      ORDER BY n.id LIMIT 1) pk ON true
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.tien_to IS NOT NULL AND n.meta ->> 's09_cum' = c.tien_to
                        AND n.meta ->> 's09_sector_id' = c.sector_id
                      ORDER BY n.id LIMIT 1) cum ON true;

-- ---- 2. v_lech_cau_truc_s16: lệch cấu trúc ở dự án có S16 thành số đếm (Q-B), không thẻ ----
CREATE OR REPLACE VIEW v_lech_cau_truc_s16 AS
WITH toa16 AS (
  SELECT DISTINCT a.object_key AS building_key, split_part(a.value, '/', 1) AS du_an
    FROM registry_aliases a
   WHERE a.kind = 'ma_nguon' AND a.source = 'S16' AND a.retired_at IS NULL
     AND a.object_key LIKE 'bld\_%' AND a.value ~ '^[^/]+/[^/]+$'
), nhieu_khu AS (
  SELECT t.building_key, t.du_an FROM toa16 t
    JOIN registry_aliases a ON a.object_key = t.building_key AND a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
    JOIN stg_s16_toa st ON st.du_an = split_part(a.value, '/', 1) AND st.toa_id = split_part(a.value, '/', 2)
    JOIN stg_s16_khu k ON k.snapshot_id = st.snapshot_id AND k.du_an = st.du_an AND k.khu_id = st.khu_id
   GROUP BY 1, 2 HAVING count(DISTINCT st.du_an || '/' || st.khu_id) > 1
)
-- S09 xếp toà vào phân khu khác phân khu S16
SELECT t.du_an, 'S09-S16'::text AS cap_nguon, 'phan-khu'::text AS loai, count(*)::int AS so
  FROM toa16 t
  JOIN v_toa_nut_vung v ON v.building_key = t.building_key AND v.nguon = 's16_phan_khu'
  JOIN LATERAL (SELECT 1 FROM registry_aliases s WHERE s.object_key = t.building_key AND s.source = 'S09'
                   AND s.kind = 'ma_nguon' AND s.retired_at IS NULL LIMIT 1) co09 ON true
 WHERE EXISTS (SELECT 1 FROM v_s09_toa x JOIN registry_aliases s ON s.value = x.project_id || '/' || x.block_id
                 JOIN asset_nodes n ON n.meta -> 's09_sector_ids' ? x.sector_id
                WHERE s.object_key = t.building_key AND s.source = 'S09' AND s.kind = 'ma_nguon' AND n.id <> v.region_node_id)
 GROUP BY t.du_an
UNION ALL
-- căn S08 cùng mã nằm ở toà khác: đã gộp vào căn S16
SELECT split_part(a16.value, '/', 1), 'S08-S16', 'can-lech-toa', count(DISTINCT u.unit_key)::int
  FROM units u
  JOIN registry_aliases a08 ON a08.object_key = u.unit_key AND a08.source = 'S08' AND a08.retired_at IS NULL
  JOIN registry_aliases a16 ON a16.object_key = u.merged_into AND a16.source = 'S16' AND a16.kind = 'ma_nguon' AND a16.retired_at IS NULL
 WHERE u.status = 'merged'
 GROUP BY 1
UNION ALL
-- tên toà nguồn khác không trùng tên nào S16 ghi cho toà ấy
SELECT t.du_an, s.source || '-S16', 'ten-toa', count(DISTINCT t.building_key)::int
  FROM toa16 t
  JOIN registry_aliases s ON s.object_key = t.building_key AND s.kind = 'ten' AND s.source IN ('S08', 'S09') AND s.retired_at IS NULL
 WHERE NOT EXISTS (SELECT 1 FROM registry_aliases r WHERE r.object_key = t.building_key AND r.kind = 'ten' AND r.source = 'S16'
                     AND r.retired_at IS NULL AND upper(btrim(r.value)) = upper(btrim(s.value)))
 GROUP BY t.du_an, s.source
UNION ALL
-- toà S16 có hơn một khu trong các bản thu có danh sách khu: không vào tầng S16
SELECT du_an, 'S16', 'khu-nhieu', count(*)::int FROM nhieu_khu GROUP BY du_an;
