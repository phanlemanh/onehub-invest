-- 021_facebook_source.sql — Thêm nguồn S05: Facebook Groups (qua Apify)
INSERT INTO source_registry (code, real_name, label_vi, status, since, source_ids)
VALUES ('S05', 'Facebook Groups', 'Mạng xã hội', 'active', '2026-10-21', '{"apify-facebook"}')
ON CONFLICT (code) DO NOTHING;
