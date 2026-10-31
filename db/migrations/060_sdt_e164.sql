-- 060_sdt_e164.sql — SD3 sdt-luu-goc-e164: SĐT người bán lưu số gốc một dạng E.164 `+84…`, danh bạ có bí danh `sdt`,
-- `sellers` thành view trên danh bạ (đổi khoá SĐT một lần).
-- docs/research/audit-bang-nguoi-sdt-3010.md §3.2, §5b, §6.1, §6.4 (Hỏi-A, Hỏi-C bước 2); hồ sơ _acceptance/sdt-luu-goc-e164.
-- KHÔNG sync cloud số gốc (seller_phone, seller_name, sellers.name — PII_EXCLUDE). Số gốc chỉ ở máy: seller_phone, seller_name, sellers.name nằm trong PII_EXCLUDE của sync-cloud; cloud chỉ nhận khoá băm.
-- Idempotent: mỗi bước chỉ đụng dòng còn dạng cũ; áp lần hai không đổi gì. THỨ TỰ CÓ RĂNG — ánh xạ khoá căn và chép tên
-- người bán chạy TRƯỚC bước đổi dạng tin và bỏ bảng (đổi trước thì mất số dạng 0… và tên).

-- ---- 1. Từ vựng: alias_kind `sdt` (số gốc E.164) ----
ALTER TABLE registry_aliases DROP CONSTRAINT IF EXISTS registry_aliases_kind_check;
ALTER TABLE registry_aliases ADD CONSTRAINT registry_aliases_kind_check
  CHECK (kind IN ('tai_khoan_nguon', 'sdt_bam', 'ten', 'sdt'));
DROP INDEX IF EXISTS registry_aliases_dinh_danh_uq;
CREATE UNIQUE INDEX registry_aliases_dinh_danh_uq ON registry_aliases (source, kind, value)
  WHERE retired_at IS NULL AND kind IN ('tai_khoan_nguon', 'sdt_bam', 'sdt');

-- Sinh bằng `node pipeline/vocab.mjs --emit-seed` (dòng alias_kind/sdt).
INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
  ('alias_kind', 'sdt', NULL, 'SĐT số gốc', true, 4)
ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
  label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;

-- ---- 2. Giữ tên người bán (Hỏi-3): tên khác rỗng của bảng sellers cũ thành bí danh `ten` của người mang sdt_bam cùng
-- khoá. Chỉ khi sellers còn là BẢNG (lần áp hai: đã là view, bỏ qua). ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'sellers' AND c.relkind = 'r') THEN
    INSERT INTO registry_aliases (object_key, kind, value, source)
    SELECT DISTINCT a.object_key, 'ten', btrim(s.name), a.source
    FROM sellers s
    JOIN registry_aliases a ON a.kind = 'sdt_bam' AND a.retired_at IS NULL AND a.value = s.phone_hash
    WHERE btrim(coalesce(s.name, '')) <> ''
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ---- 3. Khoá căn: ánh xạ khoá cũ (băm dạng 0…) → khoá E.164 của cùng số, qua tin còn dạng cũ. TRƯỚC bước 4. ----
UPDATE properties p
SET seller_phone_hash = m.moi
FROM (
  SELECT DISTINCT seller_phone_hash AS cu,
         left(encode(sha256(convert_to('+84' || substr(seller_phone, 2), 'UTF8')), 'hex'), 32) AS moi
  FROM sale_offer_records
  WHERE seller_phone ~ '^0[35789][0-9]{8}$' AND seller_phone_hash IS NOT NULL
) m
WHERE p.seller_phone_hash = m.cu;

-- ---- 4. Tin: đổi dạng 0… → +84…, khoá băm tính lại từ E.164 ----
UPDATE sale_offer_records
SET seller_phone = '+84' || substr(seller_phone, 2),
    seller_phone_hash = left(encode(sha256(convert_to('+84' || substr(seller_phone, 2), 'UTF8')), 'hex'), 32)
WHERE seller_phone ~ '^0[35789][0-9]{8}$';

-- ---- 4b. Giá trị không phải SĐT di động theo luật SD2 (vd 11 chữ số còn từ trước SD2): bỏ số và khoá — transform lượt sau
-- cũng không ra số ấy. Chỉ đụng dòng sai luật, áp lần hai không còn dòng nào. ----
UPDATE sale_offer_records
SET seller_phone = NULL, seller_phone_hash = NULL
WHERE seller_phone IS NOT NULL AND seller_phone !~ '^\+84[35789][0-9]{8}$';

-- ---- 5. sellers: bỏ bảng (Hỏi-5; pg_dump trước khi áp lên máy thu), view cùng cột trên bí danh `sdt` + tin.
-- Dòng = số có bí danh sdt còn hiệu lực và có tin sống (như bảng cũ sau dọn mồ côi). Cột tổng hợp như refresh-bait-gap cũ;
-- first_seen/last_seen từ mọi bản ghi tin kể cả đã nghỉ (Hỏi-4); name = tên khác rỗng mới nhất của tin (Hỏi-3).
-- Số giảm so thước tính THẲNG từ v_ruler_p2_area (cùng công thức bước 2 của refresh-bait-gap), không đọc bait_gap_pct:
-- luật loại tin phi lý (ON11) xoá bait_gap_pct của tin phi lý SAU bước người bán, mà sổ người bán phải giữ tín hiệu rao
-- mồi trên MỌI tin như bảng cũ. ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'sellers' AND c.relkind = 'r') THEN
    DROP TABLE sellers;
  END IF;
END $$;

CREATE OR REPLACE VIEW sellers AS
WITH g AS (
  SELECT o.*,
         CASE WHEN o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0 AND r.m IS NOT NULL
              THEN round((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1) END AS gap
  FROM sale_offers o
  LEFT JOIN v_ruler_p2_area r ON r.area_id = o.area_id
),
so AS (
  SELECT seller_phone,
         seller_phone_hash AS h,
         count(*) AS n_ads,
         array_agg(DISTINCT source) AS srcs,
         count(*) FILTER (WHERE kind = 'sale') AS n_sale,
         count(*) FILTER (WHERE kind = 'rent_lt') AS n_rent,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gap) FILTER (WHERE gap IS NOT NULL) AS med_gap,
         count(*) FILTER (WHERE gap >= 10) AS n_good,
         (array_agg(btrim(seller_name) ORDER BY last_seen DESC) FILTER (WHERE btrim(coalesce(seller_name, '')) <> ''))[1] AS ten
  FROM g
  WHERE seller_phone IS NOT NULL AND seller_phone_hash IS NOT NULL
  GROUP BY seller_phone, seller_phone_hash
),
lich AS (
  SELECT seller_phone, min(first_seen) AS fs, max(last_seen) AS ls
  FROM sale_offer_records
  WHERE seller_phone IS NOT NULL
  GROUP BY seller_phone
),
sdt AS (
  SELECT DISTINCT value FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL
)
SELECT so.h AS phone_hash,
       so.ten AS name,
       so.srcs AS sources,
       so.n_ads::integer AS n_ads,
       lich.fs AS first_seen,
       lich.ls AS last_seen,
       jsonb_build_object(
         'n_sale', so.n_sale, 'n_rent', so.n_rent,
         'median_gap_pct', so.med_gap, 'n_good_deals', so.n_good,
         'multi_channel', cardinality(so.srcs) > 1,
         'sources', to_jsonb(so.srcs)) AS flags
FROM so
JOIN sdt ON sdt.value = so.seller_phone
JOIN lich ON lich.seller_phone = so.seller_phone;
