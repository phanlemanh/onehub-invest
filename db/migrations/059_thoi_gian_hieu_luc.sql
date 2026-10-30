-- 059_thoi_gian_hieu_luc.sql — PL19 `thoi-gian-va-hieu-luc` (C2.8, L18): observed_at bắt buộc, trạng thái chào phân xử
-- theo thời gian, lịch sử giá/trạng thái dáng RESO HistoryTransactional gom theo căn, vị từ B5 của bậc dữ liệu.
-- Nguồn: design docs/superpowers/specs/2026-10-30-thoi-gian-va-hieu-luc-design.md · hồ sơ _acceptance/thoi-gian-va-hieu-luc
-- (Mạnh duyệt 30/10, Hỏi-1..4 nhánh A) · khung docs/architecture/reso-khung-phan-loai.md §6. Số 059 do phiên liên làn cấp.
--
-- KHÔNG sync cloud ở vòng này: cột offer_status, bảng history_transactional chỉ ở máy thu (không vào FILL của
-- pipeline/sync-cloud.mjs). Trigger mới trên sale_offer_records chỉ ghi bảng lịch sử local.
-- Idempotent: chạy lại không lỗi, không nhân dòng. Áp lên DB local :5433 dùng chung CHỈ sau khi gộp.

-- 1. observed_at bắt buộc.
-- 1a. Rào chỉ-thêm bản 059: thêm đúng một lối UPDATE — điền lùi observed_at từ NULL, không cột nào khác (sau 1c cột
--     NOT NULL nên lối này tự tắt). Phát biểu trạng thái chào mang giá trị thuộc trục offer_status.
CREATE OR REPLACE FUNCTION field_assertions_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'field_assertions: chỉ thêm — không xoá (rút bằng retracted_at + lý do), id %', OLD.id;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.retracted_at IS NOT NULL THEN
      RAISE EXCEPTION 'field_assertions: chỉ thêm — không ghi phát biểu đã rút';
    END IF;
    -- Cặp lớp ↔ phương pháp (045 design §3.2). Giá trị ngoài trục để CHECK của cột báo (trigger BEFORE chạy trước CHECK).
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
    IF NEW.field = 'offer_status'
       AND NEW.value NOT IN ('active', 'active_under_contract', 'closed', 'withdrawn', 'unknown') THEN
      RAISE EXCEPTION 'field_assertions: offer_status ngoài trục, nhận «%»', NEW.value;
    END IF;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF OLD.observed_at IS NULL AND NEW.observed_at IS NOT NULL
     AND (to_jsonb(NEW) - 'observed_at' - 'value_key') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'observed_at' - 'value_key') THEN
    RETURN NEW;   -- điền lùi thời điểm quan sát (PL19)
  END IF;
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

-- 1b. Điền lùi. Giá trị có trước (legacy, bước chuyển PL15) được đọc lần cuối ở lượt thấy tin cuối trước bước chuyển:
--     least(lần thấy cuối của tin, lúc tạo phát biểu); tin không còn → lúc tạo. Mọi phát biểu khác còn thiếu → lúc tạo.
UPDATE field_assertions fa SET observed_at = least(o.last_seen, fa.created_at)
  FROM sale_offer_records o
 WHERE fa.observed_at IS NULL AND fa.method = 'legacy' AND o.offer_id = fa.evidence ->> 'offer_id';
UPDATE field_assertions SET observed_at = created_at WHERE observed_at IS NULL;

-- 1c. Không còn đường ghi thiếu.
ALTER TABLE field_assertions ALTER COLUMN observed_at SET NOT NULL;

-- 2. Trục cột phát biểu: field_assertions.field theo trục assertion_field (năm trường enrich + offer_status);
--    enrichment_proposals.field vẫn theo enrich_field.
ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk;
ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
  CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw', 'offer_status'));

-- 3. Cột trạng thái chào (StandardStatus) — chỉ resolve_offer_status (§5) ghi; view sống dựng lại để có cột (nối ở cuối).
ALTER TABLE sale_offer_records ADD COLUMN IF NOT EXISTS offer_status text NOT NULL DEFAULT 'unknown';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_offer_records_offer_status_chk') THEN
    ALTER TABLE sale_offer_records ADD CONSTRAINT sale_offer_records_offer_status_chk
      CHECK (offer_status IN ('active', 'active_under_contract', 'closed', 'withdrawn', 'unknown'));
  END IF;
