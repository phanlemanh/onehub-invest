-- Lùi 125 rồi 115 (mục 1 hồ sơ áp DA42): bỏ bốn view và bảng stg. Chạy sau lui-nap.sql (bảng rỗng). Không chạm bảng có sẵn.
BEGIN;
DROP VIEW IF EXISTS v_s09_db_tang, v_s09_db_toa, v_s09_db_du_an, v_s09_db_item_moi;
DROP TABLE IF EXISTS stg_s09_danh_ba;
COMMIT;
