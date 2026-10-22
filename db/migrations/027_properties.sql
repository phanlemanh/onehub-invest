-- 027_properties.sql — G-2: Entity core "MỘT CĂN NHÀ"
-- (docs/research/unified-property-pipeline.md)
--
-- properties = căn nhà thực (canonical entity); sale_offers/listings là
-- EVIDENCE từ các nguồn gắn vào. Resolution: Stage A/B deterministic
-- (resolve-properties.mjs, chạy hằng đêm sau refresh); LLM judge chỉ
-- phán quyết cặp 0.4–0.7 (G-3). KHÔNG sync cloud (derived local).
CREATE TABLE IF NOT EXISTS properties (
  id             bigserial PRIMARY KEY,
  geo            geography(Point, 4326),     -- từ S06 (phủ 99.98%)
  area_id        text REFERENCES areas(id), -- phường (hành chính)
  project_node   bigint REFERENCES asset_nodes(id),
  property_type  text,                       -- theo CHECK sale_offers
  kind           text,                       -- sale | rent_lt (đa số căn 1 kind)
  cluster_key    text,                       -- khoá deterministic (grid geo)
  n_evidence     int NOT NULL DEFAULT 0,
  first_seen     timestamptz,
  last_seen      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_by    text NOT NULL DEFAULT 'stage-ab'  -- stage-ab | llm-judge | manual
);
CREATE INDEX IF NOT EXISTS properties_cluster_idx ON properties(cluster_key);
CREATE INDEX IF NOT EXISTS properties_area_idx ON properties(area_id, kind, property_type);

-- Link evidence → property (mỗi offer thuộc nhiều nhất 1 property)
CREATE TABLE IF NOT EXISTS property_offers (
  property_id bigint NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  offer_id    text NOT NULL REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  score       numeric,                -- điểm Stage B khi gộp
  signals     jsonb NOT NULL DEFAULT '{}'::jsonb, -- {geo:1,price:1,...}
  linked_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, offer_id)
);
CREATE INDEX IF NOT EXISTS property_offers_offer_idx ON property_offers(offer_id);

-- Cặp ứng viên chéo tầng (P1↔P2) chờ phán quyết — Stage A sinh, G-3 judge
CREATE TABLE IF NOT EXISTS property_candidates (
  id          bigserial PRIMARY KEY,
  offer_a     text NOT NULL REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  offer_b     text NOT NULL REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  score       numeric NOT NULL,
  signals     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','merged','rejected','needs_llm')),
  decided_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_a, offer_b)
);
