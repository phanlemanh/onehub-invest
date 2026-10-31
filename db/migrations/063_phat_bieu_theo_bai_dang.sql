-- 063_phat_bieu_theo_bai_dang.sql — hàng phat-bieu-db-do-tren-main: áp/hoàn tác đề xuất phân xử lại mọi tin chung post
-- docs/superpowers/specs/2026-10-31-phat-bieu-db-do-tren-main-design.md · _acceptance/phat-bieu-db-do-tren-main/
-- Phát biểu (trừ legacy) đi theo post sang mọi tin chung post (PL15 §3.1) — resolve_offer_fields đúng như vậy, nhưng
-- apply_enrichment (059) và revert_enrichment (045) chỉ phân xử lại tin của đề xuất, nên tin chung post giữ cột cũ.
-- Chỉ CREATE OR REPLACE FUNCTION + mục 4 sửa dữ liệu một lần (idempotent). Bộ nạp test (pipeline/lib/nap-045.mjs) nạp
-- lại phần hàm (mục 1–3, trước mục 4 sửa dữ liệu) sau 059.

-- 1. Mọi bản ghi tin (kể cả đã nghỉ) có chủ thể giao với tập cho trước.
CREATE OR REPLACE FUNCTION offers_chung_chu_the(p_subjects text[])
RETURNS text[] LANGUAGE sql STABLE AS $$
  SELECT coalesce(array_agg(offer_id ORDER BY offer_id), '{}')
    FROM sale_offer_records
   WHERE cardinality(coalesce(p_subjects, '{}')) > 0
     AND offer_subject_keys(source, originating_system_key, post_ids) && p_subjects
$$;

-- 2. apply_enrichment — nguyên thân 059, chỉ đổi tập tin đưa vào phân xử.
CREATE OR REPLACE FUNCTION apply_enrichment(p_ids bigint[], p_actor text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  r       record;
  subj    text;
  cur     text;
  ok      boolean;
  n       integer := 0;
  offers  text[] := '{}';
  subjs   text[] := '{}';
  applied bigint[] := '{}';
  nguoi   boolean;
  ai      text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;
  FOR r IN
    SELECT ep.*, o.source AS o_source, coalesce(o.originating_system_key, o.post_ids[1]) AS osk
      FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id
     WHERE ep.id = ANY (p_ids) AND ep.status = 'queued'
     ORDER BY ep.id
       FOR UPDATE OF ep
  LOOP
    IF r.osk IS NULL THEN
      RAISE EXCEPTION 'apply_enrichment: tin % thiếu originating_system_key và post_ids (PL14) — không treo được phát biểu', r.offer_id;
    END IF;
    subj := r.o_source || ':' || r.osk;
    nguoi := coalesce(p_actor, '') LIKE 'hitl:%' OR coalesce(r.decided_by, '') LIKE 'hitl:%';
    ai := CASE WHEN coalesce(p_actor, '') LIKE 'hitl:%' THEN p_actor ELSE r.decided_by END;
    IF nguoi THEN
      UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'hitl-thay'
       WHERE subject_key = subj AND field = r.field AND method = 'hitl' AND retracted_at IS NULL
         AND value_key <> assertion_value_key(r.value);
    END IF;
    INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, evidence,
                                  changed_by, run_id, observed_at)
    VALUES (subj, r.field, r.value,
            CASE WHEN nguoi THEN 'fact' ELSE 'observed' END,
            CASE WHEN nguoi THEN 'hitl' ELSE r.source END,
            r.model, r.evidence || jsonb_build_object('proposal_id', r.id, 'route', r.route),
            CASE WHEN nguoi THEN ai END, r.run_id, r.created_at)
    ON CONFLICT DO NOTHING;
    offers := offers || r.offer_id;
    subjs := subjs || subj;
  END LOOP;

  IF cardinality(offers) = 0 THEN
    RETURN 0;
  END IF;
  -- 063: phát biểu đi theo post — phân xử lại mọi bản ghi tin chung chủ thể, không chỉ tin của đề xuất.
  PERFORM resolve_offer_fields(offers || offers_chung_chu_the(subjs));

  FOR r IN SELECT * FROM enrichment_proposals WHERE id = ANY (p_ids) AND status = 'queued' ORDER BY id LOOP
    SELECT CASE r.field
             WHEN 'property_type' THEN o.property_type
             WHEN 'bedrooms'      THEN o.bedrooms::text
             WHEN 'bathrooms'     THEN o.bathrooms::text
             WHEN 'street_raw'    THEN o.street_raw
             WHEN 'block_raw'     THEN o.block_raw
           END
      INTO cur FROM sale_offer_records o WHERE o.offer_id = r.offer_id;
    ok := cur IS NOT NULL AND assertion_value_key(cur) = assertion_value_key(r.value);
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

  -- Cascade: properties liên kết nhận field còn trống + một dòng enrichment_log (nguyên 033).
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


-- 3. revert_enrichment — nguyên thân 045, chỉ đổi tập tin đưa vào phân xử.
CREATE OR REPLACE FUNCTION revert_enrichment(p_ids bigint[], p_actor text, p_reason text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  rid      bigint;
  r        record;
  subj     text;
  n_rut    integer;
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
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;
  FOREACH rid IN ARRAY COALESCE(p_ids, '{}') LOOP
    SELECT ep.*, o.source AS o_source, coalesce(o.originating_system_key, o.post_ids[1]) AS osk INTO r
      FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id
     WHERE ep.id = rid FOR UPDATE OF ep;
    IF NOT FOUND THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'not-found');
      CONTINUE;
    END IF;
    IF r.status <> 'applied' THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'not-applied');
      CONTINUE;
    END IF;
    subj := r.o_source || ':' || r.osk;
    -- Phát biểu do chính đề xuất sinh ra; đề xuất áp trước 045 (không mang proposal_id) → phát biểu cùng ô/giá trị/phương pháp.
    UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'hoan-tac:' || p_reason
     WHERE retracted_at IS NULL
       AND (evidence ->> 'proposal_id' = r.id::text
            OR (subject_key = subj AND field = r.field AND value_key = assertion_value_key(r.value)
                AND method = CASE WHEN coalesce(r.decided_by, '') LIKE 'hitl:%' THEN 'hitl' ELSE r.source END));
    GET DIAGNOSTICS n_rut = ROW_COUNT;
    IF n_rut = 0 THEN
      skipped := skipped || jsonb_build_object('id', rid, 'why', 'no-assertion');
      CONTINUE;
    END IF;
    -- 063: phân xử lại mọi bản ghi tin chung chủ thể với phát biểu vừa rút.
    PERFORM resolve_offer_fields(ARRAY[r.offer_id] || offers_chung_chu_the(ARRAY[subj]));
    -- Ngược của cascade properties (nguyên 036): căn mất giá trị khi nó bằng đúng giá trị hoàn tác VÀ không tin nào
    -- khác của căn còn mang nó.
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


-- 4. Sửa dữ liệu một lần
-- Tin chung post với tin của đề xuất đã áp trước 063 còn giữ cột cũ: phân xử lại mọi bản ghi tin một lần (đã cắt chuyển
-- mới chạy). Chỉ ghi dòng audit khi có bản ghi đổi — áp lại đổi 0 bản ghi và không ghi gì.
DO $$
DECLARE kq jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    kq := resolve_offer_fields(NULL);
    IF (kq ->> 'offers_changed')::int > 0 THEN
      INSERT INTO ops_audit (actor, action, env, detail)
      VALUES ('migration:063', 'phat-bieu:phan-xu-lai-063', 'local', kq);
    END IF;
  END IF;
END $$;
