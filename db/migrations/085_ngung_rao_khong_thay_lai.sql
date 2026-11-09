-- 085_ngung_rao_khong_thay_lai.sql — V6 tin-ngung-rao-khong-thay-lai (Q4 Mạnh 08/11): tin không thấy lại ở nguồn quá N
-- ngày trong khi nguồn vẫn thu → phát biểu suy luận offer_status = withdrawn («Ngừng rao»); thấy lại thì rút, về Đang chào.
-- Thiết kế: docs/superpowers/specs/2026-11-08-tin-ngung-rao-khong-thay-lai-design.md · hợp đồng
-- _acceptance/tin-ngung-rao-khong-thay-lai/contract.md (Cổng Phạm vi Mạnh duyệt 09/11: N = 21 ngày, dùng withdrawn).
-- Chỉ hàm (CREATE OR REPLACE), không DDL bảng — áp lại nhiều lần được. Không xoá, không nghỉ tin, không chạm cột người bán.
-- Phân xử giữ resolve_offer_status của 059 (phát biểu sống mới nhất thắng). Chỉ local (trạng thái chào chưa lên cloud).

-- 1. N theo nguồn — chỗ DUY NHẤT khai N. Nguồn không có N (NULL) thì luật không đụng tới tin của nó.
CREATE OR REPLACE FUNCTION ngung_rao_sau_ngay(p_source text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_source IN ('S03', 'S05', 'S06') THEN 21 END
$$;

-- 2. Tin đang «không thấy lại» (NULL = mọi tin): tin sống của nguồn có N mà mốc thu − lần thấy cuối > N ngày.
--    Đo tới MỐC THU (không tới now()) nên nguồn hay nhóm ngừng thu thì không tin nào của nó bị ngừng rao vì việc ấy.
--    S06: lần thấy cuối = lần quét cuối (stg_chotot_ads.captured_at; last_seen của S06 là ngày đăng tin); tin không có
--         dòng stg bị bỏ qua — không lấy ngày đăng thay. Mốc = lần quét mới nhất của cùng region_v2 × ad_type.
--    S03: lần thấy cuối = last_seen (lần đăng hay đăng lại cuối); mốc = bài mới nhất của các nhóm mà tin đã đăng.
--    S05: lần thấy cuối = last_seen; mốc = last_seen mới nhất của tin sống S05.
--    Tin đã có phát biểu sống Đã cọc / Đã bán: để yên (bằng chứng ấy mạnh hơn việc không thấy lại).
CREATE OR REPLACE FUNCTION bang_chung_khong_thay_lai(p_offer_ids text[])
RETURNS TABLE (offer_id text, subj text, n_ngay integer, lan_thay_cuoi timestamptz, moc_thu timestamptz)
LANGUAGE sql STABLE AS $$
  WITH r AS (
    SELECT r.offer_id, r.source, r.originating_system_key AS osk, r.post_ids, r.last_seen,
           r.source || ':' || coalesce(r.originating_system_key, r.post_ids[1]) AS subj,
           offer_subject_keys(r.source, r.originating_system_key, r.post_ids) AS subjs,
           ngung_rao_sau_ngay(r.source) AS n
      FROM sale_offer_records r
     WHERE (p_offer_ids IS NULL OR r.offer_id = ANY (p_offer_ids))
       AND r.retired_at IS NULL
       AND ngung_rao_sau_ngay(r.source) IS NOT NULL
       AND coalesce(r.originating_system_key, r.post_ids[1]) IS NOT NULL
  ),
  moc_s06 AS (SELECT s.region_v2, s.ad_type, max(s.captured_at) AS m FROM stg_chotot_ads s GROUP BY 1, 2),
  nhom AS (SELECT p.group_name, max(p.posted_at) AS m FROM stg_zalo_posts p WHERE p.group_name IS NOT NULL GROUP BY 1),
  x AS (
    SELECT r.offer_id, greatest(r.last_seen, s.captured_at) AS lan, ms.m AS moc
      FROM r
      JOIN stg_chotot_ads s ON s.list_id::text = r.osk
      JOIN moc_s06 ms ON ms.region_v2 = s.region_v2 AND ms.ad_type = s.ad_type
     WHERE r.source = 'S06'
    UNION ALL
    SELECT r.offer_id, r.last_seen,
           (SELECT max(n.m) FROM stg_zalo_posts p JOIN nhom n ON n.group_name = p.group_name
             WHERE p.post_id = ANY (r.post_ids))
      FROM r WHERE r.source = 'S03'
    UNION ALL
    SELECT r.offer_id, r.last_seen,
           (SELECT max(o.last_seen) FROM sale_offer_records o WHERE o.source = 'S05' AND o.retired_at IS NULL)
      FROM r WHERE r.source = 'S05'
  )
  SELECT r.offer_id, r.subj, r.n, x.lan, x.moc
    FROM r JOIN x ON x.offer_id = r.offer_id
   WHERE x.moc > x.lan + make_interval(days => r.n)
     AND NOT EXISTS (SELECT 1 FROM field_assertions fa
                      WHERE fa.subject_key = ANY (r.subjs) AND fa.field = 'offer_status' AND fa.retracted_at IS NULL
                        AND fa.value IN ('active_under_contract', 'closed')
                        AND coalesce(fa.evidence ->> 'offer_id', r.offer_id) = r.offer_id)
$$;

-- 3. Ghi luật (NULL = mọi tin). Rút trước: phát biểu luật sống mà tin không còn «không thấy lại» (đã thấy lại, đã nghỉ,
--    hay lần thấy cuối đã dời) → retract_reason 'thay-lai' (rào chỉ-thêm của 045 chỉ cho rút). Rồi ghi cho tin «không thấy
--    lại» chưa có phát biểu sống: withdrawn, inferred/e1_rule, observed_at = lần thấy cuối + N (sau phát biểu active của
--    059, vốn ghi ở last_seen ≤ lần thấy cuối, nên thắng ở phân xử). Trả {"moi": số phát biểu mới, "rut": số phát biểu rút}.
CREATE OR REPLACE FUNCTION ghi_khong_thay_lai(p_offer_ids text[])
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  n_rut integer;
  n_moi integer;
BEGIN
  WITH d AS MATERIALIZED (SELECT * FROM bang_chung_khong_thay_lai(p_offer_ids))
  UPDATE field_assertions fa
     SET retracted_at = clock_timestamp(), retract_reason = 'thay-lai'
   WHERE fa.field = 'offer_status' AND fa.retracted_at IS NULL AND fa.rule_id LIKE 'khong-thay-lai:%'
     AND (p_offer_ids IS NULL OR fa.evidence ->> 'offer_id' = ANY (p_offer_ids))
     AND NOT EXISTS (SELECT 1 FROM d
                      WHERE fa.rule_id = 'khong-thay-lai:' || d.offer_id AND fa.subject_key = d.subj
                        AND fa.observed_at = d.lan_thay_cuoi + make_interval(days => d.n_ngay));
  GET DIAGNOSTICS n_rut = ROW_COUNT;
  INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence,
                                observed_at)
  SELECT d.subj, 'offer_status', 'withdrawn', 'inferred', 'e1_rule', '085', 'khong-thay-lai:' || d.offer_id,
         jsonb_build_object('offer_id', d.offer_id, 'bang_chung', 'khong-thay-lai', 'n_ngay', d.n_ngay,
                            'lan_thay_cuoi', d.lan_thay_cuoi, 'moc_thu', d.moc_thu),
         d.lan_thay_cuoi + make_interval(days => d.n_ngay)
    FROM bang_chung_khong_thay_lai(p_offer_ids) d
   WHERE NOT EXISTS (SELECT 1 FROM field_assertions fa
                      WHERE fa.subject_key = d.subj AND fa.field = 'offer_status' AND fa.retracted_at IS NULL
                        AND fa.rule_id = 'khong-thay-lai:' || d.offer_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n_moi = ROW_COUNT;
  RETURN jsonb_build_object('moi', n_moi, 'rut', n_rut);
END $$;

-- 4. bang_chung_chao bản 085 — nguyên chữ ký và thân 059 §5b, chỉ thêm một điều kiện vào doi_at: phát biểu của luật
--    khong-thay-lai không phải bằng chứng «tin đã gỡ rồi quay lại». Thiếu điều kiện này, mỗi lượt ghi_bang_chung_chao
--    rút active rồi ghi lại active ở doi_at + 1µs và phát biểu ngừng rao bị dội ngay lượt sau.
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
             AND coalesce(fa.rule_id, '') NOT LIKE 'khong-thay-lai:%'
             AND fa.value = CASE o.v WHEN 'active' THEN 'withdrawn' ELSE 'active' END)
    FROM o
    LEFT JOIN field_assertions cur ON cur.subject_key = o.subj AND cur.field = 'offer_status' AND cur.retracted_at IS NULL
                                  AND cur.value_key = o.v AND cur.method = o.method AND cur.rule_id = 'offer:' || o.offer_id
$$;
