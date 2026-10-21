-- 022_chotot_source.sql — Nguồn S06: Chợ Tốt (gateway API công khai)
-- Kiến trúc "vải công khai + tín hiệu riêng + khoá SĐT"
-- (docs/research/investment-pipeline-4-stages.md):
--   Chợ Tốt = tầng P2 (giá rao công khai) — thước median + trend + giá thuê LTR.
--
-- PII: sale_offers.seller_phone / sellers.* CHỈ ở máy local.
-- sync-cloud.mjs chỉ sync bảng airdna_* → ref_calib_*, các bảng này
-- KHÔNG sync cloud (kế thừa tiền lệ stg_zalo_posts).

INSERT INTO source_registry (code, real_name, label_vi, status, since, source_ids)
VALUES ('S06', 'Chợ Tốt', 'Rao vặt công khai', 'active', '2026-10-20', '{"chotot-ads"}')
ON CONFLICT (code) DO NOTHING;

-- Staging: 1 dòng/list_id, giữ payload nguyên vẹn (DATA-CONTRACT);
-- các cột trích xuất phục vụ query sargable + transform. Lịch sử giá
-- nằm trong raw snapshots bất biến, stg chỉ giữ trạng thái MỚI NHẤT.
CREATE TABLE IF NOT EXISTS stg_chotot_ads (
  list_id       bigint PRIMARY KEY,
  region_v2     int NOT NULL,              -- 12000=Hà Nội, 13000=HCMC
  city_code     text NOT NULL,             -- 'vn-hanoi' | 'vn-hcmc'
  category      int NOT NULL,              -- 1000 nhà đất | 1010 căn hộ
  ad_type       text NOT NULL,             -- 's' bán | 'u' thuê
  subject       text,
  price         bigint,                    -- VND; 0 = "Thỏa thuận"
  price_string  text,
  size_m2       numeric,
  rooms         int,
  toilets       int,
  house_type    text,
  area_name     text,                      -- quận/huyện
  ward_name     text,
  ward_name_v3  text,                      -- phường mới sau sáp nhập 2025
  latitude      double precision,
  longitude     double precision,
  list_time     timestamptz,
  seller        jsonb,                     -- {full_name, avatar, live_ads, sold_ads, company_ad}
  images        jsonb,
  payload       jsonb NOT NULL,
  snapshot_id   text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  captured_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stg_chotot_ads_city_type_idx ON stg_chotot_ads(city_code, ad_type);

-- Mở rộng sale_offers cho kiến trúc 3 lớp:
--   price_tier: P0 giao dịch thật | P1 rao nội bộ (S03/S05) | P2 rao công khai (S06)
--   SĐT: thô local-only (PII tầng A), hash dùng làm join key/sync cloud sau này.
ALTER TABLE sale_offers
  ADD COLUMN IF NOT EXISTS price_tier        text,
  ADD COLUMN IF NOT EXISTS district_raw      text,
  ADD COLUMN IF NOT EXISTS seller_name       text,
  ADD COLUMN IF NOT EXISTS seller_phone      text,
  ADD COLUMN IF NOT EXISTS seller_phone_hash text,
  ADD COLUMN IF NOT EXISTS seller_ref        text,
  ADD COLUMN IF NOT EXISTS bait_gap_pct      numeric,
  ADD COLUMN IF NOT EXISTS listing_url       text;

UPDATE sale_offers SET price_tier = 'P1' WHERE price_tier IS NULL AND source = 'S03';

CREATE INDEX IF NOT EXISTS sale_offers_tier_idx ON sale_offers(price_tier, area_id, kind);

-- Sellers registry (LOCAL-ONLY): hồ sơ người bán theo phone_hash — nền của
-- broker scoring + đo bait_gap_pct (chênh giá công khai vs nội bộ cùng người bán).
CREATE TABLE IF NOT EXISTS sellers (
  phone_hash  text PRIMARY KEY,
  name        text,
  sources     text[] NOT NULL DEFAULT '{}',
  n_ads       int NOT NULL DEFAULT 0,
  first_seen  timestamptz NOT NULL,
  last_seen   timestamptz NOT NULL,
  flags       jsonb NOT NULL DEFAULT '{}'::jsonb  -- vd {"company_ad":true}
);
