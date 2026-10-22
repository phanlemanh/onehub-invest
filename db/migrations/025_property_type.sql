-- 025_property_type.sql — G-1 Lô 1: cột property_type + CHECK enums
-- (ADR-0011 RESO-first; lộ trình "Một Căn Nhà" docs/research/unified-property-pipeline.md)
--
-- Mapping S06 Chợ Tốt → property_type (xác minh từ payload thật 22/10):
--   1010 Căn hộ/Chung cư      → apartment  (DD PropertySubType: Condominium/Apartment)
--   1020 Nhà ở (mặt tiền/biệt thự/ngõ hẻm/liền kề = house_type 1-4) → house
--   1030 Văn phòng, Mặt bằng  → commercial (DD PropertyType: CommercialSale/CommercialLease)
--   1040 Đất                  → land      (DD PropertyType: Land)
--   1050 Phòng trọ            → room      — LOCAL EXTENSION VN: DD không có
--                                phòng trọ (PropertySubType 31 giá trị không có);
--                                rationale khai trong mappings.yaml.
-- Trước đây ruler/market_asset_stats trộn 5 loại này trong cùng median phường.

ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS property_type text;

-- CHECK constraint theo ADR-0011 Qđ 3.4 (enum không text trần — bài học NaN S05)
ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_kind_chk
  CHECK (kind IN ('sale','rent_lt')) NOT VALID;
ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_confidence_chk
  CHECK (confidence IN ('high','medium','low')) NOT VALID;
ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_price_tier_chk
  CHECK (price_tier IS NULL OR price_tier IN ('P0','P1','P2')) NOT VALID;
ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_property_type_chk
  CHECK (property_type IS NULL OR property_type IN
    ('apartment','house','land','room','commercial','unknown')) NOT VALID;

-- Backfill S06 qua join hash(list_id) = offer_id (cùng công thức transform)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE sale_offers o SET property_type = m.pt
FROM (
  SELECT DISTINCT ON (list_id) list_id,
    CASE category
      WHEN 1010 THEN 'apartment'
      WHEN 1020 THEN 'house'
      WHEN 1030 THEN 'commercial'
      WHEN 1040 THEN 'land'
      WHEN 1050 THEN 'room'
      ELSE 'unknown' END AS pt
  FROM stg_chotot_ads ORDER BY list_id, captured_at DESC
) m
WHERE o.source = 'S06'
  AND o.offer_id = 'offer_' || substr(encode(digest('S06|' || m.list_id::text, 'sha256'), 'hex'), 1, 16);

-- P1 (S03/S05 text) chưa có tín hiệu → unknown tạm (regex/LLM extract là G-2/G-3)
UPDATE sale_offers SET property_type = 'unknown'
  WHERE property_type IS NULL AND source IN ('S03','S05');

CREATE INDEX IF NOT EXISTS sale_offers_property_type_idx
  ON sale_offers(property_type, kind);

-- Cloud schema đồng bộ cột (sync-cloud FILL có sale_offers; không PII)
