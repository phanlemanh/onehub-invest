-- 101_doi_soat_chuyen_link.sql — DA6 khoa-gop-can-khong-gia AC-9: đối soát đêm không làm căn mất link âm thầm.
-- Thay reconcile_stale_offers của 044 (cùng chữ ký, CREATE OR REPLACE thay tại chỗ; thân giữ nguyên trừ khối «Liên kết căn»).
-- Vì sao: sau 098 (UNIQUE property_offers.offer_id), 044 chép link của tin cũ x sang tin kế y bằng ON CONFLICT DO NOTHING rồi xoá
-- link của x — y đã gắn căn khác thì link của x mất không dấu vết. Nay link ấy chép trọn vào property_offer_unlinks (bảng của 098,
-- KHÔNG sync cloud) với lý do nêu mã y; tổng kết thêm khoá links_journaled. Idempotent: CREATE OR REPLACE. Không BEGIN/COMMIT.
-- Áp máy thu là lời riêng của Mạnh, sau 098, cùng lượt (hợp đồng, Out of scope).

CREATE OR REPLACE FUNCTION reconcile_stale_offers(p_source text, p_live text[], p_actor text)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  x          record;
  p          record;
  q          record;
  pc         record;
  y          text;
  card       bigint;
  ly_do      text;
  n_stale    integer := 0;
  moved      integer := 0;
  merged     integer := 0;
  reapplied  integer := 0;
  links      integer := 0;
  journaled  integer := 0;
  cands      integer := 0;
  kept       integer := 0;
  pairs      jsonb := '[]'::jsonb;
  r_offers   jsonb := '[]'::jsonb;
  reapply    bigint[];
  na         text;
  nb         text;
  summary    jsonb;
