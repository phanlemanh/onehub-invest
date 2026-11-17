-- Lùi 110, 103 và bước 1c: bỏ view, hàm, bốn bảng stg_s16_*, trả ràng buộc nguồn hai chữ số, gỡ dòng sổ nguồn S16.
-- Chạy sau lui-nap.sql (và sau go-khoa.sh nếu đã dựng). Ràng buộc nguồn chỉ thu hẹp lại được khi không còn bí danh S10–S19.
BEGIN;
DROP VIEW IF EXISTS v_s16_can;
DROP VIEW IF EXISTS v_s16_toa;
DROP FUNCTION IF EXISTS s16_chuan_toa(text);
DROP TABLE IF EXISTS stg_s16_can, stg_s16_toa, stg_s16_khu, stg_s16_item;
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_source_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_source_check CHECK (source ~ '^S0[1-9]$');
DELETE FROM source_registry WHERE code = 'S16';
COMMIT;
