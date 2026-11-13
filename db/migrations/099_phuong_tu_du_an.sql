-- 099_phuong_tu_du_an.sql — DA9 phuong-tu-du-an: phường suy ra từ dự án vào cột area_id của tin khi tin chỉ tới tỉnh hay trống.
-- docs/superpowers/specs/2026-11-13-phuong-tu-du-an-design.md §2 · _acceptance/phuong-tu-du-an/
-- Khuôn 068: KHÔNG chép thân resolve_offer_fields (nhánh khác có thể định nghĩa lại) — đọc định nghĩa đang chạy rồi chèn
-- cạnh mốc; thiếu mốc thì dừng có tên MOC-099, không sửa đoán. Áp lại được (thấy lời gọi resolve_offer_area_du_an thì bỏ qua).
-- Một migration sau ghi đè resolve_offer_fields thì áp lại 099 (cùng 068).
--   (a) giữ khoá field_provenance.area_id mang nguon = 'du-an' qua lượt dựng lại field_provenance;
--   (b) hàm resolve_offer_area_du_an(text[]) — luật giá trị §2 của thiết kế;
--   (c) gọi (b) ngay sau UPDATE chính, cộng số tin đổi vào offers_changed.
-- Nhãn «suy ra từ dự án»: field_provenance.area_id = {method: registry_inherit, tier: inferred, nguon: du-an, goc, v}
--   goc = giá trị cột trước khi nhận phường (nguồn ghi), v = phường đã đặt. Cột khác v (transform ghi lại) thì nhãn cũ hết
--   hiệu lực và giá trị gốc là cột hiện tại.
-- KHÔNG sync cloud riêng: field_provenance không trong danh sách cho phép (pipeline/sync-cloud.mjs); cột area_id đi như cũ.
-- Áp lên DB máy thu/cloud là bước triển khai riêng (lời Mạnh sau gộp, pg_dump trước).

-- (b) Luật giá trị cho mỗi tin trong phạm vi (NULL = mọi tin):
--   G = goc của nhãn khi cột đang bằng v của nhãn, ngược lại G = cột;
--   G là phường (submarket) → cột = G (không bao giờ đổi phường nguồn);
--   G trống/tỉnh và các bài của tin có đúng MỘT giá trị area_id sống inferred · registry_inherit → cột = phường ấy + nhãn;
--   còn lại → cột = G, gỡ nhãn du-an nếu có.
CREATE OR REPLACE FUNCTION resolve_offer_area_du_an(p_offer_ids text[])
RETURNS integer LANGUAGE sql AS $$
  WITH o AS (
    SELECT r.offer_id, r.area_id AS cot, r.field_provenance -> 'area_id' AS fp,
           coalesce(r.field_provenance -> 'area_id' ->> 'nguon' = 'du-an', false) AS la_nhan,
           offer_subject_keys(r.source, r.originating_system_key, r.post_ids) AS subj
      FROM sale_offer_records r
     WHERE p_offer_ids IS NULL OR r.offer_id = ANY (p_offer_ids)
  ), g AS (
    SELECT o.*, CASE WHEN o.la_nhan AND o.fp ->> 'v' IS NOT DISTINCT FROM o.cot THEN o.fp ->> 'goc' ELSE o.cot END AS goc
      FROM o
  ), sk AS (
    SELECT DISTINCT g.offer_id, unnest(g.subj) AS subject_key FROM g
  ), k AS (
    SELECT sk.offer_id, array_agg(DISTINCT fa.value ORDER BY fa.value) AS ws
      FROM sk JOIN field_assertions fa ON fa.subject_key = sk.subject_key AND fa.retracted_at IS NULL
                                     AND fa.resource_name = 'Property' AND fa.field = 'area_id'
                                     AND fa.evidence_tier = 'inferred' AND fa.method = 'registry_inherit'
     GROUP BY sk.offer_id
  ), muc AS (
    SELECT g.offer_id, g.la_nhan,
           CASE WHEN ar.region_type = 'submarket' THEN g.goc
                WHEN cardinality(k.ws) = 1 THEN k.ws[1]
                ELSE g.goc END AS cot_moi,
           CASE WHEN ar.region_type IS DISTINCT FROM 'submarket' AND cardinality(k.ws) = 1
                THEN jsonb_build_object('method', 'registry_inherit', 'tier', 'inferred', 'nguon', 'du-an',
                                        'goc', g.goc, 'v', k.ws[1]) END AS nhan_moi
      FROM g
      LEFT JOIN k ON k.offer_id = g.offer_id
      LEFT JOIN areas ar ON ar.id = g.goc
  ), upd AS (
    UPDATE sale_offer_records r SET
           area_id = m.cot_moi,
           field_provenance = CASE WHEN m.nhan_moi IS NOT NULL
                                   THEN coalesce(r.field_provenance, '{}'::jsonb) || jsonb_build_object('area_id', m.nhan_moi)
                                   WHEN m.la_nhan THEN r.field_provenance - 'area_id'
                                   ELSE r.field_provenance END
      FROM muc m
     WHERE r.offer_id = m.offer_id
       AND (r.area_id IS DISTINCT FROM m.cot_moi
            OR (m.nhan_moi IS NOT NULL AND r.field_provenance -> 'area_id' IS DISTINCT FROM m.nhan_moi)
            OR (m.nhan_moi IS NULL AND m.la_nhan))
    RETURNING 1
  )
  SELECT count(*)::int FROM upd
