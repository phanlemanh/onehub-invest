-- 107_project_source_baseline.sql — CG15 do-lech-s03-s06-canh-hang: mặt bằng giá S03 so S06 theo nhóm cấp dự án của CG10.
-- docs/superpowers/specs/2026-11-16-do-lech-s03-s06-canh-hang-design.md §2.1 · _acceptance/do-lech-s03-s06-canh-hang/ (Mạnh duyệt 16/11).
-- ROADMAP §3 mục 51: S03 là nguồn lõi, S06 là mặt bằng so sánh. Một dòng mỗi nhóm cấp dự án của offer_price_rank (khoá nhóm
-- nut × kind × property_type × thuoc × pn_nhom). Mẫu số là PHIẾU như CG10 (căn S06 một phiếu, tin S03 một phiếu), tách theo nguồn.
-- Bước ghi: pipeline/xep-hang-gia.mjs chạy pipeline/sql/423_project_source_baseline.sql cùng giao dịch, sau 422 (xoá trọn rồi
-- chèn). Chỉ ở máy thu: không sync cloud (cloud đi sau — Hỏi-2). App đọc khi bảng có mặt.
-- Áp lại được. Áp lên DB máy thu đi cùng chữ ký Cổng Bằng chứng theo _acceptance/do-lech-s03-s06-canh-hang/ap-may-thu.md.
-- Lùi: DROP TABLE IF EXISTS project_source_baseline;

CREATE TABLE IF NOT EXISTS project_source_baseline (
  nut           text        NOT NULL,                 -- asset_nodes.id của dự án (offer_price_rank.nut khi cap = 'du_an')
  kind          text        NOT NULL,                 -- sale | rent_lt
  property_type text        NOT NULL,
  thuoc         text        NOT NULL,                 -- gia-m2 | gia-thang-pn
  pn_nhom       integer,                              -- NULL: nhóm dự án × loại không tách PN
  n_s03         integer     NOT NULL,                 -- số phiếu (căn) S03 trong nhóm
  trung_vi_s03  numeric,                              -- NULL khi n_s03 = 0
  n_s06         integer     NOT NULL,
  trung_vi_s06  numeric,
  lech_pct      numeric(7,1),                         -- (trung_vi_s03 / trung_vi_s06 − 1) × 100; NULL khi một bên dưới 5
  trang_thai    text        NOT NULL,
  run_id        text        NOT NULL,
  computed_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_source_baseline DROP CONSTRAINT IF EXISTS project_source_baseline_trang_thai_check;
ALTER TABLE project_source_baseline ADD CONSTRAINT project_source_baseline_trang_thai_check
  CHECK (trang_thai IN ('du', 'thieu-s03', 'thieu-s06', 'thieu-hai'));

CREATE UNIQUE INDEX IF NOT EXISTS project_source_baseline_nhom_uq
  ON project_source_baseline (nut, kind, property_type, thuoc, (coalesce(pn_nhom, -1)));

COMMENT ON TABLE project_source_baseline IS
  'CG15: trung vị S03 và S06 mỗi nhóm cấp dự án (khoá nhóm của offer_price_rank), đếm theo phiếu; ghi bởi pipeline/xep-hang-gia.mjs';
