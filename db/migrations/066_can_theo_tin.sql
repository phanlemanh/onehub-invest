-- 066_can_theo_tin.sql — hàng can-theo-tin-khi-phan-xu-lai: căn của tin chung bài đăng theo áp/hoàn tác đề xuất
-- docs/superpowers/specs/2026-11-01-can-theo-tin-khi-phan-xu-lai-design.md · _acceptance/can-theo-tin-khi-phan-xu-lai/
-- 063 phân xử lại mọi tin chung chủ thể khi áp/hoàn tác, nhưng chuỗi cập nhật căn (properties qua property_offers) vẫn
-- chỉ chạy cho căn của tin trong đề xuất — căn của tin chung giữ số cũ, không nhật ký. 066 thay hai hàm (thân 063, chỉ
-- mở rộng tập căn) + mục 4 sửa một lần phần lệch (chỉ điền ô trống, idempotent). Bộ nạp test (pipeline/lib/nap-045.mjs)
-- nạp lại phần hàm (mục 2–3, trước mục 4) sau 063. Sao lưu :5433 bằng pg_dump TRƯỚC khi áp (mục 4 ghi dữ liệu thật).

-- 2. apply_enrichment — nguyên thân 063, chỉ mở rộng tập căn của bước cascade.
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
  t_offers text[];
  t_subjs  text[];
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

  -- Cascade: căn của tin đề xuất đã áp VÀ căn của mọi tin chung chủ thể với chúng (066) nhận field còn trống + một dòng
  -- enrichment_log. Đọc sale_offer_records (không phải view sống) để tin chung đã nghỉ vẫn đưa giá trị về căn của nó.
  IF n > 0 THEN
    SELECT coalesce(array_agg(DISTINCT o.offer_id), '{}'),
           coalesce(array_agg(DISTINCT o.source || ':' || coalesce(o.originating_system_key, o.post_ids[1])), '{}')
      INTO t_offers, t_subjs
      FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id
     WHERE ep.id = ANY (applied);
    t_offers := t_offers || offers_chung_chu_the(t_subjs);
    UPDATE properties p SET
      bedrooms  = COALESCE(p.bedrooms, agg.bedrooms),
      bathrooms = COALESCE(p.bathrooms, agg.bathrooms),
      street    = COALESCE(p.street, agg.street),
      enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
        't', now(), 'src', 'enrich-proposals',
        'proposal_ids', to_jsonb(agg.ids), 'offer_ids', to_jsonb(agg.offer_ids), 'actor', p_actor))
    FROM (
      SELECT po.property_id,
             max(o.bedrooms)   AS bedrooms,
             max(o.bathrooms)  AS bathrooms,
             max(o.street_raw) AS street,
             array_agg(DISTINCT o.offer_id ORDER BY o.offer_id) AS offer_ids,
             -- đề xuất có chủ thể giao chủ thể của các tin gắn căn (tin của đề xuất, hoặc tin chung bài đăng với nó)
             (SELECT array_agg(DISTINCT ep.id ORDER BY ep.id)
                FROM enrichment_proposals ep JOIN sale_offer_records eo ON eo.offer_id = ep.offer_id
               WHERE ep.id = ANY (applied)
                 AND (ep.offer_id = ANY (array_agg(o.offer_id))
                      OR (eo.source || ':' || coalesce(eo.originating_system_key, eo.post_ids[1]))
                         = ANY (SELECT unnest(offer_subject_keys(x.source, x.originating_system_key, x.post_ids))
                                  FROM sale_offer_records x WHERE x.offer_id = ANY (array_agg(o.offer_id))))) AS ids
      FROM property_offers po
      JOIN sale_offer_records o ON o.offer_id = po.offer_id
      WHERE po.offer_id = ANY (t_offers)
      GROUP BY po.property_id
    ) agg
    WHERE p.id = agg.property_id;
  END IF;

  RETURN n;
END $$;


