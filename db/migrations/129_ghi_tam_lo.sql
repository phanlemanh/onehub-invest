-- 129_ghi_tam_lo.sql — NB10 ghi-tam-do-sau-co-han: giá trị máy tự ghi khi hai phiếu độc lập trùng nhau mang mã lô, cờ «chưa đo»
-- và hạn đo bù; rút được cả lô; lô quá hạn hay đo bù không đạt thì ô tự tụt và rút lô; giá trị ghi tạm không làm căn lên B3.
-- Nguồn: ROADMAP §3 mục 63 quyết định 3 (Mạnh «Chốt cả ba», 24/11) · thiết kế
-- docs/superpowers/specs/2026-11-26-ghi-tam-do-sau-co-han-design.md · hồ sơ _acceptance/ghi-tam-do-sau-co-han (Mạnh duyệt Cổng
-- Phạm vi 26/11: Hỏi-2 nấc 1 kèm cờ, Hỏi-4 máy tự rút chỉ cho đề xuất ghi tạm, Hỏi-5 lô theo lượt × trường).
-- RESO: bảng vận hành nội bộ (lô ghi tạm, trạng thái ô), không phải field tin/căn — không vào pipeline/mappings.yaml (ADR-0011).
-- Chỉ máy thu; không DDL cloud (bảng và cột mới không nằm trong danh sách sync).
--
-- Chạy lại không đổi dòng nào: bảng/cột IF NOT EXISTS, lô điền lùi ON CONFLICT DO NOTHING (hạn giữ nguyên ngày áp đầu), gắn lô
-- chỉ cho đề xuất còn lo_id NULL, hàm CREATE OR REPLACE.
--
-- Hai hàm chép NGUYÊN thân bản mới nhất và đổi đúng một chỗ (sinh bằng script, có assert):
--   revert_enrichment — thân 066, khối kiểm actor nhận thêm may:ghi-tam: cho đề xuất thuộc lô ghi tạm;
--   unit_data_level   — thân 087, CTE du loại tin có loại hình từ ghi tạm còn sống.
--
-- Lùi: _acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql (một giao dịch: gỡ ba hàm mới, hai cột, hai bảng; nạp lại nguyên văn
-- revert_enrichment bản 066 và unit_data_level bản 087). Đã chạy thử trên bản chép — số ở ap-may-thu.md của hồ sơ.

-- <<<BANG-129
CREATE TABLE IF NOT EXISTS ghi_tam_lo (
  ma            text PRIMARY KEY,
  field         text NOT NULL CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw')),
  nguon_luot    text NOT NULL,
  doc_lap       boolean NOT NULL,
  ghi_boi       text NOT NULL,
  model         text,
  nac           smallint NOT NULL CHECK (nac BETWEEN 0 AND 4),
  mo_luc        timestamptz NOT NULL DEFAULT now(),
  han_do_bu     date NOT NULL,
  ket_qua_do_bu text NOT NULL DEFAULT 'chua-do' CHECK (ket_qua_do_bu IN ('chua-do', 'dat', 'khong-dat')),
  trang_thai    text NOT NULL DEFAULT 'dang-ghi' CHECK (trang_thai IN ('dang-ghi', 'dat', 'da-rut')),
  doi_boi       text,
  doi_luc       timestamptz,
  ly_do         text
);
COMMENT ON TABLE ghi_tam_lo IS 'NB10: lô giá trị máy tự ghi khi hai phiếu độc lập trùng nhau; hạn đo bù hai tuần (ROADMAP mục 63 QĐ3)';

-- Ô (trường của «Bổ sung tin») dừng tự ghi sau khi một lô của nó quá hạn hay đo bù không đạt; chỉ người mở lại.
CREATE TABLE IF NOT EXISTS ghi_tam_o (
  field      text PRIMARY KEY CHECK (field IN ('property_type', 'bedrooms', 'bathrooms', 'street_raw', 'block_raw')),
  dung       boolean NOT NULL DEFAULT false,
  ly_do      text,
  lo_ma      text,
  luc        timestamptz,
  mo_lai_boi text
);

ALTER TABLE enrichment_proposals ADD COLUMN IF NOT EXISTS lo_id text REFERENCES ghi_tam_lo (ma);
ALTER TABLE enrichment_proposals ADD COLUMN IF NOT EXISTS ghi_tam boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS enrichment_proposals_lo_id_idx ON enrichment_proposals (lo_id) WHERE lo_id IS NOT NULL;
-- BANG-129>>>

