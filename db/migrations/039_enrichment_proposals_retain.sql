-- 039_enrichment_proposals_retain.sql — hậu kỳ enrich: đề xuất sống qua lần nạp lại S03/S05
-- docs/superpowers/specs/2026-10-23-enrich-hau-ky-design.md §2.1 · _acceptance/enrich-hau-ky (AC-1…AC-5)
-- KHÔNG sync cloud (PII tầng A) — enrichment_proposals, ops_audit, review_queue chỉ ở DB local.
-- Cần 036 (trạng thái 'reverted') áp trước.
--
-- Trước đây transform DELETE toàn nguồn rồi INSERT lại; khoá ngoại CASCADE (033) xoá sạch đề
-- xuất + công duyệt mỗi lần nạp. Nay transform upsert (pipeline/lib/write-offers.mjs) rồi gọi
-- reconcile_stale_offers cho các offer không còn trong lượt. Khoá ngoại thành RESTRICT: đường
-- xoá nào chưa đối soát thì gãy có tiếng thay vì lặng lẽ xoá công duyệt.
-- File idempotent.

ALTER TABLE enrichment_proposals DROP CONSTRAINT IF EXISTS enrichment_proposals_offer_id_fkey;
ALTER TABLE enrichment_proposals ADD CONSTRAINT enrichment_proposals_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES sale_offers(offer_id) ON DELETE RESTRICT;

