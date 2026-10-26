-- cloud-schema-catchup-2026-10-26-043.sql — bắt kịp cloud (Supabase) cho migration 043 (PL6 sổ từ vựng một nguồn).
-- ĐÃ ÁP lên cloud ngày 26/10 (giám sát đợt dot0-cam-mau, Mạnh duyệt). Tệp này là hồ sơ: khối ÁP dưới là NGUYÊN VĂN
-- từng byte tệp đã áp (sha256 5391e044868548ba75ebf47b69514c10879c14e91ffde20aa52ba75dfc55c0c2 —
-- scripts/check-cloud-catchup.mjs đối chiếu). Hướng dẫn: docs/ops/cloud-schema-catchup-2026-10-26.md.
--
-- ĐO TRƯỚC — chỉ đọc. Chạy trước khi áp (hay áp lại): CHECK nào đã có, và số dòng lệch từng CHECK (phải = 0).
SELECT conname FROM pg_constraint
 WHERE conname IN ('sale_offers_kind_chk','sale_offers_confidence_chk','sale_offers_price_tier_chk',
                   'sale_offers_property_type_chk','properties_property_type_chk')
 ORDER BY 1;
SELECT
  (SELECT count(*) FROM sale_offers WHERE kind IS NOT NULL AND kind NOT IN ('sale','rent_lt'))                 AS lech_kind,
  (SELECT count(*) FROM sale_offers WHERE confidence IS NOT NULL AND confidence NOT IN ('high','medium','low')) AS lech_confidence,
  (SELECT count(*) FROM sale_offers WHERE price_tier IS NOT NULL AND price_tier NOT IN ('P0','P1','P2'))       AS lech_price_tier,
  (SELECT count(*) FROM sale_offers WHERE property_type IS NOT NULL
     AND property_type NOT IN ('apartment','house','land','room','commercial','unknown'))                      AS lech_property_type,
  (SELECT count(*) FROM properties WHERE property_type IS NOT NULL
     AND property_type NOT IN ('apartment','house','land','room','commercial','unknown'))                      AS lech_properties_type;
