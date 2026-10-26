-- cloud-schema-catchup-2026-10-26-044.sql — phần cloud (Supabase) của migration 044 (PL14 nap-lai-khong-xoa).
-- CHƯA ÁP — trình Mạnh. Hướng dẫn + thứ tự: docs/ops/cloud-schema-catchup-2026-10-26.md.
--
-- 044 đổi lược đồ LOCAL (sale_offers/listings thành view sống trên bảng bản ghi). Cloud KHÔNG cần đổi theo:
-- sync-cloud chép sale_offers/listings từ view sống và chỉ chép nights/listing_stats/property_offers có cha sống
-- (pipeline/sync-cloud.mjs CHILD_OF_LIVE), nên cloud vẫn là bảng thường chỉ chứa dòng sống, như hôm nay.
-- Cột mới (retired_at, retired_reason, superseded_by, originating_system_key) ở lại máy: không có trong CLOUD_ALLOW
-- của sale_offers, và cloud listings không có cột ấy nên sync bỏ qua (cảnh báo «lệch schema», không gửi).
--
-- ĐO TRƯỚC — chỉ đọc. Kết quả đo 26/10 ghi sau mỗi câu; khác kết quả này thì DỪNG, đừng chờ lượt sync, báo lại.
-- (1) sale_offers, listings là BẢNG ('r'); cloud không có sale_offer_records/listing_records.
SELECT c.relname, c.relkind FROM pg_class c
 WHERE c.relnamespace = 'public'::regnamespace
   AND c.relname IN ('sale_offers','listings','sale_offer_records','listing_records','nights','listing_stats','property_offers')
 ORDER BY 1;
-- 26/10: listing_stats r · listings r · nights r · property_offers r · sale_offers r
-- (2) Khoá ngoại tới hai bảng ấy: chỉ nights, listing_stats → listings (CASCADE). property_offers không có khoá ngoại.
SELECT conrelid::regclass::text AS bang_con, conname, confrelid::regclass::text AS cha, confdeltype
  FROM pg_constraint
 WHERE contype = 'f'
   AND confrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN ('sale_offers','listings'))
 ORDER BY 1, 2;
-- 26/10: listing_stats_listing_id_fkey → listings c · nights_listing_id_fkey → listings c
-- (3) View đọc hai bảng: đúng v_ruler_p2, v_ruler_p2_area.
SELECT DISTINCT v.relname, v.relkind FROM pg_depend d
  JOIN pg_rewrite r ON r.oid = d.objid JOIN pg_class v ON v.oid = r.ev_class
 WHERE d.refobjid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname IN ('sale_offers','listings'))
   AND v.relname NOT IN ('sale_offers','listings')
 ORDER BY 1;
-- 26/10: v_ruler_p2 v · v_ruler_p2_area v
-- (4) Cột 044 không có trên cloud (phải 0 dòng — cột ở lại máy).
SELECT table_name, column_name FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name IN ('sale_offers','listings')
   AND column_name IN ('retired_at','retired_reason','superseded_by','originating_system_key');
-- 26/10: 0 dòng
-- (5) Số dòng + dòng con mồ côi (phải 0) — đối chiếu sau lượt sync đầu tiên chạy code 044.
SELECT 'sale_offers' AS t, count(*)::int AS n FROM public.sale_offers
UNION ALL SELECT 'listings', count(*)::int FROM public.listings
UNION ALL SELECT 'nights', count(*)::int FROM public.nights
UNION ALL SELECT 'listing_stats', count(*)::int FROM public.listing_stats
UNION ALL SELECT 'property_offers', count(*)::int FROM public.property_offers;
-- 26/10: sale_offers 18769 · listings 611 · nights 217540 · listing_stats 572 · property_offers 18654
SELECT 'nights' AS t, count(*)::int AS mo_coi FROM public.nights n
 WHERE NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = n.listing_id)
UNION ALL
SELECT 'property_offers', count(*)::int FROM public.property_offers p
 WHERE NOT EXISTS (SELECT 1 FROM public.sale_offers o WHERE o.offer_id = p.offer_id);
-- 26/10: nights 0 · property_offers 0
--
-- ÁP — KHÔNG có câu nào. 044 không đổi lược đồ cloud (lý do ở đầu tệp). Đo trước khớp 26/10 là đủ; việc còn lại là
-- đối chiếu (5) sau lượt sync đầu tiên chạy code 044 (theo docs/ops/cloud-schema-catchup-2026-10-26.md).
