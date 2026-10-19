-- 410_listing_stats.sql — rebuild listing_stats từ nights (chạy sau 300_metrics).
-- Một dòng cho mỗi listing có giá và có nights; app đọc bảng này thay vì gộp nights runtime.
-- Giá đêm: COALESCE(n.price, l.price_listed) — cùng quy tắc với 300_metrics.sql.
-- Quy tắc mẫu: listing không có price_listed KHÔNG có dòng (xem 300_metrics.sql) — lịch
-- chặn của listing ngừng hoạt động không hiện thành công suất 100% trên thẻ/bảng listing
-- và không vào phân vị công suất "listing cùng phường".
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
WHERE l.price_listed IS NOT NULL
GROUP BY n.listing_id;
COMMIT;

ANALYZE listing_stats;
