-- 410_listing_stats.sql — rebuild listing_stats từ nights (chạy sau 300_metrics).
-- Một dòng cho mỗi listing có nights; app đọc bảng này thay vì gộp nights runtime.
-- Giá đêm: COALESCE(n.price, l.price_listed) — cùng quy tắc với 300_metrics.sql.
-- Một transaction: trang đang đọc thấy bản cũ cho tới khi COMMIT, không thấy bảng rỗng.
BEGIN;
TRUNCATE listing_stats;

INSERT INTO listing_stats (listing_id, nights, booked, revenue, occupancy, first_night, last_night)
SELECT n.listing_id,
       count(*) AS nights,
       count(*) FILTER (WHERE NOT n.available) AS booked,
       COALESCE(sum(COALESCE(n.price, l.price_listed)) FILTER (WHERE NOT n.available), 0) AS revenue,
       count(*) FILTER (WHERE NOT n.available)::numeric / count(*) AS occupancy,
       min(n.night), max(n.night)
FROM nights n
JOIN listings l ON l.id = n.listing_id
GROUP BY n.listing_id;
COMMIT;

ANALYZE listing_stats;