SELECT to_regclass('public.ref_lookup') AS ref_lookup, to_regclass('public.ref_field_lookup') AS ref_field_lookup;
--
-- ÁP — nguyên văn tệp đã áp 26/10 (một transaction, idempotent):
-- Bắt kịp cloud cho migration 043 (26/10). 043 nguyên văn lỗi trên cloud: cloud thiếu 3 CHECK của 025
-- (sale_offers_kind_chk, _confidence_chk, _price_tier_chk). Đo trước (chỉ đọc): 0 dòng lệch mọi CHECK.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offers_kind_chk') THEN
    ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_kind_chk CHECK (kind IN ('sale','rent_lt')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offers_confidence_chk') THEN
    ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_confidence_chk CHECK (confidence IN ('high','medium','low')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offers_price_tier_chk') THEN
    ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_price_tier_chk CHECK (price_tier IS NULL OR price_tier IN ('P0','P1','P2')) NOT VALID;
  END IF;
END $$;
-- ===== nguyên văn db/migrations/043_ref_vocabulary.sql =====
-- 043_ref_vocabulary.sql — PL6 sổ từ vựng một nguồn: bảng tra ref_* + VALIDATE CHECK enum
-- Nguồn: docs/superpowers/specs/2026-10-26-so-tu-vung-mot-nguon-design.md · ADR-0013 §8 (khuôn RESO Lookup /
-- RelatedLookup) · sổ = khối `enums:` của pipeline/mappings.yaml. Số 043 theo SO-MIGRATION liên làn (26/10).
-- Không PII. ref_* chỉ ở DB local — app đọc nhãn từ tệp sinh, không từ DB (không thêm vào sync-cloud).
--
-- Seed dưới là đầu ra NGUYÊN VĂN của `node pipeline/vocab.mjs --emit-seed` lúc viết migration. Sổ đổi về sau →
-- viết migration mới (dán --emit-seed mới + sửa CHECK); `node pipeline/vocab.mjs --check-db` đỏ khi DB chậm hơn sổ.

CREATE TABLE IF NOT EXISTS ref_lookup (
  lookup_name           text    NOT NULL,   -- trục của sổ (≈ RESO Lookup.LookupName)
  lookup_value          text    NOT NULL,   -- code lưu trong cột (≈ LookupValue)
  standard_lookup_value text,               -- giá trị chuẩn RESO gần nhất; NULL = local extension
  label_vi              text    NOT NULL,   -- nhãn tiếng Việt (CONTEXT.md)
  is_local              boolean NOT NULL,
  sort_order            int     NOT NULL,
  PRIMARY KEY (lookup_name, lookup_value)
);

CREATE TABLE IF NOT EXISTS ref_field_lookup (
  table_name  text NOT NULL,                -- ≈ RESO RelatedLookup: cột nào dùng lookup nào
  column_name text NOT NULL,
  lookup_name text NOT NULL,
  PRIMARY KEY (table_name, column_name)
);

INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('kind', 'sale', 'Residential', 'Bán', false, 1),
  ('kind', 'rent_lt', 'ResidentialLease', 'Cho thuê', false, 2),
  ('property_type', 'apartment', 'Condominium', 'Căn hộ', false, 1),
  ('property_type', 'house', 'Townhouse', 'Nhà riêng', false, 2),
  ('property_type', 'land', 'UnimprovedLand', 'Đất', false, 3),
  ('property_type', 'room', NULL, 'Phòng', true, 4),
  ('property_type', 'commercial', 'CommercialSale / CommercialLease (PropertyType)', 'Mặt bằng', false, 5),
  ('property_type', 'unknown', NULL, 'Chưa rõ', true, 6),
  ('confidence', 'high', NULL, 'cao', true, 1),
  ('confidence', 'medium', NULL, 'trung bình', true, 2),
  ('confidence', 'low', NULL, 'thấp', true, 3),
  ('price_tier', 'P0', NULL, 'giá giao dịch (P0)', true, 1),
  ('price_tier', 'P1', NULL, 'giá nội bộ (P1)', true, 2),
  ('price_tier', 'P2', NULL, 'giá công khai (P2)', true, 3),
  ('enrich_field', 'property_type', 'PropertySubType', 'Loại hình', false, 1),
  ('enrich_field', 'bedrooms', 'BedroomsTotal', 'Phòng ngủ', false, 2),
  ('enrich_field', 'bathrooms', 'BathroomsTotalInteger', 'WC', false, 3),
  ('enrich_field', 'street_raw', 'StreetName', 'Đường', false, 4),
  ('enrich_field', 'block_raw', 'BuildingName', 'Toà', false, 5),
  ('listing_intent', 'offer', NULL, 'Tin rao', true, 1),
  ('listing_intent', 'wanted', NULL, 'Tin tìm mua, tìm thuê', true, 2),
  ('listing_intent', 'not_listing', NULL, 'Không phải tin rao', true, 3),
  ('listing_intent', 'unknown', NULL, 'Chưa rõ', true, 4),
  ('offer_status', 'active', 'Active', 'Đang chào', false, 1),
  ('offer_status', 'active_under_contract', 'ActiveUnderContract', 'Đã cọc', false, 2),
  ('offer_status', 'closed', 'Closed', 'Đã bán', false, 3),
  ('offer_status', 'withdrawn', 'Withdrawn', 'Đã gỡ', false, 4),
  ('offer_status', 'unknown', NULL, 'Chưa rõ', true, 5),
  ('data_level', 'B0', NULL, 'Có lời khai', true, 1),
  ('data_level', 'B1', NULL, 'Đọc được', true, 2),
  ('data_level', 'B2', NULL, 'Gắn căn', true, 3),
  ('data_level', 'B3', NULL, 'Đã đo', true, 4),
  ('data_level', 'B4', NULL, 'Xác minh', true, 5),
  ('data_level', 'B5', NULL, 'Sống', true, 6),
  ('capability_level', 'N0', NULL, 'Thu được', true, 1),
  ('capability_level', 'N1', NULL, 'Đọc được', true, 2),
  ('capability_level', 'N2', NULL, 'Đo được', true, 3),
  ('capability_level', 'N3', NULL, 'Tự động ở ngưỡng', true, 4),
  ('capability_level', 'N4', NULL, 'Tự duy trì', true, 5)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('sale_offers', 'kind', 'kind'),
  ('sale_offers', 'property_type', 'property_type'),
  ('properties', 'property_type', 'property_type'),
  ('sale_offers', 'confidence', 'confidence'),
  ('sale_offers', 'price_tier', 'price_tier'),
  ('enrichment_proposals', 'field', 'enrich_field')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
-- Bốn CHECK của 025 (NOT VALID từ 22/10) — DB local 26/10: 0 dòng lệch. VALIDATE chạy lại được (no-op khi đã hợp lệ).
ALTER TABLE sale_offers VALIDATE CONSTRAINT sale_offers_kind_chk;
ALTER TABLE sale_offers VALIDATE CONSTRAINT sale_offers_confidence_chk;
ALTER TABLE sale_offers VALIDATE CONSTRAINT sale_offers_price_tier_chk;
ALTER TABLE sale_offers VALIDATE CONSTRAINT sale_offers_property_type_chk;

-- properties.property_type (chép từ sale_offers.property_type ở resolve-properties) — Hỏi-2 PL6, Mạnh duyệt 26/10.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_property_type_chk') THEN
    ALTER TABLE properties ADD CONSTRAINT properties_property_type_chk
      CHECK (property_type IS NULL OR property_type IN ('apartment','house','land','room','commercial','unknown')) NOT VALID;
  END IF;
END $$;
ALTER TABLE properties VALIDATE CONSTRAINT properties_property_type_chk;
-- ===== hết 043 =====
-- Khoá như 037: bảng mới không cho anon/authenticated, bật RLS (leak gate của sync đòi anon không SELECT được bảng nào).
REVOKE ALL ON TABLE ref_lookup, ref_field_lookup FROM anon, authenticated;
ALTER TABLE ref_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_field_lookup ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
COMMIT;
