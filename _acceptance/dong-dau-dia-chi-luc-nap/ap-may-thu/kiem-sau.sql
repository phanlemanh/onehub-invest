-- kiem-sau.sql — TG2 dong-dau-dia-chi-luc-nap: kiểm sau mỗi lượt nạp. Chỉ đọc.
\echo '== thẻ =='
SELECT status, count(*) FILTER (WHERE retired_at IS NULL) AS song, count(*) AS tong FROM group_address_cards GROUP BY 1 ORDER BY 1;

\echo '== dòng sống của luật dia-chi-the-nhom, theo trường và nguồn ô =='
SELECT field, evidence ->> 'nguon_o' AS nguon_o, count(*) FROM field_assertions
 WHERE rule_id = 'dia-chi-the-nhom' AND retracted_at IS NULL GROUP BY 1, 2 ORDER BY 1, 2;

\echo '== dòng đã rút theo lý do (TG2 và DV6) =='
SELECT rule_id, retract_reason, count(*) FROM field_assertions
 WHERE retract_reason IN ('the-doi-ban', 'thay-boi-luot', 'thay-bang-the-nhom', 'lui-tg2')
   AND rule_id IN ('dia-chi-the-nhom', 'du-an-nhom-mot-du-an', 'du-an-ten-bai')
 GROUP BY 1, 2 ORDER BY 1, 2;

\echo '== thẻ đã duyệt có dự án KHÁC sổ nhóm (khác 0 mà DV6 --ghi còn chạy là xung đột, xem README lối B) =='
SELECT count(*) AS the_khac_so FROM group_address_cards c
  JOIN collection_units u ON regexp_replace(u.group_key, '^([^:]+:)?group:(?=.)', '') = c.group_key
 WHERE c.status = 'da_duyet' AND c.retired_at IS NULL AND u.source_code = 'S03'
   AND cardinality(u.project_node_ids) = 1 AND cardinality(c.project_node_ids) = 1
   AND u.project_node_ids[1] <> c.project_node_ids[1];

\echo '== ô Định vị S03 (cửa sổ all) và tin xung đột =='
SELECT (SELECT count(*) FROM offer_project WHERE source = 'S03' AND status = 'mot_du_an') AS mot_du_an,
       (SELECT count(*) FROM sale_offers WHERE source = 'S03') AS tin,
       round(100.0 * (SELECT count(*) FROM offer_project WHERE source = 'S03' AND status = 'mot_du_an')
             / NULLIF((SELECT count(*) FROM sale_offers WHERE source = 'S03'), 0), 2) AS phan_tram,
       (SELECT count(*) FROM offer_project WHERE source = 'S03' AND status = 'xung_dot') AS xung_dot;
