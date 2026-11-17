-- 109_the_dia_chi_nhom_cho_nghi.sql — TG1 the-dia-chi-nhom-s03: cho NGHỈ thẻ của nhóm không còn trong tập nháp.
-- Mạnh chốt 2026-11-16 ở Cổng Bằng chứng vòng 6, nguyên văn «Lối 2, thẻ rời tập thì cho nghỉ» (_acceptance/the-dia-chi-nhom-s03/decisions.jsonl).
-- Vì sao cần: 108 chỉ ghi thêm và sửa thẻ của nhóm ĐANG trong tập nháp. Nhóm thôi đủ điều kiện (bài hoá ra là bài thử, bài bị gỡ
-- khỏi stg_zalo_posts, quy tắc gạt đổi) để lại thẻ mồ côi, nên bất biến «số thẻ = số nhóm thật có bài» của AC-7 và của
-- ap-may-thu/kiem-sau.sql vỡ vĩnh viễn. Đo 16/11 trên bản chép máy thu: 28 thẻ trong khi chỉ còn 26 nhóm thật có bài.
-- Cho NGHỈ chứ không xoá — cùng nếp với listing_records và sale_offer_records (044): dòng ở lại, chỉ rời tập sống.
-- Chỉ thẻ đang «nhap» mới được cho nghỉ; thẻ đã nhận, sửa hay bác là quyết định của người, giữ nguyên.
-- KHÔNG sync cloud: chỉ máy thu, như 108. Áp lại được. Áp CÙNG LƯỢT với 108 theo _acceptance/the-dia-chi-nhom-s03/ap-may-thu/.
-- Lùi: ap-may-thu/108-lui.sql (bỏ cả hai bảng; không cần tệp lùi riêng vì 109 chỉ thêm cột vào bảng của 108).

ALTER TABLE group_address_cards ADD COLUMN IF NOT EXISTS retired_at     timestamptz;
ALTER TABLE group_address_cards ADD COLUMN IF NOT EXISTS retired_reason text;

-- Thẻ sống = retired_at IS NULL. Mọi chỗ đếm «số thẻ» (phép đo AC-7, kiem-sau.sql, hàm đọc của Ops) lọc theo cột này.
CREATE INDEX IF NOT EXISTS group_address_cards_song_idx ON group_address_cards (retired_at) WHERE retired_at IS NULL;

-- Chỉ thẻ nháp mới được nghỉ: thẻ người đã quyết không bao giờ rời tập sống.
ALTER TABLE group_address_cards DROP CONSTRAINT IF EXISTS group_address_cards_nghi_chk;
ALTER TABLE group_address_cards ADD  CONSTRAINT group_address_cards_nghi_chk
  CHECK (retired_at IS NULL OR status = 'nhap');

-- Lịch sử nhận thêm hành động «nghi» (và «thuc_lai» khi nhóm quay lại tập nháp).
ALTER TABLE group_address_card_history DROP CONSTRAINT IF EXISTS group_address_card_history_action_chk;
ALTER TABLE group_address_card_history ADD  CONSTRAINT group_address_card_history_action_chk
  CHECK (action IN ('dung_nhap', 'nhan', 'sua', 'bac', 'nghi', 'thuc_lai'));

COMMENT ON COLUMN group_address_cards.retired_at IS
  'TG1: lúc thẻ rời tập sống vì nhóm không còn trong tập nháp (NULL = thẻ sống); chỉ thẻ nhap mới nghỉ được';
COMMENT ON COLUMN group_address_cards.retired_reason IS
  'TG1: vì sao thẻ nghỉ — hiện chỉ có nhom-khong-con-bai (lệnh dựng nháp không còn thấy nhóm)';
