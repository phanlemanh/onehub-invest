-- cloud-schema-catchup-2026-11-02-tin-rao.sql — phần cloud (Supabase) của hồ sơ tin-rao-tren-invest.
-- CHƯA ÁP. Người chạy: Mạnh (luật 2), theo đúng thứ tự năm mốc:
-- 1. tường lửa: bật tường lửa cho cloud trước khi tên, số người bán lên.
-- 2. gộp: PR tin-rao-tren-invest vào main.
-- 3. kéo về: checkout chính ở máy thu kéo main, để lượt sync đêm chạy bản mới.
-- 4. áp: chạy khối ĐO TRƯỚC, rồi khối ÁP dưới đây trên cloud.
-- 5. sync: chạy một lượt sync, xem log có cảnh báo «lệch schema» hay không, rồi mở cổng kiểm.
--
-- Vì sao thứ tự này: áp trước khi gộp thì leak gate của bản sync cũ thấy cột ngoài CLOUD_ALLOW và dừng lượt đêm; gộp
-- và kéo về mà chưa áp thì sync vẫn chạy, cảnh báo cột thiếu, còn trang Bán báo lỗi vùng (thuê ngắn hạn không ảnh hưởng).
-- Không tạo migration: local đã có bốn cột này. Không xoá, không sửa dòng nào; dữ liệu về qua lượt sync.
--
-- ĐO TRƯỚC — chỉ đọc. Một dòng `kiem`: OK nếu đã đủ cột, không thì gọi tên cột còn thiếu.
SELECT coalesce((SELECT 'sale_offers thiếu cột ' || string_agg(c, ', ' ORDER BY c)
       FROM unnest(ARRAY['seller_name','seller_phone','stories','frontage_length']) AS c
      WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = 'sale_offers' AND column_name = c)), 'OK') AS kiem;
--
-- ÁP — chạy lại nhiều lần vẫn an toàn.
ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS seller_name text;
ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS seller_phone text;
ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS stories integer;
ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS frontage_length numeric;
