-- 076_labels_ghep.sql — ghep-anh-tren-the-gan-nhan: kết quả ghép ảnh của từng dòng mẫu và trường hợp «Ghép sai» (Mạnh duyệt Hỏi-4, 05/11).
-- Nguồn: docs/superpowers/specs/2026-11-05-ghep-anh-tren-the-gan-nhan-design.md. Số do giám sát cấp. KHÔNG sync cloud, như 054_labels.sql.
-- Áp lên DB thật trước khi gộp mã, kèm sao lưu: mã mới đọc cột này. Lùi: UPDATE eval_label_items SET ghep = NULL.
-- ghep: { chu_ref, anh_refs, so_chu_gan, trung_voi } do pipeline/label-ghep.mjs ghi bằng ganBaiAnh. NULL là bài không ghép.
ALTER TABLE eval_label_items ADD COLUMN IF NOT EXISTS ghep jsonb;

ALTER TABLE eval_label_cases DROP CONSTRAINT IF EXISTS eval_label_cases_case_kind_check;
ALTER TABLE eval_label_cases ADD CONSTRAINT eval_label_cases_case_kind_check CHECK (case_kind IS NULL OR case_kind IN (
  'bi-danh', 'mac-dinh-nhom', 'ma-trung-du-an', 'nhieu-can', 'che-tang', 'so-ngoai-bai', 'khong-phai-tin-rao', 'the-nhom-sai', 'ghep-sai', 'khac'));