-- <<<DIEN-LUI-129
-- Ba lô cho 2.290 giá trị đã tự ghi trước NB10 (đếm 26/11 trên DB máy thu: 1.993 · 187 · 110). Chỉ tạo lô khi có giá trị;
-- cửa sổ applied_at trước 24/11 (lượt đêm đứng từ 23/11) để lượt đêm về sau không bị gắn nhầm vào lô cũ.
INSERT INTO ghi_tam_lo (ma, field, nguon_luot, doc_lap, ghi_boi, model, nac, han_do_bu)
SELECT v.ma, v.field, v.nguon, v.doc_lap, 'migration:129', v.model, 1, current_date + 14
  FROM (VALUES
    ('doc-toan-bo-loai-hinh',   'property_type', 'doc-toan-bo 03–05/11', true,  'doc', 'gateway:anthropic/claude-haiku-5.5'),
    ('truoc-doc-lap-loai-hinh', 'property_type', 'enrich hằng đêm trước độc lập', false, 'enrich-', 'qwen27b'),
    ('truoc-doc-lap-toa',       'block_raw',     'enrich hằng đêm trước độc lập', false, 'enrich-', 'qwen27b')
  ) AS v (ma, field, nguon, doc_lap, tien_to, model)
 WHERE EXISTS (SELECT 1 FROM enrichment_proposals ep
                WHERE ep.status = 'applied' AND ep.route = 'corroborated' AND ep.field = v.field
                  AND ep.applied_at < '2026-11-24' AND ep.lo_id IS NULL
                  AND ep.run_id LIKE v.tien_to || '%' AND (v.tien_to <> 'doc' OR ep.run_id NOT LIKE 'enrich-%'))
ON CONFLICT (ma) DO NOTHING;

UPDATE enrichment_proposals ep
   SET lo_id = CASE
                 WHEN ep.run_id LIKE 'enrich-%' AND ep.field = 'property_type' THEN 'truoc-doc-lap-loai-hinh'
                 WHEN ep.run_id LIKE 'enrich-%' AND ep.field = 'block_raw'     THEN 'truoc-doc-lap-toa'
                 ELSE 'doc-toan-bo-loai-hinh'
               END,
       ghi_tam = true
 WHERE ep.status = 'applied' AND ep.route = 'corroborated' AND ep.lo_id IS NULL AND ep.applied_at < '2026-11-24'
   AND ((ep.run_id LIKE 'enrich-%' AND ep.field IN ('property_type', 'block_raw'))
        OR (ep.run_id LIKE 'doc%' AND ep.run_id NOT LIKE 'enrich-%' AND ep.field = 'property_type'));
-- DIEN-LUI-129>>>

-- <<<HAM-129
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
  -- 129: người (hitl:) như cũ; actor máy may:ghi-tam:<lý do> CHỈ khi mọi id thuộc một lô ghi tạm còn cờ (NB10, Hỏi-4).
  IF p_actor IS NULL OR NOT (
       p_actor ~ '^hitl:.+'
       OR (p_actor ~ '^may:ghi-tam:.+'
           AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p_ids, '{}'::bigint[])) AS x(id)
                             LEFT JOIN enrichment_proposals e ON e.id = x.id
                            WHERE e.id IS NULL OR e.lo_id IS NULL OR NOT e.ghi_tam))) THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>); actor máy may:ghi-tam: chỉ cho đề xuất thuộc lô ghi tạm, nhận: %', p_actor;
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

-- Rút cả lô: hoàn tác mọi đề xuất applied của lô qua revert_enrichment (ô về giá trị kế có căn cứ, superseded mở lại), đặt lô
-- da-rut. p_dung_o = true (quá hạn, đo bù không đạt) thì ô của trường dừng tự ghi tới khi người mở lại. Lô đã rút → 0.
CREATE OR REPLACE FUNCTION rut_lo_ghi_tam(p_ma text, p_actor text, p_ly_do text, p_dung_o boolean DEFAULT false)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  l   record;
  ids bigint[];
  n   integer := 0;
