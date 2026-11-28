-- lui-129.sql — khối lùi của migration 129 (NB10), SINH bằng probes/sinh-129.mjs cùng lúc với 129 (không sửa tay): gỡ ba
-- hàm mới; vá ngược revert_enrichment và unit_data_level trên thân đang chạy (chỉ khi có dấu vá của 129); gỡ hai cột, hai bảng.
-- Một giao dịch. Áp trên máy thu chỉ theo lời Mạnh (ap-may-thu.md mục «Cách lùi»).
BEGIN;
DROP FUNCTION IF EXISTS xet_han_ghi_tam();
DROP FUNCTION IF EXISTS ghi_ket_qua_do_bu(text, text, text);
DROP FUNCTION IF EXISTS rut_lo_ghi_tam(text, text, text, boolean);
DO $va$
DECLARE
  d text := pg_get_functiondef('revert_enrichment(bigint[],text,text)'::regprocedure);
  tu text := $q$  -- 129 (NB10 Hỏi-4): người (hitl:) như cũ; actor máy may:ghi-tam:<lý do> CHỈ khi mọi id thuộc một lô ghi tạm còn cờ.
  IF p_actor IS NULL OR NOT (
       p_actor ~ '^hitl:.+'
       OR (p_actor ~ '^may:ghi-tam:.+'
           AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p_ids, '{}'::bigint[])) AS x(id)
                             LEFT JOIN enrichment_proposals e ON e.id = x.id
                            WHERE e.id IS NULL OR e.lo_id IS NULL OR NOT e.ghi_tam))) THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>); actor máy may:ghi-tam: chỉ cho đề xuất thuộc lô ghi tạm, nhận: %', p_actor;
  END IF;$q$;
  den text := $q$  IF p_actor IS NULL OR p_actor !~ '^hitl:.+' THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>), nhận: %', p_actor;
  END IF;$q$;
BEGIN
  IF position($q$129 (NB10 Hỏi-4)$q$ IN d) = 0 THEN
    RAISE NOTICE 'lùi 129: revert_enrichment(bigint[],text,text) chưa vá — bỏ qua';
    RETURN;
  END IF;
  IF position(tu IN d) = 0 THEN
    RAISE EXCEPTION 'lùi 129: thân revert_enrichment(bigint[],text,text) đang chạy không có khối cần vá — dừng, không đổi gì';
  END IF;
  IF length(d) - length(replace(d, tu, '')) <> length(tu) THEN
    RAISE EXCEPTION 'lùi 129: khối cần vá xuất hiện hơn một lần trong revert_enrichment(bigint[],text,text) — dừng, không đổi gì';
  END IF;
  EXECUTE replace(d, tu, den);
END $va$;

DO $va$
DECLARE
  d text := pg_get_functiondef('unit_data_level()'::regprocedure);
  tu text := $q$SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)
       -- 129 (NB10 AC-8): loại hình đến từ giá trị ghi tạm còn sống chưa phải «đã đo» — tin không làm căn lên B3–B5.
       AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep
                        WHERE ep.offer_id = g.offer_id AND ep.field = 'property_type'
                          AND ep.status = 'applied' AND ep.ghi_tam)$q$;
  den text := $q$SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)$q$;
BEGIN
  IF position($q$129 (NB10 AC-8)$q$ IN d) = 0 THEN
    RAISE NOTICE 'lùi 129: unit_data_level() chưa vá — bỏ qua';
    RETURN;
  END IF;
  IF position(tu IN d) = 0 THEN
    RAISE EXCEPTION 'lùi 129: thân unit_data_level() đang chạy không có khối cần vá — dừng, không đổi gì';
  END IF;
  IF length(d) - length(replace(d, tu, '')) <> length(tu) THEN
    RAISE EXCEPTION 'lùi 129: khối cần vá xuất hiện hơn một lần trong unit_data_level() — dừng, không đổi gì';
  END IF;
  EXECUTE replace(d, tu, den);
END $va$;

ALTER TABLE enrichment_proposals DROP COLUMN IF EXISTS lo_id, DROP COLUMN IF EXISTS ghi_tam;
DROP TABLE IF EXISTS ghi_tam_o;
DROP TABLE IF EXISTS ghi_tam_lo;
COMMIT;
