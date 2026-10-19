-- 300_metrics.sql — precompute market_metrics (area × tháng)
-- Cửa sổ dữ liệu: 12 tháng TỚI TỪ snapshot (xem divergence list — pipeline/README.md).
-- Rollup: mỗi submarket + tổng market ('th-bangkok').
-- Giá đêm: COALESCE(n.price, l.price_listed) — đêm đã đặt thiếu giá dùng giá niêm yết
-- của chính listing đó. Không lấp thì revenue thiếu giá mà booked_nights vẫn đếm đêm
-- → ADR/RevPAR bị pha loãng (2026-10: Hà Nội chỉ 18% đêm có giá, ADR 174k thay vì ~1,4tr).
-- Cùng quy tắc với bước lấp giá trong transform-airbnb.mjs; ở đây để metrics đúng cả
-- khi nights nạp trước khi listing bóc được giá.
--
-- Quy tắc mẫu: CHỈ listing có price_listed vào metrics (cả đêm đặt lẫn đêm trống).
-- Listing không giá không phải "đặt mà chưa biết giá" mà phần lớn là listing ngừng
-- nhận khách: Bangkok 2026-09 có 2.259 listing không giá, một nửa availability_365 = 0
-- (lịch chặn cả năm → "đặt" 100%), 71% không review 12 tháng; nhóm này chiếm 19% đêm
-- đặt với công suất 67% so với 22% của listing có giá. Giữ lại thì vừa pha loãng ADR/
-- RevPAR (revenue 0) vừa đội công suất. Loại cả listing chứ không lọc từng đêm: lọc
-- đêm đặt mà giữ đêm trống sẽ kéo công suất xuống sai. Cùng quy tắc ở 400_breakdowns,
-- 410_listing_stats.

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
       COALESCE(sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available), 0),
       CASE WHEN count(*) FILTER (WHERE NOT n.available) > 0
            THEN sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available)
                 / count(*) FILTER (WHERE NOT n.available) END,
       count(*) FILTER (WHERE NOT n.available)::numeric / NULLIF(count(*), 0),
       COALESCE(sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available), 0) / NULLIF(count(*), 0)
FROM nights n
JOIN listings l ON l.id = n.listing_id
WHERE l.price_listed IS NOT NULL  -- quy tắc mẫu, xem đầu file
GROUP BY 1, 2;

-- Market rollup — generic cho mọi market có submarket (th-bangkok, vn-hanoi, ...)
-- Xoá rows market-level tạo bởi listings trực tiếp (không qua submarket)
-- trước khi rollup — nếu không, DO NOTHING sẽ giữ số sai
DELETE FROM market_metrics WHERE area_id IN (
  SELECT id FROM areas WHERE region_type = 'market'
);

INSERT INTO market_metrics
  (area_id, month, listing_count, booked_nights, available_nights,
   revenue, adr, occupancy, revpar)
SELECT p.id, month,
       sum(listing_count), sum(booked_nights), sum(available_nights),
       sum(revenue),
       sum(revenue) / NULLIF(sum(booked_nights), 0),
       sum(booked_nights)::numeric / NULLIF(sum(booked_nights) + sum(available_nights), 0),
       sum(revenue) / NULLIF(sum(booked_nights) + sum(available_nights), 0)
FROM market_metrics mm
JOIN areas a ON a.id = mm.area_id AND a.region_type = 'submarket'
JOIN areas p ON p.id = a.parent_id AND p.region_type = 'market'
WHERE mm.area_id <> p.id
GROUP BY p.id, month
ON CONFLICT (area_id, month) DO NOTHING;

ANALYZE market_metrics;
