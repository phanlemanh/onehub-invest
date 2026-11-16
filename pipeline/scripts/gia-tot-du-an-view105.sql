-- gia-tot-du-an-view105.sql — BẢN CHÉP thân view offer_project của migration 105 (hàng DV7 du-an-cua-tin-len-dinh-vi,
-- nhánh feat/du-an-cua-tin-len-dinh-vi a15c1d9f). CG10 dựng view tạm từ tệp này trong test và lượt đo khi DB chưa có 105
-- (db/migrations/105_offer_project.sql thắng khi đã có trong cây). XOÁ tệp này khi DV7 gộp vào main.

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