-- Hạng «đã quyết» khi hai đề xuất trùng khoá gặp nhau ở offer kế (AC-3): quyết định của
-- người/luật (applied, rejected, reverted) thắng trạng thái còn mở.
CREATE OR REPLACE FUNCTION enrichment_status_rank(p_status text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_status IN ('applied', 'rejected', 'reverted') THEN 2 ELSE 1 END
$$;

-- Đối soát offer cũ (cùng nguồn, không có trong p_live) trước khi xoá chúng:
--   có offer kế (offer sống chung post_id nhiều nhất, hoà → offer_id nhỏ nhất)
--     → chuyển đề xuất giữ trạng thái; trùng khoá → giữ dòng đã quyết hơn (ngang → dòng của Y);
--       đề xuất applied đã chuyển → áp lại fill-gap qua apply_enrichment;
--       thẻ chờ enrich:X → enrich:Y, hoặc 'deferred' khi Y đã có thẻ chờ (đề xuất thành «lỏng»,
--       lượt enrich-run sau gắn vào thẻ của Y);
--   không offer kế → xoá đề xuất TƯỜNG MINH, ảnh chụp ở ops_audit enrich:retire (bỏ evidence.text,
--     không cột người bán) để khôi phục khi tin quay lại; thẻ chờ → 'rejected'.
-- Rồi xoá offer cũ. Mọi ghi là luật xác định + audit (LLM-off-data-path).
CREATE OR REPLACE FUNCTION reconcile_stale_offers(p_source text, p_live text[], p_actor text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  x         record;
  p         record;
  q         record;
  y         text;
  card      bigint;
  n_stale   integer := 0;
  moved     integer := 0;
  merged    integer := 0;
  reapplied integer := 0;
  retired   integer := 0;
  pairs     jsonb := '[]'::jsonb;
  r_offers  jsonb := '[]'::jsonb;
  r_props   jsonb := '[]'::jsonb;
  reapply   bigint[];
  summary   jsonb;
BEGIN
  IF p_live IS NULL OR cardinality(p_live) = 0 THEN
    RAISE EXCEPTION 'reconcile_stale_offers: lượt nạp rỗng — không đối soát nguồn %', p_source;
  END IF;

  FOR x IN
    SELECT o.* FROM sale_offers o
    WHERE o.source = p_source AND NOT (o.offer_id = ANY (p_live))
    ORDER BY o.offer_id
    FOR UPDATE
  LOOP
    n_stale := n_stale + 1;
    y := NULL;
    SELECT l.offer_id INTO y
    FROM sale_offers l
    WHERE l.source = p_source AND l.offer_id = ANY (p_live) AND l.post_ids && x.post_ids
    ORDER BY (SELECT count(*) FROM unnest(l.post_ids) u WHERE u = ANY (x.post_ids)) DESC, l.offer_id
    LIMIT 1;

    SELECT id INTO card FROM review_queue
    WHERE item_type = 'agent_output' AND item_id = 'enrich:' || x.offer_id AND status = 'pending';

    IF y IS NOT NULL THEN
      pairs := pairs || jsonb_build_object('from', x.offer_id, 'to', y);
      reapply := '{}';
      FOR p IN SELECT * FROM enrichment_proposals WHERE offer_id = x.offer_id ORDER BY id FOR UPDATE LOOP
        SELECT * INTO q FROM enrichment_proposals
        WHERE offer_id = y AND field = p.field AND value_key = p.value_key AND source = p.source;
        IF FOUND THEN
          merged := merged + 1;
          IF enrichment_status_rank(p.status) > enrichment_status_rank(q.status) THEN
            DELETE FROM enrichment_proposals WHERE id = q.id;
          ELSE
            DELETE FROM enrichment_proposals WHERE id = p.id;
            CONTINUE;
          END IF;
        END IF;
        IF p.status = 'applied' THEN
          -- Áp lại lên Y qua đường ghi duy nhất (033): đặt lại queued rồi apply_enrichment.
          UPDATE enrichment_proposals SET offer_id = y, status = 'queued' WHERE id = p.id;
          reapply := reapply || p.id;
        ELSE
          UPDATE enrichment_proposals SET offer_id = y WHERE id = p.id;
        END IF;
        moved := moved + 1;
      END LOOP;
      IF cardinality(reapply) > 0 THEN
        reapplied := reapplied + apply_enrichment(reapply, p_actor);
      END IF;

      IF card IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM review_queue WHERE item_type = 'agent_output'
                   AND item_id = 'enrich:' || y AND status = 'pending') THEN
          UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
            decision_note = 'tin đã sửa — đề xuất chuyển sang ' || y
          WHERE id = card;
        ELSE
          UPDATE review_queue SET item_id = 'enrich:' || y,
            title = replace(title, x.offer_id, y),
            evidence = jsonb_set(evidence, '{offer_id}', to_jsonb(y))
          WHERE id = card;
        END IF;
      END IF;
    ELSE
      r_offers := r_offers || jsonb_build_object('offer_id', x.offer_id, 'enriched', jsonb_build_object(
        'property_type', x.property_type, 'bedrooms', x.bedrooms, 'bathrooms', x.bathrooms,
        'street_raw', x.street_raw, 'block_raw', x.block_raw));
      r_props := r_props || COALESCE((
        SELECT jsonb_agg((to_jsonb(ep) - 'evidence') || jsonb_build_object('evidence', ep.evidence - 'text') ORDER BY ep.id)
        FROM enrichment_proposals ep WHERE ep.offer_id = x.offer_id), '[]'::jsonb);
      WITH d AS (DELETE FROM enrichment_proposals WHERE offer_id = x.offer_id RETURNING 1)
      SELECT retired + count(*) INTO retired FROM d;
      IF card IS NOT NULL THEN
        UPDATE review_queue SET status = 'rejected', decided_by = p_actor, decided_at = now(),
          decision_note = 'tin không còn trong lượt nạp — đề xuất lưu ở ops_audit enrich:retire'
        WHERE id = card;
      END IF;
    END IF;
  END LOOP;

  DELETE FROM sale_offers WHERE source = p_source AND NOT (offer_id = ANY (p_live));

  summary := jsonb_build_object('source', p_source, 'stale', n_stale, 'moved', moved, 'merged', merged,
    'reapplied', reapplied, 'retired', retired, 'pairs', pairs);
  IF n_stale > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'enrich:reconcile', 'local', summary);
  END IF;
  IF jsonb_array_length(r_offers) > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'enrich:retire', 'local',
      jsonb_build_object('source', p_source, 'offers', r_offers, 'proposals', r_props));
  END IF;
  RETURN summary;
END $$;