BEGIN
  IF p_ly_do IS NULL OR length(trim(p_ly_do)) = 0 THEN
    RAISE EXCEPTION 'rut_lo_ghi_tam: thiếu lý do';
  END IF;
  SELECT * INTO l FROM ghi_tam_lo WHERE ma = p_ma FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'rut_lo_ghi_tam: không có lô %', p_ma;
  END IF;
  IF l.trang_thai = 'da-rut' THEN
    RETURN 0;
  END IF;
  SELECT coalesce(array_agg(id ORDER BY id), '{}') INTO ids
    FROM enrichment_proposals WHERE lo_id = p_ma AND status = 'applied';
  IF cardinality(ids) > 0 THEN
    n := revert_enrichment(ids, p_actor, p_ly_do);
  END IF;
  UPDATE ghi_tam_lo SET trang_thai = 'da-rut', doi_boi = p_actor, doi_luc = now(), ly_do = p_ly_do WHERE ma = p_ma;
  IF p_dung_o THEN
    INSERT INTO ghi_tam_o (field, dung, ly_do, lo_ma, luc) VALUES (l.field, true, p_ly_do, p_ma, now())
    ON CONFLICT (field) DO UPDATE SET dung = true, ly_do = EXCLUDED.ly_do, lo_ma = EXCLUDED.lo_ma, luc = EXCLUDED.luc,
                                      mo_lai_boi = NULL;
  END IF;
  INSERT INTO ops_audit (actor, action, env, detail)
  VALUES (p_actor, 'ghi-tam:rut-lo', 'local', jsonb_build_object('lo', p_ma, 'field', l.field, 'ly_do', p_ly_do,
                                                                'so_de_xuat', cardinality(ids), 'da_rut', n, 'dung_o', p_dung_o));
  RETURN n;
END $$;

-- Kết quả đo bù do người ghi (thước tự động chờ NB2): dat → giá trị của lô thôi mang cờ ghi tạm; khong-dat → rút lô, dừng ô.
CREATE OR REPLACE FUNCTION ghi_ket_qua_do_bu(p_ma text, p_ket_qua text, p_actor text)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  l record;
  n integer := 0;
BEGIN
  IF p_actor IS NULL OR p_actor !~ '^hitl:.+' THEN
    RAISE EXCEPTION 'ghi_ket_qua_do_bu: chỉ người ghi kết quả đo bù (actor hitl:<tên>), nhận: %', p_actor;
  END IF;
  IF p_ket_qua NOT IN ('dat', 'khong-dat') THEN
    RAISE EXCEPTION 'ghi_ket_qua_do_bu: kết quả phải là dat hoặc khong-dat, nhận: %', p_ket_qua;
  END IF;
  SELECT * INTO l FROM ghi_tam_lo WHERE ma = p_ma FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ghi_ket_qua_do_bu: không có lô %', p_ma;
  END IF;
  IF l.trang_thai <> 'dang-ghi' THEN
    RAISE EXCEPTION 'ghi_ket_qua_do_bu: lô % đã %', p_ma, l.trang_thai;
  END IF;
  UPDATE ghi_tam_lo SET ket_qua_do_bu = p_ket_qua, doi_boi = p_actor, doi_luc = now() WHERE ma = p_ma;
  IF p_ket_qua = 'dat' THEN
    UPDATE enrichment_proposals SET ghi_tam = false WHERE lo_id = p_ma AND ghi_tam;
    GET DIAGNOSTICS n = ROW_COUNT;
    UPDATE ghi_tam_lo SET trang_thai = 'dat' WHERE ma = p_ma;
    INSERT INTO ops_audit (actor, action, env, detail)
    VALUES (p_actor, 'ghi-tam:dat', 'local', jsonb_build_object('lo', p_ma, 'field', l.field, 'so_gia_tri', n));
    RETURN n;
  END IF;
  RETURN rut_lo_ghi_tam(p_ma, p_actor, 'đo bù không đạt', true);
END $$;

-- Lô dang-ghi quá hạn đo bù mà chưa có kết quả → máy rút bằng actor may:ghi-tam:het-han, dừng ô. Gọi ở đầu lượt làm giàu và
-- bằng lệnh độc lập (pipeline/scripts/rut-lo-ghi-tam.mjs --het-han). Trả các lô vừa rút.
CREATE OR REPLACE FUNCTION xet_han_ghi_tam()
RETURNS TABLE (ma text, field text, han_do_bu date, da_rut integer) LANGUAGE plpgsql AS $$
DECLARE
  l record;
BEGIN
  FOR l IN SELECT g.ma, g.field, g.han_do_bu FROM ghi_tam_lo g
            WHERE g.trang_thai = 'dang-ghi' AND g.ket_qua_do_bu = 'chua-do' AND g.han_do_bu < current_date
            ORDER BY g.ma LOOP
    ma := l.ma; field := l.field; han_do_bu := l.han_do_bu;
    da_rut := rut_lo_ghi_tam(l.ma, 'may:ghi-tam:het-han', 'quá hạn đo bù ' || l.han_do_bu::text, true);
    RETURN NEXT;
  END LOOP;
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
       -- 129 (NB10 AC-8): loại hình đến từ giá trị ghi tạm còn sống chưa phải «đã đo» — tin không làm căn lên B3–B5.
       AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep
                        WHERE ep.offer_id = g.offer_id AND ep.field = 'property_type'
                          AND ep.status = 'applied' AND ep.ghi_tam)
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
-- HAM-129>>>
