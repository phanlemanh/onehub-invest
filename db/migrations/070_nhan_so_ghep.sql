-- 070_nhan_so_ghep.sql — so-ghep-s06-nhan-danh-ba: view sale_offers thêm cột tính seller_phone_inferred (số S06 chưa xác minh)
-- docs/superpowers/specs/2026-11-03-so-ghep-s06-nhan-danh-ba-design.md; khai field riêng VN ở pipeline/mappings.yaml (ADR-0011).
-- True khi tin S06 có số mà không mang dấu trực tiếp (số ghép theo tài khoản, hoặc mất dấu). Thiếu bằng chứng thì kèm nhãn.
-- Cột tính trong view: bảng sale_offer_records không đổi lược đồ, không đổi dòng. Áp TRƯỚC 068 (bộ gán chờ cột này mới ghi số ghép).
-- Migration sau muốn dựng lại view phải giữ cột này ở cuối; CREATE OR REPLACE bằng SELECT * sẽ báo lỗi, không mất cột âm thầm.

CREATE OR REPLACE VIEW sale_offers AS
SELECT offer_id, area_id, kind, price_vnd, area_m2, price_perm2, bedrooms, phuong_raw, confidence, first_seen, last_seen,
       n_reposts, post_ids, source, price_tier, district_raw, seller_name, seller_phone, seller_phone_hash, seller_ref,
       bait_gap_pct, listing_url, property_type, street_raw, block_raw, floor_raw, bathrooms, retired_at, retired_reason,
       superseded_by, originating_system_key, field_provenance, offer_status, street_number, unit_number, frontage_length,
       lot_size_dimensions, stories, latitude, longitude,
       (source = 'S06' AND seller_phone IS NOT NULL
        AND field_provenance -> 'seller_phone' ->> 'rule_id' IS DISTINCT FROM 's06-so-tren-tin') AS seller_phone_inferred
  FROM sale_offer_records
 WHERE retired_at IS NULL;
