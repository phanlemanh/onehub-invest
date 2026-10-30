-- 610_data_level.sql — PL16: ảnh chụp phân bố bậc dữ liệu của ngày hôm nay (056 `data_level_snapshot`).
-- Đơn vị = mỗi căn hiện hành + mỗi tin S03/S05/S06 còn sống chưa gắn căn. Phân khúc = thị trường (cha `region_type =
-- market` của phường; không phường hay phường mồ côi → 'chua-ro') × loại hình (của căn lấy từ `properties`, của tin lẻ
-- từ tin). Ngày cũ giữ để thấy bậc tụt; ngày hôm nay xoá rồi ghi lại (rollup: không ON CONFLICT DO NOTHING).
-- Chạy qua pipeline/bac-du-lieu.mjs --write (khoá advisory 56056 trong giao dịch — hai lượt cùng lúc xếp hàng).

DELETE FROM data_level_snapshot WHERE snap_date = current_date;

INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n)
WITH don_vi AS (
  SELECT 'can' AS unit, p.area_id, p.property_type, b.data_level
    FROM property_data_level(NULL) b
    JOIN properties p ON p.id = b.property_id
  UNION ALL
  SELECT 'tin_le', o.area_id, o.property_type, l.data_level
    FROM sale_offers o
   CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, false) l
   WHERE o.source IN ('S03', 'S05', 'S06')
     AND NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)
)
SELECT current_date, coalesce(m.id, 'chua-ro'), coalesce(d.property_type, 'unknown'), d.unit, d.data_level, count(*)
  FROM don_vi d
  LEFT JOIN areas w ON w.id = d.area_id
  LEFT JOIN areas m ON m.id = w.parent_id AND m.region_type = 'market'
 GROUP BY 2, 3, 4, 5;