BEGIN
  IF p_live IS NULL OR cardinality(p_live) = 0 THEN
    RAISE EXCEPTION 'reconcile_stale_offers: lượt nạp rỗng — không đối soát nguồn %', p_source;
  END IF;

  FOR x IN
    SELECT o.* FROM sale_offer_records o
    WHERE o.source = p_source AND o.retired_at IS NULL AND NOT (o.offer_id = ANY (p_live))
    ORDER BY o.offer_id
    FOR UPDATE
  LOOP
    n_stale := n_stale + 1;
    ly_do := CASE WHEN x.originating_system_key IS NOT NULL
                   AND x.offer_id = 'offer_' || substr(encode(digest(p_source || '|' || x.originating_system_key, 'sha256'), 'hex'), 1, 16)
                  THEN 'het_trong_luot' ELSE 'doi_khoa' END;
    y := NULL;
    SELECT l.offer_id INTO y
    FROM sale_offer_records l
    WHERE l.source = p_source AND l.offer_id = ANY (p_live) AND l.post_ids && x.post_ids
    ORDER BY (SELECT count(*) FROM unnest(l.post_ids) u WHERE u = ANY (x.post_ids)) DESC, l.offer_id
    LIMIT 1;

    SELECT id INTO card FROM review_queue
    WHERE item_type = 'agent_output' AND item_id = 'enrich:' || x.offer_id AND status = 'pending';

    IF y IS NOT NULL THEN
      pairs := pairs || jsonb_build_object('from', x.offer_id, 'to', y, 'reason', ly_do);
      -- Đề xuất enrich (giữ nguyên luật 039).
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

      -- Thẻ enrich: đã quyết (không còn chờ) đi theo tin — chỉ mục duy nhất chỉ ràng thẻ chờ, nên đổi item_id không va.
      UPDATE review_queue SET item_id = 'enrich:' || y,
        evidence = CASE WHEN evidence ? 'offer_id' THEN jsonb_set(evidence, '{offer_id}', to_jsonb(y)) ELSE evidence END
      WHERE item_type = 'agent_output' AND item_id = 'enrich:' || x.offer_id AND status <> 'pending';

      -- Liên kết căn (101, DA6 AC-9): y đã gắn căn → giữ link của y (UNIQUE offer_id của 098), link của x chép trọn vào
      -- nhật ký khôi phục property_offer_unlinks trước khi gỡ — không còn mất âm thầm. y chưa gắn → chép sang y như 044.
      WITH j AS (
        INSERT INTO property_offer_unlinks (property_id, offer_id, score, signals, linked_at, reason)
        SELECT po.property_id, po.offer_id, po.score, po.signals, po.linked_at,
               'DA6 doi soat: tin ke ' || y || ' da gan can khac'
          FROM property_offers po
         WHERE po.offer_id = x.offer_id
           AND EXISTS (SELECT 1 FROM property_offers p2 WHERE p2.offer_id = y)
        RETURNING 1)
      SELECT journaled + count(*) INTO journaled FROM j;
      INSERT INTO property_offers (property_id, offer_id, score, signals, linked_at)
      SELECT po.property_id, y, po.score, po.signals, po.linked_at
        FROM property_offers po WHERE po.offer_id = x.offer_id
      ON CONFLICT DO NOTHING;
      WITH d AS (DELETE FROM property_offers WHERE offer_id = x.offer_id RETURNING 1)
      SELECT links + count(*) INTO links FROM d;

      -- Ứng viên ghép ĐÃ QUYẾT + thẻ pair: của nó. Cặp tự trỏ (bên kia chính là y) hoặc trùng cặp đã có → giữ ở x.
      FOR pc IN SELECT * FROM property_candidates
                WHERE (offer_a = x.offer_id OR offer_b = x.offer_id) AND status IN ('merged', 'rejected')
                ORDER BY id FOR UPDATE LOOP
        na := CASE WHEN pc.offer_a = x.offer_id THEN y ELSE pc.offer_a END;
        nb := CASE WHEN pc.offer_b = x.offer_id THEN y ELSE pc.offer_b END;
        IF na = nb THEN kept := kept + 1; CONTINUE; END IF;
        SELECT * INTO q FROM property_candidates
        WHERE (offer_a = na AND offer_b = nb) OR (offer_a = nb AND offer_b = na);
        IF FOUND THEN
          IF q.status IN ('merged', 'rejected') THEN kept := kept + 1; CONTINUE; END IF;
          -- Cặp mới còn chờ: quyết định người thắng — bỏ ứng viên chờ (không phải quyết định), chuyển ứng viên đã quyết.
          DELETE FROM property_candidates WHERE id = q.id;
          UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
            decision_note = 'cặp đã quyết từ ' || x.offer_id || ' chuyển sang'
          WHERE item_type = 'entity_match' AND status = 'pending'
            AND item_id IN ('pair:' || q.offer_a || '|' || q.offer_b, 'pair:' || q.offer_b || '|' || q.offer_a);
        END IF;
        UPDATE property_candidates SET offer_a = na, offer_b = nb WHERE id = pc.id;
        UPDATE review_queue SET item_id = 'pair:' || na || '|' || nb
        WHERE item_type = 'entity_match' AND item_id = 'pair:' || pc.offer_a || '|' || pc.offer_b
          AND NOT (status = 'pending' AND EXISTS (SELECT 1 FROM review_queue r2 WHERE r2.item_type = 'entity_match'
                   AND r2.item_id = 'pair:' || na || '|' || nb AND r2.status = 'pending'));
        cands := cands + 1;
      END LOOP;

      UPDATE sale_offer_records SET superseded_by = y WHERE offer_id = x.offer_id;
    ELSE
      r_offers := r_offers || jsonb_build_object('offer_id', x.offer_id, 'reason', ly_do, 'enriched', jsonb_build_object(
        'property_type', x.property_type, 'bedrooms', x.bedrooms, 'bathrooms', x.bathrooms,
        'street_raw', x.street_raw, 'block_raw', x.block_raw),
        'proposals', (SELECT count(*) FROM enrichment_proposals WHERE offer_id = x.offer_id),
        'property_ids', COALESCE((SELECT jsonb_agg(property_id ORDER BY property_id) FROM property_offers WHERE offer_id = x.offer_id), '[]'::jsonb),
        'candidates', COALESCE((SELECT jsonb_agg(id ORDER BY id) FROM property_candidates
                                WHERE offer_a = x.offer_id OR offer_b = x.offer_id), '[]'::jsonb));
      IF card IS NOT NULL THEN
        UPDATE review_queue SET status = 'deferred', decided_by = p_actor, decided_at = now(),
          decision_note = 'tin không còn trong lượt nạp — đề xuất giữ ở tin đã nghỉ, gỡ khi tin quay lại'
        WHERE id = card;
      END IF;
    END IF;

    UPDATE sale_offer_records SET retired_at = now(), retired_reason = ly_do WHERE offer_id = x.offer_id;
  END LOOP;

  summary := jsonb_build_object('source', p_source, 'stale', n_stale, 'moved', moved, 'merged', merged,
    'reapplied', reapplied, 'links', links, 'links_journaled', journaled, 'candidates', cands, 'kept', kept, 'pairs', pairs);
  IF n_stale > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'enrich:reconcile', 'local', summary);
  END IF;
  IF jsonb_array_length(r_offers) > 0 THEN
    INSERT INTO ops_audit (actor, action, env, detail) VALUES (p_actor, 'offer:retire', 'local',
      jsonb_build_object('source', p_source, 'offers', r_offers));
  END IF;
  RETURN summary;
END $$;
