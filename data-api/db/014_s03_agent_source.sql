-- 014_s03_agent_source.sql — C2: đăng ký source_id 's03-agent' vào S03
-- (Agent ingest bridge — ADR-0006 sửa đổi). Coverage API + SLO nhận diện được.
UPDATE source_registry
SET source_ids = array_append(source_ids, 's03-agent')
WHERE code = 'S03' AND NOT ('s03-agent' = ANY (source_ids));
