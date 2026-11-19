-- kiem-sau.sql — DA45: lệnh kiểm sau lượt ghi đầu. Chỉ đọc.
SELECT count(*) FILTER (WHERE a.region_type = 'submarket') AS co_phuong, count(*) AS tong
  FROM sale_offers s LEFT JOIN areas a ON a.id = s.area_id WHERE s.source = 'S03';
SELECT count(*) FILTER (WHERE a.region_type = 'submarket') AS co_phuong_13_19, count(*) AS tong_13_19
  FROM sale_offers s LEFT JOIN areas a ON a.id = s.area_id
 WHERE s.source = 'S03' AND s.first_seen >= '2026-11-13' AND s.first_seen < '2026-11-20';
SELECT count(*) AS phat_bieu_song FROM field_assertions WHERE rule_id = 'phuong-tu-du-an' AND retracted_at IS NULL;
SELECT count(*) AS tin_nhan_du_an FROM sale_offer_records WHERE field_provenance -> 'area_id' ->> 'nguon' = 'du-an';
