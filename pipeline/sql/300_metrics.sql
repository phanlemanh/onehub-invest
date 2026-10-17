-- 300_metrics.sql — precompute market_metrics (area × tháng)
-- Cửa sổ dữ liệu: 12 tháng TỚI TỪ snapshot (xem divergence list — pipeline/README.md).
-- Rollup: mỗi submarket + tổng market ('th-bangkok').

TRUNCATE market_metrics;

-- Submarket level
INSERT INTO market_metrics
  (area_id, month, listing_count, booked_nights, available_nights,
   revenue, adr, occupancy, revpar)
SELECT l.area_id,
       date_trunc('month', n.night)::date,
       count(DISTINCT l.id) FILTER (WHERE NOT n.available),
       count(*) FILTER (WHERE NOT n.available),
       count(*) FILTER (WHERE n.available),
       COALESCE(sum(n.price) FILTER (WHERE NOT n.available), 0),
       CASE WHEN count(*) FILTER (WHERE NOT n.available) > 0
            THEN sum(n.price) FILTER (WHERE NOT n.available)
                 / count(*) FILTER (WHERE NOT n.available) END,
       count(*) FILTER (WHERE NOT n.available)::numeric / NULLIF(count(*), 0),
       COALESCE(sum(n.price) FILTER (WHERE NOT n.available), 0) / NULLIF(count(*), 0)
FROM nights n
JOIN listings l ON l.id = n.listing_id
GROUP BY 1, 2;

-- Market rollup
INSERT INTO market_metrics
  (area_id, month, listing_count, booked_nights, available_nights,
   revenue, adr, occupancy, revpar)
SELECT 'th-bangkok', month,
       sum(listing_count), sum(booked_nights), sum(available_nights),
       sum(revenue),
       sum(revenue) / NULLIF(sum(booked_nights), 0),
       sum(booked_nights)::numeric / NULLIF(sum(booked_nights) + sum(available_nights), 0),
       sum(revenue) / NULLIF(sum(booked_nights) + sum(available_nights), 0)
FROM market_metrics
WHERE area_id <> 'th-bangkok'
GROUP BY month
ON CONFLICT (area_id, month) DO NOTHING;

ANALYZE market_metrics;