$$;

-- (a) + (c): chèn vào định nghĩa đang chạy của resolve_offer_fields.
DO $do$
DECLARE
  ham   regprocedure := to_regprocedure('resolve_offer_fields(text[])');
  moc_1 constant text := $m$field_provenance -> 'offer_status' AS fp_chao$m$;
  moc_2 constant text := $m$END AS field_provenance$m$;
  moc_3 constant text := $m$SELECT (SELECT count(*) FROM kq), (SELECT count(*) FROM upd) INTO n_offers, n_changed;$m$;
  dinh_nghia text;
  so_lan int;
BEGIN
  IF ham IS NULL THEN
    RAISE EXCEPTION 'MOC-099: không có hàm resolve_offer_fields(text[])';
  END IF;
  dinh_nghia := pg_get_functiondef(ham);
  IF position('resolve_offer_area_du_an' IN dinh_nghia) > 0 THEN
    RETURN;   -- đã áp
  END IF;
  FOREACH so_lan IN ARRAY ARRAY[
      (length(dinh_nghia) - length(replace(dinh_nghia, moc_1, ''))) / length(moc_1),
      (length(dinh_nghia) - length(replace(dinh_nghia, moc_2, ''))) / length(moc_2),
      (length(dinh_nghia) - length(replace(dinh_nghia, moc_3, ''))) / length(moc_3)] LOOP
    IF so_lan <> 1 THEN
      RAISE EXCEPTION 'MOC-099: định nghĩa resolve_offer_fields không còn đúng một lần mỗi mốc (fp_chao, END AS field_provenance, INTO n_offers), phải sửa tay 099';
    END IF;
  END LOOP;
  dinh_nghia := replace(dinh_nghia, moc_1, moc_1 || $m$, field_provenance -> 'area_id' AS fp_area$m$);
  dinh_nghia := replace(dinh_nghia, moc_2, $m$END
             || CASE WHEN max(o.fp_area::text) IS NULL
                       OR max(o.fp_area::text)::jsonb ->> 'nguon' IS DISTINCT FROM 'du-an' THEN '{}'::jsonb
                     ELSE jsonb_build_object('area_id', max(o.fp_area::text)::jsonb) END AS field_provenance$m$);
  dinh_nghia := replace(dinh_nghia, moc_3, moc_3 || $m$
  n_changed := n_changed + resolve_offer_area_du_an(p_offer_ids);   -- 099: phường suy ra từ dự án$m$);
  EXECUTE dinh_nghia;
END $do$;
