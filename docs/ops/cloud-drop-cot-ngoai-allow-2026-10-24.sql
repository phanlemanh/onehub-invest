-- cloud-drop-cot-ngoai-allow-2026-10-24.sql — CHỈ áp lên Supabase (cloud), KHÔNG áp DB local.
-- NT2 `soat-tang-a-moi-duong-len-cloud`: leak gate nay đỏ khi bảng người bán trên cloud có cột ngoài CLOUD_ALLOW
-- (pipeline/sync-cloud.mjs). `--kiem-cot` trên prod 24/10 ~09:10Z: hai cột thừa, đều thuộc SOURCE_EXCLUDE (giá trị
-- mang tên miền/CDN nguồn — tầng A) và sync không bao giờ gửi chúng:
--   sale_offers.listing_url  (audit 23/10 P16: 0/12.615 dòng có giá trị)
--   properties.photos
-- Cloud là schema dựng tay (tiền lệ docs/ops/cloud-catchup-2026-10-22.sql cố ý không tạo properties.seller_name);
-- local GIỮ hai cột (photos có dữ liệu ở local). Bên đọc trên cloud (app/, data-api/) không đọc hai cột này.
-- Người chạy: Mạnh (luật 2). Idempotent, một transaction; chỉ đổi cấu trúc, không ghi dòng dữ liệu nào.
-- Kiểm sau khi chạy: `node pipeline/sync-cloud.mjs --kiem-cot` → «kiem-cot: sạch».
-- Đảo (kiểu cột theo db/migrations 022 và 031 / cloud-catchup-2026-10-22.sql):
--   ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS listing_url text;
--   ALTER TABLE public.properties  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;
-- Cột photos trên cloud do catch-up 22/10 tạo (NOT NULL DEFAULT '[]') — sync chưa từng gửi, mọi dòng mang '[]'.
BEGIN;
ALTER TABLE public.sale_offers DROP COLUMN IF EXISTS listing_url;
ALTER TABLE public.properties  DROP COLUMN IF EXISTS photos;
NOTIFY pgrst, 'reload schema';
COMMIT;
