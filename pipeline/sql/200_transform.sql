-- 200_transform.sql — staging → typed + areas
-- Yêu cầu: stg_listings, stg_calendar, stg_neighbourhoods, stg_geojson đã nạp.

-- 1) Areas: districts = submarket; parent = market
INSERT INTO areas (id, parent_id, region_type, name, country_code, market_type, meta)
VALUES ('th-bangkok', NULL, 'market', 'Bangkok', 'th', 'urban_metro',
        jsonb_build_object('source', 'insideairbnb', 'snapshot', :'snapshot'::text))
ON CONFLICT (id) DO UPDATE SET meta = EXCLUDED.meta;

INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
SELECT 'th-bangkok-' || lower(regexp_replace(trim(neighbourhood), '\s+', '-', 'g')),
       'th-bangkok', 'submarket', trim(neighbourhood), 'th',
       jsonb_build_object('source', 'insideairbnb')
FROM stg_neighbourhoods
WHERE trim(neighbourhood) <> ''
ON CONFLICT (id) DO NOTHING;

-- Polygon + centroid từ neighbourhoods.geojson
UPDATE areas a
SET geom    = src.g,
    geom_pt = ST_Centroid(src.g)::geography
FROM (
  SELECT trim(f -> 'properties' ->> 'neighbourhood') AS name,
         ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_GeomFromGeoJSON(f -> 'geometry')), 3)) AS g
  FROM jsonb_array_elements((SELECT data FROM stg_geojson LIMIT 1) -> 'features') AS f
) AS src
WHERE a.region_type = 'submarket' AND a.name = src.name;

-- 2) Listings
INSERT INTO listings (id, area_id, name, room_type, property_type, bedrooms,
                      bathrooms, accommodates, price_listed, minimum_nights,
                      latitude, longitude, geom, last_seen)
SELECT 'abnb_' || l.id,
       COALESCE(a.id, 'th-bangkok'),
       l.name,
       NULLIF(trim(l.room_type), ''),
       NULLIF(trim(l.property_type), ''),
       NULLIF(l.bedrooms, '')::int,
       NULLIF(l.bathrooms, '')::numeric,
       NULLIF(l.accommodates, '')::int,
       NULLIF(regexp_replace(trim(l.price), '[$,]', '', 'g'), '')::numeric,
       NULLIF(l.minimum_nights, '')::int,
       NULLIF(l.latitude, '')::double precision,
       NULLIF(l.longitude, '')::double precision,
       CASE WHEN l.latitude <> '' AND l.longitude <> ''
            THEN ST_SetSRID(ST_MakePoint(l.longitude::double precision,
                                         l.latitude::double precision), 4326)::geography
       END,
       :'snapshot'::date
FROM stg_listings l
LEFT JOIN areas a
  ON a.region_type = 'submarket'
 AND a.name = trim(l.neighbourhood_cleansed)
WHERE l.id <> ''
ON CONFLICT (id) DO UPDATE
  SET area_id = EXCLUDED.area_id, name = EXCLUDED.name,
      room_type = EXCLUDED.room_type, property_type = EXCLUDED.property_type,
      bedrooms = EXCLUDED.bedrooms, bathrooms = EXCLUDED.bathrooms,
      accommodates = EXCLUDED.accommodates, price_listed = EXCLUDED.price_listed,
      minimum_nights = EXCLUDED.minimum_nights, last_seen = EXCLUDED.last_seen;

-- 3) Nights — giá lấy từ price_listed của listing (snapshot 2026 của Inside
-- Airbnb đã bỏ price/adjusted_price khỏi calendar; xem divergence list)
-- Chỉ thay đêm của listing SỐNG (view listings): đêm của listing đã nghỉ giữ nguyên (PL14, 044).
DELETE FROM nights WHERE listing_id IN (SELECT id FROM listings);
INSERT INTO nights (listing_id, night, available, price)
SELECT 'abnb_' || c.listing_id,
       c.date::date,
       (trim(c.available) = 't'),
       l.price_listed
FROM stg_calendar c
JOIN listings l ON l.id = 'abnb_' || c.listing_id
WHERE c.date ~ '^\d{4}-\d{2}-\d{2}$';
