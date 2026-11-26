-- lui-129.sql — khối lùi của migration 129 (NB10), SINH bằng script cùng lúc với 129 (không sửa tay): gỡ ba hàm mới, hai cột,
-- hai bảng; nạp lại NGUYÊN VĂN revert_enrichment bản 066 và unit_data_level bản 087. Một giao dịch. Áp trên máy thu chỉ theo
-- lời Mạnh (ap-may-thu.md mục «Cách lùi»).
BEGIN;
DROP FUNCTION IF EXISTS xet_han_ghi_tam();
DROP FUNCTION IF EXISTS ghi_ket_qua_do_bu(text, text, text);
DROP FUNCTION IF EXISTS rut_lo_ghi_tam(text, text, text, boolean);
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
  tap_chung text[];
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
    tap_chung := tin_that_su_chung(ARRAY[subj]);
    PERFORM resolve_offer_fields(tap);
    -- Ngược của cascade properties (nguyên 036, 066 mở rộng sang căn của tin chung chủ thể): căn mất giá trị khi nó bằng
    -- đúng giá trị hoàn tác VÀ không tin sống nào của căn, cũng không tin đã nghỉ chung chủ thể với đề xuất, còn mang nó.
    IF r.field = 'bedrooms' THEN
      UPDATE properties p SET bedrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND p.bedrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bedrooms::text = r.value
                          AND (o.retired_at IS NULL OR o.offer_id = ANY (tap_chung)));
    ELSIF r.field = 'bathrooms' THEN
      UPDATE properties p SET bathrooms = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND p.bathrooms::text = r.value
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND o.bathrooms::text = r.value
                          AND (o.retired_at IS NULL OR o.offer_id = ANY (tap_chung)));
    ELSIF r.field = 'street_raw' THEN
      UPDATE properties p SET street = NULL
      FROM property_offers po
      WHERE po.offer_id = ANY (tap) AND p.id = po.property_id AND lower(p.street) = r.value_key
        AND NOT EXISTS (SELECT 1 FROM property_offers q JOIN sale_offer_records o ON o.offer_id = q.offer_id
                        WHERE q.property_id = p.id AND lower(o.street_raw) = r.value_key
                          AND (o.retired_at IS NULL OR o.offer_id = ANY (tap_chung)));
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

CREATE OR REPLACE FUNCTION unit_data_level()
RETURNS TABLE (unit_key text, data_level text, ke_thieu text, source text, area_id text, property_type text,
               offer_ids text[]) LANGUAGE sql STABLE AS $$
  WITH gan AS (   -- chỉ căn có thật trong danh bạ, đang hiệu lực (082)
    SELECT un.unit_key AS uk, o.*
      FROM sale_offers o
      JOIN units un ON un.unit_key = offer_unit_key(o.offer_id) AND un.status = 'active'
     WHERE o.source IN ('S03', 'S05', 'S06')
  ), du AS (
    SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)
  ), gia AS (
    SELECT g.uk, count(*) AS n
      FROM du g JOIN history_transactional h ON h.resource_record_key = g.offer_id
     WHERE h.change_type IN ('new_listing', 'price_change')
     GROUP BY g.uk
  ), tin AS (
    SELECT g.uk, g.offer_id, g.source, g.area_id, g.property_type, g.first_seen,
           CASE
             WHEN NOT d.lam_giau THEN 3
             WHEN g.offer_status = 'active' AND g.last_seen >= now() - freshness_window()
                  AND (coalesce(gi.n, 0) >= 2 OR (SELECT count(*) FROM du x WHERE x.uk = g.uk) >= 2) THEN 5
             ELSE 4
           END AS lv
      FROM du g
      LEFT JOIN gia gi ON gi.uk = g.uk
      LEFT JOIN LATERAL (
        SELECT bool_and(coalesce(g.field_provenance -> k ->> 'measured', '') = 'true'
                        OR coalesce(g.field_provenance -> k ->> 'tier', '') = 'fact') AS lam_giau
          FROM unnest(ARRAY['kind', 'property_type', 'price_vnd', 'area_m2', 'area_id']) AS k
      ) d ON true
  ), can AS (
    SELECT uk, max(lv) AS lv,
           (array_agg(source ORDER BY first_seen, offer_id))[1] AS source,
           (array_agg(area_id ORDER BY first_seen, offer_id))[1] AS area_id,
           (array_agg(property_type ORDER BY first_seen, offer_id))[1] AS property_type,
           array_agg(offer_id ORDER BY offer_id) AS offer_ids
      FROM tin GROUP BY uk
  )
  SELECT uk, 'B' || lv,
         CASE lv WHEN 3 THEN 'lam-giau' WHEN 4 THEN 'hieu-luc' ELSE 'giu-nhip' END,
         source, area_id, property_type, offer_ids
    FROM can
$$;

ALTER TABLE enrichment_proposals DROP COLUMN IF EXISTS lo_id, DROP COLUMN IF EXISTS ghi_tam;
DROP TABLE IF EXISTS ghi_tam_o;
DROP TABLE IF EXISTS ghi_tam_lo;
COMMIT;
