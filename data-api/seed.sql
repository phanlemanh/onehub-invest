-- Seed data for onehub-data-api local development
-- Creates: 3 markets, 12 submarkets, 60 short-term listings, nights, asset stats, 26 sale / long-term-rent listings,
-- price ranks. No calibration-source rows (the API never reads or returns them).
-- Run after the schema: psql $DATABASE_URL -f db/schema.sql && psql $DATABASE_URL -f seed.sql

BEGIN;

-- Clear existing seed data
TRUNCATE listings, nights, areas, market_metrics, market_asset_stats,
  sale_offers, properties, property_offers, offer_price_rank
  RESTART IDENTITY CASCADE;

-- Markets (3)
INSERT INTO areas (id, name, region_type, country_code, meta) VALUES
  ('vn-hanoi', 'Hà Nội', 'market', 'vn', '{"seed": true}'),
  ('vn-hcmc', 'TP. Hồ Chí Minh', 'market', 'vn', '{"seed": true}'),
  ('vn-thanh-pho-da-nang', 'Đà Nẵng', 'market', 'vn', '{"seed": true}');

-- Submarkets (4 per market = 12)
INSERT INTO areas (id, parent_id, name, region_type, country_code, meta) VALUES
  ('vn-hanoi-hoan-kiem', 'vn-hanoi', 'Hoàn Kiếm', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hanoi-ba-dinh', 'vn-hanoi', 'Ba Đình', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hanoi-cau-giay', 'vn-hanoi', 'Cầu Giấy', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hanoi-dong-da', 'vn-hanoi', 'Đống Đa', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hcmc-quan-1', 'vn-hcmc', 'Quận 1', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hcmc-quan-3', 'vn-hcmc', 'Quận 3', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hcmc-phu-nhuan', 'vn-hcmc', 'Phú Nhuận', 'submarket', 'vn', '{"seed": true}'),
  ('vn-hcmc-binh-thanh', 'vn-hcmc', 'Bình Thạnh', 'submarket', 'vn', '{"seed": true}'),
  ('vn-dn-hai-chau', 'vn-thanh-pho-da-nang', 'Hải Châu', 'submarket', 'vn', '{"seed": true}'),
  ('vn-dn-son-tra', 'vn-thanh-pho-da-nang', 'Sơn Trà', 'submarket', 'vn', '{"seed": true}'),
  ('vn-dn-ngu-hanh-son', 'vn-thanh-pho-da-nang', 'Ngũ Hành Sơn', 'submarket', 'vn', '{"seed": true}'),
  ('vn-dn-lien-chieu', 'vn-thanh-pho-da-nang', 'Liên Chiểu', 'submarket', 'vn', '{"seed": true}');

-- Listings (60 total, ~20 per market, distributed across submarkets)
INSERT INTO listings (id, area_id, name, room_type, bedrooms, accommodates,
  price_listed, latitude, longitude, photo_urls, review_count, last_seen)
SELECT
  'seed_' || area_id || '_' || LPAD(n::text, 3, '0'),
  area_id,
  'Listing ' || area_name || ' #' || n,
  CASE WHEN n % 3 = 0 THEN 'Entire home' ELSE 'Private room' END,
  CASE WHEN n % 4 = 0 THEN 3 WHEN n % 3 = 0 THEN 2 ELSE 1 END,
  CASE WHEN n % 4 = 0 THEN 6 WHEN n % 3 = 0 THEN 4 ELSE 2 END,
  (800000 + (n * 137) % 4000000)::bigint,
  CASE market_code WHEN 'hn' THEN 21.0 + (n % 10) * 0.02 WHEN 'hcmc' THEN 10.75 + (n % 10) * 0.02 ELSE 16.05 + (n % 10) * 0.02 END,
  CASE market_code WHEN 'hn' THEN 105.78 + (n % 12) * 0.02 WHEN 'hcmc' THEN 106.65 + (n % 12) * 0.02 ELSE 108.2 + (n % 12) * 0.02 END,
  CASE WHEN n % 5 = 0 THEN NULL
    ELSE jsonb_build_array(
      'https://a0.muscache.com/im/pictures/hosting/Hosting-demo/hosting-' || n || '/photo-1.jpeg',
      'https://a0.muscache.com/im/pictures/hosting/Hosting-demo/hosting-' || n || '/photo-2.jpeg',
      'https://a0.muscache.com/im/pictures/hosting/Hosting-demo/hosting-' || n || '/photo-3.jpeg'
    )
  END,
  (n * 7) % 300,
  now() - (n % 7 || ' days')::interval
