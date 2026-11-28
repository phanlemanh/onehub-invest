-- lui-131.sql — PL36: đường lùi của 131 trên DB máy thu (hồ sơ áp mục 4). Chạy một lần, trong một giao dịch.
-- 1) Rút mọi dòng sống của bốn rule_id ghep-can-* (rào chỉ-thêm 045 cấm xoá; rút = retracted_at + lý do).
-- 2) Bỏ view offer_unit: bước gắn cuối lượt nạp thấy thiếu view thì chỉ in «JOB WARN [ghep-can] chưa áp migration 131», không ghi.
-- 3) Dựng lại thân offer_building của 117 (đầu ra như nhau, chỉ chậm hơn) — chép nguyên văn khối 4 của 117.
-- Phần dư có chủ đích: CHECK field_assertions_field_chk, thân trigger 082 và dòng ref_lookup của 131 GIỮ NGUYÊN (rộng hơn 117 một
-- mã). KHÔNG áp lại tệp 117: CHECK của 117 thiếu universal_property_sub_id, các dòng đã rút vẫn nằm trong bảng nên sẽ bị từ chối.
BEGIN;
UPDATE field_assertions
   SET retracted_at = clock_timestamp(), retract_reason = 'lui-pl36'
 WHERE retracted_at IS NULL
   AND rule_id IN ('ghep-can-truc', 'ghep-can-ma', 'ghep-can-truc-tang', 'ghep-can-tang-tu-ma');
DROP VIEW IF EXISTS offer_unit;
CREATE OR REPLACE VIEW offer_building AS
WITH RECURSIVE to_tien AS (
  SELECT id AS node_id, id AS cur_id, parent_id, 0 AS sau FROM asset_nodes
  UNION ALL
  SELECT t.node_id, n.id, n.parent_id, t.sau + 1
    FROM to_tien t JOIN asset_nodes n ON n.id = t.parent_id
   WHERE t.sau < 16
),
chuoi AS (SELECT node_id, array_agg(cur_id) AS ds FROM to_tien GROUP BY node_id),
phat_bieu AS (
  SELECT o.offer_id, p.post_id, f.field, f.value
    FROM sale_offers o
   CROSS JOIN LATERAL unnest(o.post_ids) AS p(post_id)
    JOIN field_assertions f ON f.subject_key = 'S03:' || p.post_id
     AND f.field IN ('universal_property_id', 'subzone_node_id')
     AND f.retracted_at IS NULL
     AND f.rule_id IN ('ghep-toa-cot', 'ghep-toa-cot-chuan', 'ghep-toa-chu-model', 'ghep-toa-model')
    LEFT JOIN buildings b ON f.field = 'universal_property_id' AND b.upi = f.value
   WHERE o.source = 'S03' AND (f.field <> 'universal_property_id' OR b.status = 'active')
),
gom AS (
  SELECT offer_id, count(DISTINCT post_id)::integer AS n_posts,
         array_agg(DISTINCT value) FILTER (WHERE field = 'universal_property_id') AS upis,
         array_agg(DISTINCT value::bigint) FILTER (WHERE field = 'subzone_node_id') AS vungs
    FROM phat_bieu GROUP BY offer_id
),
vung_sau AS (
  SELECT DISTINCT ON (g.offer_id) g.offer_id, c.node_id
    FROM gom g
   CROSS JOIN LATERAL unnest(g.vungs) AS u(id)
    JOIN chuoi c ON c.node_id = u.id
   WHERE g.vungs <@ c.ds
   ORDER BY g.offer_id, cardinality(c.ds) DESC, c.node_id
),
xet AS (
  SELECT g.offer_id, g.n_posts, g.upis, g.vungs, b.building_key, b.upi, s.node_id AS vung,
         COALESCE(cardinality(g.upis) = 1 AND (g.vungs IS NULL OR COALESCE(g.vungs <@ c.ds, false)), false) AS toa_hop_le
    FROM gom g
    LEFT JOIN buildings b ON cardinality(g.upis) = 1 AND b.upi = g.upis[1]
    LEFT JOIN v_toa_nut_vung v ON v.building_key = b.building_key
    LEFT JOIN chuoi c ON c.node_id = v.region_node_id
    LEFT JOIN vung_sau s ON s.offer_id = g.offer_id
)
SELECT offer_id,
       CASE WHEN toa_hop_le OR (upis IS NULL AND vung IS NOT NULL) THEN 'gan' ELSE 'xung_dot' END AS status,
       CASE WHEN toa_hop_le THEN 'toa' WHEN upis IS NULL AND vung IS NOT NULL THEN 'vung' END AS muc,
       CASE WHEN toa_hop_le THEN building_key END AS building_key,
       CASE WHEN toa_hop_le THEN upi END AS upi,
       CASE WHEN NOT toa_hop_le AND upis IS NULL THEN vung END AS subzone_node_id,
       n_posts
  FROM xet;
COMMIT;
