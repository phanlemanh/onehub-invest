-- 088_iso_tinh.sql — DA1 danh-ba-vat-the-toan-quoc (DR1): mã tỉnh ISO cho danh bạ vật thể ở cả 34 tỉnh/thành.
-- docs/superpowers/specs/2026-11-10-danh-ba-vat-the-toan-quoc-design.md · _acceptance/danh-ba-vat-the-toan-quoc (Mạnh duyệt 10/11).
-- Số 088 do giám sát cấp (P3-183). Luật (kế hoạch 0811 §DR1): mã ISO của tỉnh sau sáp nhập 2025 = mã ISO 3166-2:VN cũ
-- của tỉnh mang tên được giữ; Huế giữ VN-26 của Thừa Thiên-Huế. Nguồn: pipeline/data/iso-3166-2-vn.json (đọc 10/11).
-- 082 khoá iso_region IN (VN-HN, VN-SG) và upi ~ VN-(HN|SG): thay bằng khoá ngoại tới iso_regions và khuôn upi mọi mã.
-- Không đổi dữ liệu toà, không đổi UPI. KHÔNG sync cloud (buildings ở lại máy thu, ADR-0016 §9). Áp lên DB máy thu là lời
-- riêng của Mạnh sau Cổng Bằng chứng (pg_dump trước). Idempotent: chạy lại không lỗi, lược đồ và dữ liệu không đổi.

-- ---- 1. Bảng tra mã tỉnh (Cục Thống kê, 2 số) → ISO ----
CREATE TABLE IF NOT EXISTS iso_regions (
  admin_code text PRIMARY KEY CHECK (admin_code ~ '^[0-9]{2}$'),
  iso_region text NOT NULL UNIQUE CHECK (iso_region ~ '^VN-[0-9A-Z]{2}$'),
  ten        text NOT NULL
);
COMMENT ON TABLE iso_regions IS 'DA1: mã tỉnh 2 số (areas.admin_code của thị trường, PX1) → mã ISO 3166-2:VN cũ của tỉnh mang tên được giữ';

INSERT INTO iso_regions (admin_code, iso_region, ten) VALUES
  ('01', 'VN-HN', 'Hà Nội'),
  ('04', 'VN-04', 'Cao Bằng'),
  ('08', 'VN-07', 'Tuyên Quang'),
  ('11', 'VN-71', 'Điện Biên'),
  ('12', 'VN-01', 'Lai Châu'),
  ('14', 'VN-05', 'Sơn La'),
  ('15', 'VN-02', 'Lào Cai'),
  ('19', 'VN-69', 'Thái Nguyên'),
  ('20', 'VN-09', 'Lạng Sơn'),
  ('22', 'VN-13', 'Quảng Ninh'),
  ('24', 'VN-56', 'Bắc Ninh'),
  ('25', 'VN-68', 'Phú Thọ'),
  ('31', 'VN-HP', 'Hải Phòng'),
  ('33', 'VN-66', 'Hưng Yên'),
  ('37', 'VN-18', 'Ninh Bình'),
  ('38', 'VN-21', 'Thanh Hóa'),
  ('40', 'VN-22', 'Nghệ An'),
  ('42', 'VN-23', 'Hà Tĩnh'),
  ('44', 'VN-25', 'Quảng Trị'),
  ('46', 'VN-26', 'Huế'),
  ('48', 'VN-DN', 'Đà Nẵng'),
  ('51', 'VN-29', 'Quảng Ngãi'),
  ('52', 'VN-30', 'Gia Lai'),
  ('56', 'VN-34', 'Khánh Hòa'),
  ('66', 'VN-33', 'Đắk Lắk'),
  ('68', 'VN-35', 'Lâm Đồng'),
  ('75', 'VN-39', 'Đồng Nai'),
  ('79', 'VN-SG', 'Hồ Chí Minh'),
  ('80', 'VN-37', 'Tây Ninh'),
  ('82', 'VN-45', 'Đồng Tháp'),
  ('86', 'VN-49', 'Vĩnh Long'),
  ('91', 'VN-44', 'An Giang'),
  ('92', 'VN-CT', 'Cần Thơ'),
  ('96', 'VN-59', 'Cà Mau')
ON CONFLICT (admin_code) DO NOTHING;

-- ---- 2. buildings: bỏ khoá hai mã, thêm khoá ngoại; upi nhận mọi mã tỉnh ----
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_iso_region_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buildings_iso_region_fkey' AND conrelid = 'buildings'::regclass) THEN
    ALTER TABLE buildings ADD CONSTRAINT buildings_iso_region_fkey FOREIGN KEY (iso_region) REFERENCES iso_regions (iso_region);
  END IF;
END $$;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_upi_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buildings_upi_khuon' AND conrelid = 'buildings'::regclass) THEN
    ALTER TABLE buildings ADD CONSTRAINT buildings_upi_khuon
      CHECK (upi ~ '^urn:onehub:upi:1:VN:VN-[0-9A-Z]{2}:bld_[0-9A-HJKMNP-TV-Z]{26}$');
  END IF;
END $$;
