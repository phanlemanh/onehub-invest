-- 072_labels_nhom.sql — GC0 gan-nhan-theo-nhom-s03: nhãn đánh giá theo từng nhóm S03.
-- Số do LL cấp (sổ SO-MIGRATION). Thêm tám trường vào khuôn một dòng một trường của PL7, căn cứ từng ô, lý do theo bài,
-- trường hợp ghi sau khi xem máy đọc. KHÔNG sync cloud: labeler_id gắn với hồ sơ người dùng app, tầng A (054_labels.sql).
-- Dòng đời trước giữ nguyên: basis, stratum để NULL. Áp lên DB thật cần Mạnh duyệt, kèm pg_dump.

ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_field_check;
ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_field_check CHECK (field IN (
  'listing_intent', 'kind', 'property_type', 'project', 'building', 'price_min_vnd', 'price_max_vnd', 'area_m2', 'bedrooms',
  'subzone', 'stack', 'floor', 'bathrooms', 'bedrooms_plus', 'multi_unit', 'seller_name', 'seller_phone'));

-- Căn cứ của một ô: đọc từ chữ bài, ngữ cảnh nhóm hay kiến thức nghề. NULL ở ô «không suy ra được» và dòng đời trước.
ALTER TABLE eval_labels ADD COLUMN IF NOT EXISTS basis text;
ALTER TABLE eval_labels DROP CONSTRAINT IF EXISTS eval_labels_basis_check;
ALTER TABLE eval_labels ADD CONSTRAINT eval_labels_basis_check
  CHECK (basis IS NULL OR basis IN ('chu_bai', 'ngu_canh_nhom', 'kien_thuc_nghe'));

-- Tầng của mẫu: unit_code của nhóm trong sổ collection_units. NULL ở lát đời trước.
ALTER TABLE eval_label_items ADD COLUMN IF NOT EXISTS stratum text;
CREATE INDEX IF NOT EXISTS eval_label_items_stratum_idx ON eval_label_items (lat, stratum);

-- Lý do của một người trên một bài: viết trước khi xem máy đọc. Không làm trường của eval_labels để khỏi lọt vào đồng thuận.
CREATE TABLE IF NOT EXISTS eval_label_reasons (
  item_id    bigint NOT NULL REFERENCES eval_label_items(item_id) ON DELETE CASCADE,
  labeler_id text NOT NULL,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, labeler_id)
);

-- Trường hợp ghi ở lượt hai: chỉ thêm, không đụng nhãn đã lưu. Một bài có thể có nhiều dòng.
CREATE TABLE IF NOT EXISTS eval_label_cases (
  id            bigserial PRIMARY KEY,
  item_id       bigint NOT NULL REFERENCES eval_label_items(item_id) ON DELETE CASCADE,
  labeler_id    text NOT NULL,
  case_kind     text,
  note          text,
  the_nhom_dung text CHECK (the_nhom_dung IS NULL OR the_nhom_dung IN ('dung', 'sai', 'chua')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eval_label_cases_item_idx ON eval_label_cases (item_id);

-- Giữ đúng bốn cột của 054, thêm tám trường vào danh sách. Cặp, khớp tính như cũ: basis không tham gia so.
CREATE OR REPLACE VIEW eval_label_agreement AS
WITH truong(field) AS (
  VALUES ('listing_intent'), ('kind'), ('property_type'), ('project'), ('building'),
         ('price_min_vnd'), ('price_max_vnd'), ('area_m2'), ('bedrooms'),
         ('subzone'), ('stack'), ('floor'), ('bathrooms'), ('bedrooms_plus'), ('multi_unit'), ('seller_name'), ('seller_phone')
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
