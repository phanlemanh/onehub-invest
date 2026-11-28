-- data-api/db/schema.sql — lược đồ mẫu DUY NHẤT của data-api bản công khai (PB2 data-api-hop-dong-reso-dd-2-1, AC-9).
-- Dựng một DB rỗng có PostGIS cho mọi đường của API: `psql $DATABASE_URL -f db/schema.sql` rồi `psql … -f seed.sql`.
-- Gộp 19 tệp cũ (001…020) theo đúng thứ tự cũ, giữ nguyên câu; mỗi khúc mở bằng tên tệp cũ. Phần cuối thêm những bảng, cột,
-- view mà route hôm nay đọc nhưng lược đồ mẫu cũ thiếu (bản cũ áp lỗi ở 012 — area_sources chưa có — và /v1/listings,
-- căn giá tốt lỗi vì thiếu cột, bảng hạng giá và thước CG8). Đây là lược đồ MẪU cho người dùng repo công khai, không phải
-- migration của kho chính (db/migrations là nguồn sự thật); bảng của nguồn hiệu chuẩn S02 còn ở đây vì /v1/markets bản này
-- còn đọc chúng (HT20 gỡ), seed.sql không chèn dòng nào vào chúng.
-- Idempotent: chạy lại không lỗi.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- hmac() cho listingKey của tin thuê ngắn hạn

-- ═════ 001_init.sql ═════
-- One Invest — schema nền tảng (M1′)
-- Hierarchy areas mirror S02: country → market → submarket (→ neighborhood sau này).
-- Metrics precompute theo area × tháng (ADR-0001/0002).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS areas (
  id          text PRIMARY KEY,          -- 'th-bangkok', 'th-bangkok-bang-kapi'
  parent_id   text REFERENCES areas(id),
  region_type text NOT NULL,             -- country | market | submarket
  name        text NOT NULL,
  country_code text NOT NULL,
  market_type text,                      -- mid_size_city | urban_metro | ... (market level)
  geom        geometry(MultiPolygon, 4326),
  geom_pt     geography(Point, 4326),
  meta        jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS listings (
  id            text PRIMARY KEY,        -- 'abnb_123456'
  area_id       text NOT NULL REFERENCES areas(id),
  name          text,
  room_type     text,
  property_type text,
  bedrooms      int,
  bathrooms     numeric,
  accommodates  int,
  price_listed  numeric,                 -- USD, giá niêm yết (≠ ADR)
  minimum_nights int,
  latitude      double precision,
  longitude     double precision,
  geom          geography(Point, 4326),
  last_seen     date NOT NULL
);
CREATE INDEX IF NOT EXISTS listings_area_idx ON listings(area_id);

-- Một đêm của một listing (từ calendar snapshot, cửa sổ 12 tháng tới)
CREATE TABLE IF NOT EXISTS nights (
  listing_id   text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  night        date NOT NULL,
  available    boolean NOT NULL,         -- true = còn trống, false = đã đặt/owner-block (xem divergence)
  price        numeric,                  -- USD/đêm (đã quy đổi; không gồm phí vệ sinh)
  PRIMARY KEY (listing_id, night)
);
CREATE INDEX IF NOT EXISTS nights_night_idx ON nights(night);

-- Metrics precompute — mirror quan sát S02: một dòng / area / tháng
CREATE TABLE IF NOT EXISTS market_metrics (
  area_id          text NOT NULL REFERENCES areas(id),
  month            date NOT NULL,        -- ngày đầu tháng
  listing_count    int,                  -- listing có ≥1 đêm đặt trong tháng
  booked_nights    int,
  available_nights int,
  revenue          numeric,              -- Σ price trên các đêm đặt
  adr              numeric,              -- revenue / booked_nights
  occupancy        numeric,              -- booked / (booked + available)
  revpar           numeric,              -- revenue / (booked + available)
  PRIMARY KEY (area_id, month)
);

-- ═════ 002_auth.sql ═════
-- 002_auth.sql — M5′: auth + saved markets + plan (paywall demo)
-- Paywall mirror cơ chế S02 đã quan sát: field-level redaction (free) +
-- endpoint-level 401 (pro-only sections). `plan` là demo switch, không phải billing thật.
CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,             -- 'usr_' || random hex
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,                -- scrypt: '<salt-hex>$<key-hex>'
  plan          text NOT NULL DEFAULT 'free', -- free | pro
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      text PRIMARY KEY,                -- 32-byte random hex
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS saved_markets (
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id    text NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, area_id)
);

