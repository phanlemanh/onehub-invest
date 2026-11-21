-- lui.sql — DA45: lùi lượt ghi của luật phuong-tu-du-an trên DB máy thu. Một giao dịch.
-- Rút mọi phát biểu sống của luật (chuỗi nạp gọi --noi-tiep sẽ thôi ghi vì luật không còn dòng sống), rồi phân xử lại các tin đang
-- mang nhãn du-an để cột về giá trị gốc (hàm của 099/102 đọc field_provenance.area_id.goc).
BEGIN;
-- Khoá tư vấn chung với bước phường của chuỗi nạp: lượt nạp đang ghi thì lùi chờ nó xong; lượt nạp tới sau chờ lùi commit, rồi thấy
-- luật hết dòng sống và bỏ qua (S4-r2: không có khoá này, lượt nạp đã qua chốt --noi-tiep chèn lại đủ phát biểu ngay sau khi lùi).
SELECT pg_advisory_xact_lock(hashtext('phuong-tu-du-an'));
-- Tập phân xử lại: tin mang nhãn du-an, cộng mọi tin có phát biểu của luật (kể cả tin giữ nguyên cột — gợi ý goi_y của chúng
-- đang trỏ tới phát biểu sắp rút; đo 19/11: 13 tin, probe ap-lui).
CREATE TEMP TABLE pct_lui ON COMMIT DROP AS
  SELECT offer_id FROM sale_offer_records WHERE field_provenance -> 'area_id' ->> 'nguon' = 'du-an'
  UNION
  SELECT DISTINCT r.offer_id FROM sale_offer_records r
    JOIN field_assertions fa ON fa.subject_key = ANY (offer_subject_keys(r.source, r.originating_system_key, r.post_ids))
   WHERE fa.rule_id = 'phuong-tu-du-an' AND fa.retracted_at IS NULL;
UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'lui-da45'
 WHERE rule_id = 'phuong-tu-du-an' AND retracted_at IS NULL;
SELECT resolve_offer_fields(ARRAY(SELECT offer_id FROM pct_lui));
-- Lượt hai: lượt một gỡ nhãn du-an bằng cách bỏ cả khoá field_provenance.area_id (102), làm rơi gợi ý goi_y của thẻ nhóm ở tin cột
-- trống; phân xử lại một lần nữa dựng lại goi_y như một lượt phân xử thường (đo 19/11: 272 tin, probe ap-lui).
SELECT resolve_offer_fields(ARRAY(SELECT offer_id FROM pct_lui));
COMMIT;
