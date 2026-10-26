-- 045_phat_bieu_va_phan_xu.sql — PL15: bảng phát biểu chỉ-thêm + bộ phân xử ba lớp dựng năm cột phân loại của tin
-- (property_type, bedrooms, bathrooms, street_raw, block_raw — trục enrich_field của sổ) kèm nguồn gốc từng ô.
-- Nguồn: docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md · review phân loại §0.2 D-1, §3.1–§3.4 ·
-- ADR-0013 §6 (FieldAssertion dáng HistoryTransactional). Số 045 theo SO-MIGRATION liên làn.
-- KHÔNG sync cloud: field_assertions (bằng chứng chứa đoạn tin gốc) và cột field_provenance chỉ ở DB local.
-- Migration KHÔNG ghi dòng nào vào bảng tin. Idempotent; không giả định chạy trước hay sau 047/048.
--
-- Cổng «chưa cắt chuyển»: resolve_offer_fields từ chối khi ops_audit chưa có dòng 'phat-bieu:cat-chuyen' — trước bước
-- chuyển (pipeline/phat-bieu-cat-chuyen.mjs), mọi ô có sẵn chưa có phát biểu đỡ, phân xử sẽ đặt chúng về trống.

-- 1. Khoá giá trị: số viết khác dạng ('02', ' 2 ') cùng một khoá; chữ so không phân biệt hoa thường.
CREATE OR REPLACE FUNCTION assertion_value_key(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN btrim(p_value) ~ '^[0-9]+$' THEN (btrim(p_value)::numeric)::text ELSE lower(btrim(p_value)) END
$$;

-- 2. Bảng phát biểu (FieldAssertion)
CREATE TABLE IF NOT EXISTS field_assertions (
  id             bigserial PRIMARY KEY,                    -- FieldAssertionKey
  resource_name  text NOT NULL DEFAULT 'Property',         -- ResourceName — vòng này chỉ tin rao
  subject_key    text NOT NULL,                            -- khoá gốc '<S0x>:<id gốc>' (post_id / list_id)
  field          text NOT NULL,                            -- FieldName — trục enrich_field
  value          text NOT NULL,                            -- AssertedValue
  value_key      text GENERATED ALWAYS AS (assertion_value_key(value)) STORED,
  evidence_tier  text NOT NULL,                            -- EvidenceTier — trục evidence_tier
  method         text NOT NULL,                            -- Method — trục assertion_method
  method_version text,                                     -- MethodVersion (model@…, transform@045)
  rule_id        text,
  evidence       jsonb NOT NULL DEFAULT '{}'::jsonb,       -- EvidenceSpan/Start/End/MediaKey, proposal_id…
  observed_at    timestamptz,                              -- ObservedTimestamp (bắt buộc ở PL19)
  changed_by     text,                                     -- ChangedByMemberKey (hitl:<id>)
  run_id         text,
  created_at     timestamptz NOT NULL DEFAULT clock_timestamp(),   -- ModificationTimestamp
  retracted_at   timestamptz,                              -- RetractedTimestamp
  retract_reason text                                      -- RetractReason
);

-- Mỗi cột trục một CHECK literal riêng (vocab --check-db đọc CHECK đầu tiên chứa tên cột); cặp lớp ↔ phương pháp ở trigger.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_assertions_field_chk') THEN
    ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
      CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_assertions_evidence_tier_chk') THEN
    ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_evidence_tier_chk
      CHECK (evidence_tier IN ('fact', 'observed', 'inferred'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_assertions_method_chk') THEN
    ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_method_chk
      CHECK (method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_assertions_resource_chk') THEN
    ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_resource_chk CHECK (resource_name IN ('Property'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'field_assertions_subject_chk') THEN
    ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_subject_chk CHECK (subject_key ~ '^[A-Z][A-Z0-9]{1,5}:.+$');
  END IF;
END $$;

-- Phát biểu sống không trùng (chạy lại một bộ ghi không nhân dòng); rút rồi ghi lại được.
CREATE UNIQUE INDEX IF NOT EXISTS field_assertions_live_uq
  ON field_assertions (subject_key, field, value_key, method, coalesce(rule_id, '')) WHERE retracted_at IS NULL;
CREATE INDEX IF NOT EXISTS field_assertions_subject_idx
  ON field_assertions (subject_key, field) WHERE retracted_at IS NULL;
CREATE INDEX IF NOT EXISTS field_assertions_proposal_idx
  ON field_assertions (((evidence ->> 'proposal_id'))) WHERE evidence ? 'proposal_id';

-- 3. Rào chỉ-thêm: không sửa, không xoá; rút = đặt retracted_at + lý do, đúng một lần.
CREATE OR REPLACE FUNCTION field_assertions_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — không xoá (rút bằng retracted_at + lý do), id %', OLD.id;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.retracted_at IS NOT NULL THEN
      RAISE EXCEPTION 'field_assertions: chỉ thêm — không ghi phát biểu đã rút';
    END IF;
    -- Cặp lớp ↔ phương pháp (design §3.2): sự thật = người, trường nguồn; quan sát = bộ đọc, E1, E2, giá trị cũ;
    -- suy luận = E1/E2 hạ lớp (PL18).
    -- Giá trị ngoài trục để CHECK của cột báo (trigger BEFORE chạy trước CHECK).
    IF NEW.evidence_tier IN ('fact', 'observed', 'inferred')
       AND NEW.method IN ('hitl', 'source_field', 'parser', 'e1_rule', 'e2_llm', 'legacy')
       AND NOT ((NEW.evidence_tier = 'fact' AND NEW.method IN ('hitl', 'source_field'))
         OR (NEW.evidence_tier = 'observed' AND NEW.method IN ('parser', 'e1_rule', 'e2_llm', 'legacy'))
         OR (NEW.evidence_tier = 'inferred' AND NEW.method IN ('e1_rule', 'e2_llm'))) THEN
      RAISE EXCEPTION 'field_assertions: cặp lớp/phương pháp không hợp lệ (% / %)', NEW.evidence_tier, NEW.method;
    END IF;
    IF NEW.field IN ('bedrooms', 'bathrooms') AND btrim(NEW.value) !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'field_assertions: % phải là số nguyên, nhận «%»', NEW.field, NEW.value;
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF OLD.retracted_at IS NOT NULL THEN
    RAISE EXCEPTION 'field_assertions: đã rút — không đổi được nữa, id %', OLD.id;
  END IF;
  IF (to_jsonb(NEW) - 'retracted_at' - 'retract_reason' - 'value_key')
     IS DISTINCT FROM (to_jsonb(OLD) - 'retracted_at' - 'retract_reason' - 'value_key') THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  IF NEW.retracted_at IS NULL THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — chỉ được rút (retracted_at + lý do), id %', OLD.id;
  END IF;
  IF coalesce(btrim(NEW.retract_reason), '') = '' THEN
    RAISE EXCEPTION 'field_assertions: rút phải có lý do, id %', OLD.id;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION field_assertions_no_truncate()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'field_assertions: chỉ thêm — không TRUNCATE';
END $$;

DROP TRIGGER IF EXISTS field_assertions_guard ON field_assertions;
CREATE TRIGGER field_assertions_guard BEFORE INSERT OR UPDATE OR DELETE ON field_assertions
  FOR EACH ROW EXECUTE FUNCTION field_assertions_guard();
DROP TRIGGER IF EXISTS field_assertions_no_truncate ON field_assertions;
CREATE TRIGGER field_assertions_no_truncate BEFORE TRUNCATE ON field_assertions
  FOR EACH STATEMENT EXECUTE FUNCTION field_assertions_no_truncate();

-- 4. Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, hai trục mới + cột field_assertions.*)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('evidence_tier', 'fact', NULL, 'Sự thật', true, 1),
  ('evidence_tier', 'observed', NULL, 'Quan sát có trích dẫn', true, 2),
  ('evidence_tier', 'inferred', NULL, 'Suy luận', true, 3),
  ('assertion_method', 'hitl', NULL, 'Người quyết', true, 1),
  ('assertion_method', 'source_field', NULL, 'Trường có cấu trúc của nguồn', true, 2),
  ('assertion_method', 'parser', NULL, 'Bộ đọc tin', true, 3),
  ('assertion_method', 'e1_rule', NULL, 'Luật E1', true, 4),
  ('assertion_method', 'e2_llm', NULL, 'LLM E2', true, 5),
  ('assertion_method', 'legacy', NULL, 'Giá trị có trước', true, 6)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('field_assertions', 'field', 'enrich_field'),
  ('field_assertions', 'evidence_tier', 'evidence_tier'),
  ('field_assertions', 'method', 'assertion_method')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;

-- 5. Nguồn gốc ô + view sống (SELECT * chốt cột lúc tạo — tạo lại để view có cột mới, nối ở cuối)
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS field_provenance jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;

-- 6. Bộ phân xử
-- Chủ thể của một tin: post neo + mọi post gộp vào (S06: list_id), dạng '<nguồn>:<id>'.
CREATE OR REPLACE FUNCTION offer_subject_keys(p_source text, p_osk text, p_post_ids text[])
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(array_agg(DISTINCT p_source || ':' || x ORDER BY p_source || ':' || x), '{}')
    FROM unnest(array_append(coalesce(p_post_ids, '{}'::text[]), p_osk)) x
   WHERE x IS NOT NULL AND x <> ''
$$;

-- Thứ tự tạm trong lớp (Mạnh đồng ý 26/10, PL15 Hỏi-1) — chỉ đứng tới khi ô được đo (PL21).
CREATE OR REPLACE FUNCTION assertion_method_rank(p_method text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_method WHEN 'hitl' THEN 0 WHEN 'source_field' THEN 1 WHEN 'parser' THEN 2
                       WHEN 'e1_rule' THEN 3 WHEN 'e2_llm' THEN 4 WHEN 'legacy' THEN 9 ELSE 99 END
$$;

-- Dựng năm cột + field_provenance cho các tin (NULL = mọi bản ghi tin, kể cả đã nghỉ). Thuần, xác định: cùng tập phát
-- biểu sống → cùng kết quả bất kể thứ tự ghi. Trả {"offers": số tin xét, "offers_changed": số tin đổi}.
CREATE OR REPLACE FUNCTION resolve_offer_fields(p_offer_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_offers  integer;
  n_changed integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;

  WITH o AS (
    SELECT offer_id, offer_subject_keys(source, originating_system_key, post_ids) AS subj
      FROM sale_offer_records
     WHERE p_offer_ids IS NULL OR offer_id = ANY (p_offer_ids)
  ), a AS (
    SELECT o.offer_id, fa.id, fa.subject_key, fa.field, fa.value, fa.value_key, fa.method,
           CASE fa.evidence_tier WHEN 'fact' THEN 0 WHEN 'observed' THEN 1 ELSE 2 END AS tier_rank,
           fa.evidence_tier, assertion_method_rank(fa.method) AS method_rank
      FROM o JOIN field_assertions fa ON fa.subject_key = ANY (o.subj) AND fa.retracted_at IS NULL
  ), g AS (   -- mỗi (tin, trường, lớp, giá trị) một nhóm
    SELECT offer_id, field, tier_rank, min(evidence_tier) AS tier, value_key,
           min(value COLLATE "C") AS v,
           min(method_rank) AS mrank,
           (array_agg(method ORDER BY method_rank, id))[1] AS method,
           count(DISTINCT subject_key) AS nsub,
           array_agg(id ORDER BY id) AS ids
      FROM a GROUP BY offer_id, field, tier_rank, value_key
  ), top AS (  -- lớp cao nhất có thể vào cột (suy luận không bao giờ)
    SELECT offer_id, field, min(tier_rank) AS tr FROM g WHERE tier_rank < 2 GROUP BY offer_id, field
  ), ranked AS (
    SELECT g.*, row_number() OVER (PARTITION BY g.offer_id, g.field ORDER BY g.mrank, g.nsub DESC, g.value_key) AS rn,
           count(*) OVER (PARTITION BY g.offer_id, g.field) AS ngroups
      FROM g JOIN top ON top.offer_id = g.offer_id AND top.field = g.field AND g.tier_rank = top.tr
  ), win AS (
    SELECT r.offer_id, r.field, r.v, r.value_key, r.tier, r.method, r.ids, r.ngroups > 1 AS conflict,
           EXISTS (SELECT 1 FROM g x WHERE x.offer_id = r.offer_id AND x.field = r.field AND x.tier_rank > r.tier_rank
                                       AND x.value_key <> r.value_key) AS lower_disagree
      FROM ranked r WHERE r.rn = 1
  ), goi_y AS (  -- trường chỉ có suy luận
    SELECT g.offer_id, g.field,
           jsonb_agg(jsonb_build_object('v', g.v, 'method', g.method, 'ids', to_jsonb(g.ids)) ORDER BY g.mrank, g.value_key) AS ds
      FROM g WHERE NOT EXISTS (SELECT 1 FROM top WHERE top.offer_id = g.offer_id AND top.field = g.field)
     GROUP BY g.offer_id, g.field
  ), prov AS (
    SELECT offer_id, field, jsonb_build_object('v', CASE WHEN field IN ('bedrooms', 'bathrooms') THEN value_key ELSE v END,
             'tier', tier, 'method', method, 'ids', to_jsonb(ids), 'conflict', conflict,
             'lower_disagree', lower_disagree, 'measured', false) AS p
      FROM win
    UNION ALL
    SELECT offer_id, field, jsonb_build_object('goi_y', ds) FROM goi_y
  ), pv AS (
    SELECT offer_id, jsonb_object_agg(field, p) AS field_provenance FROM prov GROUP BY offer_id
  ), kq AS (   -- mỗi (tin, trường) có tối đa một dòng win
    SELECT o.offer_id,
           coalesce(max(w.value_key) FILTER (WHERE w.field = 'property_type'), 'unknown') AS property_type,
           (max(w.value_key) FILTER (WHERE w.field = 'bedrooms'))::int AS bedrooms,
           (max(w.value_key) FILTER (WHERE w.field = 'bathrooms'))::int AS bathrooms,
           max(w.v) FILTER (WHERE w.field = 'street_raw') AS street_raw,
           max(w.v) FILTER (WHERE w.field = 'block_raw') AS block_raw,
           coalesce(max(pv.field_provenance::text)::jsonb, '{}'::jsonb) AS field_provenance
      FROM o
      LEFT JOIN win w ON w.offer_id = o.offer_id
      LEFT JOIN pv ON pv.offer_id = o.offer_id
     GROUP BY o.offer_id
  ), upd AS (
    UPDATE sale_offer_records r SET
           property_type = k.property_type, bedrooms = k.bedrooms, bathrooms = k.bathrooms,
           street_raw = k.street_raw, block_raw = k.block_raw, field_provenance = k.field_provenance
      FROM kq k
     WHERE r.offer_id = k.offer_id
       AND (r.property_type, r.bedrooms, r.bathrooms, r.street_raw, r.block_raw, r.field_provenance)
           IS DISTINCT FROM (k.property_type, k.bedrooms, k.bathrooms, k.street_raw, k.block_raw, k.field_provenance)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM kq), (SELECT count(*) FROM upd) INTO n_offers, n_changed;
  RETURN jsonb_build_object('offers', n_offers, 'offers_changed', n_changed);
END $$;

-- 7. apply_enrichment bản 045 — đề xuất thành phát biểu rồi phân xử (thay fill-gap của 033). Cùng chữ ký.
--   actor 'hitl:%' → lớp sự thật/hitl (người), rút phát biểu hitl cũ khác giá trị cùng ô; còn lại → quan sát/<nguồn đề xuất>.
--   Đề xuất 'applied' khi cột nhận đúng giá trị của nó, ngược lại 'skipped'. Cascade properties như 033.
CREATE OR REPLACE FUNCTION apply_enrichment(p_ids bigint[], p_actor text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  r       record;
  subj    text;
  cur     text;
  ok      boolean;
  n       integer := 0;
  offers  text[] := '{}';
  applied bigint[] := '{}';
  nguoi   boolean := coalesce(p_actor, '') LIKE 'hitl:%';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen') THEN
    RAISE EXCEPTION 'phân xử: chưa cắt chuyển — chạy node pipeline/phat-bieu-cat-chuyen.mjs trước (PL15)';
  END IF;
  FOR r IN
    SELECT ep.*, o.source AS o_source, o.originating_system_key AS osk
      FROM enrichment_proposals ep JOIN sale_offer_records o ON o.offer_id = ep.offer_id
     WHERE ep.id = ANY (p_ids) AND ep.status = 'queued'
     ORDER BY ep.id
       FOR UPDATE OF ep
  LOOP
    subj := r.o_source || ':' || r.osk;
    IF nguoi THEN
      UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'hitl-thay'
       WHERE subject_key = subj AND field = r.field AND method = 'hitl' AND retracted_at IS NULL
         AND value_key <> assertion_value_key(r.value);
    END IF;
    INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, evidence,
                                  changed_by, run_id)
    VALUES (subj, r.field, r.value,
            CASE WHEN nguoi THEN 'fact' ELSE 'observed' END,
            CASE WHEN nguoi THEN 'hitl' ELSE r.source END,
            r.model, r.evidence || jsonb_build_object('proposal_id', r.id, 'route', r.route),
            CASE WHEN nguoi THEN p_actor END, r.run_id)
    ON CONFLICT DO NOTHING;
    offers := offers || r.offer_id;
  END LOOP;

  IF cardinality(offers) = 0 THEN
    RETURN 0;
  END IF;
  PERFORM resolve_offer_fields(offers);

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

-- 8. revert_enrichment bản 045 — rút phát biểu của đề xuất rồi phân xử: ô về giá trị kế tiếp có căn cứ (thay «về trống»
-- của 036). Giữ luật 036: chỉ người (hitl:), có lý do; mở lại đề xuất superseded; ops_audit enrich:revert.
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
    SELECT ep.*, o.source AS o_source, o.originating_system_key AS osk INTO r
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
    PERFORM resolve_offer_fields(ARRAY[r.offer_id]);
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
