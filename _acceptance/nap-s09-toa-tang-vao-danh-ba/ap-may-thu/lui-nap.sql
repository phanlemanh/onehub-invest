-- Lùi bước nạp (mục 2 hồ sơ áp DA42): gỡ trọn ba bản thu S09 danh bạ. stg_s09_danh_ba khai REFERENCES airbnb_snapshots ON DELETE
-- CASCADE nên xoá dòng bản thu là gỡ mọi dòng stg của nó, không chạm bảng nào khác. Máy thu có 0 dòng bản thu này trước áp (đo 24/11).
-- Chỉ chạy khi CHƯA dựng (mục 3), hoặc sau lui-dung.sh. Xoá dữ liệu stg (nạp lại được từ raw bất biến) → cần lời riêng của Mạnh.
BEGIN;
DELETE FROM airbnb_snapshots WHERE starts_with(snapshot_id, 'vn__s09-danh-ba__');
COMMIT;
