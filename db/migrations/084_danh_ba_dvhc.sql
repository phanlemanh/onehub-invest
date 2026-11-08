-- 084_danh_ba_dvhc.sql — PX1 danh-ba-phuong-xa-toan-quoc: mã đơn vị hành chính của Cục Thống kê trên areas + bảng
-- bí danh xã cũ (trước sắp xếp 2025) trỏ sang xã mới.
-- Nguồn: docs/superpowers/specs/2026-11-08-danh-ba-phuong-xa-toan-quoc-design.md §2.2; dữ liệu pipeline/data/dvhc.
-- areas không phải resource RESO; DD 2.1 không có đơn vị hành chính cấp xã → cột riêng, không field tin, không enum.
-- Cloud: sync-cloud chỉ gửi cột/bảng có ở cả hai phía — admin_code và area_aliases ở lại máy tới khi Mạnh áp 084 lên
-- Supabase. Không chứa dữ liệu tầng A (dữ liệu công).

-- Mã 5 số của xã (cấp xã) hoặc 2 số của tỉnh (cấp thị trường); NULL cho khu vực không thuộc danh bạ.
ALTER TABLE areas ADD COLUMN IF NOT EXISTS admin_code text;
CREATE UNIQUE INDEX IF NOT EXISTS areas_admin_code_uq ON areas (admin_code) WHERE admin_code IS NOT NULL;

-- Một dòng mỗi xã cũ. targets = mã xã mới; split = xã cũ bị chia cho nhiều xã mới (tra ra «cần chọn xã»).
-- Không FK tới areas: tra theo mã, id của areas đổi được (064).
CREATE TABLE IF NOT EXISTS area_aliases (
  old_code text PRIMARY KEY,
  name text NOT NULL,
  kind text,
  old_district text NOT NULL,
  old_district_code text NOT NULL,
  old_province_code text NOT NULL,
  province_code text NOT NULL,
  targets text[] NOT NULL CHECK (cardinality(targets) >= 1),
  split boolean NOT NULL,
  source_sha text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS area_aliases_province_name_idx ON area_aliases (province_code, name);

COMMENT ON COLUMN areas.admin_code IS 'PX1: mã đơn vị hành chính Cục Thống kê (QĐ 19/2025) — 5 số cấp xã, 2 số cấp tỉnh';
COMMENT ON TABLE area_aliases IS 'PX1: xã cũ trước sắp xếp 2025 → mã xã mới (bảng chuyển đổi Cục Thống kê); split = cần chọn xã';
