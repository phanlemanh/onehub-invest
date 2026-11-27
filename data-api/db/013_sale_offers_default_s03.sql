-- 013_sale_offers_default_s03.sql — review fixes C1:
-- (1) sửa DEFAULT cột sale_offers.source còn sót 'mock' (migration 008) sang
--     mã SPL S03 — INSERT thiếu source không rò tên thật tầng A vào serving.
-- (2) source_registry thêm source_ids (id collector trong raw zone → mã B)
--     để tầng app/script JOIN registry thay vì hardcode literal tên nguồn
--     (ADR-0007: mapping sống ở registry, không nằm trong code serving).
ALTER TABLE sale_offers ALTER COLUMN source SET DEFAULT 'S03';

ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS source_ids text[] NOT NULL DEFAULT '{}';
UPDATE source_registry SET source_ids = '{s01-discovery,s01-listing}'          WHERE code = 'S01';
UPDATE source_registry SET source_ids = '{s02-research}'                           WHERE code = 'S02';
UPDATE source_registry SET source_ids = '{s03-mock,s03-groups}'                     WHERE code = 'S03';
UPDATE source_registry SET source_ids = '{s04-boundaries}'                            WHERE code = 'S04';
