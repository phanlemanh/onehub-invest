-- 024_source_groups.sql — Nguồn sự thật cấu hình NHÓM thu thập (H1) +
-- lifecycle registry hoàn chỉnh (H2).
--
-- Trước đây nhóm FB code cứng trong .mjs, regions Chợ Tốt code cứng — thêm/
-- xoá phải sửa code + deploy. Giờ một bảng cho mọi kênh quản trị được qua
-- /ops/sources admin (kênh Zalo giữ openclaw.json vì đã có web admin riêng).
-- AirDNA rotation đã tự quản từ airdna_markets (mẫu chuẩn) — không đổi.
--
-- PII: KHÔNG sync cloud (sync-cloud FILL không chứa bảng này).

CREATE TABLE IF NOT EXISTS source_groups (
  id          bigserial PRIMARY KEY,
  source_code text NOT NULL REFERENCES source_registry(code),
  group_key   text NOT NULL,          -- URL nhóm FB | city slug Chợ Tốt
  name        text NOT NULL,          -- tên hiển thị
  enabled     boolean NOT NULL DEFAULT true,
  params      jsonb NOT NULL DEFAULT '{}'::jsonb, -- vd {"region_v2":13000}
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_code, group_key)
);

-- H2: registry lifecycle — note vận hành (lý do pause, điều kiện bật lại)
ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS note text;

-- S04 OSM: nguồn one-time đã xong vai trò (snapshot cuối 2026-10-19, biên
-- giới hành chính tĩnh) — không retired (mã không tái dùng) nhưng completed.
UPDATE source_registry SET status = 'completed',
  note = 'nguồn one-time: biên giới OSM 34/34 tỉnh (ADR-0008); chạy lại chỉ khi tái phân cấp'
WHERE code = 'S04';

UPDATE source_registry SET
  note = 'paused 2026-10-21 chờ user chọn nhóm (dữ liệu 118 offers giữ nguyên). Bật lại: bootstrap ~/Library/LaunchAgents/com.oneinvest.apify-facebook.plist + UPDATE status=active'
WHERE code = 'S05';

-- Seed nhóm FB hiện có (từ GROUPS code cứng + groupTitle thật trong dữ liệu)
INSERT INTO source_groups (source_code, group_key, name, enabled, params) VALUES
  ('S05', 'https://www.facebook.com/groups/1642453779410701', 'HỘI MUA BÁN NHÀ ĐẤT QUẬN BÌNH THẠNH - TPHCM', true, '{"min_volume":"196 posts — nhiều nhất, phủ HCMC"}'),
  ('S05', 'https://www.facebook.com/groups/151411010405738', 'MUA BÁN CHUNG CƯ HÀ NỘI', true, '{}'),
  ('S05', 'https://www.facebook.com/groups/458803055236158', 'MUA BÁN NHÀ ĐẤT HÀ NỘI', false, '{"test_run":"chỉ 5 posts"}'),
  ('S05', 'https://www.facebook.com/groups/285736614961804', 'BẤT ĐỘNG SẢN HÀ NỘI', true, '{}'),
  ('S05', 'https://www.facebook.com/groups/1573989412657228', 'Nhóm user thêm 1573…', true, '{}')
ON CONFLICT (source_code, group_key) DO NOTHING;

-- Seed regions Chợ Tốt (feeds cg/st giữ trong code — kỹ thuật cố định)
INSERT INTO source_groups (source_code, group_key, name, enabled, params) VALUES
  ('S06', 'hanoi', 'Hà Nội', true, '{"region_v2":12000,"cityCode":"vn-hanoi"}'),
  ('S06', 'hcmc', 'TP Hồ Chí Minh', true, '{"region_v2":13000,"cityCode":"vn-hcmc"}')
ON CONFLICT (source_code, group_key) DO NOTHING;