-- ═════ 003_s01_staging.sql ═════
-- 003_s01_staging.sql — staging tiêu thụ snapshot từ one-invest-collector
-- (DATA-CONTRACT schemaVersion 1; payload giữ nguyên vẹn, mọi chuẩn hoá ở tầng transform)
CREATE TABLE IF NOT EXISTS airbnb_snapshots (
  snapshot_id  text PRIMARY KEY,          -- "hanoi__s01-listing__20261017T155743"
  city         text NOT NULL,
  source       text NOT NULL,             -- s01-discovery | s01-listing | ...
  collected_at timestamptz,
  manifest     jsonb NOT NULL             -- nguyên vẹn manifest (coverage telemetry)
);

-- Payload nguyên vẹn mỗi listing theo snapshot (re-parse được khi transform đổi)
CREATE TABLE IF NOT EXISTS stg_abnb_listings (
  listing_id  text NOT NULL,              -- S01 listing id ("1774…")
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  fetched_at  timestamptz,
  payload     jsonb NOT NULL,             -- {url, deferredState, pdpSections, calendar}
  PRIMARY KEY (listing_id, snapshot_id)
);
CREATE INDEX IF NOT EXISTS stg_abnb_listings_snap_idx ON stg_abnb_listings(snapshot_id);

-- Calendar bung thành dòng/đêm (PdpCalendarDay) — tương đương bảng nights của M1′
CREATE TABLE IF NOT EXISTS stg_abnb_nights (
  listing_id  text NOT NULL,
  snapshot_id text NOT NULL,
  night       date NOT NULL,
  available   boolean,
  min_nights  int,
  PRIMARY KEY (listing_id, snapshot_id, night)
);

-- ═════ 004_stg_discovery.sql ═════
-- 004_stg_discovery.sql — staging output của s01-discovery (listing-ref)
CREATE TABLE IF NOT EXISTS stg_abnb_discovery (
  listing_id   text NOT NULL,
  snapshot_id  text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  title        text,          -- "Căn hộ tại Quận Hoàn Kiếm" → nguồn suy ra area
  href         text,
  price_label  text,          -- giá hiển thị trên card (nếu có)
  fetched_at   timestamptz,
  PRIMARY KEY (listing_id, snapshot_id)
);

-- ═════ 005_stg_s04.sql ═════
-- 005_stg_s04.sql — staging ranh giới hành chính từ S04
CREATE TABLE IF NOT EXISTS stg_osm_boundaries (
  osm_id     text NOT NULL,
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  name       text,
  payload    jsonb NOT NULL,   -- nguyên vẹn element gốc của S04 (tags + members.geometry)
  PRIMARY KEY (osm_id, snapshot_id)
);

-- ═════ 006_breakdowns.sql ═════
-- 006_breakdowns.sql — bảng cache breakdowns precompute (400_breakdowns.sql đổ vào)
CREATE TABLE IF NOT EXISTS area_breakdowns (
  area_id text NOT NULL,
  kind    text NOT NULL,        -- bedrooms | roomTypes | topListings
  label   text NOT NULL,        -- bucket / room-type / 'listing:<id>'
  payload jsonb NOT NULL,
  PRIMARY KEY (area_id, kind, label)
);
CREATE INDEX IF NOT EXISTS area_breakdowns_area_idx ON area_breakdowns(area_id);

