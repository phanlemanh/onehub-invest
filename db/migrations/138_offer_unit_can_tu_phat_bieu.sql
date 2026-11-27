-- 138_offer_unit_can_tu_phat_bieu.sql — PL36 ghep-tin-vao-truc-can: offer_unit đọc căn đã gắn từ chính phát biểu, không tra lại.
-- Sửa finding S4 vòng 3 (AC-5, review-findings.md): luật gắn ra căn qua bí danh mã căn S16/S08 (căn không có stack_key, floor
-- trong danh bạ), bước ghi chỉ lưu «trục:tầng» nên view 131 tra lại theo stack_key + floor không thấy căn và hạ tin về mức trục.
-- Từ nay dòng mức căn mang unit_key của luật ở evidence->>'unit' (pipeline/lib/ghep-tin-truc-can-ghi.mjs). View lấy căn ấy khi
-- mọi bài của tin chỉ nêu một căn; dòng chưa có unit (ghi trước 138) thì tra như 131, nhưng so tầng đã bỏ số 0 đầu (CHECK của 082
-- cho floor «09»; giá trị phát biểu luôn ở dạng chuẩn).
-- KHÔNG sync cloud: view chỉ ở máy thu. Số 138 do giám sát cấp; áp sau 131. Chạy lại an toàn.
--
-- Lùi 138: áp lại khối 5 (CREATE OR REPLACE VIEW offer_unit) của 131_ghep_truc_can_tren_tin.sql. Lùi cả 131: lui/lui-131.sql.

DO $$
BEGIN
  IF to_regclass('public.offer_unit') IS NULL THEN
    RAISE EXCEPTION '138: cần áp 131 trước';
  END IF;
END $$;

CREATE OR REPLACE VIEW offer_unit AS
WITH toa AS MATERIALIZED (
  SELECT offer_id, building_key FROM offer_building WHERE status = 'gan' AND muc = 'toa'
),
pb AS (
  SELECT t.offer_id, t.building_key, s.building_key AS toa_cua_truc, s.stack_key,
         NULLIF(split_part(f.value, ':', 2), '*') AS tang,
         CASE WHEN split_part(f.value, ':', 2) <> '*' THEN f.evidence ->> 'unit' END AS can_pb
    FROM toa t
    JOIN sale_offers o USING (offer_id)
   CROSS JOIN LATERAL unnest(o.post_ids) AS p(post_id)
    JOIN field_assertions f ON f.subject_key = 'S03:' || p.post_id
     AND f.field = 'universal_property_sub_id'
     AND f.retracted_at IS NULL
     AND f.rule_id IN ('ghep-can-truc', 'ghep-can-ma', 'ghep-can-truc-tang')
    JOIN stacks s ON s.stack_key = split_part(f.value, ':', 1) AND s.status = 'active'
),
gom AS (
  SELECT offer_id, array_agg(DISTINCT stack_key) AS truc,
         bool_and(toa_cua_truc = building_key) AS cung_toa,
         array_agg(DISTINCT tang) FILTER (WHERE tang IS NOT NULL) AS tang,
         array_agg(DISTINCT can_pb) FILTER (WHERE can_pb IS NOT NULL) AS can_pb
    FROM pb GROUP BY offer_id
),
xet AS (
  SELECT t.offer_id, t.building_key, g.truc, g.cung_toa, g.tang,
         CASE WHEN g.offer_id IS NOT NULL AND g.cung_toa AND cardinality(g.truc) = 1 AND cardinality(g.tang) = 1 THEN
           CASE WHEN cardinality(g.can_pb) > 1 THEN NULL
                WHEN cardinality(g.can_pb) = 1 THEN (
                  SELECT u.unit_key FROM units u WHERE u.unit_key = g.can_pb[1] AND u.status = 'active')
                ELSE (
                  SELECT min(u.unit_key) FROM units u
                   WHERE u.stack_key = g.truc[1] AND regexp_replace(u.floor, '^0+(?=[0-9])', '') = g.tang[1] AND u.status = 'active'
                  HAVING count(*) = 1) END END AS can
    FROM toa t LEFT JOIN gom g USING (offer_id)
)
SELECT offer_id,
       CASE WHEN truc IS NOT NULL AND (NOT cung_toa OR cardinality(truc) > 1) THEN 'xung_dot' ELSE 'gan' END AS status,
       CASE WHEN truc IS NULL OR NOT cung_toa OR cardinality(truc) > 1 THEN 'toa'
            WHEN can IS NOT NULL THEN 'can' ELSE 'truc' END AS muc,
       building_key,
       CASE WHEN truc IS NOT NULL AND cung_toa AND cardinality(truc) = 1 THEN truc[1] END AS stack_key,
       CASE WHEN can IS NOT NULL THEN tang[1] END AS floor,
       can AS unit_key
  FROM xet;
