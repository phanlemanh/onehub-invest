-- cloud-schema-catchup-2026-10-31-060.sql — phần cloud (Supabase) của migration 060 (hồ sơ sellers-view-len-cloud,
-- Ngoài-2 của sdt-luu-goc-e164).
-- CHƯA ÁP. Người chạy: Mạnh (luật 2) — sau khi PR gộp, giám sát chạy khối ĐO TRƯỚC; khối ÁP rỗng có chủ ý.
--
-- KHÔNG chạy db/migrations/060_sdt_e164.sql trên Supabase. 060 làm `sellers` ở máy thu thành VIEW đọc `registry_aliases`
-- và bản ghi tin — hai bảng chỉ ở máy thu. Trên cloud `sellers` là ĐÍCH GHI của pipeline/sync-cloud.mjs (tráo bảng xoá rồi
-- chèn vào public.sellers), nên cloud giữ `sellers` là BẢNG; sync đọc view máy thu, ghi bảng cloud. Sync dừng ở pha catalog
-- nếu gặp bảng đích không phải bảng thường (KIEU_DICH_CHO_QUA trong sync-cloud.mjs).
--
-- Phần cloud của 060 chỉ là khoá người bán đổi giá trị (băm SĐT dạng +84): sellers.phone_hash, sale_offers.seller_phone_hash,
-- properties.seller_phone_hash đổi cùng một lượt tráo. Hỏi-1 của hồ sơ duyệt việc đổi một lần; đã xảy ra 31/10 (kiểm chỉ
-- đọc 15:02Z: 207/207 khoá cloud = tập máy thu, 0 khoá cũ) — xem _acceptance/sellers-view-len-cloud/decisions.jsonl.
--
-- ĐO TRƯỚC — chỉ đọc. Một dòng `kiem`. Kỳ vọng: OK. Khác thì DỪNG, báo lại: dòng gọi tên chỗ lệch
-- («sellers không phải bảng», «sellers thiếu cột <c>», «có registry_aliases — ai đã chạy 060 trên cloud?»).
SELECT coalesce(nullif(concat_ws('; ',
    CASE WHEN (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.sellers')) IS NULL THEN 'thiếu bảng sellers'
         WHEN (SELECT relkind FROM pg_class WHERE oid = to_regclass('public.sellers')) NOT IN ('r','p')
           THEN 'sellers không phải bảng (relkind ' || (SELECT relkind::text FROM pg_class WHERE oid = to_regclass('public.sellers')) || ')' END,
    (SELECT 'sellers thiếu cột ' || string_agg(c, ', ' ORDER BY c)
       FROM unnest(ARRAY['phone_hash','sources','n_ads','first_seen','last_seen','flags']) AS c
      WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = c)),
    CASE WHEN to_regclass('public.registry_aliases') IS NOT NULL
         THEN 'có registry_aliases — ai đã chạy 060 trên cloud?' END
  ), ''), 'OK') AS kiem;
--
-- ÁP — rỗng có chủ ý: cloud không đổi lược đồ nào vì 060. Khoá đổi qua lượt sync đêm (pipeline/sync-cloud.mjs).