-- ═════ 008_s03_offers.sql ═════
-- 008_s03_offers.sql — staging S03 posts + canonical offers + asset stats
CREATE TABLE IF NOT EXISTS stg_zalo_posts (
  post_id     text PRIMARY KEY,        -- 'mock-sale-0-abc123' | 's03-<msg_id>'
  snapshot_id text NOT NULL REFERENCES airbnb_snapshots(snapshot_id) ON DELETE CASCADE,
  group_name  text,
  author_hash text,
  posted_at   timestamptz,
  text        text NOT NULL,
  captured_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_offers (
  offer_id    text PRIMARY KEY,        -- hash của dedup_key
  area_id     text REFERENCES areas(id),
  kind        text NOT NULL,           -- 'sale' | 'rent_lt'
  price_vnd   bigint,
  area_m2     numeric,
  price_perm2 bigint,                  -- tính từ price/area hoặc parse trực tiếp
  bedrooms    int,
  phuong_raw  text,                    -- tên phường parse từ text
  confidence  text NOT NULL DEFAULT 'low', -- high (đủ giá+DT+phường) | medium | low
  first_seen  timestamptz NOT NULL,
  last_seen   timestamptz NOT NULL,
  n_reposts   int NOT NULL DEFAULT 1,
  post_ids    text[] NOT NULL DEFAULT '{}',
  source      text NOT NULL DEFAULT 'mock' -- 'mock' | 'S03'
);
CREATE INDEX IF NOT EXISTS sale_offers_area_idx ON sale_offers(area_id, kind);

-- Median + yield theo area × kind
CREATE TABLE IF NOT EXISTS market_asset_stats (
  area_id       text NOT NULL REFERENCES areas(id),
  kind          text NOT NULL,        -- 'sale' | 'rent_lt'
  n_offers      int,
  median_price  numeric,
  p25_price     numeric,
  p75_price     numeric,
  median_perm2  numeric,              -- sale only
  median_rent   numeric,              -- rent_lt only (VND/tháng)
  updated_at    timestamptz DEFAULT now(),
  PRIMARY KEY (area_id, kind)
);

-- ═════ 009_s02_ref.sql ═════
-- 009_s02_ref.sql — S02 reference data (đối chiếu + nguồn hạng nhất)
CREATE TABLE IF NOT EXISTS airdna_markets (
  airdna_id     text PRIMARY KEY,      -- '47'
  name          text,
  country_code  text,
  meta          jsonb DEFAULT '{}',    -- full payload minus geospatial
  captured_at   timestamptz,
  snapshot_id   text
);

CREATE TABLE IF NOT EXISTS airdna_market_metrics (
  airdna_id  text NOT NULL REFERENCES airdna_markets(airdna_id) ON DELETE CASCADE,
  metric     text NOT NULL,           -- adr | occupancy | revenue | revpar | listing_count
  period     text NOT NULL,           -- '2025-10' etc
  value      numeric,
  PRIMARY KEY (airdna_id, metric, period)
);

CREATE TABLE IF NOT EXISTS airdna_scores (
  airdna_id  text PRIMARY KEY REFERENCES airdna_markets(airdna_id) ON DELETE CASCADE,
  total      numeric,
  seasonality numeric,
  revenue_growth numeric,
  regulation numeric,
  rental_demand numeric,
  investability numeric,
  captured_at timestamptz
);

CREATE TABLE IF NOT EXISTS airdna_submarket_metrics (
  airdna_sub_id  text NOT NULL,
  airdna_market_id text NOT NULL,
  name           text,
  meta           jsonb DEFAULT '{}',
  PRIMARY KEY (airdna_sub_id)
);

-- ═════ PB2: crosswalk khu vực ↔ nguồn (bảng thật của kho chính; 012 cập nhật nó, /v1/markets đọc nó) ═════
CREATE TABLE IF NOT EXISTS area_sources (
  area_id         text NOT NULL,
  source          text NOT NULL,
  source_area_key text NOT NULL,
  meta            jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (area_id, source, source_area_key)
);

-- ═════ 010_listing_stats.sql ═════
-- 010_listing_stats.sql — thống kê theo listing tính sẵn (pipeline/sql/410_listing_stats.sql đổ vào)
-- để trang Duyệt listing / chi tiết listing không gộp ~11 triệu dòng nights mỗi lần tải.
CREATE TABLE IF NOT EXISTS listing_stats (
  listing_id  text PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  nights      int NOT NULL,          -- số đêm có trong lịch
  booked      int NOT NULL,          -- đêm đã đặt (NOT available)
  revenue     numeric NOT NULL,      -- sum(price) của đêm đã đặt, đơn vị tiền của market
  occupancy   numeric,               -- booked / nights
  first_night date,
  last_night  date,
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- ═════ 011_listing_stats_near_term.sql ═════
-- 011_listing_stats_near_term.sql — công suất "90 đêm đầu" tính sẵn cho truy vấn lợi suất
-- (getYieldRows / getYieldComps), để /yield, /so-sanh và trang Insight thị trường không
-- gộp ~11 triệu dòng nights mỗi lần tải. pipeline/sql/410_listing_stats.sql đổ vào.
-- "90 đêm đầu" = đêm trong [first_night, first_night + 90) của từng listing.
ALTER TABLE listing_stats
  ADD COLUMN IF NOT EXISTS nights90 int NOT NULL DEFAULT 0,  -- số đêm trong 90 đêm đầu
  ADD COLUMN IF NOT EXISTS booked90 int NOT NULL DEFAULT 0;  -- đêm đã đặt trong 90 đêm đầu

-- ═════ 012_source_registry_roles_dq.sql ═════
-- 012_source_registry_roles_dq.sql — C1 (ADR-0007): SPL source registry +
-- users.role (clearance law portals.md) + dq_check_results (DQO) + mã nguồn
-- ở tầng serving (S01–S04). Mapping mã↔tên thật CHỈ sống ở DB local — không
-- sync cloud, không commit ra ngoài (bảng này nằm trong pg_dump backup DR).

-- ===== SPL — Source Registry (tầng A ↔ B, secret) =====
CREATE TABLE IF NOT EXISTS source_registry (
  code       text PRIMARY KEY,          -- S01… — mã ổn định vĩnh viễn, không tái sử dụng
  real_name  text NOT NULL,             -- tầng A: tên nguồn thật (KHÔNG rời máy)
  label_vi   text NOT NULL,             -- tầng C: nhãn tiếng Việt cho UI
  status     text NOT NULL DEFAULT 'active',  -- active | retired
  since      date NOT NULL DEFAULT current_date,
  retired_at date
);

INSERT INTO source_registry (code, real_name, label_vi) VALUES
  ('S01', 'Nguồn mẫu S01', 'Tự thu'),
  ('S02', 'Nguồn mẫu S02', 'Hiệu chuẩn'),
  ('S03', 'Nguồn mẫu S03', 'Cộng đồng'),
  ('S04', 'Nguồn mẫu S04', 'Địa giới mở')
ON CONFLICT (code) DO NOTHING;

-- ===== Clearance law — users.role (portals.md) =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
UPDATE users SET role = 'admin' WHERE role = 'user';  -- hệ thống 1 người: chủ sở hữu = admin

-- ===== DQO — kết quả check chất lượng (pipeline/sql/450 đổ vào) =====
CREATE TABLE IF NOT EXISTS dq_check_results (
  id         serial PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  check_name text NOT NULL,     -- occupancy-domain | listing-volume | adr-drift | not-null | freshness
  entity     text NOT NULL,     -- 'hanoi' | 'hcmc' | 'market_metrics' …
  status     text NOT NULL,     -- pass | fail | skip
  detail     text
);
CREATE INDEX IF NOT EXISTS dq_check_results_checked_at_idx ON dq_check_results (checked_at DESC);

-- ===== SPL — mã B ở tầng serving =====
-- market_metrics: mọi số hiện có tính từ dữ liệu tự thu
ALTER TABLE market_metrics ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'S01';

-- Đổi giá trị cũ sang mã
UPDATE area_sources SET source = 'S02' WHERE source = 'nguon-mau-cu-s02';
UPDATE sale_offers SET source = 'S03' WHERE source = 'mock';

-- ═════ 013_sale_offers_default_s03.sql ═════
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

-- ═════ 014_s03_agent_source.sql ═════
-- 014_s03_agent_source.sql — C2: đăng ký source_id 's03-agent' vào S03
-- (Agent ingest bridge — ADR-0006 sửa đổi). Coverage API + SLO nhận diện được.
UPDATE source_registry
SET source_ids = array_append(source_ids, 's03-agent')
WHERE code = 'S03' AND NOT ('s03-agent' = ANY (source_ids));

-- ═════ 015_listing_media.sql ═════
-- 015_listing_media.sql — E2 B1: ảnh + review count từ raw sẵn có (re-parse,
-- không thu thập lại). Photo URLs từ CDN muscache trong pdpSections/
-- deferredState; reviewCount từ reviewCount field.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_urls jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_count integer;

-- ═════ 016_s02_v2.sql ═════
-- 016_s02_v2.sql — E2 C1: S02 v2 submarket timeseries + future rates + listing LTM
-- (endpoint đã RE trong tài liệu nghiên cứu nội bộ về API listing của S02, survey 7-9)

-- Timeseries tháng của submarket (mirror bảng metrics cấp market của S02;
-- bảng submarket_metrics của S02 hiện là bảng registry quen tên — giữ nguyên)
CREATE TABLE IF NOT EXISTS airdna_sub_monthly (
  airdna_sub_id  text NOT NULL,
  metric         text NOT NULL,           -- adr | occupancy | revenue | revpar | listing_count
  period         text NOT NULL,           -- '2025-10'
  value          numeric,
  PRIMARY KEY (airdna_sub_id, metric, period)
);

-- future/rates: 163 ngày tương lai theo ngày (forward-looking — tự thu không có)
CREATE TABLE IF NOT EXISTS airdna_future_daily (
  airdna_sub_id         text NOT NULL,
  date                  date NOT NULL,
  booked_count          integer,
  available_count       integer,
  mean_booked_rate      numeric,
  median_booked_rate    numeric,
  mean_available_rate   numeric,
  median_available_rate numeric,
  occupancy             numeric,
  revpar                numeric,
  total_revenue         numeric,
  PRIMARY KEY (airdna_sub_id, date)
);

-- Listing-level LTM từ map_listings (+ enrich từ submarket listings).
-- id = 'abnb_<id listing S01>' — CÙNG khóa với listings.id để join thẳng.
CREATE TABLE IF NOT EXISTS airdna_listings (
  id                    text PRIMARY KEY,
  airdna_market_id      text,
  combined_market_id    text,             -- submarket id của listing
  title                 text,
  bedrooms              integer,
  bathrooms             numeric,
  rating_overall        numeric,
  rating_location       numeric,
  review_count          integer,
  revenue_ltm           numeric,          -- VND
  revenue_potential_ltm numeric,
  occupancy             numeric,          -- 0-1
  adr                   numeric,          -- VND
  price_tier            text,
  latitude              double precision,
  longitude             double precision,
  metrics               jsonb DEFAULT '{}',  -- giữ nguyên metrics raw để re-parse
  captured_at           timestamptz,
  first_seen            timestamptz DEFAULT now(),
  snapshot_id           text
);
CREATE INDEX IF NOT EXISTS airdna_listings_market_idx ON airdna_listings (airdna_market_id);
CREATE INDEX IF NOT EXISTS airdna_listings_combined_idx ON airdna_listings (combined_market_id);

-- ═════ 017_perf_indexes.sql ═════
-- 017_perf_indexes.sql — Perf-audit /ops (2026-10-20): các cột timestamp
-- dùng cho luồng ngày (getFlowDays GROUP BY với lọc >= since) đang seq-scan;
-- bảng listings của S02 43k+ tăng nhanh mỗi đêm rotation.
CREATE INDEX IF NOT EXISTS idx_airdna_listings_captured_at ON airdna_listings (captured_at);
CREATE INDEX IF NOT EXISTS idx_airdna_markets_captured_at ON airdna_markets (captured_at);
CREATE INDEX IF NOT EXISTS idx_listings_last_seen ON listings (last_seen);
CREATE INDEX IF NOT EXISTS idx_airbnb_snapshots_collected_at ON airbnb_snapshots (collected_at);
CREATE INDEX IF NOT EXISTS idx_stg_zalo_posts_captured_at ON stg_zalo_posts (captured_at);
CREATE INDEX IF NOT EXISTS idx_sale_offers_first_seen ON sale_offers (first_seen);

-- ═════ 018_ops_audit.sql ═════
-- 018_ops_audit.sql — C4 P3 (DCA): audit log mọi thao tác ghi ops (ops:write).
-- Actor là MÃ (machine token name / user id), không bao giờ tên nguồn tầng A.
CREATE TABLE IF NOT EXISTS ops_audit (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,            -- 'machine:cloud-sync' | 'user:<id>' | 'api:<token-name>'
  action text NOT NULL,           -- 'ops.ingest' | 's03.account.create' | ...
  env text NOT NULL DEFAULT 'local', -- 'local' | 'cloud'
  detail jsonb DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_ops_audit_at ON ops_audit (at DESC);

-- ═════ 019_s03_sender_media.sql ═════
-- 019_s03_sender_media.sql — G1 "căn giá tốt + liên hệ": giữ người đăng + ảnh.
-- PII tầng A: CHỈ máy local — bảng staging bài S03 không nằm trong FILL sync-cloud.
ALTER TABLE stg_zalo_posts
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_id text,
  ADD COLUMN IF NOT EXISTS conversation_id text,
  ADD COLUMN IF NOT EXISTS media jsonb;   -- [{path, url, type}] — file copy vào snapshot media/

-- ═════ 020_s02_listing_media.sql ═════
-- 020_s02_listing_media.sql — G1: ảnh + URL listing từ S02 submarket
-- listings endpoint (images[] là CDN muscache công khai — an toàn sync cloud).
ALTER TABLE airdna_listings ADD COLUMN IF NOT EXISTS photo_urls jsonb;
ALTER TABLE airdna_listings ADD COLUMN IF NOT EXISTS listing_url text;

-- ═════ PB2: cột, bảng, view mà route hôm nay đọc ═════
-- Tin bán / thuê dài hạn: loại hình, WC, toạ độ (cùng tên cột với bảng thật của kho chính).
ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS bathrooms numeric;
ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE sale_offers DROP CONSTRAINT IF EXISTS sale_offers_kind_chk;
ALTER TABLE sale_offers ADD CONSTRAINT sale_offers_kind_chk CHECK (kind IN ('sale', 'rent_lt'));

-- Căn (gộp tin) — tối thiểu để dựng thước CG8.
CREATE TABLE IF NOT EXISTS properties (
  id            bigserial PRIMARY KEY,
  area_id       text REFERENCES areas(id),
  property_type text,
  kind          text
);
CREATE TABLE IF NOT EXISTS property_offers (
  property_id bigint NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  offer_id    text NOT NULL REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, offer_id)
);
-- Thước CG8: trung vị giá/m² theo phường × loại hình, mỗi căn một phiếu (tin mới nhất), nhóm từ 5 căn.
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

-- Hạng giá mỗi tin (CG9): pipeline tính sẵn; có dòng thì căn giá tốt đọc bảng này, rỗng thì lùi thước CG8.
CREATE TABLE IF NOT EXISTS offer_price_rank (
  offer_id          text PRIMARY KEY REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  kind              text NOT NULL,
  property_type     text,
  bedrooms          integer,
  thuoc             text CHECK (thuoc IS NULL OR thuoc IN ('gia-m2', 'gia-thang-pn')),
  gia_tri           numeric,
  cap               text CHECK (cap IS NULL OR cap IN ('phuong', 'du_an', 'phan_khu', 'toa')),
  nut               text,
  pn_nhom           integer,
  n                 integer,
  trung_vi          numeric,
  p20               numeric,
  hang_pct          numeric(5,1),
  duoi_trung_vi_pct numeric(7,1),
  nhan              text CHECK (nhan IS NULL OR nhan IN ('re-trong-phuong', 'gia-tot')),
  can_xac_minh      boolean NOT NULL DEFAULT false,
  ly_do             text,
  computed_at       timestamptz NOT NULL DEFAULT now(),
  run_id            text NOT NULL
);

-- ═════ PB8: danh bạ nhà — bảng mà /v1/properties* đọc (hình cột, CHECK, khoá lấy từ DB thật: 026, 032, 045, 055, 059,
-- 061, 082, 088, 095, 096, 100, 103, 113, 117, 131 của kho chính). Bỏ trigger chỉ-thêm và khoá ngoại tới bảng không có trong
-- lược đồ mẫu (iso_regions, stacks): lược đồ mẫu chỉ để đọc thử. ═════
CREATE OR REPLACE FUNCTION assertion_value_key(p_value text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN btrim(p_value) ~ '^[0-9]+$' THEN (btrim(p_value)::numeric)::text ELSE lower(btrim(p_value)) END
$$;

CREATE TABLE IF NOT EXISTS asset_nodes (
  id           bigserial PRIMARY KEY,
  node_type    text NOT NULL CHECK (node_type IN ('project', 'subzone', 'building')),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  parent_id    bigint REFERENCES asset_nodes(id),
  aliases      text[] NOT NULL DEFAULT '{}',
  area_ids     text[] NOT NULL DEFAULT '{}',
  dd_field     text,
  meta         jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  catalog_tier text NOT NULL DEFAULT 'xac_minh' CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai'))
);
CREATE INDEX IF NOT EXISTS asset_nodes_parent_idx ON asset_nodes (parent_id);
CREATE INDEX IF NOT EXISTS asset_nodes_type_idx ON asset_nodes (node_type);

CREATE TABLE IF NOT EXISTS buildings (
  building_key   text PRIMARY KEY CHECK (building_key ~ '^bld_[0-9A-HJKMNP-TV-Z]{26}$'),
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into    text REFERENCES buildings(building_key),
  region_node_id bigint NOT NULL REFERENCES asset_nodes(id),
  upi            text NOT NULL UNIQUE,
  iso_region     text NOT NULL,
  catalog_tier   text NOT NULL CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT buildings_upi_khop_khoa CHECK (upi = 'urn:onehub:upi:1:VN:' || iso_region || ':' || building_key),
  CONSTRAINT buildings_upi_khuon CHECK (upi ~ '^urn:onehub:upi:1:VN:VN-[0-9A-Z]{2}:bld_[0-9A-HJKMNP-TV-Z]{26}$')
);
CREATE INDEX IF NOT EXISTS buildings_region_idx ON buildings (region_node_id);

CREATE TABLE IF NOT EXISTS units (
  unit_key     text PRIMARY KEY CHECK (unit_key ~ '^unt_[0-9A-HJKMNP-TV-Z]{26}$'),
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'merged', 'split', 'retired')),
  merged_into  text REFERENCES units(unit_key),
  building_key text NOT NULL REFERENCES buildings(building_key),
  stack_key    text,
  floor        text CHECK (floor ~ '^[0-9]+[A-Z]?$'),
  sub_id       text NOT NULL,
  catalog_tier text NOT NULL CHECK (catalog_tier IN ('xac_minh', 'suy_ra_manh', 'mot_loi_khai')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT units_sub_id_khop CHECK ((stack_key IS NOT NULL AND floor IS NOT NULL AND sub_id = stack_key || ':' || floor)
                                      OR (stack_key IS NULL AND sub_id = unit_key))
);
CREATE INDEX IF NOT EXISTS units_building_idx ON units (building_key);

CREATE TABLE IF NOT EXISTS registry_aliases (
  id         bigserial PRIMARY KEY,
  object_key text NOT NULL CHECK (object_key ~ '^((pty|prc|bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}|node:[0-9]+)$'),
  kind       text NOT NULL CHECK (kind IN ('tai_khoan_nguon', 'sdt_bam', 'ten', 'sdt', 'ma_nguon')),
  value      text NOT NULL CHECK (btrim(value) <> ''),
  source     text NOT NULL CHECK (source ~ '^S(0[1-9]|1[0-9])$'),
  first_seen timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz
);
CREATE INDEX IF NOT EXISTS registry_aliases_object_idx ON registry_aliases (object_key);

CREATE TABLE IF NOT EXISTS field_assertions (
  id             bigserial PRIMARY KEY,
  resource_name  text NOT NULL DEFAULT 'Property' CHECK (resource_name IN ('Property', 'Building', 'Stack', 'Unit')),
  subject_key    text NOT NULL CHECK (subject_key ~ '^[A-Z][A-Z0-9]{1,5}:.+$' OR subject_key ~ '^(bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$'),
  field          text NOT NULL CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status',
                   'street_number', 'unit_number', 'frontage_length', 'lot_size_dimensions', 'stories', 'latitude', 'longitude',
                   'builder_name', 'area_id', 'floor_raw', 'floor_band', 'project_node_id', 'subzone_node_id', 'living_area',
                   'building_area_total', 'direction_faces', 'lot_size_area', 'universal_property_id')),
  value          text NOT NULL,
  value_key      text GENERATED ALWAYS AS (assertion_value_key(value)) STORED,
  evidence_tier  text NOT NULL CHECK (evidence_tier IN ('fact', 'observed', 'inferred')),
  method         text NOT NULL CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy', 'registry_inherit')),
  method_version text,
  rule_id        text,
  evidence       jsonb NOT NULL DEFAULT '{}',
  observed_at    timestamptz NOT NULL,
  changed_by     text,
  run_id         text,
  created_at     timestamptz NOT NULL DEFAULT clock_timestamp(),
  retracted_at   timestamptz,
  retract_reason text
);
CREATE INDEX IF NOT EXISTS field_assertions_subject_idx ON field_assertions (subject_key, field) WHERE retracted_at IS NULL;

