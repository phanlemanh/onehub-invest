-- 023_stg_agent_id.sql — Phân biệt nguồn trong stg_zalo_posts bằng agent_id.
--
-- stg_zalo_posts giờ nhận tin từ 2 đường agent-report: hook Zalo
-- (openclaw-hook) và Apify Facebook (apify-facebook). Lọc theo TÊN nhóm là
-- giòn (tên nhóm FB có emoji, đổi định kỳ); agent_id nằm trong payload là
-- thuộc tính ổn định của đường đẩy. Transform S03/S05 lọc theo cột này.
ALTER TABLE stg_zalo_posts ADD COLUMN IF NOT EXISTS agent_id text;
CREATE INDEX IF NOT EXISTS stg_zalo_posts_agent_idx ON stg_zalo_posts(agent_id);