FROM (
  SELECT 'hn' AS market_code, 'vn-hanoi' AS market_id, id AS area_id, name AS area_name,
    21.02 AS base_lat, 105.80 AS base_lng
  FROM areas WHERE parent_id = 'vn-hanoi'
  UNION ALL
  SELECT 'hcmc', 'vn-hcmc', id, name, 10.78, 106.68
  FROM areas WHERE parent_id = 'vn-hcmc'
  UNION ALL
  SELECT 'dn', 'vn-thanh-pho-da-nang', id, name, 16.06, 108.22
  FROM areas WHERE parent_id = 'vn-thanh-pho-da-nang'
) sub
CROSS JOIN generate_series(1, 5) AS n;

-- Nights (30 days per listing)
INSERT INTO nights (listing_id, night, available, price)
SELECT l.id,
  current_date + (n || ' days')::interval,
  (l.id_hash % 3 != 0), -- ~33% booked
  l.price_listed * (0.8 + (l.id_hash % 5) * 0.1)
FROM (
  SELECT id, price_listed,
    ('x' || substr(md5(id), 1, 8))::bit(32)::int AS id_hash
  FROM listings
) l
CROSS JOIN generate_series(0, 29) AS n;

-- Asset stats (per submarket)
INSERT INTO market_asset_stats (area_id, kind, n_offers, median_price, p25_price, p75_price, median_perm2, median_rent)
SELECT id, 'sale',
  20 + (('x' || substr(md5(id), 1, 2))::bit(8)::int % 30),
  3500000000 + (('x' || substr(md5(id), 1, 4))::bit(16)::int % 5000000000),
  2500000000 + (('x' || substr(md5(id), 2, 4))::bit(16)::int % 3000000000),
  5000000000 + (('x' || substr(md5(id), 3, 4))::bit(16)::int % 7000000000),
  45000000 + (('x' || substr(md5(id), 1, 3))::bit(12)::int % 40000000),
  12000000 + (('x' || substr(md5(id), 2, 3))::bit(12)::int % 15000000)
FROM areas WHERE region_type = 'submarket';

-- Sale listings (20: 10 apartments in each of two wards, some below the ward median) and long-term rent listings (6)
INSERT INTO sale_offers (offer_id, area_id, kind, property_type, price_vnd, area_m2, price_perm2,
  bedrooms, bathrooms, latitude, longitude, confidence, first_seen, last_seen, n_reposts, post_ids, source)
SELECT
  'seed_offer_' || LPAD(n::text, 3, '0'),
  CASE WHEN n <= 10 THEN 'vn-hanoi-hoan-kiem' ELSE 'vn-hcmc-quan-1' END,
  'sale',
  'apartment',
  (60 + (n * 7) % 60)::bigint * CASE WHEN n % 3 = 0 THEN 30000000 + (n * 11) % 10000000 ELSE 55000000 + (n * 13) % 20000000 END,
  60 + (n * 7) % 60,
  CASE WHEN n % 3 = 0 THEN 30000000 + (n * 11) % 10000000
       ELSE 55000000 + (n * 13) % 20000000 END,
  CASE WHEN n % 3 = 0 THEN 2 ELSE 3 END,
  2,
  CASE WHEN n <= 10 THEN 21.03 ELSE 10.78 END,
  CASE WHEN n <= 10 THEN 105.85 ELSE 106.70 END,
  CASE WHEN n % 2 = 0 THEN 'high' ELSE 'medium' END,
  now() - (n % 10 || ' days')::interval,
  now() - (n % 5 || ' days')::interval,
  1,
  ARRAY['seed_post_' || n],
  'S03'
FROM generate_series(1, 20) AS n;

INSERT INTO sale_offers (offer_id, area_id, kind, property_type, price_vnd, area_m2, price_perm2,
  bedrooms, bathrooms, latitude, longitude, confidence, first_seen, last_seen, n_reposts, post_ids, source)
SELECT
  'seed_rent_' || LPAD(n::text, 3, '0'),
  CASE WHEN n <= 3 THEN 'vn-hanoi-ba-dinh' ELSE 'vn-dn-hai-chau' END,
  'rent_lt',
  'apartment',
  (8000000 + n * 1500000),
  50 + n * 5,
  (8000000 + n * 1500000) / (50 + n * 5),
  1 + n % 3,
  1,
  CASE WHEN n <= 3 THEN 21.04 ELSE 16.06 END,
  CASE WHEN n <= 3 THEN 105.82 ELSE 108.22 END,
  'medium',
  now() - (n || ' days')::interval,
  now(),
  1,
  ARRAY['seed_rent_post_' || n],
  'S03'
FROM generate_series(1, 6) AS n;

-- One unit per sale listing (CG8 ruler: ward × property type median over units)
INSERT INTO properties (area_id, property_type, kind)
SELECT area_id, property_type, kind FROM sale_offers WHERE kind = 'sale' ORDER BY offer_id;
INSERT INTO property_offers (property_id, offer_id)
SELECT p.id, o.offer_id
FROM (SELECT id, row_number() OVER (ORDER BY id) AS i FROM properties) p
JOIN (SELECT offer_id, row_number() OVER (ORDER BY offer_id) AS i FROM sale_offers WHERE kind = 'sale') o ON o.i = p.i;

