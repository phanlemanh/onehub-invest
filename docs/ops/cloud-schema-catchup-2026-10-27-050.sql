-- cloud-schema-catchup-2026-10-27-050.sql — phần cloud (Supabase) của migration 050 (hồ sơ wanted-thanh-inquiry).
-- CHƯA ÁP. Người chạy: Mạnh (luật 2) — sau khi PR gộp, giám sát chạy khối ĐO TRƯỚC, Mạnh gõ duyệt rồi mới chạy khối ÁP.
-- 050 đổi giá trị `wanted` → `inquiry` «Yêu cầu» của trục «Ý định tin» trong ref_lookup; cloud có ref_lookup từ catchup 043.
-- App đọc nhãn từ tệp sinh, không từ DB — lệch ở cloud không ai thấy trên trang, chỉ `vocab.mjs --check-db` trỏ cloud đỏ.
--
-- ĐO TRƯỚC — chỉ đọc. Đo 27/10 (phiên liên làn): đúng 1 dòng `wanted`, 0 dòng `inquiry`. Khác thì DỪNG, báo lại.
SELECT lookup_value, label_vi, sort_order FROM ref_lookup WHERE lookup_name = 'listing_intent' ORDER BY sort_order;
SELECT count(*) FILTER (WHERE lookup_value = 'wanted') AS wanted, count(*) FILTER (WHERE lookup_value = 'inquiry') AS inquiry
  FROM ref_lookup WHERE lookup_name = 'listing_intent';
-- Kỳ vọng sau ÁP: wanted 0 · inquiry 1 (label_vi «Yêu cầu», sort_order 2).
-- Cách lùi (chỉ khi cần, Mạnh duyệt): UPDATE ref_lookup SET lookup_value = 'wanted', label_vi = 'Tin tìm mua, tìm thuê'
--   WHERE lookup_name = 'listing_intent' AND lookup_value = 'inquiry';
--
-- ÁP — nguyên văn hai câu của db/migrations/050_wanted_thanh_inquiry.sql.
BEGIN;
DELETE FROM ref_lookup WHERE lookup_name = 'listing_intent' AND lookup_value = 'wanted'
  AND EXISTS (SELECT 1 FROM ref_lookup WHERE lookup_name = 'listing_intent' AND lookup_value = 'inquiry');
UPDATE ref_lookup SET lookup_value = 'inquiry', label_vi = 'Yêu cầu' WHERE lookup_name = 'listing_intent' AND lookup_value = 'wanted';
COMMIT;