END $$;
CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL;

-- Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của trục/cột mới)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('assertion_field', 'property_type', 'PropertySubType', 'Loại hình', false, 1),
  ('assertion_field', 'bedrooms', 'BedroomsTotal', 'Phòng ngủ', false, 2),
  ('assertion_field', 'bathrooms', 'BathroomsTotalInteger', 'WC', false, 3),
  ('assertion_field', 'street_raw', 'StreetName', 'Đường', false, 4),
  ('assertion_field', 'block_raw', 'BuildingName', 'Toà', false, 5),
  ('assertion_field', 'offer_status', 'StandardStatus', 'Trạng thái chào', false, 6)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('field_assertions', 'field', 'assertion_field'),
  ('sale_offer_records', 'offer_status', 'offer_status')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;

-- 4. apply_enrichment bản 059 — nguyên thân 045, thêm observed_at = lúc tạo đề xuất (lúc bộ làm giàu đọc tin).
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

-- 5. Trạng thái chào: bộ ghi bằng chứng + bộ phân xử theo thời gian (reso-khung §6; Hỏi-1, Hỏi-4).
-- 5a. resolve_offer_fields bản 059 — nguyên thân 045, bỏ qua phát biểu offer_status và giữ nguyên nguồn gốc ô
--     offer_status (do 5d ghi) khi dựng lại field_provenance.
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
    SELECT offer_id, offer_subject_keys(source, originating_system_key, post_ids) AS subj,
           field_provenance -> 'offer_status' AS fp_chao
      FROM sale_offer_records
     WHERE p_offer_ids IS NULL OR offer_id = ANY (p_offer_ids)
  ), sk AS (   -- mỗi (tin, chủ thể) một dòng — nối bằng đẳng thức (hash join), không quét bảng phát biểu cho từng tin
    SELECT DISTINCT o.offer_id, unnest(o.subj) AS subject_key FROM o
  ), a AS (
    SELECT sk.offer_id, fa.id, fa.subject_key, fa.field, fa.value, fa.value_key, fa.method,
           CASE fa.evidence_tier WHEN 'fact' THEN 0 WHEN 'observed' THEN 1 ELSE 2 END AS tier_rank,
           fa.evidence_tier, assertion_method_rank(fa.method) AS method_rank
      FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.retracted_at IS NULL
                                     AND fa.field <> 'offer_status'   -- trạng thái chào: resolve_offer_status (059)
     -- legacy = lịch sử của chính bản ghi (không biết đến từ post nào) → chỉ đỡ đúng tin đã sinh ra nó; không rò sang tin
     -- khác chung post (tin đã nghỉ vì đổi khoá PL14 chung post với tin kế). Phát biểu khác đi theo post như thiết kế §3.1.
     WHERE fa.method <> 'legacy' OR fa.evidence ->> 'offer_id' = sk.offer_id
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
  ), win AS (   -- lớp dưới có giá trị khác giá trị thắng → lower_disagree (nối + gộp, không truy vấn con từng dòng)
    SELECT r.offer_id, r.field, r.v, r.value_key, r.tier, r.method, r.ids, r.ngroups > 1 AS conflict,
           coalesce(bool_or(x.tier_rank > r.tier_rank AND x.value_key <> r.value_key), false) AS lower_disagree
      FROM ranked r JOIN g x ON x.offer_id = r.offer_id AND x.field = r.field
     WHERE r.rn = 1
     GROUP BY r.offer_id, r.field, r.v, r.value_key, r.tier, r.method, r.ids, r.ngroups
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
           coalesce(max(pv.field_provenance::text)::jsonb, '{}'::jsonb)
             || CASE WHEN max(o.fp_chao::text) IS NULL THEN '{}'::jsonb
                     ELSE jsonb_build_object('offer_status', max(o.fp_chao::text)::jsonb) END AS field_provenance
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

-- 5b. Bằng chứng muốn có của mỗi tin (một hàm cho hai câu ghi của 5c):
--     tin sống S06 → active (fact/source_field — tin còn trên sàn là trạng thái sàn khai); tin sống S03/S05 → active
--     (observed/parser — bài trong nhóm được đọc là tin rao); tin S06 nghỉ het_trong_luot → withdrawn (fact/source_field).
--     Nghỉ doi_khoa (đổi khoá PL14) không phải bằng chứng gỡ. Thời điểm: active = lần thấy cuối (không phải giờ chạy),
--     withdrawn = lúc nghỉ. Phát biểu mang evidence.offer_id + rule_id 'offer:<id>': chỉ đỡ đúng tin đã sinh ra nó
--     (như legacy của 045 — tin nghỉ đổi khoá chung post với tin kế không đọc trạng thái của tin kế). `cur` = phát biểu
--     sống cùng giá trị + phương pháp của tin; `doi_at` = phát biểu đối nghịch (active ↔ withdrawn) sống mới nhất.
CREATE OR REPLACE FUNCTION bang_chung_chao(p_offer_ids text[])
RETURNS TABLE (offer_id text, subj text, v text, tier text, method text, t timestamptz, cur_id bigint,
               cur_at timestamptz, doi_at timestamptz)
LANGUAGE sql STABLE AS $$
  WITH o AS (
    SELECT r.offer_id, r.source || ':' || coalesce(r.originating_system_key, r.post_ids[1]) AS subj,
           offer_subject_keys(r.source, r.originating_system_key, r.post_ids) AS subjs,
           CASE WHEN r.retired_at IS NULL THEN 'active' ELSE 'withdrawn' END AS v,
           CASE WHEN r.source = 'S06' THEN 'fact' ELSE 'observed' END AS tier,
           CASE WHEN r.source = 'S06' THEN 'source_field' ELSE 'parser' END AS method,
           CASE WHEN r.retired_at IS NULL THEN r.last_seen ELSE r.retired_at END AS t
      FROM sale_offer_records r
     WHERE (p_offer_ids IS NULL OR r.offer_id = ANY (p_offer_ids))
       AND coalesce(r.originating_system_key, r.post_ids[1]) IS NOT NULL
       AND ((r.retired_at IS NULL AND r.source IN ('S03', 'S05', 'S06'))
         OR (r.retired_at IS NOT NULL AND r.retired_reason = 'het_trong_luot' AND r.source = 'S06'))
  )
  SELECT o.offer_id, o.subj, o.v, o.tier, o.method, o.t, cur.id, cur.observed_at,
         (SELECT max(fa.observed_at) FROM field_assertions fa
           WHERE fa.subject_key = ANY (o.subjs) AND fa.field = 'offer_status' AND fa.retracted_at IS NULL
             AND coalesce(fa.evidence ->> 'offer_id', o.offer_id) = o.offer_id
             AND fa.value = CASE o.v WHEN 'active' THEN 'withdrawn' ELSE 'active' END)
    FROM o
    LEFT JOIN field_assertions cur ON cur.subject_key = o.subj AND cur.field = 'offer_status' AND cur.retracted_at IS NULL
                                  AND cur.value_key = o.v AND cur.method = o.method AND cur.rule_id = 'offer:' || o.offer_id
$$;

-- 5c. Ghi bằng chứng (NULL = mọi tin). Giá trị đã có phát biểu sống cùng phương pháp thì không ghi lại; phát biểu sống
--     ấy đang thua phát biểu đối nghịch (tin gỡ rồi quay lại, hoặc quay lại rồi gỡ lần nữa) → rút có lý do rồi ghi mới.
--     Thời điểm giữ nguyên bằng chứng; chỉ khi trùng/thua phát biểu đối nghịch mà tin rõ ràng đã đổi (tin sống sau
--     withdrawn, tin nghỉ đúng lúc thấy cuối) mới đẩy sau nó 1µs. Trả {"moi": số phát biểu mới, "rut": số phát biểu rút}.
CREATE OR REPLACE FUNCTION ghi_bang_chung_chao(p_offer_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_rut integer;
  n_moi integer;
BEGIN
  UPDATE field_assertions fa
     SET retracted_at = clock_timestamp(),
         retract_reason = CASE d.v WHEN 'active' THEN 'quay-lai' ELSE 'nghi-lai' END
    FROM bang_chung_chao(p_offer_ids) d
   WHERE fa.id = d.cur_id AND d.doi_at >= d.cur_at;
  GET DIAGNOSTICS n_rut = ROW_COUNT;
  INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence,
                                observed_at)
  SELECT d.subj, 'offer_status', d.v, d.tier, d.method, '059', 'offer:' || d.offer_id,
         jsonb_build_object('offer_id', d.offer_id,
                            'bang_chung', CASE d.v WHEN 'active' THEN 'tin-song' ELSE 'het-trong-luot' END),
         CASE WHEN d.v = 'active' AND d.doi_at >= d.t THEN d.doi_at + interval '1 microsecond'   -- quay lại cùng lượt nghỉ
              WHEN d.v = 'withdrawn' AND d.doi_at = d.t THEN d.t + interval '1 microsecond'        -- nghỉ đúng lúc thấy cuối
              ELSE d.t END
    FROM bang_chung_chao(p_offer_ids) d
   WHERE d.cur_id IS NULL
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n_moi = ROW_COUNT;
  RETURN jsonb_build_object('moi', n_moi, 'rut', n_rut);
END $$;

-- 5d. Phân xử (NULL = mọi bản ghi tin): phát biểu offer_status sống có observed_at mới nhất thắng; cùng thời điểm mới xét
--     thứ tự phương pháp của 045 (Hỏi-4). Không phát biểu nào → unknown; quá cửa sổ độ tươi không đổi trạng thái (Hỏi-1).
--     Phát biểu mang evidence.offer_id chỉ đỡ đúng tin ấy (5b). Ghi cột + field_provenance.offer_status chỉ khi khác.
--     Trả {"offers": số tin xét, "changed": số tin đổi}.
CREATE OR REPLACE FUNCTION resolve_offer_status(p_offer_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_offers  integer;
  n_changed integer;
BEGIN
  WITH o AS (
    SELECT offer_id, offer_subject_keys(source, originating_system_key, post_ids) AS subj, field_provenance
      FROM sale_offer_records
     WHERE p_offer_ids IS NULL OR offer_id = ANY (p_offer_ids)
  ), sk AS (
    SELECT DISTINCT o.offer_id, unnest(o.subj) AS subject_key FROM o
  ), thang AS (
    SELECT DISTINCT ON (sk.offer_id) sk.offer_id, fa.id, fa.value, fa.evidence_tier, fa.method, fa.observed_at
      FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.field = 'offer_status'
                                     AND fa.retracted_at IS NULL
                                     AND coalesce(fa.evidence ->> 'offer_id', sk.offer_id) = sk.offer_id
     ORDER BY sk.offer_id, fa.observed_at DESC, assertion_method_rank(fa.method), fa.id
  ), kq AS (
    SELECT o.offer_id, coalesce(t.value, 'unknown') AS offer_status,
           CASE WHEN t.id IS NULL THEN o.field_provenance - 'offer_status'
                ELSE o.field_provenance || jsonb_build_object('offer_status', jsonb_build_object(
                       'v', t.value, 'tier', t.evidence_tier, 'method', t.method, 'ids', jsonb_build_array(t.id),
                       'observed_at', t.observed_at)) END AS field_provenance
      FROM o LEFT JOIN thang t ON t.offer_id = o.offer_id
  ), upd AS (
    UPDATE sale_offer_records r SET offer_status = k.offer_status, field_provenance = k.field_provenance
      FROM kq k
     WHERE r.offer_id = k.offer_id
       AND (r.offer_status, r.field_provenance) IS DISTINCT FROM (k.offer_status, k.field_provenance)
    RETURNING 1
  )
  SELECT (SELECT count(*) FROM kq), (SELECT count(*) FROM upd) INTO n_offers, n_changed;
  RETURN jsonb_build_object('offers', n_offers, 'changed', n_changed);
END $$;

-- 6. Lịch sử giá và trạng thái của tin (RESO HistoryTransactional; bảng §6 của khung RESO). Chỉ local.
CREATE TABLE IF NOT EXISTS history_transactional (
  id                     bigserial PRIMARY KEY,                     -- HistoryTransactionalKey
  resource_name          text NOT NULL DEFAULT 'Property',          -- ResourceName — vòng này chỉ tin rao
  resource_record_key    text NOT NULL,                             -- ResourceRecordKey = sale_offer_records.offer_id
  field_name             text NOT NULL,                             -- FieldName (tên field RESO)
  previous_value         text,                                      -- PreviousValue
  new_value              text,                                      -- NewValue
  change_type            text NOT NULL,                             -- ChangeType — trục change_type
  modification_timestamp timestamptz NOT NULL DEFAULT clock_timestamp()   -- ModificationTimestamp
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'history_transactional_change_type_chk') THEN
    ALTER TABLE history_transactional ADD CONSTRAINT history_transactional_change_type_chk
      CHECK (change_type IN ('new_listing', 'price_change', 'withdrawn', 'back_on_market', 'active_under_contract', 'closed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'history_transactional_field_name_chk') THEN
    ALTER TABLE history_transactional ADD CONSTRAINT history_transactional_field_name_chk
      CHECK (field_name IN ('ListPrice', 'StandardStatus'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'history_transactional_resource_chk') THEN
    ALTER TABLE history_transactional ADD CONSTRAINT history_transactional_resource_chk CHECK (resource_name IN ('Property'));
  END IF;
END $$;
-- Mỗi tin đúng một dòng «tin mới» (điền lùi và trigger chạy lại không nhân dòng).
CREATE UNIQUE INDEX IF NOT EXISTS history_transactional_new_listing_uq
  ON history_transactional (resource_record_key) WHERE change_type = 'new_listing';
CREATE INDEX IF NOT EXISTS history_transactional_record_idx
  ON history_transactional (resource_record_key, modification_timestamp);

-- Điền lùi: mỗi tin có sẵn một dòng «tin mới» với giá hiện tại, lúc thấy đầu.
INSERT INTO history_transactional (resource_record_key, field_name, previous_value, new_value, change_type,
                                   modification_timestamp)
SELECT offer_id, 'ListPrice', NULL, price_vnd::text, 'new_listing', first_seen FROM sale_offer_records
ON CONFLICT DO NOTHING;

-- Trigger ghi: thêm tin → new_listing; đổi giá thật sự → price_change (cùng giá không sinh dòng — lượt nạp ghi lại
-- cùng giá cho mọi tin); đổi trạng thái theo bảng §6. unknown → bất kỳ là lần xác định đầu, không ghi.
CREATE OR REPLACE FUNCTION history_tin_moi()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO history_transactional (resource_record_key, field_name, new_value, change_type, modification_timestamp)
  VALUES (NEW.offer_id, 'ListPrice', NEW.price_vnd::text, 'new_listing', coalesce(NEW.first_seen, clock_timestamp()))
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_doi_gia()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO history_transactional (resource_record_key, field_name, previous_value, new_value, change_type)
  VALUES (NEW.offer_id, 'ListPrice', OLD.price_vnd::text, NEW.price_vnd::text, 'price_change');
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION history_doi_trang_thai()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  loai text;
BEGIN
  loai := CASE
            WHEN OLD.offer_status = 'unknown' THEN NULL
            WHEN NEW.offer_status = 'withdrawn' THEN 'withdrawn'
            WHEN NEW.offer_status = 'active_under_contract' THEN 'active_under_contract'
            WHEN NEW.offer_status = 'closed' THEN 'closed'
            WHEN NEW.offer_status = 'active' THEN 'back_on_market'
          END;
  IF loai IS NOT NULL THEN
    INSERT INTO history_transactional (resource_record_key, field_name, previous_value, new_value, change_type)
    VALUES (NEW.offer_id, 'StandardStatus', OLD.offer_status, NEW.offer_status, loai);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS history_tin_moi ON sale_offer_records;
CREATE TRIGGER history_tin_moi AFTER INSERT ON sale_offer_records
  FOR EACH ROW EXECUTE FUNCTION history_tin_moi();
DROP TRIGGER IF EXISTS history_doi_gia ON sale_offer_records;
CREATE TRIGGER history_doi_gia AFTER UPDATE OF price_vnd ON sale_offer_records
  FOR EACH ROW WHEN (OLD.price_vnd IS DISTINCT FROM NEW.price_vnd) EXECUTE FUNCTION history_doi_gia();
DROP TRIGGER IF EXISTS history_doi_trang_thai ON sale_offer_records;
CREATE TRIGGER history_doi_trang_thai AFTER UPDATE OF offer_status ON sale_offer_records
  FOR EACH ROW WHEN (OLD.offer_status IS DISTINCT FROM NEW.offer_status) EXECUTE FUNCTION history_doi_trang_thai();

-- Lịch sử giá gom theo căn: mọi dòng giá của mọi tin gắn căn (bên đọc sắp theo modification_timestamp).
CREATE OR REPLACE VIEW property_price_history AS
SELECT po.property_id, h.resource_record_key AS offer_id, h.change_type, h.previous_value, h.new_value,
       h.modification_timestamp
  FROM history_transactional h
  JOIN property_offers po ON po.offer_id = h.resource_record_key
 WHERE h.field_name = 'ListPrice';

-- Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, trục change_type)
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('change_type', 'new_listing', 'NewListing', 'Tin mới', false, 1),
  ('change_type', 'price_change', 'PriceChange', 'Đổi giá', false, 2),
  ('change_type', 'withdrawn', 'Withdrawn', 'Gỡ tin', false, 3),
  ('change_type', 'back_on_market', 'BackOnMarket', 'Chào lại', false, 4),
  ('change_type', 'active_under_contract', 'ActiveUnderContract', 'Đã cọc', false, 5),
  ('change_type', 'closed', 'Closed', 'Đã bán', false, 6)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('history_transactional', 'change_type', 'change_type')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;

-- 7. Vị từ B5 «Sống» của bậc dữ liệu (FRAMING §3.4).
-- Cửa sổ độ tươi: một hằng cho mọi nguồn (Hỏi-2) — tinh chỉnh theo nguồn khi có số đo.
CREATE OR REPLACE FUNCTION freshness_window()
RETURNS interval LANGUAGE sql IMMUTABLE AS $$ SELECT interval '7 days' $$;

-- property_data_level bản 059 — thân 056 + B5: tin ở B4, đang chào, lần thấy cuối trong cửa sổ độ tươi, và căn có ít
-- nhất hai mốc giá trong lịch sử (Hỏi-3: một đổi giá, hoặc hai tin cùng căn). Căn vẫn lấy tin tốt nhất (PL16).
-- Quá cửa sổ → căn ở B4 với chỗ kẹt hieu-luc; B5 không còn bậc kế → giu-nhip.
CREATE OR REPLACE FUNCTION property_data_level(p_ids bigint[] DEFAULT NULL)
RETURNS TABLE (property_id bigint, data_level text, ke_thieu text) LANGUAGE sql STABLE AS $$
  WITH gia AS (
    SELECT h.property_id, count(*) AS n FROM property_price_history h
     WHERE h.new_value IS NOT NULL AND (p_ids IS NULL OR h.property_id = ANY (p_ids))
     GROUP BY h.property_id
  ), tin AS (
    SELECT p.id AS pid,
           CASE
             WHEN o.offer_id IS NULL
               OR NOT offer_core_complete(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id) THEN 0
             WHEN NOT d.da_do THEN 2
             WHEN p.verification = 'verified' AND d.su_that THEN
               CASE WHEN o.offer_status = 'active' AND o.last_seen >= now() - freshness_window()
                         AND coalesce(g.n, 0) >= 2 THEN 5 ELSE 4 END
             ELSE 3
           END AS lv
      FROM properties p
      LEFT JOIN property_offers po ON po.property_id = p.id
      LEFT JOIN sale_offers o ON o.offer_id = po.offer_id
      LEFT JOIN gia g ON g.property_id = p.id
      LEFT JOIN LATERAL (
        SELECT bool_and(coalesce(o.field_provenance -> k ->> 'measured', '') = 'true') AS da_do,
               bool_and(coalesce(o.field_provenance -> k ->> 'tier', '') = 'fact') AS su_that
          FROM unnest(ARRAY['kind', 'property_type', 'price_vnd', 'area_m2', 'area_id']) AS k
      ) d ON true
     WHERE p_ids IS NULL OR p.id = ANY (p_ids)
  ), can AS (
    SELECT pid, max(lv) AS lv FROM tin GROUP BY pid
  )
  SELECT pid, 'B' || lv,
         CASE lv WHEN 0 THEN 'truong-loi' WHEN 2 THEN 'so-do' WHEN 3 THEN 'xac-minh' WHEN 4 THEN 'hieu-luc'
                 ELSE 'giu-nhip' END
    FROM can
$$;
