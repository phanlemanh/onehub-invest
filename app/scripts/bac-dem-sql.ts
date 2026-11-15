// bac-dem-sql.ts — câu đếm bậc độc lập của bac-roundtrip, tách ra để test đọc đúng câu thật (DV7 AC-11).
// Câu đếm độc lập: không qua 610 hay data_level_units — phường → cha market bằng truy vấn con. Thang 08/11: tin trong cụm
// vẫn là đơn vị tin; định vị cấp dự án đọc thẳng nguồn chung offer_project (DV7, 105) — DB chưa áp 105 thì không tin nào
// định vị (tham số cuối false); chưa có căn nào.
export const sqlDem = (coView: boolean) => `
  WITH u AS (
    SELECT 'tin_le' AS unit, o.area_id, o.property_type,
           (SELECT data_level FROM offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id,
             ${coView ? "EXISTS (SELECT 1 FROM offer_project op WHERE op.offer_id = o.offer_id AND op.status = 'mot_du_an')" : "false"}))
      FROM sale_offers o
     WHERE o.source IN ('S03', 'S05', 'S06'))
  SELECT coalesce((SELECT m.id FROM areas m WHERE m.id = u.area_id AND m.region_type = 'market'),   -- tin mang mã thị trường (s03-len-cong)
                  (SELECT m.id FROM areas w JOIN areas m ON m.id = w.parent_id
                    WHERE w.id = u.area_id AND m.region_type = 'market'), 'chua-ro') AS market_id,
         coalesce(property_type, 'unknown') AS property_type, unit, data_level, count(*)::int AS n
    FROM u GROUP BY 1, 2, 3, 4`
