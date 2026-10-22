-- 029_review_queue.sql — HITL Review Queue (/ops/review)
-- docs/research/hitl-review-queue.md — user duyệt 22/10
-- Generic: entity_match | source_decision | agent_output | ...
-- KHÔNG sync cloud (chứa PII tầng A trong evidence).

CREATE TABLE IF NOT EXISTS review_queue (
  id            bigserial PRIMARY KEY,
  item_type     text NOT NULL CHECK (item_type IN (
    'entity_match', 'source_decision', 'agent_output', 'data_quality'
  )),
  item_id       text NOT NULL,             -- vd "pair:offer_a|offer_b"
  title         text NOT NULL,
  evidence      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_suggestion text,                      -- 'yes' | 'no' | 'unsure' | null
  ai_reasoning  text,
  ai_confidence numeric,
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'deferred')),
  decided_by    text,
  decided_at    timestamptz,
  decision_note text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_queue_status_idx ON review_queue(status, item_type);
CREATE UNIQUE INDEX IF NOT EXISTS review_queue_item_uq ON review_queue(item_type, item_id)
  WHERE status = 'pending';  -- 1 item pending duy nhất per (type, item)

-- Seed: 12 cặp needs_llm từ property_candidates → review_queue
INSERT INTO review_queue (item_type, item_id, title, evidence, ai_suggestion, ai_confidence)
SELECT
  'entity_match',
  'pair:' || pc.offer_a || '|' || pc.offer_b,
  'Cùng căn? ' ||
    COALESCE(oa.phuong_raw, '?') || ' ' ||
    COALESCE(oa.area_m2, 0) || 'm² ↔ ' ||
    COALESCE(ob.area_m2, 0) || 'm² ' ||
    '(score ' || pc.score || ')',
  jsonb_build_object(
    'offer_a', jsonb_build_object(
      'offer_id', oa.offer_id,
      'source', oa.source,
      'price_vnd', oa.price_vnd,
      'area_m2', oa.area_m2,
      'price_perm2', oa.price_perm2,
      'bedrooms', oa.bedrooms,
      'phuong', oa.phuong_raw,
      'property_type', oa.property_type,
      'text', (SELECT left(z.text, 300) FROM stg_zalo_posts z
               WHERE z.post_id = ANY(oa.post_ids)
               ORDER BY z.captured_at DESC LIMIT 1)
    ),
    'offer_b', jsonb_build_object(
      'offer_id', ob.offer_id,
      'source', ob.source,
      'price_vnd', ob.price_vnd,
      'area_m2', ob.area_m2,
      'price_perm2', ob.price_perm2,
      'bedrooms', ob.bedrooms,
      'phuong', ob.phuong_raw,
      'property_type', ob.property_type,
      'subject', (SELECT left(s.subject, 200) FROM stg_chotot_ads s
                  WHERE 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16) = ob.offer_id
                  LIMIT 1)
    ),
    'stage_b_score', pc.score
  ),
  NULL,  -- AI suggestion sẽ fill khi judge chạy
  pc.score
FROM property_candidates pc
JOIN sale_offers oa ON oa.offer_id = pc.offer_a
JOIN sale_offers ob ON ob.offer_id = pc.offer_b
WHERE pc.status = 'needs_llm'
ON CONFLICT DO NOTHING;
