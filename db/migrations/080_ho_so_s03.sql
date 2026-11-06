-- 080_ho_so_s03.sql — link-nguoi-ban-s03: bảng stg kết quả tra hồ sơ người bán S03 theo mã tài khoản + luật liên lạc
-- s03_ho_so_theo_tai_khoan cho liên lạc chat_profile (username trần) trong sổ liên lạc của Người (079).
-- _acceptance/link-nguoi-ban-s03 (AC-6, AC-7) · collector/docs/DATA-CONTRACT.md (kind ho-so, nguồn snapshot s03-ho-so) · ADR-0016 §3.
-- Không sửa 079: chỉ nới CHECK rule_id và thêm rào cặp luật–loại bằng tệp mới.
-- KHÔNG sync cloud: stg_s03_ho_so và party_contacts chỉ ở máy thu (mã tài khoản, username người bán là tầng C; link hồ sơ dựng lúc
-- hiển thị từ source_registry local — kho không giữ mẫu link). Áp lên DB máy thu là lời riêng của Mạnh (pg_dump trước). Idempotent.

-- ---- 1. Kết quả tra hồ sơ, một dòng mỗi mã mỗi lần lấy (khoá «<mã>__<lấy lúc>» của snapshot, ghi mới không sửa) ----
-- loai: co-username · khong-username · khong-ro (nhóm hồ sơ không đổi) · khong-tim-thay — collector đã kiểm khuôn; bộ ghi liên lạc
-- đọc dòng mới nhất mỗi mã qua view dưới.
CREATE TABLE IF NOT EXISTS stg_s03_ho_so (
  source_id    text PRIMARY KEY,
  ma_tai_khoan text NOT NULL,
  username     text,
  loai         text,
  captured_at  timestamptz
);
CREATE INDEX IF NOT EXISTS stg_s03_ho_so_ma_idx ON stg_s03_ho_so (ma_tai_khoan, captured_at DESC);

CREATE OR REPLACE VIEW stg_s03_ho_so_moi_nhat AS
SELECT DISTINCT ON (ma_tai_khoan) source_id, ma_tai_khoan, username, loai, captured_at
  FROM stg_s03_ho_so
 ORDER BY ma_tai_khoan, captured_at DESC NULLS LAST, source_id DESC;

-- ---- 2. Luật liên lạc mới + rào cặp luật–loại ----
-- s03_ho_so_theo_tai_khoan: username trả về khi tra hồ sơ theo đúng mã tài khoản S03 của Người (fact / source_field).
ALTER TABLE party_contacts DROP CONSTRAINT IF EXISTS party_contacts_rule_id_check;
ALTER TABLE party_contacts ADD CONSTRAINT party_contacts_rule_id_check
  CHECK (rule_id IN ('so_tren_tin', 'so_trong_bai', 's03_ho_so_theo_tai_khoan'));
-- Luật số chỉ sinh liên lạc sdt, luật hồ sơ chỉ sinh chat_profile; chat_profile là username trần — không link, không khoảng trắng.
ALTER TABLE party_contacts DROP CONSTRAINT IF EXISTS party_contacts_rule_kind_chk;
ALTER TABLE party_contacts ADD CONSTRAINT party_contacts_rule_kind_chk CHECK (
  (rule_id IN ('so_tren_tin', 'so_trong_bai') AND kind = 'sdt')
  OR (rule_id = 's03_ho_so_theo_tai_khoan' AND kind = 'chat_profile' AND value ~ '^[^/:[:space:]]{1,120}$'));

-- ---- 3. Sổ từ vựng (sinh bằng `node pipeline/vocab.mjs --emit-seed`, lọc giá trị mới) ----
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('contact_rule', 's03_ho_so_theo_tai_khoan', NULL, 'Hồ sơ chat theo mã tài khoản', true, 3)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