-- Price rank per sale listing against its ward ruler (the pipeline computes this table in production)
INSERT INTO offer_price_rank (offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, n, trung_vi, p20,
  hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
SELECT o.offer_id, o.kind, o.property_type, o.bedrooms, 'gia-m2', o.price_perm2, 'phuong', o.area_id, r.n, r.m,
  percentile_cont(0.2) WITHIN GROUP (ORDER BY o2.price_perm2) ,
  ROUND((100.0 * (SELECT count(*) FROM sale_offers o3 WHERE o3.area_id = o.area_id AND o3.kind = 'sale' AND o3.price_perm2 <= o.price_perm2)
         / r.n)::numeric, 1),
  ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1),
  CASE WHEN o.price_perm2 < r.m * 0.95 THEN 're-trong-phuong' END,
  false,
  NULL,
  'seed'
FROM sale_offers o
JOIN v_ruler_p2 r ON r.area_id = o.area_id AND r.property_type = o.property_type
JOIN sale_offers o2 ON o2.area_id = o.area_id AND o2.kind = 'sale'
WHERE o.kind = 'sale'
GROUP BY o.offer_id, o.kind, o.property_type, o.bedrooms, o.price_perm2, o.area_id, r.n, r.m;

COMMIT;

-- ═════ PB8: danh bạ nhà mẫu — một dự án, một toà, một căn, một tin đang rao gắn toà (dữ liệu bịa, không chép từ DB thật) ═════
BEGIN;
INSERT INTO asset_nodes (id, node_type, name, slug, aliases, area_ids, catalog_tier) VALUES
  (900001, 'project', 'PB8 Dự án mẫu', 'pb8-du-an-mau', '{"Du an mau"}', '{vn-hanoi-hoan-kiem}', 'xac_minh')
ON CONFLICT (id) DO NOTHING;
INSERT INTO buildings (building_key, status, region_node_id, upi, iso_region, catalog_tier) VALUES
  ('bld_01JD0000000000000000000001', 'active', 900001, 'urn:onehub:upi:1:VN:VN-HN:bld_01JD0000000000000000000001', 'VN-HN', 'xac_minh')
ON CONFLICT (building_key) DO NOTHING;
INSERT INTO units (unit_key, status, building_key, stack_key, floor, sub_id, catalog_tier) VALUES
  ('unt_01JD0000000000000000000001', 'active', 'bld_01JD0000000000000000000001', NULL, '12', 'unt_01JD0000000000000000000001', 'xac_minh')
ON CONFLICT (unit_key) DO NOTHING;
-- Bí danh, phát biểu không có khoá tự nhiên duy nhất trong lược đồ mẫu → chỉ chèn khi chưa có (seed chạy lại không nhân đôi).
INSERT INTO registry_aliases (object_key, kind, value, source)
SELECT v.object_key, v.kind, v.value, v.source FROM (VALUES
  ('bld_01JD0000000000000000000001', 'ten', 'PB8 Toà A', 'S03'),
  ('unt_01JD0000000000000000000001', 'ma_nguon', 'PB8-A/A-1205', 'S03')) v(object_key, kind, value, source)
WHERE NOT EXISTS (SELECT 1 FROM registry_aliases r WHERE r.object_key = v.object_key AND r.kind = v.kind AND r.value = v.value);
INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, observed_at)
SELECT 'Unit', 'unt_01JD0000000000000000000001', v.field, v.value, 'fact', 'source_field', now() FROM (VALUES
  ('living_area', '68'), ('bedrooms', '2'), ('bathrooms', '2')) v(field, value)
WHERE NOT EXISTS (SELECT 1 FROM field_assertions f WHERE f.subject_key = 'unt_01JD0000000000000000000001' AND f.field = v.field);
INSERT INTO sale_offers (offer_id, area_id, kind, property_type, price_vnd, area_m2, price_perm2, bedrooms, confidence,
  first_seen, last_seen, n_reposts, post_ids, source, offer_status) VALUES
  ('seed_offer_pb8_toa', 'vn-hanoi-hoan-kiem', 'sale', 'apartment', 6800000000, 68, 100000000, 2, 'high', now(), now(), 1,
   '{pb8-bai-1}', 'S03', 'active')
ON CONFLICT (offer_id) DO NOTHING;
INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, rule_id, observed_at)
SELECT 'Property', 'S03:pb8-bai-1', 'universal_property_id', 'urn:onehub:upi:1:VN:VN-HN:bld_01JD0000000000000000000001', 'observed',
   'e1_rule', 'ghep-toa-cot', now()
WHERE NOT EXISTS (SELECT 1 FROM field_assertions f WHERE f.subject_key = 'S03:pb8-bai-1' AND f.field = 'universal_property_id');
COMMIT;
