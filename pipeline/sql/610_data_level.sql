-- 610_data_level.sql — PL16, thang 08/11 (thang-bac-moi-b0-b5, 087): ảnh chụp phân bố bậc dữ liệu của ngày hôm nay.
-- Đơn vị = data_level_units() của 087 (một nguồn với DO1): mỗi tin S03/S05/S06 chưa gắn căn — kể cả tin nằm trong cụm, gom
-- cụm không cho bậc — và mỗi căn của danh bạ có tin gắn. Phân khúc = thị trường (cha `region_type = market` của phường,
-- hoặc chính khu vực nếu tin mang mã thị trường; không khu vực hay phường mồ côi → 'chua-ro') × loại hình (của tin; căn: của
-- tin gắn sớm nhất). Mỗi dòng mang thang `thang-0811`. Ngày cũ giữ để thấy bậc tụt; ngày hôm nay xoá rồi ghi lại (rollup:
-- không ON CONFLICT DO NOTHING). Chạy qua pipeline/bac-du-lieu.mjs --write (khoá advisory 56056 trong giao dịch).

DELETE FROM data_level_snapshot WHERE snap_date = current_date;

INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)
SELECT current_date, coalesce(m.id, 'chua-ro'), coalesce(d.property_type, 'unknown'), d.unit, d.data_level, count(*),
       'thang-0811'
  FROM data_level_units() d
  LEFT JOIN areas w ON w.id = d.area_id
  LEFT JOIN areas m ON m.id IN (w.id, w.parent_id) AND m.region_type = 'market'   -- tin S03 mang chính mã thị trường (s03-len-cong)
 GROUP BY 2, 3, 4, 5;
