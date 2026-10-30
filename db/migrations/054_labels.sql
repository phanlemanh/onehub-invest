-- 054_labels.sql — PL7 `man-gan-nhan-mu` (C1.3): tập nhãn đánh giá do người gắn mù + view đồng thuận.
-- Nguồn: design docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md · hồ sơ _acceptance/man-gan-nhan-mu
-- (Mạnh duyệt 30/10) · review docs/architecture/classification-enrich-review.md F3, F5, §3.5. Số 054 do phiên liên làn
-- cấp (sổ SO-MIGRATION). Bảng vận hành đo chất lượng phân loại, ngoài RESO.
--
-- `eval_label_items`: tin của một lát được chọn để gắn (pipeline/label-sample.mjs) — tin S03 ở stg, khoá theo nội dung
-- đã chuẩn hoá (`text_hash`) để không gắn hai lần cùng chữ; `double_label` = thuộc 20% hai người gắn (F5); `split` dev/test
-- tách đôi (§3.5). `eval_labels`: một dòng một (tin × người gắn × trường), giá trị đã chuẩn hoá ở route ghi; `not_stated`
-- = tin không nêu. `eval_label_agreement`: theo lát × trường, số cặp đủ hai người, số cặp khớp, tỉ lệ khớp (NULL khi chưa
-- có cặp — không phải 0).
--
-- KHÔNG sync cloud (PII tầng A — `labeler_id` gắn với hồ sơ người dùng app): hai bảng chỉ ở máy thu, không vào FILL của
-- pipeline/sync-cloud.mjs, không vào push-ops-facts. Áp lên DB local :5433 dùng chung CHỈ sau khi gộp.

CREATE TABLE IF NOT EXISTS eval_label_items (
  item_id      bigserial PRIMARY KEY,
  lat          text NOT NULL,                       -- lát, vd 'ocp1'
  source_code  text NOT NULL,                       -- mã nguồn S0x (SPL), vd 'S03'
  ref_id       text NOT NULL,                       -- post_id ở stg_zalo_posts
  text_hash    text NOT NULL,                       -- sha256 nội dung đã chuẩn hoá
  split        text NOT NULL CHECK (split IN ('dev', 'test')),
  double_label boolean NOT NULL DEFAULT false,
  seed         text NOT NULL,
  sampled_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lat, text_hash),
  UNIQUE (lat, ref_id)
);

CREATE TABLE IF NOT EXISTS eval_labels (
  id          bigserial PRIMARY KEY,
  item_id     bigint NOT NULL REFERENCES eval_label_items(item_id) ON DELETE CASCADE,
  labeler_id  text NOT NULL,                        -- users.id (không FK: users có thể dọn, nhãn giữ)
  field       text NOT NULL CHECK (field IN ('listing_intent', 'kind', 'property_type', 'project', 'building',
                                             'price_min_vnd', 'price_max_vnd', 'area_m2', 'bedrooms')),
  value       text,
  not_stated  boolean NOT NULL DEFAULT false,
  labeled_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, labeler_id, field),
  CHECK (NOT not_stated OR value IS NULL),
  CHECK (not_stated OR value IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS eval_labels_labeler_idx ON eval_labels (labeler_id, labeled_at);

-- Cặp = tin double_label có ĐÚNG hai người đã gắn trường đó. Khớp = cùng «tin không nêu», hoặc cùng giá trị đã chuẩn hoá.
CREATE OR REPLACE VIEW eval_label_agreement AS
WITH truong(field) AS (
  VALUES ('listing_intent'), ('kind'), ('property_type'), ('project'), ('building'),
         ('price_min_vnd'), ('price_max_vnd'), ('area_m2'), ('bedrooms')
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
