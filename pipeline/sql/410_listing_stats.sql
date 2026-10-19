-- 410_listing_stats.sql — rebuild listing_stats từ nights (chạy sau 300_metrics).
-- Một dòng cho mỗi listing có nights; app đọc bảng này thay vì gộp nights runtime.
-- Một transaction: trang đang đọc thấy bản cũ cho tới khi COMMIT, không thấy bảng rỗng.
BEGIN;
TRUNCATE listing_stats;

INSERT INTO listing_stats (listing_id, nights, booked, revenue, occupancy, first_night, last_night)
SELECT listing_id,
       count(*) AS nights,
       count(*) FILTER (WHERE NOT available) AS booked,
       COALESCE(sum(price) FILTER (WHERE NOT available), 0) AS revenue,
       count(*) FILTER (WHERE NOT available)::numeric / count(*) AS occupancy,
       min(night), max(night)
FROM nights
GROUP BY listing_id;
COMMIT;

ANALYZE listing_stats;
