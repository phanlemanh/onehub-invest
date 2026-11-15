-- kiem-sau.sql — DV7 bước 5/5 sau khi áp 105 và làm tươi 600 + bac-du-lieu trên DB máy thu. Chỉ đọc.
-- 1. view có mặt
SELECT to_regclass('offer_project') IS NOT NULL AS co_view;
-- 2. ô Định vị S03 theo cửa sổ (kỳ vọng: all ≈ số tin mot_du_an S03 ở dòng 3; mốc chạy thử 15/11: 4.934, 7d 754)
SELECT time_window, s->>'source' AS nguon, (s->>'located')::int AS dinh_vi, (s->>'locatedPending')::int AS cho_khop
  FROM data_flow_snapshot, jsonb_array_elements(facts->'sources') s
 WHERE s->>'source' IN ('S03', 'S05', 'S06') ORDER BY 1, 2;
-- 3. nguồn chung theo nguồn và trạng thái
SELECT source, status, count(*) FROM offer_project GROUP BY 1, 2 ORDER BY 1, 2;
-- 4. bậc B2 hôm nay (sau bac-du-lieu --write): bằng số tin mot_du_an đủ năm trường lõi
SELECT data_level, sum(n) FROM data_level_snapshot WHERE snap_date = current_date AND scale = 'thang-0811' GROUP BY 1 ORDER BY 1;
SELECT count(*) AS b2_ky_vong FROM sale_offers o JOIN offer_project p USING (offer_id)
 WHERE p.status = 'mot_du_an' AND offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id)
   AND NOT EXISTS (SELECT 1 FROM units un WHERE un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active');
-- 5. dòng chuyển bậc «len» của lượt đầu (một lần, tới số b2_ky_vong)
SELECT huong, to_level, count(*) FROM data_level_change WHERE snap_date = current_date GROUP BY 1, 2 ORDER BY 1, 2;
