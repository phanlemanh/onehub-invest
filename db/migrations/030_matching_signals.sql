-- 030_matching_signals.sql — 6 tín hiệu matching (user chỉ định 22/10)
-- docs/research/entity-matching-signals.md
-- Thêm cột tín hiệu vào sale_offers + backfill từ stg_chotot_ads.

ALTER TABLE sale_offers
  ADD COLUMN IF NOT EXISTS street_raw text,
  ADD COLUMN IF NOT EXISTS block_raw text,
  ADD COLUMN IF NOT EXISTS floor_raw text,
  ADD COLUMN IF NOT EXISTS bathrooms int;

-- Backfill S06: street/block/floor từ stg payload, toilets từ stg cột
UPDATE sale_offers o SET
  street_raw = s.payload->>'street_name',
  block_raw = NULLIF(s.payload->>'block', ''),
  floor_raw = s.payload->>'floornumber',
  bathrooms = s.toilets
FROM stg_chotot_ads s
WHERE o.source = 'S06'
  AND o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
  AND (s.payload->>'street_name' IS NOT NULL OR s.toilets IS NOT NULL);

-- Index cho matching theo street + phường
CREATE INDEX IF NOT EXISTS sale_offers_street_idx
  ON sale_offers(street_raw, area_id) WHERE street_raw IS NOT NULL;
