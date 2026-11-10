-- 086_lam_giau.sql — DO3 do-lam-giau: ảnh chụp giá trị làm giàu đang sống và dòng đổi theo ngày, để đếm thêm/đổi/máy rút.
-- docs/superpowers/specs/2026-11-08-do-lam-giau-design.md · _acceptance/do-lam-giau (Mạnh duyệt Cổng Phạm vi 08/11).
-- Số 086 do giám sát đợt dot0-cam-mau cấp (P2-141, sổ SO-MIGRATION). Bảng đo nội bộ như 083, không phải field RESO.
-- KHÔNG sync cloud: hai bảng không vào FILL của pipeline/sync-cloud.mjs — số gộp lên cloud qua dq_check_results (do3-*).
-- value_key là băm (số qua người đăng: seller_phone_hash; phát biểu: value_key của field_assertions), không chứa SĐT.
-- Áp lên DB máy thu là lời riêng của Mạnh, sau gộp, sao lưu trước. Idempotent: chạy lại không lỗi, lược đồ không đổi.

-- ---- 1. Giá trị sống của từng đường làm giàu ở lần chạy trước ----
CREATE TABLE IF NOT EXISTS enrichment_value_state (
  duong       text NOT NULL CHECK (duong IN ('so-qua-nguoi-dang', 'quy-uoc-nhom', 'dien-tich-suy-ra', 'danh-muc-cdt')),
  subject_key text NOT NULL,                         -- 'tin:<offer_id>' hoặc '<subject_key>|<field>' của phát biểu
  value_key   text NOT NULL,
  offer_id    text,                                  -- tin mang giá trị (để lát theo khu vực); NULL khi chưa nối được tin
  seen_on     date NOT NULL,                         -- ngày VN của lần chạy ghi dòng
  PRIMARY KEY (duong, subject_key)
);

-- ---- 2. Dòng đổi: một dòng mỗi chủ thể đổi mỗi ngày (giờ VN); chạy lại trong ngày gộp vào dòng đã có ----
CREATE TABLE IF NOT EXISTS enrichment_value_change (
  snap_date   date NOT NULL,
  duong       text NOT NULL CHECK (duong IN ('so-qua-nguoi-dang', 'quy-uoc-nhom', 'dien-tich-suy-ra', 'danh-muc-cdt')),
  subject_key text NOT NULL,
  from_value  text,                                  -- giá trị đầu ngày (NULL = chưa có)
  to_value    text,                                  -- giá trị mới nhất trong ngày (NULL = đã rời đường)
  huong       text NOT NULL CHECK (huong IN ('them', 'doi', 'may_rut')),
  offer_id    text,
  PRIMARY KEY (snap_date, duong, subject_key),
  CHECK (from_value IS DISTINCT FROM to_value),
  CHECK ((huong = 'them') = (from_value IS NULL)),
  CHECK ((huong = 'may_rut') = (to_value IS NULL))
);

CREATE INDEX IF NOT EXISTS enrichment_value_change_duong_idx ON enrichment_value_change (duong, snap_date);
