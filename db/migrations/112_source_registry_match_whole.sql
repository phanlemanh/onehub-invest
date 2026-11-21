-- 112_source_registry_match_whole.sql — che-ten-nguon-khong-lay-tu-dau (Mạnh duyệt Cổng 1 + 1.5, 18/11/2026; GS chốt lối B)
--
-- Cờ theo dòng sổ nguồn: match_whole = true → bộ che/soát tên nguồn (pipeline/lib/mask-source-names.mjs và bản chép app)
-- KHÔNG sinh biến thể «từ đầu» cho mọi token của dòng (tên thật và từng định danh) — chỉ khớp tên đủ và bản viết liền.
-- Dùng cho nguồn có từ đầu trùng thương hiệu dự án hay một từ chung (S16). Mặc định false = hành vi trước 112: chỗ đọc nào
-- chưa mang cờ thì che thừa, không rò. source_registry chỉ ở máy thu (tầng A), không lên cloud — không DDL cloud.
-- Chạy lại không lỗi (IF NOT EXISTS).

ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS match_whole boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN source_registry.match_whole IS
  'true: bộ che/soát tên nguồn chỉ khớp nguyên cụm (tên đủ, viết liền) cho mọi token của dòng, không lấy từ đầu. ADR-0007; hồ sơ che-ten-nguon-khong-lay-tu-dau.';
