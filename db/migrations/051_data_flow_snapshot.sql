-- 051_data_flow_snapshot.sql — DF1 `dong-chay-len-cloud`: số «Dòng chảy dữ liệu» tính sẵn ở máy thu (luật 10).
-- Nguồn: design docs/superpowers/specs/2026-10-27-dong-chay-len-cloud-design.md · hồ sơ _acceptance/dong-chay-len-cloud
-- (Mạnh duyệt 27/10) · ADR-0014. Số 051 do phiên liên làn cấp (sổ SO-MIGRATION). Bảng số tổng hợp, ngoài RESO.
--
-- Một dòng mỗi cửa sổ (7d · 30d · all); `facts` là phần tổng hợp đã dựng của DataFlow (sources · days · groups ·
-- shortStay · mix · enrichPending). pipeline/sql/600_data_flow.sql làm tươi mỗi lượt cloud-sync; trang máy thu đọc
-- bảng, push-ops-facts chở `facts` lên cloud thành khối `dataFlow`.
--
-- KHÔNG sync cloud: bảng chỉ ở máy thu (không vào FILL của pipeline/sync-cloud.mjs, leakGate báo khi cloud có dòng).
-- Áp lên DB local :5433 dùng chung CHỈ sau khi gộp (lời dặn của giám sát khi cấp số).
-- Tên không mang tiền tố lược đồ: phép đo chạy tệp này trên lược đồ tạm mà không chạm bảng thật.

CREATE TABLE IF NOT EXISTS data_flow_snapshot (
  time_window text PRIMARY KEY CHECK (time_window IN ('7d', '30d', 'all')),
  computed_at timestamptz NOT NULL,
  facts jsonb NOT NULL
);

COMMENT ON TABLE data_flow_snapshot IS
  'DF1: số Dòng chảy dữ liệu tính sẵn theo cửa sổ (600_data_flow.sql). Chỉ ở máy thu — không sync cloud.';
