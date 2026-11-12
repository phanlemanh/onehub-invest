-- 093_stg_s07.sql — DAZ3 thu-danh-muc-s07: ba bảng stg cho danh mục dự án S07 (nguồn `s07-danh-muc`, DATA-CONTRACT v9).
-- Nguồn: docs/superpowers/specs/2026-11-11-thu-danh-muc-s07-design.md, collector/docs/DATA-CONTRACT.md mục S07,
-- ROADMAP §3 mục 38, 39, 44. Danh sách cột liên làn duyệt 11/11. Số do sổ migration cấp cho hàng DAZ3.
-- KHÔNG sync cloud: stg S07 chỉ ở máy thu (bảng stg thô; cột mô tả có thể còn tên nguồn viết bằng chữ).
-- Bên ghi: pipeline/import-s07-danh-muc.mjs. Khoá (snapshot_id, pj_id): nạp lại cùng snapshot không nhân dòng, một dự án
-- thu lại ở snapshot sau là dòng mới; chọn bản mới nhất theo captured_at là việc của bước đọc.
-- Áp lên DB máy thu cần lời Mạnh (bước sau gộp). Chạy lại không đổi gì.

-- 1) Thẻ dự án trên trang danh sách (10 thẻ chính mỗi trang; khối «nổi bật» lặp ở mọi trang không nạp).
CREATE TABLE IF NOT EXISTS stg_s07_project_card (
  snapshot_id               text        NOT NULL,
  pj_id                     integer     NOT NULL,  -- mã dự án của nguồn (đuôi -pj<id> của đường dẫn)
  captured_at               timestamptz NOT NULL,  -- giờ thu (fetchedAt của item), không phải giờ nạp
  list_page                 integer,               -- trang danh sách lúc thu (danh sách xếp «mới nhất», trang không ổn định)
  list_position             smallint,              -- vị trí trong trang, từ 1
  path                      text        NOT NULL,  -- đường dẫn tương đối, không host
  project_type_slug         text,                  -- một trong 12 loại hình của nguồn, suy từ path; loại lạ → NULL
  area_slug                 text,                  -- phần khu vực của path (quận cũ, kèm mã tỉnh khi có)
  project_name              text,
  development_status_raw    text,
  unparsed_address          text,                  -- nguyên văn
  land_area_raw             text,                  -- nguyên văn, kèm đơn vị
  number_of_units_total     integer,
  number_of_buildings_total integer,
  builder_name_raw          text,
  summary_raw               text,
  image_paths               jsonb,                 -- mảng chuỗi s07://<máy con>/<đường dẫn>
  PRIMARY KEY (snapshot_id, pj_id)
);
CREATE INDEX IF NOT EXISTS stg_s07_project_card_pj_captured_idx ON stg_s07_project_card (pj_id, captured_at DESC);
COMMENT ON TABLE stg_s07_project_card IS 'stg S07 — chỉ máy thu, không sync cloud. Thẻ dự án trên trang danh sách của nguồn S07.';

-- 2) Trang một dự án.
CREATE TABLE IF NOT EXISTS stg_s07_project (
  snapshot_id                   text        NOT NULL,
  pj_id                         integer     NOT NULL,
  captured_at                   timestamptz NOT NULL,
  path                          text        NOT NULL,
  final_path                    text,                  -- chỉ khi bị chuyển hướng sang đường dẫn khác
  project_type_slug             text,
  area_slug                     text,
  project_name                  text,
  unparsed_address              text,
  breadcrumb                    jsonb,                 -- [{position, name, path}] — tỉnh và quận CŨ
  latitude                      double precision,      -- toạ độ nguồn công bố; 0,0 → NULL
  longitude                     double precision,
  development_status_raw        text,
  status_note_raw               text,                  -- mốc đi kèm nhãn trạng thái
  attributes                    jsonb,                 -- mảng cặp {label, value} theo thứ tự nguồn
  land_area_raw                 text,
  number_of_units_raw           text,
  number_of_buildings_total_raw text,
  builder_name_raw              text,
  builder_ref                   integer,               -- mã chủ đầu tư của nguồn (đuôi -ep<id>)
  builder_path                  text,
  legal_raw                     text,
  scale_raw                     text,
  price_range_raw               text,
  amenities                     jsonb,                 -- mảng chữ
  description_html              text,                  -- khối mô tả, đã bỏ tên miền nguồn
  faq                           jsonb,                 -- [{q, a}]
  child_pj_ids                  integer[],             -- theo meta.children của raw
  desc_link_pj_ids              integer[],             -- mã dự án được nhắc trong mô tả: ứng viên cha–con
  related_pj_ids                integer[],             -- khối «dự án liên quan», không phải cha–con
  image_paths                   jsonb,
  og_image_path                 text,
  http_status                   integer,
  PRIMARY KEY (snapshot_id, pj_id)
);
CREATE INDEX IF NOT EXISTS stg_s07_project_pj_captured_idx ON stg_s07_project (pj_id, captured_at DESC);
COMMENT ON TABLE stg_s07_project IS 'stg S07 — chỉ máy thu, không sync cloud. Trang một dự án của nguồn S07.';
COMMENT ON COLUMN stg_s07_project.attributes IS 'mảng cặp {label, value} theo thứ tự nguồn';
COMMENT ON COLUMN stg_s07_project.price_range_raw IS 'chỉ nội bộ, ROADMAP §3 mục 27';

-- 3) Đường dẫn dự án từ sitemap theo loại hình (đối chiếu đủ/thiếu với danh sách).
CREATE TABLE IF NOT EXISTS stg_s07_sitemap_url (
  snapshot_id       text        NOT NULL,
  pj_id             integer     NOT NULL,
  captured_at       timestamptz NOT NULL,
  path              text        NOT NULL,
  project_type_slug text,
  area_slug         text,
  PRIMARY KEY (snapshot_id, pj_id)
);
CREATE INDEX IF NOT EXISTS stg_s07_sitemap_url_pj_captured_idx ON stg_s07_sitemap_url (pj_id, captured_at DESC);
COMMENT ON TABLE stg_s07_sitemap_url IS 'stg S07 — chỉ máy thu, không sync cloud. Đường dẫn dự án trong sitemap của nguồn S07.';
