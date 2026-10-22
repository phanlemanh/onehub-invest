-- 028_user_memory.sql — M1: bộ nhớ cá nhân agent (agent-memory-survey.md)
-- 3 lớp Postgres-first: episodic (events) → semantic (profile bi-temporal)
-- → procedural (routines, làm sau). KHÔNG sync cloud (PII tầng A).
-- ADR-0012 §6; ROADMAP v4 §3.6.

-- LỚP 1 — EPISODIC: mọi events user (view, save, compare, G3 inputs)
CREATE TABLE IF NOT EXISTS user_events (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'view_market', 'view_listing', 'saved_market', 'saved_listing',
    'compare', 'dau_tu_input', 'advisor_msg', 'deal_click', 'feedback'
  )),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'advisor')),
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_events_user_idx ON user_events(user_id, at DESC);
CREATE INDEX IF NOT EXISTS user_events_kind_idx ON user_events(kind);

-- LỚP 2 — SEMANTIC: hồ sơ bền, bi-temporal (fact mới đóng cũ, KHÔNG xoá)
CREATE TABLE IF NOT EXISTS user_profile (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (key IN (
    'budget_vnd', 'equity_pct', 'target_cities', 'property_prefs',
    'goal', 'risk_appetite', 'market_interest', 'deal_preferences'
  )),
  value jsonb NOT NULL,
  source text NOT NULL CHECK (source IN ('declared', 'behavior', 'feedback')),
  evidence_event_ids bigint[] NOT NULL DEFAULT '{}',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  PRIMARY KEY (user_id, key, valid_from)
);
CREATE INDEX IF NOT EXISTS user_profile_active_idx
  ON user_profile(user_id) WHERE valid_to IS NULL;

-- Seed: episodic từ saved_markets (hồ sơ sở thích thị trường có sẵn)
INSERT INTO user_events (user_id, kind, payload)
SELECT user_id, 'saved_market', jsonb_build_object('area_id', area_id)
FROM saved_markets ON CONFLICT DO NOTHING;
