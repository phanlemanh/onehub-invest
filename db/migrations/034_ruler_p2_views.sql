-- 034_ruler_p2_views.sql — G-2: ruler giá/m² "một căn một phiếu" (dedup repost)
-- (commit 50005b7; docs/research/unified-property-pipeline.md)
--
-- Hai view này được tạo TAY ở DB local lúc làm G-2 và chưa từng vào migration
-- → DB dựng lại từ db/migrations/ (cloud, máy mới) thiếu view, các trang đọc
-- chúng lỗi: /ops/deals (lib/deals.ts), /dau-tu (lib/invest.ts),
-- /api/v1/deals, pipeline/refresh-bait-gap.mjs. Định nghĩa dưới đây lấy
-- nguyên văn từ local bằng pg_get_viewdef (22/10) — không đổi logic.
--
-- Ruler = median price_perm2 theo CĂN (properties), mỗi căn chỉ lấy phiếu
-- sale_offers mới nhất (last_seen max) → một căn một phiếu, repost không
-- kéo lệch median. Lọc 5tr–500tr/m² (chặn giá nhập sai đơn vị); cần ≥5 căn.
-- Cast ::numeric: price_perm2 là bigint (bài học chia nguyên ở 027).
--
-- Đầu ra chỉ là aggregate (area_id, median, count) — không PII.

-- Theo phường
CREATE OR REPLACE VIEW v_ruler_p2_area AS
SELECT pr.area_id,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id
HAVING count(*) >= 5;

-- Theo phường × loại hình
CREATE OR REPLACE VIEW v_ruler_p2 AS
SELECT pr.area_id,
       pr.property_type,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id, pr.property_type
HAVING count(*) >= 5;
