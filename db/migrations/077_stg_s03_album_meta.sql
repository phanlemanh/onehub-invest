-- 077_stg_s03_album_meta.sql — ma-album-s03: khoá album của bài ảnh kênh S03 (RawItem.meta.albumMeta, DATA-CONTRACT v6).
-- Nguồn: _acceptance/ma-album-s03/contract.md AC-5. Số do liên làn cấp (SO-MIGRATION). KHÔNG sync cloud, như cả bảng stg này.
-- Cột stg, không phải field canonical nên không khai pipeline/mappings.yaml (ADR-0011, Notes của hợp đồng).
-- album_meta: { group_layout_id, id_in_group, total_item_in_group?, is_group_layout?, child_number?, msg_type? }.
-- NULL là bài không phải ảnh album, hoặc thu trước khi extension mới chạy (không thu lại dữ liệu cũ).
-- Bộ nạp mới chịu được DB chưa có cột này, nên gộp mã không phải chờ áp. Áp DB thật cần sao lưu và lời duyệt riêng của Mạnh.
-- Lùi: ALTER TABLE ... DROP COLUMN IF EXISTS album_meta (bộ nạp tự bỏ trường khi thiếu cột).
ALTER TABLE stg_zalo_posts ADD COLUMN IF NOT EXISTS album_meta jsonb;

COMMENT ON COLUMN stg_zalo_posts.album_meta IS
  'ma-album-s03: khoá album từ extension kênh S03 (group_layout_id, id_in_group, tổng ảnh); NULL = không có hoặc thu trước v6';