-- 3. revert_enrichment — nguyên thân 063, chỉ mở rộng tập căn của bước gỡ.
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
  tap      text[];
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
    tap := ARRAY[r.offer_id] || offers_chung_chu_the(ARRAY[subj]);
    PERFORM resolve_offer_fields(tap);
    -- Ngược của cascade properties (nguyên 036, 066 mở rộng sang căn của tin chung chủ thể): căn mất giá trị khi nó bằng
    -- đúng giá trị hoàn tác VÀ không tin nào của căn (kể cả chính tin chung sau phân xử lại, kể cả tin đã nghỉ — cùng tập bản
    -- ghi mà bước áp đọc) còn mang nó.
    IF r.field = 'bedrooms' THEN
      UPDATE properties p SET bedrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND p.bedrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bedrooms::text = r.value);
    ELSIF r.field = 'bathrooms' THEN
      UPDATE properties p SET bathrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND p.bathrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bathrooms::text = r.value);
    ELSIF r.field = 'street_raw' THEN
      UPDATE properties p SET street = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND lower(p.street) = r.value_key
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND lower(o.street_raw) = r.value_key);
    END IF;
    UPDATE properties p SET enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
      't', now(), 'src', 'enrich-revert', 'proposal_ids', jsonb_build_array(r.id),
      'actor', p_actor, 'reason', p_reason))
    WHERE p.id IN (SELECT po.property_id FROM property_offers po WHERE po.offer_id = ANY (tap));
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
-- Căn của tin chung chủ thể với tin có đề xuất đã áp (status applied) còn trống ô mà tin gắn căn đã mang giá trị: điền
-- ô trống bằng max() các tin gắn căn — đúng cascade của áp ở mục 2. Chỉ ghi dòng audit khi có ô đổi; áp lại 0 ô.
DO $$
DECLARE
  t_subjs text[];
  t_offers text[];
  n_can integer;
  n_o   integer;
BEGIN
  IF EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    SELECT coalesce(array_agg(DISTINCT o.source || ':' || coalesce(o.originating_system_key, o.post_ids[1])), '{}')
      INTO t_subjs
      FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id
     WHERE ep.status = 'applied';
    t_offers := offers_chung_chu_the(t_subjs);
    WITH agg AS (
      SELECT po.property_id, max(o.bedrooms) AS bedrooms, max(o.bathrooms) AS bathrooms, max(o.street_raw) AS street,
             array_agg(DISTINCT o.offer_id ORDER BY o.offer_id) AS offer_ids
        FROM property_offers po JOIN sale_offer_records o ON o.offer_id = po.offer_id
       WHERE po.offer_id = ANY (t_offers)
       GROUP BY po.property_id
    ), can AS (
      -- đếm ô trên giá trị TRƯỚC khi ghi
      SELECT p.id, agg.bedrooms, agg.bathrooms, agg.street, agg.offer_ids,
             (p.bedrooms IS NULL AND agg.bedrooms IS NOT NULL)::int + (p.bathrooms IS NULL AND agg.bathrooms IS NOT NULL)::int
           + (p.street IS NULL AND agg.street IS NOT NULL)::int AS o
        FROM properties p JOIN agg ON p.id = agg.property_id
    ), up AS (
      UPDATE properties p SET
        bedrooms  = COALESCE(p.bedrooms, can.bedrooms),
        bathrooms = COALESCE(p.bathrooms, can.bathrooms),
        street    = COALESCE(p.street, can.street),
        enrichment_log = p.enrichment_log || jsonb_build_array(jsonb_build_object(
          't', now(), 'src', 'sua-mot-lan-066', 'offer_ids', to_jsonb(can.offer_ids), 'actor', 'migration:066'))
      FROM can
      WHERE p.id = can.id AND can.o > 0
      RETURNING can.o
    )
    SELECT count(*), coalesce(sum(o), 0) INTO n_can, n_o FROM up;
    IF n_o > 0 THEN
      INSERT INTO ops_audit (actor, action, env, detail)
      VALUES ('migration:066', 'can-theo-tin:sua-mot-lan-066', 'local',
              jsonb_build_object('properties', n_can, 'cells', n_o));
    END IF;
  END IF;
END $$;
