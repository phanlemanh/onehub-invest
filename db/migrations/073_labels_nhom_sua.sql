-- 073_labels_nhom_sua.sql — GC0 gan-nhan-theo-nhom-s03 (AC-13, AC-14): sửa bảng trường hợp của 072 trước khi áp lên DB thật.
-- Đổi cột trả lời thẻ sang tên tiếng Anh, thêm CHECK loại trường hợp, thêm khoá của một lần bấm Ghi để «Thử lại» không ghi trùng.
-- KHÔNG sync cloud: labeler_id gắn với hồ sơ người dùng app, tầng A (054_labels.sql). Áp lên DB thật cần Mạnh duyệt, kèm pg_dump.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'eval_label_cases' AND column_name = 'the_nhom_dung') THEN
    ALTER TABLE eval_label_cases DROP CONSTRAINT IF EXISTS eval_label_cases_the_nhom_dung_check;
    ALTER TABLE eval_label_cases RENAME COLUMN the_nhom_dung TO group_card_verdict;
    UPDATE eval_label_cases SET group_card_verdict = CASE group_card_verdict
      WHEN 'dung' THEN 'correct' WHEN 'sai' THEN 'wrong' WHEN 'chua' THEN 'unsure' ELSE group_card_verdict END;
  END IF;
END $$;

ALTER TABLE eval_label_cases DROP CONSTRAINT IF EXISTS eval_label_cases_group_card_verdict_check;
ALTER TABLE eval_label_cases ADD CONSTRAINT eval_label_cases_group_card_verdict_check
  CHECK (group_card_verdict IS NULL OR group_card_verdict IN ('correct', 'wrong', 'unsure'));

-- Danh sách khởi đầu, lượt thử sẽ sửa: đổi danh sách bằng DROP rồi ADD, như eval_labels_field_check.
ALTER TABLE eval_label_cases DROP CONSTRAINT IF EXISTS eval_label_cases_case_kind_check;
ALTER TABLE eval_label_cases ADD CONSTRAINT eval_label_cases_case_kind_check CHECK (case_kind IS NULL OR case_kind IN (
  'bi-danh', 'mac-dinh-nhom', 'ma-trung-du-an', 'nhieu-can', 'che-tang', 'so-ngoai-bai', 'khong-phai-tin-rao', 'the-nhom-sai', 'khac'));

-- NULL không tính trùng: dòng ghi không kèm khoá vẫn thêm được.
ALTER TABLE eval_label_cases ADD COLUMN IF NOT EXISTS request_id text;
CREATE UNIQUE INDEX IF NOT EXISTS eval_label_cases_request_uq ON eval_label_cases (item_id, labeler_id, request_id);