-- Trạng thái tin (DB thật: cột của sale_offer_records, CHECK 5 giá trị) — đếm tin đang rao trên toà.
ALTER TABLE sale_offers ADD COLUMN IF NOT EXISTS offer_status text
  CHECK (offer_status IN ('active', 'active_under_contract', 'closed', 'withdrawn', 'unknown'));

-- offer_building: CÙNG CỘT với view thật (117, 131: offer_id, status, muc, building_key, upi, subzone_node_id, n_posts), thân
-- rút gọn — chỉ nhánh «toà» từ phát biểu ghép toà trên bài S03; bỏ nhánh «phân khu» vì nó đọc bảng nguồn kho không có ở đây.
CREATE OR REPLACE VIEW offer_building AS
WITH phat_bieu AS (
  SELECT o.offer_id, p.post_id, f.value AS upi
    FROM sale_offers o
    CROSS JOIN LATERAL unnest(o.post_ids) p(post_id)
    JOIN field_assertions f ON f.subject_key = 'S03:' || p.post_id AND f.field = 'universal_property_id' AND f.retracted_at IS NULL
                           AND f.rule_id = ANY (ARRAY['ghep-toa-cot', 'ghep-toa-cot-chuan', 'ghep-toa-chu-model', 'ghep-toa-model'])
    JOIN buildings b ON b.upi = f.value AND b.status = 'active'
   WHERE o.source = 'S03'
), gom AS (
  SELECT offer_id, count(DISTINCT post_id)::int AS n_posts, array_agg(DISTINCT upi) AS upis FROM phat_bieu GROUP BY offer_id
)
SELECT g.offer_id,
       CASE WHEN cardinality(g.upis) = 1 THEN 'gan' ELSE 'xung_dot' END AS status,
       CASE WHEN cardinality(g.upis) = 1 THEN 'toa' END AS muc,
       CASE WHEN cardinality(g.upis) = 1 THEN b.building_key END AS building_key,
       CASE WHEN cardinality(g.upis) = 1 THEN b.upi END AS upi,
       NULL::bigint AS subzone_node_id,
       g.n_posts
  FROM gom g
  LEFT JOIN buildings b ON cardinality(g.upis) = 1 AND b.upi = g.upis[1];
