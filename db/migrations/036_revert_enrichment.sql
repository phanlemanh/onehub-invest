-- 036_revert_enrichment.sql — hậu kỳ enrich: hoàn tác một lượt áp qua đường audit
-- docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md §2.2 · _acceptance/enrich-hau-ky (AC-6)
-- KHÔNG sync cloud (PII tầng A) — enrichment_proposals, ops_audit chỉ ở DB local.
--
-- revert_enrichment là đường ghi NGƯỢC duy nhất của apply_enrichment (033): mỗi hiệu ứng
-- ghi của apply có đúng một hiệu ứng ngược ở đây (ma trận design §2.2). Chỉ người gọi được
-- (actor hitl:<tên>) và phải có lý do — LLM-off-data-path (AGENTS.md luật 7).
-- File idempotent.

ALTER TABLE enrichment_proposals ADD COLUMN IF NOT EXISTS reverted_by   text;
ALTER TABLE enrichment_proposals ADD COLUMN IF NOT EXISTS reverted_at   timestamptz;
ALTER TABLE enrichment_proposals ADD COLUMN IF NOT EXISTS revert_reason text;

-- 'reverted' = giá trị đã áp rồi bị người hoàn tác. Unique index của 033 giữ nguyên nên
-- luật không đẩy lại giá trị đã hoàn tác (giống 'rejected').
ALTER TABLE enrichment_proposals DROP CONSTRAINT IF EXISTS enrichment_proposals_status_check;
ALTER TABLE enrichment_proposals ADD CONSTRAINT enrichment_proposals_status_check CHECK (status IN
  ('queued', 'applied', 'rejected', 'superseded', 'skipped', 'reverted'));

CREATE OR REPLACE FUNCTION revert_enrichment(p_ids bigint[], p_actor text, p_reason text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  rid      bigint;
  r        record;
  cur      text;
  n        integer := 0;
  reverted jsonb := '[]'::jsonb;
  skipped  jsonb := '[]'::jsonb;
  reopened bigint[] := '{}';
  more     bigint[];
BEGIN
  IF p_actor IS NULL OR p_actor !~ '^hitl:.+' THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>), nhận: %', p_actor;
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'revert_enrichment: thiếu lý do hoàn tác';
  END IF;

  FOREACH rid IN ARRAY COALESCE(p_ids, '{}') LOOP
    SELECT * INTO r FROM enrichment_proposals WHERE id = rid FOR UPDATE;
    IF NOT FOUND THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'not-found');
      CONTINUE;
    END IF;
    IF r.status <> 'applied' THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'not-applied');
      CONTINUE;
    END IF;

    SELECT CASE r.field
             WHEN 'property_type' THEN o.property_type
             WHEN 'bedrooms'      THEN o.bedrooms::text
             WHEN 'bathrooms'     THEN o.bathrooms::text
             WHEN 'street_raw'    THEN o.street_raw
             WHEN 'block_raw'     THEN o.block_raw
           END
    INTO cur FROM sale_offers o WHERE o.offer_id = r.offer_id FOR UPDATE;
    -- Giá trị trên tin đã khác giá trị đã áp (người/luật khác sửa sau) → không đè.
    IF cur IS NULL OR lower(cur) <> r.value_key THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'value-changed');
      CONTINUE;
    END IF;

    -- Ngược của câu UPDATE sale_offers trong apply_enrichment: ô về «trống».
    CASE r.field
      WHEN 'property_type' THEN UPDATE sale_offers SET property_type = 'unknown' WHERE offer_id = r.offer_id;
      WHEN 'bedrooms'      THEN UPDATE sale_offers SET bedrooms   = NULL WHERE offer_id = r.offer_id;
      WHEN 'bathrooms'     THEN UPDATE sale_offers SET bathrooms  = NULL WHERE offer_id = r.offer_id;
      WHEN 'street_raw'    THEN UPDATE sale_offers SET street_raw = NULL WHERE offer_id = r.offer_id;
      WHEN 'block_raw'     THEN UPDATE sale_offers SET block_raw  = NULL WHERE offer_id = r.offer_id;
    END CASE;

    -- Ngược của cascade properties (033 chỉ COALESCE bedrooms/bathrooms/street): căn mất giá
    -- trị khi nó bằng đúng giá trị hoàn tác VÀ không offer nào khác của căn còn mang nó.
    -- properties.property_type do resolve-properties tính lại từ offer — không đụng ở đây.
    IF r.field = 'bedrooms' THEN
      UPDATE properties p SET bedrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = r.offer_id AND p.id = po.property_id AND p.bedrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offers o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bedrooms::text = r.value);
    ELSIF r.field = 'bathrooms' THEN
      UPDATE properties p SET bathrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = r.offer_id AND p.id = po.property_id AND p.bathrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offers o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bathrooms::text = r.value);
    ELSIF r.field = 'street_raw' THEN
      UPDATE properties p SET street = NULL
      FROM property_offers po
      WHERE po.offer_id = r.offer_id AND p.id = po.property_id AND lower(p.street) = r.value_key
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offers o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND lower(o.street_raw) = r.value_key);
    END IF;

    UPDATE properties p SET enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
      't', now(), 'src', 'enrich-revert', 'proposal_ids', jsonb_build_array(r.id),
      'actor', p_actor, 'reason', p_reason))
    FROM property_offers po
    WHERE po.offer_id = r.offer_id AND p.id = po.property_id;

    UPDATE enrichment_proposals SET
      status = 'reverted', reverted_by = p_actor, reverted_at = now(), revert_reason = p_reason
    WHERE id = r.id;

    -- Đề xuất bị giá trị này lấn (superseded) mở lại thành chờ duyệt: lượt enrich-run sau đưa
    -- lên thẻ cho người — không áp thẳng (ca 640/645: LLM «house» bị E1 «land» lấn).
    WITH up AS (
      UPDATE enrichment_proposals SET status = 'queued', route = 'review', review_id = NULL
      WHERE offer_id = r.offer_id AND field = r.field AND status = 'superseded'
      RETURNING id
    ) SELECT COALESCE(array_agg(id ORDER BY id), '{}') INTO more FROM up;
    reopened := reopened || more;

    reverted := reverted || jsonb_build_object(
      'id', r.id, 'offer_id', r.offer_id, 'field', r.field, 'value', r.value);
    n := n + 1;
  END LOOP;

  INSERT INTO ops_audit (actor, action, env, detail)
  VALUES (p_actor, 'enrich:revert', 'local', jsonb_build_object(
    'reason', p_reason, 'ids', to_jsonb(COALESCE(p_ids, '{}')), 'reverted', reverted,
    'skipped', skipped, 'reopened', to_jsonb(reopened)));

  RETURN n;
END $$;
