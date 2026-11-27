-- Lùi bước nạp (mục 2 hồ sơ áp DA42): gỡ ĐÚNG ba bản thu S09 danh bạ mà mục 2 nạp, gọi đích danh. stg_s09_danh_ba khai REFERENCES
-- airbnb_snapshots ON DELETE CASCADE nên xoá dòng bản thu là gỡ mọi dòng stg của nó, không chạm bảng nào khác. Bản thu S09 khác (vd
-- bản v16 của DA56 nạp sau, bản hỏng 2026-11-19T211829028 nếu ai lỡ nạp) KHÔNG bị đụng — sửa theo finding S4-r1 (lệnh cũ xoá mọi
-- snapshot_id mở đầu vn__s09-danh-ba__). Ca thử: pipeline/scripts/danh-ba-s09-toa.itest.mjs «lui-nap.sql chỉ gỡ ba bản thu của lượt áp».
-- Chỉ chạy khi CHƯA dựng (mục 3), hoặc sau lui-dung.sh. Xoá dữ liệu stg (nạp lại được từ raw bất biến) → cần lời riêng của Mạnh.
BEGIN;
DELETE FROM airbnb_snapshots WHERE snapshot_id = ANY (ARRAY[
  'vn__s09-danh-ba__2026-11-19T004959637',
  'vn__s09-danh-ba__2026-11-20T015947402',
  'vn__s09-danh-ba__2026-11-20T052953464'
]);
COMMIT;
