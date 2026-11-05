-- 075_labels_can_cu_anh.sql — anh-tren-the-gan-nhan: thêm căn cứ «Ảnh» cho ô đọc từ ảnh trong bài (Mạnh duyệt Hỏi-1, 05/11).
-- Số do liên làn cấp. KHÔNG sync cloud: eval_labels gắn với hồ sơ người dùng app, tầng A (054_labels.sql). Nhãn đã lưu không đổi.
-- Áp lên DB thật trước khi gộp mã, xin giám sát kèm pg_dump: mã mới gửi `anh` thì CHECK cũ từ chối.
ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_basis_check;
ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_basis_check
  CHECK (basis IS NULL OR basis IN ('chu_bai', 'ngu_canh_nhom', 'kien_thuc_nghe', 'anh'));
