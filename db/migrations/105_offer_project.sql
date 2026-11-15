-- 105_offer_project.sql — DV7 du-an-cua-tin-len-dinh-vi: một nguồn «dự án của tin» cho mọi nguồn, đọc bởi ô Định vị của
-- pipeline/sql/600_data_flow.sql, bậc B2 (offer_located, data_level_units của 087), CG10 và /ops/deals.
-- docs/superpowers/specs/2026-11-15-du-an-cua-tin-len-dinh-vi-design.md · _acceptance/du-an-cua-tin-len-dinh-vi (Mạnh duyệt 15/11).
-- KHÔNG sync cloud: view và hai hàm chỉ ở máy thu (cùng chế độ 087, 100); không bảng mới, không ghi dữ liệu.
-- Áp lên DB máy thu đi cùng chữ ký Cổng Bằng chứng (AGENTS.md «Ai quyết gì»), theo _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/.
-- Idempotent: CREATE OR REPLACE; chạy lại không lỗi, lược đồ không đổi. Lùi: ap-may-thu/105-lui.sql.

-- ---- 1. Dự án của tin: mỗi tin có chứng cứ một dòng; tin không chứng cứ không có dòng ----
-- Luật (thiết kế §2.1): nút quy về dự án gốc (đi parent_id tới node_type 'project', mọi tầng); một dự án gốc → mot_du_an;
-- từ hai dự án gốc → xung_dot, project_node_id NULL (không chọn đa số); phát biểu đã rút không tính; không lọc offer_status.
CREATE OR REPLACE VIEW offer_project AS
WITH RECURSIVE goc AS (
  SELECT id AS node_id, id AS cur_id, node_type, parent_id, 0 AS sau FROM asset_nodes
  UNION ALL
  SELECT g.node_id, n.id, n.node_type, n.parent_id, g.sau + 1
    FROM goc g JOIN asset_nodes n ON n.id = g.parent_id
   WHERE g.node_type <> 'project' AND g.sau < 16
),
du_an_goc AS (SELECT node_id, cur_id AS root_id FROM goc WHERE node_type = 'project'),
bai AS (
  SELECT o.offer_id, o.source, p.post_id, d.root_id
    FROM sale_offers o
   CROSS JOIN LATERAL unnest(o.post_ids) AS p(post_id)
    LEFT JOIN field_assertions f
      ON f.subject_key = o.source || ':' || p.post_id AND f.field = 'project_node_id' AND f.retracted_at IS NULL
    LEFT JOIN du_an_goc d
      ON d.node_id = CASE WHEN f.value ~ '^[0-9]+$' THEN f.value::bigint END
   WHERE o.source IN ('S03', 'S05')
),
theo_bai AS (
  SELECT offer_id, source, 'bai'::text AS evidence,
         count(DISTINCT post_id) AS n_posts,
         count(DISTINCT post_id) FILTER (WHERE root_id IS NOT NULL) AS n_posts_with_project,
         count(DISTINCT root_id) AS n_roots, min(root_id) AS root_id
    FROM bai GROUP BY offer_id, source
),
theo_ma AS (
  SELECT s.offer_id, 'S06'::text AS source, 'ma_nguon'::text AS evidence, 0::bigint AS n_posts,
         0::bigint AS n_posts_with_project, count(DISTINCT d.root_id) AS n_roots, min(d.root_id) AS root_id
    FROM s06_offer_project s JOIN du_an_goc d ON d.node_id = s.node_id
   GROUP BY s.offer_id
),
gop AS (
  SELECT * FROM theo_bai WHERE n_roots >= 1
  UNION ALL
  SELECT * FROM theo_ma
)
SELECT x.offer_id,
       x.source,
       CASE WHEN x.n_roots = 1 THEN x.root_id END                       AS project_node_id,
       CASE WHEN x.n_roots = 1 THEN 'mot_du_an' ELSE 'xung_dot' END     AS status,
       x.evidence,
       n.catalog_tier,
       x.n_posts::int                                                   AS n_posts,
       x.n_posts_with_project::int                                      AS n_posts_with_project
  FROM gop x
  LEFT JOIN asset_nodes n ON n.id = CASE WHEN x.n_roots = 1 THEN x.root_id END;

-- ---- 2. Vị từ định vị một tin (giữ chữ ký 087) — cho người gọi từng tin ----
CREATE OR REPLACE FUNCTION offer_located(p_offer_id text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM offer_project WHERE offer_id = p_offer_id AND status = 'mot_du_an')
$$;

-- ---- 3. Đơn vị bậc (giữ chữ ký 087): định vị theo TẬP — nối view một lần, không gọi offer_located từng tin ----
-- (nền SELECT false được inline thành hằng: 66 ms cho 110.778 đơn vị; gọi từng tin qua view chạy quá 130 giây, mỗi lượt
-- cloud-sync 15 phút — phản biện 15/11).
CREATE OR REPLACE FUNCTION data_level_units()
RETURNS TABLE (unit_key text, unit text, data_level text, ke_thieu text, source text, area_id text, property_type text,
               offer_ids text[]) LANGUAGE sql STABLE AS $$
  WITH dv AS (SELECT offer_id FROM offer_project WHERE status = 'mot_du_an')
  SELECT 'tin:' || o.offer_id, 'tin_le', l.data_level, l.ke_thieu, o.source, o.area_id, o.property_type,
         ARRAY[o.offer_id]
    FROM sale_offers o
    LEFT JOIN dv ON dv.offer_id = o.offer_id
   CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id,
                                       dv.offer_id IS NOT NULL) l
   WHERE o.source IN ('S03', 'S05', 'S06')
     AND (NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id)
          OR NOT EXISTS (SELECT 1 FROM units un WHERE un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active'))
  UNION ALL
  SELECT 'can:' || u.unit_key, 'can', u.data_level, u.ke_thieu, u.source, u.area_id, u.property_type, u.offer_ids
    FROM unit_data_level() u
$$;
