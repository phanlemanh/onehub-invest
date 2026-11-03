-- 068_giu_nguon_goc_sdt.sql — hàng sdt-s06-ghep-tai-khoan: phân xử giữ khoá field_provenance.seller_phone.
-- docs/superpowers/specs/2026-11-02-sdt-s06-ghep-tai-khoan-design.md · _acceptance/sdt-s06-ghep-tai-khoan/
-- resolve_offer_fields dựng lại field_provenance và chỉ giữ offer_status, nên mọi lượt phân xử xoá dấu số trực tiếp / số ghép.
-- Nhánh khác có thể định nghĩa lại hàm này (067 của dãy N1, chưa vào main), nên 068 KHÔNG chép thân hàm: đọc định nghĩa đang
-- chạy rồi chèn phần giữ cạnh hai mốc của offer_status. Không đổi dòng tin nào. Áp lại được; một migration sau ghi đè hàm thì
-- áp lại 068 (bộ gán thấy mất phần giữ sẽ tự dừng, in CHUA-AP-068). Không thấy mốc thì dừng có tên MOC-068, không sửa đoán.
-- KHÔNG sync cloud: field_provenance không trong danh sách cho phép, seller_phone trong PII_EXCLUDE (pipeline/sync-cloud.mjs).
-- Áp lên DB máy thu là bước triển khai riêng (Mạnh duyệt, pg_dump trước).

DO $do$
DECLARE
  ham   regprocedure := to_regprocedure('resolve_offer_fields(text[])');
  moc_1 constant text := $m$field_provenance -> 'offer_status' AS fp_chao$m$;
  moc_2 constant text := $m$ELSE jsonb_build_object('offer_status', max(o.fp_chao::text)::jsonb) END AS field_provenance$m$;
  dinh_nghia text;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-068: không có hàm resolve_offer_fields(text[])';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('fp_sdt' IN dinh_nghia) > 0 THEN
    RETURN;   -- đã có phần giữ
  END IF;
  IF position(moc_1 IN dinh_nghia) = 0 OR position(moc_2 IN dinh_nghia) = 0 THEN
    RAISE EXCEPTION 'MOC-068: định nghĩa resolve_offer_fields không còn hai mốc của offer_status, phải sửa tay 068';
  END IF;
  dinh_nghia := replace(dinh_nghia, moc_1, moc_1 || $m$, field_provenance -> 'seller_phone' AS fp_sdt$m$);
  dinh_nghia := replace(dinh_nghia, moc_2,
    replace(moc_2, ' AS field_provenance', $m$
             || CASE WHEN max(o.fp_sdt::text) IS NULL THEN '{}'::jsonb
                     ELSE jsonb_build_object('seller_phone', max(o.fp_sdt::text)::jsonb) END AS field_provenance$m$));
  EXECUTE dinh_nghia;
END $do$;
