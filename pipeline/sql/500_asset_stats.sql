-- 500_asset_stats.sql — median giá bán + thuê LT theo phường + yield
TRUNCATE market_asset_stats;

INSERT INTO market_asset_stats (area_id, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent, updated_at)
-- Sale: median giá/m²
SELECT o.area_id, 'sale', count(*),
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_vnd),
       percentile_cont(0.25) WITHIN GROUP (ORDER BY o.price_vnd),
       percentile_cont(0.75) WITHIN GROUP (ORDER BY o.price_vnd),
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2),
       NULL, now()
FROM sale_offers o
WHERE o.kind = 'sale' AND o.area_id IS NOT NULL AND o.confidence IN ('high','medium')
  AND o.price_perm2 IS NOT NULL
GROUP BY o.area_id
HAVING count(*) >= 3;

INSERT INTO market_asset_stats (area_id, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent, updated_at)
-- Rent LT: median giá/tháng
SELECT o.area_id, 'rent_lt', count(*),
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_vnd),
       percentile_cont(0.25) WITHIN GROUP (ORDER BY o.price_vnd),
       percentile_cont(0.75) WITHIN GROUP (ORDER BY o.price_vnd),
       NULL,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_vnd), now()
FROM sale_offers o
WHERE o.kind = 'rent_lt' AND o.area_id IS NOT NULL AND o.confidence IN ('high','medium')
  AND o.price_vnd IS NOT NULL
GROUP BY o.area_id
HAVING count(*) >= 3;

ANALYZE market_asset_stats;
