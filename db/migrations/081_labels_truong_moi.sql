-- 081_labels_truong_moi.sql — truong-nhan-s03-081 (GN1): bảy trường nhãn mới và căn cứ «Danh mục CĐT» cho lát theo nhóm S03.
-- docs/superpowers/specs/2026-11-06-truong-nhan-s03-081-design.md · _acceptance/truong-nhan-s03-081 · số 081 do giám sát cấp.
-- Trường theo RESO DD 2.1: unit_number (UnitNumber), furnished (Furnished), view (View), availability_date (AvailabilityDate),
-- rent_includes (RentIncludes); direction_faces và price_basis là extension (mappings.yaml enums, ADR-0011).
-- KHÔNG sync cloud (072): labeler_id gắn hồ sơ người dùng app (tầng A); giá trị căn cứ danh_muc_cdt lấy từ S08 (chỉ nội bộ).
-- Áp lên DB máy thu là lời riêng của Mạnh (Hỏi-3 GN1: sau Cổng Bằng chứng, pg_dump ba bảng nhãn trước). Idempotent.

-- ---- 1. Trường của eval_labels: 17 trường GC0 + bảy trường GN1 ----
ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_field_check;
ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_field_check CHECK (field IN (
  'listing_intent', 'kind', 'property_type', 'project', 'building', 'price_min_vnd', 'price_max_vnd', 'area_m2', 'bedrooms',
  'subzone', 'stack', 'floor', 'bathrooms', 'bedrooms_plus', 'multi_unit', 'seller_name', 'seller_phone',
  'unit_number', 'furnished', 'direction_faces', 'view', 'availability_date', 'price_basis', 'rent_includes'));

-- ---- 2. Căn cứ thứ năm: Danh mục CĐT (S08) ----
ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_basis_check;
ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_basis_check
  CHECK (basis IS NULL OR basis IN ('chu_bai', 'ngu_canh_nhom', 'kien_thuc_nghe', 'anh', 'danh_muc_cdt'));

-- ---- 3. Đồng thuận: giữ bốn cột của 054/072, thêm bảy trường vào danh sách. Cặp, khớp tính như cũ. ----
CREATE OR REPLACE VIEW eval_label_agreement AS
WITH truong(field) AS (
  VALUES ('listing_intent'), ('kind'), ('property_type'), ('project'), ('building'),
         ('price_min_vnd'), ('price_max_vnd'), ('area_m2'), ('bedrooms'),
         ('subzone'), ('stack'), ('floor'), ('bathrooms'), ('bedrooms_plus'), ('multi_unit'), ('seller_name'), ('seller_phone'),
         ('unit_number'), ('furnished'), ('direction_faces'), ('view'), ('availability_date'), ('price_basis'), ('rent_includes')
), lat AS (
  SELECT DISTINCT lat FROM eval_label_items
), du AS (
  SELECT l.item_id, l.field
  FROM eval_labels l JOIN eval_label_items i USING (item_id)
  WHERE i.double_label
  GROUP BY l.item_id, l.field
  HAVING count(DISTINCT l.labeler_id) = 2
), cap AS (
  SELECT i.lat, a.field,
         (a.not_stated AND b.not_stated) OR (NOT a.not_stated AND NOT b.not_stated AND a.value = b.value) AS khop
  FROM du
  JOIN eval_labels a ON a.item_id = du.item_id AND a.field = du.field
  JOIN eval_labels b ON b.item_id = du.item_id AND b.field = du.field AND a.labeler_id < b.labeler_id
  JOIN eval_label_items i ON i.item_id = du.item_id
)
SELECT lat.lat, truong.field,
       count(cap.khop)::int AS cap_du,
       (count(*) FILTER (WHERE cap.khop))::int AS khop,
       CASE WHEN count(cap.khop) = 0 THEN NULL
            ELSE round((count(*) FILTER (WHERE cap.khop))::numeric / count(cap.khop), 4) END AS ti_le
FROM lat CROSS JOIN truong
LEFT JOIN cap ON cap.lat = lat.lat AND cap.field = truong.field
GROUP BY lat.lat, truong.field;

-- ---- 4. Bảng tra của năm trục chọn (sổ từ vựng, sinh bằng vocab-core emitSeed; ADR-0011 điều kiện 4: lookup table) ----
-- Lược đồ chỉ có bảng nhãn (test lược đồ tạm) không có ref_lookup của 043: bỏ qua phần này, CHECK và view vẫn áp.
DO $seed$
BEGIN
  IF to_regclass('ref_lookup') IS NOT NULL THEN
    INSERT INTO ref_lookup (lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order) VALUES
      ('furnished', 'furnished', 'Furnished', 'Đủ nội thất', false, 1),
      ('furnished', 'partially', 'Partially', 'Nội thất cơ bản', false, 2),
      ('furnished', 'unfurnished', 'Unfurnished', 'Nhà trống', false, 3),
      ('furnished', 'negotiable', 'Negotiable', 'Thoả thuận', false, 4),
      ('direction_faces', 'east', NULL, 'Đông', true, 1),
      ('direction_faces', 'west', NULL, 'Tây', true, 2),
      ('direction_faces', 'south', NULL, 'Nam', true, 3),
      ('direction_faces', 'north', NULL, 'Bắc', true, 4),
      ('direction_faces', 'northeast', NULL, 'Đông Bắc', true, 5),
      ('direction_faces', 'southeast', NULL, 'Đông Nam', true, 6),
      ('direction_faces', 'northwest', NULL, 'Tây Bắc', true, 7),
      ('direction_faces', 'southwest', NULL, 'Tây Nam', true, 8),
      ('view', 'city', 'City', 'Thành phố', false, 1),
      ('view', 'lake', 'Lake', 'Hồ', false, 2),
      ('view', 'river', 'River', 'Sông', false, 3),
      ('view', 'park_greenbelt', 'ParkGreenbelt', 'Công viên', false, 4),
      ('view', 'garden', 'Garden', 'Vườn, nội khu', false, 5),
      ('view', 'pool', 'Pool', 'Bể bơi', false, 6),
      ('view', 'panoramic', 'Panoramic', 'Toàn cảnh', false, 7),
      ('view', 'other', 'Other', 'Khác', false, 8),
      ('rent_includes', 'management', 'Management', 'Phí quản lý', false, 1),
      ('rent_includes', 'electricity', 'Electricity', 'Điện', false, 2),
      ('rent_includes', 'water', 'Water', 'Nước', false, 3),
      ('rent_includes', 'internet', 'Internet', 'Internet', false, 4),
      ('rent_includes', 'none', 'None', 'Không gồm gì', false, 5),
      ('rent_includes', 'other', 'Other', 'Khác', false, 6),
      ('price_basis', 'net', NULL, 'Thu về (NET)', true, 1),
      ('price_basis', 'gom_phi', NULL, 'Đã gồm phí', true, 2),
      ('price_basis', 'chua_gom_phi', NULL, 'Chưa gồm phí', true, 3)
    ON CONFLICT (lookup_name, lookup_value) DO UPDATE SET standard_lookup_value = EXCLUDED.standard_lookup_value,
      label_vi = EXCLUDED.label_vi, is_local = EXCLUDED.is_local, sort_order = EXCLUDED.sort_order;
  END IF;
END
$seed$;
