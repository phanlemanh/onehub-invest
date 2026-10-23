-- 033_enrichment_proposals.sql — M-3 sửa: enrichment qua đề xuất (LLM-off-data-path)
-- docs/superpowers/specs/2026-10-22-enrich-qua-de-xuat-design.md · ROADMAP §1 luật 2
-- KHÔNG sync cloud (PII tầng A — evidence chứa đoạn tin gốc).
--
-- Mọi giá trị enrichment (E1 luật, E2 LLM) là một ĐỀ XUẤT. Chỉ hai hàm dưới
-- được ghi sale_offers/properties:
--   apply_enrichment          — fill-gap (giá trị cũ thắng) + cascade properties
--   decide_enrichment_review  — người duyệt thẻ agent_output ở /ops/review
-- Dùng chung cho agent/scripts/enrich-run.ts và route decide của app.
-- File idempotent.

CREATE TABLE IF NOT EXISTS enrichment_proposals (
  id              bigserial PRIMARY KEY,
  run_id          text NOT NULL,
  offer_id        text NOT NULL REFERENCES sale_offers(offer_id) ON DELETE CASCADE,
  field           text NOT NULL CHECK (field IN
                    ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw')),
  value           text NOT NULL,
  value_key       text NOT NULL,   -- lower(value): so trùng không phân biệt hoa thường
  source          text NOT NULL CHECK (source IN ('e1_rule', 'e2_llm')),
  route           text NOT NULL CHECK (route IN ('direct', 'corroborated', 'review', 'superseded')),
  corroborated_by text,            -- 'e1' | 'asset_nodes:<slug>'
  confidence      numeric,         -- chỉ để người đọc — KHÔNG BAO GIỜ là căn cứ áp
  model           text,
  trace_path      text,
  evidence        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'queued' CHECK (status IN
                    ('queued', 'applied', 'rejected', 'superseded', 'skipped')),
  review_id       bigint REFERENCES review_queue(id) ON DELETE SET NULL,
  decided_by      text,
  applied_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Chạy lại không nhân đề xuất; giá trị đã bác (khác hoa thường vẫn tính trùng) không bị đẩy lại.
CREATE UNIQUE INDEX IF NOT EXISTS enrichment_proposals_uq
  ON enrichment_proposals (offer_id, field, value_key, source);
CREATE INDEX IF NOT EXISTS enrichment_proposals_review_idx
  ON enrichment_proposals (review_id) WHERE status = 'queued';

-- ── Áp đề xuất: fill-gap từng field; ô đã có giá trị → skipped ──
CREATE OR REPLACE FUNCTION apply_enrichment(p_ids bigint[], p_actor text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  r       record;
  ok      boolean;
  n       integer := 0;
  applied bigint[] := '{}';
BEGIN
  FOR r IN
    SELECT * FROM enrichment_proposals
    WHERE id = ANY (p_ids) AND status = 'queued'
    ORDER BY id
    FOR UPDATE
  LOOP
    CASE r.field
      WHEN 'property_type' THEN
        UPDATE sale_offers SET property_type = r.value
        WHERE offer_id = r.offer_id AND (property_type IS NULL OR property_type = 'unknown');
      WHEN 'bedrooms' THEN
        UPDATE sale_offers SET bedrooms = r.value::int
        WHERE offer_id = r.offer_id AND bedrooms IS NULL;
      WHEN 'bathrooms' THEN
        UPDATE sale_offers SET bathrooms = r.value::int
        WHERE offer_id = r.offer_id AND bathrooms IS NULL;
      WHEN 'street_raw' THEN
        UPDATE sale_offers SET street_raw = r.value
        WHERE offer_id = r.offer_id AND street_raw IS NULL;
      WHEN 'block_raw' THEN
        UPDATE sale_offers SET block_raw = r.value
        WHERE offer_id = r.offer_id AND block_raw IS NULL;
    END CASE;
    ok := FOUND;

    UPDATE enrichment_proposals SET
      status     = CASE WHEN ok THEN 'applied' ELSE 'skipped' END,
      applied_at = CASE WHEN ok THEN now() END,
      decided_by = COALESCE(decided_by, p_actor)
    WHERE id = r.id;

    IF ok THEN
      n := n + 1;
      applied := applied || r.id;
    END IF;
  END LOOP;

  -- Cascade: properties liên kết nhận field còn trống + một dòng enrichment_log.
  -- Offer không gắn property nào → không có dòng nào ở đây, không lỗi.
  IF n > 0 THEN
    UPDATE properties p SET
      bedrooms  = COALESCE(p.bedrooms, agg.bedrooms),
      bathrooms = COALESCE(p.bathrooms, agg.bathrooms),
      street    = COALESCE(p.street, agg.street),
      enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
        't', now(), 'src', 'enrich-proposals',
        'proposal_ids', to_jsonb(agg.ids), 'actor', p_actor))
    FROM (
      SELECT po.property_id,
             max(o.bedrooms)   AS bedrooms,
             max(o.bathrooms)  AS bathrooms,
             max(o.street_raw) AS street,
             array_agg(DISTINCT ep.id ORDER BY ep.id) AS ids
      FROM enrichment_proposals ep
      JOIN sale_offers o      ON o.offer_id = ep.offer_id
      JOIN property_offers po ON po.offer_id = ep.offer_id
      WHERE ep.id = ANY (applied)
      GROUP BY po.property_id
    ) agg
    WHERE p.id = agg.property_id;
  END IF;

  RETURN n;
END $$;

-- ── Người quyết một thẻ agent_output (route decide gọi trong transaction của nó) ──
-- Không đụng review_queue.status — route làm việc đó.
CREATE OR REPLACE FUNCTION decide_enrichment_review(p_review_id bigint, p_status text, p_actor text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  n integer := 0;
BEGIN
  IF p_status = 'approved' THEN
    RETURN apply_enrichment(ARRAY(
      SELECT id FROM enrichment_proposals
      WHERE review_id = p_review_id AND status = 'queued'), p_actor);
  ELSIF p_status = 'rejected' THEN
    UPDATE enrichment_proposals SET status = 'rejected', decided_by = p_actor
    WHERE review_id = p_review_id AND status = 'queued';
    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n;
  ELSIF p_status = 'deferred' THEN
    RETURN 0;  -- đề xuất giữ queued; lượt enrich sau gắn sang thẻ chờ mới
  END IF;
  RAISE EXCEPTION 'decide_enrichment_review: status không hợp lệ: %', p_status;
END $$;
