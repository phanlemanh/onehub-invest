-- lui.sql — TG2 dong-dau-dia-chi-luc-nap: trả dữ liệu về trước TG2. Chạy SAU khi đã revert mã (không thì lượt nạp kế đóng dấu lại).
-- Một giao dịch (psql -1). field_assertions là sổ CHỈ THÊM: trigger field_assertions_guard cấm đổi một dòng đã rút, nên lùi
-- không «trả sống» dòng DV6 cũ mà GHI LẠI chúng thành dòng mới (cùng chủ thể, trường, giá trị, luật, căn cứ), như lượt DV6 ghi.
-- Thứ tự: rút dòng TG2 trước, rồi ghi lại dòng DV6 — làm ngược thì có lúc một bài mang hai dự án sống.

UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'lui-tg2'
 WHERE rule_id = 'dia-chi-the-nhom' AND retracted_at IS NULL;

-- Mỗi (chủ thể, trường, giá trị, phương pháp, luật) mà TG2 đã rút: lấy bản rút gần nhất, ghi lại nếu chưa có dòng sống y hệt.
INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at, changed_by, run_id)
SELECT r.subject_key, r.field, r.value, r.evidence_tier, r.method, r.method_version, r.rule_id, r.evidence, r.observed_at, 'lui-tg2', r.run_id
  FROM (SELECT DISTINCT ON (subject_key, field, value_key, method, rule_id) *
          FROM field_assertions
         WHERE retract_reason = 'thay-bang-the-nhom' AND rule_id IN ('du-an-nhom-mot-du-an', 'du-an-ten-bai')
         ORDER BY subject_key, field, value_key, method, rule_id, id DESC) r
 WHERE NOT EXISTS (SELECT 1 FROM field_assertions s
                    WHERE s.retracted_at IS NULL AND s.subject_key = r.subject_key AND s.field = r.field
                      AND s.value_key = r.value_key AND s.method = r.method AND s.rule_id = r.rule_id)
ON CONFLICT DO NOTHING;

SELECT 'tg2_con_song' AS kiem, count(*) FROM field_assertions WHERE rule_id = 'dia-chi-the-nhom' AND retracted_at IS NULL
UNION ALL
SELECT 'dv6_song', count(*) FROM field_assertions WHERE rule_id IN ('du-an-nhom-mot-du-an', 'du-an-ten-bai') AND retracted_at IS NULL;
