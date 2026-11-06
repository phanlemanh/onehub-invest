-- 069_loai_hinh_suy_luan.sql — hàng s03-len-cong (SL1), ngả B Mạnh chọn 03/11 (`_acceptance/s03-len-cong/`).
-- Luật cũ (045, Hỏi-3 lát OCP1): lớp `inferred` không bao giờ vào cột. Nới hẹp cho riêng `property_type`: không có lớp trên và
-- đúng một giá trị suy thì cột nhận giá trị đó, provenance ghi `tier: inferred`; hai giá trị suy trái nhau vẫn về `unknown` kèm
-- `goi_y`; trường khác giữ luật cũ. Không có dữ liệu nào đổi lúc áp: ngày 02/11 chưa có phát biểu `property_type` lớp `inferred`.
-- Vá thân hàm đang có, theo khuôn 068, để áp được ở mọi thứ tự với 068 (và mọi migration vá khác); không chép cả hàm, không chạm
-- hai mốc `offer_status` của 068. Migration chép cả hàm áp sau tệp này phải dựng trên bản đã có luật (SV2 lấy số từ 070).
-- Chạy lại an toàn.
DO $do$
DECLARE
  ham    regprocedure := to_regprocedure('resolve_offer_fields(text[])');
  moc    constant text := $m$SELECT offer_id, field, min(tier_rank) AS tr FROM g WHERE tier_rank < 2 GROUP BY offer_id, field$m$;
  moi    constant text := $m$SELECT offer_id, field, min(tier_rank) AS tr FROM g GROUP BY offer_id, field
    HAVING min(tier_rank) < 2 OR (field = 'property_type' AND count(*) = 1) /* inferred_vao_cot */$m$;
  ghi_cu constant text := $m$(suy luận không bao giờ)$m$;
  ghi_moi constant text := $m$(suy luận chỉ vào cột ở property_type, đúng một giá trị — 069)$m$;
  dinh_nghia text;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-069: không có hàm resolve_offer_fields(text[])';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('inferred_vao_cot' IN dinh_nghia) > 0 THEN
    RETURN;   -- đã có luật
  END IF;
  IF position(moc IN dinh_nghia) = 0 THEN
    RAISE EXCEPTION 'MOC-069: định nghĩa resolve_offer_fields không còn mốc của CTE top, phải sửa tay 069';
  END IF;
  dinh_nghia := replace(replace(dinh_nghia, moc, moi), ghi_cu, ghi_moi);
  EXECUTE dinh_nghia;
END $do$;

-- Hoàn tác đề xuất E1 trùng giá trị: nhánh khớp theo (chủ thể, trường, giá trị, phương pháp) của revert_enrichment cũng trúng phát biểu
-- suy `loai-hinh-nhom` cùng `e1_rule`. Hoàn tác phải trả về trạng thái trước đề xuất (AC-11), nên nhánh này không rút lớp `inferred`.
DO $do$
DECLARE
  ham    regprocedure := to_regprocedure('revert_enrichment(bigint[],text,text)');
  moc    constant text := $m$AND method = CASE WHEN coalesce(r.decided_by, '') LIKE 'hitl:%' THEN 'hitl' ELSE r.source END$m$;
  moi    constant text := moc || $m$ AND evidence_tier <> 'inferred' /* giu_suy_khi_hoan_tac */$m$;
  dinh_nghia text;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-069: không có hàm revert_enrichment';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('giu_suy_khi_hoan_tac' IN dinh_nghia) > 0 THEN
    RETURN;
  END IF;
  IF position(moc IN dinh_nghia) = 0 THEN
    RAISE EXCEPTION 'MOC-069: định nghĩa revert_enrichment không còn mốc khớp phát biểu, phải sửa tay 069';
  END IF;
  EXECUTE replace(dinh_nghia, moc, moi);
END $do$;
