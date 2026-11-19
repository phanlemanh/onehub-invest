-- 114_v_toa_nut_vung_s16_bam.sql — DA37 danh-ba-s16-thang-cau-truc (S4 vòng 1, phát hiện ngoài hợp đồng mức cao): nút phân khu
-- S16 khớp toà qua BĂM của khoá khu thay vì khoá thô `<du_an>/<khu_id>`. asset_nodes đi cloud; mã khu S16 lấy bằng đăng nhập
-- (ROADMAP §3 mục 48) không được nằm trong meta của nó — bất biến «bảng đi cloud không mang định danh S16 thô» (tiền lệ s16_ref
-- của DA33). Bảng nối băm → khu thật là stg_s16_khu (chỉ máy thu): view tính băm từ đó. Số 114 do giám sát cấp (18/11); 111 đã
-- commit trên nhánh nên view sửa ở tệp mới. Chỉ thay v_toa_nut_vung (cùng cột, cùng thứ tự với 111/097); v_lech_cau_truc_s16
-- của 111 giữ nguyên. Lùi: như 111 (lui-111.sql áp lại view của 097). Idempotent. Cần 111 đã áp.

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
  -- Khoá khu là băm s16Ref('khu', du_an, khu_id) — 16 hex đầu của sha256('S16|khu|<du_an>|<khu_id>'), như pipeline/lib/s16-phan-khu.mjs.
  SELECT a.object_key AS building_key,
         left(encode(sha256(convert_to('S16|khu|' || min(t.du_an) || '|' || min(t.khu_id), 'UTF8')), 'hex'), 16) AS khu
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
