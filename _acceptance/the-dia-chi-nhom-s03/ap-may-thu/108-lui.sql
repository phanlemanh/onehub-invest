-- 108-lui.sql — TG1: lùi migration 108_the_dia_chi_nhom.sql trên DB máy thu. Chạy bằng psql -1 (một giao dịch).
-- Bỏ đúng các đối tượng 108 tạo, theo thứ tự ngược; không dùng tuỳ chọn xoá dây chuyền: đối tượng của hàng khác dựa trên
-- bảng thẻ thì cả khối lỗi và không đổi gì. Sao lưu dữ liệu thẻ (sao-luu.sh) TRƯỚC khi chạy — thẻ đã duyệt mất theo bảng.
DROP TRIGGER IF EXISTS group_address_cards_kiem_trg ON group_address_cards;
DROP TABLE IF EXISTS group_address_card_history;
DROP TABLE IF EXISTS group_address_cards;
DROP FUNCTION IF EXISTS group_address_cards_kiem();
DROP SEQUENCE IF EXISTS group_address_card_seq;
