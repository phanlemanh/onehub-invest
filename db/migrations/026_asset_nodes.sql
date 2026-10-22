-- 026_asset_nodes.sql — G-1 R1: Project Registry — danh pháp "Dự án" 3 tầng
-- theo ADR-0011 Qđ 2 (Khu đô thị project → Phân khu subzone → Tòa building),
-- hai trục song song với areas (phường hành chính).
CREATE TABLE IF NOT EXISTS asset_nodes (
  id          bigserial PRIMARY KEY,
  node_type   text NOT NULL CHECK (node_type IN ('project','subzone','building')),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,          -- key kỹ thuật; tên chỉ là metadata
  parent_id   bigserial REFERENCES asset_nodes(id),
  aliases     text[] NOT NULL DEFAULT '{}',  -- NFC + lowercase (bài học parser)
  area_ids    text[] NOT NULL DEFAULT '{}',  -- phường phủ (mảng — đè nhiều phường)
  dd_field    text,                          -- SubdivisionName | ComplexName | null(extension)
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asset_nodes_type_idx ON asset_nodes(node_type);
CREATE INDEX IF NOT EXISTS asset_nodes_parent_idx ON asset_nodes(parent_id);

-- Seed R1: ~20 khu đô thị tiêu biểu HN + HCMC (nguồn: tên xuất hiện trong
-- dữ liệu stg + thị trường; area_ids = phường chính khu đè, có thể mở rộng).
INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta) VALUES
  -- Hà Nội
  ('project','Vinhomes Ocean Park 1','vinhomes-ocean-park-1',
   ARRAY['ocean park','vinhomes ocean park','vuong','vang danh']::text[],
   ARRAY['vn-hanoi-vy-le','vn-hanoi-vu-yen'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Vinhomes Ocean Park 2 (Vũ Yên)','vinhomes-ocean-park-2',
   ARRAY['ocean park 2','vu yen','vang danh 2']::text[],
   ARRAY['vn-hanoi-vu-yen'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Vinhomes Ocean Park 3 (Vũ Yên)','vinhomes-ocean-park-3',
   ARRAY['ocean park 3','vu yen 3']::text[],
   ARRAY['vn-hanoi-vu-yen'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Vinhomes Smart City','vinhomes-smart-city',
   ARRAY['smart city','tay ho tai']::text[],
   ARRAY['vn-hanoi-tay-ho-tay'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Vinhomes Riverside','vinhomes-riverside',
   ARRAY['riverside','phu thinh','long bien']::text[],
   ARRAY['vn-hanoi-phu-thinh'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Ecopark','ecopark',
   ARRAY['ecopark','van giang','xuan phu']::text[],
   ARRAY['vn-hanoi-xuan-phu'], 'SubdivisionName', '{"city":"hanoi","legal_note":"Hưng Yên (cũ) — sáp nhập Hà Nội 2025"}'),
  ('project','The Rainbow','the-rainbow',
   ARRAY['rainbow','van khe']::text[],
   ARRAY['vn-hanoi-van-khe'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','KDT Văn Khê','kdt-van-khe',
   ARRAY['van khe']::text[],
   ARRAY['vn-hanoi-van-khe'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Sun Grand Park 11','sun-grand-park-11',
   ARRAY['sun grand park']::text[],
   ARRAY['vn-hanoi-ngoai-giang-diem'], 'SubdivisionName', '{"city":"hanoi"}'),
  ('project','Masteri West Heights','masteri-west-heights',
   ARRAY['masteri west heights','masteri','tay ho tay']::text[],
   ARRAY['vn-hanoi-tay-ho-tay'], 'SubdivisionName', '{"city":"hanoi"}'),
  -- TP.HCM
  ('project','Vinhomes Central Park','vinhomes-central-park',
   ARRAY['central park','vinhomes binh thanh','landmark']::text[],
   ARRAY['vn-hcmc-binh-thanh'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Masteri Thảo Điền','masteri-thao-dien',
   ARRAY['masteri thao dien','thao dien']::text[],
   ARRAY['vn-hcmc-thao-dien'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Estella Heights','estella-heights',
   ARRAY['estella','an phu']::text[],
   ARRAY['vn-hcmc-an-phu'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','The Global City','the-global-city',
   ARRAY['global city','an phu','saigon riverside city']::text[],
   ARRAY['vn-hcmc-an-phu'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Empire City','empire-city',
   ARRAY['empire city','thu thiEM']::text[],
   ARRAY['vn-hcmc-an-loi-dong'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Vinhomes Grand Park','vinhomes-grand-park',
   ARRAY['grand park','quang trung','thu duc']::text[],
   ARRAY['vn-hcmc-long-truong','vn-hcmc-phuoc-long-b'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Celadon City','celadon-city',
   ARRAY['celadon','tan phu']::text[],
   ARRAY['vn-hcmc-hoa-thanh'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Phú Mỹ Hưng (Saigon South)','phu-my-hung',
   ARRAY['pmh','phu my hung','saigon south','s7','s10']::text[],
   ARRAY['vn-hcmc-tan-phong','vn-hcmc-binh-thuan','vn-hcmc-hung-phu'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Vinhomes Golden River','vinhomes-golden-river',
   ARRAY['golden river','ba son']::text[],
   ARRAY['vn-hcmc-ngo-gia-tu'], 'SubdivisionName', '{"city":"hcmc"}'),
  ('project','Saluto','saluto',
   ARRAY['saluto','the metropole thu thiem']::text[],
   ARRAY['vn-hcmc-binh-an'], 'SubdivisionName', '{"city":"hcmc"}')
ON CONFLICT (slug) DO NOTHING;

-- alias index cho matcher 2 tầng (G-2): tìm theo alias NFC-lower
CREATE INDEX IF NOT EXISTS asset_nodes_aliases_gin ON asset_nodes USING gin (aliases);
