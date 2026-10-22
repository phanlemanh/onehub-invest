-- 031_property_master.sql — M-1: Property Master Record
-- docs/research/property-master-record.md (user nguyên lý 22/10)
--
-- THAY ĐỔI CĂN BẢN: properties từ ephemeral (TRUNCATE nightly) →
-- PERSISTENT master record. KHÔNG BAO GIỜ TRUNCATE sau migration này.
-- resolve-properties.mjs phải đổi từ rebuild → match existing + create new.

-- 1. Cột verification (3 trạng thái)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS verification text NOT NULL DEFAULT 'pending'
    CHECK (verification IN ('pending', 'verified', 'enriched')),
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 2. Cột enrich theo thời gian
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS bedrooms int,
  ADD COLUMN IF NOT EXISTS bathrooms int,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS current_price_vnd bigint,
  ADD COLUMN IF NOT EXISTS price_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seller_phone_hash text,
  ADD COLUMN IF NOT EXISTS seller_name text,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS n_sources int NOT NULL DEFAULT 1;

-- 3. Stable ID — thêm cột stable_key để match qua đêm
-- (id bigserial vẫn là PK nhưng stable_key là identity vĩnh viễn)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS stable_key text UNIQUE;

-- 4. Backfill stable_key cho 8.270 properties hiện tại (cluster_key làm stable)
UPDATE properties SET stable_key = cluster_key WHERE stable_key IS NULL;

-- 5. Backfill fields từ offers evidence (lần đầu)
UPDATE properties p SET
  bedrooms = sub.bedrooms,
  street = sub.street,
  current_price_vnd = sub.price_vnd,
  seller_phone_hash = sub.seller_phone_hash,
  seller_name = sub.seller_name,
  n_sources = sub.n_sources,
  confidence = LEAST(0.5 + sub.n_sources * 0.15, 1.0)
FROM (
  SELECT pr.id,
    (array_agg(o.bedrooms ORDER BY o.last_seen DESC))[1] AS bedrooms,
    (array_agg(o.street_raw ORDER BY o.last_seen DESC))[1] AS street,
    (array_agg(o.price_vnd ORDER BY o.last_seen DESC))[1] AS price_vnd,
    (array_agg(o.seller_phone_hash ORDER BY o.last_seen DESC))[1] AS seller_phone_hash,
    (array_agg(o.seller_name ORDER BY o.last_seen DESC))[1] AS seller_name,
    COUNT(DISTINCT o.source)::int AS n_sources
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
  GROUP BY pr.id
) sub
WHERE properties.id = sub.id;

-- 6. Price history từ evidence
UPDATE properties p SET price_history = sub.hist
FROM (
  SELECT pr.id,
    jsonb_agg(jsonb_build_object(
      'price', o.price_vnd,
      'source', o.source,
      'date', o.last_seen::text,
      'offer_id', o.offer_id
    ) ORDER BY o.last_seen) AS hist
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
  WHERE o.price_vnd > 0
  GROUP BY pr.id
) sub
WHERE properties.id = sub.id;

-- 7. Index cho match engine
CREATE INDEX IF NOT EXISTS properties_stable_key_idx ON properties(stable_key);
CREATE INDEX IF NOT EXISTS properties_geo_idx ON properties USING gist (geo);
CREATE INDEX IF NOT EXISTS properties_verification_idx ON properties(verification);

-- 8. Log vào enrichment_log
UPDATE properties SET enrichment_log = jsonb_build_array(jsonb_build_object(
  'at', now()::text,
  'action', 'm1_backfill',
  'detail', 'Backfill từ offers evidence — property master record migration'
));
