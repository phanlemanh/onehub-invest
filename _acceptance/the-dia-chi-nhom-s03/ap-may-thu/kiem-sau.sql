-- kiem-sau.sql — TG1 bước 5/5: kiểm DB máy thu sau khi áp 108 và dựng nháp. Chỉ đọc.
\pset footer off
SELECT to_regclass('group_address_cards') IS NOT NULL AS co_bang_the,
       to_regclass('group_address_card_history') IS NOT NULL AS co_bang_lich_su;
-- «nhóm có bài» gạt bài thử đúng như lệnh dựng nháp (bốn dấu của pipeline/lib/test-posts.mjs viết bằng SQL, GN5);
-- không gạt thì số này cộng cả nhóm toàn bài thử và không so được với số thẻ.
SELECT (SELECT count(*) FROM group_address_cards) AS so_the,
       (SELECT count(DISTINCT regexp_replace(t.conversation_id, '^([^:]+:)?group:(?=.)', ''))
          FROM stg_zalo_posts t
         WHERE t.conversation_id IS NOT NULL
           AND NOT (split_part(t.snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(t.snapshot_id, '__', 2) = 'example'
                    OR coalesce(t.agent_id, '') ~* '^(e2e|test|mock)'
                    OR btrim(coalesce(t.group_name, '')) ~* '^test([^[:alpha:]]|$)'
                    OR normalize(coalesce(t.text, ''), NFC) ~* 'trycloudflare\.com|\[tên sàn\]')) AS nhom_co_bai;
SELECT status, count(*) AS so_the FROM group_address_cards GROUP BY status ORDER BY status;
SELECT count(*) AS the_thieu_lich_su FROM group_address_cards t
 WHERE NOT EXISTS (SELECT 1 FROM group_address_card_history h WHERE h.card_code = t.card_code AND h.action = 'dung_nhap');
SELECT count(*) FILTER (WHERE cardinality(project_node_ids) > 0) AS co_du_an,
       count(*) FILTER (WHERE area_id IS NOT NULL) AS co_phuong,
       count(*) FILTER (WHERE subzone_node_id IS NOT NULL) AS co_phan_khu,
       count(*) FILTER (WHERE purpose IS NOT NULL) AS co_ban_thue
  FROM group_address_cards;
