-- lui.sql — DA45: lùi lượt ghi của luật phuong-tu-du-an trên DB máy thu. Một giao dịch.
-- Rút mọi phát biểu sống của luật (chuỗi nạp gọi --noi-tiep sẽ thôi ghi vì luật không còn dòng sống), rồi phân xử lại các tin đang
-- mang nhãn du-an để cột về giá trị gốc (hàm của 099/102 đọc field_provenance.area_id.goc).
BEGIN;
CREATE TEMP TABLE pct_lui ON COMMIT DROP AS
  SELECT offer_id FROM sale_offer_records WHERE field_provenance -> 'area_id' ->> 'nguon' = 'du-an';
UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'lui-da45'
 WHERE rule_id = 'phuong-tu-du-an' AND retracted_at IS NULL;
SELECT resolve_offer_fields(ARRAY(SELECT offer_id FROM pct_lui));
COMMIT;
