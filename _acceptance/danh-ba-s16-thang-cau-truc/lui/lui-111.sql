-- Lùi 111 (DA37): bỏ view đếm lệch, đặt lại v_toa_nut_vung đúng thân view của 097. Chạy sau go-khoa.sh và phan-khu-s16.mjs --dao.
BEGIN;
DROP VIEW IF EXISTS v_lech_cau_truc_s16;
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
)
SELECT b.building_key,
       COALESCE(cum.id, pk.id, b.region_node_id) AS region_node_id,
       b.region_node_id                          AS region_node_id_goc,
       CASE WHEN cum.id IS NOT NULL THEN 's09_cum' WHEN pk.id IS NOT NULL THEN 's09_phan_khu' ELSE 'goc' END AS nguon
  FROM buildings b
  LEFT JOIN chon c ON c.building_key = b.building_key
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.sector_id IS NOT NULL AND n.meta -> 's09_sector_ids' ? c.sector_id
                      ORDER BY n.id LIMIT 1) pk ON true
  LEFT JOIN LATERAL (SELECT n.id FROM asset_nodes n
                      WHERE c.tien_to IS NOT NULL AND n.meta ->> 's09_cum' = c.tien_to
                        AND n.meta ->> 's09_sector_id' = c.sector_id
                      ORDER BY n.id LIMIT 1) cum ON true;
COMMIT;
