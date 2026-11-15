-- 106_project_area_band.sql — CG10 gia-tot-cap-du-an: dải diện tích thường gặp của căn hộ theo dự án × số phòng ngủ.
-- docs/superpowers/specs/2026-11-15-gia-tot-cap-du-an-design.md §2.3 · _acceptance/gia-tot-cap-du-an/ (Mạnh duyệt 15/11).
-- Phát biểu «suy ra» riêng (ROADMAP §3 mục 50, «Có, cấp dự án»): KHÔNG ghi đè sale_offer_records.area_m2, KHÔNG dùng để chia
-- giá khi chấm hạng. Bước ghi: pipeline/xep-hang-gia.mjs chạy pipeline/sql/421_project_area_band.sql cùng giao dịch với 420
-- (xoá trọn rồi chèn). Chỉ ở máy thu: không sync cloud (cloud đi sau — giới hạn có tên của hồ sơ). App đọc khi bảng có mặt.
-- Áp lại được. Áp lên DB máy thu đi cùng chữ ký Cổng Bằng chứng theo _acceptance/gia-tot-cap-du-an/ap-may-thu.md (mục 50).
-- Lùi: DROP TABLE IF EXISTS project_area_band;

CREATE TABLE IF NOT EXISTS project_area_band (
  project_node_id  bigint      NOT NULL,                 -- asset_nodes.id của nút project gốc (view offer_project của 105)
  bedrooms         integer     NOT NULL,
  p10              numeric     NOT NULL,                 -- m², percentile_cont trên mẫu mỗi căn một phiếu
  p50              numeric     NOT NULL,
  p90              numeric     NOT NULL,
  n                integer     NOT NULL,                 -- số mẫu (căn), từ 10
  run_id           text        NOT NULL,                 -- cùng run_id với lượt chấm offer_price_rank
  computed_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_node_id, bedrooms)
);

COMMENT ON TABLE project_area_band IS
  'CG10: dải m² căn hộ theo dự án × PN (p10/p50/p90, từ 10 mẫu) — phát biểu suy ra, không ghi area_m2, không dùng chia giá; chỉ máy thu';
