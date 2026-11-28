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
-- Hai hàm có sẵn được VÁ trên thân đang chạy, đúng một khối mỗi hàm (khối DO cuối tệp, sinh bằng probes/sinh-129.mjs): DB máy
-- thu chạy thân khác bản mới nhất trong kho (066 chưa áp ở máy thu, probe M5 26/11), nên không chép thân từ tệp nào.
--   revert_enrichment — khối kiểm actor nhận thêm may:ghi-tam: cho đề xuất thuộc lô ghi tạm;
--   unit_data_level   — CTE du loại tin có loại hình từ ghi tạm còn sống.
-- Đã vá thì bỏ qua; không thấy khối cần vá, hay thấy hơn một lần, thì dừng cả giao dịch.
--
-- Lùi: _acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql (một giao dịch: gỡ ba hàm mới; vá ngược hai hàm trên thân đang
-- chạy; gỡ hai cột, hai bảng). Đã chạy thử trên bản chép — số ở ap-may-thu.md của hồ sơ.

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

-- @@VA_HAM@@
-- HAM-129>>>
