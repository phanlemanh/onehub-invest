-- cloud-catchup-2026-10-22.sql — đưa schema Supabase bắt kịp migration 030–032 + 034.
-- Hướng dẫn chạy + thứ tự bắt buộc: docs/ops/cloud-schema-catchup-2026-10-22.md
--
-- CHỈ DDL. Không backfill: sync-cloud TRUNCATE rồi nạp lại toàn bộ bảng từ
-- local mỗi 15', nên các UPDATE backfill trong 030/031 vô nghĩa trên cloud
-- (030 còn đọc stg_chotot_ads — tầng A, không có trên cloud). Không seed 032
-- (asset_nodes cũng được sync nạp lại).
--
-- CỐ Ý KHÔNG tạo properties.seller_name (031): PII tầng A, sync-cloud loại
-- cột này — cột vắng ở cloud = sạch tuyệt đối.
--
-- Idempotent: chạy lại không lỗi, không đổi gì.

BEGIN;

-- ── 030: tín hiệu matching trên sale_offers ──
ALTER TABLE sale_offers
  ADD COLUMN IF NOT EXISTS street_raw text,
  ADD COLUMN IF NOT EXISTS block_raw text,
  ADD COLUMN IF NOT EXISTS floor_raw text,
  ADD COLUMN IF NOT EXISTS bathrooms int;
CREATE INDEX IF NOT EXISTS sale_offers_street_idx
  ON sale_offers(street_raw, area_id) WHERE street_raw IS NOT NULL;

-- ── 031: property master record (trừ seller_name) ──
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS verification text NOT NULL DEFAULT 'pending'
    CHECK (verification IN ('pending', 'verified', 'enriched')),
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS bedrooms int,
  ADD COLUMN IF NOT EXISTS bathrooms int,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS current_price_vnd bigint,
  ADD COLUMN IF NOT EXISTS price_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seller_phone_hash text,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS n_sources int NOT NULL DEFAULT 1;
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS stable_key text UNIQUE;
CREATE INDEX IF NOT EXISTS properties_stable_key_idx ON properties(stable_key);
CREATE INDEX IF NOT EXISTS properties_geo_idx ON properties USING gist (geo);
CREATE INDEX IF NOT EXISTS properties_verification_idx ON properties(verification);

-- ── 032: asset_nodes.parent_id bỏ default bigserial, cho phép NULL ──
ALTER TABLE asset_nodes ALTER COLUMN parent_id DROP DEFAULT;
ALTER TABLE asset_nodes ALTER COLUMN parent_id DROP NOT NULL;
DROP SEQUENCE IF EXISTS asset_nodes_parent_id_seq;

-- ── 034: ruler "một căn một phiếu" (nguyên văn db/migrations/034_ruler_p2_views.sql) ──
CREATE OR REPLACE VIEW v_ruler_p2_area AS
SELECT pr.area_id,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id
HAVING count(*) >= 5;

CREATE OR REPLACE VIEW v_ruler_p2 AS
SELECT pr.area_id,
       pr.property_type,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2::double precision) AS m,
       count(*)::integer AS n
  FROM properties pr
  JOIN property_offers po ON po.property_id = pr.id
  JOIN sale_offers o ON o.offer_id = po.offer_id
   AND o.last_seen = (SELECT max(o2.last_seen)
                        FROM sale_offers o2
                        JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                       WHERE po2.property_id = pr.id)
 WHERE pr.kind = 'sale'
   AND o.price_perm2::numeric BETWEEN 5000000 AND 500000000
   AND pr.area_id IS NOT NULL
 GROUP BY pr.area_id, pr.property_type
HAVING count(*) >= 5;

-- PostgREST nạp lại schema cache (sync-cloud INSERT qua REST — PGRST204 nếu cache cũ)
NOTIFY pgrst, 'reload schema';

COMMIT;
