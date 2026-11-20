-- lui-cot.sql — bước lùi thứ hai của che-ten-nguon-khong-lay-tu-dau: bỏ cột match_whole (sau khi đã khôi phục dòng S16
-- từ bản sao lưu bằng khoi-phuc-s16.sh). Chạy lại không lỗi. Áp lại 112 được.
ALTER TABLE source_registry DROP COLUMN IF EXISTS match_whole;
