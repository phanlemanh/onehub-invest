-- 050_wanted_thanh_inquiry.sql — giá trị `wanted` của trục «Ý định tin» (`listing_intent`) đổi thành `inquiry` «Yêu cầu».
-- Nguồn: Mạnh 27/10 (ROADMAP §3 #21, hướng B: listing là bên bán, yêu cầu là bên mua) · design doc
-- docs/superpowers/specs/2026-10-27-wanted-thanh-inquiry-design.md · hồ sơ _acceptance/wanted-thanh-inquiry (Mạnh duyệt 27/10).
-- Số 050 do phiên liên làn cấp (sổ SO-MIGRATION). Sổ = khối `enums.listing_intent` của pipeline/mappings.yaml.
--
-- Chỉ đổi 1 dòng ref_lookup (seed của 043): trục chưa có cột (PL5 tạo), nên không đụng ref_field_lookup, CHECK, stg_*
-- hay dữ liệu tin. Chạy hai lần không đổi gì (WHERE theo giá trị cũ). Áp lại 043 sau 050 (043 có ON CONFLICT) chèn lại dòng
-- `wanted`; câu DELETE đầu gỡ dòng ấy khi `inquiry` đã có, để UPDATE không đụng khoá trùng. Cloud: docs/ops/cloud-schema-catchup-2026-10-27-050.sql,
-- áp sau gộp khi Mạnh duyệt. Áp lên DB local :5433 dùng chung CHỈ sau khi gộp (luật đợt 27/10).

DELETE FROM ref_lookup WHERE lookup_name = 'listing_intent' AND lookup_value = 'wanted'
  AND EXISTS (SELECT 1 FROM ref_lookup WHERE lookup_name = 'listing_intent' AND lookup_value = 'inquiry');
UPDATE ref_lookup SET lookup_value = 'inquiry', label_vi = 'Yêu cầu' WHERE lookup_name = 'listing_intent' AND lookup_value = 'wanted';
