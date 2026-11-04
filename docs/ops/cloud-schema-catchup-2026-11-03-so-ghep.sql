-- cloud-schema-catchup-2026-11-03-so-ghep.sql — phần cloud (Supabase) của hồ sơ so-ghep-s06-nhan-danh-ba.
-- CHƯA ÁP. Mạnh duyệt khối ÁP (luật 2), Claude chạy qua Management API (mgmtExec của sync-cloud, đo trước, đặt lock_timeout), theo đúng thứ tự năm mốc:
-- 1. gộp: PR sdt-s06-ghep-tai-khoan rồi PR so-ghep-s06-nhan-danh-ba vào main. Cloud chưa có cột, mọi số hiện kèm nhãn, trang không lỗi.
-- 2. kéo về: checkout chính ở máy thu kéo main, để lượt sync đêm chạy bản mới.
-- 3. áp cloud: chạy khối ĐO TRƯỚC, rồi khối ÁP dưới đây trên cloud.
-- 4. áp 070: pg_dump trước, áp trên máy thu, chạy một lượt sync, xem log không còn «lệch schema». Số trực tiếp hết nhãn.
-- 5. áp 068: pg_dump trước, áp, để job ghi số, sync, kiểm trang Bán và Cho thuê.
--
-- Vì sao thứ tự này: áp cloud trước khi kéo về thì leak gate của bản sync cũ thấy cột ngoài CLOUD_ALLOW và dừng lượt đêm; kéo về
-- mà chưa áp cloud thì sync vẫn chạy, cảnh báo cột thiếu, trang coi mọi số là chưa xác minh. 070 trước 068 để số ghép không lên
-- trang khi chưa có nhãn. Không xoá, không sửa dòng nào; dữ liệu về qua lượt sync.
--
-- ĐO TRƯỚC — chỉ đọc. Một dòng `kiem`: OK nếu đã có cột, không thì gọi tên cột còn thiếu.
SELECT coalesce((SELECT 'sale_offers thiếu cột ' || string_agg(c, ', ' ORDER BY c)
       FROM unnest(ARRAY['seller_phone_inferred']) AS c
      WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = 'sale_offers' AND column_name = c)), 'OK') AS kiem;
--
-- ÁP — chạy lại nhiều lần vẫn an toàn.
ALTER TABLE public.sale_offers ADD COLUMN IF NOT EXISTS seller_phone_inferred boolean;
