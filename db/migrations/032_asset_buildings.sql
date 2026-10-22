-- 032_asset_buildings.sql — M-3 E4: từ điển tòa nhà + alias viết tắt dự án
-- cho E1 context-resolver (matcher asset_nodes).
--
-- Đồng thời SỬA LỖI 026: parent_id khai bigserial → có DEFAULT nextval,
-- node insert không parent tự trỏ vào CHÍNH NÓ (self-loop). Đổi thành
-- bigint thuần (drop default) + xoá self-loop + gắn parent đúng.
--
-- NGUYÊN TẮC SEED (chống alias sai tự-match không qua LLM):
--   CHỈ seed cái xác minh được — ví dụ gốc của user 22/10: "2pn LBV MCP"
--   trong group Vinhomes Grand Park → LBV = Lumiere Boulevard.
--   Mã KHÔNG chắc (LD1/LD2, MCP, SAV…) KHÔNG seed — để E2 LLM decode
--   + E5 feedback loop ghi vào bảng này sau khi xác minh.
--
-- Danh pháp ADR-0011 Qđ 2: building = ComplexName. File idempotent.

-- ── 1. Sửa parent_id: bỏ default bigserial, cho phép NULL (tầng gốc),
--        xoá self-loop ──
ALTER TABLE asset_nodes ALTER COLUMN parent_id DROP DEFAULT;
ALTER TABLE asset_nodes ALTER COLUMN parent_id DROP NOT NULL;
DROP SEQUENCE IF EXISTS asset_nodes_parent_id_seq;
UPDATE asset_nodes SET parent_id = NULL WHERE parent_id = id;

-- ── 2. Buildings xác minh được (ví dụ gốc user 22/10) ──
INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta) VALUES
  ('building','Lumiere Boulevard','gpk-lumiere-boulevard',
   ARRAY['lbv','lumiere boulevard']::text[],
   '{}','ComplexName','{"parent_slug":"vinhomes-grand-park"}'),
  ('building','Lumiere Riverside','gpk-lumiere-riverside',
   ARRAY['lumiere riverside']::text[],
   '{}','ComplexName','{"parent_slug":"vinhomes-grand-park"}'),
  ('building','The Beverly','gpk-the-beverly',
   ARRAY['the beverly','beverly']::text[],
   '{}','ComplexName','{"parent_slug":"vinhomes-grand-park"}')
ON CONFLICT (slug) DO NOTHING;

-- Gắn parent qua meta.parent_slug (không hardcode id; chỉ update khi sai)
UPDATE asset_nodes b SET parent_id = p.id
FROM asset_nodes p
WHERE b.node_type = 'building'
  AND p.slug = (b.meta->>'parent_slug')
  AND b.parent_id IS DISTINCT FROM p.id;

-- ── 3. Alias viết tắt dự án — xác minh từ TÊN GROUP dữ liệu thật (22/10):
--   "CHUYỂN NHƯỢNG OCP1-F1 CĐT BÁN MỚI" (85 posts) → Ocean Park 1
-- Guard NOT (... = ANY) để chạy lại không đúp alias.
UPDATE asset_nodes SET aliases = aliases || ARRAY['ocp1']::text[]
 WHERE slug = 'vinhomes-ocean-park-1' AND NOT ('ocp1' = ANY(aliases));
UPDATE asset_nodes SET aliases = aliases || ARRAY['ocp2']::text[]
 WHERE slug = 'vinhomes-ocean-park-2' AND NOT ('ocp2' = ANY(aliases));
UPDATE asset_nodes SET aliases = aliases || ARRAY['ocp3']::text[]
 WHERE slug = 'vinhomes-ocean-park-3' AND NOT ('ocp3' = ANY(aliases));
UPDATE asset_nodes SET aliases = aliases || ARRAY['vcp']::text[]
 WHERE slug = 'vinhomes-central-park' AND NOT ('vcp' = ANY(aliases));
UPDATE asset_nodes SET aliases = aliases || ARRAY['vgr']::text[]
 WHERE slug = 'vinhomes-golden-river' AND NOT ('vgr' = ANY(aliases));
