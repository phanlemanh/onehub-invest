-- 400_breakdowns.sql — precompute breakdowns (ADR/room-type/top-listings)
-- cho MỖI area (market = self + children) để trang market không quét nights runtime.
-- Cùng logic per_listing CTE như getAreaBreakdown cũ — viết vào bảng cache.
-- Giá đêm: COALESCE(n.price, l.price_listed) — cùng quy tắc với 300_metrics.sql.
TRUNCATE area_breakdowns;

INSERT INTO area_breakdowns (area_id, kind, label, payload)
WITH scope AS (
  -- mọi (area, chính nó hoặc con) — market rollup gồm tất cả con
  SELECT a.id AS area_id, a.id AS member_id FROM areas a
  UNION ALL
  SELECT p.id, c.id FROM areas p JOIN areas c ON c.parent_id = p.id
), per_listing AS (
  SELECT s.area_id,
         l.id, l.name, l.bedrooms, l.room_type,
         count(*) FILTER (WHERE NOT n.available) AS booked,
         count(*) FILTER (WHERE n.available) AS avail,
         COALESCE(sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available), 0) AS revenue
  FROM nights n
  JOIN listings l ON l.id = n.listing_id
  JOIN scope s ON s.member_id = l.area_id
  GROUP BY s.area_id, l.id, l.name, l.bedrooms, l.room_type
), beds AS (
  SELECT area_id,
         CASE WHEN bedrooms IS NULL THEN 'N/A'
              WHEN bedrooms = 0 THEN 'Studio'
              WHEN bedrooms >= 4 THEN '4+'
              ELSE bedrooms::text END AS label,
         count(*) AS listings,
         sum(revenue) AS revenue,
         sum(revenue) / NULLIF(sum(booked), 0) AS adr,
         sum(booked)::numeric / NULLIF(sum(booked) + sum(avail), 0) AS occupancy
  FROM per_listing GROUP BY area_id, 2
), rtypes AS (
  SELECT area_id, COALESCE(room_type, 'N/A') AS label,
         count(*) AS listings, sum(revenue) AS revenue,
         sum(revenue) / NULLIF(sum(booked), 0) AS adr,
         sum(booked)::numeric / NULLIF(sum(booked) + sum(avail), 0) AS occupancy
  FROM per_listing GROUP BY area_id, 2
)
SELECT area_id, 'bedrooms', label,
       jsonb_build_object('listings', listings, 'revenue', revenue,
                          'adr', adr, 'occupancy', occupancy)
FROM beds
UNION ALL
SELECT area_id, 'roomTypes', label,
       jsonb_build_object('listings', listings, 'revenue', revenue,
                          'adr', adr, 'occupancy', occupancy)
FROM rtypes;

-- Top listings mỗi area (8 cái)
INSERT INTO area_breakdowns (area_id, kind, label, payload)
WITH scope AS (
  SELECT a.id AS area_id, a.id AS member_id FROM areas a
  UNION ALL
  SELECT p.id, c.id FROM areas p JOIN areas c ON c.parent_id = p.id
), per_listing AS (
  SELECT s.area_id,
         l.id, l.name, l.bedrooms, l.room_type,
         count(*) FILTER (WHERE NOT n.available) AS booked,
         count(*) FILTER (WHERE n.available) AS avail,
         COALESCE(sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available), 0) AS revenue
  FROM nights n
  JOIN listings l ON l.id = n.listing_id
  JOIN scope s ON s.member_id = l.area_id
  GROUP BY s.area_id, l.id, l.name, l.bedrooms, l.room_type
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY area_id ORDER BY revenue DESC) AS rk
  FROM per_listing
)
SELECT area_id, 'topListings', 'listing:' || id,
       jsonb_build_object('id', id, 'name', name, 'bedrooms', bedrooms,
                          'room_type', room_type,
                          'adr', revenue / NULLIF(booked, 0),
                          'occupancy', booked::numeric / NULLIF(booked + avail, 0),
                          'revenue', revenue)
FROM ranked WHERE rk <= 8;

ANALYZE area_breakdowns;
