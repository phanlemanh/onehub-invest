-- lui.sql — TG2 dong-dau-dia-chi-luc-nap: trả dữ liệu về trước TG2. Chạy SAU khi đã revert mã (không thì lượt nạp kế đóng dấu lại).
-- Khuôn S4-r3 (GS P4-199 «đổi khuôn»): lùi KHÔNG hồi sinh dòng DV6 đã rút. Bản rút có thể mang giá trị DV6 đã bỏ (sổ nhóm, nhãn
-- đổi giữa chừng) — hồi sinh mọi bản rút làm bài mang hai dự án sống (lỗi S4-r2). Lùi hai bước:
--   1. tệp này: rút mọi dòng sống của luật TG2 (lý do lui-tg2), một giao dịch (psql -1);
--   2. ngay sau đó: `node pipeline/scripts/du-an-tren-tin-s03.mjs --ghi` — DV6 tự tính lại ý định của nó trên dữ liệu hiện tại và
--      ghi đúng dòng nó muốn (lệnh có sẵn, đúng lời thường trực «ghi dự án lên tin S03 sau mỗi lượt nạp»).
-- Giữa bước 1 và 2 các bài từng được thẻ đóng dấu tạm không có dự án — chạy hai bước liền nhau.

UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'lui-tg2'
 WHERE rule_id = 'dia-chi-the-nhom' AND retracted_at IS NULL;

SELECT 'tg2_con_song' AS kiem, count(*) FROM field_assertions WHERE rule_id = 'dia-chi-the-nhom' AND retracted_at IS NULL
UNION ALL
SELECT 'dv6_song_truoc_buoc_2', count(*) FROM field_assertions WHERE rule_id IN ('du-an-nhom-mot-du-an', 'du-an-ten-bai') AND retracted_at IS NULL;
