-- 118_v_s16_gia_cdt_loai_mo_ho.sql — DA40 thuoc-tinh-can-s16: view giá chủ đầu tư loại mã mơ hồ toà (nhóm mo_ho của v_s16_can).
-- Thiết kế: _acceptance/thuoc-tinh-can-s16/design.md §4.4 · AC-7. Snapshot thuộc tính gộp một item mỗi (dự án, mã) nên bảng nạp không
-- còn thấy mã ở hai toà; luật chọn toà là của v_s16_can (DA33). Áp sau 113; bảng stg và các cột của view không đổi.
-- KHÔNG sync cloud: dữ liệu S16 sau đăng nhập (ROADMAP §3 mục 48). Số 118 do giám sát cấp. Chạy lại an toàn.

CREATE OR REPLACE VIEW v_s16_gia_cdt AS
WITH moi AS (
  SELECT c.snapshot_id, c.du_an, upper(btrim(c.ma_can)) AS ma, c.toa, c.sale_price, c.area_using,
         s.collected_at,
         dense_rank() OVER (PARTITION BY c.du_an, upper(btrim(c.ma_can))
                            ORDER BY s.collected_at DESC NULLS LAST, c.snapshot_id DESC) AS r
    FROM stg_s16_can_chi_tiet c
    JOIN airbnb_snapshots s USING (snapshot_id)
), mot_toa AS (
  SELECT snapshot_id, du_an, ma, max(sale_price) AS sale_price, max(area_using) AS area_using, max(collected_at) AS thu_luc
    FROM moi WHERE r = 1
   GROUP BY snapshot_id, du_an, ma
  HAVING count(DISTINCT toa) = 1
), mo_ho AS MATERIALIZED (
  SELECT v.du_an, v.ma_can FROM v_s16_can v WHERE v.mo_ho
), bi_danh AS MATERIALIZED (
  -- Nạp sẵn để nối băm: chỉ mục một phần (source, kind, value) bỏ kind khỏi điều kiện tra nên vòng lặp lồng quét lại cả
  -- trăm nghìn bí danh S16 mỗi lượt (đo trên bản chép máy thu 18/11: 34 giây).
  SELECT a.value, a.object_key FROM registry_aliases a
   WHERE a.source = 'S16' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\_%'
)
SELECT a.object_key AS unit_key,
       m.sale_price AS list_price,
       CASE WHEN m.area_using > 0 THEN round(m.sale_price / m.area_using) END AS gia_m2_thong_thuy,
       m.snapshot_id,
       m.thu_luc
  FROM mot_toa m
  JOIN bi_danh a ON a.value = m.du_an || '/' || m.ma
  LEFT JOIN mo_ho h ON h.du_an = m.du_an AND h.ma_can = m.ma
 WHERE m.sale_price > 0 AND h.ma_can IS NULL;
