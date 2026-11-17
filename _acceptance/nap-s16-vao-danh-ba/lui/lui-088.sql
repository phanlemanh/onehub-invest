-- Lùi 088 (bước 0): trả hai ràng buộc hai mã của 082, bỏ khoá ngoại và bảng tra. Chỉ chạy được khi không còn toà mã khác VN-HN/VN-SG
-- — tức trước 1e, hoặc sau go-khoa.sh đã gỡ toà của lượt dựng.
BEGIN;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_iso_region_fkey;
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_upi_khuon;
ALTER TABLE buildings ADD CONSTRAINT buildings_iso_region_check CHECK (iso_region = ANY (ARRAY['VN-HN'::text, 'VN-SG'::text]));
ALTER TABLE buildings ADD CONSTRAINT buildings_upi_check CHECK (upi ~ '^urn:onehub:upi:1:VN:VN-(HN|SG):bld_[0-9A-HJKMNP-TV-Z]{26}$'::text);
DROP TABLE IF EXISTS iso_regions;
COMMIT;
