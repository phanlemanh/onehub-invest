-- lui-122.sql — lùi DB của so-nguon-kho-khai-bao (migration 122). Chạy SAU khi đã lùi mã (revert PR, kéo main ở checkout chính):
-- mã mới cần cột của 122, bỏ cột trước khi lùi mã thì CLI, /ops và lượt đẩy lên cloud ném lỗi.
-- Một giao dịch. Xoá dòng S09, S17 hỏng ở khoá ngoại (collection_units) nếu đã có đơn vị thu → cả giao dịch lùi, dừng và báo.
-- Sau bước này đối chiếu bảng với bản sao lưu trước áp: `bash kiem-lui.sh <tệp sao lưu>` (phải 0 dòng khác).
BEGIN;
UPDATE source_registry SET status = 'active', reason = NULL, resume_when = NULL
 WHERE code = 'S11' AND status = 'paused' AND reason = 'hoãn nạp S11 — ROADMAP §3 mục 53';
DELETE FROM source_registry WHERE code IN ('S09', 'S17');
ALTER TABLE source_registry ALTER COLUMN real_name SET NOT NULL;
ALTER TABLE source_registry DROP COLUMN IF EXISTS family, DROP COLUMN IF EXISTS cadence_hours, DROP COLUMN IF EXISTS universe,
  DROP COLUMN IF EXISTS stg_tables, DROP COLUMN IF EXISTS measured_markets;
COMMIT;
