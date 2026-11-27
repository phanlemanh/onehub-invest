-- lui-117.sql — PL20: đường lùi của 117 trên DB máy thu (hồ sơ áp phần 4). Chạy một lần, trong một giao dịch.
-- 1) Rút mọi dòng sống của bốn rule_id ghep-toa-* (rào chỉ-thêm 045 cấm xoá; rút = retracted_at + lý do).
-- 2) Bỏ view offer_building: bước gắn cuối lượt nạp S03 thấy thiếu view thì chỉ in «JOB WARN [ghep-toa] chưa áp migration 117»
--    và không ghi gì nữa.
-- Phần dư có chủ đích: CHECK field_assertions_field_chk và thân trigger 082 của 117 GIỮ NGUYÊN (tập trường rộng hơn 113 một mã).
-- Không áp lại khối 2, 3 của 113: các dòng universal_property_id đã rút vẫn nằm trong bảng nên CHECK của 113 sẽ bị từ chối.
BEGIN;
UPDATE field_assertions
   SET retracted_at = clock_timestamp(), retract_reason = 'lui-pl20'
 WHERE retracted_at IS NULL
   AND rule_id IN ('ghep-toa-cot', 'ghep-toa-cot-chuan', 'ghep-toa-chu-model', 'ghep-toa-model');
DROP VIEW IF EXISTS offer_building;
COMMIT;
